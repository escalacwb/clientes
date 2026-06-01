create extension if not exists unaccent;

alter table public.cliente_contatos
  add column if not exists tipo text,
  add column if not exists origem_sistema text not null default 'crm',
  add column if not exists origem_id text,
  add column if not exists prioridade integer not null default 50,
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists ultimo_uso_em timestamptz,
  add column if not exists valido boolean not null default true,
  add column if not exists raw_data jsonb not null default '{}'::jsonb;

create index if not exists cliente_contatos_cliente_prioridade_idx
on public.cliente_contatos(cliente_id, valido, prioridade desc, atualizado_em desc);

drop index if exists public.cliente_contatos_origem_uidx;
create unique index cliente_contatos_origem_uidx
on public.cliente_contatos(cliente_id, origem_sistema, origem_id);

create table if not exists public.patio_clientes_snapshot (
  patio_cliente_id bigint primary key,
  cliente_id uuid references public.clientes(id) on delete set null,
  match_tipo text not null default 'nao_vinculado',
  match_score integer not null default 0,
  nome_empresa text,
  nome_fantasia text,
  cidade text,
  uf text,
  codigo_antigo text,
  cnpj text,
  nome_contato text,
  telefone text,
  email text,
  nome_responsavel text,
  contato_responsavel text,
  data_atualizacao_contato timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now()
);

create index if not exists patio_clientes_snapshot_cliente_idx
on public.patio_clientes_snapshot(cliente_id);

create index if not exists patio_clientes_snapshot_codigo_idx
on public.patio_clientes_snapshot(codigo_antigo);

