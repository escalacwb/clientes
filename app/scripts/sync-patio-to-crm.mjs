import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

loadEnvFile('.env')
loadEnvFile('.env.local')

const options = parseArgs(process.argv.slice(2))
const crmDbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL
const patioDbUrl =
  process.env.PATIO_DB_URL ||
  process.env.PATIO_DATABASE_URL ||
  loadEnvValue(path.resolve('..', '..', 'controle-patio', '.env'), ['DB_URL', 'DATABASE_URL']) ||
  loadEnvValue(path.resolve('..', '..', 'controle-patio-backup-20260601-095959', '.env'), ['DB_URL', 'DATABASE_URL'])
const ACTIVE_PATIO_STATUS = "status is distinct from 'finalizado'"
let crm
let patio

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

async function main() {
  if (options.help) {
    printHelp()
    return
  }

  validateEnv()

  if (options.watch) {
    await runWatch()
    return
  }

  await runSyncOnce({ mode: 'once' })
}

async function runWatch() {
  console.log(JSON.stringify({
    event: 'patio_crm_sync_watch_started',
    intervalMs: options.intervalMs,
    crm: connectionLabel(crmDbUrl),
    patio: connectionLabel(patioDbUrl),
  }))

  let stopRequested = false
  let failures = 0
  process.once('SIGINT', () => {
    stopRequested = true
    console.log(JSON.stringify({ event: 'patio_crm_sync_stop_requested', signal: 'SIGINT' }))
  })
  process.once('SIGTERM', () => {
    stopRequested = true
    console.log(JSON.stringify({ event: 'patio_crm_sync_stop_requested', signal: 'SIGTERM' }))
  })

  while (!stopRequested) {
    const startedAt = Date.now()
    try {
      await runSyncOnce({ mode: 'watch' })
      failures = 0
    } catch (error) {
      failures += 1
      console.error(JSON.stringify({
        event: 'patio_crm_sync_failed',
        failures,
        message: error instanceof Error ? error.message : String(error),
      }))

      if (options.maxFailures > 0 && failures >= options.maxFailures) {
        throw new Error(`Sincronizacao interrompida apos ${failures} falhas consecutivas.`)
      }
    }

    const elapsed = Date.now() - startedAt
    const waitMs = Math.max(1000, options.intervalMs - elapsed)
    if (!stopRequested) await sleep(waitMs)
  }
}

async function runSyncOnce({ mode }) {
  const startedAt = new Date()
  let runId = null
  let lockAcquired = false

  crm = new pg.Client({
    connectionString: crmDbUrl,
    ssl: { rejectUnauthorized: false },
    application_name: 'crm-patio-sync',
  })
  patio = new pg.Client({
    connectionString: patioDbUrl,
    ssl: { rejectUnauthorized: false },
    application_name: 'crm-patio-sync',
  })

  try {
    await patio.connect()
    await patio.query('set default_transaction_read_only = on')
    await crm.connect()
    await ensureSyncRunTable()

    lockAcquired = await acquireSyncLock()
    if (!lockAcquired) {
      const summary = { skipped: true, reason: 'sync_already_running' }
      console.log(JSON.stringify({ ok: true, ...summary }))
      return summary
    }

    const runMode = options.incremental ? `${mode}:incremental` : `${mode}:full`
    runId = await createSyncRun({ mode: runMode, startedAt })

    const syncState = await loadSyncState()
    const crmClientes = await loadCrmClientes()
    const crmVeiculos = await loadCrmVeiculos()
    const existingClienteMap = await loadExistingPatioClienteMap()
    const existingVeiculoMap = await loadExistingPatioVeiculoMap()
    const patioClientes = await loadPatioClientes(syncState)
    const patioVeiculos = await loadPatioVeiculos(syncState)
    const changedClienteMap = buildClienteMap(patioClientes, crmClientes)
    const clienteMap = mergeMaps(existingClienteMap, changedClienteMap)
    const changedVeiculoMap = buildVeiculoMap(patioVeiculos, crmVeiculos, clienteMap)
    const veiculoMap = mergeMaps(existingVeiculoMap, changedVeiculoMap)

    await upsertPatioClientes(patioClientes, clienteMap)
    await updateSyncState('clientes', patioClientes, ['data_atualizacao_contato'])
    await upsertPatioVeiculos(patioVeiculos, clienteMap, veiculoMap)
    await updateSyncState('veiculos', patioVeiculos, ['data_atualizacao_contato'])
    const patioFuncionariosCount = await upsertPatioFuncionarios()
    const patioBoxesCount = await upsertPatioBoxes()
    const patioAtendimentosCount = await upsertPatioAtendimentos(clienteMap, veiculoMap, syncState)
    const patioAtendimentoItensCount = await upsertPatioAtendimentoItens(clienteMap, veiculoMap, syncState)
    const patioAtendimentosRemovidos = await reconcileMissingActivePatioAtendimentos()
    const patioContatosCount = await upsertPatioContatos(patioClientes, patioVeiculos, clienteMap)
    const oportunidadesAtualizadas = options.refreshOportunidades ? await refreshOportunidades() : null

    const summary = {
      ok: true,
      mode: runMode,
      sync_strategy: options.incremental ? 'incremental' : 'full',
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      patio_clientes: patioClientes.length,
      patio_clientes_vinculados: patioClientes.filter((row) => clienteMap.get(Number(row.id))?.clienteId).length,
      patio_veiculos: patioVeiculos.length,
      patio_veiculos_vinculados: patioVeiculos.filter((row) => veiculoMap.get(Number(row.id))?.veiculoId).length,
      patio_funcionarios: patioFuncionariosCount,
      patio_boxes: patioBoxesCount,
      patio_atendimentos: patioAtendimentosCount,
      patio_atendimento_itens: patioAtendimentoItensCount,
      patio_atendimentos_removidos_origem: patioAtendimentosRemovidos,
      patio_contatos: patioContatosCount,
      oportunidades_atualizadas: oportunidadesAtualizadas,
    }

    if (runId) await finishSyncRun(runId, 'ok', summary)
    console.log(JSON.stringify(summary, null, options.watch ? 0 : 2))
    return summary
  } catch (error) {
    if (runId) {
      await finishSyncRun(runId, 'erro', {}, error).catch(() => undefined)
    }
    throw error
  } finally {
    if (lockAcquired && crm) await releaseSyncLock().catch(() => undefined)
    await patio.end().catch(() => undefined)
    await crm.end().catch(() => undefined)
    patio = undefined
    crm = undefined
  }
}

