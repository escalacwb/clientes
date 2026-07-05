-- Integra a conclusao do Patio com a preparacao de vendas OMSYS.
-- A venda e preparada por visita consolidada do caminhao, nao por servico individual.

create table if not exists public.patio_omsys_config (
  chave text primary key,
  valor text not null,
  descricao text,
  atualizado_em timestamptz not null default now()
);

insert into public.patio_omsys_config (chave, valor, descricao)
values
  ('cliente_consumidor_codigo', '55555', 'Cliente OMSYS usado quando o cliente do Patio nao tem codigo ERP confirmado.'),
  ('vendedor_padrao_codigo', '0026', 'Vendedor padrao para vendas geradas pelo Patio: Mateus Silva.'),
  ('tecnico_padrao_codigo', '000117', 'Fallback tecnico OMSYS de emergencia; novas vendas do Patio devem usar funcionario com codigo OMSYS.'),
  ('natureza_padrao_codigo', '5102', 'Natureza padrao da tela de venda OMSYS.'),
  ('transportador_padrao_codigo', '0001', 'Transportador padrao da tela de venda OMSYS.'),
  ('codt_servico_padrao', '999', 'SITR/Codt padrao exigido pela tela de venda para itens de servico.'),
  ('carencia_minutos', '10', 'Tempo minimo depois da ultima finalizacao para evitar exportar antes de todos os servicos do caminhao.'),
  ('omsys_venda_url', 'http://capitalpneus.omsys.info:8081/omsys/cadvenda.php', 'Tela de vendas OMSYS usada quando o operador confirma abertura manual da venda.')
on conflict (chave) do update
set descricao = excluded.descricao,
    atualizado_em = now();

update public.patio_omsys_config
set valor = '0',
    descricao = 'Sem carencia: a pergunta de abertura da venda acontece quando o ultimo servico do caminhao e finalizado.',
    atualizado_em = now()
where chave = 'carencia_minutos';

update public.patio_omsys_config
set valor = 'http://capitalpneus.omsys.info:8081/omsys/cadvenda.php',
    descricao = 'Tela de vendas OMSYS usada quando o operador confirma abertura manual da venda.',
    atualizado_em = now()
where chave = 'omsys_venda_url'
  and valor like '%cadvenda_acao1.php%';

update public.patio_omsys_vendas_exportacoes
set payload = jsonb_set(
      payload,
      '{url_sistema}',
      to_jsonb('http://capitalpneus.omsys.info:8081/omsys/cadvenda.php'::text),
      true
    ),
    atualizado_em = now()
where payload->>'url_sistema' like '%cadvenda_acao1.php%';

insert into public.patio_omsys_config (chave, valor, descricao)
select
  'exportar_apenas_apos',
  now()::text,
  'Corte operacional: visitas finalizadas antes deste momento sao consideradas ja lancadas no OMSYS.'
where not exists (
  select 1
  from public.patio_omsys_config
  where chave = 'exportar_apenas_apos'
);

create or replace function public.patio_omsys_norm(p_text text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(
      upper(coalesce(p_text, '')),
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'AAAAAEEEEIIIIOOOOOUUUUC'
    ),
    '[^A-Z0-9]+',
    '',
    'g'
  )
$$;

create or replace function public.patio_inferir_area_servico(p_nome text)
returns text
language sql
immutable
as $$
  select case
    when public.patio_omsys_norm(p_nome) like '%ALINH%'
      or public.patio_omsys_norm(p_nome) like '%BALANCE%'
      or public.patio_omsys_norm(p_nome) like '%CAMBAGEM%'
      or public.patio_omsys_norm(p_nome) like '%CASTER%'
      or public.patio_omsys_norm(p_nome) like '%CONVERGENCIA%'
      or public.patio_omsys_norm(p_nome) like '%SETBACK%' then 'alinhamento'
    when public.patio_omsys_norm(p_nome) like '%BUCHA%'
      or public.patio_omsys_norm(p_nome) like '%TERMINAL%'
      or public.patio_omsys_norm(p_nome) like '%GRAMPO%'
      or public.patio_omsys_norm(p_nome) like '%JUMELO%'
      or public.patio_omsys_norm(p_nome) like '%TIRANTE%'
      or public.patio_omsys_norm(p_nome) like '%MOLAS%' then 'manutencao'
    else 'borracharia'
  end
$$;

create table if not exists public.patio_servico_catalogo_mapeamentos (
  id uuid primary key default gen_random_uuid(),
  patio_nome text not null,
  catalogo_item_id uuid references public.catalogo_itens(id) on delete set null,
  catalogo_codigo text,
  exportavel boolean not null default true,
  requer_revisao boolean not null default false,
  origem text not null default 'manual',
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint patio_servico_catalogo_mapeamentos_nome_chk check (btrim(patio_nome) <> '')
);

create unique index if not exists patio_servico_catalogo_mapeamentos_nome_idx
  on public.patio_servico_catalogo_mapeamentos (lower(btrim(patio_nome)));

insert into public.patio_servico_catalogo_mapeamentos (
  patio_nome,
  catalogo_item_id,
  catalogo_codigo,
  exportavel,
  requer_revisao,
  origem,
  observacao
)
select
  'BUCHA DE TIRANTE',
  ci.id,
  ci.codigo,
  true,
  false,
  'alias_importacao',
  'Servico do Patio apontado para o item importado TROCA BUCHA DE TIRANTE.'
