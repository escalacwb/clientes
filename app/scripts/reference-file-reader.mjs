import fs from 'node:fs'
import path from 'node:path'

export const REFERENCE_FILES = {
  carrosAtendidos: '../arquivos referencia/carrosatendidos.xls',
  clientesSistema: '../arquivos referencia/listaclientessistema.xls',
  precoProdutos: '../arquivos referencia/precoprodutos.xls',
  precoServicos: '../arquivos referencia/precoservicos.xls',
  vendasProdutos: '../arquivos referencia/vendasprodutos.xls',
  vendasServicos: '../arquivos referencia/vendasservicos.xls',
  michelin: '../arquivos referencia/lancamentosvendasmichelin.xlsx',
}

export function readHtmlRows(relativeFile) {
  const filePath = path.resolve(relativeFile)
  const buffer = fs.readFileSync(filePath)
  const text = buffer.toString('latin1')
  const htmlStart = text.search(/<html[\s>]/i)
  const htmlEnd = text.search(/--separador--/i)
  const html = htmlStart === -1 ? text : text.slice(htmlStart, htmlEnd > htmlStart ? htmlEnd : undefined)
  return html
    .split(/<tr\b/i)
    .slice(1)
    .map((part) => part.slice(0, part.search(/<tr\b/i) === -1 ? undefined : part.search(/<tr\b/i)))
    .map(extractCells)
    .filter((cells) => cells.some(Boolean))
}

export function parseClientesSistema(file = REFERENCE_FILES.clientesSistema) {
  const rows = readHtmlRows(file)
  const headerIndex = rows.findIndex((row) => normalize(row.join(' ')).includes('codigo nome fantasia vendedor'))
  if (headerIndex === -1) return []

  const headers = rows[headerIndex].map(normalizeHeader)
  return rows.slice(headerIndex + 1)
    .filter((row) => /^\d+$/.test(text(row[0])) && text(row[1]))
    .map((row) => objectFromRow(headers, row))
    .map((row) => ({
      codigo_erp: leftPad(text(row.codigo), 5),
      nome: text(row.nome),
      nome_fantasia: text(row.fantasia),
      vendedor_nome: text(row.vendedor),
      canal_venda: text(row.canal_de_venda),
      endereco: text(row.endereco),
      numero: text(row.numero),
      complemento: text(row.complemento),
      bairro: text(row.bairro),
      cidade: text(row.cidade),
      uf: text(row.uf),
      cep: onlyDigits(row.cep),
      telefones: text(row.telefones),
      telefone_principal: normalizePhone(row.telefones),
      cpf_cnpj: onlyDigits(row.cpf_cnpj),
      inscricao: text(row.inscricao),
      cadastro_em: toIsoDate(row.cadastro),
      usuario_cadastro: text(row.usuario),
      email: lower(row.email),
      email_comercial: lower(row.email_comercial),
      tipo_venda: text(row.tipo_de_venda),
      tipo_cliente: text(row.tipo_de_cliente),
      limite: text(row.limite),
      raw: row,
    }))
}

export function parseCarrosAtendidos(file = REFERENCE_FILES.carrosAtendidos) {
  const rows = readHtmlRows(file)
  const headerIndex = rows.findIndex((row) => normalize(row.join(' ')).includes('item pedido nota data carro placa chassi cliente valor'))
  if (headerIndex === -1) return []

  const headers = rows[headerIndex].map(normalizeHeader)
  return rows.slice(headerIndex + 1)
    .filter((row) => /^\d+$/.test(text(row[0])) && parseDate(row[3]))
    .map((row) => objectFromRow(headers, row))
    .map((row) => {
      const cliente = splitCodigoNome(row.cliente)
      const veiculo = parseVehicleNote([row.carro, row.placa, row.chassi].join(' '))
      return {
        pedido: leftPad(text(row.pedido), 7),
        nota: leftPad(text(row.nota), 7),
        data_atendimento: toIsoDate(row.data),
        veiculo_nome: text(row.carro),
        placa: normalizePlate(row.placa),
        chassi: normalizeChassi(row.chassi),
        km: veiculo?.km ?? null,
        raw_vehicle_note: text(row.chassi),
        codigo_cliente_erp: cliente.codigo,
        cliente_nome: cliente.nome,
        valor: number(row.valor),
        raw: row,
      }
    })
}