async function loadCrmClientes() {
  const { rows } = await crm.query(`
    select id, codigo_erp, nome, cidade, uf
    from public.clientes
    where excluido_em is null
  `)
  return rows
}

async function loadCrmVeiculos() {
  const { rows } = await crm.query(`
    select id, cliente_id, placa, chassi, descricao
    from public.veiculos
  `)
  return rows
}

async function loadExistingPatioClienteMap() {
  const { rows } = await crm.query(`
    select patio_cliente_id, cliente_id, match_tipo, match_score
    from public.patio_clientes_snapshot
  `)
  return new Map(rows.map((row) => [Number(row.patio_cliente_id), {
    clienteId: row.cliente_id,
    matchTipo: row.match_tipo,
    matchScore: row.match_score,
  }]))
}

async function loadExistingPatioVeiculoMap() {
  const { rows } = await crm.query(`
    select patio_veiculo_id, cliente_id, veiculo_id, match_tipo, match_score
    from public.patio_veiculos_snapshot
  `)
  return new Map(rows.map((row) => [Number(row.patio_veiculo_id), {
    clienteId: row.cliente_id,
    veiculoId: row.veiculo_id,
    matchTipo: row.match_tipo,
    matchScore: row.match_score,
  }]))
}

async function loadPatioClientes(syncState) {
  const filter = sourceFilter(syncState, 'clientes', {
    timestampExpressions: ['data_atualizacao_contato'],
  })
  const { rows } = await patio.query(`
    select
      id,
      nome_empresa,
      nome_fantasia,
      cidade,
      uf,
      codigo_antigo,
      cnpj,
      nome_contato,
      telefone,
      email,
      nome_responsavel,
      contato_responsavel,
      data_atualizacao_contato
    from public.clientes
    ${filter.clause}
  `, filter.params)
  return rows
}

async function loadPatioVeiculos(syncState) {
  const filter = sourceFilter(syncState, 'veiculos', {
    timestampExpressions: ['data_atualizacao_contato'],
  })
  const { rows } = await patio.query(`
    select
      id,
      placa,
      empresa,
      modelo,
      cliente_id,
      nome_motorista,
      contato_motorista,
      ano_modelo,
      media_km_diaria,
      data_revisao_proativa,
      data_atualizacao_contato
    from public.veiculos
    ${filter.clause}
  `, filter.params)
  return rows
}

function buildClienteMap(patioClientes, crmClientes) {
  const byCodigo = new Map()
  const byNome = new Map()

  crmClientes.forEach((cliente) => {
    if (cliente.codigo_erp) byCodigo.set(String(cliente.codigo_erp).trim(), cliente)
    const nome = normalize(cliente.nome)
    if (nome && !byNome.has(nome)) byNome.set(nome, cliente)
  })

  const map = new Map()
  patioClientes.forEach((patioCliente) => {
    const codigo = patioCliente.codigo_antigo == null ? '' : String(patioCliente.codigo_antigo).trim()
    const nome = normalize(patioCliente.nome_empresa)
    const codigoMatch = codigo ? byCodigo.get(codigo) : undefined
    const nomeMatch = nome ? byNome.get(nome) : undefined
    const cliente = codigoMatch ?? nomeMatch
    map.set(Number(patioCliente.id), {
      clienteId: cliente?.id ?? null,
      matchTipo: codigoMatch ? 'codigo_erp' : nomeMatch ? 'nome_exato' : 'nao_vinculado',
      matchScore: codigoMatch ? 100 : nomeMatch ? 82 : 0,
    })
  })
  return map
}

function buildVeiculoMap(patioVeiculos, crmVeiculos, clienteMap) {
  const byPlaca = new Map()
  crmVeiculos.forEach((veiculo) => {
    const placa = normalizePlate(veiculo.placa)
    if (placa) byPlaca.set(placa, veiculo)
  })

  const map = new Map()
  patioVeiculos.forEach((patioVeiculo) => {
    const placa = normalizePlate(patioVeiculo.placa)
    const veiculo = placa ? byPlaca.get(placa) : undefined
    const clienteMatch = clienteMap.get(Number(patioVeiculo.cliente_id))
    map.set(Number(patioVeiculo.id), {
      veiculoId: veiculo?.id ?? null,
      clienteId: veiculo?.cliente_id ?? clienteMatch?.clienteId ?? null,
      matchTipo: veiculo ? 'placa' : clienteMatch?.clienteId ? 'cliente_patio' : 'nao_vinculado',
      matchScore: veiculo ? 100 : clienteMatch?.clienteId ? 60 : 0,
    })
  })
  return map
}