from public.catalogo_itens ci
where ci.codigo = '000004611'
  and ci.tipo = 'servico'
  and not exists (
    select 1
    from public.patio_servico_catalogo_mapeamentos m
    where lower(btrim(m.patio_nome)) = lower(btrim('BUCHA DE TIRANTE'))
  )
limit 1;

insert into public.patio_servico_catalogo_mapeamentos (
  patio_nome,
  exportavel,
  requer_revisao,
  origem,
  observacao
)
select seed.patio_nome, false, true, 'bloqueio_sem_catalogo', 'Sem item equivalente confirmado no catalogo importado.'
from (values ('CONVERGENCIA'), ('CUNHA')) as seed(patio_nome)
where not exists (
  select 1
  from public.patio_servico_catalogo_mapeamentos m
  where lower(btrim(m.patio_nome)) = lower(btrim(seed.patio_nome))
);

with targets as (
  select *
  from (values
    ('CUNHA', '000004682', 'Cunha deve abrir como MAO DE OBRA.'),
    ('CONVERGENCIA', '000020500', 'Convergencia deve abrir como ALINHAMENTO.')
  ) as target(patio_nome, codigo, observacao)
),
resolved as (
  select
    target.patio_nome,
    target.codigo,
    target.observacao,
    ci.id as catalogo_item_id
  from targets target
  join lateral (
    select ci.*
    from public.catalogo_itens ci
    where ci.codigo = target.codigo
      and ci.tipo = 'servico'
      and coalesce(ci.ativo, true)
    order by ci.atualizado_em desc nulls last
    limit 1
  ) ci on true
)
update public.patio_servico_catalogo_mapeamentos m
set catalogo_item_id = resolved.catalogo_item_id,
    catalogo_codigo = resolved.codigo,
    exportavel = true,
    requer_revisao = false,
    origem = 'regra_operacional',
    observacao = resolved.observacao,
    atualizado_em = now()
from resolved
where lower(btrim(m.patio_nome)) = lower(btrim(resolved.patio_nome));

with targets as (
  select *
  from (values
    ('CUNHA', '000004682', 'Cunha deve abrir como MAO DE OBRA.'),
    ('CONVERGENCIA', '000020500', 'Convergencia deve abrir como ALINHAMENTO.')
  ) as target(patio_nome, codigo, observacao)
),
resolved as (
  select
    target.patio_nome,
    target.codigo,
    target.observacao,
    ci.id as catalogo_item_id
  from targets target
  join lateral (
    select ci.*
    from public.catalogo_itens ci
    where ci.codigo = target.codigo
      and ci.tipo = 'servico'
      and coalesce(ci.ativo, true)
    order by ci.atualizado_em desc nulls last
    limit 1
  ) ci on true
)
insert into public.patio_servico_catalogo_mapeamentos (
  patio_nome,
  catalogo_item_id,
  catalogo_codigo,
  exportavel,
  requer_revisao,
  origem,
  observacao
)
select
  resolved.patio_nome,
  resolved.catalogo_item_id,
  resolved.codigo,
  true,
  false,
  'regra_operacional',
  resolved.observacao
from resolved
where not exists (
  select 1
  from public.patio_servico_catalogo_mapeamentos m
  where lower(btrim(m.patio_nome)) = lower(btrim(resolved.patio_nome))
);

alter table public.patio_catalogo_servicos_snapshot
  add column if not exists catalogo_item_id uuid references public.catalogo_itens(id) on delete set null,
  add column if not exists catalogo_codigo text,
  add column if not exists catalogo_tipo text,
  add column if not exists preco numeric,
  add column if not exists link_status text,
  add column if not exists exportavel boolean not null default true,
  add column if not exists requer_revisao boolean not null default false,
  add column if not exists atualizado_em timestamptz not null default now();

create or replace function public.refresh_patio_catalogo_servicos_linkado()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_catalogo_upserts integer := 0;
  v_match_exato integer := 0;
  v_mapeamentos integer := 0;
  v_bloqueados integer := 0;
