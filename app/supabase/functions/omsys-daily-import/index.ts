import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'

type JsonRecord = Record<string, unknown>
type SupabaseService = SupabaseClient<any, 'public', any>

type ImportRequestBody = {
  dateFrom?: string
  dateTo?: string
  dryRun?: boolean
  includeCatalogos?: boolean
  includeTecnicos?: boolean
  onlyTecnicos?: boolean
}

type Period = {
  dateFrom: string
  dateTo: string
  source: string
}

type CompanyKey = 'service' | 'truck'

type ReportSpec = {
  company: CompanyKey
  path: string
  fileName: string
  expected: RegExp
  params: Record<string, string>
}

type DownloadedReport = {
  spec: ReportSpec
  bytes: Uint8Array
}

type OmsysFuncionarioListRow = {
  codigo: string
  nome: string
  funcao: string
  admissao: string
  rescisao: string
  empresa: string
  centroCusto: string
}

type OmsysFuncionarioCadastroRow = {
  regi: string
  codigo: string
  nome: string
  funcao: string
}

type OmsysTechnician = OmsysFuncionarioListRow & {
  regi: string
  tecnicoVendedorCodigo: string
  tecnicoVendedor: string
}

const defaultBaseUrl = 'http://capitalpneus.omsys.info:8081/omsys'
const defaultTimeZone = 'America/Cuiaba'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-omsys-import-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })
  if (request.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405)

  try {
    assertDailyImportSecret(request)

    const body = await request.json().catch(() => ({})) as ImportRequestBody
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    if (body.onlyTecnicos) {
      const technicians = await fetchOmsysTechnicians()
      if (body.dryRun) {
        return json({
          ok: true,
          dryRun: true,
          onlyTecnicos: true,
          tecnicos: summarizeTechnicians(technicians),
        })
      }

      return json({
        ok: true,
        onlyTecnicos: true,
        tecnicos: await upsertOmsysTechnicians(service, technicians),
      })
    }

    const period = await resolvePeriod(service, body)
    const includeCatalogos = body.includeCatalogos ?? (Deno.env.get('OMSYS_IMPORT_INCLUDE_CATALOGS') ?? 'true') !== 'false'
    const includeTecnicos = body.includeTecnicos ?? (Deno.env.get('OMSYS_IMPORT_INCLUDE_TECHNICIANS') ?? 'true') !== 'false'

    const reports = await downloadReports(period, includeCatalogos)
    const technicians = includeTecnicos ? await fetchOmsysTechnicians() : []
    if (body.dryRun) {
      return json({
        ok: true,
        dryRun: true,
        periodo: period,
        arquivos: summarizeReports(reports),
        tecnicos: summarizeTechnicians(technicians),
      })
    }

    const importResult = await callReferenceImport(supabaseUrl, reports)
    const techniciansResult = includeTecnicos
      ? await upsertOmsysTechnicians(service, technicians)
      : { total: 0, ativos: 0, desativados: 0, ignorado: true }
    return json({
      ok: true,
      periodo: period,
      arquivos: summarizeReports(reports),
      importacao: importResult,
      tecnicos: techniciansResult,
    })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    console.error('omsys-daily-import error', normalizeError(error))
    return json(normalizeError(error), status)
  }
})