function mergeMaps(base, overrides) {
  return new Map([...base.entries(), ...overrides.entries()])
}

async function upsertPatioClientes(rows, clienteMap) {
  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        patio_cliente_id bigint,
        cliente_id uuid,
        match_tipo text,
        match_score integer,
        nome_empresa text,
        nome_fantasia text,
        cidade text,
        uf text,
        codigo_antigo text,
        cnpj text,
        nome_contato text,
        telefone text,
        email text,
        nome_responsavel text,
        contato_responsavel text,
        data_atualizacao_contato timestamptz,
        raw_data jsonb
      )
    )
    insert into public.patio_clientes_snapshot (
      patio_cliente_id, cliente_id, match_tipo, match_score, nome_empresa, nome_fantasia,
      cidade, uf, codigo_antigo, cnpj, nome_contato, telefone, email, nome_responsavel,
      contato_responsavel, data_atualizacao_contato, raw_data, sincronizado_em
    )
    select
      patio_cliente_id, cliente_id, match_tipo, match_score, nome_empresa, nome_fantasia,
      cidade, uf, codigo_antigo, cnpj, nome_contato, telefone, email, nome_responsavel,
      contato_responsavel, data_atualizacao_contato, raw_data, now()
    from payload
    on conflict (patio_cliente_id) do update set
      cliente_id = excluded.cliente_id,
      match_tipo = excluded.match_tipo,
      match_score = excluded.match_score,
      nome_empresa = excluded.nome_empresa,
      nome_fantasia = excluded.nome_fantasia,
      cidade = excluded.cidade,
      uf = excluded.uf,
      codigo_antigo = excluded.codigo_antigo,
      cnpj = excluded.cnpj,
      nome_contato = excluded.nome_contato,
      telefone = excluded.telefone,
      email = excluded.email,
      nome_responsavel = excluded.nome_responsavel,
      contato_responsavel = excluded.contato_responsavel,
      data_atualizacao_contato = excluded.data_atualizacao_contato,
      raw_data = excluded.raw_data,
      sincronizado_em = now()
  `

  const payload = rows.map((row) => {
    const match = clienteMap.get(Number(row.id)) ?? {}
    return {
      patio_cliente_id: row.id,
      cliente_id: match.clienteId,
      match_tipo: match.matchTipo ?? 'nao_vinculado',
      match_score: match.matchScore ?? 0,
      nome_empresa: row.nome_empresa,
      nome_fantasia: row.nome_fantasia,
      cidade: row.cidade,
      uf: row.uf,
      codigo_antigo: row.codigo_antigo == null ? null : String(row.codigo_antigo),
      cnpj: row.cnpj,
      nome_contato: row.nome_contato,
      telefone: row.telefone,
      email: row.email,
      nome_responsavel: row.nome_responsavel,
      contato_responsavel: row.contato_responsavel,
      data_atualizacao_contato: row.data_atualizacao_contato,
      raw_data: row,
    }
  })

  await runJsonBatches(sql, payload)
}

async function upsertPatioVeiculos(rows, clienteMap, veiculoMap) {
  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        patio_veiculo_id bigint,
        cliente_id uuid,
        veiculo_id uuid,
        patio_cliente_id bigint,
        match_tipo text,
        match_score integer,
        placa text,
        empresa text,
        modelo text,
        ano_modelo integer,
        nome_motorista text,
        contato_motorista text,
        media_km_diaria numeric,
        data_revisao_proativa date,
        data_atualizacao_contato timestamptz,
        raw_data jsonb
      )
    )
    insert into public.patio_veiculos_snapshot (
      patio_veiculo_id, cliente_id, veiculo_id, patio_cliente_id, match_tipo, match_score,
      placa, empresa, modelo, ano_modelo, nome_motorista, contato_motorista,
      media_km_diaria, data_revisao_proativa, data_atualizacao_contato, raw_data, sincronizado_em
    )
    select
      patio_veiculo_id, cliente_id, veiculo_id, patio_cliente_id, match_tipo, match_score,
      placa, empresa, modelo, ano_modelo, nome_motorista, contato_motorista,
      media_km_diaria, data_revisao_proativa, data_atualizacao_contato, raw_data, now()
    from payload
    on conflict (patio_veiculo_id) do update set
      cliente_id = excluded.cliente_id,
      veiculo_id = excluded.veiculo_id,
      patio_cliente_id = excluded.patio_cliente_id,
      match_tipo = excluded.match_tipo,
      match_score = excluded.match_score,
      placa = excluded.placa,
      empresa = excluded.empresa,
      modelo = excluded.modelo,
      ano_modelo = excluded.ano_modelo,
      nome_motorista = excluded.nome_motorista,
      contato_motorista = excluded.contato_motorista,
      media_km_diaria = excluded.media_km_diaria,
      data_revisao_proativa = excluded.data_revisao_proativa,
      data_atualizacao_contato = excluded.data_atualizacao_contato,
      raw_data = excluded.raw_data,
      sincronizado_em = now()
  `

  const payload = rows.map((row) => {
    const match = veiculoMap.get(Number(row.id)) ?? {}
    const clienteMatch = clienteMap.get(Number(row.cliente_id)) ?? {}
    return {
      patio_veiculo_id: row.id,
      cliente_id: match.clienteId ?? clienteMatch.clienteId ?? null,
      veiculo_id: match.veiculoId ?? null,
      patio_cliente_id: row.cliente_id ?? null,
      match_tipo: match.matchTipo ?? 'nao_vinculado',
      match_score: match.matchScore ?? 0,
      placa: normalizePlate(row.placa) || row.placa,
      empresa: row.empresa,
      modelo: row.modelo,
      ano_modelo: row.ano_modelo,
      nome_motorista: row.nome_motorista,
      contato_motorista: row.contato_motorista,
      media_km_diaria: row.media_km_diaria,
      data_revisao_proativa: row.data_revisao_proativa,
      data_atualizacao_contato: row.data_atualizacao_contato,
      raw_data: row,
    }
  })

  await runJsonBatches(sql, payload)
}