begin
  with catalogo_importado as (
    select
      public.patio_inferir_area_servico(ci.descricao) as area,
      btrim(ci.descricao) as nome,
      ci.id as catalogo_item_id,
      ci.codigo as catalogo_codigo,
      ci.tipo as catalogo_tipo,
      cp.valor as preco,
      row_number() over (
        partition by public.patio_inferir_area_servico(ci.descricao), btrim(ci.descricao)
        order by ci.atualizado_em desc nulls last, ci.id
      ) as rn
    from public.catalogo_itens ci
    left join lateral (
      select valor
      from public.catalogo_precos cp
      where cp.catalogo_item_id = ci.id
      order by cp.vigencia_inicio desc nulls last, cp.criado_em desc
      limit 1
    ) cp on true
    where ci.tipo = 'servico'
      and coalesce(ci.ativo, true)
      and btrim(coalesce(ci.descricao, '')) <> ''
  )
  insert into public.patio_catalogo_servicos_snapshot (
    area,
    nome,
    origem,
    catalogo_item_id,
    catalogo_codigo,
    catalogo_tipo,
    preco,
    link_status,
    exportavel,
    requer_revisao,
    sincronizado_em,
    atualizado_em
  )
  select
    area,
    nome,
    'catalogo_importado',
    catalogo_item_id,
    catalogo_codigo,
    catalogo_tipo,
    preco,
    'catalogo_importado',
    true,
    false,
    now(),
    now()
  from catalogo_importado
  where rn = 1
  on conflict (area, nome) do update
  set origem = excluded.origem,
      catalogo_item_id = excluded.catalogo_item_id,
      catalogo_codigo = excluded.catalogo_codigo,
      catalogo_tipo = excluded.catalogo_tipo,
      preco = excluded.preco,
      link_status = excluded.link_status,
      exportavel = excluded.exportavel,
      requer_revisao = excluded.requer_revisao,
      sincronizado_em = now(),
      atualizado_em = now();

  get diagnostics v_catalogo_upserts = row_count;

  with matches as (
    select
      s.area,
      s.nome,
      ci.id,
      ci.codigo,
      ci.tipo,
      cp.valor,
      row_number() over (
        partition by s.area, s.nome
        order by case when ci.tipo = 'servico' then 0 else 1 end, ci.atualizado_em desc nulls last
      ) as rn
    from public.patio_catalogo_servicos_snapshot s
    join public.catalogo_itens ci
      on ci.tipo in ('servico', 'produto')
     and coalesce(ci.ativo, true)
     and public.patio_omsys_norm(s.nome) = public.patio_omsys_norm(ci.descricao)
    left join lateral (
      select valor
      from public.catalogo_precos cp
      where cp.catalogo_item_id = ci.id
      order by cp.vigencia_inicio desc nulls last, cp.criado_em desc
      limit 1
    ) cp on true
  )
  update public.patio_catalogo_servicos_snapshot s
  set catalogo_item_id = ci.id,
      catalogo_codigo = ci.codigo,
      catalogo_tipo = ci.tipo,
      preco = ci.valor,
      link_status = 'match_exato_catalogo',
      exportavel = true,
      requer_revisao = false,
      sincronizado_em = now(),
      atualizado_em = now()
  from matches ci
  where ci.rn = 1
    and s.area = ci.area
    and s.nome = ci.nome;

  get diagnostics v_match_exato = row_count;

  update public.patio_catalogo_servicos_snapshot s
  set catalogo_item_id = coalesce(mapped.catalogo_item_id, mapped.catalogo_item_resolvido_id),
      catalogo_codigo = coalesce(mapped.catalogo_codigo, mapped.catalogo_codigo_resolvido),
      catalogo_tipo = mapped.catalogo_tipo,
      preco = mapped.preco,
      link_status = case
        when mapped.exportavel then 'mapeamento_manual'
        else 'bloqueado_revisao'
      end,
      exportavel = mapped.exportavel,
      requer_revisao = mapped.requer_revisao,
      sincronizado_em = now(),
      atualizado_em = now()
  from (
    select
      m.patio_nome,
      m.catalogo_item_id,
      m.catalogo_codigo,
      m.exportavel,
      m.requer_revisao,
      ci.id as catalogo_item_resolvido_id,
      ci.codigo as catalogo_codigo_resolvido,
      ci.tipo as catalogo_tipo,
      cp.valor as preco
    from public.patio_servico_catalogo_mapeamentos m
    left join lateral (
      select ci.*
      from public.catalogo_itens ci
      where coalesce(ci.ativo, true)
        and (
          ci.id = m.catalogo_item_id
          or (m.catalogo_item_id is null and m.catalogo_codigo is not null and ci.codigo = m.catalogo_codigo)
        )
      order by case when ci.tipo = 'servico' then 0 else 1 end, ci.atualizado_em desc nulls last
      limit 1
    ) ci on true
    left join lateral (
      select valor
      from public.catalogo_precos cp
      where cp.catalogo_item_id = ci.id
      order by cp.vigencia_inicio desc nulls last, cp.criado_em desc
      limit 1
    ) cp on true
  ) mapped
  where public.patio_omsys_norm(s.nome) = public.patio_omsys_norm(mapped.patio_nome);

  get diagnostics v_mapeamentos = row_count;

  update public.patio_catalogo_servicos_snapshot s
  set link_status = 'sem_item_catalogo',
      exportavel = false,
      requer_revisao = true,
      atualizado_em = now()
  where s.catalogo_item_id is null
    and coalesce(s.exportavel, true);

  get diagnostics v_bloqueados = row_count;

  return jsonb_build_object(
    'catalogo_upserts', v_catalogo_upserts,
    'matches_exatos', v_match_exato,
    'mapeamentos_aplicados', v_mapeamentos,
    'bloqueados_sem_catalogo', v_bloqueados
  );
end;
$$;

select public.refresh_patio_catalogo_servicos_linkado();

create or replace view public.vw_patio_catalogo_servicos
with (security_invoker = true) as
select
  area,
  nome,
  catalogo_item_id,
  catalogo_codigo,
  catalogo_tipo,
  preco::numeric as preco,
  link_status,
  exportavel,
  requer_revisao
from public.patio_catalogo_servicos_snapshot
where coalesce(exportavel, true)
order by area, nome;

create or replace view public.vw_patio_catalogo_itens_omsys
with (security_invoker = true) as
select
  ci.id as catalogo_item_id,
  ci.tipo,
  ci.codigo,
  ci.descricao as nome,
  public.patio_inferir_area_servico(ci.descricao) as area_sugerida,
  cp.valor as preco,
  ci.unidade,
  ci.grupo,
  ci.subgrupo,
  ci.marca,
  ci.ativo,
  ci.atualizado_em
