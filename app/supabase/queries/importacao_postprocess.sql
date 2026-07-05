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

create or replace function public.refresh_clientes_comercial_stats_por_importacao(p_importacao_id uuid)
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

  if p_importacao_id is null then
    return public.refresh_clientes_comercial_stats();
  end if;

  with clientes_afetados as (
    select distinct cliente_id
    from public.vendas_itens
    where importacao_id = p_importacao_id
      and cliente_id is not null
    union
    select distinct cliente_id
    from public.servicos_itens
    where importacao_id = p_importacao_id
      and cliente_id is not null
  ),
  stats as (
    select
      ca.cliente_id as id,
      v.primeira_compra,
      v.ultima_compra,
      s.ultimo_servico,
      coalesce(v.total_produtos, 0) as total_produtos,
      coalesce(s.total_servicos, 0) as total_servicos
    from clientes_afetados ca
    left join lateral (
      select
        min(data_venda) as primeira_compra,
        max(data_venda) as ultima_compra,
        sum(valor_total) as total_produtos
      from public.vendas_itens vi
      where vi.cliente_id = ca.cliente_id
    ) v on true
    left join lateral (
      select
        max(data_servico) as ultimo_servico,
        sum(valor_total) as total_servicos
      from public.servicos_itens si
      where si.cliente_id = ca.cliente_id
    ) s on true
  )
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
  from stats
  where stats.id = c.id;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.criar_tarefas_followup_automaticas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  orcamentos_vencidos integer := 0;
  campanhas_resposta integer := 0;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem executar automacoes de follow-up.';
  end if;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem
  )
  select
    o.cliente_id,
    o.vendedor_id,
    'Retomar orcamento vencido',
    concat(
      'Orcamento de ',
      to_char(o.valor_total, 'FM999G999G990D00'),
      ' venceu em ',
      to_char(o.validade, 'DD/MM/YYYY'),
      '. Revisar condicao, confirmar interesse e registrar proximo passo.'
    ),
    current_date::timestamptz,
    'aberta',
    case
      when o.valor_total >= 10000 then 95
      when o.valor_total >= 3000 then 88
      else 82
    end,
    concat('orcamento:vencido:', o.id::text)
  from public.orcamentos o
  where o.validade is not null
    and o.validade < current_date
    and o.status in ('aberto', 'enviado', 'negociando', 'aguardando_aprovacao')
  on conflict (cliente_id, origem) where status = 'aberta' and origem is not null
  do update set
    vendedor_id = excluded.vendedor_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    data_vencimento = least(public.tarefas.data_vencimento, excluded.data_vencimento),
    prioridade = greatest(public.tarefas.prioridade, excluded.prioridade);

  get diagnostics orcamentos_vencidos = row_count;

  insert into public.tarefas (
    cliente_id,
    vendedor_id,
    titulo,
    descricao,
    data_vencimento,
    status,
    prioridade,
    origem
  )
  select
    ce.cliente_id,
    coalesce(ce.vendedor_id, c.vendedor_id),
    case
      when ce.status = 'virou_orcamento' or ce.virou_orcamento then 'Acompanhar orcamento da campanha'
      else 'Responder cliente da campanha'
    end,
    concat(
      'Campanha: ',
      coalesce(ca.nome, 'sem nome'),
      case
        when nullif(ce.resposta_cliente, '') is not null then concat('. Resposta: ', left(ce.resposta_cliente, 220))
        else '. Cliente marcou resposta ou pediu retorno.'
      end
    ),
    current_date::timestamptz,
    'aberta',
    case
      when ce.status = 'virou_orcamento' or ce.virou_orcamento then 94
      else 90
    end,
    concat('campanha:resposta:', ce.id::text)
  from public.campanha_envios ce
  join public.campanhas ca on ca.id = ce.campanha_id
  join public.clientes c on c.id = ce.cliente_id
  where ce.status in ('respondeu', 'virou_orcamento')
    and not ce.virou_venda
  on conflict (cliente_id, origem) where status = 'aberta' and origem is not null
  do update set
    vendedor_id = excluded.vendedor_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    data_vencimento = least(public.tarefas.data_vencimento, excluded.data_vencimento),
    prioridade = greatest(public.tarefas.prioridade, excluded.prioridade);

  get diagnostics campanhas_resposta = row_count;

  return jsonb_build_object(
    'orcamentos_vencidos_tarefas', orcamentos_vencidos,
    'campanhas_resposta_tarefas', campanhas_resposta,
    'tarefas_followup_total', orcamentos_vencidos + campanhas_resposta
  );