async function upsertPatioFuncionarios() {
  const { rows } = await patio.query(`
    select *
    from public.funcionarios
    where id > 0
  `)

  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        patio_funcionario_id bigint,
        nome text,
        ativo boolean,
        raw_data jsonb
      )
    )
    insert into public.patio_funcionarios_snapshot (
      patio_funcionario_id, nome, ativo, raw_data, sincronizado_em
    )
    select patio_funcionario_id, nome, ativo, raw_data, now()
    from payload
    on conflict (patio_funcionario_id) do update set
      nome = excluded.nome,
      ativo = excluded.ativo,
      raw_data = excluded.raw_data,
      sincronizado_em = now()
  `

  const payload = rows.map((row) => ({
    patio_funcionario_id: row.id,
    nome: row.nome,
    ativo: row.ativo ?? true,
    raw_data: row,
  }))

  await runJsonBatches(sql, payload)
  return rows.length
}

async function upsertPatioBoxes() {
  const { rows } = await patio.query(`
    select *
    from public.boxes
    where id > 0
  `)

  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        patio_box_id integer,
        area text,
        ocupado boolean,
        ativo boolean,
        raw_data jsonb
      )
    )
    insert into public.patio_boxes_snapshot (
      patio_box_id, area, ocupado, ativo, raw_data, sincronizado_em
    )
    select patio_box_id, area, ocupado, ativo, raw_data, now()
    from payload
    on conflict (patio_box_id) do update set
      area = excluded.area,
      ocupado = excluded.ocupado,
      ativo = excluded.ativo,
      raw_data = excluded.raw_data,
      sincronizado_em = now()
  `

  const payload = rows.map((row) => ({
    patio_box_id: row.id,
    area: row.area ?? null,
    ocupado: Boolean(row.ocupado),
    ativo: row.ativo ?? true,
    raw_data: row,
  }))

  await runJsonBatches(sql, payload)
  return rows.length
}