from public.catalogo_itens ci
left join lateral (
  select valor
  from public.catalogo_precos cp
  where cp.catalogo_item_id = ci.id
  order by cp.vigencia_inicio desc nulls last, cp.criado_em desc
  limit 1
) cp on true
where ci.tipo in ('servico', 'produto')
  and coalesce(ci.ativo, true)
order by ci.tipo, ci.descricao;

create or replace view public.vw_patio_catalogo_servicos_omsys
with (security_invoker = true) as
select distinct on (area_sugerida, nome)
  area_sugerida as area,
  nome,
  catalogo_item_id,
  codigo as catalogo_codigo,
  tipo as catalogo_tipo,
  preco::numeric as preco,
  'catalogo_omsys'::text as link_status,
  true::boolean as exportavel,
  false::boolean as requer_revisao
from public.vw_patio_catalogo_itens_omsys
where tipo = 'servico'
  and area_sugerida in ('borracharia', 'alinhamento', 'manutencao')
  and btrim(coalesce(nome, '')) <> ''
order by area_sugerida, nome, atualizado_em desc nulls last, catalogo_item_id;

create or replace view public.vw_patio_catalogo_servicos
with (security_invoker = true) as
select
  area,
  nome,
  catalogo_item_id,
  catalogo_codigo,
  catalogo_tipo,
  preco,
  link_status,
  exportavel,
  requer_revisao
from public.vw_patio_catalogo_servicos_omsys
order by area, nome;

create or replace function public.mobile_catalog_items()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'servicos', jsonb_build_object(
      'borracharia', coalesce(jsonb_agg(nome order by nome) filter (where tipo = 'servico' and area_sugerida = 'borracharia'), '[]'::jsonb),
      'alinhamento', coalesce(jsonb_agg(nome order by nome) filter (where tipo = 'servico' and area_sugerida = 'alinhamento'), '[]'::jsonb),
      'manutencao', coalesce(jsonb_agg(nome order by nome) filter (where tipo = 'servico' and area_sugerida = 'manutencao'), '[]'::jsonb)
    ),
    'produtos', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', catalogo_item_id,
          'codigo', codigo,
          'nome', nome,
          'preco', preco,
          'grupo', grupo,
          'subgrupo', subgrupo,
          'marca', marca
        )
        order by nome
      ) filter (where tipo = 'produto'),
      '[]'::jsonb
    )
  )
  from public.vw_patio_catalogo_itens_omsys
$$;

create table if not exists public.patio_omsys_vendas_exportacoes (
  id uuid primary key default gen_random_uuid(),
  visita_chave text not null unique,
  status text not null default 'pendente',
  patio_veiculo_id bigint,
  placa text,
  km integer,
  data_visita date,
  ultima_finalizacao timestamptz,
  pronto_em timestamptz,
  cliente_id uuid,
  cliente_codigo text,
  cliente_fallback_consumidor boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  bloqueios text[] not null default '{}'::text[],
  avisos text[] not null default '{}'::text[],
  tentativas integer not null default 0,
  pedido_omsys text,
  ultimo_erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  exportado_em timestamptz,
  constraint patio_omsys_vendas_exportacoes_status_chk check (
    status in ('aguardando_carencia', 'pendente', 'bloqueada', 'preparada', 'exportando', 'exportada', 'erro', 'ignorada')
  )
);

create index if not exists patio_omsys_vendas_exportacoes_status_idx
  on public.patio_omsys_vendas_exportacoes (status, pronto_em desc);

create index if not exists patio_omsys_vendas_exportacoes_visita_idx
  on public.patio_omsys_vendas_exportacoes (patio_veiculo_id, data_visita desc);

update public.patio_omsys_vendas_exportacoes
set status = 'ignorada',
    ultimo_erro = coalesce(ultimo_erro, 'Historico anterior ao corte operacional considerado ja lancado no OMSYS.'),
    atualizado_em = now()
where status in ('aguardando_carencia', 'pendente', 'bloqueada', 'preparada', 'erro')
  and ultima_finalizacao < coalesce(
    (select valor::timestamptz from public.patio_omsys_config where chave = 'exportar_apenas_apos'),
    now()
  );

