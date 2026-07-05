create or replace view public.vw_patio_feedback_pendente
with (security_invoker = true) as
select
  pa.patio_execucao_id,
  pa.cliente_id,
  case
    when c.codigo_erp = '55555'
      and nullif(btrim(pa.cliente_nome_snapshot), '') is not null
      and upper(btrim(pa.cliente_nome_snapshot)) <> 'CONSUMIDOR FINAL'
      then pa.cliente_nome_snapshot
    else coalesce(c.nome, pa.cliente_nome_snapshot)
  end as cliente_nome,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot) as placa,
  coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
  pa.quilometragem,
  pa.fim_execucao,
  pa.nome_motorista,
  pa.contato_motorista,
  cr.whatsapp as contato_recomendado,
  cr.nome as contato_nome,
  cr.tipo as contato_tipo,
  array_remove(array_agg(distinct pai.servico_nome) filter (where pai.servico_nome is not null), null) as servicos
from public.patio_atendimentos pa
join public.clientes c on c.id = pa.cliente_id
left join public.veiculos v on v.id = pa.veiculo_id
left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
left join public.vw_cliente_contatos_recomendados cr on cr.cliente_id = pa.cliente_id
left join public.patio_atendimento_itens pai on pai.patio_execucao_id = pa.patio_execucao_id
where pa.status = 'finalizado'
  and pa.data_feedback is null
  and pa.fim_execucao is not null
group by
  pa.patio_execucao_id,
  pa.cliente_id,
  case
    when c.codigo_erp = '55555'
      and nullif(btrim(pa.cliente_nome_snapshot), '') is not null
      and upper(btrim(pa.cliente_nome_snapshot)) <> 'CONSUMIDOR FINAL'
      then pa.cliente_nome_snapshot
    else coalesce(c.nome, pa.cliente_nome_snapshot)
  end,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot),
  coalesce(v.descricao, pvs.modelo),
  pa.quilometragem,
  pa.fim_execucao,
  pa.nome_motorista,
  pa.contato_motorista,
  cr.whatsapp,
  cr.nome,
  cr.tipo
order by pa.fim_execucao asc;

create or replace view public.vw_patio_revisao_proativa
with (security_invoker = true) as
with ultimos as (
  select distinct on (pa.patio_veiculo_id)
    pa.patio_veiculo_id,
    pa.cliente_id,
    pa.veiculo_id,
    pa.quilometragem,
    pa.fim_execucao
  from public.patio_atendimentos pa
  where pa.status = 'finalizado'
    and pa.patio_veiculo_id is not null
    and pa.quilometragem is not null
  order by pa.patio_veiculo_id, pa.fim_execucao desc nulls last
)
select
  pvs.patio_veiculo_id,
  pvs.cliente_id,
  case
    when c.codigo_erp = '55555'
      and nullif(btrim(pvs.empresa), '') is not null
      and upper(btrim(pvs.empresa)) <> 'CONSUMIDOR FINAL'
      then pvs.empresa
    else coalesce(c.nome, pvs.empresa)
  end as cliente_nome,
  c.vendedor_id,
  pvs.veiculo_id,
  coalesce(v.placa, pvs.placa) as placa,
  coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
  pvs.nome_motorista,
  pvs.contato_motorista,
  pvs.media_km_diaria,
  pvs.data_revisao_proativa,
  u.quilometragem as ultimo_km,
  u.fim_execucao as ultimo_atendimento_em,
  greatest(0, current_date - coalesce(u.fim_execucao::date, current_date))::integer as dias_desde_ultima_visita,
  coalesce(round(pvs.media_km_diaria * greatest(0, current_date - coalesce(u.fim_execucao::date, current_date))), 0)::integer as km_estimado_desde_visita,
  cr.whatsapp as contato_recomendado,
  cr.nome as contato_nome,
  cr.tipo as contato_tipo
from public.patio_veiculos_snapshot pvs
join ultimos u on u.patio_veiculo_id = pvs.patio_veiculo_id
join public.clientes c on c.id = pvs.cliente_id
left join public.veiculos v on v.id = pvs.veiculo_id
left join public.vw_cliente_contatos_recomendados cr on cr.cliente_id = pvs.cliente_id
where pvs.data_revisao_proativa is null
  and c.excluido_em is null
order by km_estimado_desde_visita desc, dias_desde_ultima_visita desc;

