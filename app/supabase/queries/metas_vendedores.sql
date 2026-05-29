create table if not exists public.metas_vendedores (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.users(id),
  mes_referencia date not null,
  meta_receita numeric(14, 2) not null default 0,
  meta_contatos integer not null default 0,
  meta_orcamentos integer not null default 0,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (vendedor_id, mes_referencia)
);

create index if not exists metas_vendedores_mes_idx
  on public.metas_vendedores(mes_referencia, vendedor_id);

drop trigger if exists metas_vendedores_set_atualizado_em on public.metas_vendedores;
create trigger metas_vendedores_set_atualizado_em
before update on public.metas_vendedores
for each row execute function public.set_atualizado_em();

alter table public.metas_vendedores enable row level security;

drop policy if exists metas_vendedores_read_admin on public.metas_vendedores;
create policy metas_vendedores_read_admin
on public.metas_vendedores for select
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

drop policy if exists metas_vendedores_write_admin on public.metas_vendedores;
create policy metas_vendedores_write_admin
on public.metas_vendedores for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