end;
$$;

create or replace function public.aplicar_vinculos_patio_por_importacao(
  p_importacao_id uuid default null,
  p_data_inicio date default null,
  p_data_fim date default null,
  p_dry_run boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data_inicio date;
  v_data_fim date;
  v_candidatos integer := 0;
  v_atendimentos_seguros integer := 0;
  v_atendimentos_atualizar integer := 0;
  v_atendimentos_atualizados integer := 0;
  v_itens_atualizados integer := 0;
  v_veiculos_atualizados integer := 0;
  v_conflitos_ambiguos integer := 0;
  v_conflitos_registrados integer := 0;
  v_auditorias_registradas integer := 0;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem aplicar vinculos do Patio por importacao.';
  end if;

  if p_importacao_id is not null then
    select
      min(data_ref),
      max(data_ref) + 1
    into v_data_inicio, v_data_fim
    from (
      select data_venda as data_ref
      from public.vendas_itens
      where importacao_id = p_importacao_id
      union all
      select data_servico as data_ref
      from public.servicos_itens
      where importacao_id = p_importacao_id
    ) datas;
  end if;

  v_data_inicio := coalesce(p_data_inicio, v_data_inicio, current_date - 180);
  v_data_fim := coalesce(p_data_fim, v_data_fim, current_date + 1);

  drop table if exists pg_temp.tmp_patio_vinculo_importacao;

  create temporary table tmp_patio_vinculo_importacao on commit drop as
  with base as (
    select
      pc.patio_execucao_id,
      pc.erp_cliente_id,
      pc.erp_cliente_nome,
      pc.pedido,
      pc.nota,
      pc.data_erp,
      pc.data_patio,
      pc.diferenca_dias,
      pc.placa,
      pc.erp_km,
      pc.patio_km,
      pc.diferenca_km,
      pa.cliente_id as cliente_atual_id,
      c_atual.nome as cliente_atual_nome,
      pa.veiculo_id,
      pa.patio_cliente_id as patio_cliente_origem_id,
      pa.patio_veiculo_id,
      pa.cliente_nome_snapshot
    from public.listar_pedidos_consolidados(v_data_inicio, v_data_fim) pc
    join public.patio_atendimentos pa on pa.patio_execucao_id = pc.patio_execucao_id
    left join public.clientes c_atual on c_atual.id = pa.cliente_id
    where pc.origem_consolidado = 'erp_com_patio'
      and pc.match_status = 'match_placa_km_data_30d'
      and pc.erp_cliente_id is not null
      and pc.patio_execucao_id is not null
      and coalesce(pc.codigo_cliente_erp, '') <> '55555'
      and pc.diferenca_km <= 10
  )
  select
    patio_execucao_id,
    count(*)::integer as linhas_match,
    count(distinct erp_cliente_id)::integer as clientes_erp_distintos,
    (array_agg(distinct erp_cliente_id))[1] as cliente_erp_id,
    (array_agg(distinct erp_cliente_nome))[1] as cliente_erp_nome,
    (array_agg(distinct cliente_atual_id) filter (where cliente_atual_id is not null))[1] as cliente_atual_id,
    (array_agg(distinct cliente_atual_nome) filter (where cliente_atual_nome is not null))[1] as cliente_atual_nome,
    (array_agg(distinct veiculo_id) filter (where veiculo_id is not null))[1] as veiculo_id,
    (array_agg(distinct patio_cliente_origem_id) filter (where patio_cliente_origem_id is not null))[1] as patio_cliente_id,
    (array_agg(distinct patio_veiculo_id) filter (where patio_veiculo_id is not null))[1] as patio_veiculo_id,
    (array_agg(distinct cliente_nome_snapshot) filter (where cliente_nome_snapshot is not null))[1] as cliente_nome_snapshot,
    array_remove(array_agg(distinct erp_cliente_nome order by erp_cliente_nome), null) as clientes_erp_nomes,
    array_remove(array_agg(distinct pedido order by pedido), '') as pedidos,
    array_remove(array_agg(distinct nota order by nota), '') as notas,
    min(diferenca_dias)::integer as menor_diferenca_dias,
    max(diferenca_dias)::integer as maior_diferenca_dias,
    max(diferenca_km)::integer as maior_diferenca_km,
    jsonb_agg(
      jsonb_build_object(
        'erp_cliente_id', erp_cliente_id,
        'erp_cliente_nome', erp_cliente_nome,
        'pedido', nullif(pedido, ''),
        'nota', nullif(nota, ''),
        'data_erp', data_erp,
        'data_patio', data_patio,
        'diferenca_dias', diferenca_dias,
        'placa', placa,
        'erp_km', erp_km,
        'patio_km', patio_km
      )
      order by data_erp, pedido, nota, erp_cliente_nome
    ) as evidencias
  from base
  group by patio_execucao_id;

  select
    count(*)::integer,
    count(*) filter (where clientes_erp_distintos = 1)::integer,
    count(*) filter (where clientes_erp_distintos = 1 and cliente_atual_id is distinct from cliente_erp_id)::integer,
    count(*) filter (where clientes_erp_distintos > 1)::integer
  into v_candidatos, v_atendimentos_seguros, v_atendimentos_atualizar, v_conflitos_ambiguos
  from tmp_patio_vinculo_importacao;

  if not p_dry_run then
    insert into public.crm_patio_conflitos (
      tipo,
      severidade,
      cliente_id,
      veiculo_id,
      patio_cliente_id,
      patio_veiculo_id,
      resumo,
      dados,
      status,
      resolvido_em
    )
    select
      'vinculo_patio_erp_aplicado',
      'baixa',
      t.cliente_erp_id,
      t.veiculo_id,
      t.patio_cliente_id,
      t.patio_veiculo_id,
      'Vinculo do atendimento do Patio ajustado pelo cliente do ERP/importacao.',
      jsonb_build_object(
        'regra', 'placa_km_exato_data_30d',
        'importacao_id', p_importacao_id,
        'data_inicio', v_data_inicio,
        'data_fim', v_data_fim,
        'patio_execucao_id', t.patio_execucao_id,
        'cliente_anterior_id', t.cliente_atual_id,
        'cliente_anterior_nome', coalesce(t.cliente_atual_nome, t.cliente_nome_snapshot),
        'cliente_erp_id', t.cliente_erp_id,
        'cliente_erp_nome', t.cliente_erp_nome,
        'pedidos', to_jsonb(t.pedidos),
        'notas', to_jsonb(t.notas),
        'menor_diferenca_dias', t.menor_diferenca_dias,
        'maior_diferenca_dias', t.maior_diferenca_dias,
        'maior_diferenca_km', t.maior_diferenca_km,
        'evidencias', t.evidencias
      ),
      'resolvido',
      now()
    from tmp_patio_vinculo_importacao t
    where t.clientes_erp_distintos = 1
      and t.cliente_atual_id is distinct from t.cliente_erp_id
      and not exists (
        select 1
        from public.crm_patio_conflitos c
        where c.tipo = 'vinculo_patio_erp_aplicado'
          and c.dados->>'patio_execucao_id' = t.patio_execucao_id::text
          and c.dados->>'cliente_erp_id' = t.cliente_erp_id::text
      );

    get diagnostics v_auditorias_registradas = row_count;

    insert into public.crm_patio_conflitos (
      tipo,
      severidade,
      cliente_id,
      veiculo_id,
      patio_cliente_id,
      patio_veiculo_id,
      resumo,
      dados,
      status
    )
    select
      'vinculo_patio_erp_ambiguo',
      'alta',
      null,
      t.veiculo_id,
      t.patio_cliente_id,
      t.patio_veiculo_id,
      'Atendimento do Patio cruzou com mais de um cliente do ERP pela regra placa+KM+data.',
      jsonb_build_object(
        'regra', 'placa_km_exato_data_30d',
        'importacao_id', p_importacao_id,
        'data_inicio', v_data_inicio,
        'data_fim', v_data_fim,
        'patio_execucao_id', t.patio_execucao_id,
        'clientes_erp_nomes', to_jsonb(t.clientes_erp_nomes),
        'pedidos', to_jsonb(t.pedidos),
        'notas', to_jsonb(t.notas),
        'menor_diferenca_dias', t.menor_diferenca_dias,
        'maior_diferenca_dias', t.maior_diferenca_dias,
        'maior_diferenca_km', t.maior_diferenca_km,
        'evidencias', t.evidencias
      ),
      'aberto'
    from tmp_patio_vinculo_importacao t
    where t.clientes_erp_distintos > 1
      and not exists (
        select 1
        from public.crm_patio_conflitos c
        where c.tipo = 'vinculo_patio_erp_ambiguo'
          and c.status = 'aberto'
          and c.dados->>'patio_execucao_id' = t.patio_execucao_id::text
      );

    get diagnostics v_conflitos_registrados = row_count;

    update public.patio_atendimentos pa
    set
      cliente_id = t.cliente_erp_id,
      sincronizado_em = now()
    from tmp_patio_vinculo_importacao t
    where t.clientes_erp_distintos = 1
      and pa.patio_execucao_id = t.patio_execucao_id
      and pa.cliente_id is distinct from t.cliente_erp_id;

    get diagnostics v_atendimentos_atualizados = row_count;

    update public.patio_atendimento_itens pai
    set
      cliente_id = t.cliente_erp_id,
      sincronizado_em = now()
    from tmp_patio_vinculo_importacao t
    where t.clientes_erp_distintos = 1
      and pai.patio_execucao_id = t.patio_execucao_id
      and pai.cliente_id is distinct from t.cliente_erp_id;

    get diagnostics v_itens_atualizados = row_count;

    with veiculos_seguros as (
      select
        patio_veiculo_id,
        (array_agg(distinct cliente_erp_id))[1] as cliente_erp_id
      from tmp_patio_vinculo_importacao
      where clientes_erp_distintos = 1
        and patio_veiculo_id is not null
      group by patio_veiculo_id
      having count(distinct cliente_erp_id) = 1
    )
    update public.patio_veiculos_snapshot pvs
    set
      cliente_id = v.cliente_erp_id,
      match_tipo = 'erp_importacao_placa_km_data',
      match_score = greatest(pvs.match_score, 120),
      sincronizado_em = now()
    from veiculos_seguros v
    where pvs.patio_veiculo_id = v.patio_veiculo_id
      and pvs.cliente_id is distinct from v.cliente_erp_id;

    get diagnostics v_veiculos_atualizados = row_count;
  end if;

  return jsonb_build_object(
    'importacao_id', p_importacao_id,
    'data_inicio', v_data_inicio,
    'data_fim', v_data_fim,
    'dry_run', p_dry_run,
    'candidatos_placa_km_data', v_candidatos,
    'atendimentos_seguros', v_atendimentos_seguros,
    'atendimentos_atualizar', v_atendimentos_atualizar,
    'atendimentos_atualizados', v_atendimentos_atualizados,
    'itens_atualizados', v_itens_atualizados,
    'veiculos_atualizados', v_veiculos_atualizados,
    'conflitos_ambiguos', v_conflitos_ambiguos,
    'conflitos_registrados', v_conflitos_registrados,
    'auditorias_registradas', v_auditorias_registradas
  );
end;
$$;

drop function if exists public.finalizar_importacao_diaria();

create or replace function public.finalizar_importacao_diaria(p_importacao_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clientes_atualizados integer;
  oportunidades_geradas integer := 0;
  tarefas_followup jsonb := '{}'::jsonb;
  patio_vinculos jsonb := '{}'::jsonb;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    raise exception 'Apenas administradores podem finalizar importacoes.';
  end if;

  if p_importacao_id is null then
    clientes_atualizados := public.refresh_clientes_comercial_stats();
  else
    clientes_atualizados := public.refresh_clientes_comercial_stats_por_importacao(p_importacao_id);
  end if;

  begin
    patio_vinculos := public.aplicar_vinculos_patio_por_importacao(p_importacao_id);
  exception
    when query_canceled then
      patio_vinculos := jsonb_build_object('adiado', true, 'erro', sqlerrm, 'code', sqlstate);
    when others then
      patio_vinculos := jsonb_build_object('adiado', true, 'erro', sqlerrm, 'code', sqlstate);
  end;

  begin
    oportunidades_geradas := public.refresh_oportunidades_cache();
  exception
    when query_canceled then
      oportunidades_geradas := 0;
    when others then
      oportunidades_geradas := 0;
  end;

  begin
    tarefas_followup := public.criar_tarefas_followup_automaticas();
  exception
    when query_canceled then
      tarefas_followup := jsonb_build_object('adiado', true, 'erro', sqlerrm, 'code', sqlstate);
    when others then
      tarefas_followup := jsonb_build_object('adiado', true, 'erro', sqlerrm, 'code', sqlstate);
  end;

  return jsonb_build_object(
    'clientes_atualizados', clientes_atualizados,
    'oportunidades_geradas', oportunidades_geradas,
    'tarefas_followup', tarefas_followup,
    'patio_vinculos', patio_vinculos
  );
end;
$$;

grant execute on function public.refresh_clientes_comercial_stats_por_importacao(uuid) to authenticated, service_role;
grant execute on function public.aplicar_vinculos_patio_por_importacao(uuid, date, date, boolean) to authenticated, service_role;
grant execute on function public.finalizar_importacao_diaria(uuid) to authenticated, service_role;
