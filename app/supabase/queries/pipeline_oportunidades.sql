create table if not exists public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  titulo text not null,
  estagio text not null default 'novo_lead'
    check (estagio in ('novo_lead', 'contato_iniciado', 'qualificado', 'orcamento', 'negociacao', 'ganho', 'perdido')),
  origem text not null default 'manual',
  valor_estimado numeric(14, 2) not null default 0,
  probabilidade integer not null default 25 check (probabilidade between 0 and 100),
  previsao_fechamento date,
  responsavel_id uuid references public.users(id),
  campanha_id uuid references public.campanhas(id),
  orcamento_id uuid references public.orcamentos(id),
  motivo_perda text,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  encerrada_em timestamptz
);

create index if not exists oportunidades_cliente_idx on public.oportunidades(cliente_id);
create index if not exists oportunidades_responsavel_idx on public.oportunidades(responsavel_id, estagio);
create index if not exists oportunidades_estagio_idx on public.oportunidades(estagio, previsao_fechamento);
create index if not exists oportunidades_origem_idx on public.oportunidades(origem);

drop trigger if exists oportunidades_set_atualizado_em on public.oportunidades;
create trigger oportunidades_set_atualizado_em
before update on public.oportunidades
for each row execute function public.set_atualizado_em();

create or replace view public.vw_oportunidades_pipeline
with (security_invoker = true) as
select
  o.id,
  o.cliente_id,
  c.nome as cliente_nome,
  c.cidade,
  c.uf,
  o.titulo,
  o.estagio,
  o.origem,
  o.valor_estimado,
  o.probabilidade,
  round((o.valor_estimado * o.probabilidade / 100.0), 2)::numeric(14, 2) as valor_ponderado,
  o.previsao_fechamento,
  o.responsavel_id,
  u.nome as responsavel_nome,
  o.campanha_id,
  o.orcamento_id,
  o.motivo_perda,
  o.observacao,
  o.criado_em,
  o.atualizado_em,
  o.encerrada_em,
  case
    when o.estagio in ('ganho', 'perdido') then 'encerrada'
    when o.previsao_fechamento is null then 'sem_previsao'
    when o.previsao_fechamento < current_date then 'atrasada'
    when o.previsao_fechamento <= current_date + interval '7 days' then 'vence_7d'
    else 'no_prazo'
  end as status_prazo
from public.oportunidades o
join public.clientes c on c.id = o.cliente_id
left join public.users u on u.id = o.responsavel_id
where c.excluido_em is null;

grant select on public.vw_oportunidades_pipeline to anon, authenticated, service_role;

alter table public.oportunidades enable row level security;

drop policy if exists oportunidades_read_own_or_admin on public.oportunidades;
create policy oportunidades_read_own_or_admin
on public.oportunidades for select
using (
  public.current_user_is_admin()
  or responsavel_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = oportunidades.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists oportunidades_write_own_or_admin on public.oportunidades;
create policy oportunidades_write_own_or_admin
on public.oportunidades for all
using (
  public.current_user_is_admin()
  or responsavel_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = oportunidades.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
)
with check (
  public.current_user_is_admin()
  or responsavel_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = oportunidades.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);
