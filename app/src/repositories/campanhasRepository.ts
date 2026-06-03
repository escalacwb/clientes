import { getSupabase } from '../lib/supabase'
import { listClientesPage } from './clientesRepository'
import { syncPipelineFromCampanha } from './pipelineRepository'
import { pauseActiveSequencesForClient } from './sequenciasRepository'
import type { CampanhaEnvio, CampanhaEnvioStatus, CarteiraFiltro, Cliente, LeadQualificacaoStatus } from '../types'

export type CampanhaSegmentoId = 'inativos-90' | 'rodobens-pendentes' | 'sem-contato-60' | 'sem-whatsapp' | 'selecionados'

export type CampanhaSegmento = {
  id: CampanhaSegmentoId
  nome: string
  descricao: string
  campanhaNome: string
  campanhaId: string
  filtro?: CarteiraFiltro
  template: string
}

export type CampanhaPublicoFiltros = {
  cidade?: string
  uf?: string
  vendedorId?: string
  vendedorHistoricoNome?: string
  produtoTerm?: string
  medidaTerm?: string
  placaTerm?: string
  kmMin?: number
  kmMax?: number
  origemBase?: Cliente['origemBase'] | 'todos'
  leadQualificacaoStatus?: LeadQualificacaoStatus | 'todos'
  diasSemCompraMin?: number
  diasSemContatoMin?: number
  valorMin?: number
  somenteComWhatsapp?: boolean
}

export type CampanhaFiltroUsado = {
  segmentoId: CampanhaSegmentoId
  filtros?: CampanhaPublicoFiltros
  query?: string
  clienteIds?: string[]
  origemLista?: string
  imagemPadrao?: CampanhaImagemPadrao
  janelaMinimaDias?: number
}

export type CampanhaImagemPadrao = {
  nome: string
  dataUrl: string
  mimeType: string
}

export type CampanhaSalva = {
  id: string
  nome: string
  descricao?: string
  objetivo?: string
  custoEstimado: number
  metaReceita: number
  mensagemModelo: string
  filtroUsado: CampanhaFiltroUsado
  criadaEm: string
}

export type CampanhaResumo = {
  campanhaId: string
  nome: string
  objetivo?: string
  criadaEm: string
  total: number
  pendentes: number
  enviados: number
  responderam: number
  semResposta: number
  viraramOrcamento: number
  viraramVenda: number
  perdidos: number
  naoContatar: number
  receitaAtribuida: number
  custoEstimado: number
  metaReceita: number
  roiPercent: number
}

export type CampanhaVendedorResumo = {
  vendedorId?: string
  vendedorNome: string
  campanhas: number
  total: number
  pendentes: number
  enviados: number
  responderam: number
  semResposta: number
  viraramOrcamento: number
  viraramVenda: number
  perdidos: number
  naoContatar: number
  tarefasAbertas: number
  receitaAtribuida: number
  custoEstimado: number
  roiPercent: number
}

export type CampanhaInboxItem = CampanhaEnvio & {
  clienteNome: string
  clienteCidade?: string
  clienteUf?: string
}

export type CampanhaElegibilidade = {
  clienteId: string
  elegivel: boolean
  motivoBloqueio: string
  ultimoAcionamento?: string
  proximoEnvioEm?: string
  optOutMotivo?: string
}

type CampanhaEnvioRow = {
  id: string
  campanha_id: string
  cliente_id: string
  vendedor_id: string | null
  telefone: string | null
  mensagem_final: string
  status: CampanhaEnvioStatus
  data_abertura_whatsapp: string | null
  data_marcado_enviado: string | null
  resposta_cliente: string | null
  virou_orcamento: boolean
  virou_venda: boolean
  orcamento_id: string | null
  receita_atribuida: number | null
  campanhas?: { nome: string | null } | null
  clientes?: {
    nome: string | null
    cidade: string | null
    uf: string | null
  } | null
}

type CampanhaRow = {
  id: string
  nome: string
  descricao: string | null
  objetivo: string | null
  custo_estimado: number | null
  meta_receita: number | null
  mensagem_modelo: string
  filtro_usado: CampanhaFiltroUsado | null
  criada_em: string
  campanha_envios?: Array<{
    status: CampanhaEnvioStatus | string | null
    virou_orcamento: boolean | null
    virou_venda: boolean | null
    receita_atribuida: number | null
  }>
}

type CampanhaResumoRow = {
  campanha_id: string
  nome: string
  objetivo: string | null
  criada_em: string
  total: number
  pendentes: number
  enviados: number
  responderam: number
  sem_resposta: number
  viraram_orcamento: number
  viraram_venda: number
  perdidos: number
  nao_contatar: number
  receita_atribuida: number
  custo_estimado: number
  meta_receita: number
  roi_percent: number
}

