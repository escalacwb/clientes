import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

loadEnvFile('.env')
loadEnvFile('.env.local')

const crmDbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL
const patioDbUrl =
  process.env.PATIO_DB_URL ||
  process.env.PATIO_DATABASE_URL ||
  loadEnvValue(path.resolve('..', '..', 'controle-patio', '.env'), ['DB_URL', 'DATABASE_URL']) ||
  loadEnvValue(path.resolve('..', '..', 'controle-patio-backup-20260601-095959', '.env'), ['DB_URL', 'DATABASE_URL'])

if (!crmDbUrl) {
  console.error('SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL nao configurada no CRM.')
  process.exit(1)
}

if (!patioDbUrl) {
  console.error('PATIO_DB_URL nao configurada e .env do controle-patio nao encontrado.')
  process.exit(1)
}

const crm = new pg.Client({
  connectionString: crmDbUrl,
  ssl: { rejectUnauthorized: false },
})

const patio = new pg.Client({
  connectionString: patioDbUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await patio.connect()
  await patio.query('set default_transaction_read_only = on')
  await crm.connect()

  const crmClientes = await loadCrmClientes()
  const crmVeiculos = await loadCrmVeiculos()
  const patioClientes = await loadPatioClientes()
  const patioVeiculos = await loadPatioVeiculos()
  const clienteMap = buildClienteMap(patioClientes, crmClientes)
  const veiculoMap = buildVeiculoMap(patioVeiculos, crmVeiculos, clienteMap)

  await upsertPatioClientes(patioClientes, clienteMap)
  await upsertPatioVeiculos(patioVeiculos, clienteMap, veiculoMap)
  await upsertPatioAtendimentos(clienteMap, veiculoMap)
  await upsertPatioAtendimentoItens(clienteMap, veiculoMap)
  await upsertPatioContatos(patioClientes, patioVeiculos, clienteMap)
  await refreshOportunidades()

  console.log(JSON.stringify({
    ok: true,
    patio_clientes: patioClientes.length,
    patio_clientes_vinculados: [...clienteMap.values()].filter((match) => match.clienteId).length,
    patio_veiculos: patioVeiculos.length,
    patio_veiculos_vinculados: [...veiculoMap.values()].filter((match) => match.veiculoId).length,
  }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await patio.end().catch(() => undefined)
  await crm.end().catch(() => undefined)
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

async function loadPatioClientes() {
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
  `)
  return rows
}

async function loadPatioVeiculos() {
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
  `)
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

async function upsertPatioAtendimentos(clienteMap, veiculoMap) {
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
  `)

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
}

async function upsertPatioAtendimentoItens(clienteMap, veiculoMap) {
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

  for (const [area, table] of serviceTables) {
    const { rows } = await patio.query(`
      select
        s.*,
        v.cliente_id as patio_cliente_id
      from public.${table} s
      left join public.veiculos v on v.id = s.veiculo_id
    `)

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
  }
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
}

async function refreshOportunidades() {
  await crm.query('select public.refresh_oportunidades_cache()')
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