export function parseListaPreco(file, tipo) {
  const rows = readHtmlRows(file)
  const headerIndex = rows.findIndex((row) => {
    const normalized = normalize(row.join(' '))
    return normalized.includes('item codigo descricao') && normalized.includes('preco')
  })
  if (headerIndex === -1) return []

  const headers = rows[headerIndex].map(normalizeHeader)
  let grupo = ''
  let subgrupo = ''

  return rows.slice(headerIndex + 1).flatMap((row) => {
    const first = text(row[0])
    if (first.startsWith('GRUPO')) {
      grupo = first
      return []
    }
    if (first.startsWith('SUBGRUPO')) {
      subgrupo = first
      return []
    }
    if (!/^\d+$/.test(first)) return []

    const item = objectFromRow(headers, row)
    return [{
      tipo,
      codigo: leftPad(text(item.codigo), 9),
      descricao: text(item.descricao || item.descricao_),
      unidade: text(item.un),
      original: text(item.original),
      estoque: number(item.estoque),
      preco: number(item.preco),
      desconto_maximo: number(item.desconto),
      grupo,
      subgrupo,
      raw: item,
    }]
  })
}

export function parseMovimento(file, tipo) {
  const rows = readHtmlRows(file)
  const items = []
  let cliente = null
  let movimento = null
  let currentOrderItems = []

  for (const row of rows) {
    const cells = row.map(text)
    const first = cells[0] ?? ''
    const normalized = normalize(cells.join(' '))

    if (normalized.includes('total geral')) break
    if (normalized.includes('emissao nota pedido') || normalized.includes('vendas por cliente')) continue
    if (normalized.includes('total do cliente') || normalized.includes('total da fazenda')) continue

    const clienteMatch = first.match(/^(.+?)\s+\((\d{1,8})\)\s+CPF\/CNPJ\s+([^ ]+)(?:\s+TEL\s*:\s*(.*))?$/i)
    if (clienteMatch) {
      cliente = {
        nome: text(clienteMatch[1]),
        codigo_erp: leftPad(clienteMatch[2], 5),
        cpf_cnpj: onlyDigits(clienteMatch[3]),
        telefone_principal: normalizePhone(clienteMatch[4]),
      }
      movimento = null
      currentOrderItems = []
      continue
    }

    if (isDateLike(first) && cells.length >= 9) {
      movimento = {
        data: toIsoDate(first),
        nota: leftPad(cells[1], 7),
        pedido: leftPad(cells[2], 7),
        requisicao: cells[3],
        cfop: cells[4],
        condicao: cells[5],
        vencimento: toIsoDate(cells[6]),
        vendedor_nome: cells[7],
        centro: cells[8],
        total_pedido: number(cells[9]),
        empresa: cells[10] || '',
        vehicle_note: null,
      }
      currentOrderItems = []
      continue
    }

    if (cliente && movimento && isVehicleNoteRow(cells)) {
      const vehicleNote = parseVehicleNote(cells.join(' '))
      if (vehicleNote) {
        movimento.vehicle_note = vehicleNote
        currentOrderItems.forEach((item) => applyVehicleNote(item, vehicleNote))
      }
      continue
    }

    if (!cliente || !movimento || !/^\d+$/.test(first) || cells.length < 7) continue
    if (!isMovementItemDataRow(cells)) continue

    const produto = {
      tipo,
      codigo_cliente_erp: cliente.codigo_erp,
      cpf_cnpj: cliente.cpf_cnpj,
      cliente_nome: cliente.nome,
      telefone_principal: cliente.telefone_principal,
      data: movimento.data,
      nota: movimento.nota,
      pedido: movimento.pedido,
      cfop: cells[4] || movimento.cfop,
      vendedor_nome: movimento.vendedor_nome,
      unidade: movimento.empresa,
      produto_codigo: leftPad(first, 9),
      produto_nome: cells[1],
      lote_serie: cells[3] || '',
      quantidade: number(cells[5]),
      valor_unitario: number(cells[6]),
      valor_total: number(cells[7]),
      total_pedido: movimento.total_pedido,
      chave_unica: [
        tipo,
        movimento.nota,
        movimento.pedido,
        cliente.codigo_erp,
        first,
        movimento.data,
        number(cells[5]),
        number(cells[7]),
      ].join('|'),
    }
    if (movimento.vehicle_note) applyVehicleNote(produto, movimento.vehicle_note)

    items.push(produto)
    currentOrderItems.push(produto)
  }

  return items
}

function isMovementItemDataRow(cells) {
  const quantidade = number(cells[5])
  const unitario = number(cells[6])
  const total = number(cells[7])
  if (!quantidade || quantidade < 0 || quantidade > 10000) return false
  if (unitario < 0 || total < 0) return false
  return unitario > 0 || total > 0
}

