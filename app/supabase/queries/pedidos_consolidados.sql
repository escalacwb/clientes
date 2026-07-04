-- Camada unica para cruzar ERP/importacao e Patio sem alterar as fontes brutas.
-- Regra principal: quando placa + KM batem dentro de +/- 30 dias,
-- o cliente do ERP/importacao prevalece sobre o cliente do Patio.

drop view if exists public.vw_pedidos_consolidados;
drop function if exists public.listar_pedidos_consolidados(date, date);

create or replace function public.listar_pedidos_consolidados(
  p_data_inicio date default current_date - 90,
  p_data_fim date default current_date + 1
)
returns table (
  consolidado_id text,
  origem_consolidado text,
  match_status text,
  match_score integer,
  regra_cliente text,
  cliente_id uuid,
  cliente_nome text,
  cliente_fonte text,
  erp_cliente_id uuid,
  erp_cliente_nome text,
  patio_cliente_id uuid,
  patio_cliente_nome text,
  cliente_divergente boolean,
  data_referencia date,
  data_erp date,
  data_patio date,
  diferenca_dias integer,
  nota text,
  pedido text,
  codigo_cliente_erp text,
  tem_servico boolean,
  tem_produto boolean,
  valor_servicos numeric(14, 2),
  valor_produtos numeric(14, 2),
  valor_total numeric(14, 2),
  erp_itens_total integer,
  patio_itens_total integer,
  veiculo_id uuid,
  placa text,
  erp_placa text,
  patio_placa text,
  erp_km integer,
  patio_km integer,
  diferenca_km integer,
  patio_execucao_id bigint,
  patio_status text,
  nome_motorista text,
  contato_motorista text,
  erp_itens jsonb,
  patio_itens jsonb
)
language sql
stable
as $$
with erp_itens as (
  select
    'servico'::text as item_tipo,
    si.id::text as item_id,
    si.cliente_id,
    c.nome as cliente_nome,
    si.codigo_cliente_erp,
    si.veiculo_id,
    si.data_servico as data_erp,
    coalesce(si.nota, '') as nota,
    coalesce(si.pedido, '') as pedido,
    coalesce(nullif(si.placa, ''), v.placa) as placa,
    regexp_replace(upper(coalesce(nullif(si.placa, ''), v.placa, '')), '[^A-Z0-9]', '', 'g') as placa_norm,
    si.km_extraido,
    si.servico_codigo as item_codigo,
    si.servico_nome as item_nome,
    si.quantidade,
    si.valor_unitario,
    si.valor_total,
    si.vendedor_nome
  from public.servicos_itens si
  left join public.clientes c on c.id = si.cliente_id
  left join public.veiculos v on v.id = si.veiculo_id
  where si.cliente_id is not null
    and si.data_servico >= p_data_inicio
    and si.data_servico < p_data_fim

  union all

  select
    'produto'::text as item_tipo,
    vi.id::text as item_id,
    vi.cliente_id,
    c.nome as cliente_nome,
    vi.codigo_cliente_erp,
    vi.veiculo_id,
    vi.data_venda as data_erp,
    coalesce(vi.nota, '') as nota,
    coalesce(vi.pedido, '') as pedido,
    v.placa,
    regexp_replace(upper(coalesce(v.placa, '')), '[^A-Z0-9]', '', 'g') as placa_norm,
    vi.km_extraido,
    vi.produto_codigo as item_codigo,
    vi.produto_nome as item_nome,
    vi.quantidade,
    vi.valor_unitario,
    vi.valor_total,
    vi.vendedor_nome
  from public.vendas_itens vi
  left join public.clientes c on c.id = vi.cliente_id
  left join public.veiculos v on v.id = vi.veiculo_id
  where vi.cliente_id is not null
    and vi.data_venda >= p_data_inicio
    and vi.data_venda < p_data_fim
),
erp_pedidos as (
  select
    md5(concat_ws('|', cliente_id::text, data_erp::text, nota, pedido)) as erp_pedido_key,
    cliente_id as erp_cliente_id,
    max(cliente_nome) as erp_cliente_nome,
    max(codigo_cliente_erp) as codigo_cliente_erp,
    data_erp,
    nota,
    pedido,
    bool_or(item_tipo = 'servico') as tem_servico,
    bool_or(item_tipo = 'produto') as tem_produto,
    count(*)::integer as erp_itens_total,
    coalesce(sum(valor_total) filter (where item_tipo = 'servico'), 0)::numeric(14, 2) as valor_servicos,
    coalesce(sum(valor_total) filter (where item_tipo = 'produto'), 0)::numeric(14, 2) as valor_produtos,
    coalesce(sum(valor_total), 0)::numeric(14, 2) as valor_total,
    (array_agg(distinct veiculo_id) filter (where veiculo_id is not null))[1] as erp_veiculo_id,
    max(nullif(placa, '')) as erp_placa,
    max(placa_norm) filter (where placa_norm <> '') as erp_placa_norm,
    max(km_extraido) filter (where km_extraido is not null) as erp_km,
    max(vendedor_nome) filter (where vendedor_nome is not null and vendedor_nome <> '') as vendedor_nome,
    jsonb_agg(
      jsonb_build_object(
        'tipo', item_tipo,
        'id', item_id,
        'codigo', item_codigo,
        'nome', item_nome,
        'quantidade', quantidade,
        'valor_unitario', valor_unitario,
        'valor_total', valor_total
      )
      order by item_tipo, item_nome
    ) as erp_itens
  from erp_itens
  group by cliente_id, data_erp, nota, pedido
),
patio_execucoes as (
  select
    pa.patio_execucao_id,
    pa.cliente_id as patio_cliente_id,
    cp.nome as patio_cliente_nome,
    pa.cliente_nome_snapshot,
    pa.veiculo_id as patio_veiculo_uuid,
    coalesce(nullif(pa.placa_snapshot, ''), vp.placa) as patio_placa,
    regexp_replace(upper(coalesce(nullif(pa.placa_snapshot, ''), vp.placa, '')), '[^A-Z0-9]', '', 'g') as patio_placa_norm,
    coalesce(pa.fim_execucao, pa.inicio_execucao)::date as data_patio,
    pa.quilometragem as patio_km,
    pa.status as patio_status,
    pa.nome_motorista,
    pa.contato_motorista,
    count(pai.id)::integer as patio_itens_total,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', pai.id,
          'area', pai.area,
          'servico_nome', pai.servico_nome,
          'descricao', pai.descricao,
          'quantidade', pai.quantidade,
          'status', pai.status,
          'tipo_atendimento', pai.tipo_atendimento,
          'observacao_execucao', pai.observacao_execucao
        )
        order by pai.area, coalesce(pai.servico_nome, pai.descricao)
      ) filter (where pai.id is not null),
      '[]'::jsonb
    ) as patio_itens
  from public.patio_atendimentos pa
  left join public.clientes cp on cp.id = pa.cliente_id
  left join public.veiculos vp on vp.id = pa.veiculo_id
  left join public.patio_atendimento_itens pai on pai.patio_execucao_id = pa.patio_execucao_id
  where coalesce(pa.fim_execucao, pa.inicio_execucao) is not null
    and coalesce(pa.fim_execucao, pa.inicio_execucao)::date >= p_data_inicio - 30
    and coalesce(pa.fim_execucao, pa.inicio_execucao)::date < p_data_fim + 30
  group by
    pa.patio_execucao_id,
    pa.cliente_id,
    cp.nome,
    pa.cliente_nome_snapshot,
    pa.veiculo_id,
    coalesce(nullif(pa.placa_snapshot, ''), vp.placa),
    regexp_replace(upper(coalesce(nullif(pa.placa_snapshot, ''), vp.placa, '')), '[^A-Z0-9]', '', 'g'),
    coalesce(pa.fim_execucao, pa.inicio_execucao)::date,
    pa.quilometragem,
    pa.status,
    pa.nome_motorista,
    pa.contato_motorista
),
candidatos as (
  select
    e.erp_pedido_key,
    p.patio_execucao_id,
    p.data_patio,
    abs(p.data_patio - e.data_erp) as diferenca_dias,
    (e.erp_placa_norm is not null and e.erp_placa_norm <> '' and e.erp_placa_norm = p.patio_placa_norm) as placa_bate,
    (e.erp_km is not null and p.patio_km is not null and abs(e.erp_km - p.patio_km) <= 10) as km_bate,
    (e.erp_veiculo_id is not null and e.erp_veiculo_id = p.patio_veiculo_uuid) as veiculo_bate,
    (e.erp_cliente_id = p.patio_cliente_id) as cliente_bate,
    (
      50
      + case when e.erp_placa_norm is not null and e.erp_placa_norm <> '' and e.erp_placa_norm = p.patio_placa_norm then 350 else 0 end
      + case when e.erp_km is not null and p.patio_km is not null and abs(e.erp_km - p.patio_km) <= 10 then 350 else 0 end
      + case when e.erp_veiculo_id is not null and e.erp_veiculo_id = p.patio_veiculo_uuid then 180 else 0 end
      + case when e.erp_cliente_id = p.patio_cliente_id then 100 else 0 end
      + greatest(0, 30 - abs(p.data_patio - e.data_erp))
    )::integer as match_score
  from erp_pedidos e
  join patio_execucoes p
    on p.data_patio between e.data_erp - 30 and e.data_erp + 30
   and (
      (e.erp_placa_norm is not null and e.erp_placa_norm <> '' and e.erp_placa_norm = p.patio_placa_norm)
      or (e.erp_veiculo_id is not null and e.erp_veiculo_id = p.patio_veiculo_uuid)
      or e.erp_cliente_id = p.patio_cliente_id
    )
),
candidatos_rankeados as (
  select
    c.*,
    row_number() over (
      partition by c.erp_pedido_key
      order by c.match_score desc, c.diferenca_dias asc, c.patio_execucao_id desc
    ) as rn,
    count(*) over (partition by c.erp_pedido_key) as candidatos_total,
    count(*) filter (where c.cliente_bate and c.veiculo_bate) over (partition by c.erp_pedido_key) as candidatos_cliente_veiculo
  from candidatos c
),
melhor_match as (
  select
    *,
    case
      when placa_bate and km_bate then 'match_placa_km_data_30d'
      when candidatos_cliente_veiculo = 1 and cliente_bate and veiculo_bate then 'match_cliente_veiculo_data_30d'
      when candidatos_cliente_veiculo > 1 and cliente_bate and veiculo_bate then 'ambiguo_cliente_veiculo_data_30d'
      when cliente_bate and candidatos_total = 1 then 'match_cliente_data_30d'
      when cliente_bate then 'ambiguo_cliente_data_30d'
      else 'match_fraco_data_30d'
    end as match_status
  from candidatos_rankeados
  where rn = 1
),
erp_consolidado as (
  select
    'erp:' || e.erp_pedido_key as consolidado_id,
    case when m.patio_execucao_id is null then 'erp_sem_patio' else 'erp_com_patio' end as origem_consolidado,
    coalesce(m.match_status, 'sem_patio') as match_status,
    coalesce(m.match_score, 0) as match_score,
    case
      when m.match_status = 'match_placa_km_data_30d'
        then 'cliente_erp_prevalece_por_placa_km_data_30d'
      when m.patio_execucao_id is not null
        then 'cliente_erp_prevalece_por_origem_importada'
      else 'somente_erp_importacao'
    end as regra_cliente,
    e.erp_cliente_id as cliente_id,
    e.erp_cliente_nome as cliente_nome,
    'erp_importacao'::text as cliente_fonte,
    e.erp_cliente_id,
    e.erp_cliente_nome,
    p.patio_cliente_id,
    coalesce(p.patio_cliente_nome, p.cliente_nome_snapshot) as patio_cliente_nome,
    (p.patio_cliente_id is not null and p.patio_cliente_id <> e.erp_cliente_id) as cliente_divergente,
    e.data_erp as data_referencia,
    e.data_erp,
    p.data_patio,
    m.diferenca_dias,
    e.nota,
    e.pedido,
    e.codigo_cliente_erp,
    e.tem_servico,
    e.tem_produto,
    e.valor_servicos,
    e.valor_produtos,
    e.valor_total,
    e.erp_itens_total,
    coalesce(p.patio_itens_total, 0) as patio_itens_total,
    coalesce(e.erp_veiculo_id, p.patio_veiculo_uuid) as veiculo_id,
    coalesce(e.erp_placa, p.patio_placa) as placa,
    e.erp_placa,
    p.patio_placa,
    e.erp_km,
    p.patio_km,
    case
      when e.erp_km is not null and p.patio_km is not null then abs(e.erp_km - p.patio_km)
      else null
    end as diferenca_km,
    p.patio_execucao_id,
    p.patio_status,
    p.nome_motorista,
    p.contato_motorista,
    e.erp_itens,
    coalesce(p.patio_itens, '[]'::jsonb) as patio_itens
  from erp_pedidos e
  left join melhor_match m on m.erp_pedido_key = e.erp_pedido_key
  left join patio_execucoes p on p.patio_execucao_id = m.patio_execucao_id
),
patio_usado as (
  select distinct patio_execucao_id
  from erp_consolidado
  where patio_execucao_id is not null
),
patio_sem_erp as (
  select
    'patio:' || p.patio_execucao_id::text as consolidado_id,
    'patio_sem_erp'::text as origem_consolidado,
    'patio_sem_erp'::text as match_status,
    0::integer as match_score,
    'somente_patio'::text as regra_cliente,
    p.patio_cliente_id as cliente_id,
    coalesce(p.patio_cliente_nome, p.cliente_nome_snapshot) as cliente_nome,
    'patio'::text as cliente_fonte,
    null::uuid as erp_cliente_id,
    null::text as erp_cliente_nome,
    p.patio_cliente_id,
    coalesce(p.patio_cliente_nome, p.cliente_nome_snapshot) as patio_cliente_nome,
    false as cliente_divergente,
    p.data_patio as data_referencia,
    null::date as data_erp,
    p.data_patio,
    null::integer as diferenca_dias,
    null::text as nota,
    null::text as pedido,
    null::text as codigo_cliente_erp,
    false as tem_servico,
    false as tem_produto,
    0::numeric(14, 2) as valor_servicos,
    0::numeric(14, 2) as valor_produtos,
    0::numeric(14, 2) as valor_total,
    0::integer as erp_itens_total,
    p.patio_itens_total,
    p.patio_veiculo_uuid as veiculo_id,
    p.patio_placa as placa,
    null::text as erp_placa,
    p.patio_placa,
    null::integer as erp_km,
    p.patio_km,
    null::integer as diferenca_km,
    p.patio_execucao_id,
    p.patio_status,
    p.nome_motorista,
    p.contato_motorista,
    '[]'::jsonb as erp_itens,
    p.patio_itens
  from patio_execucoes p
  where p.data_patio >= p_data_inicio
    and p.data_patio < p_data_fim
    and not exists (
      select 1
      from patio_usado u
      where u.patio_execucao_id = p.patio_execucao_id
    )
)
select * from erp_consolidado
union all
select * from patio_sem_erp
order by data_referencia desc nulls last, origem_consolidado, cliente_nome;
$$;

grant execute on function public.listar_pedidos_consolidados(date, date) to authenticated, service_role;
