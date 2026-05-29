alter table public.orcamentos
  add column if not exists enviado_por uuid references public.users(id),
  add column if not exists enviado_em timestamptz,
  add column if not exists proximo_followup_em date,
  add column if not exists prazo_entrega text,
  add column if not exists prazo_execucao text;

create table if not exists public.orcamento_aprovacoes (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  acao text not null check (acao in ('solicitada', 'aprovada', 'rejeitada', 'enviada')),
  motivo text,
  usuario_id uuid references public.users(id),
  raw_data jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists orcamento_aprovacoes_orcamento_idx
  on public.orcamento_aprovacoes(orcamento_id, criado_em desc);

alter table public.orcamento_aprovacoes enable row level security;

drop policy if exists orcamento_aprovacoes_read_own_or_admin on public.orcamento_aprovacoes;
create policy orcamento_aprovacoes_read_own_or_admin
on public.orcamento_aprovacoes for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_aprovacoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists orcamento_aprovacoes_write_own_or_admin on public.orcamento_aprovacoes;
create policy orcamento_aprovacoes_write_own_or_admin
on public.orcamento_aprovacoes for all
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_aprovacoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
)
with check (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_aprovacoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);
