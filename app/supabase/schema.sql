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
  vendedor_id uuid references public.users(id),
  status_comercial cliente_status not null default 'novo',
  origem text,
  origem_base text not null default 'desconhecida' check (origem_base in ('capital_truck', 'rodobens', 'desconhecida')),
  origem_detalhe text,
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
  quantidade numeric(12, 3) not null default 1,
  valor_unitario numeric(14, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  desconto_percentual numeric(8, 2),
  observacao text
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
  criado_em timestamptz not null default now(),
  unique (campanha_id, cliente_id)
);

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
create index clientes_nome_idx on public.clientes(nome);
create index clientes_ultima_compra_idx on public.clientes(ultima_compra_em desc);
create index vendas_cliente_data_idx on public.vendas_itens(cliente_id, data_venda desc);
create index servicos_cliente_data_idx on public.servicos_itens(cliente_id, data_servico desc);
create index interacoes_cliente_data_idx on public.interacoes(cliente_id, data_interacao desc);
create index tarefas_vendedor_vencimento_idx on public.tarefas(vendedor_id, data_vencimento);

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

    if new.status in ('ganho', 'perdido') then
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

  return new;
end;
$$;

create trigger clientes_auditar_alteracoes
after update on public.clientes
for each row execute function public.auditar_cliente_alteracoes();

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

create or replace view public.oportunidades_clientes as
select
  c.id as cliente_id,
  c.nome as cliente_nome,
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
  'recompra_90',
  'Mais de 90 dias sem compra.',
  'Enviar WhatsApp de recompra',
  public.calcular_score_oportunidade(c) + 15,
  c.status_comercial = 'nao_contatar'
from public.clientes c
where c.excluido_em is null
  and coalesce(current_date - c.ultima_compra_em, 9999) > 90

union all

select
  c.id,
  c.nome,
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
  'sem_whatsapp',
  'Cadastro sem WhatsApp valido.',
  'Atualizar cadastro',
  55,
  c.status_comercial = 'nao_contatar'
from public.clientes c
where c.excluido_em is null
  and nullif(c.whatsapp_principal, '') is null;

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
  (select count(*) from public.campanha_envios ce where ce.status = 'virou_orcamento') as campanhas_viraram_orcamento;

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

create or replace view public.vw_ranking_medidas_vendidas as
select
  coalesce(nullif(medida, ''), produto_nome) as label,
  count(*) as itens,
  coalesce(sum(quantidade), 0) as quantidade,
  coalesce(sum(valor_total), 0) as valor_total
from public.vendas_itens
group by coalesce(nullif(medida, ''), produto_nome)
order by valor_total desc nulls last;

create or replace view public.vw_ranking_servicos_recorrentes as
select
  servico_nome as label,
  count(*) as itens,
  coalesce(sum(quantidade), 0) as quantidade,
  coalesce(sum(valor_total), 0) as valor_total
from public.servicos_itens
group by servico_nome
order by valor_total desc nulls last;

alter table public.users enable row level security;
alter table public.clientes enable row level security;
alter table public.cliente_contatos enable row level security;
alter table public.vendas_itens enable row level security;
alter table public.servicos_itens enable row level security;
alter table public.interacoes enable row level security;
alter table public.tarefas enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.produtos enable row level security;
alter table public.produto_aliases enable row level security;
alter table public.listas_preco enable row level security;
alter table public.catalogo_itens enable row level security;
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
