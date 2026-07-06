create or replace function public.crm_usuario_posvenda()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.users u
      where u.auth_user_id = auth.uid()
        and u.ativo = true
        and u.role in ('admin', 'vendedor')
    )
$$;

grant execute on function public.crm_usuario_posvenda() to authenticated, service_role;

create or replace function public.listar_patio_feedback_pendente(
  p_query text default null,
  p_age_filter text default null,
  p_vendedor_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
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
  servicos text[],
  execucao_ids bigint[],
  total_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
with params as (
  select
    nullif(btrim(coalesce(p_query, '')), '') as query_text,
    case
      when p_age_filter in ('recentes', 'antigos') then p_age_filter
      else null
    end as age_filter,
    greatest(1, least(coalesce(p_limit, 50), 200)) as row_limit,
    greatest(0, coalesce(p_offset, 0)) as row_offset
),
base as (
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
  where public.crm_usuario_posvenda()
    and pa.status = 'finalizado'
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
),
enriquecidos as (
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
),
filtrado as (
  select e.*
  from enriquecidos e
  cross join params p
  where (p_vendedor_id is null or e.vendedor_id = p_vendedor_id)
    and (
      p.age_filter is null
      or (p.age_filter = 'recentes' and e.fim_execucao >= now() - interval '15 days')
      or (p.age_filter = 'antigos' and e.fim_execucao < now() - interval '15 days')
    )
    and (
      p.query_text is null
      or unaccent(coalesce(e.cliente_nome, '')) ilike unaccent('%' || p.query_text || '%')
      or unaccent(coalesce(e.placa, '')) ilike unaccent('%' || p.query_text || '%')
      or unaccent(coalesce(e.nome_motorista, '')) ilike unaccent('%' || p.query_text || '%')
    )
)
select
  filtrado.*,
  count(*) over() as total_count
from filtrado
order by fim_execucao desc nulls last
limit (select row_limit from params)
offset (select row_offset from params);
$$;

revoke execute on function public.listar_patio_feedback_pendente(text, text, uuid, integer, integer) from anon;
grant execute on function public.listar_patio_feedback_pendente(text, text, uuid, integer, integer) to authenticated, service_role;

create or replace function public.listar_patio_revisao_proativa(
  p_km_min numeric default null,
  p_dias_min integer default null,
  p_query text default null,
  p_vendedor_id uuid default null,
  p_limit integer default 50,
  p_offset integer default 0
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
security definer
stable
set search_path = public
as $$
with ultimos as (
  select distinct on (pa.patio_veiculo_id)
    pa.patio_veiculo_id,
    pa.cliente_id,
    pa.veiculo_id,
    pa.quilometragem,
    pa.fim_execucao
  from public.patio_atendimentos pa
  where public.crm_usuario_posvenda()
    and pa.status = 'finalizado'
    and pa.patio_veiculo_id is not null
    and pa.quilometragem is not null
  order by pa.patio_veiculo_id, pa.fim_execucao desc nulls last
),
base as (
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
    contato.whatsapp as contato_recomendado,
    contato.nome as contato_nome,
    contato.tipo as contato_tipo
  from public.patio_veiculos_snapshot pvs
  join ultimos u on u.patio_veiculo_id = pvs.patio_veiculo_id
  join public.clientes c on c.id = pvs.cliente_id
  left join public.veiculos v on v.id = pvs.veiculo_id
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
      where cc.cliente_id = pvs.cliente_id
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
  where pvs.data_revisao_proativa is null
    and c.excluido_em is null
    and (p_vendedor_id is null or c.vendedor_id = p_vendedor_id)
),
filtrado as (
  select *
  from base
  where (p_km_min is null or km_estimado_desde_visita >= p_km_min)
    and (p_dias_min is null or dias_desde_ultima_visita >= p_dias_min)
    and (
      nullif(trim(coalesce(p_query, '')), '') is null
      or unaccent(coalesce(cliente_nome, '')) ilike unaccent('%' || trim(p_query) || '%')
      or unaccent(coalesce(placa, '')) ilike unaccent('%' || trim(p_query) || '%')
      or unaccent(coalesce(nome_motorista, '')) ilike unaccent('%' || trim(p_query) || '%')
    )
)
select
  filtrado.*,
  count(*) over() as total_count
from filtrado
order by km_estimado_desde_visita desc, dias_desde_ultima_visita desc
limit greatest(1, least(coalesce(p_limit, 50), 200))
offset greatest(0, coalesce(p_offset, 0));
$$;

revoke execute on function public.listar_patio_revisao_proativa(numeric, integer, text, uuid, integer, integer) from anon;
grant execute on function public.listar_patio_revisao_proativa(numeric, integer, text, uuid, integer, integer) to authenticated, service_role;

create or replace function public.registrar_feedback_patio(p_patio_execucao_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execucao_ids bigint[];
begin
  if auth.uid() is not null and not public.crm_usuario_posvenda() then
    raise exception 'Sem permissao para registrar feedback deste atendimento.';
  end if;

  select f.execucao_ids
  into v_execucao_ids
  from public.vw_patio_feedback_pendente f
  where f.patio_execucao_id = p_patio_execucao_id
  limit 1;

  if coalesce(array_length(v_execucao_ids, 1), 0) = 0 then
    select array_agg(pa.patio_execucao_id order by pa.patio_execucao_id)
    into v_execucao_ids
    from public.patio_atendimentos pa
    where pa.patio_execucao_id = p_patio_execucao_id;
  end if;

  if coalesce(array_length(v_execucao_ids, 1), 0) = 0 then
    raise exception 'Atendimento do patio nao encontrado para registrar feedback.';
  end if;

  update public.patio_atendimentos
  set data_feedback = now(),
      sincronizado_em = now()
  where patio_execucao_id = any(v_execucao_ids);
end;
$$;

grant execute on function public.registrar_feedback_patio(bigint) to authenticated, service_role;

create or replace function public.registrar_revisao_proativa_patio(p_patio_veiculo_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.crm_usuario_posvenda() then
    raise exception 'Sem permissao para registrar revisao deste veiculo.';
  end if;

  update public.patio_veiculos_snapshot
  set data_revisao_proativa = current_date,
      sincronizado_em = now()
  where patio_veiculo_id = p_patio_veiculo_id;
end;
$$;

grant execute on function public.registrar_revisao_proativa_patio(bigint) to authenticated, service_role;