async function upsertPatioAtendimentos(clienteMap, veiculoMap, syncState) {
  const filter = sourceFilter(syncState, 'execucao_servico', {
    timestampExpressions: ['e.inicio_execucao', 'e.fim_execucao', 'e.data_feedback'],
    idExpression: 'e.id',
    activeExpression: `e.${ACTIVE_PATIO_STATUS}`,
  })
  const { rows } = await patio.query(`
    select
      e.id,
      e.veiculo_id,
      v.cliente_id as patio_cliente_id,
      v.placa,
      c.nome_empresa,
      e.box_id,
      e.funcionario_id,
      e.quilometragem,
      e.status,
      e.inicio_execucao,
      e.fim_execucao,
      e.usuario_alocacao_id,
      e.usuario_finalizacao_id,
      e.nome_motorista,
      e.contato_motorista,
      e.data_feedback
    from public.execucao_servico e
    left join public.veiculos v on v.id = e.veiculo_id
    left join public.clientes c on c.id = v.cliente_id
    ${filter.clause}
  `, filter.params)

  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        patio_execucao_id bigint,
        cliente_id uuid,
        veiculo_id uuid,
        patio_cliente_id bigint,
        patio_veiculo_id bigint,
        placa_snapshot text,
        cliente_nome_snapshot text,
        box_id integer,
        funcionario_id integer,
        quilometragem integer,
        status text,
        inicio_execucao timestamptz,
        fim_execucao timestamptz,
        usuario_alocacao_id bigint,
        usuario_finalizacao_id bigint,
        nome_motorista text,
        contato_motorista text,
        data_feedback timestamptz,
        raw_data jsonb
      )
    )
    insert into public.patio_atendimentos (
      patio_execucao_id, cliente_id, veiculo_id, patio_cliente_id, patio_veiculo_id,
      placa_snapshot, cliente_nome_snapshot, box_id, funcionario_id, quilometragem,
      status, inicio_execucao, fim_execucao, usuario_alocacao_id, usuario_finalizacao_id,
      nome_motorista, contato_motorista, data_feedback, raw_data, sincronizado_em
    )
    select
      patio_execucao_id, cliente_id, veiculo_id, patio_cliente_id, patio_veiculo_id,
      placa_snapshot, cliente_nome_snapshot, box_id, funcionario_id, quilometragem,
      status, inicio_execucao, fim_execucao, usuario_alocacao_id, usuario_finalizacao_id,
      nome_motorista, contato_motorista, data_feedback, raw_data, now()
    from payload
    on conflict (patio_execucao_id) do update set
      cliente_id = excluded.cliente_id,
      veiculo_id = excluded.veiculo_id,
      patio_cliente_id = excluded.patio_cliente_id,
      patio_veiculo_id = excluded.patio_veiculo_id,
      placa_snapshot = excluded.placa_snapshot,
      cliente_nome_snapshot = excluded.cliente_nome_snapshot,
      box_id = excluded.box_id,
      funcionario_id = excluded.funcionario_id,
      quilometragem = excluded.quilometragem,
      status = excluded.status,
      inicio_execucao = excluded.inicio_execucao,
      fim_execucao = excluded.fim_execucao,
      usuario_alocacao_id = excluded.usuario_alocacao_id,
      usuario_finalizacao_id = excluded.usuario_finalizacao_id,
      nome_motorista = excluded.nome_motorista,
      contato_motorista = excluded.contato_motorista,
      data_feedback = excluded.data_feedback,
      raw_data = excluded.raw_data,
      sincronizado_em = now()
  `

  const payload = rows.map((row) => {
    const vehicleMatch = veiculoMap.get(Number(row.veiculo_id)) ?? {}
    const clientMatch = clienteMap.get(Number(row.patio_cliente_id)) ?? {}
    return {
      patio_execucao_id: row.id,
      cliente_id: vehicleMatch.clienteId ?? clientMatch.clienteId ?? null,
      veiculo_id: vehicleMatch.veiculoId ?? null,
      patio_cliente_id: row.patio_cliente_id,
      patio_veiculo_id: row.veiculo_id,
      placa_snapshot: normalizePlate(row.placa) || row.placa,
      cliente_nome_snapshot: row.nome_empresa,
      box_id: row.box_id,
      funcionario_id: row.funcionario_id,
      quilometragem: row.quilometragem,
      status: row.status,
      inicio_execucao: row.inicio_execucao,
      fim_execucao: row.fim_execucao,
      usuario_alocacao_id: row.usuario_alocacao_id,
      usuario_finalizacao_id: row.usuario_finalizacao_id,
      nome_motorista: row.nome_motorista,
      contato_motorista: row.contato_motorista,
      data_feedback: row.data_feedback,
      raw_data: row,
    }
  })

  await runJsonBatches(sql, payload)
  await updateSyncState('execucao_servico', rows, ['inicio_execucao', 'fim_execucao', 'data_feedback'])
  return rows.length
}

async function upsertPatioAtendimentoItens(clienteMap, veiculoMap, syncState) {
  const serviceTables = [
    ['borracharia', 'servicos_solicitados_borracharia'],
    ['alinhamento', 'servicos_solicitados_alinhamento'],
    ['manutencao', 'servicos_solicitados_manutencao'],
  ]

  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        patio_item_id bigint,
        patio_tabela_origem text,
        patio_execucao_id bigint,
        cliente_id uuid,
        veiculo_id uuid,
        area text,
        servico_nome text,
        descricao text,
        quantidade integer,
        status text,
        box_id integer,
        funcionario_id integer,
        quilometragem integer,
        observacao_cadastro text,
        observacao_execucao text,
        tipo_atendimento text,
        solicitado_em timestamptz,
        atualizado_em timestamptz,
        raw_data jsonb
      )
    )
    insert into public.patio_atendimento_itens (
      patio_item_id, patio_tabela_origem, patio_execucao_id, cliente_id, veiculo_id,
      area, servico_nome, descricao, quantidade, status, box_id, funcionario_id,
      quilometragem, observacao_cadastro, observacao_execucao, tipo_atendimento,
      solicitado_em, atualizado_em, raw_data, sincronizado_em
    )
    select
      patio_item_id, patio_tabela_origem, patio_execucao_id, cliente_id, veiculo_id,
      area, servico_nome, descricao, quantidade, status, box_id, funcionario_id,
      quilometragem, observacao_cadastro, observacao_execucao, tipo_atendimento,
      solicitado_em, atualizado_em, raw_data, now()
    from payload
    on conflict (patio_tabela_origem, patio_item_id) do update set
      patio_execucao_id = excluded.patio_execucao_id,
      cliente_id = excluded.cliente_id,
      veiculo_id = excluded.veiculo_id,
      area = excluded.area,
      servico_nome = excluded.servico_nome,
      descricao = excluded.descricao,
      quantidade = excluded.quantidade,
      status = excluded.status,
      box_id = excluded.box_id,
      funcionario_id = excluded.funcionario_id,
      quilometragem = excluded.quilometragem,
      observacao_cadastro = excluded.observacao_cadastro,
      observacao_execucao = excluded.observacao_execucao,
      tipo_atendimento = excluded.tipo_atendimento,
      solicitado_em = excluded.solicitado_em,
      atualizado_em = excluded.atualizado_em,
      raw_data = excluded.raw_data,
      sincronizado_em = now()
  `

  let total = 0
  for (const [area, table] of serviceTables) {
    const filter = sourceFilter(syncState, table, {
      timestampExpressions: ['s.data_solicitacao', 's.data_atualizacao'],
      idExpression: 's.id',
      activeExpression: `s.${ACTIVE_PATIO_STATUS}`,
    })
    const { rows } = await patio.query(`
      select
        s.*,
        v.cliente_id as patio_cliente_id
      from public.${table} s
      left join public.veiculos v on v.id = s.veiculo_id
      ${filter.clause}
    `, filter.params)

    const payload = rows.map((row) => {
      const vehicleMatch = veiculoMap.get(Number(row.veiculo_id)) ?? {}
      const clientMatch = clienteMap.get(Number(row.patio_cliente_id)) ?? {}
      return {
        patio_item_id: row.id,
        patio_tabela_origem: table,
        patio_execucao_id: row.execucao_id,
        cliente_id: vehicleMatch.clienteId ?? clientMatch.clienteId ?? null,
        veiculo_id: vehicleMatch.veiculoId ?? null,
        area,
        servico_nome: row.tipo,
        descricao: row.descricao,
        quantidade: row.quantidade,
        status: row.status,
        box_id: row.box_id,
        funcionario_id: row.funcionario_id,
        quilometragem: row.quilometragem,
        observacao_cadastro: row.observacao,
        observacao_execucao: row.observacao_execucao,
        tipo_atendimento: row.tipo_atendimento,
        solicitado_em: row.data_solicitacao,
        atualizado_em: row.data_atualizacao,
        raw_data: row,
      }
    })

    await runJsonBatches(sql, payload)
    await updateSyncState(table, rows, ['data_solicitacao', 'data_atualizacao'])
    total += rows.length
  }

  return total
}

