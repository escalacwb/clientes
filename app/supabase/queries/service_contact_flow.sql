alter table public.tarefas
  add column if not exists contexto jsonb not null default '{}'::jsonb;

alter table public.interacoes
  add column if not exists tarefa_id uuid,
  add column if not exists motivo_queda text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'interacoes_tarefa_id_fkey'
      and conrelid = 'public.interacoes'::regclass
  ) then
    alter table public.interacoes
      add constraint interacoes_tarefa_id_fkey foreign key (tarefa_id) references public.tarefas(id);
  end if;
end;
$$;

create index if not exists interacoes_tarefa_idx on public.interacoes(tarefa_id);

create index if not exists tarefas_service_origem_idx
on public.tarefas(cliente_id, origem, criado_em desc)
where origem in ('oportunidade:service_risco_visitas', 'oportunidade:service_mix_caiu', 'gestao:recuperacao_service');

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

create or replace view public.vw_service_contatos_efetividade
with (security_invoker = true) as
with base as (
  select
    t.id as tarefa_id,
    t.cliente_id,
    c.nome as cliente_nome,
    coalesce(t.vendedor_id, c.vendedor_id) as vendedor_id,
    coalesce(u.nome, 'Sem vendedor') as vendedor_nome,
    t.origem,
    t.titulo,
    t.contexto,
    t.status as tarefa_status,
    t.criado_em,
    t.concluida_em,
    i.id as interacao_id,
    i.data_interacao,
    i.resultado,
    i.motivo_queda,
    i.proxima_acao,
    i.data_proxima_acao,
    nullif(t.contexto->>'janelaDias', '')::integer as janela_dias,
    nullif(t.contexto->>'visitasMediana', '')::numeric as visitas_mediana,
    nullif(t.contexto->>'visitasRecentes', '')::numeric as visitas_recentes_no_alerta,
    nullif(t.contexto->>'diasSemVisita', '')::integer as dias_sem_visita_no_alerta
  from public.tarefas t
  join public.clientes c on c.id = t.cliente_id
  left join public.users u on u.id = coalesce(t.vendedor_id, c.vendedor_id)
  left join public.interacoes i on i.tarefa_id = t.id
  where t.origem in ('oportunidade:service_risco_visitas', 'oportunidade:service_mix_caiu', 'gestao:recuperacao_service')
),
retorno as (
  select
    b.tarefa_id,
    min(om.data_movimento) as primeira_visita_pos_contato,
    count(distinct coalesce(nullif(om.pedido, ''), nullif(om.nota, ''), om.id::text)) filter (
      where om.data_movimento <= coalesce(b.data_interacao, b.concluida_em, b.criado_em)::date + interval '30 days'
    )::integer as visitas_30d,
    count(distinct coalesce(nullif(om.pedido, ''), nullif(om.nota, ''), om.id::text)) filter (
      where om.data_movimento <= coalesce(b.data_interacao, b.concluida_em, b.criado_em)::date + interval '60 days'
    )::integer as visitas_60d,
    count(distinct nullif(upper(regexp_replace(coalesce(om.placa_extraida, ''), '[^A-Z0-9]', '', 'g')), '')) filter (
      where om.data_movimento <= coalesce(b.data_interacao, b.concluida_em, b.criado_em)::date + interval '60 days'
    )::integer as placas_60d,
    coalesce(sum(om.total_pedido) filter (
      where om.data_movimento <= coalesce(b.data_interacao, b.concluida_em, b.criado_em)::date + interval '60 days'
    ), 0)::numeric(14, 2) as valor_service_60d
  from base b
  left join public.ordens_movimento om
    on om.cliente_id = b.cliente_id
   and om.tipo = 'servico'
   and om.data_movimento > coalesce(b.data_interacao, b.concluida_em, b.criado_em)::date
   and om.data_movimento <= coalesce(b.data_interacao, b.concluida_em, b.criado_em)::date + interval '60 days'
  group by b.tarefa_id
)
select
  b.tarefa_id,
  b.cliente_id,
  b.cliente_nome,
  b.vendedor_id,
  b.vendedor_nome,
  b.origem,
  b.titulo,
  b.tarefa_status,
  b.criado_em,
  b.concluida_em,
  b.interacao_id,
  b.data_interacao,
  b.resultado,
  b.motivo_queda,
  b.proxima_acao,
  b.data_proxima_acao,
  b.contexto,
  b.janela_dias,
  b.visitas_mediana,
  b.visitas_recentes_no_alerta,
  b.dias_sem_visita_no_alerta,
  r.primeira_visita_pos_contato,
  coalesce(r.visitas_30d, 0) as visitas_30d,
  coalesce(r.visitas_60d, 0) as visitas_60d,
  coalesce(r.placas_60d, 0) as placas_60d,
  coalesce(r.valor_service_60d, 0)::numeric(14, 2) as valor_service_60d,
  case
    when b.data_interacao is null then 'sem_contato_registrado'
    when coalesce(r.visitas_30d, 0) > 0 then 'voltou_30d'
    when coalesce(r.visitas_60d, 0) > 0 then 'voltou_60d'
    else 'sem_retorno_60d'
  end as status_retorno,
  case
    when b.visitas_mediana is null then null
    when coalesce(r.visitas_60d, 0) >= greatest(1, ceil(b.visitas_mediana * 0.70)) then true
    else false
  end as recuperou_padrao
from base b
left join retorno r on r.tarefa_id = b.tarefa_id;

grant select on public.vw_service_contatos_efetividade to authenticated, service_role;
