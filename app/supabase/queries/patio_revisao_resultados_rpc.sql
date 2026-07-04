drop view if exists public.vw_patio_revisao_resultados;
drop function if exists public.listar_patio_revisao_resultados(text, integer);
drop function if exists public.listar_patio_revisao_resultados(text, integer, integer);
drop function if exists public.resumo_patio_revisao_efetividade(integer);
drop function if exists public.resumo_patio_revisao_efetividade(integer, date, date);

alter table public.interacoes
  add column if not exists patio_veiculo_id bigint,
  add column if not exists placa text;

create index if not exists interacoes_revisao_patio_idx
on public.interacoes(tipo, patio_veiculo_id, data_interacao desc)
where tipo = 'revisao_proativa';

create index if not exists patio_atendimentos_revisao_retorno_idx
on public.patio_atendimentos(patio_veiculo_id, inicio_execucao)
where status = 'finalizado';

create index if not exists patio_atendimentos_revisao_data_idx
on public.patio_atendimentos(inicio_execucao)
where status = 'finalizado';

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

create or replace function public.resumo_patio_revisao_efetividade(
  p_dias_janela integer default 30,
  p_data_inicio date default null,
  p_data_fim date default null
)
returns table (
  fonte text,
  fonte_label text,
  contatos_total integer,
  retornaram_janela integer,
  sem_retorno_janela integer,
  aguardando integer,
  taxa_total numeric,
  taxa_maturada numeric,
  primeira_acao date,
  ultima_acao date,
  janela_dias integer
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      greatest(1, least(coalesce(p_dias_janela, 30), 180))::integer as janela_dias,
      p_data_inicio as data_inicio,
      p_data_fim as data_fim
  ),
  crm_acoes as (
    select
      'crm'::text as fonte,
      ('crm:' || i.id::text) as acao_id,
      i.patio_veiculo_id,
      i.cliente_id,
      coalesce(i.vendedor_id, c.vendedor_id) as vendedor_id,
      i.data_interacao::date as data_acao,
      nullif(upper(regexp_replace(coalesce(i.placa, v.placa, pvs.placa, ''), '[^A-Z0-9]', '', 'g')), '') as placa_key
    from public.interacoes i
    join public.clientes c on c.id = i.cliente_id
    left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = i.patio_veiculo_id
    left join public.veiculos v on v.id = pvs.veiculo_id
    cross join params
    where i.tipo = 'revisao_proativa'
      and c.excluido_em is null
      and (params.data_inicio is null or i.data_interacao::date >= params.data_inicio)
      and (params.data_fim is null or i.data_interacao::date <= params.data_fim)
      and (
        i.patio_veiculo_id is not null
        or nullif(upper(regexp_replace(coalesce(i.placa, v.placa, pvs.placa, ''), '[^A-Z0-9]', '', 'g')), '') is not null
      )
  ),
  historico_patio_dias_validos as (
    select pvs.data_revisao_proativa
    from public.patio_veiculos_snapshot pvs
    where pvs.data_revisao_proativa is not null
    group by pvs.data_revisao_proativa
    having count(*) <= 100
  ),
  historico_patio_acoes as (
    select
      'historico_patio'::text as fonte,
      ('patio:' || pvs.patio_veiculo_id::text || ':' || pvs.data_revisao_proativa::text) as acao_id,
      pvs.patio_veiculo_id,
      pvs.cliente_id,
      c.vendedor_id,
      pvs.data_revisao_proativa as data_acao,
      nullif(upper(regexp_replace(coalesce(v.placa, pvs.placa, ''), '[^A-Z0-9]', '', 'g')), '') as placa_key
    from public.patio_veiculos_snapshot pvs
    join historico_patio_dias_validos dias on dias.data_revisao_proativa = pvs.data_revisao_proativa
    join public.clientes c on c.id = pvs.cliente_id
    left join public.veiculos v on v.id = pvs.veiculo_id
    cross join params
    where c.excluido_em is null
      and (params.data_inicio is null or pvs.data_revisao_proativa >= params.data_inicio)
      and (params.data_fim is null or pvs.data_revisao_proativa <= params.data_fim)
      and not exists (
        select 1
        from crm_acoes ca
        where ca.patio_veiculo_id = pvs.patio_veiculo_id
          and ca.data_acao = pvs.data_revisao_proativa
      )
  ),
  acoes as (
    select * from crm_acoes
    union all
    select * from historico_patio_acoes
  ),
  limites as (
    select
      min(data_acao) as inicio,
      max(data_acao) as fim,
      max(params.janela_dias) as janela_dias
    from acoes
    cross join params
  ),
  atendimentos as (
    select
      pa.patio_execucao_id,
      pa.patio_veiculo_id,
      nullif(upper(regexp_replace(coalesce(pa.placa_snapshot, ''), '[^A-Z0-9]', '', 'g')), '') as placa_key,
      pa.inicio_execucao
    from public.patio_atendimentos pa
    join limites l on true
    where pa.status = 'finalizado'
      and l.inicio is not null
      and pa.inicio_execucao >= (l.inicio + 1)::timestamptz
      and pa.inicio_execucao < (l.fim + l.janela_dias + 1)::timestamptz
  ),
  retornos_id as (
    select distinct a.acao_id
    from acoes a
    cross join params
    join atendimentos pa on pa.patio_veiculo_id = a.patio_veiculo_id
      and pa.inicio_execucao >= (a.data_acao + 1)::timestamptz
      and pa.inicio_execucao < (a.data_acao + params.janela_dias + 1)::timestamptz
  ),
  retornos_placa as (
    select distinct a.acao_id
    from acoes a
    cross join params
    join atendimentos pa on a.placa_key is not null
      and pa.placa_key = a.placa_key
      and pa.inicio_execucao >= (a.data_acao + 1)::timestamptz
      and pa.inicio_execucao < (a.data_acao + params.janela_dias + 1)::timestamptz
  ),
  resultados as (
    select
      a.fonte,
      a.data_acao,
      case
        when ri.acao_id is not null or rp.acao_id is not null then 'retornou_janela'
        when a.data_acao <= current_date - params.janela_dias then 'sem_retorno_janela'
        else 'aguardando'
      end as resultado,
      params.janela_dias
    from acoes a
    cross join params
    left join retornos_id ri on ri.acao_id = a.acao_id
    left join retornos_placa rp on rp.acao_id = a.acao_id
  ),
  agregado as (
    select
      coalesce(fonte, 'total') as fonte,
      case coalesce(fonte, 'total')
        when 'crm' then 'CRM atual'
        when 'historico_patio' then 'Historico patio filtrado'
        else 'Total geral'
      end as fonte_label,
      count(*)::integer as contatos_total,
      count(*) filter (where resultado = 'retornou_janela')::integer as retornaram_janela,
      count(*) filter (where resultado = 'sem_retorno_janela')::integer as sem_retorno_janela,
      count(*) filter (where resultado = 'aguardando')::integer as aguardando,
      coalesce(round((count(*) filter (where resultado = 'retornou_janela'))::numeric * 100 / nullif(count(*), 0), 1), 0) as taxa_total,
      coalesce(round((count(*) filter (where resultado = 'retornou_janela'))::numeric * 100 / nullif(count(*) filter (where resultado <> 'aguardando'), 0), 1), 0) as taxa_maturada,
      min(data_acao) as primeira_acao,
      max(data_acao) as ultima_acao,
      coalesce(max(janela_dias), (select janela_dias from params))::integer as janela_dias
    from resultados
    group by grouping sets ((fonte), ())
  )
  select *
  from agregado
  order by case fonte when 'total' then 0 when 'crm' then 1 else 2 end;
$$;

grant execute on function public.resumo_patio_revisao_efetividade(integer, date, date) to anon, authenticated, service_role;

drop view if exists public.vw_patio_revisao_resultados;

create or replace view public.vw_patio_revisao_resultados
with (security_invoker = true) as
select *
from public.listar_patio_revisao_resultados('todos', 1000, 30);

grant select on public.vw_patio_revisao_resultados to anon, authenticated, service_role;
