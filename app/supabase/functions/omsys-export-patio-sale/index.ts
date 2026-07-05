import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'

type JsonRecord = Record<string, unknown>
type SupabaseService = SupabaseClient<any, 'public', any>

type ExportRequestBody = {
  vendaId?: string
  dryRun?: boolean
  force?: boolean
}

type ExportRow = {
  id: string
  status: string
  placa: string | null
  km: number | null
  payload: JsonRecord
  bloqueios: string[] | null
  avisos: string[] | null
  tentativas: number | null
  pedido_omsys: string | null
  cliente_id: string | null
  cliente_codigo: string | null
  cliente_fallback_consumidor: boolean | null
}

type OmsysItem = {
  codigo: string
  descricao: string
  codt: string
  quantidade: number
  precoUnitario: number
  precoTotal: number
  tecnicoCodigo: string
}

type FormState = {
  values: Record<string, string>
  postable: Set<string>
}

type SaleBuildResult = {
  pedido: string
  placa: string
  total: number
  itens: number
  finalPost?: JsonRecord
  validacao: JsonRecord
  respostaFinal?: JsonRecord
}

const defaultBaseUrl = 'http://capitalpneus.omsys.info:8081/omsys'
const salePath = 'cadvenda_acao1.php?acao=cadastrar&regi=undefined&orse=S&nojan=jVenda'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-omsys-export-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })
  if (request.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405)

  const body = await request.json().catch(() => ({})) as ExportRequestBody
  const vendaId = body.vendaId?.trim()
  const dryRun = Boolean(body.dryRun)

  try {
    if (!vendaId) throw new HttpError('Venda do Patio nao informada.', 400)

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    await assertAuthorized(request, supabaseUrl)

    const service = createClient(supabaseUrl, requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    })

    const result = await exportPatioSale(service, vendaId, {
      dryRun,
      force: Boolean(body.force),
    })

    return json(result)
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    console.error('omsys-export-patio-sale error', normalizeError(error))
    return json(normalizeError(error), status)
  }
})

async function assertAuthorized(request: Request, supabaseUrl: string) {
  const configuredSecret = Deno.env.get('OMSYS_PATIO_EXPORT_SECRET')?.trim()
  const providedSecret = request.headers.get('x-omsys-export-secret')?.trim()
  if (configuredSecret && providedSecret && timingSafeEqual(configuredSecret, providedSecret)) return

  const authorization = request.headers.get('authorization') ?? ''
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw new HttpError('Autenticacao obrigatoria para exportar venda OMSYS.', 401)
  }

  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!anonKey) return

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { authorization } },
  })
  const { data, error } = await userClient.auth.getUser()
  if (error || !data.user) throw new HttpError('Sessao invalida para exportar venda OMSYS.', 401)
}

async function exportPatioSale(
  service: SupabaseService,
  vendaId: string,
  options: { dryRun: boolean; force: boolean },
) {
  let row = await loadExportRow(service, vendaId)
  validateRowCanExport(row, options)

  if (!options.dryRun) {
    row = await markExporting(service, row, options.force)
  }

  try {
    const clienteNome = await loadClienteNome(service, row)
    const session = await loginOmsys(requiredEnv('OMSYS_TRUCK_COMPANY_ID', '11'))
    const result = await buildAndSubmitSale(session, row, clienteNome, options.dryRun)

    if (!options.dryRun) {
      await markExported(service, row, result)
    }

    return {
      ok: true,
      dry_run: options.dryRun,
      venda_id: row.id,
      status: options.dryRun ? row.status : 'exportada',
      pedido_omsys: result.pedido,
      placa: result.placa,
      total: result.total,
      itens: result.itens,
      validacao: result.validacao,
      final_post: result.finalPost,
      resposta_final: result.respostaFinal,
    }
  } catch (error) {
    if (!options.dryRun) await markExportError(service, row.id, error)
    throw error
  }
}

