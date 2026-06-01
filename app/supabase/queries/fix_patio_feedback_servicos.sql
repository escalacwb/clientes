create or replace view public.vw_patio_feedback_pendente
with (security_invoker = true) as
select
  pa.patio_execucao_id,
  pa.cliente_id,
  c.nome as cliente_nome,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot) as placa,
  coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
  pa.quilometragem,
  pa.fim_execucao,
  pa.nome_motorista,
  pa.contato_motorista,
  contato.whatsapp as contato_recomendado,
  contato.nome as contato_nome,
  contato.tipo as contato_tipo,
  coalesce(servicos.servicos, array[]::text[]) as servicos
from public.patio_atendimentos pa
join public.clientes c on c.id = pa.cliente_id
left join public.veiculos v on v.id = pa.veiculo_id
left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
left join lateral (
  select contato_base.nome, contato_base.tipo, contato_base.whatsapp
  from (
    select
      cc.nome,
      coalesce(cc.tipo, 'cadastro') as tipo,
      nullif(coalesce(cc.whatsapp, cc.telefone), '') as whatsapp,
      case cc.origem_sistema when 'patio' then 0 else 1 end as origem_ordem,
      cc.prioridade,
      cc.atualizado_em
    from public.cliente_contatos cc
    where cc.cliente_id = pa.cliente_id
      and cc.valido = true
      and nullif(coalesce(cc.whatsapp, cc.telefone), '') is not null

    union all

    select
      c.responsavel_nome,
      'cadastro',
      nullif(coalesce(c.whatsapp_principal, c.telefone_principal), ''),
      1,
      30,
      c.atualizado_em
    where nullif(coalesce(c.whatsapp_principal, c.telefone_principal), '') is not null
  ) contato_base
  order by contato_base.origem_ordem, contato_base.prioridade desc, contato_base.atualizado_em desc nulls last
  limit 1
) contato on true
left join lateral (
  select array_agg(label order by area_ordem, label) as servicos
  from (
    select distinct
      case pai.area
        when 'borracharia' then 1
        when 'alinhamento' then 2
        when 'manutencao' then 3
        else 9
      end as area_ordem,
      concat(
        coalesce(nullif(pai.servico_nome, ''), nullif(pai.descricao, ''), pai.area, 'Servico'),
        case
          when coalesce(pai.quantidade, 1) > 1 then ' (' || pai.quantidade::text || 'x)'
          else ''
        end
      ) as label
    from public.patio_atendimento_itens pai
    where pai.patio_execucao_id = pa.patio_execucao_id
      and pai.status = 'finalizado'
      and coalesce(nullif(pai.servico_nome, ''), nullif(pai.descricao, ''), pai.area) is not null
  ) itens
) servicos on true
where pa.status = 'finalizado'
  and pa.data_feedback is null
  and pa.fim_execucao is not null
order by pa.fim_execucao asc;

grant select on public.vw_patio_feedback_pendente to anon, authenticated, service_role;
