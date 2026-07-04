drop function if exists public.mobile_revisao_pending(integer, integer);
drop function if exists public.mobile_revisao_pending(integer, integer, numeric);

create or replace function public.mobile_feedback_pending(
  p_limit integer default 100
)
returns table (
  patio_execucao_id bigint,
  cliente_id uuid,
  cliente_nome text,
  vendedor_id uuid,
  veiculo_id uuid,
  placa text,
  veiculo_descricao text,
  quilometragem integer,
  fim_execucao timestamptz,
  nome_motorista text,
  contato_motorista text,
  contato_recomendado text,
  contato_nome text,
  contato_tipo text,
  servicos text[]
)
language sql
security invoker
stable
as $$
  select
    f.patio_execucao_id,
    f.cliente_id,
    f.cliente_nome,
    f.vendedor_id,
    f.veiculo_id,
    f.placa,
    f.veiculo_descricao,
    f.quilometragem,
    f.fim_execucao,
    f.nome_motorista,
    f.contato_motorista,
    f.contato_recomendado,
    f.contato_nome,
    f.contato_tipo,
    f.servicos
  from public.vw_patio_feedback_pendente f
  where auth.role() = 'service_role'
    or public.current_user_is_admin()
    or f.vendedor_id = public.current_app_user_id()
  order by f.fim_execucao asc nulls last
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

create or replace function public.mobile_revisao_pending(
  p_limit integer default 100,
  p_offset integer default 0,
  p_km_min numeric default 20000
)
returns table (
  patio_veiculo_id bigint,
  cliente_id uuid,
  cliente_nome text,
  vendedor_id uuid,
  veiculo_id uuid,
  placa text,
  veiculo_descricao text,
  nome_motorista text,
  contato_motorista text,
  media_km_diaria numeric,
  data_revisao_proativa date,
  ultimo_km integer,
  ultimo_atendimento_em timestamptz,
  dias_desde_ultima_visita integer,
  km_estimado_desde_visita integer,
  contato_recomendado text,
  contato_nome text,
  contato_tipo text,
  total_count bigint
)
language sql
security invoker
stable
as $$
  select *
  from public.listar_patio_revisao_proativa(
    greatest(0, coalesce(p_km_min, 20000)),
    null,
    null,
    case
      when auth.role() = 'service_role' or public.current_user_is_admin() then null
      else public.current_app_user_id()
    end,
    greatest(1, least(coalesce(p_limit, 100), 200)),
    greatest(0, coalesce(p_offset, 0))
  );
$$;

create or replace function public.mobile_feedback_done(
  p_patio_execucao_id bigint,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  select *
  into item
  from public.vw_patio_feedback_pendente f
  where f.patio_execucao_id = p_patio_execucao_id
    and (
      auth.role() = 'service_role'
      or
      public.current_user_is_admin()
      or f.vendedor_id = public.current_app_user_id()
    )
  limit 1;

  if not found then
    raise exception 'Feedback pendente nao encontrado.';
  end if;

  perform public.registrar_feedback_patio(p_patio_execucao_id);

  insert into public.interacoes (
    cliente_id,
    vendedor_id,
    canal,
    tipo,
    resumo,
    resultado
  )
  values (
    item.cliente_id,
    coalesce(item.vendedor_id, public.current_app_user_id()),
    'WhatsApp',
    'feedback_patio',
    coalesce(
      nullif(btrim(coalesce(p_observacao, '')), ''),
      'Feedback pos-servico registrado pelo app mobile para placa ' || coalesce(item.placa, 'sem placa') || '.'
    ),
    'feedback realizado'
  );
end;
$$;

create or replace function public.mobile_revisao_done(
  p_patio_veiculo_id bigint,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  select
    pvs.patio_veiculo_id,
    pvs.cliente_id,
    c.vendedor_id,
    coalesce(v.placa, pvs.placa) as placa
  into item
  from public.patio_veiculos_snapshot pvs
  join public.clientes c on c.id = pvs.cliente_id
  left join public.veiculos v on v.id = pvs.veiculo_id
  where pvs.patio_veiculo_id = p_patio_veiculo_id
    and pvs.data_revisao_proativa is null
    and c.excluido_em is null
    and (
      auth.role() = 'service_role'
      or
      public.current_user_is_admin()
      or c.vendedor_id = public.current_app_user_id()
    )
  limit 1;

  if not found then
    raise exception 'Revisao proativa pendente nao encontrada.';
  end if;

  perform public.registrar_revisao_proativa_patio(p_patio_veiculo_id);

  insert into public.interacoes (
    cliente_id,
    vendedor_id,
    patio_veiculo_id,
    placa,
    canal,
    tipo,
    resumo,
    resultado
  )
  values (
    item.cliente_id,
    coalesce(item.vendedor_id, public.current_app_user_id()),
    item.patio_veiculo_id,
    item.placa,
    'WhatsApp',
    'revisao_proativa',
    coalesce(
      nullif(btrim(coalesce(p_observacao, '')), ''),
      'Contato de revisao proativa registrado pelo app mobile para placa ' || coalesce(item.placa, 'sem placa') || '.'
    ),
    'revisao contatada'
  );
end;
$$;

revoke execute on function public.mobile_feedback_pending(integer) from anon;
revoke execute on function public.mobile_revisao_pending(integer, integer, numeric) from anon;
revoke execute on function public.mobile_feedback_done(bigint, text) from anon;
revoke execute on function public.mobile_revisao_done(bigint, text) from anon;

grant execute on function public.mobile_feedback_pending(integer) to authenticated, service_role;
grant execute on function public.mobile_revisao_pending(integer, integer, numeric) to authenticated, service_role;
grant execute on function public.mobile_feedback_done(bigint, text) to authenticated, service_role;
grant execute on function public.mobile_revisao_done(bigint, text) to authenticated, service_role;
