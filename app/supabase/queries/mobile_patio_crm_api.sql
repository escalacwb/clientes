create or replace function public.mobile_format_placa(p_placa text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_placa, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

create or replace function public.mobile_format_phone(p_phone text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
$$;

create or replace function public.mobile_catalog_services()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'borracharia', coalesce(jsonb_agg(nome order by nome) filter (where area = 'borracharia'), '[]'::jsonb),
    'alinhamento', coalesce(jsonb_agg(nome order by nome) filter (where area = 'alinhamento'), '[]'::jsonb),
    'manutencao', coalesce(jsonb_agg(nome order by nome) filter (where area = 'manutencao'), '[]'::jsonb)
  )
  from public.vw_patio_catalogo_servicos
$$;

create or replace function public.mobile_clients_search(p_term text)
returns table (
  id bigint,
  nome_empresa text,
  nome_fantasia text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    patio_cliente_id as id,
    nome_empresa,
    nome_fantasia
  from public.patio_clientes_snapshot
  where nullif(trim(coalesce(p_term, '')), '') is not null
    and (
      unaccent(coalesce(nome_empresa, '')) ilike '%' || unaccent(trim(p_term)) || '%'
      or unaccent(coalesce(nome_fantasia, '')) ilike '%' || unaccent(trim(p_term)) || '%'
      or coalesce(codigo_antigo, '') ilike '%' || trim(p_term) || '%'
    )
  order by nome_empresa
  limit 20
$$;

create or replace function public.mobile_client_details(p_client_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(row)
  from (
    select
      patio_cliente_id as id,
      nome_empresa,
      nome_fantasia,
      nome_responsavel,
      contato_responsavel,
      cidade,
      uf,
      email
    from public.patio_clientes_snapshot
    where patio_cliente_id = p_client_id
  ) row
$$;

create or replace function public.mobile_vehicle_by_plate(p_placa text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(row)
  from (
    select
      v.patio_veiculo_id as id,
      v.placa,
      v.empresa,
      v.modelo,
      v.ano_modelo,
      v.nome_motorista,
      v.contato_motorista,
      v.patio_cliente_id as cliente_id,
      c.nome_responsavel,
      c.contato_responsavel,
      v.media_km_diaria
    from public.patio_veiculos_snapshot v
    left join public.patio_clientes_snapshot c on c.patio_cliente_id = v.patio_cliente_id
    where public.mobile_format_placa(v.placa) = public.mobile_format_placa(p_placa)
    order by v.sincronizado_em desc
    limit 1
  ) row
$$;

create or replace function public.mobile_client_create(
  p_nome_empresa text,
  p_nome_fantasia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  v_id := nextval('public.crm_patio_cliente_seq');

  insert into public.patio_clientes_snapshot (
    patio_cliente_id, nome_empresa, nome_fantasia, match_tipo, match_score, raw_data, sincronizado_em
  )
  values (
    v_id, nullif(p_nome_empresa, ''), nullif(p_nome_fantasia, ''), 'crm_mobile', 0,
    jsonb_build_object('origem', 'mobile_crm'), now()
  );

  return jsonb_build_object('id', v_id, 'nome_empresa', p_nome_empresa, 'nome_fantasia', p_nome_fantasia);
end;
$$;

create or replace function public.mobile_client_update(
  p_client_id bigint,
  p_nome_responsavel text default null,
  p_contato_responsavel text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.patio_clientes_snapshot
  set nome_responsavel = nullif(p_nome_responsavel, ''),
      contato_responsavel = nullif(public.mobile_format_phone(p_contato_responsavel), ''),
      data_atualizacao_contato = now(),
      sincronizado_em = now()
  where patio_cliente_id = p_client_id;

  return public.mobile_client_details(p_client_id);
end;
$$;

create or replace function public.mobile_vehicle_create(
  p_placa text,
  p_empresa text,
  p_modelo text default null,
  p_ano_modelo integer default null,
  p_nome_motorista text default null,
  p_contato_motorista text default null,
  p_cliente_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_placa text;
begin
  v_placa := public.mobile_format_placa(p_placa);

  select patio_veiculo_id into v_id
  from public.patio_veiculos_snapshot
  where public.mobile_format_placa(placa) = v_placa
  limit 1;

  if v_id is null then
    v_id := nextval('public.crm_patio_veiculo_seq');
    insert into public.patio_veiculos_snapshot (
      patio_veiculo_id, patio_cliente_id, placa, empresa, modelo, ano_modelo,
      nome_motorista, contato_motorista, match_tipo, match_score, raw_data, sincronizado_em
    )
    values (
      v_id, p_cliente_id, v_placa, nullif(p_empresa, ''), nullif(p_modelo, ''), p_ano_modelo,
      nullif(p_nome_motorista, ''), nullif(public.mobile_format_phone(p_contato_motorista), ''),
      'crm_mobile', 0, jsonb_build_object('origem', 'mobile_crm'), now()
    );
  else
    update public.patio_veiculos_snapshot
    set patio_cliente_id = coalesce(p_cliente_id, patio_cliente_id),
        empresa = coalesce(nullif(p_empresa, ''), empresa),
        modelo = coalesce(nullif(p_modelo, ''), modelo),
        ano_modelo = coalesce(p_ano_modelo, ano_modelo),
        nome_motorista = coalesce(nullif(p_nome_motorista, ''), nome_motorista),
        contato_motorista = coalesce(nullif(public.mobile_format_phone(p_contato_motorista), ''), contato_motorista),
        data_atualizacao_contato = now(),
        sincronizado_em = now()
    where patio_veiculo_id = v_id;
  end if;

  return public.mobile_vehicle_by_plate(v_placa);
end;
$$;

create or replace function public.mobile_vehicle_update(
  p_veiculo_id bigint,
  p_modelo text default null,
  p_ano_modelo integer default null,
  p_nome_motorista text default null,
  p_contato_motorista text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_placa text;
begin
  update public.patio_veiculos_snapshot
  set modelo = coalesce(nullif(p_modelo, ''), modelo),
      ano_modelo = coalesce(p_ano_modelo, ano_modelo),
      nome_motorista = coalesce(nullif(p_nome_motorista, ''), nome_motorista),
      contato_motorista = coalesce(nullif(public.mobile_format_phone(p_contato_motorista), ''), contato_motorista),
      data_atualizacao_contato = now(),
      sincronizado_em = now()
  where patio_veiculo_id = p_veiculo_id
  returning placa into v_placa;

  return public.mobile_vehicle_by_plate(v_placa);
end;
$$;

create or replace function public.mobile_vehicle_company_update(
  p_veiculo_id bigint,
  p_empresa text,
  p_cliente_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_placa text;
begin
  update public.patio_veiculos_snapshot
  set empresa = nullif(p_empresa, ''),
      patio_cliente_id = coalesce(p_cliente_id, patio_cliente_id),
      sincronizado_em = now()
  where patio_veiculo_id = p_veiculo_id
  returning placa into v_placa;

  return public.mobile_vehicle_by_plate(v_placa);
end;
$$;

create or replace function public.mobile_services_register(
  p_veiculo_id bigint,
  p_quilometragem integer,
  p_observacao text default '',
  p_itens jsonb default '[]'::jsonb,
  p_usuario_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_veiculo public.patio_veiculos_snapshot%rowtype;
  v_execucao_id bigint;
  v_servicos jsonb;
begin
  select * into v_veiculo from public.patio_veiculos_snapshot where patio_veiculo_id = p_veiculo_id;
  if v_veiculo.patio_veiculo_id is null then
    raise exception 'Veiculo nao encontrado.';
  end if;

  v_servicos := (
    select coalesce(jsonb_agg(jsonb_build_object(
      'area', public.patio_normalizar_area(item->>'area'),
      'servicoNome', item->>'tipo',
      'quantidade', greatest(1, coalesce(nullif(item->>'qtd', '')::integer, 1))
    )), '[]'::jsonb)
    from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) item
  );

  v_execucao_id := public.registrar_entrada_patio_crm(
    p_veiculo_id,
    p_quilometragem,
    v_veiculo.nome_motorista,
    v_veiculo.contato_motorista,
    v_servicos,
    p_observacao
  );

  return jsonb_build_object('id', v_execucao_id, 'execucao_id', v_execucao_id);
end;
$$;

create or replace function public.mobile_pending_vehicles()
returns table (
  id bigint,
  placa text,
  empresa text,
  modelo text,
  pendentes bigint,
  em_andamento bigint,
  primeira_solicitacao timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    patio_veiculo_id as id,
    placa,
    cliente_nome as empresa,
    veiculo_descricao as modelo,
    pendentes,
    em_andamento,
    primeira_solicitacao
  from public.vw_patio_alocacao_veiculos
  where pendentes > 0
  order by primeira_solicitacao nulls last, placa
$$;

create or replace function public.mobile_pending_areas(p_veiculo_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'areas', coalesce(jsonb_agg(area order by area), '[]'::jsonb),
    'quilometragem', max(quilometragem)
  )
  from public.vw_patio_areas_pendentes
  where patio_veiculo_id = p_veiculo_id
$$;

create or replace function public.mobile_funcionarios()
returns table (id bigint, nome text)
language sql
stable
security definer
set search_path = public
as $$
  select patio_funcionario_id as id, nome
  from public.patio_funcionarios_snapshot
  where ativo = true and patio_funcionario_id > 0
  order by nome
$$;

create or replace function public.mobile_boxes_available()
returns table (id integer)
language sql
stable
security definer
set search_path = public
as $$
  select patio_box_id as id
  from public.patio_boxes_snapshot
  where ativo = true and ocupado = false and patio_box_id > 0
  order by patio_box_id
$$;

create or replace function public.mobile_assign(
  p_veiculo_id bigint,
  p_area text,
  p_box_id integer,
  p_funcionario_id bigint,
  p_usuario_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execucao_id bigint;
begin
  v_execucao_id := public.alocar_servicos_patio_crm(
    p_veiculo_id,
    public.patio_normalizar_area(p_area),
    p_box_id,
    p_funcionario_id
  );
  return jsonb_build_object('id', v_execucao_id, 'execucao_id', v_execucao_id);
end;
$$;

create or replace function public.mobile_queues()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'boxes', coalesce((select jsonb_agg(to_jsonb(b) order by b.box_id) from public.vw_patio_boxes_painel b where b.patio_execucao_id is not null), '[]'::jsonb),
    'fila', coalesce((select jsonb_agg(to_jsonb(f) order by f.primeira_solicitacao nulls last, f.placa) from public.vw_patio_fila_painel f), '[]'::jsonb)
  )
$$;

create or replace function public.mobile_boxes_active()
returns table (
  box_id integer,
  execucao_id bigint,
  veiculo_id bigint,
  placa text,
  empresa text,
  modelo text,
  funcionario text,
  nome_motorista text,
  contato_motorista text,
  quilometragem integer,
  lista_servicos text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    box_id,
    patio_execucao_id as execucao_id,
    patio_veiculo_id as veiculo_id,
    placa,
    cliente_nome as empresa,
    veiculo_descricao as modelo,
    funcionario_nome as funcionario,
    nome_motorista,
    contato_motorista,
    quilometragem,
    lista_servicos
  from public.vw_patio_boxes_painel
  order by box_id
$$;

create or replace function public.mobile_box_details(p_box_id integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with execucao as (
    select *
    from public.vw_patio_boxes_painel
    where box_id = p_box_id and patio_execucao_id is not null
    limit 1
  ),
  servicos as (
    select
      id::text as id,
      area,
      servico_nome as tipo,
      quantidade,
      observacao_cadastro,
      observacao_execucao
    from public.patio_atendimento_itens
    where patio_execucao_id = (select patio_execucao_id from execucao)
      and status = 'em_andamento'
    order by area, servico_nome
  )
  select jsonb_build_object(
    'execucao', (
      select to_jsonb(row)
      from (
        select
          box_id,
          patio_execucao_id as id,
          patio_execucao_id as execucao_id,
          patio_veiculo_id as veiculo_id,
          placa,
          cliente_nome as empresa,
          veiculo_descricao as modelo,
          funcionario_nome as funcionario,
          nome_motorista,
          contato_motorista,
          quilometragem
        from execucao
      ) row
    ),
    'servicos', coalesce((select jsonb_agg(to_jsonb(servicos)) from servicos), '[]'::jsonb)
  )
$$;

create or replace function public.mobile_add_box_service(
  p_box_id integer,
  p_tipo text,
  p_quantidade integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execucao_id bigint;
begin
  select patio_execucao_id into v_execucao_id
  from public.patio_atendimentos
  where box_id = p_box_id and status = 'em_andamento'
  limit 1;

  if v_execucao_id is null then
    raise exception 'Box sem atendimento em andamento.';
  end if;

  perform public.adicionar_servico_box_patio_crm(v_execucao_id, 'borracharia', p_tipo, greatest(1, coalesce(p_quantidade, 1)));
  return public.mobile_box_details(p_box_id);
end;
$$;

create or replace function public.mobile_unassign_box(p_box_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execucao_id bigint;
begin
  select patio_execucao_id into v_execucao_id
  from public.patio_atendimentos
  where box_id = p_box_id and status = 'em_andamento'
  limit 1;

  if v_execucao_id is not null then
    perform public.retirar_box_patio_crm(v_execucao_id);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.mobile_finalize_box(
  p_box_id integer,
  p_obs_final text default '',
  p_servicos jsonb default '[]'::jsonb,
  p_usuario_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execucao_id bigint;
  v_payload jsonb;
begin
  select patio_execucao_id into v_execucao_id
  from public.patio_atendimentos
  where box_id = p_box_id and status = 'em_andamento'
  limit 1;

  if v_execucao_id is null then
    raise exception 'Box sem atendimento em andamento.';
  end if;

  v_payload := (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', pai.id,
      'quantidade', coalesce(nullif(item->>'quantidade', '')::integer, pai.quantidade),
      'observacao_execucao', item->>'observacao_execucao'
    )), '[]'::jsonb)
    from jsonb_array_elements(coalesce(p_servicos, '[]'::jsonb)) item
    join public.patio_atendimento_itens pai
      on pai.patio_execucao_id = v_execucao_id
     and pai.id = nullif(item->>'id', '')::uuid
  );

  perform public.finalizar_box_patio_crm(v_execucao_id, v_payload, p_obs_final);
  return jsonb_build_object('ok', true, 'execucao_id', v_execucao_id);
end;
$$;

create or replace function public.mobile_completed_services(
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  execucao_id bigint,
  service_id text,
  veiculo_id bigint,
  placa text,
  empresa text,
  quilometragem integer,
  fim_execucao timestamptz,
  area text,
  tipo text,
  quantidade integer,
  funcionario text,
  observacao text,
  tipo_atendimento text
)
language sql
stable
security definer
set search_path = public
as $$
  with atendimentos as (
    select *
    from public.patio_atendimentos pa
    where pa.status = 'finalizado'
    and (p_start_date is null or pa.fim_execucao >= p_start_date::timestamptz)
    and (p_end_date is null or pa.fim_execucao < (p_end_date + 1)::timestamptz)
    order by pa.fim_execucao desc nulls last
    limit 120
  )
  select
    pa.patio_execucao_id as execucao_id,
    pai.id::text as service_id,
    pa.patio_veiculo_id as veiculo_id,
    pa.placa_snapshot as placa,
    coalesce(pa.cliente_nome_snapshot, pvs.empresa) as empresa,
    pa.quilometragem,
    pa.fim_execucao,
    pai.area,
    coalesce(pai.servico_nome, pai.descricao) as tipo,
    pai.quantidade,
    pfs.nome as funcionario,
    coalesce(pai.observacao_execucao, pai.observacao_cadastro) as observacao,
    pai.tipo_atendimento
  from atendimentos pa
  left join public.patio_atendimento_itens pai on pai.patio_execucao_id = pa.patio_execucao_id
  left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
  left join public.patio_funcionarios_snapshot pfs on pfs.patio_funcionario_id = pai.funcionario_id
  order by pa.fim_execucao desc nulls last, pai.area, pai.servico_nome
$$;

create or replace function public.mobile_update_tipo_atendimento(
  p_service_id text,
  p_area text,
  p_tipo_atendimento text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.patio_atendimento_itens
  set tipo_atendimento = nullif(p_tipo_atendimento, ''),
      atualizado_em = now(),
      sincronizado_em = now()
  where id = p_service_id::uuid;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.mobile_revert_visit(
  p_veiculo_id bigint,
  p_quilometragem integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execucao_id bigint;
begin
  select patio_execucao_id into v_execucao_id
  from public.patio_atendimentos
  where patio_veiculo_id = p_veiculo_id
    and status = 'finalizado'
    and (p_quilometragem is null or quilometragem = p_quilometragem)
  order by fim_execucao desc nulls last
  limit 1;

  if v_execucao_id is null then
    raise exception 'Visita finalizada nao encontrada.';
  end if;

  perform public.reverter_visita_patio_crm(v_execucao_id);
  return jsonb_build_object('ok', true, 'execucao_id', v_execucao_id);
end;
$$;

create or replace function public.mobile_term_data(p_execucao_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'execucao', (
      select to_jsonb(row)
      from (
        select
          pa.patio_execucao_id as id,
          pa.patio_execucao_id as execucao_id,
          pa.patio_veiculo_id as veiculo_id,
          pa.placa_snapshot as placa,
          coalesce(pa.cliente_nome_snapshot, pvs.empresa) as empresa,
          pvs.modelo,
          pa.nome_motorista,
          pa.contato_motorista,
          pa.quilometragem,
          pa.fim_execucao
        from public.patio_atendimentos pa
        left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
        where pa.patio_execucao_id = p_execucao_id
      ) row
    ),
    'servicos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'area', pai.area,
        'tipo', coalesce(pai.servico_nome, pai.descricao),
        'quantidade', pai.quantidade,
        'observacao', coalesce(pai.observacao_execucao, pai.observacao_cadastro)
      ) order by pai.area, pai.servico_nome)
      from public.patio_atendimento_itens pai
      where pai.patio_execucao_id = p_execucao_id
    ), '[]'::jsonb)
  )
$$;

grant execute on function public.mobile_format_placa(text) to anon, authenticated, service_role;
grant execute on function public.mobile_format_phone(text) to anon, authenticated, service_role;
grant execute on function public.mobile_catalog_services() to anon, authenticated, service_role;
grant execute on function public.mobile_clients_search(text) to anon, authenticated, service_role;
grant execute on function public.mobile_client_details(bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_vehicle_by_plate(text) to anon, authenticated, service_role;
grant execute on function public.mobile_client_create(text, text) to anon, authenticated, service_role;
grant execute on function public.mobile_client_update(bigint, text, text) to anon, authenticated, service_role;
grant execute on function public.mobile_vehicle_create(text, text, text, integer, text, text, bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_vehicle_update(bigint, text, integer, text, text) to anon, authenticated, service_role;
grant execute on function public.mobile_vehicle_company_update(bigint, text, bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_services_register(bigint, integer, text, jsonb, bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_pending_vehicles() to anon, authenticated, service_role;
grant execute on function public.mobile_pending_areas(bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_funcionarios() to anon, authenticated, service_role;
grant execute on function public.mobile_boxes_available() to anon, authenticated, service_role;
grant execute on function public.mobile_assign(bigint, text, integer, bigint, bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_queues() to anon, authenticated, service_role;
grant execute on function public.mobile_boxes_active() to anon, authenticated, service_role;
grant execute on function public.mobile_box_details(integer) to anon, authenticated, service_role;
grant execute on function public.mobile_add_box_service(integer, text, integer) to anon, authenticated, service_role;
grant execute on function public.mobile_unassign_box(integer) to anon, authenticated, service_role;
grant execute on function public.mobile_finalize_box(integer, text, jsonb, bigint) to anon, authenticated, service_role;
grant execute on function public.mobile_completed_services(date, date) to anon, authenticated, service_role;
grant execute on function public.mobile_update_tipo_atendimento(text, text, text) to anon, authenticated, service_role;
grant execute on function public.mobile_revert_visit(bigint, integer) to anon, authenticated, service_role;
grant execute on function public.mobile_term_data(bigint) to anon, authenticated, service_role;