async function fetchOmsysTechnicians(): Promise<OmsysTechnician[]> {
  const session = await loginOmsys(requiredEnv('OMSYS_SERVICE_COMPANY_ID', '2'))
  await session.get('cadfunci.php')
  await session.get('cadastro.php')

  const printHtml = await readOmsysHtml(await session.get('imprimir.php?Ordem=A_NOME&Tipo=T'))
  const rows = parseFuncionariosPrint(printHtml)
  if (!rows.length) {
    throw new HttpError('Relatorio de funcionarios OMSYS sem linhas reconhecidas.', 502)
  }

  const candidates = rows.filter(isTechnicianCandidate)
  const cadastroRows = parseFuncionarioCadastroRows(await readOmsysHtml(await session.get('cadastro.php')))
  const technicians: OmsysTechnician[] = []

  for (const candidate of candidates) {
    const regi = await resolveFuncionarioRegi(session, candidate, cadastroRows)
    if (!regi) continue

    const detailHtml = await readOmsysHtml(await session.get(`cadastro.php?acao=consultar&regi=${encodeURIComponent(regi)}`))
    const tecnicoVendedorCodigo = selectedValue(detailHtml, 'A_TEVE')
    const selectedByRole = isOperationalTechnicianRole(candidate.funcao)
    const selectedByOmsysFlag = isServiceTechnician(tecnicoVendedorCodigo)
    if (!selectedByRole && !selectedByOmsysFlag) continue

    technicians.push({
      ...candidate,
      regi,
      tecnicoVendedorCodigo,
      tecnicoVendedor: tecnicoVendedorLabel(tecnicoVendedorCodigo, selectedByRole),
    })
  }

  return technicians
}

async function resolveFuncionarioRegi(
  session: OmsysSession,
  candidate: OmsysFuncionarioListRow,
  initialRows: OmsysFuncionarioCadastroRow[],
) {
  const fromInitial = initialRows.find((row) => row.codigo === candidate.codigo)
  if (fromInitial) return fromInitial.regi

  const searched = await searchFuncionarioCadastroRows(session, candidate.nome)
  return searched.find((row) => row.codigo === candidate.codigo)?.regi ?? null
}

async function searchFuncionarioCadastroRows(session: OmsysSession, query: string) {
  const response = await session.post('cadastro.php?acao=pesquisar', {
    SetarDebug: '',
    SetarMostrar: '',
    menuOrdem: 'Nome',
    CampoPesq: query,
    btnOk: 'S',
    sFiltro: 'A',
    eFiltro: requiredEnv('OMSYS_TECHNICIANS_COMPANY_ID', '00002'),
    cFiltro: requiredEnv('OMSYS_TECHNICIANS_COST_CENTER_ID', '002'),
  })
  return parseFuncionarioCadastroRows(await readOmsysHtml(response))
}

function parseFuncionariosPrint(html: string): OmsysFuncionarioListRow[] {
  const rows: OmsysFuncionarioListRow[] = []
  for (const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((cell) => cleanHtmlText(cell[1]))

    if (!/^\d{6}$/.test(cells[0] ?? '')) continue
    rows.push({
      codigo: cells[0] ?? '',
      nome: cells[1] ?? '',
      funcao: cells[3] ?? '',
      admissao: cells[4] ?? '',
      rescisao: cells[5] ?? '',
      empresa: cells[10] ?? '',
      centroCusto: cells[11] ?? '',
    })
  }
  return rows
}

function parseFuncionarioCadastroRows(html: string): OmsysFuncionarioCadastroRow[] {
  const rows: OmsysFuncionarioCadastroRow[] = []
  const regis = [...html.matchAll(/TD_A_CODI_(\d+)_0/gi)]
    .map((match) => match[1])
    .filter((regi, index, all) => Boolean(regi) && all.indexOf(regi) === index)

  for (const regi of regis) {
    rows.push({
      regi,
      codigo: hiddenValue(html, `TD_A_CODI_${regi}_0`),
      nome: hiddenValue(html, `TD_A_NOME_${regi}_1`),
      funcao: hiddenValue(html, `TD_A_FUNS_${regi}_3`),
    })
  }
  return rows
}