type CampanhaVendedorResumoRow = {
  vendedor_id: string | null
  vendedor_nome: string | null
  campanhas: number
  total: number
  pendentes: number
  enviados: number
  responderam: number
  sem_resposta: number
  viraram_orcamento: number
  viraram_venda: number
  perdidos: number
  nao_contatar: number
  tarefas_abertas: number
  receita_atribuida: number
  custo_estimado: number
  roi_percent: number
}

type CampanhaElegibilidadeRow = {
  cliente_id: string
  elegivel: boolean
  motivo_bloqueio: string
  ultimo_acionamento: string | null
  proximo_envio_em: string | null
  opt_out_motivo: string | null
}

export const campanhaSegmentos: CampanhaSegmento[] = [
  {
    id: 'inativos-90',
    nome: 'Reativacao 90 dias',
    descricao: 'Clientes sem compra recente para cotacao ativa de pneus e servicos.',
    campanhaNome: 'Clientes sem compra ha 90 dias',
    campanhaId: 'campanha-inativos-90',
    filtro: 'sem-compra-90',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Vi que faz um tempo desde sua ultima compra e estou passando para ver se precisa cotar pneus ou algum servico.',
  },
  {
    id: 'rodobens-pendentes',
    nome: 'Clientes sem cadastro',
    descricao: 'Leads de listas externas para qualificacao antes de entrar na carteira Capital.',
    campanhaNome: 'Clientes sem cadastro - primeiro contato',
    campanhaId: 'campanha-rodobens-primeiro-contato',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Estou entrando em contato para entender sua frota e ver como podemos ajudar com pneus e servicos.',
  },
  {
    id: 'sem-contato-60',
    nome: 'Sem contato 60 dias',
    descricao: 'Clientes sem interacao recente para recuperar relacionamento comercial.',
    campanhaNome: 'Clientes sem contato ha 60 dias',
    campanhaId: 'campanha-sem-contato-60',
    filtro: 'sem-contato-60',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Faz um tempo que nao falamos e queria saber se precisa de algum apoio com pneus ou servicos.',
  },
  {
    id: 'sem-whatsapp',
    nome: 'Higiene de cadastro',
    descricao: 'Clientes sem WhatsApp cadastrado para correcao antes de novas campanhas.',
    campanhaNome: 'Clientes sem WhatsApp',
    campanhaId: 'campanha-sem-whatsapp',
    filtro: 'sem-whatsapp',
    template:
      'Atualizar cadastro de {primeiro_nome}: cliente sem WhatsApp principal no CRM.',
  },
  {
    id: 'selecionados',
    nome: 'Selecao manual',
    descricao: 'Lista salva a partir de oportunidades, clientes sem cadastro ou selecao operacional.',
    campanhaNome: 'Campanha por selecao manual',
    campanhaId: 'campanha-selecao-manual',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Separei seu cadastro para uma acao comercial e queria entender como podemos ajudar com pneus ou servicos.',
  },
]

export async function listCampanhaSegmento(input: {
  segmentoId: CampanhaSegmentoId
  page: number
  pageSize: number
  query?: string
  filtros?: CampanhaPublicoFiltros
  campanhaId?: string
  campanhaNome?: string
  clienteIds?: string[]
}): Promise<{ clientes: Cliente[]; total: number; statuses: Record<string, CampanhaEnvioStatus>; elegibilidade: Record<string, CampanhaElegibilidade> }> {
  const segmento = campanhaSegmentos.find((item) => item.id === input.segmentoId) ?? campanhaSegmentos[0]
  const savedClienteIds = input.clienteIds?.length ? input.clienteIds : undefined
  const clienteIds = await resolveCampaignClienteIds(input.filtros, savedClienteIds)
  const commonFilters = {
    cidade: input.filtros?.cidade,
    uf: input.filtros?.uf,
    vendedorId: input.filtros?.vendedorId,
    vendedorHistoricoNome: input.filtros?.vendedorHistoricoNome,
    leadQualificacaoStatus: input.filtros?.leadQualificacaoStatus,
    diasSemCompraMin: input.filtros?.diasSemCompraMin,
    diasSemContatoMin: input.filtros?.diasSemContatoMin,
    valorMin: input.filtros?.valorMin,
    somenteComWhatsapp: input.filtros?.somenteComWhatsapp,
    clienteIds,
  }
  const result =
    segmento.id === 'selecionados'
      ? await listClientesCampaignPage({
          page: input.page,
          pageSize: input.pageSize,
          query: input.query,
          origemBase: input.filtros?.origemBase,
          ...commonFilters,
        })
      : segmento.id === 'rodobens-pendentes'
      ? await listClientesCampaignPage({
          page: input.page,
          pageSize: input.pageSize,
          query: input.query,
          origemBase: input.filtros?.origemBase && input.filtros.origemBase !== 'todos' ? input.filtros.origemBase : 'rodobens',
          ...commonFilters,
        })
      : await listClientesCampaignPage({
          page: input.page,
          pageSize: input.pageSize,
          query: input.query,
          filtro: segmento.filtro,
          origemBase: input.filtros?.origemBase,
          ...commonFilters,
        })

  const resultClienteIds = result.clientes.map((cliente) => cliente.id)
  const [statuses, elegibilidade] = await Promise.all([
    input.campanhaId
      ? listCampanhaStatusesById(input.campanhaId, resultClienteIds)
      : listCampanhaStatuses(input.campanhaNome ?? segmento.campanhaNome, resultClienteIds),
    listCampanhaElegibilidade(resultClienteIds),
  ])

  return { ...result, statuses, elegibilidade }
}

