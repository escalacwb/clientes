create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'vendedor', 'operacao');
create type cliente_status as enum (
  'novo',
  'ativo',
  'em_acompanhamento',
  'orcamento_aberto',
  'sem_resposta',
  'reativar',
  'inativo',
  'perdido',
  'nao_contatar'
);
create type importacao_status as enum ('pendente', 'processando', 'processada', 'com_conflitos', 'erro');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  nome text not null,
  email text not null unique,
  role user_role not null default 'vendedor',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  codigo_erp text unique,
  cpf_cnpj text,
  nome text not null,
  nome_fantasia text,
  tipo_cliente text,
  cidade text,
  uf text,
  endereco text,
  bairro text,
  cep text,
  telefone_principal text,
  whatsapp_principal text,
  email text,
  responsavel_nome text,
  responsavel_cargo text,
  contato_confirmado_em timestamptz,
  vendedor_id uuid references public.users(id),
  status_comercial cliente_status not null default 'novo',
  origem text,
  origem_base text not null default 'desconhecida' check (origem_base in ('capital_truck', 'rodobens', 'desconhecida')),
  origem_detalhe text,
  lead_qualificacao_status text not null default 'novo' check (lead_qualificacao_status in ('novo', 'contatado', 'qualificado', 'virou_cliente', 'descartado', 'nao_contatar')),
  lead_qualificacao_observacao text,
  lead_qualificado_em timestamptz,
  whatsapp_opt_out_motivo text,
  whatsapp_opt_out_em timestamptz,
  whatsapp_opt_out_por uuid references public.users(id),
  primeira_compra_em date,
  ultima_compra_em date,
  ultimo_servico_em date,
  ultimo_contato_em timestamptz,
  proxima_acao_em timestamptz,
  total_comprado numeric(14, 2) not null default 0,
  total_servicos numeric(14, 2) not null default 0,
  score_oportunidade integer not null default 0,
  tags text[] not null default '{}',
  observacoes_comerciais text,
  excluido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.cliente_contatos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  nome text,
  cargo text,
  telefone text,
  whatsapp text,
  email text,
  principal boolean not null default false,
  observacao text,
  criado_em timestamptz not null default now()
);

create table public.importacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  arquivo_nome text not null,
  arquivo_url text,
  data_importacao timestamptz not null default now(),
  usuario_id uuid references public.users(id),
  total_linhas integer not null default 0,
  clientes_encontrados integer not null default 0,
  clientes_criados integer not null default 0,
  conflitos integer not null default 0,
  itens_criados integer not null default 0,
  itens_ignorados integer not null default 0,
  status importacao_status not null default 'pendente',
  criado_em timestamptz not null default now()
);

create table public.vendas_itens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  codigo_cliente_erp text,
  data_venda date not null,
  nota text,
  serie text,
  pedido text,
  produto_codigo text,
  produto_nome text not null,
  marca text,
  modelo text,
  medida text,
  quantidade numeric(12, 3) not null default 0,
  valor_unitario numeric(14, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  vendedor_nome text,
  unidade text,
  importacao_id uuid references public.importacoes(id),
  chave_unica text not null unique,
  criado_em timestamptz not null default now()
);

create table public.servicos_itens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  codigo_cliente_erp text,
  data_servico date not null,
  pedido text,
  servico_codigo text,
  servico_nome text not null,
  quantidade numeric(12, 3) not null default 0,
  valor_unitario numeric(14, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  placa text,
  observacao text,
  vendedor_nome text,
  unidade text,
  importacao_id uuid references public.importacoes(id),
  chave_unica text not null unique,
  criado_em timestamptz not null default now()
);

create table public.interacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  vendedor_id uuid references public.users(id),
  data_interacao timestamptz not null default now(),
  canal text not null,
  tipo text not null,
  resumo text not null,
  resultado text,
  proxima_acao text,
  data_proxima_acao timestamptz,
  campanha_id uuid,
  orcamento_id uuid,
  criado_em timestamptz not null default now()
);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  vendedor_id uuid references public.users(id),
  titulo text not null,
  descricao text,
  data_vencimento timestamptz not null,
  status text not null default 'aberta',
  prioridade integer not null default 0,
  origem text,
  concluida_em timestamptz,
  reagendada_em timestamptz,
  reagendamento_motivo text,
  criado_em timestamptz not null default now()
);

create table public.catalogo_itens (
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

create table public.catalogo_regras_desconto (
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

create table public.catalogo_midias (
  id uuid primary key default gen_random_uuid(),
  catalogo_item_id uuid not null references public.catalogo_itens(id) on delete cascade,
  titulo text,
  imagem_url text not null,
  link_url text,
  ativo boolean not null default true,
  prioridade integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (catalogo_item_id)
);

create table public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  vendedor_id uuid references public.users(id),
  data_orcamento date not null default current_date,
  status text not null default 'aberto',
  valor_total numeric(14, 2) not null default 0,
  validade date,
  previsao_fechamento date,
  forma_pagamento text,
  motivo_perda text,
  aprovacao_motivo text,
  aprovado_por uuid references public.users(id),
  aprovado_em timestamptz,
  enviado_por uuid references public.users(id),
  enviado_em timestamptz,
  pedido_confirmado_por uuid references public.users(id),
  pedido_confirmado_em timestamptz,
  pedido_referencia text,
  pedido_observacao text,
  proximo_followup_em date,
  prazo_entrega text,
  prazo_execucao text,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id),
  catalogo_item_id uuid references public.catalogo_itens(id),
  codigo text,
  descricao text not null,
  tipo text not null default 'produto',
  apresentacao text not null default 'normal',
  quantidade numeric(12, 3) not null default 1,
  valor_unitario numeric(14, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  desconto_percentual numeric(8, 2),
  observacao text
);

create table public.orcamento_versoes (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  numero integer not null,
  status text not null,
  valor_total numeric(14, 2) not null default 0,
  validade date,
  forma_pagamento text,
  observacao text,
  mensagem text,
  origem text,
  itens jsonb not null default '[]'::jsonb,
  criado_por uuid references public.users(id),
  criado_em timestamptz not null default now(),
  unique (orcamento_id, numero)
);

create table public.orcamento_condicoes (
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

create table public.orcamento_aprovacoes (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  acao text not null check (acao in ('solicitada', 'aprovada', 'rejeitada', 'enviada')),
  motivo text,
  usuario_id uuid references public.users(id),
  raw_data jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table public.metas_vendedores (
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

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  descricao text not null,
  marca text,
  modelo text,
  medida text,
  categoria text,
  origem text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.produto_aliases (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id),
  alias text not null,
  origem text,
  criado_em timestamptz not null default now(),
  unique (produto_id, alias)
);

create table public.listas_preco (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  vigencia_inicio date,
  vigencia_fim date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.catalogo_precos (
  id uuid primary key default gen_random_uuid(),
  catalogo_item_id uuid not null references public.catalogo_itens(id) on delete cascade,
  lista_preco_id uuid references public.listas_preco(id),
  valor numeric(14, 2) not null default 0,
  desconto_maximo numeric(8, 2),
  estoque numeric(14, 3),
  vigencia_inicio date not null default current_date,
  importacao_arquivo_id uuid,
  raw_data jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique (catalogo_item_id, vigencia_inicio, importacao_arquivo_id)
);

create table public.produto_precos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id),
  lista_preco_id uuid not null references public.listas_preco(id),
  valor numeric(14, 2) not null,
  desconto_maximo numeric(8, 2),
  moeda text not null default 'BRL',
  vigencia_inicio date,
  vigencia_fim date,
  criado_em timestamptz not null default now(),
  unique (produto_id, lista_preco_id, vigencia_inicio)
);

create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  objetivo text,
  custo_estimado numeric(14, 2) not null default 0,
  meta_receita numeric(14, 2) not null default 0,
  mensagem_modelo text not null,
  filtro_usado jsonb not null default '{}'::jsonb,
  criada_por uuid references public.users(id),
  criada_em timestamptz not null default now()
);

create table public.campanha_envios (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id),
  cliente_id uuid not null references public.clientes(id),
  vendedor_id uuid references public.users(id),
  telefone text,
  mensagem_final text,
  status text not null default 'pendente',
  data_abertura_whatsapp timestamptz,
  data_marcado_enviado timestamptz,
  resposta_cliente text,
  virou_orcamento boolean not null default false,
  virou_venda boolean not null default false,
  orcamento_id uuid references public.orcamentos(id),
  receita_atribuida numeric(14, 2) not null default 0,
  criado_em timestamptz not null default now(),
  unique (campanha_id, cliente_id)
);

