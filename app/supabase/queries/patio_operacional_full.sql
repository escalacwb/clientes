create table if not exists public.patio_funcionarios_snapshot (
  patio_funcionario_id bigint primary key,
  nome text not null,
  ativo boolean not null default true,
  raw_data jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now()
);

create table if not exists public.patio_boxes_snapshot (
  patio_box_id integer primary key,
  area text,
  ocupado boolean not null default false,
  ativo boolean not null default true,
  raw_data jsonb not null default '{}'::jsonb,
  sincronizado_em timestamptz not null default now()
);

create sequence if not exists public.crm_patio_execucao_seq start with 1000000000 increment by 1;
create sequence if not exists public.crm_patio_item_seq start with 1000000000 increment by 1;
create sequence if not exists public.crm_patio_veiculo_seq start with 1000000000 increment by 1;
create sequence if not exists public.crm_patio_cliente_seq start with 1000000000 increment by 1;

create or replace function public.patio_normalizar_area(p_area text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(p_area, '')) in ('alinhamento', 'alinhamento mecanico') then 'alinhamento'
    when lower(coalesce(p_area, '')) in ('manutencao', 'mecanica', 'mecânica', 'manutencao mecanica', 'manutenção mecânica') then 'manutencao'
    else 'borracharia'
  end
$$;

create or replace function public.patio_usuario_operacional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or public.current_user_is_admin()
    or exists (
      select 1
      from public.users u
      where u.auth_user_id = auth.uid()
        and u.ativo = true
        and u.role in ('operacao', 'admin')
    )
$$;