async function listClientesCampaignPage(input: Parameters<typeof listClientesPage>[0]) {
  if (!input.clienteIds || input.clienteIds.length <= 80) return listClientesPage(input)

  const chunks = chunkArray(input.clienteIds, 80)
  const pages = await Promise.all(
    chunks.map((clienteIds) =>
      listClientesPage({
        ...input,
        page: 1,
        pageSize: 1000,
        clienteIds,
      }),
    ),
  )
  const uniqueClientes = new Map<string, Cliente>()
  pages.forEach((page) => {
    page.clientes.forEach((cliente) => uniqueClientes.set(cliente.id, cliente))
  })
  const clientes = Array.from(uniqueClientes.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const from = (input.page - 1) * input.pageSize
  return {
    clientes: clientes.slice(from, from + input.pageSize),
    total: clientes.length,
  }
}

export async function listCampanhasSalvas(): Promise<CampanhaSalva[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campanhas')
    .select('id,nome,descricao,objetivo,custo_estimado,meta_receita,mensagem_modelo,filtro_usado,criada_em')
    .order('criada_em', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? [])
    .map(mapCampanha)
    .filter((campanha) => Boolean(campanha.filtroUsado.segmentoId))
}

export async function createCampanhaSalva(input: {
  nome: string
  descricao?: string
  objetivo?: string
  custoEstimado?: number
  metaReceita?: number
  mensagemModelo: string
  filtroUsado: CampanhaFiltroUsado
  criadaPor?: string
}): Promise<CampanhaSalva> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `campanha-${Date.now()}`,
      nome: input.nome,
      descricao: input.descricao,
      objetivo: input.objetivo,
      custoEstimado: input.custoEstimado ?? 0,
      metaReceita: input.metaReceita ?? 0,
      mensagemModelo: input.mensagemModelo,
      filtroUsado: input.filtroUsado,
      criadaEm: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('campanhas')
    .insert({
      nome: input.nome,
      descricao: input.descricao ?? 'Campanha salva pelo app web',
      objetivo: input.objetivo ?? null,
      custo_estimado: input.custoEstimado ?? 0,
      meta_receita: input.metaReceita ?? 0,
      mensagem_modelo: input.mensagemModelo,
      filtro_usado: input.filtroUsado,
      criada_por: input.criadaPor ?? null,
    })
    .select('id,nome,descricao,objetivo,custo_estimado,meta_receita,mensagem_modelo,filtro_usado,criada_em')
    .single()

  if (error) throw error
  return mapCampanha(data as CampanhaRow)
}

export async function updateCampanhaSalva(
  campanhaId: string,
  input: {
    nome: string
    descricao?: string
    objetivo?: string
    custoEstimado?: number
    metaReceita?: number
    mensagemModelo: string
    filtroUsado: CampanhaFiltroUsado
  },
): Promise<CampanhaSalva> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: campanhaId,
      nome: input.nome,
      descricao: input.descricao,
      objetivo: input.objetivo,
      custoEstimado: input.custoEstimado ?? 0,
      metaReceita: input.metaReceita ?? 0,
      mensagemModelo: input.mensagemModelo,
      filtroUsado: input.filtroUsado,
      criadaEm: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('campanhas')
    .update({
      nome: input.nome,
      descricao: input.descricao ?? 'Campanha salva pelo app web',
      objetivo: input.objetivo ?? null,
      custo_estimado: input.custoEstimado ?? 0,
      meta_receita: input.metaReceita ?? 0,
      mensagem_modelo: input.mensagemModelo,
      filtro_usado: input.filtroUsado,
    })
    .eq('id', campanhaId)
    .select('id,nome,descricao,objetivo,custo_estimado,meta_receita,mensagem_modelo,filtro_usado,criada_em')
    .single()

  if (error) throw error
  return mapCampanha(data as CampanhaRow)
}

