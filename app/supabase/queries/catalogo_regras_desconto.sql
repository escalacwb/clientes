create table if not exists public.catalogo_regras_desconto (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text check (tipo in ('produto', 'servico')),
  grupo text,
  subgrupo text,
  marca text,
  codigo text,
  desconto_maximo numeric(8, 2) not null default 0,
  requer_aprovacao_acima_de numeric(8, 2) not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists catalogo_regras_desconto_lookup_idx
on public.catalogo_regras_desconto(tipo, codigo, marca, grupo, subgrupo)
where ativo;

alter table public.catalogo_regras_desconto enable row level security;

drop policy if exists catalogo_regras_desconto_read_authenticated on public.catalogo_regras_desconto;
create policy catalogo_regras_desconto_read_authenticated
on public.catalogo_regras_desconto for select
using (auth.uid() is not null);

drop policy if exists admin_manage_catalogo_regras_desconto on public.catalogo_regras_desconto;
create policy admin_manage_catalogo_regras_desconto
on public.catalogo_regras_desconto for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into public.catalogo_regras_desconto (nome, tipo, grupo, desconto_maximo, requer_aprovacao_acima_de)
values
  ('Produtos - regra padrao', 'produto', null, 5, 5),
  ('Servicos - regra padrao', 'servico', null, 10, 10)
on conflict do nothing;