async function loadExportRow(service: SupabaseService, vendaId: string): Promise<ExportRow> {
  const { data, error } = await service
    .from('patio_omsys_vendas_exportacoes')
    .select('id,status,placa,km,payload,bloqueios,avisos,tentativas,pedido_omsys,cliente_id,cliente_codigo,cliente_fallback_consumidor')
    .eq('id', vendaId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new HttpError('Venda do Patio nao encontrada.', 404)
  return normalizeExportRow(data as JsonRecord)
}

async function loadClienteNome(service: SupabaseService, row: ExportRow) {
  if ((row.payload.cliente_codigo ?? row.cliente_codigo) === '55555') return 'CONSUMIDOR FINAL'
  if (!row.cliente_id) return ''

  const { data, error } = await service
    .from('clientes')
    .select('nome')
    .eq('id', row.cliente_id)
    .maybeSingle()
  if (error) throw error
  return typeof data?.nome === 'string' ? data.nome : ''
}

async function markExporting(service: SupabaseService, row: ExportRow, force: boolean): Promise<ExportRow> {
  const allowedStatus = force ? ['pendente', 'preparada', 'erro', 'exportando'] : ['pendente', 'preparada', 'erro']
  const { data, error } = await service
    .from('patio_omsys_vendas_exportacoes')
    .update({
      status: 'exportando',
      tentativas: Number(row.tentativas ?? 0) + 1,
      ultimo_erro: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', row.id)
    .in('status', allowedStatus)
    .select('id,status,placa,km,payload,bloqueios,avisos,tentativas,pedido_omsys,cliente_id,cliente_codigo,cliente_fallback_consumidor')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new HttpError('Venda do Patio mudou de status antes da exportacao.', 409)
  return normalizeExportRow(data as JsonRecord)
}

async function markExported(service: SupabaseService, row: ExportRow, result: SaleBuildResult) {
  const now = new Date().toISOString()
  const payload = {
    ...row.payload,
    omsys_exportacao: {
      pedido: result.pedido,
      exportado_em: now,
      origem: 'edge_function',
    },
  }
  const avisos = appendUnique(row.avisos ?? [], 'exportada_omsys_edge')

  const { error } = await service
    .from('patio_omsys_vendas_exportacoes')
    .update({
      status: 'exportada',
      pedido_omsys: result.pedido,
      payload,
      avisos,
      ultimo_erro: null,
      exportado_em: now,
      atualizado_em: now,
    })
    .eq('id', row.id)

  if (error) throw error
}

async function markExportError(service: SupabaseService, vendaId: string, error: unknown) {
  const message = normalizeError(error).message
  const { error: updateError } = await service
    .from('patio_omsys_vendas_exportacoes')
    .update({
      status: 'erro',
      ultimo_erro: message.slice(0, 2000),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', vendaId)

  if (updateError) console.error('Falha ao marcar erro da exportacao OMSYS', updateError)
}

function validateRowCanExport(row: ExportRow, options: { dryRun: boolean; force: boolean }) {
  if (row.status === 'exportada' && !options.force) {
    throw new HttpError(`Venda do Patio ja exportada no pedido ${row.pedido_omsys ?? ''}.`, 409)
  }

  const allowed = options.force
    ? ['pendente', 'preparada', 'erro', 'exportando', 'exportada']
    : ['pendente', 'preparada', 'erro']
  if (!allowed.includes(row.status)) {
    throw new HttpError(`Venda do Patio nao esta pronta para exportacao. Status atual: ${row.status}.`, 409)
  }

  if ((row.bloqueios ?? []).length > 0 && !options.force) {
    throw new HttpError(`Venda bloqueada para OMSYS: ${(row.bloqueios ?? []).join(', ')}.`, 422)
  }

  const items = normalizeItems(row.payload)
  if (items.length === 0) throw new HttpError('Venda sem itens validos para exportar.', 422)
}

async function buildAndSubmitSale(
  session: OmsysSession,
  row: ExportRow,
  clienteNome: string,
  dryRun: boolean,
): Promise<SaleBuildResult> {
  let form = parseForm(await readOmsysHtml(await session.get(salePath)))
  const items = normalizeItems(row.payload)

  while (toNumber(form.values.hItens) < items.length) {
    const missing = items.length - toNumber(form.values.hItens)
    form = parseForm(await readOmsysHtml(await session.postForm('cadvenda_acao1.php', formToPostBody(form, missing >= 10 ? 'btnItens10' : 'btnItens5'))))
  }

  fillSaleForm(form, row, clienteNome, items)
  const validationXml = await session.xajaxObject(salePath, 'cadvenda_encerrar', form.values)
  const validation = summarizeValidation(validationXml)
  if (!validation.ok) throw new HttpError(validation.message, 502, validation)

  form.values.Conf = 'Ok'
  const pedido = form.values.Nume || form.values.hNume || ''
  const total = toNumber(getPayloadString(row.payload, 'total'))

  if (dryRun) {
    return {
      pedido,
      placa: form.values.Plac || row.placa || '',
      total,
      itens: items.length,
      validacao: validation,
      finalPost: summarizeFinalPost(form),
    }
  }

  const finalResponse = await session.postForm('cadvenda_acao1.php', formToPostBody(form))
  const finalHtml = await readOmsysHtml(finalResponse)
  const finalSummary = summarizeFinalResponse(finalResponse, finalHtml, pedido)
  if (!finalSummary.ok) {
    throw new HttpError(String(finalSummary.message || 'OMSYS nao confirmou a gravacao da venda.'), 502, finalSummary)
  }

  return {
    pedido: String(finalSummary.pedido || pedido),
    placa: form.values.Plac || row.placa || '',
    total,
    itens: items.length,
    validacao: validation,
    respostaFinal: finalSummary,
  }
}

function fillSaleForm(form: FormState, row: ExportRow, clienteNome: string, items: OmsysItem[]) {
  const payload = row.payload
  const total = toNumber(getPayloadString(payload, 'total'))
  const clienteCodigo = getPayloadString(payload, 'cliente_codigo') || row.cliente_codigo || '55555'

  setValue(form, 'Clie', clienteCodigo)
  setValue(form, 'ClieCampoPesq', clienteCodigo === '55555' ? 'CONSUMIDOR FINAL' : clienteNome)
  setValue(form, 'Vend', getPayloadString(payload, 'vendedor_codigo') || '0026')
  setValue(form, 'VendCampoPesq', 'MATEUS SILVA')
  setValue(form, 'NaOp', getPayloadString(payload, 'natureza_codigo') || '5102')
  setValue(form, 'Tran', getPayloadString(payload, 'transportador_codigo') || '0001')
  setValue(form, 'TranCampoPesq', 'O MESMO')
  setValue(form, 'Plac', getPayloadString(payload, 'placa') || row.placa || '')
  setValue(form, 'Carr', getPayloadString(payload, 'veiculo'))
  setValue(form, 'Chas', normalizeKmText(getPayloadString(payload, 'chassi')))
  setValue(form, 'Cone', '00')
  setValue(form, 'TotalOrc', formatDecimal(total, 2))
  setValue(form, 'Liqu', formatDecimal(total, 2))
  setValue(form, 'ToOr', formatDecimal(total, 2))

  items.forEach((item, index) => {
    const rowNumber = index + 1
    setValue(form, `CoEs${rowNumber}`, normalizeOmsysCode(item.codigo))
    setValue(form, `CoEs${rowNumber}CampoPesq`, item.descricao)
    setValue(form, `Codt${rowNumber}`, item.codt || '999')
    setValue(form, `Quan${rowNumber}`, formatDecimal(item.quantidade, 3))
    setValue(form, `Prec${rowNumber}`, formatDecimal(item.precoUnitario, 6))
    setValue(form, `Tota${rowNumber}`, formatDecimal(item.precoTotal, 2))
    setValue(form, `PrLi${rowNumber}`, formatDecimal(item.precoUnitario, 6))
    setValue(form, `PrCu${rowNumber}`, form.values[`PrCu${rowNumber}`] || '1')
    setValue(form, `Grup${rowNumber}`, form.values[`Grup${rowNumber}`] || '55')
    setValue(form, `Unid${rowNumber}`, form.values[`Unid${rowNumber}`] || 'UN')
    setValue(form, `Tecn${rowNumber}`, normalizeOmsysCode(item.tecnicoCodigo, 6))
    setValue(form, `Tec1${rowNumber}`, form.values[`Tec1${rowNumber}`] || '000000')
    setValue(form, `Tec2${rowNumber}`, form.values[`Tec2${rowNumber}`] || '000000')
    setValue(form, `Tec3${rowNumber}`, form.values[`Tec3${rowNumber}`] || '000000')
  })
}

function normalizeItems(payload: JsonRecord): OmsysItem[] {
  const rawItems = Array.isArray(payload.itens) ? payload.itens : []
  return rawItems
    .map((raw): OmsysItem | null => {
      if (!raw || typeof raw !== 'object') return null
      const item = raw as JsonRecord
      const codigo = getPayloadString(item, 'codigo')
      const quantidade = toNumber(item.quantidade)
      if (!codigo || quantidade <= 0) return null
      const precoUnitario = toNumber(item.preco_unitario)
      const precoTotal = toNumber(item.preco_total) || quantidade * precoUnitario
      return {
        codigo,
        descricao: getPayloadString(item, 'descricao') || getPayloadString(item, 'servico_patio') || codigo,
        codt: getPayloadString(item, 'codt') || '999',
        quantidade,
        precoUnitario,
        precoTotal,
        tecnicoCodigo: getPayloadString(item, 'tecnico_codigo') || '000117',
      }
    })
    .filter((item): item is OmsysItem => Boolean(item))
}

async function loginOmsys(companyId: string) {
  const session = new OmsysSession(requiredEnv('OMSYS_BASE_URL', defaultBaseUrl))
  await session.get('novo_login.php?c=&s=&biometria=N')

  await assertXajaxOk(
    await session.xajaxStrings('novo_login.php?c=&s=&biometria=N', 'ver_cnpj', [
      requiredEnv('OMSYS_CNPJ'),
      requiredEnv('OMSYS_CNPJ_PASSWORD'),
      'S',
      '',
    ]),
    'validacao do CNPJ',
  )
  await assertXajaxOk(
    await session.xajaxStrings('novo_login.php?c=&s=&biometria=N', 'ver_usua', [
      requiredEnv('OMSYS_LOGIN'),
      requiredEnv('OMSYS_PASSWORD'),
      '',
      '',
    ]),
    'validacao do usuario',
  )

  await session.post('inicio.php', {
    Bios: '',
    VolInf: '',
    Mac: '',
    hbiometria: 'N',
    NomeMaq: '',
    OmOk: '',
    Cnpj: requiredEnv('OMSYS_CNPJ'),
    CnpjSenha: requiredEnv('OMSYS_CNPJ_PASSWORD'),
    login: requiredEnv('OMSYS_LOGIN'),
    senha: requiredEnv('OMSYS_PASSWORD'),
    sEmpresa: companyId,
  })
  const index = await session.get('index1.php?Biometria=N&OMEcf=N')
  const html = await readOmsysHtml(index)
  if (/LOGIN DO SISTEMA/i.test(html)) throw new HttpError(`Login OMSYS nao abriu a empresa ${companyId}.`, 502)
  return session
}

class OmsysSession {
  private readonly baseUrl: string
  private readonly cookies = new Map<string, string>()

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  async get(path: string) {
    return await this.request(path, { method: 'GET' })
  }

  async post(path: string, params: Record<string, string>) {
    const body = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => body.append(key, value))
    return await this.postForm(path, body)
  }

  async postForm(path: string, body: URLSearchParams) {
    return await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
  }

  async xajaxStrings(path: string, fn: string, args: string[]) {
    const body = new URLSearchParams()
    body.set('xjxfun', fn)
    body.set('xjxr', String(Date.now()))
    args.forEach((arg) => body.append('xjxargs[]', `S${arg}`))
    const response = await this.postForm(path, body)
    return await readOmsysHtml(response)
  }

  async xajaxObject(path: string, fn: string, arg: Record<string, string>) {
    const body = new URLSearchParams()
    body.set('xjxfun', fn)
    body.set('xjxr', String(Date.now()))
    body.append('xjxargs[]', objectToXml(arg))
    const response = await this.postForm(path, body)
    return await readOmsysHtml(response)
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers)
    const cookieHeader = this.cookieHeader()
    if (cookieHeader) headers.set('cookie', cookieHeader)

    const response = await fetch(`${this.baseUrl}/${path.replace(/^\/+/, '')}`, {
      ...init,
      headers,
      redirect: 'manual',
    })
    this.storeCookies(response)

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        const nextUrl = new URL(location, `${this.baseUrl}/`)
        if (nextUrl.origin === new URL(this.baseUrl).origin) {
          return await this.request(nextUrl.pathname.replace(/^\/omsys\//, '') + nextUrl.search, { method: 'GET' })
        }
      }
    }

    return response
  }

  private cookieHeader() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
  }

  private storeCookies(response: Response) {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] }
    const setCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : splitSetCookieHeader(response.headers.get('set-cookie'))

    setCookies.forEach((item) => {
      const pair = item.split(';')[0]
      const index = pair.indexOf('=')
      if (index > 0) this.cookies.set(pair.slice(0, index), pair.slice(index + 1))
    })
  }
}

