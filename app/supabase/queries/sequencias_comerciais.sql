create table if not exists public.sequencias_comerciais (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'arquivada')),
  criada_por uuid references public.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.sequencia_etapas (
  id uuid primary key default gen_random_uuid(),
  sequencia_id uuid not null references public.sequencias_comerciais(id) on delete cascade,
  ordem integer not null,
  dias_apos_inicio integer not null default 0,
  titulo text not null,
  mensagem text not null,
  cria_tarefa boolean not null default true,
  unique (sequencia_id, ordem)
);

create table if not exists public.sequencia_execucoes (
  id uuid primary key default gen_random_uuid(),
  sequencia_id uuid not null references public.sequencias_comerciais(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  vendedor_id uuid references public.users(id),
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'concluida', 'cancelada')),
  etapa_atual integer not null default 1,
  proxima_acao_em date not null default current_date,
  motivo_encerramento text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  encerrada_em timestamptz,
  unique (sequencia_id, cliente_id)
);

create index if not exists sequencia_execucoes_vendedor_idx on public.sequencia_execucoes(vendedor_id, status, proxima_acao_em);
create index if not exists sequencia_execucoes_cliente_idx on public.sequencia_execucoes(cliente_id, status);

drop trigger if exists sequencias_comerciais_set_atualizado_em on public.sequencias_comerciais;
create trigger sequencias_comerciais_set_atualizado_em
before update on public.sequencias_comerciais
for each row execute function public.set_atualizado_em();

drop trigger if exists sequencia_execucoes_set_atualizado_em on public.sequencia_execucoes;
create trigger sequencia_execucoes_set_atualizado_em
before update on public.sequencia_execucoes
for each row execute function public.set_atualizado_em();

create or replace view public.vw_sequencias_execucao
with (security_invoker = true) as
select
  se.id,
  se.sequencia_id,
  sc.nome as sequencia_nome,
  se.cliente_id,
  c.nome as cliente_nome,
  c.cidade,
  c.uf,
  c.whatsapp_principal,
  se.vendedor_id,
  u.nome as vendedor_nome,
  se.status,
  se.etapa_atual,
  e.titulo as etapa_titulo,
  e.mensagem as etapa_mensagem,
  se.proxima_acao_em,
  se.motivo_encerramento,
  se.criado_em,
  se.atualizado_em,
  se.encerrada_em
from public.sequencia_execucoes se
join public.sequencias_comerciais sc on sc.id = se.sequencia_id
join public.clientes c on c.id = se.cliente_id
left join public.users u on u.id = se.vendedor_id
left join public.sequencia_etapas e on e.sequencia_id = se.sequencia_id and e.ordem = se.etapa_atual
where c.excluido_em is null;

grant select on public.vw_sequencias_execucao to anon, authenticated, service_role;

alter table public.sequencias_comerciais enable row level security;
alter table public.sequencia_etapas enable row level security;
alter table public.sequencia_execucoes enable row level security;

drop policy if exists sequencias_read_all on public.sequencias_comerciais;
create policy sequencias_read_all
on public.sequencias_comerciais for select
using (true);

drop policy if exists sequencias_admin_write on public.sequencias_comerciais;
create policy sequencias_admin_write
on public.sequencias_comerciais for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists sequencia_etapas_read_all on public.sequencia_etapas;
create policy sequencia_etapas_read_all
on public.sequencia_etapas for select
using (true);

drop policy if exists sequencia_etapas_admin_write on public.sequencia_etapas;
create policy sequencia_etapas_admin_write
on public.sequencia_etapas for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists sequencia_execucoes_read_own_or_admin on public.sequencia_execucoes;
create policy sequencia_execucoes_read_own_or_admin
on public.sequencia_execucoes for select
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = sequencia_execucoes.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists sequencia_execucoes_write_own_or_admin on public.sequencia_execucoes;
create policy sequencia_execucoes_write_own_or_admin
on public.sequencia_execucoes for all
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = sequencia_execucoes.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
)
with check (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = sequencia_execucoes.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);
