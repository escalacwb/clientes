-- Corrige atendimentos do Patio que foram vinculados ao cliente generico 55555
-- quando esse cadastro estava indevidamente nomeado como THIAGO RODRIGUES.
--
-- Regra conservadora:
-- 1. Se a placa tem dono nao-55555 em public.veiculos, usa esse cadastro.
-- 2. Senao, se a placa aparece em public.servicos_itens com dono nao-55555, usa o
--    cliente mais frequente/recente.
-- 3. Senao, usa nome exato e unico do snapshot do atendimento, excluindo nomes
--    genericos.
--
-- Placas sem candidato confiavel nao sao remapeadas para outro cliente.

begin;

update public.patio_atendimentos
set quilometragem = null
where quilometragem = 0;

update public.patio_atendimento_itens
set quilometragem = null
where quilometragem = 0;

create temp table tmp_reconciliacao_cliente_55555 on commit drop as
with alvo as (
  select
    pa.patio_execucao_id,
    upper(regexp_replace(coalesce(pa.placa_snapshot, pvs.placa, v.placa, ''), '[^A-Z0-9]', '', 'g')) as placa_norm,
    nullif(trim(coalesce(pa.cliente_nome_snapshot, pvs.empresa, '')), '') as snapshot_nome
  from public.patio_atendimentos pa
  left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
  left join public.veiculos v on v.id = pa.veiculo_id
  where pa.cliente_id = (
    select id from public.clientes where codigo_erp = '55555' and nome = 'THIAGO RODRIGUES' limit 1
  )
),
alvo_placas as (
  select
    placa_norm,
    count(*) as atendimentos,
    max(snapshot_nome) filter (where snapshot_nome is not null) as snapshot_nome,
    count(distinct upper(regexp_replace(trim(snapshot_nome), '\s+', ' ', 'g')))
      filter (where snapshot_nome is not null) as snapshot_distintos
  from alvo
  where placa_norm <> ''
  group by placa_norm
),
cand_v as (
  select distinct on (upper(regexp_replace(ve.placa, '[^A-Z0-9]', '', 'g')))
    upper(regexp_replace(ve.placa, '[^A-Z0-9]', '', 'g')) as placa_norm,
    ve.cliente_id,
    ve.id as veiculo_id,
    c.codigo_erp,
    c.nome as cliente_nome,
    'veiculos' as fonte
  from public.veiculos ve
  join public.clientes c on c.id = ve.cliente_id
  join alvo_placas ap on ap.placa_norm = upper(regexp_replace(ve.placa, '[^A-Z0-9]', '', 'g'))
  where ve.cliente_id is not null
    and coalesce(c.codigo_erp, '') <> '55555'
  order by
    upper(regexp_replace(ve.placa, '[^A-Z0-9]', '', 'g')),
    coalesce(ve.ultimo_atendimento_em::timestamp, ve.atualizado_em, ve.criado_em) desc nulls last
),
cand_s_counts as (
  select
    upper(regexp_replace(si.placa, '[^A-Z0-9]', '', 'g')) as placa_norm,
    si.cliente_id,
    max(si.veiculo_id::text) as veiculo_id_text,
    max(si.data_servico) as ref_data,
    count(*) as qtd
  from public.servicos_itens si
  join public.clientes c on c.id = si.cliente_id
  join alvo_placas ap on ap.placa_norm = upper(regexp_replace(si.placa, '[^A-Z0-9]', '', 'g'))
  where si.cliente_id is not null
    and coalesce(c.codigo_erp, '') <> '55555'
    and coalesce(si.placa, '') <> ''
  group by 1, 2
),
cand_s as (
  select distinct on (cs.placa_norm)
    cs.placa_norm,
    cs.cliente_id,
    cs.veiculo_id_text::uuid as veiculo_id,
    c.codigo_erp,
    c.nome as cliente_nome,
    'servicos_itens' as fonte
  from cand_s_counts cs
  join public.clientes c on c.id = cs.cliente_id
  order by cs.placa_norm, cs.qtd desc, cs.ref_data desc nulls last
),
nomes_unicos as (
  select
    upper(regexp_replace(trim(nome), '\s+', ' ', 'g')) as nome_norm,
    min(id::text)::uuid as cliente_id,
    count(*) as qtd
  from public.clientes
  where excluido_em is null
    and coalesce(codigo_erp, '') <> '55555'
  group by upper(regexp_replace(trim(nome), '\s+', ' ', 'g'))
  having count(*) = 1
),
cand_nome as (
  select
    ap.placa_norm,
    nu.cliente_id,
    null::uuid as veiculo_id,
    c.codigo_erp,
    c.nome as cliente_nome,
    'snapshot_nome' as fonte
  from alvo_placas ap
  join nomes_unicos nu on nu.nome_norm = upper(regexp_replace(trim(ap.snapshot_nome), '\s+', ' ', 'g'))
  join public.clientes c on c.id = nu.cliente_id
  where ap.snapshot_distintos = 1
    and ap.snapshot_nome is not null
    and upper(regexp_replace(trim(ap.snapshot_nome), '\s+', ' ', 'g')) not in (
      'CONSUMIDOR FINAL', 'CLIENTE', 'CLIENTE AVULSO', 'NAO INFORMADO', 'NÃO INFORMADO'
    )
    and length(ap.snapshot_nome) >= 5
)
select
  ap.placa_norm,
  ap.atendimentos,
  coalesce(cv.cliente_id, cs.cliente_id, cn.cliente_id) as cliente_id,
  coalesce(cv.veiculo_id, cs.veiculo_id, cn.veiculo_id) as veiculo_id,
  coalesce(cv.codigo_erp, cs.codigo_erp, cn.codigo_erp) as codigo_erp,
  coalesce(cv.cliente_nome, cs.cliente_nome, cn.cliente_nome) as cliente_nome,
  case
    when cv.cliente_id is not null then cv.fonte
    when cs.cliente_id is not null then cs.fonte
    else cn.fonte
  end as fonte