create or replace function public.registrar_entrada_patio_crm(
  p_patio_veiculo_id bigint,
  p_quilometragem integer,
  p_nome_motorista text,
  p_contato_motorista text,
  p_servicos jsonb,
  p_observacao text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_veiculo public.patio_veiculos_snapshot%rowtype;
  v_execucao_id bigint;
  v_servico jsonb;
  v_area text;
  v_quantidade integer;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para registrar entrada no patio.';
  end if;

  select * into v_veiculo
  from public.patio_veiculos_snapshot
  where patio_veiculo_id = p_patio_veiculo_id;

  if v_veiculo.patio_veiculo_id is null then
    raise exception 'Veiculo do patio nao encontrado.';
  end if;

  v_execucao_id := nextval('public.crm_patio_execucao_seq');

  insert into public.patio_atendimentos (
    patio_execucao_id, cliente_id, veiculo_id, patio_cliente_id, patio_veiculo_id,
    placa_snapshot, cliente_nome_snapshot, quilometragem, status, inicio_execucao,
    nome_motorista, contato_motorista, raw_data, sincronizado_em
  )
  values (
    v_execucao_id, v_veiculo.cliente_id, v_veiculo.veiculo_id, v_veiculo.patio_cliente_id, v_veiculo.patio_veiculo_id,
    v_veiculo.placa, v_veiculo.empresa, p_quilometragem, 'pendente', now(),
    nullif(p_nome_motorista, ''), nullif(p_contato_motorista, ''),
    jsonb_build_object('origem', 'crm_patio', 'observacao', p_observacao, 'servicos', coalesce(p_servicos, '[]'::jsonb)),
    now()
  );

  update public.patio_veiculos_snapshot
  set nome_motorista = coalesce(nullif(p_nome_motorista, ''), nome_motorista),
      contato_motorista = coalesce(nullif(p_contato_motorista, ''), contato_motorista),
      data_atualizacao_contato = case
        when nullif(p_nome_motorista, '') is not null or nullif(p_contato_motorista, '') is not null then now()
        else data_atualizacao_contato
      end,
      sincronizado_em = now()
  where patio_veiculo_id = p_patio_veiculo_id;

  if v_veiculo.cliente_id is not null and nullif(p_contato_motorista, '') is not null then
    insert into public.cliente_contatos (
      cliente_id, nome, cargo, telefone, whatsapp, principal, observacao, tipo,
      origem_sistema, origem_id, prioridade, atualizado_em, valido, raw_data
    )
    values (
      v_veiculo.cliente_id, nullif(p_nome_motorista, ''), concat('Motorista ', coalesce(v_veiculo.placa, '')),
      nullif(p_contato_motorista, ''), nullif(p_contato_motorista, ''), false,
      'Contato capturado na entrada do patio integrado.', 'motorista', 'patio',
      concat('crm_patio_entrada:', p_patio_veiculo_id::text), 90, now(), true,
      jsonb_build_object('origem', 'crm_patio', 'patio_veiculo_id', p_patio_veiculo_id)
    )
    on conflict (cliente_id, origem_sistema, origem_id) do update set
      nome = excluded.nome,
      telefone = excluded.telefone,
      whatsapp = excluded.whatsapp,
      atualizado_em = now(),
      valido = true,
      raw_data = excluded.raw_data;
  end if;

  for v_servico in select * from jsonb_array_elements(coalesce(p_servicos, '[]'::jsonb))
  loop
    v_area := public.patio_normalizar_area(v_servico->>'area');
    v_quantidade := case
      when coalesce(v_servico->>'quantidade', '') ~ '^[0-9]+$' then greatest(1, (v_servico->>'quantidade')::integer)
      else 1
    end;

    insert into public.patio_atendimento_itens (
      patio_item_id, patio_tabela_origem, patio_execucao_id, cliente_id, veiculo_id,
      area, servico_nome, descricao, quantidade, status, quilometragem,
      observacao_cadastro, tipo_atendimento, solicitado_em, atualizado_em, raw_data, sincronizado_em
    )
    values (
      nextval('public.crm_patio_item_seq'), 'crm_patio', v_execucao_id, v_veiculo.cliente_id, v_veiculo.veiculo_id,
      v_area, nullif(v_servico->>'servico_nome', ''), nullif(v_servico->>'descricao', ''),
      v_quantidade, 'pendente', p_quilometragem, coalesce(nullif(v_servico->>'observacao', ''), p_observacao),
      'crm_patio', now(), now(), v_servico, now()
    );
  end loop;

  return v_execucao_id;
end;
$$;

create or replace function public.alocar_servicos_patio_crm(
  p_patio_veiculo_id bigint,
  p_area text,
  p_box_id integer,
  p_funcionario_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_area text := public.patio_normalizar_area(p_area);
  v_atendimento public.patio_atendimentos%rowtype;
  v_veiculo public.patio_veiculos_snapshot%rowtype;
  v_quilometragem integer;
  v_execucao_id bigint;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para alocar servicos.';
  end if;

  select * into v_veiculo from public.patio_veiculos_snapshot where patio_veiculo_id = p_patio_veiculo_id;
  if v_veiculo.patio_veiculo_id is null then
    raise exception 'Veiculo nao encontrado.';
  end if;

  if exists (
    select 1 from public.patio_atendimento_itens
    where coalesce(veiculo_id::text, '') = coalesce(v_veiculo.veiculo_id::text, '')
      and status = 'em_andamento'
  ) then
    raise exception 'Veiculo ja possui servico em andamento.';
  end if;

  if exists (
    select 1 from public.patio_boxes_snapshot
    where patio_box_id = p_box_id and ocupado = true
  ) then
    raise exception 'Box ocupado.';
  end if;

  select coalesce(quilometragem, 0)
  into v_quilometragem
  from public.patio_atendimento_itens
  where patio_execucao_id in (
      select patio_execucao_id from public.patio_atendimentos where patio_veiculo_id = p_patio_veiculo_id
    )
    and area = v_area
    and status = 'pendente'
  order by solicitado_em nulls last
  limit 1;

  select *
  into v_atendimento
  from public.patio_atendimentos
  where patio_veiculo_id = p_patio_veiculo_id
    and status = 'pendente'
    and exists (
      select 1 from public.patio_atendimento_itens pai
      where pai.patio_execucao_id = patio_atendimentos.patio_execucao_id
        and pai.area = v_area
        and pai.status = 'pendente'
    )
  order by inicio_execucao asc nulls last
  limit 1;

  if v_atendimento.patio_execucao_id is null then
    v_execucao_id := nextval('public.crm_patio_execucao_seq');
    insert into public.patio_atendimentos (
      patio_execucao_id, cliente_id, veiculo_id, patio_cliente_id, patio_veiculo_id,
      placa_snapshot, cliente_nome_snapshot, box_id, funcionario_id, quilometragem,
      status, inicio_execucao, nome_motorista, contato_motorista, raw_data, sincronizado_em
    )
    values (
      v_execucao_id, v_veiculo.cliente_id, v_veiculo.veiculo_id, v_veiculo.patio_cliente_id, v_veiculo.patio_veiculo_id,
      v_veiculo.placa, v_veiculo.empresa, p_box_id, p_funcionario_id, v_quilometragem,
      'em_andamento', now(), v_veiculo.nome_motorista, v_veiculo.contato_motorista,
      jsonb_build_object('origem', 'crm_patio_alocacao'), now()
    );
  else
    v_execucao_id := v_atendimento.patio_execucao_id;
    update public.patio_atendimentos
    set box_id = p_box_id,
        funcionario_id = p_funcionario_id,
        quilometragem = coalesce(nullif(v_quilometragem, 0), quilometragem),
        status = 'em_andamento',
        inicio_execucao = coalesce(inicio_execucao, now()),
        sincronizado_em = now()
    where patio_execucao_id = v_execucao_id;
  end if;

  update public.patio_atendimento_itens
  set box_id = p_box_id,
      funcionario_id = p_funcionario_id,
      patio_execucao_id = v_execucao_id,
      status = 'em_andamento',
      atualizado_em = now(),
      sincronizado_em = now()
  where patio_execucao_id = v_execucao_id
    and area = v_area
    and status = 'pendente';

  if not found then
    raise exception 'Nao ha servicos pendentes desta area para alocar.';
  end if;

  update public.patio_boxes_snapshot
  set ocupado = true,
      sincronizado_em = now()
  where patio_box_id = p_box_id;

  return v_execucao_id;
end;
$$;

create or replace function public.adicionar_servico_box_patio_crm(
  p_patio_execucao_id bigint,
  p_area text,
  p_servico_nome text,
  p_quantidade integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atendimento public.patio_atendimentos%rowtype;
  v_item_id uuid;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para adicionar servico.';
  end if;

  select * into v_atendimento
  from public.patio_atendimentos
  where patio_execucao_id = p_patio_execucao_id and status = 'em_andamento';

  if v_atendimento.patio_execucao_id is null then
    raise exception 'Execucao em andamento nao encontrada.';
  end if;

  insert into public.patio_atendimento_itens (
    patio_item_id, patio_tabela_origem, patio_execucao_id, cliente_id, veiculo_id,
    area, servico_nome, descricao, quantidade, status, box_id, funcionario_id,
    quilometragem, tipo_atendimento, solicitado_em, atualizado_em, raw_data, sincronizado_em
  )
  values (
    nextval('public.crm_patio_item_seq'), 'crm_patio', p_patio_execucao_id, v_atendimento.cliente_id, v_atendimento.veiculo_id,
    public.patio_normalizar_area(p_area), nullif(p_servico_nome, ''), nullif(p_servico_nome, ''),
    greatest(1, coalesce(p_quantidade, 1)), 'em_andamento', v_atendimento.box_id, v_atendimento.funcionario_id,
    v_atendimento.quilometragem, 'extra_box', now(), now(),
    jsonb_build_object('origem', 'crm_patio_extra_box'), now()
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

create or replace function public.retirar_box_patio_crm(p_patio_execucao_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box_id integer;
begin
  if not public.patio_usuario_operacional() then
    raise exception 'Sem permissao para retirar box.';
  end if;

  select box_id into v_box_id
  from public.patio_atendimentos
  where patio_execucao_id = p_patio_execucao_id and status = 'em_andamento';

  update public.patio_atendimento_itens
  set status = 'pendente',
      box_id = null,
      funcionario_id = null,
      atualizado_em = now(),
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id and status = 'em_andamento';

  update public.patio_atendimentos
  set status = 'pendente',
      box_id = null,
      funcionario_id = null,
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;

  if v_box_id is not null then
    update public.patio_boxes_snapshot set ocupado = false, sincronizado_em = now() where patio_box_id = v_box_id;
  end if;
end;
$$;

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

  update public.patio_atendimentos
  set status = 'finalizado',
      fim_execucao = now(),
      usuario_finalizacao_id = null,
      raw_data = raw_data || jsonb_build_object('observacao_final', p_observacao_final),
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;

  update public.patio_boxes_snapshot
  set ocupado = false,
      sincronizado_em = now()
  where patio_box_id = v_atendimento.box_id;
end;
$$;

create or replace function public.reverter_visita_patio_crm(p_patio_execucao_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box_id integer;
begin
  if not public.current_user_is_admin() then
    raise exception 'Apenas admin pode reverter visita.';
  end if;

  select box_id into v_box_id
  from public.patio_atendimentos
  where patio_execucao_id = p_patio_execucao_id;

  update public.patio_atendimento_itens
  set status = 'pendente',
      box_id = null,
      funcionario_id = null,
      atualizado_em = now(),
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;

  update public.patio_atendimentos
  set status = 'cancelado',
      box_id = null,
      funcionario_id = null,
      sincronizado_em = now()
  where patio_execucao_id = p_patio_execucao_id;

  if v_box_id is not null then
    update public.patio_boxes_snapshot
    set ocupado = false,
        sincronizado_em = now()
    where patio_box_id = v_box_id;
  end if;
end;
$$;

create or replace view public.vw_patio_catalogo_servicos
with (security_invoker = true) as
select distinct area, servico_nome as nome
from public.patio_atendimento_itens
where servico_nome is not null and trim(servico_nome) <> ''
union
select 'borracharia', 'MONTAGEM'
union
select 'borracharia', 'TROCA DE PNEU'
union
select 'alinhamento', 'ALINHAMENTO'
union
select 'alinhamento', 'BALANCEAMENTO'
union
select 'manutencao', 'CAMBAGEM';

create or replace view public.vw_patio_alocacao_veiculos
with (security_invoker = true) as
with status_por_veiculo as (
  select
    pa.patio_veiculo_id,
    count(*) filter (where pai.status = 'pendente') as pendentes,
    count(*) filter (where pai.status = 'em_andamento') as em_andamento,
    min(pai.solicitado_em) as primeira_solicitacao
  from public.patio_atendimento_itens pai
  join public.patio_atendimentos pa on pa.patio_execucao_id = pai.patio_execucao_id
  where pai.status in ('pendente', 'em_andamento')
  group by pa.patio_veiculo_id
)
select
  pvs.patio_veiculo_id,
  pvs.cliente_id,
  pvs.veiculo_id,
  pvs.placa,
  pvs.empresa as cliente_nome,
  pvs.modelo as veiculo_descricao,
  spv.pendentes,
  spv.em_andamento,
  spv.primeira_solicitacao
from status_por_veiculo spv
join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = spv.patio_veiculo_id
where spv.pendentes > 0 and spv.em_andamento = 0;

create or replace view public.vw_patio_areas_pendentes
with (security_invoker = true) as
select
  pa.patio_veiculo_id,
  pai.area,
  min(pai.quilometragem) filter (where pai.quilometragem is not null) as quilometragem,
  count(*) as total_itens
from public.patio_atendimento_itens pai
join public.patio_atendimentos pa on pa.patio_execucao_id = pai.patio_execucao_id
where pai.status = 'pendente'
group by pa.patio_veiculo_id, pai.area;

create or replace view public.vw_patio_boxes_painel
with (security_invoker = true) as
select
  b.patio_box_id as box_id,
  b.area as box_area,
  pa.patio_execucao_id,
  pa.patio_veiculo_id,
  pa.cliente_id,
  pa.veiculo_id,
  pa.placa_snapshot as placa,
  pa.cliente_nome_snapshot as cliente_nome,
  pa.nome_motorista,
  pa.contato_motorista,
  pa.quilometragem,
  pvs.modelo as veiculo_descricao,
  f.nome as funcionario_nome,
  coalesce(
    string_agg(pai.servico_nome || ' (Qtd: ' || coalesce(pai.quantidade, 1)::text || ')', '<br>' order by pai.servico_nome)
      filter (where pai.id is not null),
    ''
  ) as lista_servicos
from public.patio_boxes_snapshot b
left join public.patio_atendimentos pa on pa.box_id = b.patio_box_id and pa.status = 'em_andamento'
left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
left join public.patio_funcionarios_snapshot f on f.patio_funcionario_id = pa.funcionario_id
left join public.patio_atendimento_itens pai on pai.patio_execucao_id = pa.patio_execucao_id and pai.status = 'em_andamento'
where b.ativo = true
group by b.patio_box_id, b.area, pa.patio_execucao_id, pa.patio_veiculo_id, pa.cliente_id, pa.veiculo_id,
  pa.placa_snapshot, pa.cliente_nome_snapshot, pa.nome_motorista, pa.contato_motorista,
  pa.quilometragem, pvs.modelo, f.nome
order by b.patio_box_id;

create or replace view public.vw_patio_box_servicos
with (security_invoker = true) as
select
  pai.id,
  pai.patio_execucao_id,
  pai.area,
  pai.servico_nome,
  pai.quantidade,
  pai.observacao_cadastro,
  pai.observacao_execucao,
  pai.status,
  pai.box_id
from public.patio_atendimento_itens pai
where pai.status = 'em_andamento';

create or replace view public.vw_patio_concluidos
with (security_invoker = true) as
select
  pa.patio_execucao_id,
  pa.cliente_id,
  coalesce(c.nome, pa.cliente_nome_snapshot) as cliente_nome,
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
  array[]::text[] as servicos,
  coalesce(v.descricao, pvs.modelo) as veiculo_descricao
from public.patio_atendimentos pa
left join public.clientes c on c.id = pa.cliente_id
left join public.veiculos v on v.id = pa.veiculo_id
left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
where pa.status in ('finalizado', 'cancelado');

create or replace view public.vw_patio_fila_painel
with (security_invoker = true) as
select
  pa.patio_veiculo_id,
  pa.cliente_id,
  pa.veiculo_id,
  pa.placa_snapshot as placa,
  pa.cliente_nome_snapshot as cliente_nome,
  min(pai.solicitado_em) as primeira_solicitacao,
  coalesce(
    string_agg(pai.servico_nome || ' (Qtd: ' || coalesce(pai.quantidade, 1)::text || ')', '<br>' order by pai.solicitado_em, pai.servico_nome)
      filter (where pai.id is not null),
    ''
  ) as lista_servicos,
  count(pai.id) as total_itens
from public.patio_atendimento_itens pai
join public.patio_atendimentos pa on pa.patio_execucao_id = pai.patio_execucao_id
where pai.status = 'pendente'
group by pa.patio_veiculo_id, pa.cliente_id, pa.veiculo_id, pa.placa_snapshot, pa.cliente_nome_snapshot
order by min(pai.solicitado_em) asc nulls last;

create or replace view public.vw_patio_relatorio_servicos
with (security_invoker = true) as
select
  pai.id,
  pai.patio_execucao_id,
  pa.cliente_id,
  coalesce(c.nome, pa.cliente_nome_snapshot) as cliente_nome,
  pa.veiculo_id,
  coalesce(v.placa, pa.placa_snapshot) as placa,
  coalesce(v.descricao, pvs.modelo) as veiculo_descricao,
  pai.area,
  pai.servico_nome,
  pai.quantidade,
  pai.status as status_servico,
  pa.status as status_execucao,
  pa.box_id,
  ('Box ' || coalesce(pbs.patio_box_id, pa.box_id)::text) as box_nome,
  pai.funcionario_id,
  pfs.nome as funcionario_nome,
  pa.usuario_alocacao_id,
  pa.usuario_finalizacao_id,
  pa.inicio_execucao,
  pa.fim_execucao,
  extract(epoch from (pa.fim_execucao - pa.inicio_execucao)) / 60 as duracao_minutos,
  pa.quilometragem
from public.patio_atendimento_itens pai
join public.patio_atendimentos pa on pa.patio_execucao_id = pai.patio_execucao_id
left join public.clientes c on c.id = pa.cliente_id
left join public.veiculos v on v.id = pa.veiculo_id
left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
left join public.patio_boxes_snapshot pbs on pbs.patio_box_id = pa.box_id
left join public.patio_funcionarios_snapshot pfs on pfs.patio_funcionario_id = pai.funcionario_id
where pa.status = 'finalizado'
  and pai.status = 'finalizado'
  and pa.fim_execucao is not null;

grant select on public.patio_funcionarios_snapshot to anon, authenticated, service_role;
grant select on public.patio_boxes_snapshot to anon, authenticated, service_role;
grant select on public.vw_patio_catalogo_servicos to anon, authenticated, service_role;
grant select on public.vw_patio_alocacao_veiculos to anon, authenticated, service_role;
grant select on public.vw_patio_areas_pendentes to anon, authenticated, service_role;
grant select on public.vw_patio_boxes_painel to anon, authenticated, service_role;
grant select on public.vw_patio_box_servicos to anon, authenticated, service_role;
grant select on public.vw_patio_concluidos to anon, authenticated, service_role;
grant select on public.vw_patio_fila_painel to anon, authenticated, service_role;
grant select on public.vw_patio_relatorio_servicos to anon, authenticated, service_role;
grant execute on function public.registrar_entrada_patio_crm(bigint, integer, text, text, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.alocar_servicos_patio_crm(bigint, text, integer, bigint) to anon, authenticated, service_role;
grant execute on function public.adicionar_servico_box_patio_crm(bigint, text, text, integer) to anon, authenticated, service_role;
grant execute on function public.retirar_box_patio_crm(bigint) to anon, authenticated, service_role;
grant execute on function public.finalizar_box_patio_crm(bigint, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.reverter_visita_patio_crm(bigint) to anon, authenticated, service_role;

alter table public.patio_funcionarios_snapshot enable row level security;
alter table public.patio_boxes_snapshot enable row level security;

drop policy if exists patio_funcionarios_snapshot_read_operacao on public.patio_funcionarios_snapshot;
create policy patio_funcionarios_snapshot_read_operacao
on public.patio_funcionarios_snapshot for select
using (auth.role() in ('anon', 'authenticated', 'service_role'));

drop policy if exists patio_boxes_snapshot_read_operacao on public.patio_boxes_snapshot;
create policy patio_boxes_snapshot_read_operacao
on public.patio_boxes_snapshot for select
using (auth.role() in ('anon', 'authenticated', 'service_role'));

drop policy if exists service_manage_patio_funcionarios on public.patio_funcionarios_snapshot;
create policy service_manage_patio_funcionarios
on public.patio_funcionarios_snapshot for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());

drop policy if exists service_manage_patio_boxes on public.patio_boxes_snapshot;
create policy service_manage_patio_boxes
on public.patio_boxes_snapshot for all
using (auth.role() = 'service_role' or public.current_user_is_admin())
with check (auth.role() = 'service_role' or public.current_user_is_admin());