export async function deleteCampanha(campanhaId: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const steps = [
    supabase.from('campanha_envios').delete().eq('campanha_id', campanhaId),
    supabase.from('oportunidades').delete().eq('campanha_id', campanhaId),
    supabase.from('tarefas').delete().ilike('origem', `campanha:${campanhaId}%`),
    supabase.from('campanhas').delete().eq('id', campanhaId),
  ]

  for (const step of steps) {
    const { error } = await step
    if (error) throw error
  }
}

export async function createCampanhaFromClienteIds(input: {
  nome: string
  descricao?: string
  objetivo?: string
  mensagemModelo: string
  clienteIds: string[]
  origemLista: string
  criadaPor?: string
}): Promise<{ campanha: CampanhaSalva; enviosCriados: number }> {
  const uniqueClienteIds = [...new Set(input.clienteIds)].filter(Boolean)
  const campanha = await createCampanhaSalva({
    nome: input.nome,
    descricao: input.descricao,
    objetivo: input.objetivo,
    mensagemModelo: input.mensagemModelo,
    filtroUsado: {
      segmentoId: 'selecionados',
      clienteIds: uniqueClienteIds,
      origemLista: input.origemLista,
    },
    criadaPor: input.criadaPor,
  })

  const clientes = await listClientesPage({
    page: 1,
    pageSize: Math.max(uniqueClienteIds.length, 1),
    clienteIds: uniqueClienteIds,
  })

  let enviosCriados = 0
  for (const cliente of clientes.clientes) {
    const mensagemFinal = applyCampaignTemplate(input.mensagemModelo, cliente)
    await upsertCampanhaEnvio({
      campanhaId: campanha.id,
      campanhaNome: campanha.nome,
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId,
      telefone: cliente.whatsapp,
      mensagemFinal,
      status: 'pendente',
    })
    enviosCriados += 1
  }

  return { campanha, enviosCriados }
}

export async function listCampanhasResumo(): Promise<CampanhaResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_campanhas_resumo')
    .select('*')
    .order('criada_em', { ascending: false })
    .limit(50)

  if (error) return listCampanhasResumoFallback()
  return (data ?? []).map((row) => mapCampanhaResumoView(row as CampanhaResumoRow))
}

export async function listCampanhasVendedorResumo(): Promise<CampanhaVendedorResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_campanhas_vendedor_resumo')
    .select('*')
    .order('receita_atribuida', { ascending: false })

  if (error) return []
  return (data ?? []).map((row) => mapCampanhaVendedorResumo(row as CampanhaVendedorResumoRow))
}

export async function listClienteCampanhaEnvios(clienteId: string, limit = 50): Promise<CampanhaEnvio[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campanha_envios')
    .select('*, campanhas(nome)')
    .eq('cliente_id', clienteId)
    .order('data_marcado_enviado', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapEnvio(row as CampanhaEnvioRow))
}

export async function listCampanhaInbox(input: {
  statuses?: CampanhaEnvioStatus[]
  vendedorId?: string
  limit?: number
} = {}): Promise<CampanhaInboxItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  let query = supabase
    .from('campanha_envios')
    .select('*, campanhas(nome), clientes(nome,cidade,uf)')
    .order('data_marcado_enviado', { ascending: true, nullsFirst: false })
    .limit(input.limit ?? 20)

  if (input.statuses?.length) query = query.in('status', input.statuses)
  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => mapInboxItem(row as CampanhaEnvioRow))
}

export async function listCampanhaElegibilidade(clienteIds: string[]): Promise<Record<string, CampanhaElegibilidade>> {
  if (clienteIds.length === 0) return {}
  const supabase = await getSupabase()
  if (!supabase) return {}

  const { data, error } = await supabase
    .from('vw_clientes_campanha_elegibilidade')
    .select('cliente_id,elegivel,motivo_bloqueio,ultimo_acionamento,proximo_envio_em,opt_out_motivo')
    .in('cliente_id', clienteIds)

  if (error) return {}

  return (data ?? []).reduce<Record<string, CampanhaElegibilidade>>((acc, row) => {
    const item = row as CampanhaElegibilidadeRow
    acc[item.cliente_id] = {
      clienteId: item.cliente_id,
      elegivel: item.elegivel,
      motivoBloqueio: item.motivo_bloqueio,
      ultimoAcionamento: item.ultimo_acionamento ?? undefined,
      proximoEnvioEm: item.proximo_envio_em ?? undefined,
      optOutMotivo: item.opt_out_motivo ?? undefined,
    }
    return acc
  }, {})
}