from alvo_placas ap
left join cand_v cv using (placa_norm)
left join cand_s cs using (placa_norm)
left join cand_nome cn using (placa_norm)
where coalesce(cv.cliente_id, cs.cliente_id, cn.cliente_id) is not null;

create temp table tmp_reconciliacao_execucoes_55555 on commit drop as
select
  pa.patio_execucao_id,
  t.placa_norm,
  t.cliente_id,
  t.veiculo_id,
  t.codigo_erp,
  t.cliente_nome,
  t.fonte
from public.patio_atendimentos pa
left join public.patio_veiculos_snapshot pvs on pvs.patio_veiculo_id = pa.patio_veiculo_id
left join public.veiculos v on v.id = pa.veiculo_id
join tmp_reconciliacao_cliente_55555 t
  on t.placa_norm = upper(regexp_replace(coalesce(pa.placa_snapshot, pvs.placa, v.placa, ''), '[^A-Z0-9]', '', 'g'))
where pa.cliente_id = (
  select id from public.clientes where codigo_erp = '55555' and nome = 'THIAGO RODRIGUES' limit 1
);

update public.veiculos ve
set
  cliente_id = t.cliente_id,
  codigo_cliente_erp = t.codigo_erp,
  atualizado_em = now(),
  raw_data = jsonb_set(
    coalesce(ve.raw_data, '{}'::jsonb),
    '{reconciliacao_cliente_55555}',
    jsonb_build_object('em', now(), 'fonte', t.fonte, 'cliente_id', t.cliente_id, 'codigo_erp', t.codigo_erp, 'cliente_nome', t.cliente_nome),
    true
  )
from tmp_reconciliacao_cliente_55555 t
where upper(regexp_replace(coalesce(ve.placa, ''), '[^A-Z0-9]', '', 'g')) = t.placa_norm
  and ve.cliente_id = (
    select id from public.clientes where codigo_erp = '55555' and nome = 'THIAGO RODRIGUES' limit 1
  );