function isTechnicianCandidate(row: OmsysFuncionarioListRow) {
  const companyText = Deno.env.get('OMSYS_TECHNICIANS_COMPANY_TEXT') || 'Capital Service'
  const costCenterCode = Deno.env.get('OMSYS_TECHNICIANS_COST_CENTER_ID') || '002'
  const costCenterText = Deno.env.get('OMSYS_TECHNICIANS_COST_CENTER_TEXT') || 'CAPITAL TRUCK CENTER'
  return !row.rescisao
    && normalizeText(row.empresa).includes(normalizeText(companyText))
    && normalizeText(row.centroCusto).startsWith(normalizeText(costCenterCode))
    && normalizeText(row.centroCusto).includes(normalizeText(costCenterText))
}

function isServiceTechnician(value: string) {
  return value === 'T' || value === 'A'
}

function isOperationalTechnicianRole(value: string) {
  const allowlist = (Deno.env.get('OMSYS_TECHNICIANS_FUNCTION_ALLOWLIST')
    || 'ALINHADOR,BORRACHEIRO,MONTADOR,MECANICO,MECANICO DIESEL,MECANICA,ELETRICISTA,SUSPENSAO,SUSPENSAO')
    .split(',')
    .map((item) => normalizeText(item))
    .filter(Boolean)
  const normalized = normalizeText(value)
  return allowlist.some((role) => normalized.includes(role))
}

function tecnicoVendedorLabel(value: string, selectedByRole = false) {
  if (value === 'T') return 'Tecnico'
  if (value === 'A') return 'Ambos'
  if (value === 'V') return 'Vendedor'
  if (selectedByRole) return 'Funcao operacional'
  return 'Nenhum'
}

async function upsertOmsysTechnicians(service: SupabaseService, technicians: OmsysTechnician[]) {
  const now = new Date().toISOString()
  const deactivate = await service
    .from('patio_funcionarios_snapshot')
    .update({ ativo: false, sincronizado_em: now })
    .gte('patio_funcionario_id', 900000000)
    .lte('patio_funcionario_id', 900999999)
    .filter('raw_data->>origem', 'eq', 'omsys')
    .filter('raw_data->>tipo', 'eq', 'tecnico')
    .select('patio_funcionario_id')

  if (deactivate.error) throw deactivate.error

  if (!technicians.length) {
    return {
      total: 0,
      ativos: 0,
      desativados: deactivate.data?.length ?? 0,
    }
  }

  const payload = technicians.map((technician) => ({
    patio_funcionario_id: omsysTechnicianId(technician.codigo),
    nome: technician.nome,
    ativo: true,
    raw_data: {
      origem: 'omsys',
      tipo: 'tecnico',
      omsys_codigo: technician.codigo,
      omsys_regi: technician.regi,
      omsys_a_teve: technician.tecnicoVendedorCodigo,
      tecnico_vendedor: technician.tecnicoVendedor,
      funcao: technician.funcao,
      empresa: technician.empresa,
      centro_custo: technician.centroCusto,
      admissao: technician.admissao,
      filtro_situacao: 'ATIVOS',
      filtro_empresa: 'Capital Service/DOURADOS',
      filtro_centro_custo: 'CAPITAL TRUCK CENTER',
      filtro_tecnico_vendedor: 'Tecnico/Ambos ou funcao operacional',
      sincronizado_por: 'omsys-daily-import',
    },
    sincronizado_em: now,
  }))

  const upsert = await service
    .from('patio_funcionarios_snapshot')
    .upsert(payload, { onConflict: 'patio_funcionario_id' })
    .select('patio_funcionario_id')

  if (upsert.error) throw upsert.error

  return {
    total: technicians.length,
    ativos: upsert.data?.length ?? technicians.length,
    desativados: deactivate.data?.length ?? 0,
    nomes: technicians.map((technician) => `${technician.codigo} - ${technician.nome}`),
  }
}

function omsysTechnicianId(codigo: string) {
  const numeric = Number(onlyDigits(codigo))
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new HttpError(`Codigo de tecnico OMSYS invalido: ${codigo}.`, 502)
  }
  return 900000000 + numeric
}