export function parseVehicleNote(value) {
  const raw = text(value)
  if (!raw) return null

  const upper = raw.toUpperCase().replace(/\s+/g, ' ').trim()
  const kmMatch = upper.match(/\bKMS?\s*[:\/-]?\s*([0-9][0-9.\s]{0,14})/)
  const km = kmMatch ? Number(kmMatch[1].replace(/\D/g, '')) : null
  const plateMatch =
    upper.match(/\bPLACA\s+([A-Z]{3})\s*-?\s*([0-9][A-Z0-9][0-9]{2}|[0-9]{4})\b/) ||
    upper.match(/\b([A-Z]{3})\s*-?\s*([0-9][A-Z0-9][0-9]{2}|[0-9]{4})\b/)
  const placa = plateMatch ? normalizePlate(`${plateMatch[1]}${plateMatch[2]}`) : ''
  const veiculoDescricao = cleanVehicleDescription(upper, placa)

  if (!placa && !km && !veiculoDescricao) return null
  return {
    placa,
    km,
    veiculo_descricao: veiculoDescricao,
    raw_vehicle_note: raw,
    match: 'observacao_movimento',
  }
}

function extractCells(rowHtml) {
  return Array.from(rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi))
    .map((match) => htmlToText(match[1]))
}

function htmlToText(value) {
  return text(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?13;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function objectFromRow(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
}

function normalizeHeader(value) {
  return normalize(value)
    .replace(/%/g, 'percentual')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function normalize(value) {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function splitCodigoNome(value) {
  const raw = text(value)
  const match = raw.match(/^(\d{1,8})\s+(.+)$/)
  if (!match) return { codigo: '', nome: raw }
  return { codigo: leftPad(match[1], 5), nome: text(match[2]) }
}

function normalizePlate(value) {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeChassi(value) {
  const raw = text(value).toUpperCase().trim()
  const cleaned = raw.replace(/\s+/g, '')
  if (
    !cleaned ||
    cleaned.length !== 17 ||
    cleaned.includes('KM') ||
    cleaned.includes('SEM') ||
    cleaned.includes('TACOGRAFO') ||
    !/^[A-Z0-9]+$/.test(cleaned)
  ) return ''
  return cleaned
}

function isVehicleNoteRow(cells) {
  if (cells.length > 4) return false
  const raw = text(cells.join(' '))
  const normalized = normalize(raw)
  if (!raw || normalized.includes('fazenda') || normalized.includes('total')) return false
  return /\bPLACA\b/i.test(raw) || /\bKMS?\s*[:\/-]?\s*\d/i.test(raw)
}

function applyVehicleNote(item, vehicleNote) {
  if (!item.placa && vehicleNote.placa) item.placa = vehicleNote.placa
  if (!item.km && vehicleNote.km) item.km = vehicleNote.km
  if (!item.veiculo_descricao && vehicleNote.veiculo_descricao) item.veiculo_descricao = vehicleNote.veiculo_descricao
  if (!item.raw_vehicle_note && vehicleNote.raw_vehicle_note) item.raw_vehicle_note = vehicleNote.raw_vehicle_note
  if (!item.veiculo_match && vehicleNote.match) item.veiculo_match = vehicleNote.match
}

function cleanVehicleDescription(value, placa) {
  let cleaned = text(value).toUpperCase()
  if (placa) {
    const prefix = placa.slice(0, 3)
    const suffix = placa.slice(3)
    cleaned = cleaned.replace(new RegExp(`\\b${prefix}\\s*-?\\s*${suffix}\\b`, 'g'), ' ')
  }
  cleaned = cleaned
    .replace(/\bPLACA\b/g, ' ')
    .replace(/\bKMS?\s*[:\/-]?\s*[0-9][0-9.\s]{0,14}/g, ' ')
    .replace(/^[.\s-]+/, ' ')
    .replace(/[./]+/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || ''
}

function normalizePhone(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

function onlyDigits(value) {
  return text(value).replace(/\D/g, '')
}

function lower(value) {
  return text(value).toLowerCase()
}

function leftPad(value, size) {
  const raw = text(value).replace(/\D/g, '')
  return raw ? raw.padStart(size, '0') : ''
}

function number(value) {
  if (typeof value === 'number') return value
  const raw = text(value)
  if (!raw) return 0
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function isDateLike(value) {
  return Boolean(parseDate(value))
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  const raw = text(value)
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]))
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toIsoDate(value) {
  const date = parseDate(value)
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}