create view public.vw_campanhas_resumo
with (security_invoker = true) as
select
  c.id as campanha_id,
  c.nome,
  c.criada_em,
  c.filtro_usado,
  c.objetivo,
  c.custo_estimado,
  c.meta_receita,
  count(ce.id)::integer as total,
  count(*) filter (where ce.status = 'pendente')::integer as pendentes,
  count(*) filter (where ce.status = 'enviado')::integer as enviados,
  count(*) filter (where ce.status = 'respondeu')::integer as responderam,
  count(*) filter (where ce.status = 'nao_respondeu')::integer as sem_resposta,
  count(*) filter (where ce.status = 'virou_orcamento' or ce.virou_orcamento)::integer as viraram_orcamento,
  count(*) filter (where ce.virou_venda)::integer as viraram_venda,
  count(*) filter (where ce.status = 'perdido')::integer as perdidos,
  count(*) filter (where ce.status = 'nao_contatar')::integer as nao_contatar,
  coalesce(sum(ce.receita_atribuida), 0)::numeric(14, 2) as receita_atribuida,
  case
    when c.custo_estimado > 0 then round(((coalesce(sum(ce.receita_atribuida), 0) - c.custo_estimado) / c.custo_estimado) * 100, 2)
    else 0
  end as roi_percent
from public.campanhas c
left join public.campanha_envios ce on ce.campanha_id = c.id
where c.filtro_usado ? 'segmentoId'
group by c.id, c.nome, c.criada_em, c.filtro_usado, c.objetivo, c.custo_estimado, c.meta_receita;

create view public.vw_campanhas_vendedor_resumo
with (security_invoker = true) as
with envios as (
  select
    ce.*,
    c.custo_estimado,
    coalesce(u.nome, 'Sem vendedor') as vendedor_nome
  from public.campanha_envios ce
  left join public.campanhas c on c.id = ce.campanha_id
  left join public.users u on u.id = ce.vendedor_id
),
tarefas_campanha as (
  select
    vendedor_id,
    count(*) filter (where status = 'aberta')::integer as tarefas_abertas
  from public.tarefas
  where origem like 'campanha:%'
  group by vendedor_id
)
select
  e.vendedor_id,
  e.vendedor_nome,
  count(distinct e.campanha_id)::integer as campanhas,
  count(*)::integer as total,
  count(*) filter (where e.status = 'pendente')::integer as pendentes,
  count(*) filter (where e.status = 'enviado')::integer as enviados,
  count(*) filter (where e.status = 'respondeu')::integer as responderam,
  count(*) filter (where e.status = 'nao_respondeu')::integer as sem_resposta,
  count(*) filter (where e.status = 'virou_orcamento' or e.virou_orcamento)::integer as viraram_orcamento,
  count(*) filter (where e.virou_venda or e.status = 'ganhou')::integer as viraram_venda,
  count(*) filter (where e.status = 'perdido')::integer as perdidos,
  count(*) filter (where e.status = 'nao_contatar')::integer as nao_contatar,
  coalesce(max(tc.tarefas_abertas), 0)::integer as tarefas_abertas,
  coalesce(sum(e.receita_atribuida), 0)::numeric(14, 2) as receita_atribuida,
  coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 0)::numeric(14, 2) as custo_estimado,
  case
    when coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 0) > 0
      then round(((coalesce(sum(e.receita_atribuida), 0) - coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 0)) / coalesce(sum(e.custo_estimado) filter (where e.status in ('enviado', 'respondeu', 'virou_orcamento', 'ganhou')), 1)) * 100, 2)
    else 0
  end as roi_percent
from envios e
left join tarefas_campanha tc on tc.vendedor_id is not distinct from e.vendedor_id
group by e.vendedor_id, e.vendedor_nome;

create view public.vw_clientes_campanha_elegibilidade
with (security_invoker = true) as
with ultimo_envio as (
  select
    cliente_id,
    max(coalesce(data_marcado_enviado, data_abertura_whatsapp)) as ultimo_envio_campanha
  from public.campanha_envios
  group by cliente_id
),
base as (
  select
    c.id as cliente_id,
    c.nome,
    c.vendedor_id,
    c.whatsapp_principal,
    c.status_comercial,
    c.lead_qualificacao_status,
    c.whatsapp_opt_out_motivo,
    c.whatsapp_opt_out_em,
    c.whatsapp_opt_out_por,
    c.ultimo_contato_em,
    u.ultimo_envio_campanha,
    greatest(
      coalesce(c.ultimo_contato_em, '-infinity'::timestamptz),
      coalesce(u.ultimo_envio_campanha, '-infinity'::timestamptz)
    ) as ultimo_acionamento
  from public.clientes c
  left join ultimo_envio u on u.cliente_id = c.id
  where c.excluido_em is null
)
select
  cliente_id,
  nome,
  vendedor_id,
  whatsapp_principal,
  status_comercial,
  lead_qualificacao_status,
  whatsapp_opt_out_motivo as opt_out_motivo,
  whatsapp_opt_out_em as opt_out_em,
  whatsapp_opt_out_por as opt_out_por,
  ultimo_contato_em,
  ultimo_envio_campanha,
  nullif(ultimo_acionamento, '-infinity'::timestamptz) as ultimo_acionamento,
  case
    when status_comercial = 'nao_contatar' or lead_qualificacao_status = 'nao_contatar' then false
    when whatsapp_principal is null or trim(whatsapp_principal) = '' then false
    when ultimo_acionamento > now() - interval '7 days' then false
    else true
  end as elegivel,
  case
    when status_comercial = 'nao_contatar' or lead_qualificacao_status = 'nao_contatar' then 'Nao contatar'
    when whatsapp_principal is null or trim(whatsapp_principal) = '' then 'Sem WhatsApp'
    when ultimo_acionamento > now() - interval '7 days' then 'Contato recente'
    else 'Apto'
  end as motivo_bloqueio,
  case
    when ultimo_acionamento = '-infinity'::timestamptz then null
    else (ultimo_acionamento + interval '7 days')::date
  end as proximo_envio_em
from base;

create view public.vw_vendedores_historicos_resumo
with (security_invoker = true) as
select
  coalesce(nullif(c.vendedor_codigo_erp, ''), 'sem_codigo') as vendedor_codigo_erp,
  coalesce(nullif(c.vendedor_nome_erp, ''), 'Nao informado') as vendedor_nome_erp,
  count(*)::integer as clientes,
  count(*) filter (where c.vendedor_id is null)::integer as sem_responsavel,
  count(*) filter (where c.origem_base = 'capital_truck')::integer as capital_truck,
  count(*) filter (where c.origem_base = 'rodobens')::integer as rodobens,
  count(*) filter (where c.ultima_compra_em is null or c.ultima_compra_em < current_date - interval '180 days')::integer as clientes_risco,
  coalesce(sum(c.total_comprado), 0)::numeric(14, 2) as total_comprado
from public.clientes c
where c.excluido_em is null
group by coalesce(nullif(c.vendedor_codigo_erp, ''), 'sem_codigo'), coalesce(nullif(c.vendedor_nome_erp, ''), 'Nao informado');