create or replace function public.registrar_feedback_patio(p_patio_execucao_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not (
    public.current_user_is_admin()
    or exists (
      select 1
      from public.patio_atendimentos pa
      join public.clientes c on c.id = pa.cliente_id
      where pa.patio_execucao_id = p_patio_execucao_id
        and c.vendedor_id = public.current_app_user_id()
    )
  ) then
    raise exception 'Sem permissao para registrar feedback deste atendimento.';
  end if;

  update public.patio_atendimentos
  set data_feedback = now(),
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;
end;
$$;

create or replace function public.registrar_revisao_proativa_patio(p_patio_veiculo_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not (
    public.current_user_is_admin()
    or exists (
      select 1
      from public.patio_veiculos_snapshot pvs
      join public.clientes c on c.id = pvs.cliente_id
      where pvs.patio_veiculo_id = p_patio_veiculo_id
        and c.vendedor_id = public.current_app_user_id()
    )
  ) then
    raise exception 'Sem permissao para registrar revisao deste veiculo.';
  end if;

  update public.patio_veiculos_snapshot
  set data_revisao_proativa = current_date,
      sincronizado_em = now()
  where patio_veiculo_id = p_patio_veiculo_id;
end;
$$;

grant select on public.vw_patio_feedback_pendente to anon, authenticated, service_role;
grant select on public.vw_patio_revisao_proativa to anon, authenticated, service_role;

create or replace view public.vw_patio_veiculos_busca
with (security_invoker = true) as
select
  pvs.patio_veiculo_id,
  pvs.cliente_id,
  c.nome as cliente_nome,
  c.vendedor_id,
  pvs.veiculo_id,
  coalesce(v.placa, pvs.placa) as placa,
  coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
  pvs.ano_modelo,
  pvs.nome_motorista,
  pvs.contato_motorista,
  pvs.media_km_diaria,
  pvs.data_revisao_proativa,
  ultimo.patio_execucao_id as ultimo_patio_execucao_id,
  ultimo.quilometragem as ultimo_km,
  ultimo.fim_execucao as ultimo_atendimento_em,
  cr.whatsapp as contato_recomendado,
  cr.nome as contato_nome,
  cr.tipo as contato_tipo
from public.patio_veiculos_snapshot pvs
left join public.clientes c on c.id = pvs.cliente_id
left join public.veiculos v on v.id = pvs.veiculo_id
left join public.vw_cliente_contatos_recomendados cr on cr.cliente_id = pvs.cliente_id
left join lateral (
  select pa.patio_execucao_id, pa.quilometragem, pa.fim_execucao
  from public.patio_atendimentos pa
  where pa.patio_veiculo_id = pvs.patio_veiculo_id
  order by pa.fim_execucao desc nulls last
  limit 1
) ultimo on true;

create or replace view public.vw_patio_fila_itens
with (security_invoker = true) as
select
  pai.id,
  pai.patio_item_id,
  pai.patio_tabela_origem,
  pai.patio_execucao_id,
  pai.cliente_id,
  c.nome as cliente_nome,
  c.vendedor_id,
  pai.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot) as placa,
  pai.area,
  pai.servico_nome,
  pai.descricao,
  pai.quantidade,
  pai.status,
  pai.box_id,
  pai.funcionario_id,
  pai.quilometragem,
  pai.tipo_atendimento,
  pai.solicitado_em,
  pai.atualizado_em
from public.patio_atendimento_itens pai
left join public.patio_atendimentos pa on pa.patio_execucao_id = pai.patio_execucao_id
left join public.clientes c on c.id = pai.cliente_id
left join public.veiculos v on v.id = pai.veiculo_id
where coalesce(pai.status, '') not in ('finalizado', 'cancelado')
order by pai.solicitado_em asc nulls last;

create or replace view public.vw_patio_boxes_ativos
with (security_invoker = true) as
select
  pa.patio_execucao_id,
  pa.cliente_id,
  c.nome as cliente_nome,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot) as placa,
  pa.box_id,
  pa.funcionario_id,
  pa.quilometragem,
  pa.status,
  pa.inicio_execucao,
  pa.nome_motorista,
  pa.contato_motorista,
  array_remove(array_agg(distinct pai.servico_nome) filter (where pai.servico_nome is not null), null) as servicos
from public.patio_atendimentos pa
left join public.clientes c on c.id = pa.cliente_id
left join public.veiculos v on v.id = pa.veiculo_id
left join public.patio_atendimento_itens pai on pai.patio_execucao_id = pa.patio_execucao_id
where pa.status = 'em_andamento'
group by
  pa.patio_execucao_id,
  pa.cliente_id,
  c.nome,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot),
  pa.box_id,
  pa.funcionario_id,
  pa.quilometragem,
  pa.status,
  pa.inicio_execucao,
  pa.nome_motorista,
  pa.contato_motorista
order by pa.box_id asc nulls last, pa.inicio_execucao asc;

create or replace view public.vw_patio_concluidos
with (security_invoker = true) as
select
  pa.patio_execucao_id,
  pa.cliente_id,
  c.nome as cliente_nome,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot) as placa,
  pa.box_id,
  pa.quilometragem,
  pa.status,
  pa.inicio_execucao,
  pa.fim_execucao,
  pa.nome_motorista,
  pa.contato_motorista,
  pa.data_feedback,
  array_remove(array_agg(distinct pai.servico_nome) filter (where pai.servico_nome is not null), null) as servicos
from public.patio_atendimentos pa
left join public.clientes c on c.id = pa.cliente_id
left join public.veiculos v on v.id = pa.veiculo_id
left join public.patio_atendimento_itens pai on pai.patio_execucao_id = pa.patio_execucao_id
where pa.status in ('finalizado', 'cancelado')
group by
  pa.patio_execucao_id,
  pa.cliente_id,
  c.nome,
  c.vendedor_id,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot),
  pa.box_id,
  pa.quilometragem,
  pa.status,
  pa.inicio_execucao,
  pa.fim_execucao,
  pa.nome_motorista,
  pa.contato_motorista,
  pa.data_feedback
order by pa.fim_execucao desc nulls last;

grant select on public.vw_patio_veiculos_busca to anon, authenticated, service_role;
grant select on public.vw_patio_fila_itens to anon, authenticated, service_role;
grant select on public.vw_patio_boxes_ativos to anon, authenticated, service_role;
grant select on public.vw_patio_concluidos to anon, authenticated, service_role;