async function listCampanhasResumoFallback(): Promise<CampanhaResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campanhas')
    .select('id,nome,criada_em,filtro_usado,objetivo,custo_estimado,meta_receita,campanha_envios(status,virou_orcamento,virou_venda,receita_atribuida)')
    .order('criada_em', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? [])
    .map((row) => row as CampanhaRow)
    .filter((campanha) => Boolean(campanha.filtro_usado?.segmentoId))
    .map(mapCampanhaResumo)
}

async function findClientesByProdutoOuServico(term: string): Promise<string[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  const terms = term
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)

  const clienteIds = new Set<string>()
  for (const item of terms) {
    const searchTerms = expandProductSearchTerm(item)
    for (const searchTerm of searchTerms) {
      const pattern = `%${searchTerm}%`
      const searchServices = shouldSearchServicesForCampaignTerm(searchTerm)
      const [vendasIds, servicosIds] = await Promise.all([
        collectCampaignClienteIds((from, to) =>
          supabase
            .from('vendas_itens')
            .select('cliente_id')
            .or(`produto_nome.ilike.${pattern},produto_codigo.ilike.${pattern},marca.ilike.${pattern},modelo.ilike.${pattern},medida.ilike.${pattern}`)
            .range(from, to),
        ),
        searchServices
          ? collectCampaignClienteIds((from, to) =>
              supabase
                .from('servicos_itens')
                .select('cliente_id')
                .or(`servico_nome.ilike.${pattern},servico_codigo.ilike.${pattern},observacao.ilike.${pattern},placa.ilike.${pattern}`)
                .range(from, to),
            )
          : Promise.resolve([]),
      ])

      vendasIds.forEach((id) => clienteIds.add(id))
      servicosIds.forEach((id) => clienteIds.add(id))
    }
  }

  return Array.from(clienteIds)
}

async function collectCampaignClienteIds(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: Array<{ cliente_id?: string | null }> | null; error: unknown }>,
) {
  const ids = new Set<string>()
  const pageSize = 1000

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) throw error
    for (const row of data ?? []) {
      if (row.cliente_id) ids.add(row.cliente_id)
    }
    if (!data || data.length < pageSize) break
  }

  return Array.from(ids)
}

function shouldSearchServicesForCampaignTerm(term: string) {
  const normalized = removeAccentsLocal(term).toLowerCase()
  if (/\d/.test(normalized)) return false
  return !['michelin', 'multi', 'multiway', 'x multi', 'xze', 'bfg', 'bfgoodrich', 'bf goodrich', 'samson'].includes(normalized)
}

function expandProductSearchTerm(term: string) {
  const normalized = removeAccentsLocal(term).toLowerCase()
  const terms = new Set([term])

  if (normalized.includes('michelin')) {
    ;['MULTI', 'MULTIWAY', 'X MULTI', 'XZE'].forEach((item) => terms.add(item))
  }
  if (normalized.includes('bf') || normalized.includes('bfg') || normalized.includes('goodrich')) {
    ;['BFG', 'BFGOODRICH', 'BF GOODRICH'].forEach((item) => terms.add(item))
  }
  if (normalized.includes('samson')) {
    terms.add('SAMSON')
  }

  return Array.from(terms)
}