create or replace view public.vw_patio_omsys_visitas_consolidadas
with (security_invoker = true) as
with cfg as (
  select
    coalesce((select valor from public.patio_omsys_config where chave = 'cliente_consumidor_codigo'), '55555') as cliente_consumidor_codigo,
    coalesce((select valor from public.patio_omsys_config where chave = 'vendedor_padrao_codigo'), '0026') as vendedor_padrao_codigo,
    coalesce((select valor from public.patio_omsys_config where chave = 'tecnico_padrao_codigo'), '000117') as tecnico_padrao_codigo,
    coalesce((select valor from public.patio_omsys_config where chave = 'natureza_padrao_codigo'), '5102') as natureza_padrao_codigo,
    coalesce((select valor from public.patio_omsys_config where chave = 'transportador_padrao_codigo'), '0001') as transportador_padrao_codigo,
    coalesce((select valor from public.patio_omsys_config where chave = 'codt_servico_padrao'), '999') as codt_servico_padrao,
    coalesce((select valor from public.patio_omsys_config where chave = 'omsys_venda_url'), 'http://capitalpneus.omsys.info:8081/omsys/cadvenda_acao1.php?acao=cadastrar&regi=undefined&orse=S&nojan=jVenda') as omsys_venda_url,
    coalesce((select valor::timestamptz from public.patio_omsys_config where chave = 'exportar_apenas_apos'), '-infinity'::timestamptz) as exportar_apenas_apos,
    greatest(coalesce((select valor::integer from public.patio_omsys_config where chave = 'carencia_minutos'), 10), 0) as carencia_minutos
),
base as (
  select
    pa.patio_execucao_id,
    pa.patio_veiculo_id,
    pa.patio_cliente_id,
    coalesce(pa.cliente_id, pai.cliente_id, pvs.cliente_id, pcs.cliente_id) as cliente_id,
    coalesce(pa.veiculo_id, pai.veiculo_id, pvs.veiculo_id) as veiculo_id,
    upper(regexp_replace(coalesce(pa.placa_snapshot, pvs.placa, ''), '[^A-Za-z0-9]+', '', 'g')) as placa,
    nullif(btrim(coalesce(pvs.modelo, pa.raw_data->>'modelo', '')), '') as modelo,
    coalesce(pa.quilometragem, pai.quilometragem) as km,
    (pa.fim_execucao at time zone 'America/Cuiaba')::date as data_visita,
    pa.fim_execucao,
    pai.id as item_id,
    pai.area,
    btrim(coalesce(nullif(pai.servico_nome, ''), pai.descricao, '')) as servico_nome,
    coalesce(nullif(btrim(pai.descricao), ''), nullif(btrim(pai.servico_nome), ''), 'Servico do Patio') as descricao,
    greatest(coalesce(pai.quantidade, 1), 1) as quantidade,
    pai.funcionario_id,
    pf.nome as tecnico_nome,
    nullif(btrim(pf.raw_data->>'omsys_codigo'), '') as tecnico_codigo_original
  from public.patio_atendimento_itens pai
  join public.patio_atendimentos pa on pa.patio_execucao_id = pai.patio_execucao_id
  left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
  left join public.patio_clientes_snapshot pcs on pcs.patio_cliente_id = pa.patio_cliente_id
  left join public.patio_funcionarios_snapshot pf on pf.patio_funcionario_id = pai.funcionario_id
  where pa.status = 'finalizado'
    and pai.status = 'finalizado'
    and pa.fim_execucao is not null
),
match_itens as (
  select
    base.*,
    coalesce(map.exportavel, snap.exportavel, true) as exportavel_catalogo,
    coalesce(map.requer_revisao, snap.requer_revisao, false) as requer_revisao_catalogo,
    coalesce(map.catalogo_item_id, snap.catalogo_item_id, ci.id) as catalogo_item_id,
    coalesce(map.catalogo_codigo, snap.catalogo_codigo, ci.codigo) as catalogo_codigo,
    coalesce(snap.catalogo_tipo, ci.tipo) as catalogo_tipo,
    coalesce(snap.preco, cp.valor, 0) as preco_unitario,
    coalesce(snap.link_status, case when ci.id is not null then 'match_exato_runtime' else 'sem_item_catalogo' end) as link_status
  from base
  left join lateral (
    select snap.*
    from public.patio_catalogo_servicos_snapshot snap
    where public.patio_omsys_norm(snap.nome) = public.patio_omsys_norm(base.servico_nome)
    order by
      case when snap.catalogo_tipo = 'servico' then 0 else 1 end,
      case when snap.link_status in ('mapeamento_manual', 'catalogo_importado', 'match_exato_catalogo') then 0 else 1 end,
      snap.atualizado_em desc nulls last
    limit 1
  ) snap on true
  left join public.patio_servico_catalogo_mapeamentos map
    on public.patio_omsys_norm(map.patio_nome) = public.patio_omsys_norm(base.servico_nome)
  left join lateral (
    select ci.*
    from public.catalogo_itens ci
    where ci.tipo in ('servico', 'produto')
      and coalesce(ci.ativo, true)
      and public.patio_omsys_norm(ci.descricao) = public.patio_omsys_norm(base.servico_nome)
    order by case when ci.tipo = 'servico' then 0 else 1 end, ci.atualizado_em desc nulls last
    limit 1
  ) ci on true
  left join lateral (
    select valor
    from public.catalogo_precos cp
    where cp.catalogo_item_id = coalesce(map.catalogo_item_id, snap.catalogo_item_id, ci.id)
    order by cp.vigencia_inicio desc nulls last, cp.criado_em desc
    limit 1
  ) cp on true
),
linhas as (
  select
    concat_ws(
      '|',
      'patio',
      coalesce(match_itens.patio_veiculo_id, 0),
      nullif(match_itens.placa, ''),
      coalesce(match_itens.km, 0),
      match_itens.data_visita::text
    ) as visita_chave,
    match_itens.*,
    row_number() over (
      partition by match_itens.patio_veiculo_id, match_itens.placa, coalesce(match_itens.km, 0), match_itens.data_visita
      order by match_itens.patio_execucao_id, match_itens.item_id
    ) as linha,
    case
      when match_itens.tecnico_codigo_original is not null then match_itens.tecnico_codigo_original
      when public.patio_omsys_norm(match_itens.tecnico_nome) like '%FLAVIO%ALEGRE%' then '000117'
      else cfg.tecnico_padrao_codigo
    end as tecnico_codigo_efetivo,
    case
      when match_itens.tecnico_codigo_original is not null then 'funcionario_omsys'
      when public.patio_omsys_norm(match_itens.tecnico_nome) like '%FLAVIO%ALEGRE%' then 'mapeamento_nome'
      else 'fallback_config'
    end as tecnico_origem,
    cfg.*
  from match_itens
  cross join cfg
),
visitas as (
  select
    l.visita_chave,
    l.patio_veiculo_id,
    l.placa,
    max(coalesce(l.km, 0)) as km,
    l.data_visita,
    max(l.fim_execucao) as ultima_finalizacao,
    max(l.fim_execucao) + (max(l.carencia_minutos)::text || ' minutes')::interval as pronto_em,
    (array_agg(l.cliente_id order by l.fim_execucao desc) filter (where l.cliente_id is not null))[1] as cliente_id,
    (array_agg(l.patio_cliente_id order by l.fim_execucao desc) filter (where l.patio_cliente_id is not null))[1] as patio_cliente_id,
    (array_agg(l.veiculo_id order by l.fim_execucao desc) filter (where l.veiculo_id is not null))[1] as veiculo_id,
    (array_agg(l.modelo order by l.fim_execucao desc) filter (where l.modelo is not null))[1] as modelo,
    count(distinct l.patio_execucao_id)::integer as execucoes_total,
    count(*)::integer as itens_total,
    count(*) filter (where l.catalogo_codigo is not null and btrim(l.catalogo_codigo) <> '')::integer as itens_com_codigo,
    count(*) filter (where coalesce(l.preco_unitario, 0) > 0)::integer as itens_com_preco,
    count(*) filter (where not coalesce(l.exportavel_catalogo, true))::integer as itens_bloqueados,
    count(*) filter (where l.tecnico_codigo_original is null)::integer as itens_sem_tecnico_omsys,
    array_remove(array_agg(distinct l.servico_nome) filter (
      where l.catalogo_codigo is null or btrim(l.catalogo_codigo) = ''
    ), null) as servicos_sem_codigo,
    array_remove(array_agg(distinct l.servico_nome) filter (
      where coalesce(l.preco_unitario, 0) <= 0
    ), null) as servicos_sem_preco,
    array_remove(array_agg(distinct l.servico_nome) filter (
      where not coalesce(l.exportavel_catalogo, true)
    ), null) as servicos_bloqueados,
    max(l.cliente_consumidor_codigo) as cliente_consumidor_codigo,
    max(l.vendedor_padrao_codigo) as vendedor_padrao_codigo,
    max(l.natureza_padrao_codigo) as natureza_padrao_codigo,
    max(l.transportador_padrao_codigo) as transportador_padrao_codigo,
    max(l.codt_servico_padrao) as codt_servico_padrao,
    max(l.omsys_venda_url) as omsys_venda_url,
    max(l.exportar_apenas_apos) as exportar_apenas_apos,
    jsonb_agg(
      jsonb_build_object(
        'linha', l.linha,
        'codigo', l.catalogo_codigo,
        'descricao', l.descricao,
        'servico_patio', l.servico_nome,
        'tipo_catalogo', l.catalogo_tipo,
        'quantidade', l.quantidade,
        'preco_unitario', round(coalesce(l.preco_unitario, 0)::numeric, 2),
        'preco_total', round((coalesce(l.preco_unitario, 0) * l.quantidade)::numeric, 2),
        'codt', l.codt_servico_padrao,
        'tecnico_codigo', l.tecnico_codigo_efetivo,
        'tecnico_origem', l.tecnico_origem,
        'tecnico_nome', l.tecnico_nome,
        'patio_execucao_id', l.patio_execucao_id,
        'patio_item_id', l.item_id,
        'link_status', l.link_status
      )
      order by l.linha
    ) as itens_payload
  from linhas l
  group by l.visita_chave, l.patio_veiculo_id, l.placa, l.data_visita
),
enriquecidas as (
  select
    v.*,
    c.codigo_erp,
    c.nome as cliente_nome_erp,
    coalesce(nullif(btrim(c.codigo_erp), ''), v.cliente_consumidor_codigo) as cliente_codigo_omsys,
    (nullif(btrim(c.codigo_erp), '') is null) as cliente_fallback_consumidor,
    (
      select count(*)::integer
      from public.patio_atendimento_itens pai_aberto
      join public.patio_atendimentos pa_aberto on pa_aberto.patio_execucao_id = pai_aberto.patio_execucao_id
      where pa_aberto.patio_veiculo_id = v.patio_veiculo_id
        and pai_aberto.status in ('pendente', 'em_andamento')
    ) as abertos_veiculo
  from visitas v
  left join public.clientes c on c.id = v.cliente_id
),
regras as (
  select
    e.*,
    array_remove(array[
      case when e.abertos_veiculo > 0 then 'servicos_abertos' end,
      case when nullif(e.placa, '') is null then 'sem_placa' end,
      case when nullif(e.modelo, '') is null then 'sem_modelo' end,
      case when e.itens_sem_tecnico_omsys > 0 then 'sem_tecnico_omsys' end,
      case when e.itens_total <> e.itens_com_codigo then 'sem_codigo_catalogo' end,
      case when e.itens_total <> e.itens_com_preco then 'sem_preco_catalogo' end,
      case when e.itens_bloqueados > 0 then 'item_bloqueado_revisao' end
    ], null) as bloqueios,
    array_remove(array[
      case when e.cliente_fallback_consumidor then 'cliente_consumidor_55555' end,
      case when e.execucoes_total > 1 then 'visita_consolidou_multiplas_execucoes' end
    ], null) as avisos
  from enriquecidas e
)
select
  r.visita_chave,
  r.patio_veiculo_id,
  r.placa,
  r.km,
  r.data_visita,
  r.ultima_finalizacao,
  r.pronto_em,
  r.cliente_id,
  r.patio_cliente_id,
  r.veiculo_id,
  r.modelo,
  r.cliente_codigo_omsys,
  r.cliente_fallback_consumidor,
  r.cliente_nome_erp,
  r.execucoes_total,
  r.itens_total,
  r.itens_com_codigo,
  r.itens_com_preco,
  r.itens_bloqueados,
  r.servicos_sem_codigo,
  r.servicos_sem_preco,
  r.servicos_bloqueados,
  r.abertos_veiculo,
  r.bloqueios,
  r.avisos,
  jsonb_build_object(
    'origem', 'patio',
    'empresa_destino', 'capital_truck_center',
    'visita_chave', r.visita_chave,
    'data', to_char(r.data_visita, 'DD/MM/YYYY'),
    'cliente_codigo', r.cliente_codigo_omsys,
    'cliente_fallback_consumidor', r.cliente_fallback_consumidor,
    'vendedor_codigo', r.vendedor_padrao_codigo,
    'natureza_codigo', r.natureza_padrao_codigo,
    'transportador_codigo', r.transportador_padrao_codigo,
    'placa', r.placa,
    'veiculo', r.modelo,
    'chassi', case when r.km is not null and r.km > 0 then 'KM ' || trim(to_char(r.km, '999999999')) else 'KM NÃO LANÇADO' end,
    'km', r.km,
    'url_sistema', r.omsys_venda_url,
    'patio_veiculo_id', r.patio_veiculo_id,
    'patio_cliente_id', r.patio_cliente_id,
    'cliente_id', r.cliente_id,
    'execucoes', r.execucoes_total,
    'itens', r.itens_payload,
    'total', (
      select round(sum(coalesce((item->>'preco_total')::numeric, 0)), 2)
      from jsonb_array_elements(r.itens_payload) item
    ),
    'avisos', to_jsonb(r.avisos),
    'bloqueios', to_jsonb(r.bloqueios)
  ) as payload_omsys,
  (cardinality(r.bloqueios) = 0 and now() >= r.pronto_em) as exportavel_agora,
  r.exportar_apenas_apos
