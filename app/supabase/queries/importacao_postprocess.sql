create or replace function public.refresh_clientes_comercial_stats()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem recalcular estatisticas comerciais.';
  end if;

  update public.clientes c
  set
    primeira_compra_em = stats.primeira_compra,
    ultima_compra_em = stats.ultima_compra,
    ultimo_servico_em = stats.ultimo_servico,
    total_comprado = coalesce(stats.total_produtos, 0),
    total_servicos = coalesce(stats.total_servicos, 0),
    status_comercial = case
      when c.status_comercial = 'nao_contatar' then c.status_comercial
      when stats.ultima_compra is null and stats.ultimo_servico is null then 'novo'::cliente_status
      when greatest(coalesce(stats.ultima_compra, date '1900-01-01'), coalesce(stats.ultimo_servico, date '1900-01-01')) < current_date - 180 then 'reativar'::cliente_status
      else 'ativo'::cliente_status
    end,
    atualizado_em = now()
  from (
    select
      c.id,
      v.primeira_compra,
      v.ultima_compra,
      s.ultimo_servico,
      coalesce(v.total_produtos, 0) as total_produtos,
      coalesce(s.total_servicos, 0) as total_servicos
    from public.clientes c
    left join (
      select
        cliente_id,
        min(data_venda) as primeira_compra,
        max(data_venda) as ultima_compra,
        sum(valor_total) as total_produtos
      from public.vendas_itens
      group by cliente_id
    ) v on v.cliente_id = c.id
    left join (
      select
        cliente_id,
        max(data_servico) as ultimo_servico,
        sum(valor_total) as total_servicos
      from public.servicos_itens
      group by cliente_id
    ) s on s.cliente_id = c.id
  ) stats
  where stats.id = c.id;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.finalizar_importacao_diaria()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clientes_atualizados integer;
  oportunidades_geradas integer;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem finalizar importacoes.';
  end if;

  clientes_atualizados := public.refresh_clientes_comercial_stats();
  oportunidades_geradas := public.refresh_oportunidades_cache();

  return jsonb_build_object(
    'clientes_atualizados', clientes_atualizados,
    'oportunidades_geradas', oportunidades_geradas
  );
end;
$$;
