create table if not exists public.importacao_arquivos (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid references public.importacoes(id) on delete cascade,
  tipo text not null,
  arquivo_nome text not null,
  arquivo_hash text not null,
  obrigatorio boolean not null default false,
  total_linhas integer not null default 0,
  processado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (tipo, arquivo_hash)
);

create table if not exists public.importacao_staging_linhas (
  id uuid primary key default gen_random_uuid(),
  importacao_arquivo_id uuid not null references public.importacao_arquivos(id) on delete cascade,
  tipo text not null,
  linha integer not null,
  chave_unica text,
  dados jsonb not null,
  status text not null default 'pendente',
  erro text,
  criado_em timestamptz not null default now(),
  unique (importacao_arquivo_id, linha)
);

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  codigo_cliente_erp text,
  placa text,
  chassi text,
  descricao text,
  ultimo_km integer,
  km_atualizado_em date,
  primeiro_atendimento_em date,
  ultimo_atendimento_em date,
  total_atendimentos integer not null default 0,
  valor_total_atendimentos numeric(14, 2) not null default 0,
  origem text,
  raw_data jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint veiculos_identificador_chk check (placa is not null or chassi is not null or descricao is not null)
);

create unique index if not exists veiculos_placa_uidx
on public.veiculos(placa)
where placa is not null and placa <> '';

create unique index if not exists veiculos_chassi_uidx
on public.veiculos(chassi)
where chassi is not null and chassi <> '';

create unique index if not exists veiculos_placa_upsert_uidx
on public.veiculos(placa);

create unique index if not exists veiculos_chassi_upsert_uidx
on public.veiculos(chassi);

create index if not exists veiculos_cliente_idx on public.veiculos(cliente_id);
create index if not exists veiculos_codigo_cliente_idx on public.veiculos(codigo_cliente_erp);

alter table public.veiculos
  add column if not exists ultimo_km integer,
  add column if not exists km_atualizado_em date;

create table if not exists public.ordens_movimento (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('produto', 'servico')),
  cliente_id uuid not null references public.clientes(id),
  veiculo_id uuid references public.veiculos(id),
  codigo_cliente_erp text,
  cliente_nome_snapshot text,
  data_movimento date not null,
  nota text,
  pedido text,
  requisicao text,
  cfop text,
  condicao_pagamento text,
  vencimento date,
  vendedor_nome text,
  unidade text,
  centro text,
  total_pedido numeric(14, 2) not null default 0,
  placa_extraida text,
  km_extraido integer,
  veiculo_descricao_extraida text,
  veiculo_observacao text,
  veiculo_match text,
  origem_arquivo text,
  importacao_id uuid references public.importacoes(id),
  raw_data jsonb not null default '{}'::jsonb,
  chave_unica text not null unique,
  criado_em timestamptz not null default now()
);

create index if not exists ordens_movimento_cliente_data_idx
on public.ordens_movimento(cliente_id, data_movimento desc);

create index if not exists ordens_movimento_tipo_data_idx
on public.ordens_movimento(tipo, data_movimento desc);

alter table public.ordens_movimento
  add column if not exists placa_extraida text,
  add column if not exists km_extraido integer,
  add column if not exists veiculo_descricao_extraida text,
  add column if not exists veiculo_observacao text,
  add column if not exists veiculo_match text;

alter table public.vendas_itens
  add column if not exists ordem_id uuid references public.ordens_movimento(id),
  add column if not exists veiculo_id uuid references public.veiculos(id),
  add column if not exists lote_serie text,
  add column if not exists cfop text,
  add column if not exists total_pedido numeric(14, 2),
  add column if not exists km_extraido integer,
  add column if not exists veiculo_observacao text,
  add column if not exists raw_data jsonb not null default '{}'::jsonb;

alter table public.servicos_itens
  add column if not exists ordem_id uuid references public.ordens_movimento(id),
  add column if not exists veiculo_id uuid references public.veiculos(id),
  add column if not exists nota text,
  add column if not exists lote_serie text,
  add column if not exists cfop text,
  add column if not exists total_pedido numeric(14, 2),
  add column if not exists km_extraido integer,
  add column if not exists veiculo_observacao text,
  add column if not exists raw_data jsonb not null default '{}'::jsonb;