create view public.vw_rodobens_funil
with (security_invoker = true) as
select
  c.lead_qualificacao_status as status,
  count(*)::integer as total,
  count(*) filter (where nullif(c.whatsapp_principal, '') is not null)::integer as com_whatsapp,
  count(*) filter (where c.vendedor_id is not null)::integer as com_vendedor
from public.clientes c
where c.excluido_em is null
  and c.origem_base = 'rodobens'
group by c.lead_qualificacao_status;

create or replace function public.catalogo_sugestoes_complementares(item_id uuid, limite integer default 8)
returns table (
  catalogo_item_id uuid,
  tipo text,
  codigo text,
  descricao text,
  ocorrencias integer,
  clientes integer
)
language sql
stable
set search_path = public
as $$
  with base_item as (
    select id, tipo, codigo
    from public.catalogo_itens
    where id = item_id
  ),
  clientes_base as (
    select distinct v.cliente_id
    from public.vendas_itens v
    join base_item b on b.tipo = 'produto' and v.produto_codigo = b.codigo
    union
    select distinct s.cliente_id
    from public.servicos_itens s
    join base_item b on b.tipo = 'servico' and s.servico_codigo = b.codigo
  ),
  ocorrencias as (
    select ci.id, ci.tipo, ci.codigo, ci.descricao, count(*)::integer as ocorrencias, count(distinct v.cliente_id)::integer as clientes
    from public.vendas_itens v
    join clientes_base cb on cb.cliente_id = v.cliente_id
    join public.catalogo_itens ci on ci.tipo = 'produto' and ci.codigo = v.produto_codigo
    where ci.id <> item_id and ci.ativo
    group by ci.id, ci.tipo, ci.codigo, ci.descricao
    union all
    select ci.id, ci.tipo, ci.codigo, ci.descricao, count(*)::integer as ocorrencias, count(distinct s.cliente_id)::integer as clientes
    from public.servicos_itens s
    join clientes_base cb on cb.cliente_id = s.cliente_id
    join public.catalogo_itens ci on ci.tipo = 'servico' and ci.codigo = s.servico_codigo
    where ci.id <> item_id and ci.ativo
    group by ci.id, ci.tipo, ci.codigo, ci.descricao
  )
  select id, tipo, codigo, descricao, sum(ocorrencias)::integer, sum(clientes)::integer
  from ocorrencias
  group by id, tipo, codigo, descricao
  order by sum(clientes) desc, sum(ocorrencias) desc, descricao asc
  limit greatest(limite, 1);
$$;

create table public.importacao_conflitos (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid not null references public.importacoes(id),
  tipo_conflito text not null,
  dados_recebidos jsonb not null,
  possiveis_clientes jsonb not null default '[]'::jsonb,
  resolvido boolean not null default false,
  cliente_escolhido_id uuid references public.clientes(id),
  resolvido_por uuid references public.users(id),
  resolvido_em timestamptz
);

create table public.cliente_alteracoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  usuario_id uuid references public.users(id),
  campo text not null,
  valor_anterior text,
  valor_novo text,
  origem text,
  criado_em timestamptz not null default now()
);

create table public.cliente_mesclagens (
  id uuid primary key default gen_random_uuid(),
  cliente_principal_id uuid not null references public.clientes(id),
  cliente_mesclado_id uuid not null references public.clientes(id),
  usuario_id uuid references public.users(id),
  motivo text,
  dados_movidos jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index clientes_vendedor_idx on public.clientes(vendedor_id);
create index clientes_cpf_cnpj_idx on public.clientes(cpf_cnpj);
create index clientes_whatsapp_idx on public.clientes(whatsapp_principal);
create index clientes_origem_base_idx on public.clientes(origem_base);
create index clientes_lead_qualificacao_idx on public.clientes(lead_qualificacao_status) where origem_base = 'rodobens';
create index clientes_nome_idx on public.clientes(nome);
create index clientes_ultima_compra_idx on public.clientes(ultima_compra_em desc);
create index vendas_cliente_data_idx on public.vendas_itens(cliente_id, data_venda desc);
create index servicos_cliente_data_idx on public.servicos_itens(cliente_id, data_servico desc);
create index interacoes_cliente_data_idx on public.interacoes(cliente_id, data_interacao desc);
create unique index if not exists interacoes_campanha_cliente_resultado_idx
on public.interacoes (cliente_id, campanha_id, resultado)
where canal = 'Campanha' and campanha_id is not null;
create index tarefas_vendedor_vencimento_idx on public.tarefas(vendedor_id, data_vencimento);
create unique index if not exists tarefas_abertas_cliente_origem_idx
on public.tarefas (cliente_id, origem)
where status = 'aberta' and origem is not null;
create index orcamento_versoes_orcamento_idx on public.orcamento_versoes(orcamento_id, numero desc);
create index orcamento_aprovacoes_orcamento_idx on public.orcamento_aprovacoes(orcamento_id, criado_em desc);
create index orcamento_condicoes_orcamento_idx on public.orcamento_condicoes(orcamento_id, ordem);
create index catalogo_midias_item_idx on public.catalogo_midias(catalogo_item_id, ativo, prioridade);
create index metas_vendedores_mes_idx on public.metas_vendedores(mes_referencia, vendedor_id);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger clientes_set_atualizado_em
before update on public.clientes
for each row execute function public.set_atualizado_em();

create trigger orcamentos_set_atualizado_em
before update on public.orcamentos
for each row execute function public.set_atualizado_em();

create trigger catalogo_midias_set_atualizado_em
before update on public.catalogo_midias
for each row execute function public.set_atualizado_em();

create trigger metas_vendedores_set_atualizado_em
before update on public.metas_vendedores
for each row execute function public.set_atualizado_em();

create or replace function public.atualizar_cliente_datas_por_interacao()
returns trigger
language plpgsql
as $$
begin
  update public.clientes
  set
    ultimo_contato_em = greatest(coalesce(ultimo_contato_em, new.data_interacao), new.data_interacao),
    proxima_acao_em = coalesce(new.data_proxima_acao, proxima_acao_em)
  where id = new.cliente_id;

  return new;
end;
$$;

create trigger interacoes_atualizar_cliente_datas
after insert on public.interacoes
for each row execute function public.atualizar_cliente_datas_por_interacao();

create or replace function public.auditar_tarefa_concluida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status and new.status = 'concluida' then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (
      new.cliente_id,
      public.current_app_user_id(),
      'tarefa_status',
      old.status,
      new.status,
      coalesce(new.origem, 'app')
    );
  end if;

  return new;
end;
$$;

create trigger tarefas_auditar_conclusao
after update on public.tarefas
for each row execute function public.auditar_tarefa_concluida();

create or replace function public.auditar_orcamento_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (
      new.cliente_id,
      public.current_app_user_id(),
      'orcamento_status',
      old.status,
      new.status,
      'orcamento'
    );

    if new.status in ('ganho', 'perdido', 'aguardando_aprovacao') then
      insert into public.interacoes (
        cliente_id,
        vendedor_id,
        canal,
        tipo,
        resumo,
        resultado,
        orcamento_id
      )
      values (
        new.cliente_id,
        new.vendedor_id,
        'sistema',
        'orcamento',
        case
          when new.status = 'ganho' then 'Orcamento marcado como ganho.'
          when new.status = 'aguardando_aprovacao' then 'Orcamento aguardando aprovacao. ' || coalesce(new.aprovacao_motivo, '')
          else 'Orcamento marcado como perdido. Motivo: ' || coalesce(new.motivo_perda, 'nao informado')
        end,
        new.status,
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger orcamentos_auditar_status
after update on public.orcamentos
for each row execute function public.auditar_orcamento_status();

create or replace function public.mesclar_clientes(
  cliente_principal uuid,
  cliente_mesclado uuid,
  motivo_mesclagem text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  mesclagem_id uuid;
  movidos jsonb := '{}'::jsonb;
begin
  if not public.current_user_is_admin() then
    raise exception 'Apenas admin pode mesclar clientes';
  end if;

  if cliente_principal = cliente_mesclado then
    raise exception 'Cliente principal e cliente mesclado nao podem ser iguais';
  end if;

  update public.vendas_itens set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{vendas}', to_jsonb(found));

  update public.servicos_itens set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{servicos}', to_jsonb(found));

  update public.cliente_contatos set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{contatos}', to_jsonb(found));

  update public.interacoes set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{interacoes}', to_jsonb(found));

  update public.tarefas set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{tarefas}', to_jsonb(found));

  update public.orcamentos set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{orcamentos}', to_jsonb(found));

  update public.campanha_envios set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{campanhas}', to_jsonb(found));

  update public.cliente_alteracoes set cliente_id = cliente_principal where cliente_id = cliente_mesclado;
  movidos := jsonb_set(movidos, '{auditoria}', to_jsonb(found));

  update public.clientes
  set excluido_em = now(),
      status_comercial = 'perdido',
      observacoes_comerciais = concat_ws(E'\n', observacoes_comerciais, 'Mesclado no cliente ' || cliente_principal::text)
  where id = cliente_mesclado;

  insert into public.cliente_mesclagens (
    cliente_principal_id,
    cliente_mesclado_id,
    usuario_id,
    motivo,
    dados_movidos
  )
  values (
    cliente_principal,
    cliente_mesclado,
    public.current_app_user_id(),
    motivo_mesclagem,
    movidos
  )
  returning id into mesclagem_id;

  return mesclagem_id;
end;
$$;

create or replace function public.auditar_cliente_alteracoes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid;
begin
  usuario_atual := public.current_app_user_id();

  if old.telefone_principal is distinct from new.telefone_principal then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'telefone_principal', old.telefone_principal, new.telefone_principal, 'app');
  end if;

  if old.whatsapp_principal is distinct from new.whatsapp_principal then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'whatsapp_principal', old.whatsapp_principal, new.whatsapp_principal, 'app');
  end if;

  if old.responsavel_nome is distinct from new.responsavel_nome then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'responsavel_nome', old.responsavel_nome, new.responsavel_nome, 'app');
  end if;

  if old.vendedor_id is distinct from new.vendedor_id then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'vendedor_id', old.vendedor_id::text, new.vendedor_id::text, 'app');
  end if;

  if old.status_comercial is distinct from new.status_comercial then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'status_comercial', old.status_comercial::text, new.status_comercial::text, 'app');
  end if;

  if old.lead_qualificacao_status is distinct from new.lead_qualificacao_status then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'lead_qualificacao_status', old.lead_qualificacao_status, new.lead_qualificacao_status, 'rodobens');
  end if;

  if old.origem_base is distinct from new.origem_base then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (new.id, usuario_atual, 'origem_base', old.origem_base, new.origem_base, 'app');
  end if;

  return new;
