create or replace view public.vw_patio_feedback_pendente
with (security_invoker = true) as
with base as (
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
    pa.patio_veiculo_id,
    coalesce(v.placa, pa.placa_snapshot) as placa,
    coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
    pa.quilometragem,
    pa.fim_execucao,
    pa.inicio_execucao,
    nullif(btrim(pa.nome_motorista), '') as nome_motorista,
    nullif(btrim(pa.contato_motorista), '') as contato_motorista,
    coalesce(nullif(upper(regexp_replace(coalesce(v.placa, pa.placa_snapshot, ''), '[^A-Z0-9]+', '', 'g')), ''), 'sem-placa-' || pa.patio_execucao_id::text) as placa_key,
    coalesce(pa.quilometragem, -1) as km_key,
    coalesce(pa.fim_execucao::date, pa.inicio_execucao::date) as data_visita
  from public.patio_atendimentos pa
  join public.clientes c on c.id = pa.cliente_id
  left join public.veiculos v on v.id = pa.veiculo_id
  left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
  where pa.status = 'finalizado'
    and pa.data_feedback is null
    and pa.fim_execucao is not null
    and pa.fim_execucao <= now() - interval '5 days'
),
grupos as (
  select
    (array_agg(b.patio_execucao_id order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as patio_execucao_id,
    array_agg(distinct b.patio_execucao_id order by b.patio_execucao_id) as execucao_ids,
    (array_agg(b.cliente_id order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as cliente_id,
    (array_agg(b.cliente_nome order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as cliente_nome,
    (array_agg(b.vendedor_id order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as vendedor_id,
    (array_agg(b.veiculo_id order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as veiculo_id,
    (array_agg(b.placa order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as placa,
    (array_agg(b.veiculo_descricao order by b.fim_execucao desc nulls last, b.patio_execucao_id desc))[1] as veiculo_descricao,
    nullif(max(b.km_key), -1)::integer as quilometragem,
    max(b.fim_execucao) as fim_execucao,
    (array_remove(array_agg(b.nome_motorista order by b.fim_execucao desc nulls last, b.patio_execucao_id desc), null))[1] as nome_motorista,
    (array_remove(array_agg(b.contato_motorista order by b.fim_execucao desc nulls last, b.patio_execucao_id desc), null))[1] as contato_motorista
  from base b
  group by
    coalesce(b.patio_veiculo_id::text, b.placa_key),
    b.cliente_id,
    b.veiculo_id,
    b.placa_key,
    b.km_key,
    b.data_visita
)
select
  g.patio_execucao_id,
  g.cliente_id,
  g.cliente_nome,
  g.vendedor_id,
  g.veiculo_id,
  g.placa,
  g.veiculo_descricao,
  g.quilometragem,
  g.fim_execucao,
  g.nome_motorista,
  g.contato_motorista,
  contato.whatsapp as contato_recomendado,
  contato.nome as contato_nome,
  contato.tipo as contato_tipo,
  coalesce(servicos.servicos, array[]::text[]) as servicos,
  g.execucao_ids
from grupos g
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
    where cc.cliente_id = g.cliente_id
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
    from public.clientes c
    where c.id = g.cliente_id
      and nullif(coalesce(c.whatsapp_principal, c.telefone_principal), '') is not null
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
    where pai.patio_execucao_id = any(g.execucao_ids)
      and pai.status = 'finalizado'
      and coalesce(nullif(pai.servico_nome, ''), nullif(pai.descricao, ''), pai.area) is not null
  ) itens
) servicos on true
order by g.fim_execucao asc;

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
declare
  v_execucao_ids bigint[];
  v_vendedor_id uuid;
begin
  select f.execucao_ids, f.vendedor_id
  into v_execucao_ids, v_vendedor_id
  from public.vw_patio_feedback_pendente f
  where f.patio_execucao_id = p_patio_execucao_id
  limit 1;

  if coalesce(array_length(v_execucao_ids, 1), 0) = 0 then
    select
      array_agg(pa.patio_execucao_id order by pa.patio_execucao_id),
      (array_remove(array_agg(c.vendedor_id), null))[1]
    into v_execucao_ids, v_vendedor_id
    from public.patio_atendimentos pa
    left join public.clientes c on c.id = pa.cliente_id
    where pa.patio_execucao_id = p_patio_execucao_id;
  end if;

  if coalesce(array_length(v_execucao_ids, 1), 0) = 0 then
    raise exception 'Atendimento do patio nao encontrado para registrar feedback.';
  end if;

  if auth.uid() is not null and not (
    auth.role() = 'service_role'
    or public.current_user_is_admin()
    or v_vendedor_id = public.current_app_user_id()
  ) then
    raise exception 'Sem permissao para registrar feedback deste atendimento.';
  end if;

  update public.patio_atendimentos
  set data_feedback = now(),
      sincronizado_em = now()
  where patio_execucao_id = any(v_execucao_ids);
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
  array_remove(array_agg(distinct pai.servico_nome) filter (where pai.servico_nome is not null), null) as servicos,
  v.descricao as veiculo_descricao
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
  pa.data_feedback,
  v.descricao
order by pa.fim_execucao desc nulls last;

grant select on public.vw_patio_veiculos_busca to anon, authenticated, service_role;
grant select on public.vw_patio_fila_itens to anon, authenticated, service_role;
grant select on public.vw_patio_boxes_ativos to anon, authenticated, service_role;
grant select on public.vw_patio_concluidos to anon, authenticated, service_role;