function parseForm(html: string): FormState {
  const formHtml = html.match(/<form\b[\s\S]*?<\/form>/i)?.[0] ?? ''
  if (!formHtml) throw new HttpError('Tela de venda OMSYS nao retornou formulario.', 502)

  const values: Record<string, string> = {}
  const postable = new Set<string>()

  for (const match of formHtml.matchAll(/<input\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0])
    const name = attributes.name
    if (!name) continue
    const type = (attributes.type || 'text').toLowerCase()
    if ((type === 'checkbox' || type === 'radio') && !('checked' in attributes)) continue
    values[name] = attributes.value ?? ''
    if (!['button', 'submit', 'reset', 'image'].includes(type)) postable.add(name)
  }

  for (const match of formHtml.matchAll(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gi)) {
    const attributes = parseAttributes(match[0])
    const name = attributes.name
    if (!name) continue
    values[name] = decodeHtml(match[1] ?? '')
    postable.add(name)
  }

  for (const match of formHtml.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/gi)) {
    const attributes = parseAttributes(match[0])
    const name = attributes.name
    if (!name) continue
    const options = [...match[0].matchAll(/<option\b[^>]*>/gi)].map((option) => parseAttributes(option[0]))
    const selected = options.find((option) => 'selected' in option) ?? options[0] ?? { value: '' }
    values[name] = selected.value ?? ''
    postable.add(name)
  }

  return { values, postable }
}

