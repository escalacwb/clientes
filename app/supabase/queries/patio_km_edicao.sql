drop function if exists public.corrigir_km_atendimento_patio_crm(bigint, integer);

create or replace function public.corrigir_km_atendimento_patio_crm(
  p_patio_execucao_id bigint,
  p_quilometragem integer
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atendimento public.patio_atendimentos%rowtype;
  v_data_visita date;
  v_visitas integer;
  v_dias integer;
  v_primeiro_km integer;
  v_ultimo_km integer;
  v_media numeric;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para corrigir KM do patio.';
  end if;

  if p_quilometragem is null or p_quilometragem <= 0 then
    raise exception 'Informe uma quilometragem valida.';
  end if;

  select * into v_atendimento
  from public.patio_atendimentos
  where patio_execucao_id = p_patio_execucao_id;

  if v_atendimento.patio_execucao_id is null then
    raise exception 'Atendimento nao encontrado.';
  end if;

  v_data_visita := coalesce(v_atendimento.fim_execucao, v_atendimento.inicio_execucao)::date;

  update public.patio_atendimentos
  set quilometragem = p_quilometragem,
      raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object(
        'km_corrigido_em', now(),
        'km_anterior', quilometragem,
        'km_corrigido_por_execucao_base', p_patio_execucao_id
      ),
      sincronizado_em = now()
  where patio_veiculo_id = v_atendimento.patio_veiculo_id
    and coalesce(fim_execucao, inicio_execucao)::date = v_data_visita;

  update public.patio_atendimento_itens
  set quilometragem = p_quilometragem,
      atualizado_em = now(),
      sincronizado_em = now()
  where patio_execucao_id in (
    select patio_execucao_id
    from public.patio_atendimentos
    where patio_veiculo_id = v_atendimento.patio_veiculo_id
      and coalesce(fim_execucao, inicio_execucao)::date = v_data_visita
  );

  update public.patio_veiculos_snapshot
  set raw_data = coalesce(raw_data, '{}'::jsonb) || jsonb_build_object('ultima_correcao_km_em', now()),
      sincronizado_em = now()
  where patio_veiculo_id = v_atendimento.patio_veiculo_id;

  select r.media_km_diaria
  into v_media
  from public.recalcular_media_km_patio_veiculo(v_atendimento.patio_veiculo_id) r;

  return v_media;
end;
$$;

grant execute on function public.corrigir_km_atendimento_patio_crm(bigint, integer)
to anon, authenticated, service_role;
