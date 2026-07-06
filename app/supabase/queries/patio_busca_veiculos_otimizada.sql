create or replace function public.buscar_patio_veiculos(
  p_query text,
  p_limit integer default 30
)
returns table (
  patio_veiculo_id bigint,
  cliente_id uuid,
  cliente_nome text,
  vendedor_id uuid,
  veiculo_id uuid,
  placa text,
  veiculo_descricao text,
  ano_modelo text,
  nome_motorista text,
  contato_motorista text,
  media_km_diaria numeric,
  data_revisao_proativa date,
  ultimo_patio_execucao_id bigint,
  ultimo_km numeric,
  ultimo_atendimento_em timestamptz,
  contato_recomendado text,
  contato_nome text,
  contato_tipo text
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      trim(coalesce(p_query, '')) as query_text,
      regexp_replace(upper(trim(coalesce(p_query, ''))), '[^A-Z0-9]', '', 'g') as query_plate,
      greatest(1, least(coalesce(p_limit, 30), 100)) as row_limit
  ),
  candidatos_snapshot as (
    select
      pvs.patio_veiculo_id,
      pvs.cliente_id,
      case
        when c.codigo_erp = '55555'
          and nullif(btrim(pvs.empresa), '') is not null
          and upper(btrim(pvs.empresa)) <> 'CONSUMIDOR FINAL'
          then pvs.empresa
        else coalesce(c.nome, pvs.empresa)
      end as cliente_nome,
      c.vendedor_id,
      pvs.veiculo_id,
      coalesce(v.placa, pvs.placa) as placa,
      coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
      pvs.ano_modelo,
      pvs.nome_motorista,
      pvs.contato_motorista,
      pvs.media_km_diaria,
      pvs.data_revisao_proativa
    from public.patio_veiculos_snapshot pvs
    cross join params p
    left join public.clientes c on c.id = pvs.cliente_id
    left join public.veiculos v on v.id = pvs.veiculo_id
    where length(p.query_text) >= 2
      and (
        (
          p.query_plate <> ''
          and regexp_replace(upper(coalesce(v.placa, pvs.placa, '')), '[^A-Z0-9]', '', 'g') like p.query_plate || '%'
        )
        or unaccent(coalesce(c.nome, '')) ilike unaccent('%' || p.query_text || '%')
        or unaccent(coalesce(pvs.empresa, '')) ilike unaccent('%' || p.query_text || '%')
        or unaccent(coalesce(pvs.nome_motorista, '')) ilike unaccent('%' || p.query_text || '%')
      )
    order by
      case when p.query_plate <> '' and regexp_replace(upper(coalesce(v.placa, pvs.placa, '')), '[^A-Z0-9]', '', 'g') like p.query_plate || '%' then 0 else 1 end,
      case when unaccent(coalesce(c.nome, pvs.empresa, '')) ilike unaccent(p.query_text || '%') then 0 else 1 end,
      coalesce(c.nome, pvs.empresa) nulls last
    limit (select row_limit from params)
  ),
  candidatos_view as (
    select
      vb.patio_veiculo_id,
      vb.cliente_id,
      vb.cliente_nome,
      vb.vendedor_id,
      vb.veiculo_id,
      vb.placa,
      vb.veiculo_descricao,
      vb.ano_modelo,
      vb.nome_motorista,
      vb.contato_motorista,
      vb.media_km_diaria,
      vb.data_revisao_proativa
    from public.vw_patio_veiculos_busca vb
    cross join params p
    where length(trim(coalesce(p_query, ''))) >= 2
      and not exists (
        select 1
        from candidatos_snapshot cs
        where cs.patio_veiculo_id = vb.patio_veiculo_id
      )
      and (
        (
          p.query_plate <> ''
          and regexp_replace(upper(coalesce(vb.placa, '')), '[^A-Z0-9]', '', 'g') like p.query_plate || '%'
        )
        or unaccent(coalesce(vb.cliente_nome, '')) ilike unaccent('%' || p.query_text || '%')
        or unaccent(coalesce(vb.nome_motorista, '')) ilike unaccent('%' || p.query_text || '%')
      )
    order by
      case when p.query_plate <> '' and regexp_replace(upper(coalesce(vb.placa, '')), '[^A-Z0-9]', '', 'g') like p.query_plate || '%' then 0 else 1 end,
      case when unaccent(coalesce(vb.cliente_nome, '')) ilike unaccent(p.query_text || '%') then 0 else 1 end,
      vb.ultimo_atendimento_em desc nulls last,
      vb.cliente_nome nulls last
    limit (select row_limit from params)
  ),
  candidatos as (
    select * from candidatos_snapshot
    union all
    select * from candidatos_view
  )
  select
    candidatos.patio_veiculo_id,
    candidatos.cliente_id,
    candidatos.cliente_nome,
    candidatos.vendedor_id,
    candidatos.veiculo_id,
    candidatos.placa,
    candidatos.veiculo_descricao,
    candidatos.ano_modelo,
    candidatos.nome_motorista,
    candidatos.contato_motorista,
    candidatos.media_km_diaria,
    candidatos.data_revisao_proativa,
    ultimo.patio_execucao_id as ultimo_patio_execucao_id,
    ultimo.quilometragem as ultimo_km,
    ultimo.fim_execucao as ultimo_atendimento_em,
    cr.whatsapp as contato_recomendado,
    cr.nome as contato_nome,
    cr.tipo as contato_tipo
  from candidatos
  left join public.vw_cliente_contatos_recomendados cr on cr.cliente_id = candidatos.cliente_id
  left join lateral (
    select pa.patio_execucao_id, pa.quilometragem, pa.fim_execucao
    from public.patio_atendimentos pa
    where pa.patio_veiculo_id = candidatos.patio_veiculo_id
    order by pa.fim_execucao desc nulls last
    limit 1
  ) ultimo on true
  order by ultimo.fim_execucao desc nulls last, candidatos.cliente_nome nulls last
  limit (select row_limit from params);
$$;

grant execute on function public.buscar_patio_veiculos(text, integer) to authenticated, service_role;