end;
$$;

create trigger clientes_auditar_alteracoes
after update on public.clientes
for each row execute function public.auditar_cliente_alteracoes();

create or replace function public.auditar_cliente_optout_campanha()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid;
begin
  usuario_atual := public.current_app_user_id();

  if old.whatsapp_opt_out_motivo is distinct from new.whatsapp_opt_out_motivo
    or old.whatsapp_opt_out_em is distinct from new.whatsapp_opt_out_em then
    insert into public.cliente_alteracoes (cliente_id, usuario_id, campo, valor_anterior, valor_novo, origem)
    values (
      new.id,
      coalesce(new.whatsapp_opt_out_por, usuario_atual),
      'whatsapp_opt_out',
      coalesce(old.whatsapp_opt_out_motivo, ''),
      coalesce(new.whatsapp_opt_out_motivo, ''),
      'campanha'
    );
  end if;

  return new;
end;
$$;

create trigger clientes_auditar_optout_campanha
after update of whatsapp_opt_out_motivo, whatsapp_opt_out_em, whatsapp_opt_out_por on public.clientes
for each row execute function public.auditar_cliente_optout_campanha();

create or replace function public.calcular_score_oportunidade(cliente public.clientes)
returns integer
language plpgsql
stable
as $$
declare
  score integer := 0;
  dias_sem_compra integer;
  dias_sem_contato integer;
begin
  if cliente.status_comercial = 'nao_contatar' then
    return 0;
  end if;

  dias_sem_compra := coalesce(current_date - cliente.ultima_compra_em, 9999);
  dias_sem_contato := coalesce(current_date - cliente.ultimo_contato_em::date, 9999);

  if exists (
    select 1
    from public.orcamentos o
    where o.cliente_id = cliente.id
      and o.status in ('aberto', 'enviado', 'negociando')
  ) then
    score := score + 25;
  end if;

  if dias_sem_compra <= 365 then
    score := score + 10;
  end if;

  if dias_sem_compra > 90 then
    score := score + 15;
  end if;

  if exists (
    select 1
    from public.vendas_itens v
    where v.cliente_id = cliente.id
    group by v.cliente_id
    having sum(v.valor_total) > 100000
  ) then
    score := score + 20;
  end if;

  if nullif(cliente.whatsapp_principal, '') is not null then
    score := score + 10;
  end if;

  if dias_sem_contato > 60 then
    score := score + 15;
  end if;

  if cliente.ultimo_servico_em is not null and current_date - cliente.ultimo_servico_em < 60 then
    score := score + 10;
  end if;

  if cliente.vendedor_id is null then
    score := score + 12;
  end if;

  return score;
end;
$$;

create or replace view public.fila_trabalho_clientes as
select
  c.id,
  c.nome,
  c.cidade,
  c.uf,
  c.whatsapp_principal,
  c.vendedor_id,
  u.nome as vendedor_nome,
  c.status_comercial,
  c.ultima_compra_em,
  c.ultimo_servico_em,
  c.ultimo_contato_em,
  c.proxima_acao_em,
  public.calcular_score_oportunidade(c) as score_oportunidade,
  case
    when c.vendedor_id is null then 'Cliente novo sem vendedor definido'
    when exists (
      select 1 from public.orcamentos o
      where o.cliente_id = c.id and o.status in ('aberto', 'enviado', 'negociando')
    ) then 'Orcamento precisa de retorno'
    when coalesce(current_date - c.ultima_compra_em, 9999) > 180 then 'Mais de 180 dias sem compra'
    when coalesce(current_date - c.ultima_compra_em, 9999) > 90 then 'Oportunidade de recompra'
    when c.ultimo_servico_em is null and exists (select 1 from public.vendas_itens v where v.cliente_id = c.id) then 'Comprou pneus e nunca fez servico'
    else 'Manter relacionamento ativo'
  end as motivo_oportunidade
from public.clientes c
left join public.users u on u.id = c.vendedor_id
where c.excluido_em is null
order by score_oportunidade desc, c.proxima_acao_em nulls last;

drop view if exists public.oportunidades_clientes;

