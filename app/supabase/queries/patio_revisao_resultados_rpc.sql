create or replace function public.listar_patio_revisao_resultados(
  p_status text default 'todos',
  p_limit integer default 300
)
returns table (
  patio_veiculo_id bigint,
  cliente_id uuid,
  cliente_nome text,
  vendedor_id uuid,
  veiculo_id uuid,
  placa text,
  veiculo_descricao text,
  nome_motorista text,
  contato_motorista text,
  data_revisao_proativa date,
  retorno_patio_execucao_id bigint,
  retorno_em timestamptz,
  retorno_km numeric,
  resultado text,
  dias_desde_acao integer
)
language sql
stable
security definer
set search_path = public
as $$
  with acoes as (
    select
      pvs.patio_veiculo_id,
      pvs.cliente_id,
      c.nome as cliente_nome,
      c.vendedor_id,
      pvs.veiculo_id,
      coalesce(v.placa, pvs.placa) as placa,
      coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
      pvs.nome_motorista,
      pvs.contato_motorista,
      pvs.data_revisao_proativa
    from public.patio_veiculos_snapshot pvs
    join public.clientes c on c.id = pvs.cliente_id
    left join public.veiculos v on v.id = pvs.veiculo_id
    where pvs.data_revisao_proativa is not null
      and c.excluido_em is null
  ),
  resultados as (
    select
      a.patio_veiculo_id,
      a.cliente_id,
      a.cliente_nome,
      a.vendedor_id,
      a.veiculo_id,
      a.placa,
      a.veiculo_descricao,
      a.nome_motorista,
      a.contato_motorista,
      a.data_revisao_proativa,
      retorno.patio_execucao_id as retorno_patio_execucao_id,
      retorno.inicio_execucao as retorno_em,
      retorno.quilometragem as retorno_km,
      case
        when retorno.patio_execucao_id is not null then 'retornou_15d'
        when a.data_revisao_proativa <= current_date - 15 then 'sem_retorno_15d'
        else 'aguardando'
      end as resultado,
      greatest(0, current_date - a.data_revisao_proativa)::integer as dias_desde_acao
    from acoes a
    left join lateral (
      select pa.patio_execucao_id, pa.inicio_execucao, pa.quilometragem
      from public.patio_atendimentos pa
      where pa.patio_veiculo_id = a.patio_veiculo_id
        and pa.status = 'finalizado'
        and pa.inicio_execucao::date > a.data_revisao_proativa
        and pa.inicio_execucao::date <= a.data_revisao_proativa + 15
      order by pa.inicio_execucao asc
      limit 1
    ) retorno on true
  )
  select *
  from resultados
  where coalesce(p_status, 'todos') = 'todos'
    or resultado = p_status
  order by data_revisao_proativa desc nulls last
  limit greatest(1, least(coalesce(p_limit, 300), 1000));
$$;

grant execute on function public.listar_patio_revisao_resultados(text, integer) to anon, authenticated, service_role;
