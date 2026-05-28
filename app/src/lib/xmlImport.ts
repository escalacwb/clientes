export type XmlImportItem = {
  clienteNome: string
  cpfCnpj: string
  codigoCliente: string
  data: string
  documento: string
  itemNome: string
  itemCodigo: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  vendedor: string
  unidade: string
  tipo: 'venda' | 'servico'
}

export type XmlImportPreview = {
  arquivoNome: string
  totalItens: number
  clientesDetectados: number
  valorTotal: number
  itens: XmlImportItem[]
  avisos: string[]
}

export async function previewXmlFiles(files: FileList | File[]): Promise<XmlImportPreview[]> {
  const fileArray = Array.from(files)
  return Promise.all(fileArray.map(previewXmlFile))
}

async function previewXmlFile(file: File): Promise<XmlImportPreview> {
  const { XMLParser } = await import('fast-xml-parser')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: true,
    trimValues: true,
  })
  const xml = await file.text()
  const parsed = parser.parse(xml)
  const itens = extractItems(parsed)
  const clientes = new Set(itens.map((item) => item.codigoCliente || item.cpfCnpj || item.clienteNome).filter(Boolean))

  return {
    arquivoNome: file.name,
    totalItens: itens.length,
    clientesDetectados: clientes.size,
    valorTotal: itens.reduce((total, item) => total + item.valorTotal, 0),
    itens: itens.slice(0, 20),
    avisos: buildWarnings(itens),
  }
}

function extractItems(parsed: unknown): XmlImportItem[] {
  const nodes = flattenObjects(parsed)
  const likelyItems = nodes.filter((node) => {
    const keys = Object.keys(node).map((key) => key.toLowerCase())
    return (
      keys.some((key) => ['produto', 'xprod', 'servico', 'descricao', 'xserv'].includes(key)) &&
      keys.some((key) => ['quantidade', 'qcom', 'qtd', 'valor', 'vprod', 'vserv'].includes(key))
    )
  })

  return likelyItems.map((node) => ({
    clienteNome: pickText(node, ['cliente', 'xnome', 'nome', 'razaoSocial']),
    cpfCnpj: onlyDigits(pickText(node, ['cnpj', 'cpf', 'cpfCnpj', 'documento'])),
    codigoCliente: pickText(node, ['codigoCliente', 'codCliente', 'clienteCodigo', 'codigo_erp']),
    data: normalizeDate(pickText(node, ['data', 'dhEmi', 'dataVenda', 'dataServico', 'emissao'])),
    documento: pickText(node, ['nota', 'nNF', 'pedido', 'numero', 'documento']),
    itemNome: pickText(node, ['produto', 'xProd', 'servico', 'xServ', 'descricao']),
    itemCodigo: pickText(node, ['cProd', 'codigoProduto', 'codigoServico', 'codigo']),
    quantidade: pickNumber(node, ['quantidade', 'qCom', 'qtd']),
    valorUnitario: pickNumber(node, ['valorUnitario', 'vUnCom', 'unitario']),
    valorTotal: pickNumber(node, ['valorTotal', 'vProd', 'vServ', 'valor']),
    vendedor: pickText(node, ['vendedor', 'xVendedor']),
    unidade: pickText(node, ['unidade', 'empresa', 'filial']),
    tipo: inferType(node),
  }))
}

function flattenObjects(
  value: unknown,
  output: Record<string, unknown>[] = [],
  inherited: Record<string, unknown> = {},
): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return output

  if (!Array.isArray(value)) {
    const current = value as Record<string, unknown>
    const scalarFields = Object.fromEntries(
      Object.entries(current).filter(([, child]) => child === null || typeof child !== 'object'),
    )
    const merged = { ...inherited, ...scalarFields, ...current }
    output.push(merged)

    Object.values(current).forEach((child) => {
      if (Array.isArray(child)) child.forEach((item) => flattenObjects(item, output, { ...inherited, ...scalarFields }))
      else flattenObjects(child, output, { ...inherited, ...scalarFields })
    })
    return output
  }

  Object.values(value).forEach((child) => {
    if (Array.isArray(child)) child.forEach((item) => flattenObjects(item, output, inherited))
    else flattenObjects(child, output, inherited)
  })

  return output
}

function buildWarnings(itens: XmlImportItem[]) {
  const avisos = []
  if (itens.length === 0) avisos.push('Nenhum item de venda ou servico foi detectado automaticamente.')
  if (itens.some((item) => !item.cpfCnpj && !item.codigoCliente)) avisos.push('Ha itens sem CPF/CNPJ ou codigo ERP.')
  if (itens.some((item) => !item.itemNome)) avisos.push('Ha itens sem descricao de produto/servico.')
  return avisos
}

function pickText(node: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(node)
  const found = entries.find(([key, value]) =>
    candidates.some((candidate) => candidate.toLowerCase() === key.toLowerCase()) && value !== null && value !== undefined,
  )
  return found ? String(found[1]).trim() : ''
}

function pickNumber(node: Record<string, unknown>, candidates: string[]) {
  const raw = pickText(node, candidates)
  if (!raw) return 0
  const parsed = Number(raw.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeDate(value: string) {
  if (!value) return ''
  return value.slice(0, 10)
}

function inferType(node: Record<string, unknown>): 'venda' | 'servico' {
  const text = Object.keys(node).join(' ').toLowerCase()
  return text.includes('serv') ? 'servico' : 'venda'
}
