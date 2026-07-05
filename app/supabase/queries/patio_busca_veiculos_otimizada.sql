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
  with candidatos_snapshot as (
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
    left join public.clientes c on c.id = pvs.cliente_id
    left join public.veiculos v on v.id = pvs.veiculo_id
    where length(trim(coalesce(p_query, ''))) >= 2
      and (
        (
          trim(p_query) ~ '^[A-Za-z]{3}[0-9A-Za-z]{4}$'
          and upper(coalesce(v.placa, pvs.placa)) = upper(trim(p_query))
        )
        or (
          trim(p_query) ~ '^[A-Za-z0-9-]{3,8}$'
          and upper(coalesce(v.placa, pvs.placa)) like upper(replace(trim(p_query), '-', '')) || '%'
        )
        or (
          trim(p_query) !~ '^[A-Za-z0-9-]{3,8}$'
          and (
            coalesce(c.nome, pvs.empresa) ilike '%' || trim(p_query) || '%'
            or pvs.empresa ilike '%' || trim(p_query) || '%'
            or pvs.nome_motorista ilike '%' || trim(p_query) || '%'
            or coalesce(v.placa, pvs.placa) ilike '%' || trim(p_query) || '%'
          )
        )
      )
    order by
      case when coalesce(v.placa, pvs.placa) ilike trim(p_query) || '%' then 0 else 1 end,
      coalesce(c.nome, pvs.empresa) nulls last
    limit greatest(1, least(coalesce(p_limit, 30), 100))
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
    where length(trim(coalesce(p_query, ''))) >= 2
      and not exists (
        select 1
        from candidatos_snapshot cs
        where cs.patio_veiculo_id = vb.patio_veiculo_id
      )
      and (
        (
          trim(p_query) ~ '^[A-Za-z]{3}[0-9A-Za-z]{4}$'
          and upper(vb.placa) = upper(trim(p_query))
        )
        or (
          trim(p_query) ~ '^[A-Za-z0-9-]{3,8}$'
          and upper(vb.placa) like upper(replace(trim(p_query), '-', '')) || '%'
        )
        or (
          trim(p_query) !~ '^[A-Za-z0-9-]{3,8}$'
          and (
            vb.cliente_nome ilike '%' || trim(p_query) || '%'
            or vb.nome_motorista ilike '%' || trim(p_query) || '%'
            or vb.placa ilike '%' || trim(p_query) || '%'
          )
        )
      )
    order by
      case when vb.placa ilike trim(p_query) || '%' then 0 else 1 end,
      vb.ultimo_atendimento_em desc nulls last,
      vb.cliente_nome nulls last
    limit greatest(1, least(coalesce(p_limit, 30), 100))
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
  order by ultimo.fim_execucao desc nulls last, candidatos.cliente_nome nulls last;
$$;

grant execute on function public.buscar_patio_veiculos(text, integer) to anon, authenticated, service_role;