function removeAccentsLocal(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function resolveCampaignClienteIds(filtros?: CampanhaPublicoFiltros, baseClienteIds?: string[]): Promise<string[] | undefined> {
  const sets: Set<string>[] = []
  if (baseClienteIds) sets.push(new Set(baseClienteIds))

  if (filtros?.produtoTerm?.trim()) sets.push(new Set(await findClientesByProdutoOuServico(filtros.produtoTerm)))
  if (filtros?.medidaTerm?.trim()) sets.push(new Set(await findClientesByProdutoOuServico(filtros.medidaTerm)))
  if (filtros && hasVehicleFilter(filtros)) sets.push(new Set(await findClientesByVeiculoOuKm(filtros)))

  if (sets.length === 0) return undefined
  if (sets.some((set) => set.size === 0)) return []
  return Array.from(sets[0]).filter((id) => sets.every((set) => set.has(id)))
}

function hasVehicleFilter(filtros?: CampanhaPublicoFiltros) {
  return Boolean(filtros?.placaTerm?.trim() || filtros?.kmMin || filtros?.kmMax)
}

async function findClientesByVeiculoOuKm(filtros: CampanhaPublicoFiltros): Promise<string[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const clienteIds = new Set<string>()
  const placaTerm = filtros.placaTerm?.trim()
  const placaPattern = placaTerm ? `%${placaTerm}%` : undefined

  const addRows = (rows: Array<{ cliente_id?: string | null }>) => {
    for (const row of rows) {
      if (row.cliente_id) clienteIds.add(row.cliente_id)
    }
  }

  let servicos = supabase.from('servicos_itens').select('cliente_id').limit(5000)
  if (placaPattern) servicos = servicos.or(`placa.ilike.${placaPattern},veiculo_observacao.ilike.${placaPattern}`)
  if (filtros.kmMin) servicos = servicos.gte('km_extraido', filtros.kmMin)
  if (filtros.kmMax) servicos = servicos.lte('km_extraido', filtros.kmMax)

  let vendas = supabase.from('vendas_itens').select('cliente_id').limit(5000)
  if (placaPattern) vendas = vendas.ilike('veiculo_observacao', placaPattern)
  if (filtros.kmMin) vendas = vendas.gte('km_extraido', filtros.kmMin)
  if (filtros.kmMax) vendas = vendas.lte('km_extraido', filtros.kmMax)

  let veiculos = supabase.from('veiculos').select('cliente_id').limit(5000)
  if (placaPattern) veiculos = veiculos.or(`placa.ilike.${placaPattern},descricao.ilike.${placaPattern},chassi.ilike.${placaPattern}`)
  if (filtros.kmMin) veiculos = veiculos.gte('ultimo_km', filtros.kmMin)
  if (filtros.kmMax) veiculos = veiculos.lte('ultimo_km', filtros.kmMax)

  const [servicosResult, vendasResult, veiculosResult] = await Promise.all([servicos, vendas, veiculos])
  if (servicosResult.error) throw servicosResult.error
  if (vendasResult.error) throw vendasResult.error
  if (veiculosResult.error) throw veiculosResult.error

  addRows((servicosResult.data ?? []) as Array<{ cliente_id?: string | null }>)
  addRows((vendasResult.data ?? []) as Array<{ cliente_id?: string | null }>)
  addRows((veiculosResult.data ?? []) as Array<{ cliente_id?: string | null }>)

  return Array.from(clienteIds)
}

export async function listCampanhaStatuses(campanhaNome: string, clienteIds: string[]): Promise<Record<string, CampanhaEnvioStatus>> {
  if (clienteIds.length === 0) return {}
  const supabase = await getSupabase()
  if (!supabase) return {}

  const { data: campanha, error: campanhaError } = await supabase
    .from('campanhas')
    .select('id')
    .eq('nome', campanhaNome)
    .limit(1)
    .maybeSingle()

  if (campanhaError) throw campanhaError
  if (!campanha?.id) return {}

  return listCampanhaStatusesById(campanha.id as string, clienteIds)
}

export async function listCampanhaStatusesById(campanhaId: string, clienteIds: string[]): Promise<Record<string, CampanhaEnvioStatus>> {
  if (clienteIds.length === 0) return {}
  const supabase = await getSupabase()
  if (!supabase) return {}

  const { data, error } = await supabase
    .from('campanha_envios')
    .select('cliente_id,status')
    .eq('campanha_id', campanhaId)
    .in('cliente_id', clienteIds)

  if (error) throw error

  return (data ?? []).reduce<Record<string, CampanhaEnvioStatus>>((acc, row) => {
    acc[row.cliente_id as string] = row.status as CampanhaEnvioStatus
    return acc
  }, {})
}

export async function upsertCampanhaEnvio(input: {
  campanhaId: string
  campanhaNome?: string
  clienteId: string
  vendedorId?: string
  criadaPor?: string
  telefone?: string
  mensagemFinal: string
  status: CampanhaEnvioStatus
  orcamentoId?: string
  receitaAtribuida?: number
}): Promise<CampanhaEnvio> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `envio-${input.campanhaId}-${input.clienteId}`,
      campanhaId: input.campanhaId,
      clienteId: input.clienteId,
      vendedorId: input.vendedorId,
      telefone: input.telefone,
      mensagemFinal: input.mensagemFinal,
      status: input.status,
      dataAberturaWhatsapp: input.status === 'pendente' ? new Date().toISOString() : undefined,
      dataMarcadoEnviado: input.status !== 'pendente' ? new Date().toISOString() : undefined,
      virouOrcamento: input.status === 'virou_orcamento' || input.status === 'ganhou',
      virouVenda: input.status === 'ganhou',
      orcamentoId: input.orcamentoId,
      receitaAtribuida: input.receitaAtribuida,
    }
  }

  const campanhaId = await ensureCampanha(supabase, input.campanhaId, input.campanhaNome ?? input.campanhaId, input.mensagemFinal, input.criadaPor)

  const { data, error } = await supabase
    .from('campanha_envios')
    .upsert(
      {
        campanha_id: campanhaId,
        cliente_id: input.clienteId,
        vendedor_id: input.vendedorId ?? null,
        telefone: input.telefone ?? null,
        mensagem_final: input.mensagemFinal,
        status: input.status,
        data_abertura_whatsapp: input.status === 'pendente' ? new Date().toISOString() : undefined,
        data_marcado_enviado: input.status !== 'pendente' ? new Date().toISOString() : undefined,
        virou_orcamento: input.status === 'virou_orcamento' || input.status === 'ganhou',
        virou_venda: input.status === 'ganhou',
        orcamento_id: input.orcamentoId ?? undefined,
        receita_atribuida: input.receitaAtribuida ?? undefined,
      },
      { onConflict: 'campanha_id,cliente_id' },
    )
    .select('*')
    .single()

  if (error) throw error

  const envio = mapEnvio(data as CampanhaEnvioRow)
  await syncPipelineFromCampanha({
    campanhaId,
    campanhaNome: input.campanhaNome,
    clienteId: input.clienteId,
    vendedorId: input.vendedorId,
    status: input.status,
    orcamentoId: input.orcamentoId,
    receitaAtribuida: input.receitaAtribuida,
  })
  if (['respondeu', 'virou_orcamento', 'ganhou', 'perdido', 'nao_contatar'].includes(input.status)) {
    await pauseActiveSequencesForClient(input.clienteId, `Campanha marcada como ${input.status}.`)
  }
  return envio
}