create view public.oportunidades_clientes
with (security_invoker = true) as
with oportunidades as (
  select
    c.id as cliente_id,
    c.nome as cliente_nome,
    c.vendedor_id,
    'sem_vendedor' as tipo,
    'Cliente sem responsavel comercial.' as motivo,
    'Distribuir carteira' as proxima_acao,
    90 as prioridade,
    c.status_comercial = 'nao_contatar' as bloqueada
  from public.clientes c
  where c.excluido_em is null
    and c.vendedor_id is null

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'rodobens_primeiro_contato',
    'Lead Rodobens sem primeiro contato registrado.',
    'Fazer primeiro contato e qualificar',
    88,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and c.origem_base = 'rodobens'
    and not exists (
      select 1 from public.interacoes i
      where i.cliente_id = c.id
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'cliente_risco_180',
    'Mais de 180 dias sem compra.',
    'Contato de reativacao',
    public.calcular_score_oportunidade(c) + 20,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and coalesce(current_date - c.ultima_compra_em, 9999) > 180

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'recompra_90',
    'Mais de 90 dias sem compra.',
    'Enviar WhatsApp de recompra',
    public.calcular_score_oportunidade(c) + 15,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and coalesce(current_date - c.ultima_compra_em, 9999) > 90
    and coalesce(current_date - c.ultima_compra_em, 9999) <= 180

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'alto_valor_sem_contato',
    'Cliente de alto valor sem contato recente.',
    'Ligar para relacionamento',
    public.calcular_score_oportunidade(c) + 18,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and coalesce(current_date - c.ultimo_contato_em::date, 9999) > 60
    and exists (
      select 1
      from public.vendas_itens v
      where v.cliente_id = c.id
      group by v.cliente_id
      having sum(v.valor_total) > 100000
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'orcamento_aberto',
    'Orcamento aberto precisa de retorno.',
    'Retomar orcamento',
    public.calcular_score_oportunidade(c) + 25,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and exists (
      select 1
      from public.orcamentos o
      where o.cliente_id = c.id
        and o.status in ('aberto', 'enviado', 'negociando')
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'orcamento_vencido',
    'Orcamento vencido sem ganho/perda.',
    'Retomar ou encerrar proposta',
    public.calcular_score_oportunidade(c) + 30,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and exists (
      select 1
      from public.orcamentos o
      where o.cliente_id = c.id
        and o.status in ('aberto', 'enviado', 'negociando')
        and o.validade < current_date
    )

  union all

  select
    c.id,
    c.nome,
    c.vendedor_id,
    'sem_whatsapp',
    'Cadastro sem WhatsApp valido.',
    'Atualizar cadastro',
    55,
    c.status_comercial = 'nao_contatar'
  from public.clientes c
  where c.excluido_em is null
    and nullif(c.whatsapp_principal, '') is null
)
select
  o.*,
  exists (
    select 1
    from public.tarefas t
    where t.cliente_id = o.cliente_id
      and t.status = 'aberta'
      and t.origem = 'oportunidade:' || o.tipo
  ) as tarefa_existente
from oportunidades o;

drop view if exists public.vw_oportunidades_resumo;

create view public.vw_oportunidades_resumo
with (security_invoker = true) as
select
  o.vendedor_id,
  o.tipo,
  count(*)::integer as total,
  count(*) filter (where not o.bloqueada and not coalesce(o.tarefa_existente, false))::integer as ativas,
  count(*) filter (where o.bloqueada or coalesce(o.tarefa_existente, false))::integer as bloqueadas,
  round(avg(o.prioridade), 1)::numeric(6, 1) as prioridade_media,
  max(o.prioridade)::integer as prioridade_maxima
from public.oportunidades_clientes o
group by o.vendedor_id, o.tipo;

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
create unique index if not exists oportunidades_orcamento_unique_idx
on public.oportunidades(orcamento_id)
where orcamento_id is not null;
create unique index if not exists oportunidades_campanha_cliente_unique_idx
on public.oportunidades(campanha_id, cliente_id)
where campanha_id is not null;

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

create or replace function public.refresh_clientes_comercial_stats()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem recalcular estatisticas comerciais.';
  end if;

  update public.clientes c
  set
    primeira_compra_em = stats.primeira_compra,
    ultima_compra_em = stats.ultima_compra,
    ultimo_servico_em = stats.ultimo_servico,
    total_comprado = coalesce(stats.total_produtos, 0),
    total_servicos = coalesce(stats.total_servicos, 0),
    status_comercial = case
      when c.status_comercial = 'nao_contatar' then c.status_comercial
      when stats.ultima_compra is null and stats.ultimo_servico is null then 'novo'::cliente_status
      when greatest(coalesce(stats.ultima_compra, date '1900-01-01'), coalesce(stats.ultimo_servico, date '1900-01-01')) < current_date - 180 then 'reativar'::cliente_status
      else 'ativo'::cliente_status
    end,
    atualizado_em = now()
  from (
    select
      c.id,
      v.primeira_compra,
      v.ultima_compra,
      s.ultimo_servico,
      coalesce(v.total_produtos, 0) as total_produtos,
      coalesce(s.total_servicos, 0) as total_servicos
    from public.clientes c
    left join (
      select
        cliente_id,
        min(data_venda) as primeira_compra,
        max(data_venda) as ultima_compra,
        sum(valor_total) as total_produtos
      from public.vendas_itens
      group by cliente_id
    ) v on v.cliente_id = c.id
    left join (
      select
        cliente_id,
        max(data_servico) as ultimo_servico,
        sum(valor_total) as total_servicos
      from public.servicos_itens
      group by cliente_id
    ) s on s.cliente_id = c.id
  ) stats
  where stats.id = c.id;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.criar_tarefas_followup_automaticas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  orcamentos_vencidos integer := 0;
  campanhas_resposta integer := 0;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem executar automacoes de follow-up.';
  end if;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem
  )
  select
    o.cliente_id,
    o.vendedor_id,
    'Retomar orcamento vencido',
    concat(
      'Orcamento de ',
      to_char(o.valor_total, 'FM999G999G990D00'),
      ' venceu em ',
      to_char(o.validade, 'DD/MM/YYYY'),
      '. Revisar condicao, confirmar interesse e registrar proximo passo.'
    ),
    current_date::timestamptz,
    'aberta',
    case
      when o.valor_total >= 10000 then 95
      when o.valor_total >= 3000 then 88
      else 82
    end,
    concat('orcamento:vencido:', o.id::text)
  from public.orcamentos o
  where o.validade is not null
    and o.validade < current_date
    and o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
  on conflict (cliente_id, origem) where status = 'aberta' and origem is not null
  do update set
    vendedor_id = excluded.vendedor_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    data_vencimento = least(public.tarefas.data_vencimento, excluded.data_vencimento),
    prioridade = greatest(public.tarefas.prioridade, excluded.prioridade);

  get diagnostics orcamentos_vencidos = row_count;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem
  )
  select
    ce.cliente_id,
    coalesce(ce.vendedor_id, c.vendedor_id),
    case
      when ce.status = 'virou_orcamento' or ce.virou_orcamento then 'Acompanhar orcamento da campanha'
      else 'Responder cliente da campanha'
    end,
    concat(
      'Campanha: ',
      coalesce(ca.nome, 'sem nome'),
      case
        when nullif(ce.resposta_cliente, '') is not null then concat('. Resposta: ', left(ce.resposta_cliente, 220))
        else '. Cliente marcou resposta ou pediu retorno.'
      end
    ),
    current_date::timestamptz,
    'aberta',
    case
      when ce.status = 'virou_orcamento' or ce.virou_orcamento then 94
      else 90
    end,
    concat('campanha:resposta:', ce.id::text)
  from public.campanha_envios ce
  join public.campanhas ca on ca.id = ce.campanha_id
  join public.clientes c on c.id = ce.cliente_id
  where ce.status in ('respondeu', 'virou_orcamento')
    and not ce.virou_venda
  on conflict (cliente_id, origem) where status = 'aberta' and origem is not null
  do update set
    vendedor_id = excluded.vendedor_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    data_vencimento = least(public.tarefas.data_vencimento, excluded.data_vencimento),
    prioridade = greatest(public.tarefas.prioridade, excluded.prioridade);

  get diagnostics campanhas_resposta = row_count;

  return jsonb_build_object(
    'orcamentos_vencidos_tarefas', orcamentos_vencidos,
    'campanhas_resposta_tarefas', campanhas_resposta,
    'tarefas_followup_total', orcamentos_vencidos + campanhas_resposta
  );
end;
$$;

create or replace function public.finalizar_importacao_diaria()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clientes_atualizados integer;
  oportunidades_geradas integer;
  tarefas_followup jsonb;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem finalizar importacoes.';
  end if;

  clientes_atualizados := public.refresh_clientes_comercial_stats();
  oportunidades_geradas := public.refresh_oportunidades_cache();
  tarefas_followup := public.criar_tarefas_followup_automaticas();
  refresh materialized view public.vw_ranking_servicos_recorrentes;

  return jsonb_build_object(
    'clientes_atualizados', clientes_atualizados,
    'oportunidades_geradas', oportunidades_geradas,
    'tarefas_followup', tarefas_followup
  );
end;
$$;

drop view if exists public.vw_oportunidades_resumo_cache;

create view public.vw_oportunidades_resumo_cache
with (security_invoker = true) as
select
  o.vendedor_id,
  o.tipo,
  count(*)::integer as total,
  count(*) filter (where not o.bloqueada and not o.tarefa_existente)::integer as ativas,
  count(*) filter (where o.bloqueada or o.tarefa_existente)::integer as bloqueadas,
  round(avg(o.prioridade), 1)::numeric(6, 1) as prioridade_media,
  max(o.prioridade)::integer as prioridade_maxima,
  max(o.gerado_em) as gerado_em
from public.oportunidades_cache o
group by o.vendedor_id, o.tipo;

create or replace view public.ranking_medidas_vendidas as
select
  coalesce(nullif(medida, ''), produto_nome) as medida,
  count(*) as itens,
  sum(quantidade) as quantidade,
  sum(valor_total) as valor_total
from public.vendas_itens
group by coalesce(nullif(medida, ''), produto_nome)
order by valor_total desc nulls last;

create or replace view public.ranking_servicos_recorrentes as
select
  servico_nome,
  count(*) as itens,
  sum(quantidade) as quantidade,
  sum(valor_total) as valor_total
from public.servicos_itens
group by servico_nome
order by valor_total desc nulls last;

create or replace view public.vw_dashboard_resumo as
select
  (select count(*) from public.clientes c where c.excluido_em is null) as clientes_total,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and c.ultima_compra_em is not null
      and c.ultima_compra_em >= current_date - interval '90 days'
  ) as clientes_ativos_90,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and (c.ultima_compra_em is null or c.ultima_compra_em < current_date - interval '90 days')
  ) as clientes_inativos_90,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and c.proxima_acao_em is not null
      and c.proxima_acao_em::date <= current_date
  ) as acoes_vencidas,
  (select count(*) from public.clientes c where c.excluido_em is null and c.vendedor_id is null) as clientes_sem_vendedor,
  (select count(*) from public.clientes c where c.excluido_em is null and nullif(c.whatsapp_principal, '') is null) as clientes_sem_whatsapp,
  (
    select count(*)
    from public.clientes c
    where c.excluido_em is null
      and (c.ultimo_contato_em is null or c.ultimo_contato_em < now() - interval '60 days')
  ) as clientes_sem_contato_60,
  (select count(*) from public.clientes c where c.excluido_em is null and c.origem_base = 'capital_truck') as clientes_capital,
  (select count(*) from public.clientes c where c.excluido_em is null and c.origem_base = 'rodobens') as clientes_rodobens,
  (select count(*) from public.clientes c where c.excluido_em is null and c.origem_base = 'desconhecida') as clientes_origem_desconhecida,
  (select coalesce(sum(c.total_comprado), 0) from public.clientes c where c.excluido_em is null) as total_comprado,
  (select coalesce(sum(c.total_servicos), 0) from public.clientes c where c.excluido_em is null) as total_servicos,
  (select count(*) from public.tarefas t where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas,
  (select count(*) from public.tarefas t where t.status = 'aberta') as tarefas_abertas,
  (
    select coalesce(sum(o.valor_total), 0)
    from public.orcamentos o
    where o.status in ('aberto', 'enviado', 'negociando')
  ) as pipeline_aberto,
  (select count(*) from public.orcamentos o where o.status in ('aberto', 'enviado', 'negociando')) as orcamentos_abertos,
  (select count(*) from public.orcamentos o where o.status = 'ganho') as orcamentos_ganhos,
  (select count(*) from public.orcamentos o) as orcamentos_total,
  (select count(*) from public.campanha_envios ce where ce.status = 'pendente') as campanhas_pendentes,
  (select count(*) from public.campanha_envios ce where ce.status = 'enviado') as campanhas_enviadas,
  (select count(*) from public.campanha_envios ce where ce.status = 'respondeu') as campanhas_responderam,
  (select count(*) from public.campanha_envios ce where ce.status = 'virou_orcamento') as campanhas_viraram_orcamento,
  (
    select count(*)
    from public.oportunidades_cache oc
    where not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_ativas,
  (select count(*) from public.oportunidades_cache oc) as oportunidades_total,
  (select max(oc.gerado_em) from public.oportunidades_cache oc) as oportunidades_atualizado_em,
  (
    select count(*)
    from public.oportunidades_cache oc
    where oc.tipo = 'sem_vendedor'
      and not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_sem_vendedor,
  (
    select count(*)
    from public.oportunidades_cache oc
    where oc.tipo = 'rodobens_primeiro_contato'
      and not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_rodobens,
  (
    select count(*)
    from public.oportunidades_cache oc
    where oc.tipo = 'orcamento_vencido'
      and not oc.bloqueada
      and not oc.tarefa_existente
  ) as oportunidades_orcamento_vencido;

create or replace view public.vw_vendedores_resumo as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  u.role,
  (
    select count(*)
    from public.clientes c
    where c.vendedor_id = u.id
      and c.excluido_em is null
  ) as clientes,
  (
    select count(*)
    from public.clientes c
    where c.vendedor_id = u.id
      and c.excluido_em is null
      and (c.ultima_compra_em is null or c.ultima_compra_em < current_date - interval '180 days')
  ) as clientes_risco,
  (select count(*) from public.interacoes i where i.vendedor_id = u.id) as contatos,
  (select count(*) from public.tarefas t where t.vendedor_id = u.id and t.status = 'aberta') as tarefas_abertas,
  (
    select count(*)
    from public.tarefas t
    where t.vendedor_id = u.id
      and t.status = 'aberta'
      and t.data_vencimento::date < current_date
  ) as tarefas_vencidas,
  (
    select coalesce(sum(o.valor_total), 0)
    from public.orcamentos o
    where o.vendedor_id = u.id
      and o.status in ('aberto', 'enviado', 'negociando')
  ) as pipeline,
  (
    select coalesce(sum(c.total_comprado), 0)
    from public.clientes c
    where c.vendedor_id = u.id
      and c.excluido_em is null
  ) as total_carteira
from public.users u
where u.ativo = true;

drop view if exists public.vw_funil_gerencial;

create view public.vw_funil_gerencial
with (security_invoker = true) as
with
  vendedor_keys as (
    select coalesce(c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id
    from public.clientes c
    where c.excluido_em is null
    union
    select coalesce(o.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.orcamentos o
    left join public.clientes c on c.id = o.cliente_id
    union
    select coalesce(i.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.interacoes i
    left join public.clientes c on c.id = i.cliente_id
    union
    select coalesce(t.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
    from public.tarefas t
    left join public.clientes c on c.id = t.cliente_id
  ),
  clientes as (
    select
      coalesce(c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) as clientes,
      count(*) filter (where c.origem_base = 'rodobens') as leads_rodobens
    from public.clientes c
    where c.excluido_em is null
    group by coalesce(c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ),
  contatos as (
    select
      coalesce(i.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) filter (where i.data_interacao >= current_date - interval '30 days') as contatos_30d
    from public.interacoes i
    left join public.clientes c on c.id = i.cliente_id
    group by coalesce(i.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ),
  orcamentos as (
    select
      coalesce(o.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) filter (where o.data_orcamento >= current_date - interval '30 days') as orcamentos_30d,
      count(*) filter (where o.status = 'ganho' and o.data_orcamento >= current_date - interval '30 days') as ganhos_30d,
      count(*) filter (where o.status = 'perdido' and o.data_orcamento >= current_date - interval '30 days') as perdidos_30d,
      coalesce(sum(o.valor_total) filter (where o.status in ('aberto', 'enviado', 'negociando')), 0)::numeric(14, 2) as pipeline_aberto,
      coalesce(avg((o.atualizado_em::date - o.data_orcamento)) filter (where o.status in ('ganho', 'perdido')), 0)::numeric(10, 2) as tempo_medio_fechamento
    from public.orcamentos o
    left join public.clientes c on c.id = o.cliente_id
    group by coalesce(o.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ),
  tarefas as (
    select
      coalesce(t.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid) as vendedor_id,
      count(*) filter (where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas
    from public.tarefas t
    left join public.clientes c on c.id = t.cliente_id
    group by coalesce(t.vendedor_id, c.vendedor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
select
  vk.vendedor_id,
  coalesce(u.nome, 'Sem vendedor') as vendedor_nome,
  coalesce(c.clientes, 0) as clientes,
  coalesce(c.leads_rodobens, 0) as leads_rodobens,
  coalesce(ct.contatos_30d, 0) as contatos_30d,
  coalesce(o.orcamentos_30d, 0) as orcamentos_30d,
  coalesce(o.ganhos_30d, 0) as ganhos_30d,
  coalesce(o.perdidos_30d, 0) as perdidos_30d,
  coalesce(o.pipeline_aberto, 0)::numeric(14, 2) as pipeline_aberto,
  coalesce(o.tempo_medio_fechamento, 0)::numeric(10, 2) as tempo_medio_fechamento,
  coalesce(t.tarefas_vencidas, 0) as tarefas_vencidas
from vendedor_keys vk
left join public.users u on u.id = vk.vendedor_id
left join clientes c on c.vendedor_id = vk.vendedor_id
left join contatos ct on ct.vendedor_id = vk.vendedor_id
left join orcamentos o on o.vendedor_id = vk.vendedor_id
left join tarefas t on t.vendedor_id = vk.vendedor_id
order by pipeline_aberto desc, clientes desc;

drop view if exists public.vw_motivos_perda;

create view public.vw_motivos_perda
with (security_invoker = true) as
select
  coalesce(nullif(o.motivo_perda, ''), 'nao_informado') as motivo,
  count(*) as total,
  coalesce(sum(o.valor_total), 0)::numeric(14, 2) as valor_total,
  max(o.atualizado_em) as ultimo_registro
from public.orcamentos o
where o.status = 'perdido'
group by coalesce(nullif(o.motivo_perda, ''), 'nao_informado')
order by total desc, valor_total desc;

drop view if exists public.vw_atividades_dia;

create view public.vw_atividades_dia
with (security_invoker = true) as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  count(distinct i.id) filter (where i.data_interacao::date = current_date) as contatos_hoje,
  count(distinct o.id) filter (where o.data_orcamento = current_date) as orcamentos_hoje,
  count(distinct t.id) filter (where t.status = 'concluida' and t.concluida_em::date = current_date) as tarefas_concluidas_hoje,
  count(distinct t.id) filter (where t.status = 'aberta' and t.data_vencimento::date < current_date) as tarefas_vencidas
from public.users u
left join public.interacoes i on i.vendedor_id = u.id
left join public.orcamentos o on o.vendedor_id = u.id
left join public.tarefas t on t.vendedor_id = u.id
where u.ativo = true
group by u.id, u.nome
order by contatos_hoje desc, orcamentos_hoje desc, tarefas_vencidas desc;

drop view if exists public.vw_forecast_vendedor;

create view public.vw_forecast_vendedor
with (security_invoker = true) as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  count(o.id) filter (where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao'))::integer as propostas_abertas,
  coalesce(sum(o.valor_total) filter (where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')), 0)::numeric(14, 2) as pipeline_aberto,
  coalesce(sum(
    case
      when o.status = 'aberto' then o.valor_total * 0.25
      when o.status = 'aguardando_aprovacao' then o.valor_total * 0.35
      when o.status = 'enviado' then o.valor_total * 0.45
      when o.status = 'negociando' then o.valor_total * 0.65
      else 0
    end
  ), 0)::numeric(14, 2) as forecast_ponderado,
  coalesce(sum(o.valor_total) filter (
    where o.status = 'ganho'
      and date_trunc('month', o.atualizado_em) = date_trunc('month', current_date)
  ), 0)::numeric(14, 2) as ganho_mes,
  count(o.id) filter (
    where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
      and o.validade < current_date
  )::integer as vencidas,
  count(o.id) filter (
    where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
      and o.validade between current_date and current_date + interval '7 days'
  )::integer as vencem_7d,
  max(o.atualizado_em) filter (where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')) as ultimo_movimento,
  case
    when count(o.id) filter (
      where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
        and o.validade < current_date
    ) > 0 then 'Retomar propostas vencidas'
    when count(o.id) filter (
      where o.status = 'aguardando_aprovacao'
    ) > 0 then 'Decidir aprovacoes pendentes'
    when count(o.id) filter (
      where o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
        and o.atualizado_em < now() - interval '7 days'
    ) > 0 then 'Movimentar propostas paradas'
    else 'Manter cadencia de follow-up'
  end as gargalo_principal
from public.users u
left join public.orcamentos o on o.vendedor_id = u.id
where u.ativo = true
  and u.role in ('admin', 'vendedor')
group by u.id, u.nome
order by forecast_ponderado desc, pipeline_aberto desc;

create or replace view public.vw_tarefas_sla_vendedor
with (security_invoker = true) as
select
  u.id as vendedor_id,
  u.nome as vendedor_nome,
  count(t.id)::integer as tarefas_abertas,
  count(t.id) filter (where t.data_vencimento::date < current_date)::integer as atrasadas,
  count(t.id) filter (where t.data_vencimento::date = current_date)::integer as vencem_hoje,
  count(t.id) filter (where t.prioridade >= 80)::integer as alta_prioridade,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'campanha%'
  )::integer as campanhas_atrasadas,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'orcamento%'
  )::integer as orcamentos_atrasados,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'rodobens%'
  )::integer as rodobens_atrasados,
  count(t.id) filter (
    where t.data_vencimento::date < current_date
      and coalesce(t.origem, '') ilike 'oportunidade%'
  )::integer as oportunidades_atrasadas,
  max(t.data_vencimento) filter (where t.status = 'aberta') as ultimo_vencimento
from public.users u
left join public.tarefas t
  on t.vendedor_id = u.id
  and t.status = 'aberta'
where u.ativo = true
group by u.id, u.nome;

create or replace view public.vw_ranking_medidas_vendidas as
select
  coalesce(nullif(medida, ''), produto_nome) as label,
  count(*) as itens,
  coalesce(sum(quantidade), 0) as quantidade,
  coalesce(sum(valor_total), 0) as valor_total
from public.vendas_itens
group by coalesce(nullif(medida, ''), produto_nome)
order by valor_total desc nulls last;

drop view if exists public.vw_ranking_servicos_recorrentes;
drop materialized view if exists public.vw_ranking_servicos_recorrentes;

create materialized view public.vw_ranking_servicos_recorrentes as
select
  servico_nome as label,
  count(*) as itens,
  coalesce(sum(quantidade), 0) as quantidade,
  coalesce(sum(valor_total), 0) as valor_total
from public.servicos_itens
group by servico_nome
order by valor_total desc nulls last;

create unique index if not exists vw_ranking_servicos_recorrentes_label_idx
  on public.vw_ranking_servicos_recorrentes(label);

grant select on public.vw_ranking_servicos_recorrentes to anon, authenticated, service_role;

alter table public.users enable row level security;
alter table public.clientes enable row level security;
alter table public.cliente_contatos enable row level security;
alter table public.vendas_itens enable row level security;
alter table public.servicos_itens enable row level security;
alter table public.interacoes enable row level security;
alter table public.tarefas enable row level security;
alter table public.oportunidades_cache enable row level security;
alter table public.oportunidades enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.orcamento_versoes enable row level security;
alter table public.orcamento_condicoes enable row level security;
alter table public.orcamento_aprovacoes enable row level security;
alter table public.metas_vendedores enable row level security;
alter table public.produtos enable row level security;
alter table public.produto_aliases enable row level security;
alter table public.listas_preco enable row level security;
alter table public.catalogo_itens enable row level security;
alter table public.catalogo_regras_desconto enable row level security;
alter table public.catalogo_midias enable row level security;
alter table public.catalogo_precos enable row level security;
alter table public.produto_precos enable row level security;
alter table public.campanhas enable row level security;
alter table public.campanha_envios enable row level security;
alter table public.importacoes enable row level security;
alter table public.importacao_conflitos enable row level security;
alter table public.cliente_alteracoes enable row level security;
alter table public.cliente_mesclagens enable row level security;

create or replace function public.current_app_user()
returns public.users
language sql
stable
security definer
set search_path = public
as $$
  select u
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.ativo = true
  limit 1
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.ativo = true
      and u.role = 'admin'
  )
$$;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.ativo = true
  limit 1
$$;

create policy users_read_self_or_admin
on public.users for select
using (public.current_user_is_admin() or auth_user_id = auth.uid());

create policy clientes_read_own_or_admin
on public.clientes for select
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy clientes_write_admin
on public.clientes for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy clientes_update_own_commercial
on public.clientes for update
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id())
with check (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy cliente_contatos_read_own_or_admin
on public.cliente_contatos for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = cliente_contatos.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

create policy vendas_read_own_or_admin
on public.vendas_itens for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = vendas_itens.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

create policy servicos_read_own_or_admin
on public.servicos_itens for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = servicos_itens.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

create policy interacoes_read_own_or_admin
on public.interacoes for select
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = interacoes.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

create policy interacoes_insert_own_or_admin
on public.interacoes for insert
with check (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
);

create policy tarefas_read_own_or_admin
on public.tarefas for select
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy tarefas_write_own_or_admin
on public.tarefas for all
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id())
with check (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy oportunidades_cache_read_own_or_admin
on public.oportunidades_cache for select
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
);

create policy admin_manage_oportunidades_cache
on public.oportunidades_cache for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

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

create policy orcamentos_read_own_or_admin
on public.orcamentos for select
using (
  public.current_user_is_admin()
  or vendedor_id = public.current_app_user_id()
  or exists (
    select 1 from public.clientes c
    where c.id = orcamentos.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

create policy orcamentos_write_own_or_admin
on public.orcamentos for all
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id())
with check (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy orcamento_itens_read_own_or_admin
on public.orcamento_itens for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);

create policy orcamento_itens_write_own_or_admin
on public.orcamento_itens for all
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
)
with check (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);

create policy orcamento_versoes_read_own_or_admin
on public.orcamento_versoes for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_versoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);

create policy orcamento_versoes_write_own_or_admin
on public.orcamento_versoes for all
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_versoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
)
with check (
  public.current_user_is_admin()
  or exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_versoes.orcamento_id
      and o.vendedor_id = public.current_app_user_id()
  )
);

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

create policy metas_vendedores_read_admin
on public.metas_vendedores for select
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy metas_vendedores_write_admin
on public.metas_vendedores for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy produtos_read_authenticated
on public.produtos for select
using (auth.role() = 'authenticated');

create policy produto_aliases_read_authenticated
on public.produto_aliases for select
using (auth.role() = 'authenticated');

create policy listas_preco_read_authenticated
on public.listas_preco for select
using (auth.role() = 'authenticated');

create policy catalogo_itens_read_authenticated
on public.catalogo_itens for select
using (auth.role() = 'authenticated');

create policy catalogo_precos_read_authenticated
on public.catalogo_precos for select
using (auth.role() = 'authenticated');

create policy catalogo_regras_desconto_read_authenticated
on public.catalogo_regras_desconto for select
using (auth.role() = 'authenticated');

create policy catalogo_midias_read_authenticated
on public.catalogo_midias for select
to authenticated
using (true);

create policy catalogo_midias_read_anon
on public.catalogo_midias for select
to anon
using (ativo = true);

create policy produto_precos_read_authenticated
on public.produto_precos for select
using (auth.role() = 'authenticated');

create policy admin_manage_produtos
on public.produtos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_produto_aliases
on public.produto_aliases for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_listas_preco
on public.listas_preco for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_catalogo_itens
on public.catalogo_itens for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_catalogo_precos
on public.catalogo_precos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_catalogo_regras_desconto
on public.catalogo_regras_desconto for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_catalogo_midias
on public.catalogo_midias for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogo-fotos',
  'catalogo-fotos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy catalogo_fotos_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'catalogo-fotos');

create policy admin_manage_catalogo_fotos
on storage.objects for all
to authenticated
using (bucket_id = 'catalogo-fotos' and public.current_user_is_admin())
with check (bucket_id = 'catalogo-fotos' and public.current_user_is_admin());

create policy admin_manage_produto_precos
on public.produto_precos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy campanha_envios_read_own_or_admin
on public.campanha_envios for select
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy campanha_envios_write_own_or_admin
on public.campanha_envios for all
using (public.current_user_is_admin() or vendedor_id = public.current_app_user_id())
with check (public.current_user_is_admin() or vendedor_id = public.current_app_user_id());

create policy admin_manage_operational_tables
on public.importacoes for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_import_conflicts
on public.importacao_conflitos for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy admin_manage_campaigns
on public.campanhas for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy campanhas_vendedor_manage_own
on public.campanhas for all
using (criada_por = public.current_app_user_id())
with check (criada_por = public.current_app_user_id());

create policy cliente_alteracoes_read_own_or_admin
on public.cliente_alteracoes for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = cliente_alteracoes.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

create policy admin_manage_cliente_mesclagens
on public.cliente_mesclagens for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

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

create policy sequencias_read_all
on public.sequencias_comerciais for select
using (true);

create policy sequencias_admin_write
on public.sequencias_comerciais for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy sequencia_etapas_read_all
on public.sequencia_etapas for select
using (true);

create policy sequencia_etapas_admin_write
on public.sequencia_etapas for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

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

create table if not exists public.automacao_regras (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  evento text not null,
  acao text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.automacao_logs (
  id uuid primary key default gen_random_uuid(),
  regra_codigo text not null,
  entidade_tipo text not null,
  entidade_id uuid,
  resultado text not null,
  criado_em timestamptz not null default now()
);

create index if not exists automacao_logs_regra_idx on public.automacao_logs(regra_codigo, criado_em desc);
create index if not exists automacao_logs_entidade_idx on public.automacao_logs(entidade_tipo, entidade_id, criado_em desc);

drop trigger if exists automacao_regras_set_atualizado_em on public.automacao_regras;
create trigger automacao_regras_set_atualizado_em
before update on public.automacao_regras
for each row execute function public.set_atualizado_em();

alter table public.automacao_regras enable row level security;
alter table public.automacao_logs enable row level security;

create policy automacao_regras_read_admin
on public.automacao_regras for select
using (public.current_user_is_admin());

create policy automacao_logs_read_admin
on public.automacao_logs for select
using (public.current_user_is_admin());

create policy automacao_regras_admin_write
on public.automacao_regras for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy automacao_logs_insert_authenticated
on public.automacao_logs for insert
with check (auth.role() = 'authenticated' or public.current_user_is_admin());