create table if not exists public.patio_veiculos_snapshot (
  patio_veiculo_id bigint primary key,
  cliente_id uuid references public.clientes(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  patio_cliente_id bigint references public.patio_clientes_snapshot(patio_cliente_id) on delete set null,
  match_tipo text not null default 'nao_vinculado',
  match_score integer not null default 0,
  placa text,
  empresa text,
  modelo text,
  ano_modelo integer,
  nome_motorista text,
  contato_motorista text,
  media_km_diaria numeric(12, 2),
  data_revisao_proativa date,
  data_atualizacao_contato timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now()
);

create index if not exists patio_veiculos_snapshot_cliente_idx
on public.patio_veiculos_snapshot(cliente_id);

create index if not exists patio_veiculos_snapshot_placa_idx
on public.patio_veiculos_snapshot(placa);

create table if not exists public.patio_atendimentos (
  patio_execucao_id bigint primary key,
  cliente_id uuid references public.clientes(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  patio_cliente_id bigint references public.patio_clientes_snapshot(patio_cliente_id) on delete set null,
  patio_veiculo_id bigint references public.patio_veiculos_snapshot(patio_veiculo_id) on delete set null,
  placa_snapshot text,
  cliente_nome_snapshot text,
  box_id integer,
  funcionario_id integer,
  quilometragem integer,
  status text,
  inicio_execucao timestamptz,
  fim_execucao timestamptz,
  usuario_alocacao_id bigint,
  usuario_finalizacao_id bigint,
  nome_motorista text,
  contato_motorista text,
  data_feedback timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now()
);

create index if not exists patio_atendimentos_cliente_data_idx
on public.patio_atendimentos(cliente_id, fim_execucao desc);

create index if not exists patio_atendimentos_veiculo_data_idx
on public.patio_atendimentos(veiculo_id, fim_execucao desc);

create table if not exists public.patio_atendimento_itens (
  id uuid primary key default gen_random_uuid(),
  patio_item_id bigint not null,
  patio_tabela_origem text not null,
  patio_execucao_id bigint references public.patio_atendimentos(patio_execucao_id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  area text not null check (area in ('borracharia', 'alinhamento', 'manutencao')),
  servico_nome text,
  descricao text,
  quantidade integer,
  status text,
  box_id integer,
  funcionario_id integer,
  quilometragem integer,
  observacao_cadastro text,
  observacao_execucao text,
  tipo_atendimento text,
  solicitado_em timestamptz,
  atualizado_em timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now(),
  unique (patio_tabela_origem, patio_item_id)
);

create index if not exists patio_atendimento_itens_cliente_idx
on public.patio_atendimento_itens(cliente_id, solicitado_em desc);

create index if not exists patio_atendimento_itens_servico_idx
on public.patio_atendimento_itens(area, servico_nome);

create table if not exists public.crm_patio_conflitos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  severidade text not null default 'media',
  cliente_id uuid references public.clientes(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  patio_cliente_id bigint,
  patio_veiculo_id bigint,
  resumo text not null,
  dados jsonb not null default '{}'::jsonb,
  status text not null default 'aberto' check (status in ('aberto', 'ignorado', 'resolvido')),
  resolvido_por uuid references public.users(id),
  resolvido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists crm_patio_conflitos_status_idx
on public.crm_patio_conflitos(status, severidade, criado_em desc);

create or replace view public.vw_cliente_contatos_recomendados
with (security_invoker = true) as
with contatos as (
  select
    c.id as cliente_id,
    c.nome as cliente_nome,
    cc.id as contato_id,
    cc.nome,
    coalesce(cc.tipo, 'cadastro') as tipo,
    nullif(coalesce(cc.whatsapp, cc.telefone), '') as whatsapp,
    cc.email,
    cc.origem_sistema,
    cc.prioridade,
    cc.atualizado_em,
    cc.valido,
    cc.raw_data
  from public.clientes c
  join public.cliente_contatos cc on cc.cliente_id = c.id
  where c.excluido_em is null
    and cc.valido = true
    and nullif(coalesce(cc.whatsapp, cc.telefone, cc.email), '') is not null

  union all

  select
    c.id,
    c.nome,
    null::uuid,
    c.responsavel_nome,
    'cadastro',
    nullif(coalesce(c.whatsapp_principal, c.telefone_principal), ''),
    c.email,
    'crm',
    30,
    c.atualizado_em,
    true,
    jsonb_build_object('fallback', true)
  from public.clientes c
  where c.excluido_em is null
    and nullif(coalesce(c.whatsapp_principal, c.telefone_principal, c.email), '') is not null
)
select distinct on (cliente_id)
  *
from contatos
order by
  cliente_id,
  case origem_sistema when 'patio' then 0 else 1 end,
  prioridade desc,
  atualizado_em desc nulls last;

create or replace view public.vw_patio_crm_oportunidades
with (security_invoker = true) as
with ultimos_atendimentos as (
  select distinct on (pa.cliente_id)
    pa.cliente_id,
    pa.fim_execucao,
    pa.quilometragem,
    pa.placa_snapshot,
    pa.nome_motorista,
    pa.contato_motorista
  from public.patio_atendimentos pa
  where pa.cliente_id is not null
    and pa.status = 'finalizado'
  order by pa.cliente_id, pa.fim_execucao desc nulls last
),
servico_recente_sem_venda_pneu as (
  select distinct pai.cliente_id
  from public.patio_atendimento_itens pai
  where pai.cliente_id is not null
    and coalesce(pai.solicitado_em, pai.atualizado_em, now()) >= now() - interval '45 days'
    and (
      unaccent(coalesce(pai.servico_nome, '')) ilike unaccent('%MONTAGEM%')
      or unaccent(coalesce(pai.servico_nome, '')) ilike unaccent('%TROCA DE PNEU%')
      or unaccent(coalesce(pai.descricao, '')) ilike unaccent('%PNEU%')
    )
    and not exists (
      select 1
      from public.vendas_itens v
      where v.cliente_id = pai.cliente_id
        and v.data_venda >= coalesce(pai.solicitado_em, pai.atualizado_em, now())::date - 15
        and v.data_venda <= coalesce(pai.solicitado_em, pai.atualizado_em, now())::date + 15
        and unaccent(coalesce(v.produto_nome, '')) ilike unaccent('%PNEU%')
    )
),
venda_pneu_sem_servico as (
  select distinct v.cliente_id
  from public.vendas_itens v
  where v.data_venda >= current_date - 45
    and unaccent(coalesce(v.produto_nome, '')) ilike unaccent('%PNEU%')
    and not exists (
      select 1
      from public.patio_atendimento_itens pai
      where pai.cliente_id = v.cliente_id
        and coalesce(pai.solicitado_em, pai.atualizado_em, now())::date between v.data_venda - 15 and v.data_venda + 15
        and (
          unaccent(coalesce(pai.servico_nome, '')) ilike unaccent('%MONTAGEM%')
          or unaccent(coalesce(pai.servico_nome, '')) ilike unaccent('%BALANCEAMENTO%')
          or unaccent(coalesce(pai.servico_nome, '')) ilike unaccent('%ALINHAMENTO%')
        )
    )
),
feedback_pendente as (
  select distinct pa.cliente_id
  from public.patio_atendimentos pa
  where pa.cliente_id is not null
    and pa.status = 'finalizado'
    and pa.data_feedback is null
    and pa.fim_execucao >= now() - interval '30 days'
),
contato_patio_novo as (
  select distinct cc.cliente_id
  from public.cliente_contatos cc
  where cc.origem_sistema = 'patio'
    and cc.valido = true
    and cc.atualizado_em >= now() - interval '30 days'
)
select
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.vendedor_id,
  'patio_feedback_pendente' as tipo,
  concat('Atendimento finalizado no patio sem feedback recente', coalesce(' na placa ' || ua.placa_snapshot, ''), '.') as motivo,
  'Registrar feedback e avaliar recompra' as proxima_acao,
  92 as prioridade,
  c.status_comercial = 'nao_contatar' as bloqueada
from feedback_pendente fp
join public.clientes c on c.id = fp.cliente_id
left join ultimos_atendimentos ua on ua.cliente_id = c.id
where c.excluido_em is null

union all

select
  c.id,
  c.nome,
  c.vendedor_id,
  'patio_servico_sem_venda_pneu',
  'Cliente fez servico de pneu no patio sem venda de pneu vinculada no periodo.',
  'Entender origem do pneu e oferecer recompra',
  86,
  c.status_comercial = 'nao_contatar'
from servico_recente_sem_venda_pneu s
join public.clientes c on c.id = s.cliente_id
where c.excluido_em is null

union all

select
  c.id,
  c.nome,
  c.vendedor_id,
  'crm_pneu_sem_servico_patio',
  'Cliente comprou pneu e nao ha servico de montagem/alinhamento vinculado no patio.',
  'Oferecer montagem, balanceamento ou alinhamento',
  82,
  c.status_comercial = 'nao_contatar'
from venda_pneu_sem_servico v
join public.clientes c on c.id = v.cliente_id
where c.excluido_em is null

union all

select
  c.id,
  c.nome,
  c.vendedor_id,
  'patio_contato_atualizado',
  'Contato novo ou atualizado no patio pode melhorar a abordagem comercial.',
  'Validar contato recomendado antes da proxima campanha',
  68,
  c.status_comercial = 'nao_contatar'
from contato_patio_novo cp
join public.clientes c on c.id = cp.cliente_id
where c.excluido_em is null;

create or replace view public.oportunidades_clientes
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
    'Lead externo sem primeiro contato registrado.',
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
    'Campanha de reativacao',
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

  union all

  select
    po.cliente_id,
    po.cliente_nome,
    po.vendedor_id,
    po.tipo,
    po.motivo,
    po.proxima_acao,
    po.prioridade,
    po.bloqueada
  from public.vw_patio_crm_oportunidades po
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

alter table public.patio_clientes_snapshot enable row level security;
alter table public.patio_veiculos_snapshot enable row level security;
alter table public.patio_atendimentos enable row level security;
alter table public.patio_atendimento_itens enable row level security;
alter table public.crm_patio_conflitos enable row level security;

drop policy if exists patio_clientes_snapshot_read_own_or_admin on public.patio_clientes_snapshot;
create policy patio_clientes_snapshot_read_own_or_admin
on public.patio_clientes_snapshot for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = patio_clientes_snapshot.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists patio_veiculos_snapshot_read_own_or_admin on public.patio_veiculos_snapshot;
create policy patio_veiculos_snapshot_read_own_or_admin
on public.patio_veiculos_snapshot for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = patio_veiculos_snapshot.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists patio_atendimentos_read_own_or_admin on public.patio_atendimentos;
create policy patio_atendimentos_read_own_or_admin
on public.patio_atendimentos for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = patio_atendimentos.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists patio_atendimento_itens_read_own_or_admin on public.patio_atendimento_itens;
create policy patio_atendimento_itens_read_own_or_admin
on public.patio_atendimento_itens for select
using (
  public.current_user_is_admin()
  or exists (
    select 1 from public.clientes c
    where c.id = patio_atendimento_itens.cliente_id
      and c.vendedor_id = public.current_app_user_id()
  )
);

drop policy if exists crm_patio_conflitos_read_admin on public.crm_patio_conflitos;
create policy crm_patio_conflitos_read_admin
on public.crm_patio_conflitos for select
using (public.current_user_is_admin());

drop policy if exists service_manage_patio_integracao on public.patio_clientes_snapshot;
create policy service_manage_patio_integracao
on public.patio_clientes_snapshot for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());

drop policy if exists service_manage_patio_veiculos on public.patio_veiculos_snapshot;
create policy service_manage_patio_veiculos
on public.patio_veiculos_snapshot for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());

drop policy if exists service_manage_patio_atendimentos on public.patio_atendimentos;
create policy service_manage_patio_atendimentos
on public.patio_atendimentos for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());

drop policy if exists service_manage_patio_atendimento_itens on public.patio_atendimento_itens;
create policy service_manage_patio_atendimento_itens
on public.patio_atendimento_itens for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());

drop policy if exists service_manage_crm_patio_conflitos on public.crm_patio_conflitos;
create policy service_manage_crm_patio_conflitos
on public.crm_patio_conflitos for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());

grant select on public.vw_cliente_contatos_recomendados to anon, authenticated, service_role;
grant select on public.vw_patio_crm_oportunidades to anon, authenticated, service_role;

select public.refresh_oportunidades_cache();