from regras r;

create or replace function public.refresh_patio_omsys_vendas_exportacoes(
  p_since timestamptz default now() - interval '7 days'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_catalogo jsonb;
  v_upserts integer := 0;
  v_resultado jsonb;
begin
  v_catalogo := public.refresh_patio_catalogo_servicos_linkado();

  insert into public.patio_omsys_vendas_exportacoes (
    visita_chave,
    status,
    patio_veiculo_id,
    placa,
    km,
    data_visita,
    ultima_finalizacao,
    pronto_em,
    cliente_id,
    cliente_codigo,
    cliente_fallback_consumidor,
    payload,
    bloqueios,
    avisos,
    atualizado_em
  )
  select
    v.visita_chave,
    case
      when cardinality(v.bloqueios) > 0 then 'bloqueada'
      when now() < v.pronto_em then 'aguardando_carencia'
      else 'pendente'
    end as status,
    v.patio_veiculo_id,
    v.placa,
    v.km,
    v.data_visita,
    v.ultima_finalizacao,
    v.pronto_em,
    v.cliente_id,
    v.cliente_codigo_omsys,
    v.cliente_fallback_consumidor,
    v.payload_omsys,
    v.bloqueios,
    v.avisos,
    now()
  from (
    select
      v.*,
      row_number() over (
        partition by v.visita_chave
        order by v.ultima_finalizacao desc nulls last, v.itens_total desc, v.patio_veiculo_id
      ) as rn
    from public.vw_patio_omsys_visitas_consolidadas v
    where v.ultima_finalizacao >= p_since
      and v.ultima_finalizacao >= v.exportar_apenas_apos
      and v.abertos_veiculo = 0
  ) v
  where v.rn = 1
  on conflict (visita_chave) do update
  set status = case
        when public.patio_omsys_vendas_exportacoes.status in ('exportando', 'exportada', 'ignorada') then public.patio_omsys_vendas_exportacoes.status
        when cardinality(excluded.bloqueios) > 0 then 'bloqueada'
        when now() < excluded.pronto_em then 'aguardando_carencia'
        else 'pendente'
      end,
      patio_veiculo_id = excluded.patio_veiculo_id,
      placa = excluded.placa,
      km = excluded.km,
      data_visita = excluded.data_visita,
      ultima_finalizacao = excluded.ultima_finalizacao,
      pronto_em = excluded.pronto_em,
      cliente_id = excluded.cliente_id,
      cliente_codigo = excluded.cliente_codigo,
      cliente_fallback_consumidor = excluded.cliente_fallback_consumidor,
      payload = case
        when public.patio_omsys_vendas_exportacoes.status in ('exportando', 'exportada', 'ignorada') then public.patio_omsys_vendas_exportacoes.payload
        else excluded.payload
      end,
      bloqueios = case
        when public.patio_omsys_vendas_exportacoes.status in ('exportando', 'exportada', 'ignorada') then public.patio_omsys_vendas_exportacoes.bloqueios
        else excluded.bloqueios
      end,
      avisos = case
        when public.patio_omsys_vendas_exportacoes.status in ('exportando', 'exportada', 'ignorada') then public.patio_omsys_vendas_exportacoes.avisos
        else excluded.avisos
      end,
      atualizado_em = now();

  get diagnostics v_upserts = row_count;

  select jsonb_object_agg(status, total)
  into v_resultado
  from (
    select status, count(*)::integer as total
    from public.patio_omsys_vendas_exportacoes
    group by status
  ) s;

  return jsonb_build_object(
    'catalogo', v_catalogo,
    'visitas_atualizadas', v_upserts,
    'fila_por_status', coalesce(v_resultado, '{}'::jsonb)
  );
end;
$$;

create or replace function public.mobile_confirm_omsys_sale_opened(p_exportacao_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.patio_omsys_vendas_exportacoes%rowtype;
begin
  update public.patio_omsys_vendas_exportacoes
  set status = 'preparada',
      avisos = case
        when 'abertura_manual_confirmada_app' = any(avisos) then avisos
        else array_append(avisos, 'abertura_manual_confirmada_app')
      end,
      ultimo_erro = null,
      atualizado_em = now()
  where id = p_exportacao_id
    and status in ('pendente', 'aguardando_carencia', 'preparada')
    and coalesce(cardinality(bloqueios), 0) = 0
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Venda do Patio nao encontrada ou bloqueada para abertura.';
  end if;

  return jsonb_build_object(
    'ok', true,
    'venda_id', v_row.id,
    'status', v_row.status,
    'url_sistema', v_row.payload->>'url_sistema',
    'placa', v_row.placa
  );
end;
$$;

create or replace function public.finalizar_box_patio_crm(
  p_patio_execucao_id bigint,
  p_servicos jsonb,
  p_observacao_final text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atendimento public.patio_atendimentos%rowtype;
  v_servico jsonb;
  v_itens_restantes integer := 0;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para finalizar box.';
  end if;

  select * into v_atendimento
  from public.patio_atendimentos
  where patio_execucao_id = p_patio_execucao_id and status = 'em_andamento';

  if v_atendimento.patio_execucao_id is null then
    raise exception 'Execucao em andamento nao encontrada.';
  end if;

  if jsonb_array_length(coalesce(p_servicos, '[]'::jsonb)) = 0 then
    update public.patio_atendimento_itens
    set observacao_execucao = coalesce(nullif(p_observacao_final, ''), observacao_execucao),
        status = 'finalizado',
        atualizado_em = now(),
        sincronizado_em = now()
    where patio_execucao_id = p_patio_execucao_id
      and status = 'em_andamento';
  else
    for v_servico in select * from jsonb_array_elements(coalesce(p_servicos, '[]'::jsonb))
    loop
      update public.patio_atendimento_itens
      set quantidade = case
            when coalesce(v_servico->>'quantidade', '') ~ '^[0-9]+$' then greatest(0, (v_servico->>'quantidade')::integer)
            else quantidade
          end,
          observacao_execucao = coalesce(nullif(v_servico->>'observacao_execucao', ''), p_observacao_final, observacao_execucao),
          status = 'finalizado',
          atualizado_em = now(),
          sincronizado_em = now()
      where id = (v_servico->>'id')::uuid
        and patio_execucao_id = p_patio_execucao_id;
    end loop;
  end if;

  select count(*)
  into v_itens_restantes
  from public.patio_atendimento_itens
  where patio_execucao_id = p_patio_execucao_id
    and status in ('pendente', 'em_andamento');

  if v_itens_restantes > 0 then
    update public.patio_atendimentos
    set status = 'pendente',
        box_id = null,
        funcionario_id = null,
        fim_execucao = null,
        usuario_finalizacao_id = null,
        raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object('ultima_observacao_box', p_observacao_final),
        sincronizado_em = now()
    where patio_execucao_id = p_patio_execucao_id;

    update public.patio_boxes_snapshot
    set ocupado = false,
        sincronizado_em = now()
    where patio_box_id = v_atendimento.box_id;

    return;
  end if;

  update public.patio_atendimentos
  set status = 'finalizado',
      fim_execucao = now(),
      usuario_finalizacao_id = null,
      raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object('observacao_final', p_observacao_final),
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;

  update public.patio_boxes_snapshot
  set ocupado = false,
      sincronizado_em = now()
  where patio_box_id = v_atendimento.box_id;

  perform public.refresh_patio_omsys_vendas_exportacoes(now() - interval '2 days');
end;
$$;

grant select on public.patio_omsys_config to authenticated, service_role;
grant select on public.patio_servico_catalogo_mapeamentos to authenticated, service_role;
grant select on public.patio_omsys_vendas_exportacoes to authenticated, service_role;
grant select on public.vw_patio_omsys_visitas_consolidadas to authenticated, service_role;
grant select on public.vw_patio_catalogo_servicos to authenticated, service_role;
grant select on public.vw_patio_catalogo_servicos_omsys to authenticated, service_role;
grant select on public.vw_patio_catalogo_itens_omsys to authenticated, service_role;

grant insert, update, delete on public.patio_omsys_config to service_role;
grant insert, update, delete on public.patio_servico_catalogo_mapeamentos to service_role;
grant insert, update, delete on public.patio_omsys_vendas_exportacoes to service_role;

grant execute on function public.refresh_patio_catalogo_servicos_linkado() to authenticated, service_role;
grant execute on function public.refresh_patio_omsys_vendas_exportacoes(timestamptz) to authenticated, service_role;
grant execute on function public.mobile_catalog_items() to anon, authenticated, service_role;
grant execute on function public.mobile_confirm_omsys_sale_opened(uuid) to anon, authenticated, service_role;