async function reconcileMissingActivePatioAtendimentos() {
  const { rows: activeRows } = await patio.query(`
    select id
    from public.execucao_servico
    where ${ACTIVE_PATIO_STATUS}
  `)

  const activeIds = activeRows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id))

  const { rows } = await crm.query(`
    with active_source as (
      select value::bigint as patio_execucao_id
      from jsonb_array_elements_text($1::jsonb)
    ),
    stale as (
      select pa.patio_execucao_id
      from public.patio_atendimentos pa
      where pa.status is distinct from 'finalizado'
        and pa.status is distinct from 'removido_origem'
        and pa.patio_execucao_id < 1000000000
        and coalesce(pa.raw_data->>'origem', 'patio') <> 'crm_patio'
        and not exists (
          select 1
          from active_source s
          where s.patio_execucao_id = pa.patio_execucao_id
        )
    )
    update public.patio_atendimentos pa
    set status = 'removido_origem',
        box_id = null,
        funcionario_id = null,
        fim_execucao = coalesce(pa.fim_execucao, now()),
        raw_data = coalesce(pa.raw_data, '{}'::jsonb) || jsonb_build_object(
          'sync_status', 'removido_origem',
          'status_anterior', pa.status,
          'removido_origem_em', now()
        ),
        sincronizado_em = now()
    from stale
    where pa.patio_execucao_id = stale.patio_execucao_id
    returning pa.patio_execucao_id
  `, [JSON.stringify(activeIds)])

  return rows.length
}

async function upsertPatioContatos(patioClientes, patioVeiculos, clienteMap) {
  const sql = `
    with payload as (
      select *
      from jsonb_to_recordset($1::jsonb) as row(
        cliente_id uuid,
        nome text,
        cargo text,
        telefone text,
        whatsapp text,
        email text,
        observacao text,
        tipo text,
        origem_id text,
        prioridade integer,
        atualizado_em timestamptz,
        raw_data jsonb
      )
    )
    insert into public.cliente_contatos (
      cliente_id, nome, cargo, telefone, whatsapp, email, principal, observacao,
      tipo, origem_sistema, origem_id, prioridade, atualizado_em, valido, raw_data
    )
    select
      cliente_id, nome, cargo, telefone, whatsapp, email, false, observacao,
      tipo, 'patio', origem_id, prioridade, coalesce(atualizado_em, now()), true, raw_data
    from payload
    on conflict (cliente_id, origem_sistema, origem_id) do update set
      nome = excluded.nome,
      cargo = excluded.cargo,
      telefone = excluded.telefone,
      whatsapp = excluded.whatsapp,
      email = excluded.email,
      observacao = excluded.observacao,
      tipo = excluded.tipo,
      prioridade = excluded.prioridade,
      atualizado_em = excluded.atualizado_em,
      valido = true,
      raw_data = excluded.raw_data
  `

  const payload = []
  for (const row of patioClientes) {
    const match = clienteMap.get(Number(row.id))
    if (!match?.clienteId) continue

    if (hasContact(row.contato_responsavel)) {
      payload.push({
        cliente_id: match.clienteId,
        nome: row.nome_responsavel,
        cargo: 'Responsavel informado no patio',
        telefone: row.contato_responsavel,
        whatsapp: row.contato_responsavel,
        email: row.email,
        observacao: 'Contato de responsavel capturado no atendimento do patio.',
        tipo: 'responsavel',
        origem_id: `patio_cliente:${row.id}:responsavel`,
        prioridade: 95,
        atualizado_em: row.data_atualizacao_contato,
        raw_data: row,
      })
    }

    if (hasContact(row.telefone) || row.email) {
      payload.push({
        cliente_id: match.clienteId,
        nome: row.nome_contato,
        cargo: 'Contato informado no patio',
        telefone: row.telefone,
        whatsapp: row.telefone,
        email: row.email,
        observacao: 'Contato geral capturado no cadastro operacional do patio.',
        tipo: 'operacional',
        origem_id: `patio_cliente:${row.id}:contato`,
        prioridade: 75,
        atualizado_em: row.data_atualizacao_contato,
        raw_data: row,
      })
    }
  }

  for (const row of patioVeiculos) {
    const match = clienteMap.get(Number(row.cliente_id))
    if (!match?.clienteId || !hasContact(row.contato_motorista)) continue

    payload.push({
      cliente_id: match.clienteId,
      nome: row.nome_motorista,
      cargo: `Motorista ${normalizePlate(row.placa) || ''}`.trim(),
      telefone: row.contato_motorista,
      whatsapp: row.contato_motorista,
      email: null,
      observacao: `Contato de motorista capturado no patio${row.placa ? ` para placa ${normalizePlate(row.placa)}` : ''}.`,
      tipo: 'motorista',
      origem_id: `patio_veiculo:${row.id}:motorista`,
      prioridade: 85,
      atualizado_em: row.data_atualizacao_contato,
      raw_data: row,
    })
  }

  await runJsonBatches(sql, payload)
  return payload.length
}