alter table public.clientes
  add column if not exists vendedor_codigo_erp text,
  add column if not exists vendedor_nome_erp text,
  add column if not exists canal_venda text,
  add column if not exists cadastro_erp_em date,
  add column if not exists raw_data jsonb not null default '{}'::jsonb;

create index if not exists vendas_ordem_idx on public.vendas_itens(ordem_id);
create index if not exists servicos_ordem_idx on public.servicos_itens(ordem_id);
create index if not exists vendas_veiculo_idx on public.vendas_itens(veiculo_id);
create index if not exists servicos_veiculo_idx on public.servicos_itens(veiculo_id);

create table if not exists public.catalogo_itens (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('produto', 'servico')),
  codigo text not null,
  descricao text not null,
  unidade text,
  grupo text,
  subgrupo text,
  marca text,
  ativo boolean not null default true,
  raw_data jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tipo, codigo)
);

create table if not exists public.catalogo_precos (
  id uuid primary key default gen_random_uuid(),
  catalogo_item_id uuid not null references public.catalogo_itens(id) on delete cascade,
  lista_preco_id uuid references public.listas_preco(id),
  valor numeric(14, 2) not null default 0,
  desconto_maximo numeric(8, 2),
  estoque numeric(14, 3),
  vigencia_inicio date not null default current_date,
  importacao_arquivo_id uuid references public.importacao_arquivos(id),
  raw_data jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique (catalogo_item_id, vigencia_inicio, importacao_arquivo_id)
);

create index if not exists catalogo_itens_tipo_descricao_idx on public.catalogo_itens(tipo, descricao);
create index if not exists catalogo_precos_item_idx on public.catalogo_precos(catalogo_item_id, vigencia_inicio desc);

drop view if exists public.vw_ordens_360;

create view public.vw_ordens_360 as
select
  o.*,
  c.nome as cliente_nome,
  c.cpf_cnpj,
  c.cidade,
  c.uf,
  v.placa,
  v.chassi,
  v.descricao as veiculo_descricao,
  case
    when o.tipo = 'produto' then (
      select coalesce(jsonb_agg(to_jsonb(i) order by i.produto_nome), '[]'::jsonb)
      from public.vendas_itens i
      where i.ordem_id = o.id
    )
    else (
      select coalesce(jsonb_agg(to_jsonb(i) order by i.servico_nome), '[]'::jsonb)
      from public.servicos_itens i
      where i.ordem_id = o.id
    )
  end as itens
from public.ordens_movimento o
join public.clientes c on c.id = o.cliente_id
left join public.veiculos v on v.id = o.veiculo_id;

alter table public.importacao_arquivos enable row level security;
alter table public.importacao_staging_linhas enable row level security;
alter table public.veiculos enable row level security;
alter table public.ordens_movimento enable row level security;
alter table public.catalogo_itens enable row level security;
alter table public.catalogo_precos enable row level security;

drop policy if exists admin_manage_importacao_arquivos on public.importacao_arquivos;
create policy admin_manage_importacao_arquivos
on public.importacao_arquivos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists admin_manage_importacao_staging_linhas on public.importacao_staging_linhas;
create policy admin_manage_importacao_staging_linhas
on public.importacao_staging_linhas for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists veiculos_read_own_or_admin on public.veiculos;
create policy veiculos_read_own_or_admin
on public.veiculos for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = veiculos.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists admin_manage_veiculos on public.veiculos;
create policy admin_manage_veiculos
on public.veiculos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists ordens_read_own_or_admin on public.ordens_movimento;
create policy ordens_read_own_or_admin
on public.ordens_movimento for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = ordens_movimento.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists admin_manage_ordens on public.ordens_movimento;
create policy admin_manage_ordens
on public.ordens_movimento for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists catalogo_itens_read_authenticated on public.catalogo_itens;
create policy catalogo_itens_read_authenticated
on public.catalogo_itens for select
using (auth.role() = 'authenticated');

drop policy if exists catalogo_precos_read_authenticated on public.catalogo_precos;
create policy catalogo_precos_read_authenticated
on public.catalogo_precos for select
using (auth.role() = 'authenticated');

drop policy if exists admin_manage_catalogo_itens on public.catalogo_itens;
create policy admin_manage_catalogo_itens
on public.catalogo_itens for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists admin_manage_catalogo_precos on public.catalogo_precos;
create policy admin_manage_catalogo_precos
on public.catalogo_precos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
