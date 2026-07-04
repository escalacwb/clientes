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
          e.box_id,
          e.patio_execucao_id as id,
          e.patio_execucao_id as execucao_id,
          e.patio_veiculo_id as veiculo_id,
          e.placa,
          e.cliente_nome as empresa,
          e.veiculo_descricao as modelo,
          e.funcionario_nome as funcionario,
          e.nome_motorista,
          e.contato_motorista,
          contato.responsavel_nome,
          contato.contato_responsavel,
          contato.responsavel_tipo,
          e.quilometragem
        from execucao e
        left join lateral (
          select
            contato_base.nome as responsavel_nome,
            contato_base.whatsapp as contato_responsavel,
            contato_base.tipo as responsavel_tipo
          from (
            select
              nullif(c.responsavel_nome, '') as nome,
              'cadastro' as tipo,
              nullif(coalesce(c.whatsapp_principal, c.telefone_principal), '') as whatsapp,
              0 as origem_ordem,
              30 as prioridade,
              c.atualizado_em
            from public.clientes c
            where c.id = e.cliente_id
              and nullif(coalesce(c.whatsapp_principal, c.telefone_principal), '') is not null

            union all

            select
              cc.nome,
              coalesce(cc.tipo, 'cadastro') as tipo,
              nullif(coalesce(cc.whatsapp, cc.telefone), '') as whatsapp,
              1 as origem_ordem,
              cc.prioridade,
              cc.atualizado_em
            from public.cliente_contatos cc
            where cc.cliente_id = e.cliente_id
              and cc.valido = true
              and nullif(coalesce(cc.whatsapp, cc.telefone), '') is not null
              and coalesce(cc.tipo, '') !~* 'motorista'
          ) contato_base
          order by contato_base.origem_ordem, contato_base.prioridade desc, contato_base.atualizado_em desc nulls last
          limit 1
        ) contato on true
      ) row
    ),
    'servicos', coalesce((select jsonb_agg(to_jsonb(servicos)) from servicos), '[]'::jsonb)
  )
$$;

revoke execute on function public.mobile_box_details(integer) from anon;
grant execute on function public.mobile_box_details(integer) to authenticated, service_role;