async function refreshOportunidades() {
  const { rows } = await crm.query('select public.refresh_oportunidades_cache() as total')
  return rows[0]?.total ?? null
}

function hasContact(value) {
  return Boolean(String(value ?? '').replace(/\D/g, '').length >= 8)
}

function normalizePlate(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/gi, ' ')
    .trim()
    .toUpperCase()
}

async function runJsonBatches(sql, rows, size = 2000) {
  for (let index = 0; index < rows.length; index += size) {
    const batch = rows.slice(index, index + size)
    if (batch.length > 0) await crm.query(sql, [JSON.stringify(batch)])
  }
}

async function loadSyncState() {
  const { rows } = await crm.query(`
    select source_key, last_cursor_at, last_cursor_id
    from public.crm_patio_sync_state
  `)
  return new Map(rows.map((row) => [row.source_key, {
    lastCursorAt: row.last_cursor_at,
    lastCursorId: row.last_cursor_id == null ? null : Number(row.last_cursor_id),
  }]))
}

function sourceFilter(syncState, sourceKey, {
  timestampExpressions = [],
  idExpression = 'id',
  activeExpression = '',
} = {}) {
  if (!options.incremental) return { clause: '', params: [] }

  const state = syncState.get(sourceKey)
  if (!state?.lastCursorAt && !state?.lastCursorId) return { clause: '', params: [] }

  const params = []
  const conditions = []

  if (state.lastCursorId) {
    params.push(state.lastCursorId)
    conditions.push(`${idExpression} > $${params.length}`)
  }

  if (state.lastCursorAt && timestampExpressions.length > 0) {
    params.push(withLookback(state.lastCursorAt))
    conditions.push(`(${timestampExpressions.map((expression) => `${expression} >= $${params.length}`).join(' or ')})`)
  }

  if (activeExpression) {
    conditions.push(`(${activeExpression})`)
  }

  if (conditions.length === 0) return { clause: '', params: [] }
  return { clause: `where ${conditions.join(' or ')}`, params }
}

async function updateSyncState(sourceKey, rows, timestampFields) {
  const lastCursorId = maxNumeric(rows.map((row) => row.id))
  const lastCursorAt = maxDate(rows.flatMap((row) => timestampFields.map((field) => row[field])))
  if (!lastCursorId && !lastCursorAt) return

  await crm.query(`
    insert into public.crm_patio_sync_state (source_key, last_cursor_at, last_cursor_id, updated_at)
    values ($1, $2, $3, now())
    on conflict (source_key) do update set
      last_cursor_at = greatest(
        coalesce(public.crm_patio_sync_state.last_cursor_at, '-infinity'::timestamptz),
        coalesce(excluded.last_cursor_at, '-infinity'::timestamptz)
      ),
      last_cursor_id = greatest(
        coalesce(public.crm_patio_sync_state.last_cursor_id, 0),
        coalesce(excluded.last_cursor_id, 0)
      ),
      updated_at = now()
  `, [sourceKey, lastCursorAt, lastCursorId])
}

function maxNumeric(values) {
  return values.reduce((max, value) => {
    const number = Number(value)
    return Number.isFinite(number) && number > max ? number : max
  }, 0) || null
}

function maxDate(values) {
  let max = null
  for (const value of values) {
    if (!value) continue
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) continue
    if (!max || date > max) max = date
  }
  return max ? max.toISOString() : null
}

function withLookback(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Date(date.getTime() - options.lookbackMs).toISOString()
}

function loadEnvFile(fileName) {
  const envPath = path.resolve(fileName)
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const separator = trimmed.indexOf('=')
    if (separator === -1) return

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  })
}

function loadEnvValue(envPath, keys) {
  if (!fs.existsSync(envPath)) return undefined
  const values = new Map()
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const separator = trimmed.indexOf('=')
    if (separator === -1) return
    values.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ''))
  })
  return keys.map((key) => values.get(key)).find(Boolean)
}

async function ensureSyncRunTable() {
  await crm.query(`
    create table if not exists public.crm_patio_sync_runs (
      id uuid primary key default gen_random_uuid(),
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      status text not null default 'running' check (status in ('running', 'ok', 'erro')),
      mode text not null default 'once',
      interval_ms integer,
      host text,
      pid integer,
      crm_database text,
      patio_database text,
      summary jsonb not null default '{}'::jsonb,
      error_message text
    )
  `)
  await crm.query(`
    create index if not exists crm_patio_sync_runs_started_idx
    on public.crm_patio_sync_runs(started_at desc)
  `)
  await crm.query(`
    create table if not exists public.crm_patio_sync_state (
      source_key text primary key,
      last_cursor_at timestamptz,
      last_cursor_id bigint,
      updated_at timestamptz not null default now()
    )
  `)
}