function formToPostBody(form: FormState, submitName?: 'btnItens5' | 'btnItens10') {
  const body = new URLSearchParams()
  Object.entries(form.values).forEach(([key, value]) => {
    if (form.postable.has(key)) body.append(key, value)
  })
  if (submitName) body.set(submitName, submitName === 'btnItens10' ? '+10' : '+5')
  return body
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {}
  for (const match of tag.matchAll(/([A-Za-z0-9_:-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g)) {
    let value = match[2]
    const key = match[1].toLowerCase()
    if (value === undefined) {
      attributes[key] = ''
      continue
    }
    value = value.trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    attributes[key] = decodeHtml(value)
  }
  return attributes
}

function summarizeValidation(xml: string) {
  const returnValue = extractXajaxReturn(xml)
  const alertMessage = extractAlertMessage(xml)
  const setsConfirmOk = /getElementById\(['"]Conf['"]\)\.value\s*=\s*['"]Ok['"]/i.test(xml)
  const submitsForm = /document\.form1\.submit\(\)/i.test(xml)

  if (alertMessage) {
    return {
      ok: false,
      message: alertMessage,
      return_value: returnValue,
      sets_confirm_ok: setsConfirmOk,
      submits_form: submitsForm,
    }
  }

  return {
    ok: returnValue === 'Ok' || setsConfirmOk,
    message: returnValue === 'Ok' || setsConfirmOk ? 'Validacao OMSYS aprovada.' : (returnValue || 'OMSYS nao autorizou o fechamento da venda.'),
    return_value: returnValue,
    sets_confirm_ok: setsConfirmOk,
    submits_form: submitsForm,
  }
}

function summarizeFinalPost(form: FormState) {
  return {
    pedido: form.values.Nume || form.values.hNume || '',
    conf: form.values.Conf,
    cliente: form.values.Clie,
    cliente_nome: form.values.ClieCampoPesq,
    vendedor: form.values.Vend,
    placa: form.values.Plac,
    veiculo: form.values.Carr,
    chassi: form.values.Chas,
    total: form.values.TotalOrc || form.values.Liqu || '',
    h_itens: form.values.hItens,
    itens: summarizePostedItems(form),
  }
}

function summarizeFinalResponse(response: Response, html: string, fallbackPedido: string) {
  const mysqlError = html.match(/Erro de Mysql[\s\S]{0,1000}/i)?.[0]
  if (/LOGIN DO SISTEMA/i.test(html)) return { ok: false, message: 'Sessao OMSYS caiu antes de concluir a venda.', status: response.status }
  if (mysqlError) return { ok: false, message: mysqlError.replace(/\s+/g, ' ').trim(), status: response.status }
  if (/Fatal error|Warning:/i.test(html)) {
    return { ok: false, message: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1000), status: response.status }
  }

  const pedido =
    html.match(/PEDIDO\s+([0-9]+)/i)?.[1]
    ?? html.match(/name=["']Nume["'][^>]*value=["']([^"']+)/i)?.[1]
    ?? fallbackPedido

  return {
    ok: response.ok,
    status: response.status,
    pedido,
    titulo: html.match(/<title>(.*?)<\/title>/i)?.[1] ?? '',
  }
}

function summarizePostedItems(form: FormState) {
  const total = toNumber(form.values.hItens)
  const items: JsonRecord[] = []
  for (let index = 1; index <= total; index += 1) {
    const codigo = form.values[`CoEs${index}`]
    const quantidade = toNumber(form.values[`Quan${index}`])
    if (!codigo || quantidade <= 0) continue
    items.push({
      linha: index,
      codigo,
      descricao: form.values[`CoEs${index}CampoPesq`] ?? '',
      codt: form.values[`Codt${index}`] ?? '',
      quantidade,
      preco: toNumber(form.values[`Prec${index}`]),
      total: toNumber(form.values[`Tota${index}`]),
      tecnico: form.values[`Tecn${index}`] ?? '',
    })
  }
  return items
}

function extractXajaxReturn(xml: string) {
  const match = xml.match(/<xjxrv[^>]*>([\s\S]*?)<\/xjxrv>/i)
  if (!match) return ''
  return decodeXajaxValue(match[1]).trim()
}

function extractAlertMessage(xml: string) {
  const alertMatch = xml.match(/alert\((["'])([\s\S]*?)\1\)/i)
  if (!alertMatch) return ''
  return decodeXajaxValue(alertMatch[2]).replace(/\\n/g, '\n').trim()
}

function decodeXajaxValue(value: string) {
  let decoded = value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
  if (/^[SBN]/.test(decoded)) decoded = decoded.slice(1)
  return decodeHtml(decoded)
}

function objectToXml(obj: Record<string, string>, guard = { depth: 0, maxDepth: 20, size: 0, maxSize: 7000 }): string {
  let xml = '<xjxobj>'
  for (const key in obj) {
    guard.size += 1
    if (guard.maxSize < guard.size) return xml
    if (key === 'constructor' || typeof obj[key] === 'undefined') continue
    xml += `<e><k>${escapeXajax(key)}</k><v>`
    const value = obj[key]
    if (value === null || typeof value === 'undefined') {
      xml += '*'
    } else {
      xml += `S${escapeXajax(String(value))}`
    }
    xml += '</v></e>'
  }
  return `${xml}</xjxobj>`
}

function escapeXajax(value: string) {
  if (encodeURIComponent(value) === value) return value
  return `<![CDATA[${value
    .replace(/<!\[CDATA\[/g, '<![]]><![CDATA[CDATA[')
    .replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`
}

async function readOmsysHtml(response: Response) {
  const bytes = await response.arrayBuffer()
  return new TextDecoder('iso-8859-1').decode(bytes)
}

function assertXajaxOk(xml: string, step: string) {
  const retorno = extractXajaxReturn(xml)
  if (retorno !== '') throw new HttpError(`OMSYS recusou ${step}: ${retorno}`, 502)
}

function normalizeExportRow(row: JsonRecord): ExportRow {
  return {
    id: String(row.id ?? ''),
    status: String(row.status ?? ''),
    placa: typeof row.placa === 'string' ? row.placa : null,
    km: typeof row.km === 'number' ? row.km : null,
    payload: isRecord(row.payload) ? row.payload : {},
    bloqueios: arrayOfStrings(row.bloqueios),
    avisos: arrayOfStrings(row.avisos),
    tentativas: typeof row.tentativas === 'number' ? row.tentativas : Number(row.tentativas ?? 0),
    pedido_omsys: typeof row.pedido_omsys === 'string' ? row.pedido_omsys : null,
    cliente_id: typeof row.cliente_id === 'string' ? row.cliente_id : null,
    cliente_codigo: typeof row.cliente_codigo === 'string' ? row.cliente_codigo : null,
    cliente_fallback_consumidor: Boolean(row.cliente_fallback_consumidor),
  }
}

function getPayloadString(payload: JsonRecord, key: string) {
  const value = payload[key]
  return typeof value === 'string' ? value.trim() : value === null || typeof value === 'undefined' ? '' : String(value)
}

function normalizeKmText(value: string) {
  const text = value.trim()
  if (!text || /nao lancado|nÃ£o lanÃ§ado|não lançado/i.test(text)) return 'KM NAO LANCADO'
  return text
}

function normalizeOmsysCode(value: string, size = 9) {
  const text = String(value ?? '').trim()
  if (/^[0-9]+$/.test(text) && text.length <= size) return text.padStart(size, '0')
  return text
}

function setValue(form: FormState, key: string, value: string | number | null | undefined) {
  form.values[key] = value === null || typeof value === 'undefined' ? '' : String(value)
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const trimmed = value.trim()
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  const parsed = Number(normalized)
  if (Number.isFinite(parsed)) return parsed
  const direct = Number(trimmed)
  return Number.isFinite(direct) ? direct : 0
}

function formatDecimal(value: number, decimals: number) {
  return (Number.isFinite(value) ? value : 0).toFixed(decimals)
}

function appendUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value]
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function splitSetCookieHeader(value: string | null) {
  if (!value) return []
  const parts: string[] = []
  let current = ''
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char === ',' && /\s*[^=;,]+=/i.test(value.slice(index + 1))) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function requiredEnv(name: string, fallback?: string) {
  const value = Deno.env.get(name) || fallback
  if (!value) throw new HttpError(`Variavel de ambiente ausente: ${name}`, 500)
  return value
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

function normalizeError(error: unknown) {
  if (error instanceof HttpError) {
    return {
      ok: false,
      message: error.message,
      status: error.status,
      details: error.details,
    }
  }
  if (error instanceof Error) return { ok: false, message: error.message }
  return { ok: false, message: String(error) }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

class HttpError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status = 500, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}