export async function attributeCampanhaRevenueByOrcamento(orcamentoId: string, receita: number): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('campanha_envios')
    .update({
      status: 'ganhou',
      virou_orcamento: true,
      virou_venda: true,
      receita_atribuida: receita,
      data_marcado_enviado: new Date().toISOString(),
    })
    .eq('orcamento_id', orcamentoId)

  if (error) throw error

  const { data: envios } = await supabase
    .from('campanha_envios')
    .select('campanha_id,cliente_id,vendedor_id,status,orcamento_id,receita_atribuida,campanhas(nome)')
    .eq('orcamento_id', orcamentoId)

  for (const envio of envios ?? []) {
    const row = envio as unknown as {
      campanha_id: string
      cliente_id: string
      vendedor_id: string | null
      status: CampanhaEnvioStatus
      orcamento_id: string | null
      receita_atribuida: number | null
      campanhas?: { nome: string | null } | Array<{ nome: string | null }> | null
    }
    const campanhaNome = Array.isArray(row.campanhas) ? row.campanhas[0]?.nome : row.campanhas?.nome
    await syncPipelineFromCampanha({
      campanhaId: row.campanha_id,
      campanhaNome: campanhaNome ?? undefined,
      clienteId: row.cliente_id,
      vendedorId: row.vendedor_id ?? undefined,
      status: row.status,
      orcamentoId: row.orcamento_id ?? undefined,
      receitaAtribuida: row.receita_atribuida ?? undefined,
    })
  }
}