async function createSyncRun({ mode, startedAt }) {
  const { rows } = await crm.query(`
    insert into public.crm_patio_sync_runs (
      started_at, status, mode, interval_ms, host, pid, crm_database, patio_database
    )
    values ($1, 'running', $2, $3, $4, $5, $6, $7)
    returning id
  `, [
    startedAt.toISOString(),
    mode,
    options.watch ? options.intervalMs : null,
    os.hostname(),
    process.pid,
    connectionLabel(crmDbUrl),
    connectionLabel(patioDbUrl),
  ])
  return rows[0]?.id ?? null
}

async function finishSyncRun(runId, status, summary, error) {
  await crm.query(`
    update public.crm_patio_sync_runs
    set finished_at = now(),
        status = $2,
        summary = $3::jsonb,
        error_message = $4
    where id = $1
  `, [
    runId,
    status,
    JSON.stringify(summary ?? {}),
    error instanceof Error ? error.message : error ? String(error) : null,
  ])
}

async function acquireSyncLock() {
  const { rows } = await crm.query('select pg_try_advisory_lock(2026070301) as locked')
  return rows[0]?.locked === true
}

async function releaseSyncLock() {
  await crm.query('select pg_advisory_unlock(2026070301)')
}

function validateEnv() {
  if (!crmDbUrl) {
    throw new Error('SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL nao configurada no CRM.')
  }

  if (!patioDbUrl) {
    throw new Error('PATIO_DB_URL nao configurada e .env do controle-patio nao encontrado.')
  }
}

function parseArgs(args) {
  const parsed = {
    help: false,
    watch: false,
    incremental: process.env.PATIO_CRM_SYNC_MODE === 'incremental',
    intervalMs: Number(process.env.PATIO_CRM_SYNC_INTERVAL_MS || 5 * 60 * 1000),
    lookbackMs: Number(process.env.PATIO_CRM_SYNC_LOOKBACK_MS || 10 * 60 * 1000),
    maxFailures: Number(process.env.PATIO_CRM_SYNC_MAX_FAILURES || 0),
    refreshOportunidades: process.env.PATIO_CRM_SYNC_REFRESH_OPORTUNIDADES !== 'false',
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--help' || arg === '-h') parsed.help = true
    if (arg === '--watch') parsed.watch = true
    if (arg === '--once') parsed.watch = false
    if (arg === '--incremental') parsed.incremental = true
    if (arg === '--full') parsed.incremental = false
    if (arg === '--no-refresh-oportunidades') parsed.refreshOportunidades = false
    if (arg === '--interval-ms') parsed.intervalMs = positiveNumber(args[index += 1], parsed.intervalMs)
    if (arg === '--interval-seconds') parsed.intervalMs = positiveNumber(args[index += 1], parsed.intervalMs / 1000) * 1000
    if (arg === '--lookback-ms') parsed.lookbackMs = positiveNumber(args[index += 1], parsed.lookbackMs)
    if (arg === '--lookback-seconds') parsed.lookbackMs = positiveNumber(args[index += 1], parsed.lookbackMs / 1000) * 1000
    if (arg === '--max-failures') parsed.maxFailures = positiveNumber(args[index += 1], parsed.maxFailures)
  }

  parsed.intervalMs = Math.max(30_000, Math.round(parsed.intervalMs))
  parsed.lookbackMs = Math.max(0, Math.round(parsed.lookbackMs))
  parsed.maxFailures = Math.max(0, Math.round(parsed.maxFailures))
  return parsed
}

function positiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function connectionLabel(connectionString) {
  try {
    const url = new URL(connectionString)
    return `${url.hostname}/${url.pathname.replace(/^\//, '')}`
  } catch {
    return 'desconhecido'
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function printHelp() {
  console.log(`
Sincroniza o Supabase do Patio para as tabelas snapshot do CRM.

Uso:
  node scripts/sync-patio-to-crm.mjs
  node scripts/sync-patio-to-crm.mjs --incremental
  node scripts/sync-patio-to-crm.mjs --watch --interval-seconds 300

Variaveis:
  SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL  Banco destino do CRM
  PATIO_DB_URL ou PATIO_DATABASE_URL         Banco origem do Patio
  PATIO_CRM_SYNC_MODE                        full ou incremental
  PATIO_CRM_SYNC_INTERVAL_MS                Intervalo do modo watch
  PATIO_CRM_SYNC_LOOKBACK_MS                Margem de seguranca do incremental
  PATIO_CRM_SYNC_MAX_FAILURES               Falhas consecutivas antes de parar

Opcoes:
  --once                         Executa uma vez (padrao)
  --watch                        Mantem sincronizando em loop
  --full                         Reprocessa tabelas inteiras
  --incremental                  Busca apenas novos/alterados desde o cursor
  --interval-ms <ms>             Intervalo do loop
  --interval-seconds <segundos>  Intervalo do loop
  --lookback-ms <ms>             Rele uma margem antes do cursor
  --lookback-seconds <segundos>  Rele uma margem antes do cursor
  --max-failures <numero>        Para apos N falhas consecutivas; 0 nunca para
  --no-refresh-oportunidades     Nao executa refresh_oportunidades_cache
`)
}
