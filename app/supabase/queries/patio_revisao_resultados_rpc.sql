drop function if exists public.listar_patio_revisao_resultados(text, integer);
drop function if exists public.listar_patio_revisao_resultados(text, integer, integer);

alter table public.interacoes
  add column if not exists patio_veiculo_id bigint,
  add column if not exists placa text;

create index if not exists interacoes_revisao_patio_idx
on public.interacoes(tipo, patio_veiculo_id, data_interacao desc)
where tipo = 'revisao_proativa';

create or replace function public.listar_patio_revisao_resultados(
  p_status text default 'todos',
  p_limit integer default 300,
  p_dias_janela integer default 30
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
  dias_desde_acao integer,
  janela_dias integer
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select greatest(1, least(coalesce(p_dias_janela, 30), 180))::integer as janela_dias
  ),
  acoes as (
    select
      i.patio_veiculo_id,
      i.cliente_id,
      c.nome as cliente_nome,
      coalesce(i.vendedor_id, c.vendedor_id) as vendedor_id,
      pvs.veiculo_id,
      coalesce(i.placa, v.placa, pvs.placa) as placa,
      nullif(upper(regexp_replace(coalesce(i.placa, v.placa, pvs.placa, ''), '[^A-Z0-9]', '', 'g')), '') as placa_key,
      coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
      pvs.nome_motorista,
      pvs.contato_motorista,
      i.data_interacao::date as data_revisao_proativa
    from public.interacoes i
    join public.clientes c on c.id = i.cliente_id
    left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = i.patio_veiculo_id
    left join public.veiculos v on v.id = pvs.veiculo_id
    where i.tipo = 'revisao_proativa'
      and i.patio_veiculo_id is not null
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
        when retorno.patio_execucao_id is not null then 'retornou_janela'
        when a.data_revisao_proativa <= current_date - params.janela_dias then 'sem_retorno_janela'
        else 'aguardando'
      end as resultado,
      greatest(0, current_date - a.data_revisao_proativa)::integer as dias_desde_acao,
      params.janela_dias
    from acoes a
    cross join params
    left join lateral (
      select pa.patio_execucao_id, pa.inicio_execucao, pa.quilometragem
      from public.patio_atendimentos pa
      where pa.status = 'finalizado'
        and (
          pa.patio_veiculo_id = a.patio_veiculo_id
          or (
            a.placa_key is not null
            and nullif(upper(regexp_replace(coalesce(pa.placa_snapshot, ''), '[^A-Z0-9]', '', 'g')), '') = a.placa_key
          )
        )
        and pa.inicio_execucao::date > a.data_revisao_proativa
        and pa.inicio_execucao::date <= a.data_revisao_proativa + params.janela_dias
      order by pa.inicio_execucao asc
      limit 1
    ) retorno on true
  )
  select *
  from resultados
  where coalesce(p_status, 'todos') = 'todos'
    or (p_status in ('retornou', 'retornou_janela', 'retornou_15d') and resultado = 'retornou_janela')
    or (p_status in ('sem_retorno', 'sem_retorno_janela', 'sem_retorno_15d') and resultado = 'sem_retorno_janela')
    or (p_status = 'aguardando' and resultado = 'aguardando')
  order by data_revisao_proativa desc nulls last
  limit greatest(1, least(coalesce(p_limit, 300), 1000));
$$;

grant execute on function public.listar_patio_revisao_resultados(text, integer, integer) to anon, authenticated, service_role;

drop view if exists public.vw_patio_revisao_resultados;

create or replace view public.vw_patio_revisao_resultados
with (security_invoker = true) as
select *
from public.listar_patio_revisao_resultados('todos', 1000, 30);

grant select on public.vw_patio_revisao_resultados to anon, authenticated, service_role;
