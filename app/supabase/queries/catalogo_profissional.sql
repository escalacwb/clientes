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
