create table if not exists public.oportunidades_cache (
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  cliente_nome text not null,
  vendedor_id uuid references public.users(id) on delete set null,
  tipo text not null,
  motivo text not null,
  proxima_acao text not null,
  prioridade integer not null default 0,
  bloqueada boolean not null default false,
  tarefa_existente boolean not null default false,
  gerado_em timestamptz not null default now(),
  primary key (cliente_id, tipo)
);

create index if not exists oportunidades_cache_status_idx
on public.oportunidades_cache (bloqueada, tarefa_existente, prioridade desc);

create index if not exists oportunidades_cache_tipo_idx
on public.oportunidades_cache (tipo, prioridade desc);

create index if not exists oportunidades_cache_vendedor_idx
on public.oportunidades_cache (vendedor_id, prioridade desc);

create index if not exists oportunidades_cache_gerado_em_idx
on public.oportunidades_cache (gerado_em desc);

alter table public.oportunidades_cache enable row level security;

drop policy if exists oportunidades_cache_read_own_or_admin on public.oportunidades_cache;
create policy oportunidades_cache_read_own_or_admin
on public.oportunidades_cache for select
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
);

drop policy if exists admin_manage_oportunidades_cache on public.oportunidades_cache;
create policy admin_manage_oportunidades_cache
on public.oportunidades_cache for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create or replace function public.gerar_tarefas_oportunidades_contato()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem gerar tarefas automaticas de oportunidades.';
  end if;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem,
    contexto
  )
  select
    oc.cliente_id,
    coalesce(oc.vendedor_id, c.vendedor_id),
    case
      when oc.tipo in ('service_risco_visitas', 'service_mix_caiu') then 'Recuperar Service'
      else oc.proxima_acao
    end,
    concat(
      oc.motivo,
      E'\n\nGerada automaticamente pela fila de oportunidades. ',
      'Se o contato for concluido e o cliente continuar sem voltar, a mesma regra respeita 30 dias de carencia antes de criar outra tarefa.'
    ),
    current_date,
    'aberta',
    oc.prioridade,
    'oportunidade:' || oc.tipo,
    case
      when oc.tipo in ('service_risco_visitas', 'service_mix_caiu') then jsonb_strip_nulls(jsonb_build_object(
        'tipo', 'service_risco',
        'oportunidadeTipo', oc.tipo,
        'motivo', oc.motivo,
        'proximaAcao', oc.proxima_acao,
        'recorrencia', svr.recorrencia,
        'alerta', svr.alerta,
        'janelaDias', svr.janela_dias,
        'periodoBaseMeses', svr.periodo_base_meses,
        'visitasRecentes', case when svr.janela_dias = 30 then svr.visitas30 else svr.visitas60 end,
        'visitasMediana', svr.visitas_mediana,
        'visitasP25', svr.visitas_p25,
        'diasSemVisita', svr.dias_sem_visita,
        'placasRecentes', case when svr.janela_dias = 30 then svr.placas30 else svr.placas60 end,
        'placasMediana', svr.placas_mediana,
        'placasP25', svr.placas_p25,
        'alinhamentosRecentes', case when svr.janela_dias = 30 then svr.alinhamentos30 else svr.alinhamentos60 end,
        'alinhamentosMediana', svr.alinhamentos_mediana,
        'alinhamentosP25', svr.alinhamentos_p25,
        'ultimaVisita', svr.ultima_visita
      ))
      else jsonb_build_object('tipo', 'oportunidade', 'oportunidadeTipo', oc.tipo, 'motivo', oc.motivo)
    end
  from public.oportunidades_cache oc
  join public.clientes c on c.id = oc.cliente_id
  left join public.vw_service_visitas_risco svr
    on svr.cliente_id = oc.cliente_id
   and svr.tipo = oc.tipo
  where not oc.bloqueada
    and oc.tipo <> 'sem_vendedor'
    and coalesce(oc.vendedor_id, c.vendedor_id) is not null
    and not exists (
      select 1
      from public.tarefas aberta
      where aberta.cliente_id = oc.cliente_id
        and aberta.status = 'aberta'
        and aberta.origem = 'oportunidade:' || oc.tipo
    )
    and not exists (
      select 1
      from public.tarefas recente
      where recente.cliente_id = oc.cliente_id
        and recente.origem = 'oportunidade:' || oc.tipo
        and coalesce(recente.concluida_em, recente.reagendada_em, recente.criado_em) >= now() - interval '30 days'
    )
    and not exists (
      select 1
      from public.interacoes contato
      join public.tarefas tarefa_contato on tarefa_contato.id = contato.tarefa_id
      where contato.cliente_id = oc.cliente_id
        and tarefa_contato.origem = 'oportunidade:' || oc.tipo
        and contato.resultado in ('Sem interesse', 'Comprar depois', 'Nao contatar')
        and contato.data_interacao >= now() - case contato.resultado
          when 'Sem interesse' then interval '60 days'
          when 'Comprar depois' then interval '45 days'
          when 'Nao contatar' then interval '365 days'
          else interval '30 days'
        end
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.refresh_oportunidades_cache()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem atualizar oportunidades.';
  end if;

  delete from public.oportunidades_cache where true;

  insert into public.oportunidades_cache (
    cliente_id,
    cliente_nome,
    vendedor_id,
    tipo,
    motivo,
    proxima_acao,
    prioridade,
    bloqueada,
    tarefa_existente,
    gerado_em
  )
  select
    cliente_id,
    cliente_nome,
    vendedor_id,
    tipo,
    motivo,
    proxima_acao,
    prioridade,
    coalesce(bloqueada, false),
    coalesce(tarefa_existente, false),
    now()
  from public.oportunidades_clientes;

  get diagnostics inserted_count = row_count;

  perform public.gerar_tarefas_oportunidades_contato();

  update public.oportunidades_cache oc
  set tarefa_existente = true
  where exists (
    select 1
    from public.tarefas t
    where t.cliente_id = oc.cliente_id
      and t.status = 'aberta'
      and t.origem = 'oportunidade:' || oc.tipo
  );

  return inserted_count;
end;
$$;

create or replace function public.marcar_oportunidade_com_tarefa(p_cliente_id uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not (
    public.current_user_is_admin()
    or exists (
      select 1
      from public.clientes c
      where c.id = p_cliente_id
        and c.vendedor_id = public.current_app_user_id()
    )
  ) then
    raise exception 'Sem permissao para atualizar esta oportunidade.';
  end if;

  update public.oportunidades_cache
  set tarefa_existente = true,
      gerado_em = now()
  where cliente_id = p_cliente_id
    and tipo = p_tipo;
end;
$$;

drop view if exists public.vw_oportunidades_resumo_cache;

create view public.vw_oportunidades_resumo_cache
with (security_invoker = true) as
select
  o.vendedor_id,
  o.tipo,
  count(*)::integer as total,
  count(*) filter (where not o.bloqueada)::integer as ativas,
  count(*) filter (where o.bloqueada)::integer as bloqueadas,
  count(*) filter (where o.tarefa_existente)::integer as com_tarefa,
  round(avg(o.prioridade), 1)::numeric(6, 1) as prioridade_media,
  max(o.prioridade)::integer as prioridade_maxima,
  max(o.gerado_em) as gerado_em
from public.oportunidades_cache o
group by o.vendedor_id, o.tipo;

select public.refresh_oportunidades_cache();