async function resolvePeriod(service: SupabaseService, body: ImportRequestBody): Promise<Period> {
  const timeZone = Deno.env.get('OMSYS_TIME_ZONE') || defaultTimeZone
  const today = localTodayIso(timeZone)
  const dateTo = normalizeInputDate(body.dateTo) || today
  const requestedDateFrom = normalizeInputDate(body.dateFrom)
  if (requestedDateFrom) return normalizePeriod({ dateFrom: requestedDateFrom, dateTo, source: 'request' })

  const latestMovementDate = await loadLatestMovementDate(service)
  if (latestMovementDate) {
    const overlapDays = numberEnv('OMSYS_IMPORT_OVERLAP_DAYS', 1)
    return normalizePeriod({
      dateFrom: addDaysIso(latestMovementDate, -overlapDays),
      dateTo,
      source: 'latest_movimento',
    })
  }

  const initialLookbackDays = numberEnv('OMSYS_INITIAL_LOOKBACK_DAYS', 3)
  return normalizePeriod({
    dateFrom: addDaysIso(dateTo, -initialLookbackDays),
    dateTo,
    source: 'initial_lookback',
  })
}

function normalizePeriod(period: Period): Period {
  if (period.dateFrom > period.dateTo) return { ...period, dateFrom: period.dateTo }
  return period
}

