export function mapCliente(row) {
  return {
    origem: text(row['Origem cliente']),
    status_origem: text(row['Status cliente']),
    codigo_erp: text(row['Código cliente arquivo.xls']),
    cpf_cnpj: onlyDigits(row['CPF/CNPJ']),
    nome: text(row['Nome do cliente']),
    nome_fantasia: text(row.Fantasia),
    cidade: text(row['Cidade Cliente']),
    uf: text(row.Estado),
    cep: onlyDigits(row.CEP),
    telefone_principal: normalizePhone(row['Telefone Cliente']),
    email: lower(row['E-mail do Cliente']),
    endereco: joinAddress(row),
    bairro: text(row.Bairro),
    vendedor_nome: text(row['Vendedor cadastro']),
    tipo_cliente: text(row['Tipo de cliente cadastro']),
    primeira_compra_em: toIsoDate(row['Primeira venda ERP']),
    ultima_compra_em: toIsoDate(row['Última venda ERP']),
    ultimo_servico_em: toIsoDate(row['Último serviço']),
    total_comprado: number(row['Valor total']),
    total_servicos: number(row['Valor total serviços']),
    tags: inferTags(row),
  }
}

export function mapVenda(row) {
  const nota = text(row.Nota)
  const codigoCliente = text(row['Código cliente arquivo.xls'])
  const produtoCodigo = text(row['Código produto ERP'])
  const data = toIsoDate(row['Data da venda ERP'])
  const quantidade = number(row.Quantidade)
  const valorTotal = number(row['Valor total item'])

  return {
    codigo_cliente_erp: codigoCliente,
    cpf_cnpj: onlyDigits(row['CPF/CNPJ']),
    cliente_nome: text(row['Nome do cliente']),
    data_venda: data,
    nota,
    pedido: text(row.Pedido),
    produto_codigo: produtoCodigo,
    produto_nome: text(row['Modelo / Produto']),
    quantidade,
    valor_unitario: number(row['Valor unitário']),
    valor_total: valorTotal,
    vendedor_nome: text(row['Vendedor ERP']),
    chave_unica: ['venda', nota, codigoCliente, produtoCodigo, data, quantidade, valorTotal].join('|'),
  }
}

export function mapServico(row) {
  const nota = text(row.Nota)
  const codigoCliente = text(row['Código cliente arquivo.xls'])
  const servicoCodigo = text(row['Código serviço'])
  const data = toIsoDate(row['Data do serviço'])
  const quantidade = number(row.Quantidade)
  const valorTotal = number(row['Valor total item'])

  return {
    codigo_cliente_erp: codigoCliente,
    cpf_cnpj: onlyDigits(row['CPF/CNPJ']),
    cliente_nome: text(row['Nome do cliente']),
    data_servico: data,
    nota,
    pedido: text(row.Pedido),
    servico_codigo: servicoCodigo,
    servico_nome: text(row['Serviço / Produto']),
    quantidade,
    valor_unitario: number(row['Valor unitário']),
    valor_total: valorTotal,
    vendedor_nome: text(row['Vendedor serviço']),
    unidade: text(row.Empresa),
    observacao: text(row['Observação/placa']),
    chave_unica: ['servico', nota, codigoCliente, servicoCodigo, data, quantidade, valorTotal].join('|'),
  }
}

export function summarize(rows, uniqueFields) {
  return {
    sampled: rows.length,
    missingName: rows.filter((row) => !row.nome && !row.cliente_nome).length,
    unique: Object.fromEntries(
      uniqueFields.map((field) => [field, new Set(rows.map((row) => row[field]).filter(Boolean)).size]),
    ),
  }
}

function inferTags(row) {
  const tags = []
  const modelos = text(row['Modelos vendidos (amostra)']).toLowerCase()
  const servicos = text(row['Serviços realizados']).toLowerCase()
  if (modelos.includes('michelin')) tags.push('Cliente Michelin')
  if (modelos.includes('bfgoodrich')) tags.push('Cliente BFGoodrich')
  if (servicos.includes('alinh')) tags.push('Alinhamento')
  if (servicos.includes('balance')) tags.push('Balanceamento')
  if (!normalizePhone(row['Telefone Cliente'])) tags.push('Contato incompleto')
  return tags
}

function joinAddress(row) {
  return [row['Endereço Cliente'], row.Número].map(text).filter(Boolean).join(', ')
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function lower(value) {
  return text(value).toLowerCase()
}

function onlyDigits(value) {
  return text(value).replace(/\D/g, '')
}

function normalizePhone(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

function number(value) {
  if (typeof value === 'number') return value
  const normalized = text(value).replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function toIsoDate(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)

  const raw = text(value)
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}
