create or replace function public.finalizar_box_patio_crm(
  p_patio_execucao_id bigint,
  p_servicos jsonb,
  p_observacao_final text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atendimento public.patio_atendimentos%rowtype;
  v_servico jsonb;
  v_itens_restantes integer := 0;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para finalizar box.';
  end if;

  select * into v_atendimento
  from public.patio_atendimentos
  where patio_execucao_id = p_patio_execucao_id and status = 'em_andamento';

  if v_atendimento.patio_execucao_id is null then
    raise exception 'Execucao em andamento nao encontrada.';
  end if;

  if jsonb_array_length(coalesce(p_servicos, '[]'::jsonb)) = 0 then
    update public.patio_atendimento_itens
    set observacao_execucao = coalesce(nullif(p_observacao_final, ''), observacao_execucao),
        status = 'finalizado',
        atualizado_em = now(),
        sincronizado_em = now()
    where patio_execucao_id = p_patio_execucao_id
      and status = 'em_andamento';
  else
    for v_servico in select * from jsonb_array_elements(coalesce(p_servicos, '[]'::jsonb))
    loop
      update public.patio_atendimento_itens
      set quantidade = case
            when coalesce(v_servico->>'quantidade', '') ~ '^[0-9]+$' then greatest(0, (v_servico->>'quantidade')::integer)
            else quantidade
          end,
          observacao_execucao = coalesce(nullif(v_servico->>'observacao_execucao', ''), p_observacao_final, observacao_execucao),
          status = 'finalizado',
          atualizado_em = now(),
          sincronizado_em = now()
      where id = (v_servico->>'id')::uuid
        and patio_execucao_id = p_patio_execucao_id;
    end loop;
  end if;

  select count(*)
  into v_itens_restantes
  from public.patio_atendimento_itens
  where patio_execucao_id = p_patio_execucao_id
    and status in ('pendente', 'em_andamento');

  if v_itens_restantes > 0 then
    update public.patio_atendimentos
    set status = 'pendente',
        box_id = null,
        funcionario_id = null,
        fim_execucao = null,
        usuario_finalizacao_id = null,
        raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object('ultima_observacao_box', p_observacao_final),
        sincronizado_em = now()
    where patio_execucao_id = p_patio_execucao_id;

    update public.patio_boxes_snapshot
    set ocupado = false,
        sincronizado_em = now()
    where patio_box_id = v_atendimento.box_id;

    return;
  end if;

  update public.patio_atendimentos
  set status = 'finalizado',
      fim_execucao = now(),
      usuario_finalizacao_id = null,
      raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object('observacao_final', p_observacao_final),
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;

  update public.patio_boxes_snapshot
  set ocupado = false,
      sincronizado_em = now()
  where patio_box_id = v_atendimento.box_id;

  if to_regprocedure('public.refresh_patio_omsys_vendas_exportacoes(timestamp with time zone)') is not null then
    execute 'select public.refresh_patio_omsys_vendas_exportacoes($1)'
    using now() - interval '2 days';
  end if;
end;
$$;

grant execute on function public.finalizar_box_patio_crm(bigint, jsonb, text) to authenticated, service_role;

do $$
declare
  v_base_execucao_id bigint := 1000000030;
  v_fragmentos bigint[] := array[1000000031, 1000000032];
  v_total integer := 0;
  v_mesma_visita boolean := false;
  v_fim_execucao timestamptz;
begin
  select count(*),
         count(distinct patio_veiculo_id) = 1
         and count(distinct cliente_id) = 1
         and count(distinct upper(regexp_replace(coalesce(placa_snapshot, ''), '[^A-Za-z0-9]+', '', 'g'))) = 1
         and count(distinct coalesce(quilometragem, -1)) = 1
         and max(inicio_execucao) - min(inicio_execucao) <= interval '15 minutes'
  into v_total, v_mesma_visita
  from public.patio_atendimentos
  where patio_execucao_id = v_base_execucao_id
     or patio_execucao_id = any(v_fragmentos);

  if v_total = 3 and coalesce(v_mesma_visita, false) then
    select max(fim_execucao)
    into v_fim_execucao
    from public.patio_atendimentos
    where patio_execucao_id = v_base_execucao_id
       or patio_execucao_id = any(v_fragmentos);

    update public.patio_atendimento_itens
    set patio_execucao_id = v_base_execucao_id,
        atualizado_em = now(),
        sincronizado_em = now()
    where patio_execucao_id = any(v_fragmentos);

    update public.patio_atendimentos
    set status = 'finalizado',
        fim_execucao = coalesce(v_fim_execucao, fim_execucao),
        box_id = null,
        funcionario_id = null,
        raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object(
          'fragmentos_mesclados', to_jsonb(v_fragmentos),
          'mesclado_em', now()
        ),
        sincronizado_em = now()
    where patio_execucao_id = v_base_execucao_id;

    delete from public.patio_atendimentos pa
    where pa.patio_execucao_id = any(v_fragmentos)
      and not exists (
        select 1
        from public.patio_atendimento_itens pai
        where pai.patio_execucao_id = pa.patio_execucao_id
      );

    if to_regprocedure('public.refresh_patio_omsys_vendas_exportacoes(timestamp with time zone)') is not null then
      perform public.refresh_patio_omsys_vendas_exportacoes(now() - interval '2 days');
    end if;
  end if;
end;
$$;