async function loadLatestMovementDate(service: SupabaseService) {
  const [venda, servico] = await Promise.all([
    service
      .from('vendas_itens')
      .select('data_venda')
      .order('data_venda', { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from('servicos_itens')
      .select('data_servico')
      .order('data_servico', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (venda.error) throw venda.error
  if (servico.error) throw servico.error

  const dates = [
    typeof venda.data?.data_venda === 'string' ? venda.data.data_venda : '',
    typeof servico.data?.data_servico === 'string' ? servico.data.data_servico : '',
  ].filter(Boolean)
  return dates.sort().at(-1) ?? null
}

async function downloadReports(period: Period, includeCatalogos: boolean) {
  const serviceSession = await loginOmsys(requiredEnv('OMSYS_SERVICE_COMPANY_ID', '2'))
  const truckSession = await loginOmsys(requiredEnv('OMSYS_TRUCK_COMPANY_ID', '11'))
  const sessions: Record<CompanyKey, OmsysSession> = {
    service: serviceSession,
    truck: truckSession,
  }

  const specs = buildReportSpecs(period, includeCatalogos)
  const reports: DownloadedReport[] = []
  for (const spec of specs) {
    reports.push(await fetchReport(sessions[spec.company], spec))
  }
  return reports
}

function buildReportSpecs(period: Period, includeCatalogos: boolean): ReportSpec[] {
  const dateFrom = toOmsysDate(period.dateFrom)
  const dateTo = toOmsysDate(period.dateTo)
  const reports: ReportSpec[] = [
    {
      company: 'service',
      path: 'relvencldet.php',
      fileName: 'vendasservicos.xls',
      expected: /Vendas por Cliente Detalhado/i,
      params: { DtIn: dateFrom, DtFi: dateTo, Grup: '55', LiIt: 'S', Ok: '++OK++' },
    },
    {
      company: 'truck',
      path: 'relvencldet.php',
      fileName: 'vendasprodutos.xls',
      expected: /Vendas por Cliente Detalhado/i,
      params: { DtIn: dateFrom, DtFi: dateTo, LiIt: 'S', Ok: '++OK++' },
    },
    {
      company: 'service',
      path: 'relcarat.php',
      fileName: 'carrosatendidosservice.xls',
      expected: /CARROS ATENDIDOS/i,
      params: { DtIn: dateFrom, DtFi: dateTo, Ok: '++OK++' },
    },
    {
      company: 'truck',
      path: 'relcarat.php',
      fileName: 'carrosatendidostruck.xls',
      expected: /CARROS ATENDIDOS/i,
      params: { DtIn: dateFrom, DtFi: dateTo, Ok: '++OK++' },
    },
    {
      company: 'service',
      path: 'relclili.php',
      fileName: 'listaclientessistema.xls',
      expected: /LISTA DE CLIENTES/i,
      params: {
        AtIn: 'T',
        FiJu: 'T',
        LiSN: 'N',
        LiFa: 'N',
        Orde: 'C',
        Qual: '',
        AtuI: dateFrom,
        AtuF: dateTo,
        Ok: '++OK++',
      },
    },
  ]

  if (includeCatalogos) {
    reports.push(
      {
        company: 'service',
        path: 'rellista.php',
        fileName: 'precoservicos.xls',
        expected: /LISTA DE PRE/i,
        params: { GrIn: '55', GrFi: '55', Qual: 'T', FiPr: 'C', Situ: 'A', Esto: 'S', Ok: '++OK++' },
      },
      {
        company: 'truck',
        path: 'rellista.php',
        fileName: 'precoprodutos.xls',
        expected: /LISTA DE PRE/i,
        params: { GrIn: '51', GrFi: '61', Qual: 'P', FiPr: 'C', Situ: 'A', Esto: 'N', Ok: '++OK++' },
      },
    )
  }

  return reports
}

async function fetchReport(session: OmsysSession, spec: ReportSpec): Promise<DownloadedReport> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await session.post(spec.path, spec.params)
      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const html = decodeOmsysBytes(bytes)
      if (!spec.expected.test(html)) {
        throw new HttpError(`Relatorio OMSYS inesperado para ${spec.fileName}.`, 502, {
          arquivo: spec.fileName,
          bytes: bytes.length,
          amostra: html.slice(0, 180).replace(/\s+/g, ' '),
        })
      }
      return { spec, bytes }
    } catch (error) {
      lastError = error
      if (error instanceof HttpError || attempt === 3) break
      await delay(attempt * 1000)
    }
  }
  throw lastError
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callReferenceImport(supabaseUrl: string, reports: DownloadedReport[]) {
  const importSecret = requiredEnv('IMPORT_REFERENCE_FILES_SECRET')
  const form = new FormData()
  form.append('mode', 'daily')
  for (const report of reports) {
    const fileBuffer = new Uint8Array(report.bytes).buffer as ArrayBuffer
    form.append(
      'files',
      new File([fileBuffer], report.spec.fileName, { type: 'application/vnd.ms-excel' }),
    )
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/import-reference-files`, {
    method: 'POST',
    headers: { 'x-import-secret': importSecret },
    body: form,
  })
  const payload = await readResponsePayload(response)
  if (!response.ok) {
    throw new HttpError('Falha ao importar pacote OMSYS no CRM.', response.status, payload)
  }
  return payload
}

async function loginOmsys(companyId: string) {
  const session = new OmsysSession(requiredEnv('OMSYS_BASE_URL', defaultBaseUrl))
  await session.get('novo_login.php?c=&s=&biometria=N')

  await assertXajaxOk(
    await session.xajax('novo_login.php?c=&s=&biometria=N', 'ver_cnpj', [
      requiredEnv('OMSYS_CNPJ'),
      requiredEnv('OMSYS_CNPJ_PASSWORD'),
      'S',
      '',
    ]),
    'validacao do CNPJ',
  )
  await assertXajaxOk(
    await session.xajax('novo_login.php?c=&s=&biometria=N', 'ver_usua', [
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
  const html = await index.text()
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
    return await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
  }

  async xajax(path: string, fn: string, args: string[]) {
    const body = new URLSearchParams()
    body.set('xjxfun', fn)
    body.set('xjxr', String(Date.now()))
    args.forEach((arg) => body.append('xjxargs[]', `S${arg}`))
    const response = await this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    return await response.text()
  }

  private async request(path: string, init: RequestInit) {
    const headers = new Headers(init.headers)
    const cookieHeader = this.cookieHeader()
    if (cookieHeader) headers.set('cookie', cookieHeader)

    const response = await fetch(`${this.baseUrl}/${path.replace(/^\/+/, '')}`, {
      ...init,
      headers,
      redirect: 'manual',
    })
    this.storeCookies(response)
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

function assertXajaxOk(xml: string, step: string) {
  const retorno = extractXajaxReturn(xml)
  if (retorno !== '') throw new HttpError(`OMSYS recusou ${step}: ${retorno}`, 502)
}

function extractXajaxReturn(xml: string) {
  const match = xml.match(/<xjxrv[^>]*>([\s\S]*?)<\/xjxrv>/i)
  if (!match) return ''
  let value = match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
  if (value.startsWith('S')) value = value.slice(1)
  return value.trim()
}

async function readResponsePayload(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text) as JsonRecord
  } catch {
    return { raw: text }
  }
}

async function readOmsysHtml(response: Response) {
  const buffer = await response.arrayBuffer()
  return decodeOmsysBytes(new Uint8Array(buffer))
}

function decodeOmsysBytes(bytes: Uint8Array) {
  return new TextDecoder('iso-8859-1').decode(bytes)
}

function summarizeReports(reports: DownloadedReport[]) {
  return reports.map((report) => ({
    arquivo: report.spec.fileName,
    empresa: report.spec.company,
    origem: report.spec.path,
    bytes: report.bytes.length,
  }))
}

function summarizeTechnicians(technicians: OmsysTechnician[]) {
  return {
    total: technicians.length,
    nomes: technicians.map((technician) => `${technician.codigo} - ${technician.nome}`),
  }
}

function hiddenValue(html: string, id: string) {
  const escaped = escapeRegExp(id)
  const match = html.match(new RegExp(`id=["']${escaped}["'][^>]*value=["']([^"']*)`, 'i'))
  return cleanHtmlText(match?.[1] ?? '')
}

function selectedValue(html: string, name: string) {
  const escaped = escapeRegExp(name)
  const select = html.match(new RegExp(`<select[^>]+name=["']${escaped}["'][\\s\\S]*?<\\/select>`, 'i'))?.[0] ?? ''
  const selected = select.match(/<option[^>]+value=["']?([^"' >]*)[^>]*selected/i)
  return cleanHtmlText(selected?.[1] ?? '')
}

function cleanHtmlText(value: string) {
  return htmlDecode(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function htmlDecode(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z]?c/gi, '')
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, '')
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function localTodayIso(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = new Map(parts.map((part) => [part.type, part.value]))
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`
}

function normalizeInputDate(value?: string) {
  if (!value) return null
  const trimmed = value.trim()
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return trimmed
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  throw new HttpError(`Data invalida: ${value}. Use YYYY-MM-DD ou DD/MM/YYYY.`, 400)
}

function addDaysIso(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function toOmsysDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function splitSetCookieHeader(value: string | null) {
  if (!value) return []
  return value.split(/,(?=\s*[^;,]+=)/g).map((item) => item.trim()).filter(Boolean)
}

function assertDailyImportSecret(request: Request) {
  const configuredSecret = requiredEnv('OMSYS_DAILY_IMPORT_SECRET')
  const providedSecret = request.headers.get('x-omsys-import-secret')?.trim()
  if (!providedSecret || !safeEqual(configuredSecret, providedSecret)) {
    throw new HttpError('Chave de automacao invalida.', 401)
  }
}

function requiredEnv(name: string, fallback?: string) {
  const value = Deno.env.get(name) || fallback
  if (!value) throw new HttpError(`Variavel de ambiente ausente: ${name}.`, 500)
  return value
}

function numberEnv(name: string, fallback: number) {
  const raw = Deno.env.get(name)
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return diff === 0
}

function normalizeError(error: unknown) {
  if (error instanceof HttpError) {
    return { ok: false, error: error.message, details: error.details }
  }
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
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