update public.patio_veiculos_snapshot pvs
set
  cliente_id = t.cliente_id,
  veiculo_id = coalesce(
    pvs.veiculo_id,
    t.veiculo_id,
    (
      select ve.id
      from public.veiculos ve
      where upper(regexp_replace(coalesce(ve.placa, ''), '[^A-Z0-9]', '', 'g')) = t.placa_norm
        and ve.cliente_id = t.cliente_id
      order by coalesce(ve.ultimo_atendimento_em::timestamp, ve.atualizado_em, ve.criado_em) desc nulls last
      limit 1
    )
  ),
  match_tipo = 'reconciliado_omsys',
  match_score = greatest(coalesce(pvs.match_score, 0), 95),
  sincronizado_em = now(),
  raw_data = jsonb_set(
    coalesce(pvs.raw_data, '{}'::jsonb),
    '{reconciliacao_cliente_55555}',
    jsonb_build_object('em', now(), 'fonte', t.fonte, 'cliente_id', t.cliente_id, 'codigo_erp', t.codigo_erp, 'cliente_nome', t.cliente_nome),
    true
  )
from tmp_reconciliacao_cliente_55555 t
where upper(regexp_replace(coalesce(pvs.placa, ''), '[^A-Z0-9]', '', 'g')) = t.placa_norm
  and pvs.cliente_id = (
    select id from public.clientes where codigo_erp = '55555' and nome = 'THIAGO RODRIGUES' limit 1
  );

update public.patio_atendimentos pa
set
  cliente_id = e.cliente_id,
  veiculo_id = coalesce(
    pa.veiculo_id,
    e.veiculo_id,
    (
      select ve.id
      from public.veiculos ve
      where upper(regexp_replace(coalesce(ve.placa, ''), '[^A-Z0-9]', '', 'g')) = e.placa_norm
        and ve.cliente_id = e.cliente_id
      order by coalesce(ve.ultimo_atendimento_em::timestamp, ve.atualizado_em, ve.criado_em) desc nulls last
      limit 1
    )
  ),
  sincronizado_em = now(),
  raw_data = jsonb_set(
    coalesce(pa.raw_data, '{}'::jsonb),
    '{reconciliacao_cliente_55555}',
    jsonb_build_object('em', now(), 'fonte', e.fonte, 'cliente_id', e.cliente_id, 'codigo_erp', e.codigo_erp, 'cliente_nome', e.cliente_nome),
    true
  )
from tmp_reconciliacao_execucoes_55555 e
where pa.patio_execucao_id = e.patio_execucao_id;

update public.patio_atendimento_itens pai
set
  cliente_id = e.cliente_id,
  veiculo_id = coalesce(
    pai.veiculo_id,
    e.veiculo_id,
    (
      select ve.id
      from public.veiculos ve
      where upper(regexp_replace(coalesce(ve.placa, ''), '[^A-Z0-9]', '', 'g')) = e.placa_norm
        and ve.cliente_id = e.cliente_id
      order by coalesce(ve.ultimo_atendimento_em::timestamp, ve.atualizado_em, ve.criado_em) desc nulls last
      limit 1
    )
  ),
  sincronizado_em = now(),
  raw_data = jsonb_set(
    coalesce(pai.raw_data, '{}'::jsonb),
    '{reconciliacao_cliente_55555}',
    jsonb_build_object('em', now(), 'fonte', e.fonte, 'cliente_id', e.cliente_id, 'codigo_erp', e.codigo_erp, 'cliente_nome', e.cliente_nome),
    true
  )
from tmp_reconciliacao_execucoes_55555 e
where pai.patio_execucao_id = e.patio_execucao_id
  and pai.cliente_id = (
    select id from public.clientes where codigo_erp = '55555' and nome = 'THIAGO RODRIGUES' limit 1
  );

update public.clientes
set
  nome = 'CONSUMIDOR FINAL',
  nome_fantasia = coalesce(nome_fantasia, 'CONSUMIDOR FINAL'),
  atualizado_em = now(),
  raw_data = jsonb_set(
    coalesce(raw_data, '{}'::jsonb),
    '{reconciliacao_cliente_55555}',
    jsonb_build_object('em', now(), 'nome_anterior', 'THIAGO RODRIGUES', 'motivo', 'codigo_55555_e_consumidor_final'),
    true
  )
where codigo_erp = '55555'
  and nome = 'THIAGO RODRIGUES';

commit;
