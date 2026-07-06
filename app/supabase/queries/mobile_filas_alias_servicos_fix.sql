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
  if p_quilometragem is not null and p_quilometragem <= 0 then
    raise exception 'KM zero nao pode ser usado. Informe um KM valido ou deixe em branco.';
  end if;

  select * into v_veiculo from public.patio_veiculos_snapshot where patio_veiculo_id = p_veiculo_id;
  if v_veiculo.patio_veiculo_id is null then
    raise exception 'Veiculo nao encontrado.';
  end if;
  if v_veiculo.cliente_id is null then
    raise exception 'Selecione um cadastro do cliente antes de iniciar a entrada. Se nao houver cadastro, use Consumidor 55555 e informe o nome.';
  end if;
  if exists (select 1 from public.clientes c where c.id = v_veiculo.cliente_id and c.codigo_erp = '55555')
     and (nullif(trim(v_veiculo.empresa), '') is null or upper(trim(v_veiculo.empresa)) = 'CONSUMIDOR FINAL') then
    raise exception 'Informe o nome do cliente avulso para usar Consumidor 55555.';
  end if;

  v_servicos := (
    select coalesce(jsonb_agg(jsonb_build_object(
      'area', public.patio_normalizar_area(item->>'area'),
      'servico_nome', coalesce(item->>'servico_nome', item->>'servicoNome', item->>'tipo'),
      'descricao', coalesce(item->>'descricao', item->>'servico_nome', item->>'servicoNome', item->>'tipo'),
      'quantidade', greatest(1, coalesce(nullif(coalesce(item->>'quantidade', item->>'qtd'), '')::integer, 1))
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

revoke execute on function public.mobile_services_register(bigint, integer, text, jsonb, bigint) from anon;
revoke execute on function public.mobile_services_register(bigint, integer, text, jsonb, bigint) from public;
grant execute on function public.mobile_services_register(bigint, integer, text, jsonb, bigint) to authenticated, service_role;

create or replace function public.mobile_queues()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'boxes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'box_id', b.box_id,
          'execucao_id', b.patio_execucao_id,
          'veiculo_id', b.patio_veiculo_id,
          'placa', b.placa,
          'empresa', b.cliente_nome,
          'modelo', b.veiculo_descricao,
          'funcionario', b.funcionario_nome,
          'nome_motorista', b.nome_motorista,
          'contato_motorista', b.contato_motorista,
          'quilometragem', b.quilometragem,
          'servicos', nullif(b.lista_servicos, ''),
          'lista_servicos', b.lista_servicos
        )
        order by b.box_id
      )
      from public.vw_patio_boxes_painel b
      where b.patio_execucao_id is not null
    ), '[]'::jsonb),
    'fila', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'patio_veiculo_id', f.patio_veiculo_id,
          'veiculo_id', f.veiculo_id,
          'cliente_id', f.cliente_id,
          'placa', f.placa,
          'empresa', f.cliente_nome,
          'primeira_solicitacao', f.primeira_solicitacao,
          'servicos', nullif(f.lista_servicos, ''),
          'lista_servicos', f.lista_servicos,
          'total_itens', f.total_itens
        )
        order by f.primeira_solicitacao nulls last, f.placa
      )
      from public.vw_patio_fila_painel f
    ), '[]'::jsonb)
  )
$$;

revoke execute on function public.mobile_queues() from anon;
revoke execute on function public.mobile_queues() from public;
grant execute on function public.mobile_queues() to authenticated, service_role;

update public.patio_atendimento_itens
set servico_nome = nullif(coalesce(raw_data->>'servico_nome', raw_data->>'servicoNome', raw_data->>'tipo'), ''),
    descricao = nullif(coalesce(descricao, raw_data->>'descricao', raw_data->>'servico_nome', raw_data->>'servicoNome', raw_data->>'tipo'), ''),
    atualizado_em = now(),
    sincronizado_em = now()
where patio_tabela_origem = 'crm_patio'
  and servico_nome is null
  and nullif(coalesce(raw_data->>'servico_nome', raw_data->>'servicoNome', raw_data->>'tipo'), '') is not null;