async function ensureCampanha(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabase>>>,
  externalId: string,
  nome: string,
  mensagemModelo: string,
  criadaPor?: string,
) {
  if (isUuid(externalId)) return externalId

  const { data: existing, error: selectError } = await supabase
    .from('campanhas')
    .select('id')
    .eq('nome', nome)
    .limit(1)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing?.id) return existing.id as string

  const { data, error } = await supabase
    .from('campanhas')
    .insert({
      nome,
      descricao: 'Campanha criada pelo app web',
      mensagem_modelo: mensagemModelo,
      filtro_usado: { origem: externalId },
      criada_por: criadaPor ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function mapEnvio(row: CampanhaEnvioRow): CampanhaEnvio {
  return {
    id: row.id,
    campanhaId: row.campanha_id,
    campanhaNome: row.campanhas?.nome ?? undefined,
    clienteId: row.cliente_id,
    vendedorId: row.vendedor_id ?? undefined,
    telefone: row.telefone ?? undefined,
    mensagemFinal: row.mensagem_final,
    status: row.status,
    dataAberturaWhatsapp: row.data_abertura_whatsapp ?? undefined,
    dataMarcadoEnviado: row.data_marcado_enviado ?? undefined,
    respostaCliente: row.resposta_cliente ?? undefined,
    virouOrcamento: row.virou_orcamento,
    virouVenda: row.virou_venda,
    orcamentoId: row.orcamento_id ?? undefined,
    receitaAtribuida: row.receita_atribuida ?? undefined,
  }
}

function mapInboxItem(row: CampanhaEnvioRow): CampanhaInboxItem {
  return {
    ...mapEnvio(row),
    clienteNome: row.clientes?.nome ?? 'Cliente',
    clienteCidade: row.clientes?.cidade ?? undefined,
    clienteUf: row.clientes?.uf ?? undefined,
  }
}

function mapCampanha(row: CampanhaRow): CampanhaSalva {
  const filtroUsado = row.filtro_usado?.segmentoId ? row.filtro_usado : { segmentoId: 'inativos-90' as const }
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    objetivo: row.objetivo ?? undefined,
    custoEstimado: Number(row.custo_estimado ?? 0),
    metaReceita: Number(row.meta_receita ?? 0),
    mensagemModelo: row.mensagem_modelo,
    filtroUsado,
    criadaEm: row.criada_em,
  }
}

function mapCampanhaResumo(row: CampanhaRow): CampanhaResumo {
  const envios = row.campanha_envios ?? []
  const receita = envios.reduce((total, envio) => total + Number(envio.receita_atribuida ?? 0), 0)
  const custo = Number(row.custo_estimado ?? 0)
  return {
    campanhaId: row.id,
    nome: row.nome,
    objetivo: row.objetivo ?? undefined,
    criadaEm: row.criada_em,
    total: envios.length,
    pendentes: envios.filter((envio) => envio.status === 'pendente').length,
    enviados: envios.filter((envio) => envio.status === 'enviado').length,
    responderam: envios.filter((envio) => envio.status === 'respondeu').length,
    semResposta: envios.filter((envio) => envio.status === 'nao_respondeu').length,
    viraramOrcamento: envios.filter((envio) => envio.status === 'virou_orcamento' || envio.virou_orcamento).length,
    viraramVenda: envios.filter((envio) => envio.virou_venda).length,
    perdidos: envios.filter((envio) => envio.status === 'perdido').length,
    naoContatar: envios.filter((envio) => envio.status === 'nao_contatar').length,
    receitaAtribuida: receita,
    custoEstimado: custo,
    metaReceita: Number(row.meta_receita ?? 0),
    roiPercent: calculateRoiPercent(receita, custo),
  }
}

function mapCampanhaResumoView(row: CampanhaResumoRow): CampanhaResumo {
  return {
    campanhaId: row.campanha_id,
    nome: row.nome,
    objetivo: row.objetivo ?? undefined,
    criadaEm: row.criada_em,
    total: Number(row.total ?? 0),
    pendentes: Number(row.pendentes ?? 0),
    enviados: Number(row.enviados ?? 0),
    responderam: Number(row.responderam ?? 0),
    semResposta: Number(row.sem_resposta ?? 0),
    viraramOrcamento: Number(row.viraram_orcamento ?? 0),
    viraramVenda: Number(row.viraram_venda ?? 0),
    perdidos: Number(row.perdidos ?? 0),
    naoContatar: Number(row.nao_contatar ?? 0),
    receitaAtribuida: Number(row.receita_atribuida ?? 0),
    custoEstimado: Number(row.custo_estimado ?? 0),
    metaReceita: Number(row.meta_receita ?? 0),
    roiPercent: Number(row.roi_percent ?? 0),
  }
}

function mapCampanhaVendedorResumo(row: CampanhaVendedorResumoRow): CampanhaVendedorResumo {
  return {
    vendedorId: row.vendedor_id ?? undefined,
    vendedorNome: row.vendedor_nome ?? 'Sem vendedor',
    campanhas: Number(row.campanhas ?? 0),
    total: Number(row.total ?? 0),
    pendentes: Number(row.pendentes ?? 0),
    enviados: Number(row.enviados ?? 0),
    responderam: Number(row.responderam ?? 0),
    semResposta: Number(row.sem_resposta ?? 0),
    viraramOrcamento: Number(row.viraram_orcamento ?? 0),
    viraramVenda: Number(row.viraram_venda ?? 0),
    perdidos: Number(row.perdidos ?? 0),
    naoContatar: Number(row.nao_contatar ?? 0),
    tarefasAbertas: Number(row.tarefas_abertas ?? 0),
    receitaAtribuida: Number(row.receita_atribuida ?? 0),
    custoEstimado: Number(row.custo_estimado ?? 0),
    roiPercent: Number(row.roi_percent ?? 0),
  }
}

function calculateRoiPercent(receita: number, custo: number) {
  if (!custo) return 0
  return Math.round(((receita - custo) / custo) * 100)
}

function applyCampaignTemplate(template: string, cliente: Cliente) {
  const primeiroNome = (cliente.responsavel || cliente.nome).split(' ')[0]
  return template
    .replaceAll('{primeiro_nome}', primeiroNome)
    .replaceAll('{nome_vendedor}', cliente.vendedorNome || 'Capital Truck Center')
}
