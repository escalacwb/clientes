create table if not exists public.orcamento_condicoes (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  label text not null,
  ajuste_percentual numeric(8, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  parcelas integer,
  observacao text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists orcamento_condicoes_orcamento_idx
on public.orcamento_condicoes(orcamento_id, ordem);

alter table public.orcamento_condicoes enable row level security;

drop policy if exists orcamento_condicoes_read_own_or_admin on public.orcamento_condicoes;
create policy orcamento_condicoes_read_own_or_admin
on public.orcamento_condicoes for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_condicoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists orcamento_condicoes_write_own_or_admin on public.orcamento_condicoes;
create policy orcamento_condicoes_write_own_or_admin
on public.orcamento_condicoes for all
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_condicoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
)
with check (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_condicoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);
