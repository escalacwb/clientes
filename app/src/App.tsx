import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileUp,
  Filter,
  Gauge,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { lazy, type FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import capitalLogo from './assets/capital-truck-center-logo.svg'
import {
  clientes as seedClientes,
  alteracoes as seedAlteracoes,
  conflitos as seedConflitos,
  importacoes as seedImportacoes,
  interacoes as seedInteracoes,
  mesclagens as seedMesclagens,
  orcamentos as seedOrcamentos,
  possiveisDuplicados as seedPossiveisDuplicados,
  servicosItens as seedServicosItens,
  tarefas as seedTarefas,
  vendedores as seedVendedores,
  vendasItens as seedVendasItens,
} from './data/mockData'
import {
  bestNextAction,
  dateLabel,
  daysSince,
  money,
  opportunityReason,
  opportunityScore,
  smartSummary,
} from './lib/crm'
import { previewXmlFiles, type XmlImportPreview } from './lib/xmlImport'
import { previewWorkbookFiles, type WorkbookImportPreview } from './lib/workbookPreview'
import { previewReferenceImportFiles, type ReferenceImportPreview } from './lib/referenceImportPreview'
import { isSupabaseConfigured } from './lib/supabase'
import { buildOportunidades } from './lib/oportunidades'
import { carteiraFiltros, filterClientes } from './lib/filtros'
import { getCurrentSession, signInWithPassword, signOut } from './repositories/authRepository'
import { listClienteAlteracoes } from './repositories/auditoriaRepository'
import {
  campanhaSegmentos,
  createCampanhaFromClienteIds,
  createCampanhaSalva,
  listClienteCampanhaEnvios,
  listCampanhaSegmento,
  listCampanhaInbox,
  listCampanhasResumo,
  listCampanhasSalvas,
  listCampanhasVendedorResumo,
  upsertCampanhaEnvio,
  type CampanhaElegibilidade,
  type CampanhaImagemPadrao,
  type CampanhaPublicoFiltros,
  type CampanhaInboxItem,
  type CampanhaResumo,
  type CampanhaSalva,
  type CampanhaSegmentoId,
  type CampanhaVendedorResumo,
  attributeCampanhaRevenueByOrcamento,
} from './repositories/campanhasRepository'
import {
  listCatalogoItens,
  listCatalogoPage,
  listCatalogoPrecos,
  listCatalogoRegrasDesconto,
  listCatalogoSugestoes,
  type CatalogoAtivoFilter,
  type CatalogoPrecoHistorico,
  type CatalogoSugestao,
  type CatalogoTipoFilter,
} from './repositories/catalogoRepository'
import {
  assignClientesVendedorByFilter,
  listRodobensFunilResumo,
  listVendedoresHistoricosResumo,
  updateRodobensQualificacao,
  type ClientePageFilters,
  type RodobensFunilResumo,
  type VendedorHistoricoResumo,
} from './repositories/clientesRepository'
import { assignClienteVendedor } from './repositories/clientesRepository'
import { assignClientesVendedor } from './repositories/clientesRepository'
import { listClientesPage } from './repositories/clientesRepository'
import { listRodobensLeads } from './repositories/clientesRepository'
import { updateClienteComercial } from './repositories/clientesRepository'
import { listConflitos, resolveConflito } from './repositories/conflitosRepository'
import {
  getDashboardResumo,
  listForecastVendedor,
  listAtividadesDia,
  listFunilGerencial,
  listMotivosPerda,
  listRankingMedidas,
  listRankingServicos,
  listTarefasSlaVendedor,
  listVendedoresResumo,
  type DashboardResumo,
  type ForecastVendedorResumo,
  type AtividadeDiaResumo,
  type FunilGerencialResumo,
  type MotivoPerdaResumo,
  type RankingResumo,
  type TarefaSlaVendedorResumo,
  type VendedorResumo,
} from './repositories/dashboardRepository'
import { listClienteServicosItens, listClienteVeiculos, listClienteVendasItens } from './repositories/historicoRepository'
import { createInteracao } from './repositories/interacoesRepository'
import { listInteracoes } from './repositories/interacoesRepository'
import { createImportacaoPreview } from './repositories/importacoesRepository'
import { finalizeImportacaoDiaria } from './repositories/importacoesRepository'
import { getImportacaoQualidadeResumo } from './repositories/importacoesRepository'
import { importReferenceFiles } from './repositories/importacoesRepository'
import { listImportacaoArquivos, type ImportacaoArquivoResumo, type ImportacaoQualidadeResumo } from './repositories/importacoesRepository'
import { listImportacoes } from './repositories/importacoesRepository'
import { runFollowupAutomations } from './repositories/importacoesRepository'
import { createMesclagem, listMesclagens, listPossiveisDuplicados } from './repositories/mesclagensRepository'
import { createOrcamento } from './repositories/orcamentosRepository'
import { listOrcamentos } from './repositories/orcamentosRepository'
import { listOrcamentosPage, type OrcamentoListFilter } from './repositories/orcamentosRepository'
import { listOrcamentoVersoes } from './repositories/orcamentosRepository'
import { reviseOrcamento } from './repositories/orcamentosRepository'
import { updateOrcamentoStatus } from './repositories/orcamentosRepository'
import { listOportunidadesPage, listOportunidadesResumo, markOportunidadeComTarefa, refreshOportunidadesCache, type OportunidadeFilter, type OportunidadeResumo } from './repositories/oportunidadesRepository'
import {
  completeTarefa,
  createTarefa,
  listClienteTarefas,
  listTarefas,
  listTarefasPage,
  rescheduleTarefa,
  type TarefaOriginFilter,
  type TarefaStatusFilter,
} from './repositories/tarefasRepository'
import { listUsuarios } from './repositories/usuariosRepository'
import type {
  CampanhaEnvioStatus,
  CampanhaEnvio,
  CarteiraFiltro,
  CatalogoItem,
  CatalogoRegraDesconto,
  Cliente,
  ClienteAlteracao,
  ClienteMesclagem,
  ClienteStatus,
  ClienteVeiculoResumo,
  Importacao,
  ImportacaoConflito,
  Interacao,
  InteracaoInput,
  LeadQualificacaoStatus,
  Orcamento,
  OrcamentoCondicaoInput,
  OrcamentoInput,
  OrcamentoItemInput,
  OrcamentoVersao,
  Oportunidade,
  PossivelDuplicado,
  ServicoItem,
  SessaoUsuario,
  Tarefa,
  TarefaInput,
  Vendedor,
  VendaItem,
} from './types'

const SalesChart = lazy(() => import('./components/SalesChart'))

const navSections = [
  {
    title: 'Operacao',
    items: [
      { id: 'cockpit', label: 'Cockpit', icon: Gauge },
      { id: 'clientes', label: 'Clientes', icon: UsersRound },
      { id: 'rodobens', label: 'Clientes sem cadastro', icon: UserCheck },
      { id: 'tarefas', label: 'Tarefas', icon: CalendarClock },
      { id: 'oportunidades', label: 'Oportunidades', icon: AlertTriangle },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { id: 'campanhas', label: 'Campanhas', icon: Send },
      { id: 'orcamentos', label: 'Orcamentos', icon: WalletCards },
      { id: 'catalogo', label: 'Catalogo', icon: ClipboardList },
    ],
  },
  {
    title: 'Gestao',
    items: [
      { id: 'importacoes', label: 'Importacoes', icon: FileUp },
      { id: 'relatorios', label: 'Relatorios', icon: BarChart3 },
      { id: 'vendedores', label: 'Vendedores', icon: UserRound },
      { id: 'usuarios', label: 'Usuarios', icon: ShieldCheck },
      { id: 'auditoria', label: 'Auditoria', icon: CheckCircle2 },
    ],
  },
]

const hiddenViewRedirects: Record<string, string> = {
  dashboard: 'cockpit',
  carteira: 'clientes',
  conflitos: 'importacoes',
  mesclagem: 'importacoes',
  'campanhas-inbox': 'campanhas',
}

const adminOnlyViews = new Set(['importacoes', 'conflitos', 'mesclagem', 'relatorios', 'vendedores', 'usuarios', 'auditoria'])

function normalizeView(view: string) {
  return hiddenViewRedirects[view] ?? view
}

const authUsuarios: Vendedor[] = [
  {
    id: 'login-wagner-fonseca',
    nome: 'Wagner Fonseca',
    email: 'wagner.fonseca@capitaltruck.local',
    role: 'admin',
  },
  {
    id: 'login-william-brandenburg',
    nome: 'William Brandenburg',
    email: 'william.brandenburg@capitaltruck.local',
    role: 'vendedor',
  },
  {
    id: 'login-mateus-silva',
    nome: 'Mateus Silva',
    email: 'mateus.silva@capitaltruck.local',
    role: 'vendedor',
  },
]

const emptyClient: Cliente = {
  id: 'empty-client',
  codigoErp: '',
  nome: 'Nenhum cliente carregado',
  tipoCliente: '',
  cidade: '',
  uf: '',
  status: 'Novo',
  origem: 'supabase',
  totalComprado: 0,
  totalServicos: 0,
  tags: [],
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      className={compact ? 'brand-logo compact' : 'brand-logo'}
      src={capitalLogo}
      alt="Capital Truck Center"
    />
  )
}

type QuoteOriginContext =
  | { kind: 'campanha'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }
  | { kind: 'tarefa'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }
  | { kind: 'cliente'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }

function App() {
  const clientePageSize = 50
  const [session, setSession] = useState<SessaoUsuario | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [view, setView] = useState(() => normalizeView(localStorage.getItem('capital-crm:last-view') ?? 'cockpit'))
  const [clientes, setClientes] = useState<Cliente[]>(isSupabaseConfigured ? [] : seedClientes)
  const [clientesTotal, setClientesTotal] = useState(isSupabaseConfigured ? 0 : seedClientes.length)
  const [clientesPage, setClientesPage] = useState(1)
  const [selectedClientId, setSelectedClientId] = useState(isSupabaseConfigured ? '' : seedClientes[0].id)
  const [query, setQuery] = useState('')
  const [isGlobalSearchFocused, setIsGlobalSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [clienteFiltro, setClienteFiltro] = useState<CarteiraFiltro>(
    () => (localStorage.getItem('capital-crm:cliente-filter') as CarteiraFiltro | null) ?? 'todos',
  )
  const [carteiraFiltro, setCarteiraFiltro] = useState<CarteiraFiltro>(
    () => (localStorage.getItem('capital-crm:carteira-filter') as CarteiraFiltro | null) ?? 'todos',
  )
  const [interacoes, setInteracoes] = useState<Interacao[]>(isSupabaseConfigured ? [] : seedInteracoes)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(isSupabaseConfigured ? [] : seedOrcamentos)
  const [orcamentosTotal, setOrcamentosTotal] = useState(isSupabaseConfigured ? 0 : seedOrcamentos.length)
  const [orcamentosPage, setOrcamentosPage] = useState(1)
  const [orcamentosFilter, setOrcamentosFilter] = useState<OrcamentoListFilter>('todos')
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState('')
  const [importacoes, setImportacoes] = useState<Importacao[]>(isSupabaseConfigured ? [] : seedImportacoes)
  const [conflitos, setConflitos] = useState<ImportacaoConflito[]>(isSupabaseConfigured ? [] : seedConflitos)
  const [usuarios, setUsuarios] = useState(isSupabaseConfigured ? authUsuarios : seedVendedores)
  const [alteracoes, setAlteracoes] = useState<ClienteAlteracao[]>(isSupabaseConfigured ? [] : seedAlteracoes)
  const [tarefas, setTarefas] = useState<Tarefa[]>(isSupabaseConfigured ? [] : seedTarefas)
  const [tarefasTotal, setTarefasTotal] = useState(isSupabaseConfigured ? 0 : seedTarefas.length)
  const [tarefasPage, setTarefasPage] = useState(1)
  const [tarefasStatusFilter, setTarefasStatusFilter] = useState<TarefaStatusFilter>('abertas')
  const [tarefasOriginFilter, setTarefasOriginFilter] = useState<TarefaOriginFilter>('todas')
  const [tarefasOwnerFilter, setTarefasOwnerFilter] = useState('todos')
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [oportunidadesTotal, setOportunidadesTotal] = useState(0)
  const [oportunidadesResumo, setOportunidadesResumo] = useState<OportunidadeResumo[]>([])
  const [oportunidadesPage, setOportunidadesPage] = useState(1)
  const [oportunidadesFilter, setOportunidadesFilter] = useState<OportunidadeFilter>('ativas')
  const [oportunidadesTipoFilter, setOportunidadesTipoFilter] = useState('todos')
  const [oportunidadesRefreshKey, setOportunidadesRefreshKey] = useState(0)
  const [vendasItens, setVendasItens] = useState<VendaItem[]>(isSupabaseConfigured ? [] : seedVendasItens)
  const [servicosItens, setServicosItens] = useState<ServicoItem[]>(isSupabaseConfigured ? [] : seedServicosItens)
  const [clienteVeiculos, setClienteVeiculos] = useState<ClienteVeiculoResumo[]>([])
  const [clienteTarefas, setClienteTarefas] = useState<Tarefa[]>([])
  const [clienteCampanhas, setClienteCampanhas] = useState<CampanhaEnvio[]>([])
  const [possiveisDuplicados, setPossiveisDuplicados] = useState<PossivelDuplicado[]>(isSupabaseConfigured ? [] : seedPossiveisDuplicados)
  const [mesclagens, setMesclagens] = useState<ClienteMesclagem[]>(isSupabaseConfigured ? [] : seedMesclagens)
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [catalogoRegrasDesconto, setCatalogoRegrasDesconto] = useState<CatalogoRegraDesconto[]>([])
  const [catalogoLista, setCatalogoLista] = useState<CatalogoItem[]>([])
  const [catalogoTotal, setCatalogoTotal] = useState(0)
  const [catalogoPage, setCatalogoPage] = useState(1)
  const [catalogoQuery, setCatalogoQuery] = useState('')
  const [catalogoTipoFilter, setCatalogoTipoFilter] = useState<CatalogoTipoFilter>('todos')
  const [catalogoAtivoFilter, setCatalogoAtivoFilter] = useState<CatalogoAtivoFilter>('ativos')
  const [dashboardResumo, setDashboardResumo] = useState<DashboardResumo | undefined>()
  const [vendedoresResumo, setVendedoresResumo] = useState<VendedorResumo[]>([])
  const [vendedoresHistoricosResumo, setVendedoresHistoricosResumo] = useState<VendedorHistoricoResumo[]>([])
  const [rankingMedidas, setRankingMedidas] = useState<RankingResumo[]>([])
  const [rankingServicos, setRankingServicos] = useState<RankingResumo[]>([])
  const [funilGerencial, setFunilGerencial] = useState<FunilGerencialResumo[]>([])
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerdaResumo[]>([])
  const [atividadesDia, setAtividadesDia] = useState<AtividadeDiaResumo[]>([])
  const [forecastVendedor, setForecastVendedor] = useState<ForecastVendedorResumo[]>([])
  const [rodobensLeads, setRodobensLeads] = useState<Cliente[]>([])
  const [rodobensTotal, setRodobensTotal] = useState(0)
  const [rodobensFunil, setRodobensFunil] = useState<RodobensFunilResumo[]>([])
  const [rodobensPage, setRodobensPage] = useState(1)
  const [rodobensQuery, setRodobensQuery] = useState('')
  const [rodobensStatusFilter, setRodobensStatusFilter] = useState<LeadQualificacaoStatus | 'todos'>('todos')
  const [isLoadingRodobens, setIsLoadingRodobens] = useState(false)
  const [cockpitTarefas, setCockpitTarefas] = useState<Tarefa[]>([])
  const [cockpitTarefasVencidas, setCockpitTarefasVencidas] = useState<Tarefa[]>([])
  const [cockpitOrcamentos, setCockpitOrcamentos] = useState<Orcamento[]>([])
  const [cockpitRodobens, setCockpitRodobens] = useState<Cliente[]>([])
  const [cockpitOportunidades, setCockpitOportunidades] = useState<Oportunidade[]>([])
  const [cockpitCampanhas, setCockpitCampanhas] = useState<CampanhaInboxItem[]>([])
  const [cockpitSlaVendedores, setCockpitSlaVendedores] = useState<TarefaSlaVendedorResumo[]>([])
  const [isLoadingCockpit, setIsLoadingCockpit] = useState(false)
  const [cockpitRefreshKey, setCockpitRefreshKey] = useState(0)
  const [quoteSourceView, setQuoteSourceView] = useState('clientes')
  const [quoteOriginContext, setQuoteOriginContext] = useState<QuoteOriginContext>({ kind: 'cliente', label: 'Ficha do cliente' })
  const [campaignToOpenId, setCampaignToOpenId] = useState('')
  const [campanhaInboxItems, setCampanhaInboxItems] = useState<CampanhaInboxItem[]>([])
  const [campanhaInboxStatusFilter, setCampanhaInboxStatusFilter] = useState<CampanhaEnvioStatus | 'todos'>('respondeu')
  const [campanhaInboxOwnerFilter, setCampanhaInboxOwnerFilter] = useState('')
  const [isLoadingCampanhaInbox, setIsLoadingCampanhaInbox] = useState(false)
  const [campanhasVendedorResumo, setCampanhasVendedorResumo] = useState<CampanhaVendedorResumo[]>([])
  const [isLoadingData, setIsLoadingData] = useState(isSupabaseConfigured)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingClientes, setIsLoadingClientes] = useState(isSupabaseConfigured)
  const [isLoadingOrcamentos, setIsLoadingOrcamentos] = useState(false)
  const [isLoadingTarefas, setIsLoadingTarefas] = useState(false)
  const [isLoadingOportunidades, setIsLoadingOportunidades] = useState(false)
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false)
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({})
  const dataError = moduleErrors[view] ?? ''

  function setModuleError(module: string, message: string) {
    setModuleErrors((current) => ({ ...current, [module]: message }))
  }

  function clearModuleError(module: string) {
    setModuleErrors((current) => {
      if (!current[module]) return current
      const next = { ...current }
      delete next[module]
      return next
    })
  }

  useEffect(() => {
    let isMounted = true

    getCurrentSession()
      .then((currentSession) => {
        if (isMounted) setSession(currentSession)
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const nextView = normalizeView(view)
    if (nextView !== view) {
      setView(nextView)
      return
    }
    localStorage.setItem('capital-crm:last-view', nextView)
  }, [view])

  useEffect(() => {
    localStorage.setItem('capital-crm:cliente-filter', clienteFiltro)
  }, [clienteFiltro])

  useEffect(() => {
    localStorage.setItem('capital-crm:carteira-filter', carteiraFiltro)
  }, [carteiraFiltro])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (isCheckingSession) return
      if (isSupabaseConfigured && !session) {
        setUsuarios(authUsuarios)
        return
      }

      setIsLoadingData(true)
      clearModuleError('dashboard')

      try {
        const [
          loadedInteracoes,
          loadedOrcamentos,
          loadedImportacoes,
          loadedConflitos,
          loadedUsuarios,
          loadedAlteracoes,
          loadedTarefas,
          loadedPossiveisDuplicados,
          loadedMesclagens,
          loadedCatalogo,
          loadedCatalogoRegrasDesconto,
          loadedDashboardResumo,
          loadedVendedoresResumo,
          loadedVendedoresHistoricosResumo,
          loadedRankingMedidas,
          loadedRankingServicos,
          loadedFunilGerencial,
          loadedMotivosPerda,
          loadedAtividadesDia,
          loadedForecastVendedor,
        ] = await Promise.all([
          listInteracoes(),
          listOrcamentos(),
          listImportacoes(),
          listConflitos(),
          listUsuarios(),
          listClienteAlteracoes(),
          listTarefas(),
          listPossiveisDuplicados(),
          listMesclagens(),
          listCatalogoItens(),
          listCatalogoRegrasDesconto(),
          getDashboardResumo(),
          listVendedoresResumo(),
          listVendedoresHistoricosResumo(),
          listRankingMedidas(),
          listRankingServicos(),
          listFunilGerencial(),
          listMotivosPerda(),
          listAtividadesDia(),
          listForecastVendedor(),
        ])

        if (!isMounted) return
        setInteracoes(loadedInteracoes)
        setOrcamentos(loadedOrcamentos)
        setImportacoes(loadedImportacoes)
        setConflitos(loadedConflitos)
        setUsuarios(loadedUsuarios)
        setAlteracoes(loadedAlteracoes)
        setTarefas(loadedTarefas)
        setPossiveisDuplicados(loadedPossiveisDuplicados)
        setMesclagens(loadedMesclagens)
        setCatalogo(loadedCatalogo)
        setCatalogoRegrasDesconto(loadedCatalogoRegrasDesconto)
        setDashboardResumo(loadedDashboardResumo)
        setVendedoresResumo(loadedVendedoresResumo)
        setVendedoresHistoricosResumo(loadedVendedoresHistoricosResumo)
        setRankingMedidas(loadedRankingMedidas)
        setRankingServicos(loadedRankingServicos)
        setFunilGerencial(loadedFunilGerencial)
        setMotivosPerda(loadedMotivosPerda)
        setAtividadesDia(loadedAtividadesDia)
        setForecastVendedor(loadedForecastVendedor)
      } catch (exception) {
        if (!isMounted) return
        setModuleError('dashboard', exception instanceof Error ? exception.message : 'Nao foi possivel carregar os dados.')
      } finally {
        if (isMounted) setIsLoadingData(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isCheckingSession, session])

  useEffect(() => {
    let isMounted = true

    async function loadClientes() {
      if (isCheckingSession) return
      if (isSupabaseConfigured && !session) {
        setClientes([])
        setClientesTotal(0)
        setIsLoadingClientes(false)
        return
      }

      setIsLoadingClientes(true)
      try {
        const result = await listClientesPage({
          page: clientesPage,
          pageSize: clientePageSize,
          query,
          filtro: clienteFiltro,
          vendedorId: session?.role === 'vendedor' ? session.id : undefined,
        })
        if (!isMounted) return
        setClientes(result.clientes)
        setClientesTotal(result.total)
        clearModuleError('clientes')
        setSelectedClientId((current) =>
          result.clientes.some((cliente) => cliente.id === current) ? current : result.clientes[0]?.id ?? '',
        )
      } catch (exception) {
        if (isMounted) setModuleError('clientes', exception instanceof Error ? exception.message : 'Nao foi possivel carregar os clientes.')
      } finally {
        if (isMounted) setIsLoadingClientes(false)
      }
    }

    const handle = window.setTimeout(loadClientes, query.trim() ? 250 : 0)

    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [clienteFiltro, clientesPage, isCheckingSession, query, session])

  useEffect(() => {
    let isMounted = true

    async function loadCockpit() {
      if (isCheckingSession) return
      if (isSupabaseConfigured && !session) {
        setCockpitTarefas([])
        setCockpitTarefasVencidas([])
        setCockpitOrcamentos([])
        setCockpitRodobens([])
        setCockpitOportunidades([])
        setCockpitCampanhas([])
        setCockpitSlaVendedores([])
        return
      }
      if (view !== 'cockpit') return

      setIsLoadingCockpit(true)
      clearModuleError('cockpit')
      try {
        const vendedorId = session?.role === 'vendedor' ? session.id : undefined
        const [
          tarefasHoje,
          tarefasVencidas,
          orcamentosVencidos,
          rodobensNovos,
          oportunidadesAtivas,
          campanhasInbox,
          slaVendedores,
        ] = await Promise.all([
          listTarefasPage({ page: 1, pageSize: 8, status: 'abertas', origem: 'todas', vendedorId }),
          listTarefasPage({ page: 1, pageSize: 5, status: 'vencidas', origem: 'todas', vendedorId }),
          listOrcamentosPage({ page: 1, pageSize: 5, status: 'vencidos', vendedorId }),
          listRodobensLeads({ page: 1, pageSize: 5, status: 'novo' }),
          isSupabaseConfigured
            ? listOportunidadesPage({ page: 1, pageSize: 6, filter: 'ativas', tipo: 'todos' })
            : Promise.resolve({ oportunidades: [], total: 0 }),
          listCampanhaInbox({ statuses: ['respondeu', 'virou_orcamento'], vendedorId, limit: 8 }),
          listTarefasSlaVendedor(),
        ])

        if (!isMounted) return
        setCockpitTarefas(tarefasHoje.tarefas)
        setCockpitTarefasVencidas(tarefasVencidas.tarefas)
        setCockpitOrcamentos(orcamentosVencidos.orcamentos)
        setCockpitRodobens(rodobensNovos.clientes)
        setCockpitOportunidades(oportunidadesAtivas.oportunidades)
        setCockpitCampanhas(campanhasInbox)
        setCockpitSlaVendedores(slaVendedores)
      } catch (exception) {
        if (isMounted) setModuleError('cockpit', exception instanceof Error ? exception.message : 'Nao foi possivel carregar o cockpit.')
      } finally {
        if (isMounted) setIsLoadingCockpit(false)
      }
    }

    loadCockpit()

    return () => {
      isMounted = false
    }
  }, [cockpitRefreshKey, isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadInboxCampanhas() {
      if (isCheckingSession) return
      if (isSupabaseConfigured && !session) {
        setCampanhaInboxItems([])
        return
      }
      if (!['campanhas', 'campanhas-inbox'].includes(view)) return

      setIsLoadingCampanhaInbox(true)
      clearModuleError('campanhas')
      try {
        const vendedorId = session?.role === 'vendedor' ? session.id : campanhaInboxOwnerFilter || undefined
        const statuses = campanhaInboxStatusFilter === 'todos' ? undefined : [campanhaInboxStatusFilter]
        const items = await listCampanhaInbox({ statuses, vendedorId, limit: 100 })
        if (!isMounted) return
        setCampanhaInboxItems(items)
      } catch (exception) {
        if (isMounted) setModuleError('campanhas', exception instanceof Error ? exception.message : 'Nao foi possivel carregar respostas de campanhas.')
      } finally {
        if (isMounted) setIsLoadingCampanhaInbox(false)
      }
    }

    loadInboxCampanhas()

    return () => {
      isMounted = false
    }
  }, [campanhaInboxOwnerFilter, campanhaInboxStatusFilter, isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadCampanhasVendedorResumo() {
      if (isCheckingSession || !session || view !== 'relatorios') return
      try {
        const rows = await listCampanhasVendedorResumo()
        if (isMounted) setCampanhasVendedorResumo(rows)
      } catch {
        if (isMounted) setCampanhasVendedorResumo([])
      }
    }

    loadCampanhasVendedorResumo()

    return () => {
      isMounted = false
    }
  }, [isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadOrcamentosPage() {
      if (isCheckingSession) return
      if (isSupabaseConfigured && !session) {
        setOrcamentos([])
        setOrcamentosTotal(0)
        return
      }
      if (view !== 'orcamentos') return

      setIsLoadingOrcamentos(true)
      try {
        const result = await listOrcamentosPage({
          page: orcamentosPage,
          pageSize: 50,
          status: orcamentosFilter,
          vendedorId: session?.role === 'vendedor' ? session.id : undefined,
        })
        if (!isMounted) return
        setOrcamentos(result.orcamentos)
        setOrcamentosTotal(result.total)
        clearModuleError('orcamentos')
      } catch (exception) {
        if (isMounted) setModuleError('orcamentos', exception instanceof Error ? exception.message : 'Nao foi possivel carregar os orcamentos.')
      } finally {
        if (isMounted) setIsLoadingOrcamentos(false)
      }
    }

    loadOrcamentosPage()

    return () => {
      isMounted = false
    }
  }, [isCheckingSession, orcamentosFilter, orcamentosPage, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadTarefasPage() {
      if (isCheckingSession) return
      if (isSupabaseConfigured && !session) {
        setTarefas([])
        setTarefasTotal(0)
        return
      }
      if (view !== 'tarefas') return

      setIsLoadingTarefas(true)
      try {
        const result = await listTarefasPage({
          page: tarefasPage,
          pageSize: 50,
          status: tarefasStatusFilter,
          origem: tarefasOriginFilter,
          vendedorId: session?.role === 'vendedor'
            ? session.id
            : tarefasOwnerFilter === 'todos'
              ? undefined
              : tarefasOwnerFilter,
        })
        if (!isMounted) return
        setTarefas(result.tarefas)
        setTarefasTotal(result.total)
        clearModuleError('tarefas')
      } catch (exception) {
        if (isMounted) setModuleError('tarefas', exception instanceof Error ? exception.message : 'Nao foi possivel carregar as tarefas.')
      } finally {
        if (isMounted) setIsLoadingTarefas(false)
      }
    }

    loadTarefasPage()

    return () => {
      isMounted = false
    }
  }, [isCheckingSession, session, tarefasOriginFilter, tarefasOwnerFilter, tarefasPage, tarefasStatusFilter, view])

  useEffect(() => {
    let isMounted = true

    async function loadOportunidadesPage() {
      if (isCheckingSession) return
      if (!isSupabaseConfigured) return
      if (!session) {
        setOportunidades([])
        setOportunidadesTotal(0)
        return
      }
      if (view !== 'oportunidades') return

      setIsLoadingOportunidades(true)
      try {
        const vendedorId = session.role === 'vendedor' ? session.id : undefined
        const [result, resumo] = await Promise.all([
          listOportunidadesPage({
            page: oportunidadesPage,
            pageSize: 50,
            filter: oportunidadesFilter,
            tipo: oportunidadesTipoFilter,
            vendedorId,
          }),
          listOportunidadesResumo(vendedorId),
        ])
        if (!isMounted) return
        setOportunidades(result.oportunidades)
        setOportunidadesTotal(result.total)
        setOportunidadesResumo(resumo)
        clearModuleError('oportunidades')
      } catch (exception) {
        if (isMounted) setModuleError('oportunidades', exception instanceof Error ? exception.message : 'Nao foi possivel carregar oportunidades.')
      } finally {
        if (isMounted) setIsLoadingOportunidades(false)
      }
    }

    loadOportunidadesPage()

    return () => {
      isMounted = false
    }
  }, [isCheckingSession, oportunidadesFilter, oportunidadesPage, oportunidadesRefreshKey, oportunidadesTipoFilter, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadCatalogoPage() {
      if (isCheckingSession) return
      if (!isSupabaseConfigured) {
        setCatalogoLista(catalogo)
        setCatalogoTotal(catalogo.length)
        return
      }
      if (!session) {
        setCatalogoLista([])
        setCatalogoTotal(0)
        return
      }
      if (view !== 'catalogo') return

      setIsLoadingCatalogo(true)
      try {
        const result = await listCatalogoPage({
          page: catalogoPage,
          pageSize: 50,
          query: catalogoQuery,
          tipo: catalogoTipoFilter,
          ativo: catalogoAtivoFilter,
        })
        if (!isMounted) return
        setCatalogoLista(result.itens)
        setCatalogoTotal(result.total)
        clearModuleError('catalogo')
      } catch (exception) {
        if (isMounted) setModuleError('catalogo', exception instanceof Error ? exception.message : 'Nao foi possivel carregar o catalogo.')
      } finally {
        if (isMounted) setIsLoadingCatalogo(false)
      }
    }

    const handle = window.setTimeout(loadCatalogoPage, catalogoQuery.trim() ? 250 : 0)

    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [catalogo, catalogoAtivoFilter, catalogoPage, catalogoQuery, catalogoTipoFilter, isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadRodobens() {
      if (isCheckingSession) return
      if (!session) {
        setRodobensLeads([])
        setRodobensTotal(0)
        return
      }
      if (view !== 'rodobens') return

      setIsLoadingRodobens(true)
      try {
        const [result, funil] = await Promise.all([
          listRodobensLeads({
            page: rodobensPage,
            pageSize: clientePageSize,
            query: rodobensQuery,
            status: rodobensStatusFilter,
          }),
          listRodobensFunilResumo(),
        ])
        if (!isMounted) return
        setRodobensLeads(result.clientes)
        setRodobensTotal(result.total)
        setRodobensFunil(funil)
        clearModuleError('rodobens')
      } catch (exception) {
        if (isMounted) setModuleError('rodobens', exception instanceof Error ? exception.message : 'Nao foi possivel carregar clientes sem cadastro.')
      } finally {
        if (isMounted) setIsLoadingRodobens(false)
      }
    }

    const handle = window.setTimeout(loadRodobens, rodobensQuery.trim() ? 250 : 0)

    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [isCheckingSession, rodobensPage, rodobensQuery, rodobensStatusFilter, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadSelectedClientHistory() {
      if (!selectedClientId) return
      if (isSupabaseConfigured && !session) return

      setIsLoadingHistory(true)
      try {
        const [loadedVendas, loadedServicos, loadedVeiculos, loadedTarefas, loadedCampanhas] = await Promise.all([
          listClienteVendasItens(selectedClientId),
          listClienteServicosItens(selectedClientId),
          listClienteVeiculos(selectedClientId),
          listClienteTarefas(selectedClientId),
          listClienteCampanhaEnvios(selectedClientId),
        ])
        if (!isMounted) return
        setVendasItens(loadedVendas)
        setServicosItens(loadedServicos)
        setClienteVeiculos(loadedVeiculos)
        setClienteTarefas(loadedTarefas)
        setClienteCampanhas(loadedCampanhas)
        clearModuleError('cliente360')
      } catch (exception) {
        if (isMounted) setModuleError('cliente360', exception instanceof Error ? exception.message : 'Nao foi possivel carregar o historico do cliente.')
      } finally {
        if (isMounted) setIsLoadingHistory(false)
      }
    }

    loadSelectedClientHistory()

    return () => {
      isMounted = false
    }
  }, [selectedClientId, session])

  const scopedClientes = useMemo(() => {
    if (!session || session.role === 'admin') return clientes
    return clientes.filter((cliente) => cliente.vendedorId === session.id)
  }, [clientes, session])
  const selectedClient =
    scopedClientes.find((cliente) => cliente.id === selectedClientId) ??
    scopedClientes[0] ??
    clientes[0] ??
    emptyClient
  const hasSelectedClient = selectedClient.id !== emptyClient.id
  const scopedClientIds = useMemo(() => new Set(scopedClientes.map((cliente) => cliente.id)), [scopedClientes])
  const scopedInteracoes = useMemo(() => {
    if (!session || session.role === 'admin') return interacoes
    return interacoes.filter((interacao) => scopedClientIds.has(interacao.clienteId) || interacao.vendedorId === session.id)
  }, [interacoes, scopedClientIds, session])
  const scopedOrcamentos = useMemo(() => {
    if (!session || session.role === 'admin') return orcamentos
    return orcamentos.filter((orcamento) => scopedClientIds.has(orcamento.clienteId) || orcamento.vendedorId === session.id)
  }, [orcamentos, scopedClientIds, session])
  const selectedOrcamento = useMemo(
    () => scopedOrcamentos.find((orcamento) => orcamento.id === selectedOrcamentoId),
    [scopedOrcamentos, selectedOrcamentoId],
  )
  const scopedVendasItens = useMemo(() => {
    if (!session || session.role === 'admin') return vendasItens
    return vendasItens.filter((venda) => scopedClientIds.has(venda.clienteId))
  }, [vendasItens, scopedClientIds, session])
  const scopedServicosItens = useMemo(() => {
    if (!session || session.role === 'admin') return servicosItens
    return servicosItens.filter((servico) => scopedClientIds.has(servico.clienteId))
  }, [servicosItens, scopedClientIds, session])
  const scoredClientes = useMemo(
    () =>
      scopedClientes
        .map((cliente) => {
          const score = opportunityScore(cliente, scopedOrcamentos)
          return {
            ...cliente,
            score,
            motivo: opportunityReason(cliente, score),
            proximaMelhorAcao: bestNextAction(cliente),
          }
        })
        .sort((a, b) => b.score - a.score),
    [scopedClientes, scopedOrcamentos],
  )

  const filteredClientes = isSupabaseConfigured
    ? scoredClientes
    : filterClientes(scoredClientes, clienteFiltro, scopedOrcamentos).filter((cliente) => {
        const haystack = `${cliente.nome} ${cliente.cidade} ${cliente.tipoCliente} ${cliente.vendedorNome ?? ''} ${origemLabel(cliente.origemBase)} ${cliente.tags.join(' ')}`.toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
  const carteiraClientes = filterClientes(scoredClientes, carteiraFiltro, scopedOrcamentos)
  const hasActiveClientFilter = clienteFiltro !== 'todos' || Boolean(query.trim())
  const localOportunidades = useMemo(() => buildOportunidades(scopedClientes, scopedOrcamentos), [scopedClientes, scopedOrcamentos])
  const visibleOportunidades = isSupabaseConfigured ? oportunidades : localOportunidades
  const visibleOportunidadesTotal = isSupabaseConfigured ? oportunidadesTotal : localOportunidades.length
  const quickSearchResults = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) return []
    const clientResults = clientes
      .filter((cliente) => `${cliente.nome} ${cliente.cidade} ${cliente.uf} ${cliente.whatsapp ?? ''} ${cliente.cpfCnpj ?? ''}`.toLowerCase().includes(term))
      .slice(0, 5)
      .map((cliente) => ({
        id: `cliente-${cliente.id}`,
        kind: 'cliente' as const,
        title: cliente.nome,
        detail: `${cliente.cidade}/${cliente.uf} - ${cliente.whatsapp ?? 'sem WhatsApp'}`,
        clienteId: cliente.id,
      }))
    const quoteResults = scopedOrcamentos
      .filter((orcamento) => `${orcamento.clienteNome ?? ''} ${orcamento.status} ${orcamento.id}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((orcamento) => ({
        id: `orcamento-${orcamento.id}`,
        kind: 'orcamento' as const,
        title: orcamento.clienteNome ?? 'Cliente',
        detail: `${money(orcamento.valorTotal)} - ${orcamento.status} - ${dateLabel(orcamento.validade)}`,
        orcamentoId: orcamento.id,
      }))
    const catalogResults = [...catalogoLista, ...catalogo]
      .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
      .filter((item) => `${item.codigo} ${item.descricao} ${item.marca ?? ''} ${item.grupo ?? ''}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((item) => ({
        id: `catalogo-${item.id}`,
        kind: 'catalogo' as const,
        title: item.descricao,
        detail: `${item.codigo} - ${money(item.preco)}`,
        catalogTerm: item.codigo,
      }))
    return [...clientResults, ...quoteResults, ...catalogResults].slice(0, 10)
  }, [catalogo, catalogoLista, clientes, query, scopedOrcamentos])

  async function ensureClientInMemory(clienteId: string) {
    if (!clienteId || clientes.some((cliente) => cliente.id === clienteId)) return
    const result = await listClientesPage({ page: 1, pageSize: 1, clienteIds: [clienteId] })
    if (result.clientes[0]) {
      setClientes((current) =>
        current.some((cliente) => cliente.id === clienteId) ? current : [result.clientes[0], ...current],
      )
    }
  }

  async function openClientFromCockpit(clienteId: string) {
    await ensureClientInMemory(clienteId)
    setSelectedClientId(clienteId)
    setView('cliente360')
  }

  async function openBudgetFromCockpit(clienteId: string, originContext: QuoteOriginContext) {
    await ensureClientInMemory(clienteId)
    setSelectedClientId(clienteId)
    setQuoteSourceView('cockpit')
    setQuoteOriginContext(originContext)
    setView('orcamento-editor')
  }

  function openQuickAction(action: 'tarefas-vencidas' | 'orcamentos-vencidos' | 'clientes-sem-cadastro' | 'campanhas' | 'orcamentos') {
    if (action === 'tarefas-vencidas') {
      setTarefasStatusFilter('vencidas')
      setTarefasOriginFilter('todas')
      setTarefasPage(1)
      setView('tarefas')
      return
    }
    if (action === 'orcamentos-vencidos') {
      setOrcamentosFilter('vencidos')
      setOrcamentosPage(1)
      setView('orcamentos')
      return
    }
    if (action === 'clientes-sem-cadastro') {
      setRodobensStatusFilter('novo')
      setRodobensPage(1)
      setView('rodobens')
      return
    }
    if (action === 'campanhas') {
      setView('campanhas')
      return
    }
    setOrcamentosFilter('todos')
    setOrcamentosPage(1)
    setView('orcamentos')
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT'
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }
      if (isTyping) return
      if (event.altKey && event.key === '1') openQuickAction('tarefas-vencidas')
      if (event.altKey && event.key === '2') openQuickAction('orcamentos-vencidos')
      if (event.altKey && event.key === '3') openQuickAction('clientes-sem-cadastro')
      if (event.altKey && event.key === '4') openQuickAction('campanhas')
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  if (isCheckingSession) {
    return (
      <div className="login-screen">
        <div className="login-panel">Carregando sessao...</div>
      </div>
    )
  }

  if (!session) {
    return <Login usuarios={usuarios} onLogin={(nextSession) => {
      setSession(nextSession)
      localStorage.setItem('capital-crm:last-email', nextSession.email)
      setView('cockpit')
    }} />
  }

  if (isSupabaseConfigured && (isLoadingData || isLoadingClientes) && clientes.length === 0) {
    return (
      <main className="login-screen">
        <section className="login-panel">
          <div className="brand login-brand">
            <BrandLogo />
            <div>
              <strong>Capital Truck CRM</strong>
              <span>Carregando base do Supabase...</span>
            </div>
          </div>
          <div className="empty-state">Buscando clientes e dados comerciais. Nenhum dado demonstrativo sera exibido.</div>
        </section>
      </main>
    )
  }

  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => session.role === 'admin' || !adminOnlyViews.has(item.id)),
    }))
    .filter((section) => section.items.length > 0)
  const canUseScopedClientViews = session.role === 'admin' || isSupabaseConfigured || scopedClientes.length > 0

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BrandLogo compact />
          <div>
            <strong>Capital Truck CRM</strong>
            <span>Central de carteira</span>
          </div>
        </div>

        <nav className="nav">
          {visibleNavSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <span className="nav-section-title">{section.title}</span>
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    className={view === item.id ? 'nav-item active' : 'nav-item'}
                    key={item.id}
                    onClick={() => setView(item.id)}
                    type="button"
                    title={item.label}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ShieldCheck size={18} />
          <span>{session.nome} · {session.role} · {session.modo}</span>
          <button
            className="sidebar-logout"
            type="button"
            onClick={() => {
              signOut().finally(() => setSession(null))
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <BrandLogo compact />
            <div>
              <p className="eyebrow">MVP operacional</p>
              <h1>{titleFor(view)}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <Search size={18} />
              <input
                ref={searchInputRef}
                value={query}
                onFocus={() => setIsGlobalSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setIsGlobalSearchFocused(false), 140)}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setClientesPage(1)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && query.trim()) {
                    setClienteFiltro('todos')
                    setClientesPage(1)
                    setView('clientes')
                  }
                }}
                placeholder="Buscar cliente, cidade, vendedor, origem"
              />
              {query && (
                <button className="icon-button" type="button" onClick={() => {
                  setQuery('')
                  setClientesPage(1)
                }} title="Limpar busca">
                  x
                </button>
              )}
              <span className="shortcut-hint">Ctrl K</span>
              {isGlobalSearchFocused && query.trim().length >= 2 && (
                <div className="global-search-results">
                  {quickSearchResults.map((result) => (
                    <button
                      type="button"
                      key={result.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={async () => {
                        setIsGlobalSearchFocused(false)
                        if (result.kind === 'cliente') {
                          await ensureClientInMemory(result.clienteId)
                          setSelectedClientId(result.clienteId)
                          setView('cliente360')
                          return
                        }
                        if (result.kind === 'orcamento') {
                          setSelectedOrcamentoId(result.orcamentoId)
                          setOrcamentosFilter('todos')
                          setView('orcamentos')
                          return
                        }
                        setCatalogoQuery(result.catalogTerm)
                        setCatalogoPage(1)
                        setView('catalogo')
                      }}
                    >
                      <span>{result.kind === 'cliente' ? 'Cliente' : result.kind === 'orcamento' ? 'Orcamento' : 'Catalogo'}</span>
                      <strong>{result.title}</strong>
                      <small>{result.detail}</small>
                    </button>
                  ))}
                  {quickSearchResults.length === 0 && <small>Nenhum atalho encontrado. Pressione Enter para buscar em Clientes.</small>}
                </div>
              )}
            </div>
            <div className="quick-jump-bar" aria-label="Atalhos operacionais">
              <button type="button" onClick={() => openQuickAction('tarefas-vencidas')}>
                <span>{cockpitTarefasVencidas.length}</span>
                Tarefas
              </button>
              <button type="button" onClick={() => openQuickAction('orcamentos-vencidos')}>
                <span>{cockpitOrcamentos.length}</span>
                Propostas
              </button>
              <button type="button" onClick={() => openQuickAction('clientes-sem-cadastro')}>
                <span>{cockpitRodobens.length}</span>
                Sem cadastro
              </button>
              <button type="button" onClick={() => openQuickAction('campanhas')}>
                <span>{cockpitCampanhas.length}</span>
                Campanhas
              </button>
              <button className="primary" type="button" onClick={() => openQuickAction('orcamentos')}>
                Orcar
              </button>
            </div>
          </div>
        </header>

        <div className={dataError ? 'data-banner error' : 'data-banner'}>
          <span>
            {isSupabaseConfigured ? 'Supabase configurado' : 'Modo local com dados demonstrativos'}
            {' · '}
            {session.role === 'admin' ? `${clientesTotal} clientes totais` : `${clientesTotal} clientes na sua visao`}
            {view === 'clientes' && hasActiveClientFilter ? ` · ${clientesTotal} encontrados com filtro` : ''}
          </span>
          {view === 'clientes' && hasActiveClientFilter && (
            <button
              className="button"
              type="button"
              onClick={() => {
                setQuery('')
                setClienteFiltro('todos')
                setClientesPage(1)
              }}
            >
              Limpar filtros
            </button>
          )}
          {isLoadingData && <strong>Carregando...</strong>}
          {isLoadingClientes && <strong>Carregando clientes...</strong>}
          {isLoadingHistory && <strong>Carregando historico do cliente...</strong>}
          {dataError && <strong>{dataError}</strong>}
        </div>

        {view === 'cockpit' && (
          <Cockpit
            currentUser={session}
            usuarios={usuarios}
            tarefas={cockpitTarefas}
            tarefasVencidas={cockpitTarefasVencidas}
            orcamentos={cockpitOrcamentos}
            rodobens={cockpitRodobens}
            oportunidades={cockpitOportunidades}
            campanhas={cockpitCampanhas}
            slaVendedores={cockpitSlaVendedores}
            isLoading={isLoadingCockpit}
            onOpenClient={openClientFromCockpit}
            onOpenBudget={openBudgetFromCockpit}
            onOpenModule={(target) => {
              if (target === 'tarefas') {
                setTarefasStatusFilter('abertas')
                setTarefasOriginFilter('todas')
                setTarefasPage(1)
              }
              if (target === 'orcamentos') {
                setOrcamentosFilter('vencidos')
                setOrcamentosPage(1)
              }
              if (target === 'rodobens') {
                setRodobensStatusFilter('novo')
                setRodobensPage(1)
              }
              if (target === 'oportunidades') {
                setOportunidadesFilter('ativas')
                setOportunidadesPage(1)
              }
              setView(target)
            }}
            onCompleteTask={async (id) => {
              await completeTarefa(id)
              setCockpitTarefas((current) => current.filter((tarefa) => tarefa.id !== id))
              setCockpitTarefasVencidas((current) => current.filter((tarefa) => tarefa.id !== id))
              setTarefas((current) => current.map((tarefa) => tarefa.id === id ? { ...tarefa, status: 'concluida', concluidaEm: new Date().toISOString() } : tarefa))
            }}
            onRescheduleTask={async (id, dataVencimento, motivo) => {
              const updated = await rescheduleTarefa(id, dataVencimento, motivo)
              setCockpitTarefas((current) => current.map((tarefa) => tarefa.id === id ? updated : tarefa).filter((tarefa) => tarefa.status === 'aberta'))
              setCockpitTarefasVencidas((current) => current.filter((tarefa) => tarefa.id !== id))
              setTarefas((current) => current.map((tarefa) => tarefa.id === id ? updated : tarefa))
            }}
            onRunFollowupAutomations={async () => {
              const result = await runFollowupAutomations()
              setCockpitRefreshKey((current) => current + 1)
              setTarefasPage(1)
              return {
                total: result.tarefas_followup_total ?? 0,
                orcamentos: result.orcamentos_vencidos_tarefas ?? 0,
                campanhas: result.campanhas_resposta_tarefas ?? 0,
              }
            }}
          />
        )}
        {view === 'dashboard' && (
          <Dashboard
            scoredClientes={scoredClientes}
            resumo={dashboardResumo}
            vendedoresResumo={vendedoresResumo}
            interacoes={scopedInteracoes}
            orcamentos={scopedOrcamentos}
            importacoes={importacoes}
            usuarios={usuarios}
            oportunidades={visibleOportunidades}
            onOpenAction={(action) => {
              if (action === 'sem-vendedor') {
                setOportunidadesTipoFilter('sem_vendedor')
                setOportunidadesFilter('ativas')
                setOportunidadesPage(1)
                setView('oportunidades')
              }
              if (action === 'rodobens') {
                setRodobensStatusFilter('novo')
                setRodobensPage(1)
                setView('rodobens')
              }
              if (action === 'orcamentos-vencidos') {
                setOrcamentosFilter('vencidos')
                setOrcamentosPage(1)
                setView('orcamentos')
              }
              if (action === 'campanhas-pendentes') {
                setView('campanhas')
              }
              if (action === 'tarefas-vencidas') {
                setTarefasStatusFilter('vencidas')
                setTarefasPage(1)
                setView('tarefas')
              }
            }}
          />
        )}
        {!canUseScopedClientViews && (
          <section className="panel wide">
            <div className="empty-state">Sua carteira ainda nao possui clientes atribuidos.</div>
          </section>
        )}
        {canUseScopedClientViews && view === 'clientes' && (
          <Clientes
            currentUser={session}
            clientes={filteredClientes}
            selectedClient={selectedClient}
            interacoes={scopedInteracoes}
            orcamentos={scopedOrcamentos}
            vendasItens={scopedVendasItens}
            servicosItens={scopedServicosItens}
            catalogo={catalogo}
            page={clientesPage}
            pageSize={clientePageSize}
            total={clientesTotal}
            isLoading={isLoadingClientes}
            filtro={clienteFiltro}
            onFilterChange={(nextFiltro) => {
              setClienteFiltro(nextFiltro)
              setClientesPage(1)
            }}
            onPageChange={setClientesPage}
            onSelect={(cliente) => setSelectedClientId(cliente.id)}
            onOpenFullProfile={(cliente) => {
              setSelectedClientId(cliente.id)
              setView('cliente360')
            }}
            onOpenBudgetEditor={(cliente) => {
              setSelectedClientId(cliente.id)
              setQuoteSourceView('clientes')
              setQuoteOriginContext({ kind: 'cliente', label: 'Lista de clientes' })
              setView('orcamento-editor')
            }}
            onUpdateClient={(clienteId, patch) => {
              updateClienteComercial(clienteId, patch).catch((exception) => {
                setModuleError('clientes', exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o cliente.')
              })
              const currentCliente = clientes.find((cliente) => cliente.id === clienteId)
              setClientes((current) =>
                current.map((cliente) => (cliente.id === clienteId ? { ...cliente, ...patch } : cliente)),
              )
              if (currentCliente) {
                const changedFields = Object.entries(patch).filter(([key, value]) => currentCliente[key as keyof Cliente] !== value)
                setAlteracoes((current) => [
                  ...changedFields.map(([key, value]) => ({
                    id: `alt-${Date.now()}-${key}`,
                    clienteId,
                    clienteNome: currentCliente.nome,
                    usuarioNome: 'Usuario local',
                    campo: key,
                    valorAnterior: String(currentCliente[key as keyof Cliente] ?? ''),
                    valorNovo: String(value ?? ''),
                    origem: 'app',
                    criadoEm: new Date().toISOString(),
                  })),
                  ...current,
                ])
              }
            }}
            onAddInteraction={async (interacao) => {
              const created = await createInteracao(interacao)
              setInteracoes((current) => [created, ...current])
              if (created.dataProximaAcao) {
                const cliente = clientes.find((item) => item.id === created.clienteId)
                const tarefa = await createTarefa({
                  clienteId: created.clienteId,
                  vendedorId: created.vendedorId,
                  titulo: created.proximaAcao || bestNextAction(cliente ?? selectedClient),
                  descricao: created.resumo,
                  dataVencimento: created.dataProximaAcao,
                  prioridade: 75,
                  origem: 'interacao',
                })
                setTarefas((current) => [
                  { ...tarefa, clienteNome: cliente?.nome ?? tarefa.clienteNome },
                  ...current,
                ])
              }
              return created
            }}
            onAddBudget={async (orcamento) => {
              const created = await createOrcamento(orcamento, orcamento.itens)
              setOrcamentos((current) => [created, ...current])
              return created
            }}
          />
        )}
        {canUseScopedClientViews && view === 'cliente360' && hasSelectedClient && (
          <Cliente360
            cliente={selectedClient}
            interacoes={scopedInteracoes}
            orcamentos={scopedOrcamentos}
            vendasItens={scopedVendasItens}
            servicosItens={scopedServicosItens}
            veiculos={clienteVeiculos}
            tarefas={clienteTarefas}
            campanhaEnvios={clienteCampanhas}
            currentUser={session}
            onAddInteraction={async (interacao) => {
              const created = await createInteracao(interacao)
              setInteracoes((current) => [created, ...current])
              if (created.dataProximaAcao) {
                const tarefa = await createTarefa({
                  clienteId: created.clienteId,
                  vendedorId: created.vendedorId,
                  titulo: created.proximaAcao || bestNextAction(selectedClient),
                  descricao: created.resumo,
                  dataVencimento: created.dataProximaAcao,
                  prioridade: 80,
                  origem: 'atendimento',
                })
                setTarefas((current) => [tarefa, ...current])
                setClienteTarefas((current) => [tarefa, ...current])
              }
              return created
            }}
            onCreateTask={async () => {
              const created = await createTarefa({
                clienteId: selectedClient.id,
                vendedorId: selectedClient.vendedorId ?? session?.id,
                titulo: bestNextAction(selectedClient),
                descricao: `Tarefa criada pela Ficha 360. ${smartSummary(selectedClient, scopedInteracoes)}`,
                dataVencimento: addDays(new Date().toISOString().slice(0, 10), 1),
                prioridade: 80,
                origem: 'cliente360',
              })
              setTarefas((current) => [created, ...current])
              setClienteTarefas((current) => [created, ...current])
              return created
            }}
            onCreateQuote={(initialItems) => {
              setQuoteSourceView('cliente360')
              setQuoteOriginContext({ kind: 'cliente', label: 'Ficha 360', initialItems })
              setView('orcamento-editor')
            }}
            onBack={() => setView('clientes')}
          />
        )}
        {canUseScopedClientViews && view === 'orcamento-editor' && hasSelectedClient && (
          <OrcamentoEditor
            cliente={selectedClient}
            currentUser={session}
            catalogo={catalogo}
            regrasDesconto={catalogoRegrasDesconto}
            originContext={quoteOriginContext}
            onBack={() => setView(quoteSourceView)}
            onCreateTask={async (task) => {
              const created = await createTarefa(task)
              setTarefas((current) => [created, ...current])
              return created
            }}
            onCreate={async (orcamento) => {
              const created = await createOrcamento(orcamento, orcamento.itens)
              setOrcamentos((current) => [created, ...current])
              if (quoteOriginContext.kind === 'campanha' && quoteOriginContext.sourceId) {
                await upsertCampanhaEnvio({
                  campanhaId: quoteOriginContext.sourceId,
                  campanhaNome: quoteOriginContext.label,
                  clienteId: created.clienteId,
                  vendedorId: created.vendedorId,
                  telefone: selectedClient.whatsapp,
                  mensagemFinal: created.observacao || `Orcamento ${created.id.slice(0, 8)} criado a partir da campanha ${quoteOriginContext.label}.`,
                  status: 'virou_orcamento',
                  orcamentoId: created.id,
                })
              }
              const interacao = await createInteracao({
                clienteId: created.clienteId,
                vendedorId: created.vendedorId ?? selectedClient.vendedorId ?? session.id,
                canal: 'WhatsApp',
                tipo: 'orcamento',
                resumo: `${created.observacao || `Orcamento criado no valor de ${money(created.valorTotal)}.`} Origem: ${quoteOriginContext.label}.`,
                resultado: 'pediu orcamento',
              })
              setInteracoes((current) => [interacao, ...current])
              setQuoteOriginContext({ kind: 'cliente', label: 'Ficha do cliente' })
              return created
            }}
          />
        )}
        {canUseScopedClientViews && view === 'rodobens' && (
          <RodobensInbox
            currentUser={session}
            leads={rodobensLeads}
            funil={rodobensFunil}
            total={rodobensTotal}
            page={rodobensPage}
            pageSize={clientePageSize}
            query={rodobensQuery}
            statusFilter={rodobensStatusFilter}
            isLoading={isLoadingRodobens}
            onQueryChange={(nextQuery) => {
              setRodobensQuery(nextQuery)
              setRodobensPage(1)
            }}
            onStatusFilterChange={(nextStatus) => {
              setRodobensStatusFilter(nextStatus)
              setRodobensPage(1)
            }}
            onPageChange={setRodobensPage}
            onSelect={(cliente) => {
              setSelectedClientId(cliente.id)
              setView('cliente360')
            }}
            onAddInteraction={async (interacao) => {
              const created = await createInteracao(interacao)
              setInteracoes((current) => [created, ...current])
              return created
            }}
            onCreateTask={async (task) => {
              const created = await createTarefa(task)
              setTarefas((current) => [created, ...current])
              return created
            }}
            onUpdateQualificacao={async (cliente, status, observacao) => {
              await updateRodobensQualificacao(cliente.id, status, observacao)
              setRodobensLeads((current) => current
                .map((item) => item.id === cliente.id ? { ...item, leadQualificacaoStatus: status, leadQualificacaoObservacao: observacao } : item)
                .filter((item) => {
                  if (status === 'virou_cliente' && item.id === cliente.id) return false
                  return rodobensStatusFilter === 'todos' || item.leadQualificacaoStatus === rodobensStatusFilter
                }))
            }}
            onCreateCampaignFromSelection={async (clienteIds) => {
              const { campanha, enviosCriados } = await createCampanhaFromClienteIds({
                nome: `Clientes sem cadastro - ${new Date().toISOString().slice(0, 10)}`,
                descricao: 'Campanha criada a partir da selecao manual na fila de clientes sem cadastro.',
                objetivo: 'Primeiro contato e qualificacao de clientes vindos de listas externas.',
                mensagemModelo: campanhaSegmentos.find((item) => item.id === 'rodobens-pendentes')?.template ?? campanhaSegmentos[0].template,
                clienteIds,
                origemLista: 'inbox_rodobens',
                criadaPor: session.id,
              })
              setCampaignToOpenId(campanha.id)
              setView('campanhas')
              return enviosCriados
            }}
          />
        )}
        {canUseScopedClientViews && ['cliente360', 'orcamento-editor'].includes(view) && !hasSelectedClient && (
          <section className="panel wide">
            <div className="empty-state">Nenhum cliente carregado para esta acao.</div>
          </section>
        )}
        {canUseScopedClientViews && view === 'carteira' && (
          <Carteira
            clientes={carteiraClientes}
            baseClientes={scoredClientes}
            orcamentos={scopedOrcamentos}
            filtro={carteiraFiltro}
            onFilterChange={setCarteiraFiltro}
            onSelect={(cliente) => setSelectedClientId(cliente.id)}
          />
        )}
        {canUseScopedClientViews && view === 'oportunidades' && (
          <Oportunidades
            oportunidades={visibleOportunidades}
            resumo={oportunidadesResumo}
            page={oportunidadesPage}
            pageSize={50}
            total={visibleOportunidadesTotal}
            filter={oportunidadesFilter}
            tipoFilter={oportunidadesTipoFilter}
            isLoading={isLoadingOportunidades}
            canRefresh={session.role === 'admin'}
            usuarios={usuarios}
            onPageChange={setOportunidadesPage}
            onFilterChange={(filter) => {
              setOportunidadesFilter(filter)
              setOportunidadesPage(1)
            }}
            onTipoFilterChange={(tipo) => {
              setOportunidadesTipoFilter(tipo)
              setOportunidadesPage(1)
            }}
            onRefresh={async () => {
              await refreshOportunidadesCache()
              setOportunidadesPage(1)
              setOportunidadesRefreshKey((current) => current + 1)
            }}
            onAssignSelected={async (clienteIds, vendedorId) => {
              const updated = await assignClientesVendedor(clienteIds, vendedorId)
              await refreshOportunidadesCache()
              setOportunidadesPage(1)
              setOportunidadesRefreshKey((current) => current + 1)
              const [resumo, historicos] = await Promise.all([listVendedoresResumo(), listVendedoresHistoricosResumo()])
              setVendedoresResumo(resumo)
              setVendedoresHistoricosResumo(historicos)
              return updated
            }}
            onCreateTask={async (oportunidade) => {
              const cliente = clientes.find((item) => item.id === oportunidade.clienteId)
              const created = await createTarefa({
                clienteId: oportunidade.clienteId,
                vendedorId: cliente?.vendedorId,
                titulo: oportunidade.proximaAcao,
                descricao: oportunidade.motivo,
                dataVencimento: new Date().toISOString().slice(0, 10),
                prioridade: oportunidade.prioridade,
                origem: `oportunidade:${oportunidade.tipo}`,
              })
              await markOportunidadeComTarefa(oportunidade.clienteId, oportunidade.tipo)
              setTarefas((current) => [
                {
                  ...created,
                  clienteNome: cliente?.nome ?? created.clienteNome,
                  vendedorNome: cliente?.vendedorNome ?? created.vendedorNome,
                },
                ...current,
              ])
              setOportunidades((current) =>
                current.map((item) =>
                  item.id === oportunidade.id ? { ...item, bloqueada: true, tarefaExistente: true } : item,
                ),
              )
              return created
            }}
            onCreateCampaignFromSelection={async (clienteIds, tipo) => {
              const tipoLabel = tipo === 'todos' ? 'oportunidades' : opportunityTypeLabel(tipo)
              const { campanha, enviosCriados } = await createCampanhaFromClienteIds({
                nome: `${tipoLabel} - ${new Date().toISOString().slice(0, 10)}`,
                descricao: 'Campanha criada a partir da selecao manual no motor de oportunidades.',
                objetivo: `Acionar clientes da fila ${tipoLabel}.`,
                mensagemModelo: campanhaSegmentos.find((item) => item.id === 'selecionados')?.template ?? campanhaSegmentos[0].template,
                clienteIds,
                origemLista: `oportunidades:${tipo}`,
                criadaPor: session.id,
              })
              setCampaignToOpenId(campanha.id)
              setView('campanhas')
              return enviosCriados
            }}
          />
        )}
        {canUseScopedClientViews && view === 'tarefas' && (
          <Tarefas
            clientes={scopedClientes}
            usuarios={usuarios}
            tarefas={tarefas}
            orcamentos={scopedOrcamentos}
            page={tarefasPage}
            pageSize={50}
            total={tarefasTotal}
            filter={tarefasStatusFilter}
            originFilter={tarefasOriginFilter}
            ownerFilter={session.role === 'vendedor' ? session.id : tarefasOwnerFilter}
            isLoading={isLoadingTarefas}
            onPageChange={setTarefasPage}
            onFilterChange={(filter) => {
              setTarefasStatusFilter(filter)
              setTarefasPage(1)
            }}
            onOriginFilterChange={(filter) => {
              setTarefasOriginFilter(filter)
              setTarefasPage(1)
            }}
            onOwnerFilterChange={(ownerId) => {
              setTarefasOwnerFilter(ownerId)
              setTarefasPage(1)
            }}
            onOpenClient={(clienteId) => {
              setSelectedClientId(clienteId)
              setView('cliente360')
            }}
            onOpenBudgetEditor={(clienteId, originContext) => {
              const cliente = scopedClientes.find((item) => item.id === clienteId)
              if (cliente) {
                setSelectedClientId(cliente.id)
                setQuoteSourceView('tarefas')
                setQuoteOriginContext(originContext ?? { kind: 'tarefa', label: 'Fila de tarefas' })
                setView('orcamento-editor')
              }
            }}
            onCreate={async (task) => {
              const created = await createTarefa(task)
              const cliente = clientes.find((item) => item.id === created.clienteId)
              const vendedor = usuarios.find((item) => item.id === created.vendedorId)
              setTarefas((current) => [
                {
                  ...created,
                  clienteNome: cliente?.nome ?? created.clienteNome,
                  vendedorNome: vendedor?.nome ?? created.vendedorNome,
                },
                ...current,
              ])
              return created
            }}
            onComplete={(id) => {
              completeTarefa(id).catch((exception) => {
                setModuleError('tarefas', exception instanceof Error ? exception.message : 'Nao foi possivel concluir a tarefa.')
              })
              setTarefas((current) =>
                current.map((tarefa) =>
                  tarefa.id === id ? { ...tarefa, status: 'concluida', concluidaEm: new Date().toISOString() } : tarefa,
                ),
              )
            }}
            onReschedule={async (id, dataVencimento, motivo) => {
              const updated = await rescheduleTarefa(id, dataVencimento, motivo)
              setTarefas((current) => current.map((tarefa) => tarefa.id === id ? updated : tarefa))
              return updated
            }}
          />
        )}
        {session.role !== 'admin' && adminOnlyViews.has(view) && (
          <section className="panel wide">
            <div className="empty-state">Seu perfil nao tem permissao para acessar esta area.</div>
          </section>
        )}
        {session.role === 'admin' && view === 'importacoes' && (
          <Importacoes
            importacoes={importacoes}
            onAddImportacao={(importacao) => setImportacoes((current) => [importacao, ...current.filter((item) => item.id !== importacao.id)])}
          />
        )}
        {session.role === 'admin' && view === 'conflitos' && (
          <Conflitos
            conflitos={conflitos}
            onResolve={(id, decisao) =>
              resolveConflito(id, decisao).then(() => {
                setConflitos((current) =>
                  current.map((conflito) =>
                    conflito.id === id ? { ...conflito, resolvido: true, decisao } : conflito,
                  ),
                )
              })
            }
          />
        )}
        {session.role === 'admin' && view === 'mesclagem' && (
          <Mesclagem
            duplicados={possiveisDuplicados}
            mesclagens={mesclagens}
            onMerge={async (duplicado, principal) => {
              const principalIsA = principal === 'a'
              const created = await createMesclagem({
                clientePrincipalId: principalIsA ? duplicado.clienteAId : duplicado.clienteBId,
                clientePrincipalNome: principalIsA ? duplicado.clienteANome : duplicado.clienteBNome,
                clienteMescladoId: principalIsA ? duplicado.clienteBId : duplicado.clienteAId,
                clienteMescladoNome: principalIsA ? duplicado.clienteBNome : duplicado.clienteANome,
                motivo: duplicado.motivo,
              })
              setMesclagens((current) => [created, ...current])
              setPossiveisDuplicados((current) => current.filter((item) => item.id !== duplicado.id))
              return created
            }}
          />
        )}
        {canUseScopedClientViews && view === 'campanhas' && (
          <Campanhas
            usuarios={usuarios}
            currentUser={session}
            initialCampanhaId={campaignToOpenId}
            inboxItems={campanhaInboxItems}
            inboxStatusFilter={campanhaInboxStatusFilter}
            inboxOwnerFilter={session.role === 'vendedor' ? session.id : campanhaInboxOwnerFilter}
            isLoadingInbox={isLoadingCampanhaInbox}
            onInboxStatusFilterChange={setCampanhaInboxStatusFilter}
            onInboxOwnerFilterChange={setCampanhaInboxOwnerFilter}
            onOpenInboxClient={async (clienteId) => {
              setSelectedClientId(clienteId)
              setView('cliente360')
            }}
            onOpenInboxBudget={async (item) => {
              const found = await listClientesPage({ page: 1, pageSize: 1, clienteIds: [item.clienteId] })
              const cliente = found.clientes[0]
              if (!cliente) return
              setClientes((current) => current.some((row) => row.id === cliente.id) ? current : [cliente, ...current])
              setSelectedClientId(cliente.id)
              setQuoteSourceView('campanhas')
              setQuoteOriginContext({
                kind: 'campanha',
                sourceId: item.campanhaId,
                label: item.campanhaNome ?? 'Campanha',
              })
              setView('orcamento-editor')
            }}
            onCreateInboxTask={async (item) => {
              const created = await createTarefa({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId,
                titulo: campaignTaskTitle(item.status),
                descricao: `Tratar resposta da campanha ${item.campanhaNome ?? item.campanhaId}. Status: ${campaignStatusLabel(item.status)}.`,
                dataVencimento: new Date().toISOString().slice(0, 10),
                prioridade: campaignTaskPriority(item.status),
                origem: `campanha:${item.campanhaId}:inbox:${item.status}`,
              })
              setTarefas((current) => [created, ...current])
              return created
            }}
            onUpdateInboxStatus={async (item, status) => {
              const updated = await upsertCampanhaEnvio({
                campanhaId: item.campanhaId,
                campanhaNome: item.campanhaNome,
                clienteId: item.clienteId,
                vendedorId: item.vendedorId,
                telefone: item.telefone,
                mensagemFinal: item.mensagemFinal,
                status,
              })
              await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'Campanha',
                tipo: 'campanha_inbox',
                resumo: campaignSummary(status, item.mensagemFinal),
                resultado: status,
                campanhaId: item.campanhaId,
              })
              setCampanhaInboxItems((current) => current.map((row) => row.id === item.id ? { ...item, ...updated, clienteNome: item.clienteNome, clienteCidade: item.clienteCidade, clienteUf: item.clienteUf } : row))
            }}
            onOpenBudgetEditor={(cliente, originContext) => {
              setClientes((current) =>
                current.some((item) => item.id === cliente.id) ? current : [cliente, ...current],
              )
              setSelectedClientId(cliente.id)
              setQuoteSourceView('campanhas')
              setQuoteOriginContext(originContext)
              setView('orcamento-editor')
            }}
            onAddInteraction={async (interacao) => {
              const created = await createInteracao(interacao)
              setInteracoes((current) => [created, ...current])
              return created
            }}
            onAddTask={async (task) => {
              const created = await createTarefa(task)
              setTarefas((current) => [created, ...current])
              return created
            }}
          />
        )}
        {canUseScopedClientViews && view === 'campanhas-inbox' && (
          <CampanhasInbox
            items={campanhaInboxItems}
            usuarios={usuarios}
            currentUser={session}
            statusFilter={campanhaInboxStatusFilter}
            ownerFilter={session.role === 'vendedor' ? session.id : campanhaInboxOwnerFilter}
            isLoading={isLoadingCampanhaInbox}
            onStatusFilterChange={setCampanhaInboxStatusFilter}
            onOwnerFilterChange={setCampanhaInboxOwnerFilter}
            onOpenClient={async (clienteId) => {
              setSelectedClientId(clienteId)
              setView('cliente360')
            }}
            onOpenBudget={async (item) => {
              const found = await listClientesPage({ page: 1, pageSize: 1, clienteIds: [item.clienteId] })
              const cliente = found.clientes[0]
              if (!cliente) return
              setClientes((current) => current.some((row) => row.id === cliente.id) ? current : [cliente, ...current])
              setSelectedClientId(cliente.id)
              setQuoteSourceView('campanhas-inbox')
              setQuoteOriginContext({
                kind: 'campanha',
                sourceId: item.campanhaId,
                label: item.campanhaNome ?? 'Campanha',
              })
              setView('orcamento-editor')
            }}
            onCreateTask={async (item) => {
              const created = await createTarefa({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId,
                titulo: campaignTaskTitle(item.status),
                descricao: `Tratar resposta da campanha ${item.campanhaNome ?? item.campanhaId}. Status: ${campaignStatusLabel(item.status)}.`,
                dataVencimento: tomorrowDate(),
                prioridade: campaignTaskPriority(item.status),
                origem: `campanha:${item.campanhaId}:inbox:${item.status}`,
              })
              setTarefas((current) => [created, ...current])
              return created
            }}
            onUpdateStatus={async (item, status) => {
              const updated = await upsertCampanhaEnvio({
                campanhaId: item.campanhaId,
                campanhaNome: item.campanhaNome,
                clienteId: item.clienteId,
                vendedorId: item.vendedorId,
                telefone: item.telefone,
                mensagemFinal: item.mensagemFinal,
                status,
              })
              const interacao = await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'Campanha',
                tipo: 'campanha_inbox',
                resumo: campaignSummary(status, item.mensagemFinal),
                resultado: status,
                campanhaId: item.campanhaId,
              })
              setInteracoes((current) => [interacao, ...current])
              setCampanhaInboxItems((current) => current.map((row) => row.id === item.id ? { ...item, ...updated, clienteNome: item.clienteNome, clienteCidade: item.clienteCidade, clienteUf: item.clienteUf } : row))
            }}
          />
        )}
        {canUseScopedClientViews && view === 'orcamentos' && (
          <Orcamentos
            clientes={scopedClientes}
            orcamentos={orcamentos}
            usuarios={usuarios}
            currentUser={session}
            catalogo={catalogo}
            preparedQuoteContext={quoteOriginContext}
            page={orcamentosPage}
            pageSize={50}
            total={orcamentosTotal}
            statusFilter={orcamentosFilter}
            isLoading={isLoadingOrcamentos}
            onPageChange={setOrcamentosPage}
            onStatusFilterChange={(filter) => {
              setOrcamentosFilter(filter)
              setOrcamentosPage(1)
            }}
            onOpenDetail={(orcamento) => {
              setSelectedOrcamentoId(orcamento.id)
              setSelectedClientId(orcamento.clienteId)
              setView('orcamento-detalhe')
            }}
            onCreateLooseBudget={(cliente) => {
              setClientes((current) =>
                current.some((item) => item.id === cliente.id) ? current : [cliente, ...current],
              )
              setSelectedClientId(cliente.id)
              setQuoteSourceView('orcamentos')
              setQuoteOriginContext((current) =>
                current.initialItems?.length
                  ? { ...current, label: current.label || 'Orcamento avulso' }
                  : { kind: 'cliente', label: 'Orcamento avulso' },
              )
              setView('orcamento-editor')
            }}
            onRevise={async (id, input) => {
              const revised = await reviseOrcamento(id, input, input.itens)
              setOrcamentos((current) => current.map((orcamento) => (orcamento.id === id ? revised : orcamento)))
              return revised
            }}
            onStatusChange={(id, status, motivoPerda) => {
              const changedOrcamento = orcamentos.find((orcamento) => orcamento.id === id)
              updateOrcamentoStatus(id, status, motivoPerda, status === 'enviado' ? session.id : undefined).catch((exception) => {
                setModuleError('orcamentos', exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o orcamento.')
              })
              if (status === 'ganho' && changedOrcamento) {
                attributeCampanhaRevenueByOrcamento(id, changedOrcamento.valorTotal)
                  .catch((exception) => {
                    setModuleError('orcamentos', exception instanceof Error ? exception.message : 'Nao foi possivel atribuir receita da campanha.')
                  })
              }
              setOrcamentos((current) =>
                current.map((orcamento) =>
                  orcamento.id === id
                    ? {
                        ...orcamento,
                        status,
                        motivoPerda,
                        aprovadoPor: status === 'enviado' ? session.id : orcamento.aprovadoPor,
                        aprovadoEm: status === 'enviado' ? new Date().toISOString() : orcamento.aprovadoEm,
                      }
                    : orcamento,
                ),
              )
            }}
          />
        )}
        {canUseScopedClientViews && view === 'orcamento-detalhe' && selectedOrcamento && (
          <OrcamentoWorkspace
            orcamento={selectedOrcamento}
            cliente={clientes.find((item) => item.id === selectedOrcamento.clienteId) ?? clienteFromOrcamento(selectedOrcamento)}
            vendedor={usuarios.find((item) => item.id === selectedOrcamento.vendedorId)}
            currentUser={session}
            catalogo={catalogo}
            onBack={() => setView('orcamentos')}
            onRevise={async (id, input) => {
              const revised = await reviseOrcamento(id, input, input.itens)
              setOrcamentos((current) => current.map((orcamento) => (orcamento.id === id ? revised : orcamento)))
              return revised
            }}
            onStatusChange={async (status, motivoPerda) => {
              await updateOrcamentoStatus(selectedOrcamento.id, status, motivoPerda, status === 'enviado' ? session.id : undefined)
              if (status === 'ganho') {
                await attributeCampanhaRevenueByOrcamento(selectedOrcamento.id, selectedOrcamento.valorTotal)
              }
              setOrcamentos((current) =>
                current.map((orcamento) =>
                  orcamento.id === selectedOrcamento.id
                    ? {
                        ...orcamento,
                        status,
                        motivoPerda,
                        aprovadoPor: status === 'enviado' ? session.id : orcamento.aprovadoPor,
                        aprovadoEm: status === 'enviado' ? new Date().toISOString() : orcamento.aprovadoEm,
                      }
                    : orcamento,
                ),
              )
            }}
          />
        )}
        {canUseScopedClientViews && view === 'orcamento-detalhe' && !selectedOrcamento && (
          <section className="panel wide">
            <div className="empty-state">
              Orcamento nao encontrado na pagina atual.
              <button className="button" type="button" onClick={() => setView('orcamentos')}>Voltar para orcamentos</button>
            </div>
          </section>
        )}
        {canUseScopedClientViews && view === 'catalogo' && (
          <Catalogo
            itens={isSupabaseConfigured ? catalogoLista : catalogo}
            total={isSupabaseConfigured ? catalogoTotal : catalogo.length}
            page={catalogoPage}
            pageSize={50}
            query={catalogoQuery}
            tipoFilter={catalogoTipoFilter}
            ativoFilter={catalogoAtivoFilter}
            isLoading={isLoadingCatalogo}
            onQueryChange={(nextQuery) => {
              setCatalogoQuery(nextQuery)
              setCatalogoPage(1)
            }}
            onTipoFilterChange={(filter) => {
              setCatalogoTipoFilter(filter)
              setCatalogoPage(1)
            }}
            onAtivoFilterChange={(filter) => {
              setCatalogoAtivoFilter(filter)
              setCatalogoPage(1)
            }}
            onPageChange={setCatalogoPage}
            onQuoteItem={(item) => {
              setQuoteSourceView('catalogo')
              setQuoteOriginContext({
                kind: 'cliente',
                label: `Catalogo ${item.codigo}`,
                initialItems: [quoteItemFromCatalogo(item)],
              })
              setView('orcamentos')
            }}
          />
        )}
        {session.role === 'admin' && view === 'relatorios' && (
          <Relatorios
            clientes={clientes}
            resumo={dashboardResumo}
            vendedoresResumo={vendedoresResumo}
            rankingMedidas={rankingMedidas}
            rankingServicos={rankingServicos}
            funilGerencial={funilGerencial}
            motivosPerda={motivosPerda}
            atividadesDia={atividadesDia}
            forecastVendedor={forecastVendedor}
            interacoes={interacoes}
            orcamentos={orcamentos}
            importacoes={importacoes}
            conflitos={conflitos}
            usuarios={usuarios}
            tarefas={tarefas}
            oportunidades={oportunidades}
            campanhasVendedorResumo={campanhasVendedorResumo}
            vendasItens={scopedVendasItens}
            servicosItens={scopedServicosItens}
          />
        )}
        {session.role === 'admin' && view === 'vendedores' && (
          <VendedoresCarteira
            clientes={clientes}
            usuarios={usuarios}
            vendedoresResumo={vendedoresResumo}
            vendedoresHistoricosResumo={vendedoresHistoricosResumo}
            tarefas={tarefas}
            orcamentos={orcamentos}
            onAssignClient={(clienteId, vendedorId) => {
              assignClienteVendedor(clienteId, vendedorId).catch((exception) => {
                setModuleError('vendedores', exception instanceof Error ? exception.message : 'Nao foi possivel atribuir vendedor.')
              })
              setClientes((current) =>
                current.map((cliente) => {
                  if (cliente.id !== clienteId) return cliente
                  const vendedor = usuarios.find((item) => item.id === vendedorId)
                  return { ...cliente, vendedorId, vendedorNome: vendedor?.nome }
                }),
              )
            }}
            onAssignFiltered={async (filters, vendedorId) => {
              const updated = await assignClientesVendedorByFilter({ ...filters, vendedorIdDestino: vendedorId })
              const [resumo, historicos] = await Promise.all([listVendedoresResumo(), listVendedoresHistoricosResumo()])
              setVendedoresResumo(resumo)
              setVendedoresHistoricosResumo(historicos)
              return updated
            }}
          />
        )}
        {session.role === 'admin' && view === 'usuarios' && (
          <Usuarios
            clientes={clientes}
            usuarios={usuarios}
            resumo={dashboardResumo}
            vendedoresResumo={vendedoresResumo}
            onAssignClient={(clienteId, vendedorId) => {
              assignClienteVendedor(clienteId, vendedorId).catch((exception) => {
                setModuleError('usuarios', exception instanceof Error ? exception.message : 'Nao foi possivel atribuir vendedor.')
              })
              setClientes((current) =>
                current.map((cliente) => {
                  if (cliente.id !== clienteId) return cliente
                  const vendedor = usuarios.find((item) => item.id === vendedorId)
                  return { ...cliente, vendedorId, vendedorNome: vendedor?.nome }
                }),
              )
            }}
          />
        )}
        {session.role === 'admin' && view === 'auditoria' && <Auditoria alteracoes={alteracoes} />}
      </main>
    </div>
  )
}

function titleFor(view: string) {
  const titles: Record<string, string> = {
    cockpit: 'Cockpit diario',
    dashboard: 'Cockpit diario',
    clientes: 'Base unica de clientes',
    rodobens: 'Clientes sem cadastro',
    'orcamento-editor': 'Editor de proposta',
    'orcamento-detalhe': 'Proposta comercial',
    carteira: 'Base unica de clientes',
    oportunidades: 'Oportunidades automaticas',
    tarefas: 'Tarefas e proximas acoes',
    importacoes: 'Controle de importacoes',
    conflitos: 'Controle de importacoes',
    mesclagem: 'Controle de importacoes',
    campanhas: 'Campanhas e respostas',
    'campanhas-inbox': 'Campanhas e respostas',
    orcamentos: 'Orcamentos e conversao',
    catalogo: 'Catalogo e precos',
    relatorios: 'Relatorios gerenciais',
    usuarios: 'Usuarios e permissoes',
    auditoria: 'Auditoria',
    cliente360: 'Ficha 360 do cliente',
  }
  return titles[view]
}

function Login({ usuarios, onLogin }: { usuarios: Vendedor[]; onLogin: (session: SessaoUsuario) => void }) {
  const [email, setEmail] = useState(
    () => {
      const lastEmail = localStorage.getItem('capital-crm:last-email')
      if (lastEmail && usuarios.some((usuario) => usuario.email === lastEmail)) return lastEmail
      return usuarios[0]?.email ?? seedVendedores[0].email
    },
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (usuarios.some((usuario) => usuario.email === email)) return
    setEmail(usuarios[0]?.email ?? seedVendedores[0].email)
  }, [email, usuarios])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session = await signInWithPassword(email, password)
      onLogin(session)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-screen">
        <section className="login-panel">
          <div className="brand login-brand">
            <BrandLogo />
            <div>
              <strong>Capital Truck CRM</strong>
              <span>Central de carteira</span>
          </div>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label>
            Usuario
            <select value={email} onChange={(event) => setEmail(event.target.value)}>
              {usuarios.map((usuario) => <option key={usuario.id} value={usuario.email}>{usuario.nome} · {usuario.role}</option>)}
            </select>
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSupabaseConfigured ? 'Senha do Supabase Auth' : 'Opcional no modo local'}
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="login-note">
          {isSupabaseConfigured ? 'Usando Supabase Auth.' : 'Modo local: escolha um perfil demonstrativo.'}
        </p>
      </section>
    </main>
  )
}

function Cockpit({
  currentUser,
  usuarios,
  tarefas,
  tarefasVencidas,
  orcamentos,
  rodobens,
  oportunidades,
  campanhas,
  slaVendedores,
  isLoading,
  onOpenClient,
  onOpenBudget,
  onOpenModule,
  onCompleteTask,
  onRescheduleTask,
  onRunFollowupAutomations,
}: {
  currentUser: SessaoUsuario
  usuarios: Vendedor[]
  tarefas: Tarefa[]
  tarefasVencidas: Tarefa[]
  orcamentos: Orcamento[]
  rodobens: Cliente[]
  oportunidades: Oportunidade[]
  campanhas: CampanhaInboxItem[]
  slaVendedores: TarefaSlaVendedorResumo[]
  isLoading: boolean
  onOpenClient: (clienteId: string) => Promise<void>
  onOpenBudget: (clienteId: string, originContext: QuoteOriginContext) => Promise<void>
  onOpenModule: (target: 'tarefas' | 'orcamentos' | 'rodobens' | 'oportunidades' | 'campanhas') => void
  onCompleteTask: (id: string) => Promise<void>
  onRescheduleTask: (id: string, dataVencimento: string, motivo: string) => Promise<void>
  onRunFollowupAutomations: () => Promise<{ total: number; orcamentos: number; campanhas: number }>
}) {
  const [busyTaskId, setBusyTaskId] = useState('')
  const [rescheduleTarget, setRescheduleTarget] = useState<Tarefa | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState(tomorrowDate())
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')
  const [slaAlertLimit, setSlaAlertLimit] = useState(3)
  const [isRunningFollowups, setIsRunningFollowups] = useState(false)
  const [followupAutomationMessage, setFollowupAutomationMessage] = useState('')
  const todayTasks = tarefas.filter((tarefa) => daysSince(tarefa.dataVencimento) >= 0)
  const highPriorityTasks = tarefas
    .filter((tarefa) => tarefa.prioridade >= 80 && !todayTasks.some((item) => item.id === tarefa.id))
    .slice(0, 4)
  const criticalTasks = [...tarefasVencidas, ...todayTasks, ...highPriorityTasks].slice(0, 10)
  const ownerLabel = currentUser.role === 'admin' ? 'Visao gerencial' : `Fila de ${currentUser.nome.split(' ')[0]}`
  const slaBySeller = new Map(slaVendedores.map((item) => [item.vendedorId, item]))
  const workload = usuarios
    .filter((usuario) => usuario.role === 'vendedor')
    .map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      tarefas: slaBySeller.get(usuario.id)?.tarefasAbertas ?? [...tarefas, ...tarefasVencidas].filter((tarefa) => tarefa.vendedorId === usuario.id).length,
      atrasadas: slaBySeller.get(usuario.id)?.atrasadas ?? tarefasVencidas.filter((tarefa) => tarefa.vendedorId === usuario.id).length,
      campanhas: campanhas.filter((envio) => envio.vendedorId === usuario.id).length,
      criticas: slaBySeller.get(usuario.id)?.altaPrioridade ?? criticalTasks.filter((tarefa) => tarefa.vendedorId === usuario.id && taskSla(tarefa).tone === 'danger').length,
      vencemHoje: slaBySeller.get(usuario.id)?.vencemHoje ?? 0,
      origemCritica: sellerCriticalOrigin(slaBySeller.get(usuario.id)),
    }))
    .sort((a, b) => b.atrasadas - a.atrasadas || b.tarefas - a.tarefas)
  const slaAlerts = workload.filter((item) => item.atrasadas >= slaAlertLimit || item.criticas >= slaAlertLimit)
  const nextActions = [
    ...campanhas.map((envio) => ({
      id: `campanha-${envio.id}`,
      kind: 'campanha' as const,
      priority: envio.status === 'respondeu' ? 120 : 108,
      title: envio.clienteNome,
      label: envio.status === 'respondeu' ? 'Responder campanha' : 'Tratar campanha',
      subtitle: `${envio.campanhaNome ?? 'Campanha'} - ${campaignStatusLabel(envio.status)}`,
      detail: envio.mensagemFinal,
      clienteId: envio.clienteId,
      envio,
    })),
    ...criticalTasks.map((tarefa) => {
      const sla = taskSla(tarefa)
      return {
        id: `tarefa-${tarefa.id}`,
        kind: 'tarefa' as const,
        priority: tarefa.prioridade + (sla.tone === 'danger' ? 20 : sla.tone === 'warn' ? 10 : 0),
        title: tarefa.titulo,
        label: sla.tone === 'danger' ? 'Tarefa critica' : 'Tarefa',
        subtitle: `${tarefa.clienteNome} - ${dateLabel(tarefa.dataVencimento)}`,
        detail: tarefa.descricao ?? `Prioridade ${tarefa.prioridade}`,
        clienteId: tarefa.clienteId,
        tarefa,
        sla,
      }
    }),
    ...orcamentos.map((orcamento) => ({
      id: `orcamento-${orcamento.id}`,
      kind: 'orcamento' as const,
      priority: 96 + Math.min(Math.max(daysSince(orcamento.validade), 0), 30),
      title: orcamento.clienteNome ?? 'Cliente',
      label: 'Retomar proposta',
      subtitle: `${money(orcamento.valorTotal)} - venceu ${dateLabel(orcamento.validade)}`,
      detail: orcamento.observacao ?? 'Proposta vencida ainda aberta.',
      clienteId: orcamento.clienteId,
      orcamento,
    })),
    ...rodobens.map((cliente) => ({
      id: `externo-${cliente.id}`,
      kind: 'lead' as const,
      priority: 82,
      title: cliente.nome,
      label: 'Qualificar lista externa',
      subtitle: `${cliente.cidade}/${cliente.uf} - ${cliente.whatsapp ?? 'sem WhatsApp'}`,
      detail: origemDetalheLabel(cliente),
      clienteId: cliente.id,
      cliente,
    })),
    ...oportunidades.slice(0, 10).map((oportunidade) => ({
      id: `oportunidade-${oportunidade.id}`,
      kind: 'oportunidade' as const,
      priority: oportunidade.prioridade,
      title: oportunidade.clienteNome,
      label: opportunityTypeLabel(oportunidade.tipo),
      subtitle: `Prioridade ${oportunidade.prioridade}`,
      detail: oportunidade.proximaAcao || oportunidade.motivo,
      clienteId: oportunidade.clienteId,
      oportunidade,
    })),
  ].sort((a, b) => b.priority - a.priority).slice(0, 14)

  async function complete(id: string) {
    setBusyTaskId(id)
    try {
      await onCompleteTask(id)
    } finally {
      setBusyTaskId('')
    }
  }

  function openReschedule(tarefa: Tarefa) {
    setRescheduleTarget(tarefa)
    setRescheduleDate(tomorrowDate())
    setRescheduleReason('')
    setRescheduleError('')
  }

  async function submitReschedule() {
    if (!rescheduleTarget) return
    if (!rescheduleReason.trim()) {
      setRescheduleError('Informe o motivo do reagendamento.')
      return
    }

    setBusyTaskId(rescheduleTarget.id)
    setRescheduleError('')
    try {
      await onRescheduleTask(rescheduleTarget.id, rescheduleDate, rescheduleReason.trim())
      setRescheduleTarget(null)
    } catch (exception) {
      setRescheduleError(exception instanceof Error ? exception.message : 'Nao foi possivel reagendar a tarefa.')
    } finally {
      setBusyTaskId('')
    }
  }

  async function runFollowups() {
    setIsRunningFollowups(true)
    setFollowupAutomationMessage('')
    try {
      const result = await onRunFollowupAutomations()
      setFollowupAutomationMessage(
        `${result.total} tarefas sincronizadas: ${result.orcamentos} orcamentos vencidos e ${result.campanhas} respostas de campanha.`,
      )
    } catch (exception) {
      setFollowupAutomationMessage(exception instanceof Error ? exception.message : 'Nao foi possivel gerar follow-ups.')
    } finally {
      setIsRunningFollowups(false)
    }
  }

  return (
    <section className="cockpit-layout">
      <section className="panel wide cockpit-hero">
        <div>
          <p className="eyebrow">Cockpit diario</p>
          <h2>{ownerLabel}</h2>
          <p>Priorize respostas, propostas vencidas, tarefas e leads sem precisar procurar modulo por modulo.</p>
        </div>
        <div className="cockpit-kpis">
          <Info label="Atrasadas" value={tarefasVencidas.length.toString()} />
          <Info label="Hoje/prioridade" value={todayTasks.length.toString()} />
          <Info label="Respostas campanha" value={campanhas.length.toString()} />
          <Info label="Orc. vencidos" value={orcamentos.length.toString()} />
          <Info label="Sem cadastro" value={rodobens.length.toString()} />
        </div>
      </section>

      {isLoading && <div className="empty-state compact">Carregando cockpit comercial...</div>}

      <section className="panel wide cockpit-next-actions">
        <div className="panel-header">
          <div>
            <h2>Proxima acao</h2>
            <p>Fila unica para trabalhar sem alternar entre modulos.</p>
          </div>
          <div className="toolbar-actions">
            <button className="button" type="button" onClick={() => onOpenModule('tarefas')}>Tarefas</button>
            <button className="button" type="button" onClick={() => onOpenModule('orcamentos')}>Propostas</button>
            <button className="button" type="button" onClick={() => onOpenModule('campanhas')}>Campanhas</button>
          </div>
        </div>
        <div className="next-action-list">
          {nextActions.map((item, index) => (
            <article className={`next-action-card ${item.kind}`} key={item.id}>
              <div className="next-action-rank">{index + 1}</div>
              <div className="next-action-content">
                <div>
                  <span className="next-action-label">{item.label}</span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </div>
                <p>{item.detail}</p>
              </div>
              <div className="next-action-actions">
                <button className="button" type="button" onClick={() => onOpenClient(item.clienteId)}>Ficha</button>
                {item.kind === 'campanha' && (
                  <>
                    {item.envio.telefone && (
                      <a
                        className="button"
                        href={`https://wa.me/${item.envio.telefone}?text=${encodeURIComponent(item.envio.mensagemFinal)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => onOpenBudget(item.clienteId, { kind: 'campanha', sourceId: item.envio.campanhaId, label: item.envio.campanhaNome ?? 'Campanha' })}
                    >
                      Orcar
                    </button>
                  </>
                )}
                {item.kind === 'tarefa' && (
                  <>
                    <button className="button" type="button" onClick={() => openReschedule(item.tarefa)}>Reagendar</button>
                    <button className="button primary" type="button" disabled={busyTaskId === item.tarefa.id} onClick={() => complete(item.tarefa.id)}>
                      {busyTaskId === item.tarefa.id ? 'Concluindo...' : 'Concluir'}
                    </button>
                  </>
                )}
                {item.kind === 'orcamento' && (
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => onOpenBudget(item.clienteId, { kind: 'cliente', sourceId: item.orcamento.id, label: 'Retomada de proposta vencida' })}
                  >
                    Revisar
                  </button>
                )}
                {item.kind === 'lead' && (
                  <button className="button primary" type="button" onClick={() => onOpenClient(item.clienteId)}>Qualificar</button>
                )}
                {item.kind === 'oportunidade' && (
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => onOpenBudget(item.clienteId, { kind: 'cliente', sourceId: item.oportunidade.id, label: item.oportunidade.proximaAcao || 'Oportunidade' })}
                  >
                    Orcar
                  </button>
                )}
              </div>
            </article>
          ))}
          {nextActions.length === 0 && <div className="empty-state compact">Nenhuma acao urgente agora.</div>}
        </div>
      </section>

      <section className="panel cockpit-section">
        <div className="panel-header">
          <div>
            <h2>Responder agora</h2>
            <p>Campanhas com resposta ou pedido de orcamento.</p>
          </div>
          <button className="button" type="button" onClick={() => onOpenModule('campanhas')}>Abrir campanhas</button>
        </div>
        <div className="cockpit-list">
          {campanhas.map((envio) => (
            <article className="cockpit-card" key={envio.id}>
              <div>
                <strong>{envio.clienteNome}</strong>
                <small>{envio.campanhaNome ?? 'Campanha'} - {campaignStatusLabel(envio.status)}</small>
              </div>
              <p>{envio.mensagemFinal}</p>
              <div className="row-actions">
                <button className="button" type="button" onClick={() => onOpenClient(envio.clienteId)}>Ficha</button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => onOpenBudget(envio.clienteId, { kind: 'campanha', sourceId: envio.campanhaId, label: envio.campanhaNome ?? 'Campanha' })}
                >
                  Orcamento
                </button>
              </div>
            </article>
          ))}
          {campanhas.length === 0 && <div className="empty-state compact">Nenhuma resposta de campanha pendente.</div>}
        </div>
      </section>

      <section className="panel cockpit-section">
        <div className="panel-header">
          <div>
            <h2>Tarefas criticas</h2>
            <p>Atrasadas, vencendo hoje e alta prioridade.</p>
          </div>
          <button className="button" type="button" onClick={() => onOpenModule('tarefas')}>Abrir tarefas</button>
        </div>
        <div className="cockpit-list">
          {criticalTasks.map((tarefa) => {
            const sla = taskSla(tarefa)
            return (
            <article className={sla.tone === 'danger' ? 'cockpit-card danger' : 'cockpit-card'} key={tarefa.id}>
              <div>
                <strong>{tarefa.titulo}</strong>
                <small>{tarefa.clienteNome} - {dateLabel(tarefa.dataVencimento)} - prioridade {tarefa.prioridade}</small>
              </div>
              <span className={`sla-pill ${sla.tone}`}>{sla.label}</span>
              {tarefa.descricao && <p>{tarefa.descricao}</p>}
              <div className="row-actions">
                <button className="button" type="button" onClick={() => onOpenClient(tarefa.clienteId)}>Ficha</button>
                <button
                  className="button primary"
                  type="button"
                  disabled={busyTaskId === tarefa.id}
                  onClick={() => complete(tarefa.id)}
                >
                  {busyTaskId === tarefa.id ? 'Concluindo...' : 'Concluir'}
                </button>
                <button className="button" type="button" onClick={() => openReschedule(tarefa)}>
                  Reagendar
                </button>
              </div>
            </article>
            )
          })}
          {criticalTasks.length === 0 && <div className="empty-state compact">Sem tarefas criticas agora.</div>}
        </div>
      </section>

      <section className="panel cockpit-section">
        <div className="panel-header">
          <div>
            <h2>Propostas para retomar</h2>
            <p>Orcamentos vencidos ainda abertos.</p>
          </div>
          <button className="button" type="button" onClick={() => onOpenModule('orcamentos')}>Abrir orcamentos</button>
        </div>
        <div className="cockpit-list">
          {orcamentos.map((orcamento) => (
            <article className="cockpit-card" key={orcamento.id}>
              <div>
                <strong>{orcamento.clienteNome ?? 'Cliente'}</strong>
                <small>{money(orcamento.valorTotal)} - venceu {dateLabel(orcamento.validade)}</small>
              </div>
              <div className="row-actions">
                <button className="button" type="button" onClick={() => onOpenClient(orcamento.clienteId)}>Ficha</button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => onOpenBudget(orcamento.clienteId, { kind: 'cliente', sourceId: orcamento.id, label: 'Retomada de proposta vencida' })}
                >
                  Revisar proposta
                </button>
              </div>
            </article>
          ))}
          {orcamentos.length === 0 && <div className="empty-state compact">Nenhum orcamento vencido na fila.</div>}
        </div>
      </section>

      <section className="panel cockpit-section">
        <div className="panel-header">
          <div>
            <h2>Leads e oportunidades</h2>
            <p>Listas externas sem cadastro e oportunidades cacheadas.</p>
          </div>
          <div className="toolbar-actions">
            <button className="button" type="button" onClick={() => onOpenModule('rodobens')}>Sem cadastro</button>
            <button className="button" type="button" onClick={() => onOpenModule('oportunidades')}>Oportunidades</button>
          </div>
        </div>
        <div className="cockpit-list two-col">
          {rodobens.map((cliente) => (
            <article className="cockpit-card" key={cliente.id}>
              <div>
                <strong>{cliente.nome}</strong>
                <small>{cliente.cidade}/{cliente.uf} - {cliente.whatsapp ?? 'sem WhatsApp'}</small>
              </div>
              <button className="button primary" type="button" onClick={() => onOpenClient(cliente.id)}>Qualificar</button>
            </article>
          ))}
          {oportunidades.map((oportunidade) => (
            <article className="cockpit-card" key={oportunidade.id}>
              <div>
                <strong>{oportunidade.clienteNome}</strong>
                <small>{opportunityTypeLabel(oportunidade.tipo)} - prioridade {oportunidade.prioridade}</small>
              </div>
              <p>{oportunidade.proximaAcao}</p>
            </article>
          ))}
          {rodobens.length + oportunidades.length === 0 && <div className="empty-state compact">Sem leads ou oportunidades novas agora.</div>}
        </div>
      </section>

      {currentUser.role === 'admin' && (
        <section className="panel wide cockpit-alerts">
          <div className="panel-header">
            <div>
              <h2>Alertas de SLA</h2>
              <p>Vendedores acima do limite operacional configurado nesta visao.</p>
            </div>
            <div className="toolbar-actions">
              <button className="button" type="button" disabled={isRunningFollowups} onClick={runFollowups}>
                <RefreshCw size={15} />
                {isRunningFollowups ? 'Gerando...' : 'Gerar follow-ups'}
              </button>
              <label className="mini-select">
                <Gauge size={15} />
                <select value={slaAlertLimit} onChange={(event) => setSlaAlertLimit(Number(event.target.value))}>
                  <option value={1}>Alertar com 1+</option>
                  <option value={3}>Alertar com 3+</option>
                  <option value={5}>Alertar com 5+</option>
                  <option value={10}>Alertar com 10+</option>
                </select>
              </label>
            </div>
          </div>
          {followupAutomationMessage && <div className="success-alert">{followupAutomationMessage}</div>}
          <div className="alert-grid">
            {slaAlerts.map((item) => (
              <article className="sla-alert-card" key={item.id}>
                <div>
                  <strong>{item.nome}</strong>
                  <small>{item.origemCritica}</small>
                </div>
                <span className="sla-pill danger">{item.atrasadas} atrasadas</span>
                <span className="sla-pill warn">{item.vencemHoje} hoje</span>
                <button
                  className="button"
                  type="button"
                  onClick={() => onOpenModule('tarefas')}
                >
                  Abrir fila
                </button>
              </article>
            ))}
            {slaAlerts.length === 0 && <div className="empty-state compact">Nenhum vendedor acima do limite selecionado.</div>}
          </div>
        </section>
      )}

      {currentUser.role === 'admin' && (
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Carga por vendedor</h2>
              <p>Primeiro sinal gerencial de atraso e respostas em aberto.</p>
            </div>
            <UserRound size={18} />
          </div>
          <div className="table">
            <div className="table-head five">
              <span>Vendedor</span>
              <span>Tarefas</span>
              <span>Atrasadas</span>
              <span>Respostas</span>
              <span>SLA critico</span>
            </div>
            {workload.map((item) => (
              <div className="table-row five" key={item.id}>
                <span><strong>{item.nome}</strong></span>
                <span>{item.tarefas}</span>
                <span>
                  <strong className={item.atrasadas > 0 ? 'score danger' : 'score'}>{item.atrasadas}</strong>
                  <small>{item.vencemHoje} vencem hoje</small>
                </span>
                <span>{item.campanhas}</span>
                <span>
                  <strong className={item.criticas > 0 ? 'score danger' : 'score'}>{item.criticas}</strong>
                  <small>{item.origemCritica}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {rescheduleTarget && (
        <section className="floating-panel">
          <div className="panel-header">
            <div>
              <h2>Reagendar tarefa</h2>
              <p>{rescheduleTarget.titulo} - {rescheduleTarget.clienteNome}</p>
            </div>
            <button className="button" type="button" onClick={() => setRescheduleTarget(null)}>Fechar</button>
          </div>
          <div className="task-form compact-form">
            <label>
              Nova data
              <input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
            </label>
            <label className="span-2">
              Motivo
              <textarea value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} placeholder="Ex.: cliente pediu retorno amanha" />
            </label>
            <button className="button primary" type="button" disabled={busyTaskId === rescheduleTarget.id} onClick={submitReschedule}>
              {busyTaskId === rescheduleTarget.id ? 'Reagendando...' : 'Salvar reagendamento'}
            </button>
          </div>
          {rescheduleError && <div className="alert">{rescheduleError}</div>}
        </section>
      )}
    </section>
  )
}

function CampanhasInbox({
  items,
  usuarios,
  currentUser,
  statusFilter,
  ownerFilter,
  isLoading,
  embedded = false,
  onStatusFilterChange,
  onOwnerFilterChange,
  onOpenClient,
  onOpenBudget,
  onCreateTask,
  onUpdateStatus,
}: {
  items: CampanhaInboxItem[]
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
  statusFilter: CampanhaEnvioStatus | 'todos'
  ownerFilter: string
  isLoading: boolean
  embedded?: boolean
  onStatusFilterChange: (status: CampanhaEnvioStatus | 'todos') => void
  onOwnerFilterChange: (ownerId: string) => void
  onOpenClient: (clienteId: string) => Promise<void>
  onOpenBudget: (item: CampanhaInboxItem) => Promise<void>
  onCreateTask: (item: CampanhaInboxItem) => Promise<Tarefa>
  onUpdateStatus: (item: CampanhaInboxItem, status: CampanhaEnvioStatus) => Promise<void>
}) {
  const [busyId, setBusyId] = useState('')
  const actionable = items.filter((item) => ['respondeu', 'virou_orcamento', 'enviado', 'nao_respondeu'].includes(item.status))
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {})

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id)
    try {
      await action()
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className={embedded ? 'campaign-inbox-embedded' : 'panel wide'}>
      <div className="panel-header">
        <div>
          <h2>Inbox de campanhas</h2>
          <p>Fila operacional para tratar respostas, retornos, orcamentos e perdas sem voltar para a montagem da campanha.</p>
        </div>
        <div className="toolbar-actions">
          <label className="mini-select">
            <Filter size={15} />
            <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as CampanhaEnvioStatus | 'todos')}>
              <option value="todos">Todos os status</option>
              <option value="respondeu">Responderam</option>
              <option value="virou_orcamento">Virou orcamento</option>
              <option value="enviado">Enviados</option>
              <option value="nao_respondeu">Nao respondeu</option>
              <option value="pendente">Pendentes</option>
              <option value="ganhou">Ganhos</option>
              <option value="perdido">Perdidos</option>
              <option value="nao_contatar">Nao contatar</option>
            </select>
          </label>
          {currentUser.role === 'admin' && (
            <label className="mini-select">
              <UserRound size={15} />
              <select value={ownerFilter} onChange={(event) => onOwnerFilterChange(event.target.value)}>
                <option value="">Todos vendedores</option>
                {usuarios.map((usuario) => <option value={usuario.id} key={usuario.id}>{usuario.nome}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="info-grid campaign-summary">
        <Info label="Na fila" value={actionable.length.toString()} />
        <Info label="Responderam" value={(counts.respondeu ?? 0).toString()} />
        <Info label="Orcamentos" value={(counts.virou_orcamento ?? 0).toString()} />
        <Info label="Sem resposta" value={(counts.nao_respondeu ?? 0).toString()} />
        <Info label="Ganhos" value={(counts.ganhou ?? 0).toString()} />
        <Info label="Perdidos" value={(counts.perdido ?? 0).toString()} />
      </div>

      {isLoading && <div className="empty-state">Carregando inbox de campanhas...</div>}
      {!isLoading && (
        <div className="table">
          <div className="table-head campaign-inbox-row">
            <span>Cliente</span>
            <span>Campanha</span>
            <span>Status</span>
            <span>Mensagem</span>
            <span>Acoes</span>
          </div>
          {items.map((item) => (
            <div className="table-row campaign-inbox-row" key={item.id}>
              <span>
                <strong>{item.clienteNome}</strong>
                <small>{[item.clienteCidade, item.clienteUf].filter(Boolean).join('/') || item.telefone || 'Sem localizacao'}</small>
              </span>
              <span>
                <strong>{item.campanhaNome ?? 'Campanha'}</strong>
                <small>{item.telefone ?? 'Sem telefone'}</small>
              </span>
              <span className="status-pill">{campaignStatusLabel(item.status)}</span>
              <span>{item.respostaCliente || item.mensagemFinal}</span>
              <span className="campaign-actions">
                <button className="button" type="button" disabled={busyId === item.id} onClick={() => onOpenClient(item.clienteId)}>
                  Ficha
                </button>
                <button className="button primary" type="button" disabled={busyId === item.id} onClick={() => run(item.id, () => onOpenBudget(item))}>
                  Orcamento
                </button>
                <button className="button" type="button" disabled={busyId === item.id} onClick={() => run(item.id, async () => { await onCreateTask(item) })}>
                  Criar tarefa
                </button>
                <button className="button" type="button" disabled={busyId === item.id} onClick={() => run(item.id, () => onUpdateStatus(item, 'ganhou'))}>
                  Ganhou
                </button>
                <button className="button" type="button" disabled={busyId === item.id} onClick={() => run(item.id, () => onUpdateStatus(item, 'perdido'))}>
                  Perdido
                </button>
                <button className="button" type="button" disabled={busyId === item.id} onClick={() => run(item.id, () => onUpdateStatus(item, 'nao_respondeu'))}>
                  Sem resposta
                </button>
              </span>
            </div>
          ))}
          {items.length === 0 && <div className="empty-state">Nenhuma resposta de campanha nesta fila.</div>}
        </div>
      )}
    </section>
  )
}

function Dashboard({
  scoredClientes,
  resumo,
  vendedoresResumo,
  interacoes,
  orcamentos,
  importacoes,
  usuarios,
  oportunidades,
  onOpenAction,
}: {
  scoredClientes: Array<Cliente & { score: number; motivo: string }>
  resumo?: DashboardResumo
  vendedoresResumo: VendedorResumo[]
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  importacoes: Importacao[]
  usuarios: Vendedor[]
  oportunidades: Oportunidade[]
  onOpenAction: (action: 'sem-vendedor' | 'rodobens' | 'orcamentos-vencidos' | 'campanhas-pendentes' | 'tarefas-vencidas') => void
}) {
  const ativos = resumo?.clientesAtivos90 ?? scoredClientes.filter((cliente) => daysSince(cliente.ultimaCompraEm) <= 90).length
  const inativos90 = resumo?.clientesInativos90 ?? scoredClientes.filter((cliente) => daysSince(cliente.ultimaCompraEm) > 90).length
  const vencidos = resumo?.acoesVencidas ?? scoredClientes.filter((cliente) => cliente.proximaAcaoEm && daysSince(cliente.proximaAcaoEm) > 0).length
  const semVendedor = resumo?.clientesSemVendedor ?? scoredClientes.filter((cliente) => !cliente.vendedorId).length
  const oportunidadesAtivas = resumo?.oportunidadesAtivas ?? oportunidades.filter((oportunidade) => !oportunidade.bloqueada).length
  const chartData = vendedoresResumo.length > 0
    ? vendedoresResumo
        .filter((vendedor) => vendedor.role !== 'operacao')
        .map((vendedor) => ({
          nome: vendedor.vendedorNome.split(' ')[0],
          vendas: vendedor.totalCarteira,
          contatos: vendedor.contatos,
        }))
    : usuarios
        .filter((vendedor) => vendedor.role !== 'operacao')
        .map((vendedor) => ({
          nome: vendedor.nome.split(' ')[0],
          vendas: scoredClientes
            .filter((cliente) => cliente.vendedorId === vendedor.id)
            .reduce((total, cliente) => total + cliente.totalComprado, 0),
          contatos: interacoes.filter((interacao) => interacao.vendedorId === vendedor.id).length,
        }))
  const actionItems = [
    {
      id: 'sem-vendedor' as const,
      title: 'Distribuir carteira',
      count: resumo?.oportunidadesSemVendedor ?? semVendedor,
      detail: 'Clientes ativos sem responsavel comercial.',
      action: 'Abrir fila',
    },
    {
      id: 'rodobens' as const,
      title: 'Qualificar sem cadastro',
      count: resumo?.oportunidadesRodobens ?? resumo?.clientesRodobens ?? 0,
      detail: 'Leads para primeiro contato e triagem.',
      action: 'Abrir inbox',
    },
    {
      id: 'orcamentos-vencidos' as const,
      title: 'Retomar propostas',
      count: resumo?.oportunidadesOrcamentoVencido ?? 0,
      detail: 'Orcamentos vencidos ainda sem ganho/perda.',
      action: 'Ver vencidos',
    },
    {
      id: 'campanhas-pendentes' as const,
      title: 'Fila de campanhas',
      count: resumo?.campanhasPendentes ?? 0,
      detail: 'Envios aguardando acao comercial.',
      action: 'Abrir campanhas',
    },
    {
      id: 'tarefas-vencidas' as const,
      title: 'Tarefas atrasadas',
      count: resumo?.tarefasVencidas ?? 0,
      detail: 'Compromissos comerciais fora do prazo.',
      action: 'Abrir tarefas',
    },
  ]

  return (
    <section className="grid-layout">
      <div className="metric-grid">
        <Metric icon={UsersRound} label="Clientes ativos" value={ativos.toString()} tone="green" />
        <Metric icon={AlertTriangle} label="Sem compra +90 dias" value={inativos90.toString()} tone="amber" />
        <Metric icon={CalendarClock} label="Acoes vencidas" value={vencidos.toString()} tone="red" />
        <Metric icon={UserRound} label="Sem vendedor" value={semVendedor.toString()} tone="blue" />
        <Metric icon={AlertTriangle} label="Oportunidades" value={oportunidadesAtivas.toString()} tone="amber" />
        <Metric icon={Gauge} label="Fila total" value={(resumo?.oportunidadesTotal ?? oportunidades.length).toString()} tone="blue" />
      </div>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Acoes prioritarias</h2>
            <p>Atalhos gerenciais para os principais gargalos operacionais.</p>
          </div>
          <Gauge size={18} />
        </div>
        <div className="action-grid">
          {actionItems.map((item) => (
            <button className="action-card" key={item.id} type="button" onClick={() => onOpenAction(item.id)}>
              <strong>{item.count}</strong>
              <span>{item.title}</span>
              <small>{item.detail}</small>
              <em>{item.action}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Prioridade de hoje</h2>
            <p>Clientes ordenados por oportunidade comercial.</p>
          </div>
          <Filter size={18} />
        </div>
        <PriorityTable clientes={scoredClientes.slice(0, 5)} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Vendas por vendedor</h2>
            <p>Base demonstrativa para o painel gerencial.</p>
          </div>
          <BarChart3 size={18} />
        </div>
        <Suspense fallback={<div className="chart-placeholder">Carregando grafico...</div>}>
          <SalesChart data={chartData} />
        </Suspense>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Importacao atual</h2>
            <p>Conflitos ficam pendentes para revisao.</p>
          </div>
          <FileUp size={18} />
        </div>
        <div className="status-list">
          {resumo?.oportunidadesAtualizadoEm && (
            <div className="status-row">
              <span>Fila recalculada</span>
              <strong>{dateLabel(resumo.oportunidadesAtualizadoEm)}</strong>
            </div>
          )}
          {importacoes.map((importacao) => (
            <div className="status-row" key={importacao.id}>
              <span>{importacao.arquivoNome}</span>
              <strong>{importacao.conflitos} conflitos</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Gargalos da carteira</h2>
            <p>Contagens pelos filtros comerciais principais.</p>
          </div>
          <Filter size={18} />
        </div>
        <div className="status-list">
          {carteiraFiltros
            .filter((filtro) => filtro.id !== 'todos')
            .slice(0, 6)
            .map((filtro) => (
              <div className="status-row" key={filtro.id}>
                <span>{filtro.label}</span>
                <strong>{filterClientes(scoredClientes, filtro.id, orcamentos).length}</strong>
              </div>
            ))}
        </div>
      </section>
    </section>
  )
}

function Clientes({
  currentUser,
  clientes,
  selectedClient,
  interacoes,
  orcamentos,
  vendasItens,
  servicosItens,
  catalogo,
  page,
  pageSize,
  total,
  isLoading,
  filtro,
  onFilterChange,
  onPageChange,
  onSelect,
  onOpenFullProfile,
  onOpenBudgetEditor,
  onUpdateClient,
  onAddInteraction,
  onAddBudget,
}: {
  currentUser: SessaoUsuario
  clientes: Array<Cliente & { score: number; motivo: string; proximaMelhorAcao: string }>
  selectedClient: Cliente
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  vendasItens: VendaItem[]
  servicosItens: ServicoItem[]
  catalogo: CatalogoItem[]
  page: number
  pageSize: number
  total: number
  isLoading: boolean
  filtro: CarteiraFiltro
  onFilterChange: (filtro: CarteiraFiltro) => void
  onPageChange: (page: number) => void
  onSelect: (cliente: Cliente) => void
  onOpenFullProfile: (cliente: Cliente) => void
  onOpenBudgetEditor: (cliente: Cliente) => void
  onUpdateClient: (clienteId: string, patch: Partial<Cliente>) => void
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onAddBudget: (orcamento: OrcamentoInput) => Promise<Orcamento>
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleClientes = clientes

  return (
    <section className="client-layout">
      <div className="panel table-panel">
        <div className="panel-header">
          <div>
            <h2>Clientes</h2>
            <p>{total} registros encontrados. Exibindo ate {pageSize} por pagina.</p>
          </div>
          <FilterControl clientes={clientes} orcamentos={orcamentos} value={filtro} onChange={onFilterChange} />
        </div>
        <div className="table">
          <div className="table-head four">
            <span>Cliente</span>
            <span>Cidade</span>
            <span>Vendedor</span>
            <span>Score</span>
          </div>
          {visibleClientes.map((cliente) => (
            <button className="table-row four clickable" key={cliente.id} onClick={() => onSelect(cliente)} type="button">
              <span>
                <strong>{cliente.nome}</strong>
                <small>{cliente.tipoCliente} · {origemLabel(cliente.origemBase)}</small>
              </span>
              <span>{cliente.cidade}/{cliente.uf}</span>
              <span>{cliente.vendedorNome ?? 'Sem vendedor'}</span>
              <span className="score">{cliente.score}</span>
            </button>
          ))}
        </div>
        {isLoading && <div className="empty-state compact">Carregando pagina de clientes...</div>}
        {!isLoading && visibleClientes.length === 0 && <div className="empty-state">Nenhum cliente encontrado nesta visao.</div>}
        <div className="pagination-row">
          <button className="button" type="button" disabled={safePage <= 1 || isLoading} onClick={() => onPageChange(Math.max(1, safePage - 1))}>
            Anterior
          </button>
          <span>Pagina {safePage} de {totalPages}</span>
          <button className="button" type="button" disabled={safePage >= totalPages || isLoading} onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}>
            Proxima
          </button>
        </div>
      </div>
      {visibleClientes.length > 0 ? (
        <FichaCliente
          currentUser={currentUser}
          cliente={selectedClient}
          interacoes={interacoes}
          orcamentos={orcamentos}
          vendasItens={vendasItens}
          servicosItens={servicosItens}
        catalogo={catalogo}
        onOpenFullProfile={() => onOpenFullProfile(selectedClient)}
        onOpenBudgetEditor={() => onOpenBudgetEditor(selectedClient)}
        onUpdateClient={onUpdateClient}
          onAddInteraction={onAddInteraction}
          onAddBudget={onAddBudget}
        />
      ) : (
        <aside className="panel client-card">
          <div className="empty-state">Selecione outro filtro ou busca para abrir a ficha do cliente.</div>
        </aside>
      )}
    </section>
  )
}

function Carteira({
  clientes,
  baseClientes,
  orcamentos,
  filtro,
  onFilterChange,
  onSelect,
}: {
  clientes: Array<Cliente & { score: number; motivo: string; proximaMelhorAcao: string }>
  baseClientes: Array<Cliente & { score: number; motivo: string; proximaMelhorAcao: string }>
  orcamentos: Orcamento[]
  filtro: CarteiraFiltro
  onFilterChange: (filtro: CarteiraFiltro) => void
  onSelect: (cliente: Cliente) => void
}) {
  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Minha rotina de hoje</h2>
          <p>Fila priorizada por orcamentos, recompra, inatividade e dados incompletos.</p>
        </div>
        <FilterControl clientes={baseClientes} orcamentos={orcamentos} value={filtro} onChange={onFilterChange} />
      </div>
      <PriorityTable clientes={clientes} onSelect={onSelect} showActions />
    </section>
  )
}

const rodobensQualificacaoStatuses: LeadQualificacaoStatus[] = [
  'novo',
  'contatado',
  'qualificado',
  'virou_cliente',
  'descartado',
  'nao_contatar',
]

function rodobensQualificacaoLabel(status: LeadQualificacaoStatus) {
  const labels: Record<LeadQualificacaoStatus, string> = {
    novo: 'Novo',
    contatado: 'Contatado',
    qualificado: 'Qualificado',
    virou_cliente: 'Virou cliente',
    descartado: 'Descartado',
    nao_contatar: 'Nao contatar',
  }
  return labels[status]
}

function RodobensInbox({
  currentUser,
  leads,
  funil,
  total,
  page,
  pageSize,
  query,
  statusFilter,
  isLoading,
  onQueryChange,
  onStatusFilterChange,
  onPageChange,
  onSelect,
  onAddInteraction,
  onCreateTask,
  onUpdateQualificacao,
  onCreateCampaignFromSelection,
}: {
  currentUser: SessaoUsuario
  leads: Cliente[]
  funil: RodobensFunilResumo[]
  total: number
  page: number
  pageSize: number
  query: string
  statusFilter: LeadQualificacaoStatus | 'todos'
  isLoading: boolean
  onQueryChange: (query: string) => void
  onStatusFilterChange: (status: LeadQualificacaoStatus | 'todos') => void
  onPageChange: (page: number) => void
  onSelect: (cliente: Cliente) => void
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onCreateTask: (task: TarefaInput) => Promise<Tarefa>
  onUpdateQualificacao: (cliente: Cliente, status: LeadQualificacaoStatus, observacao?: string) => Promise<void>
  onCreateCampaignFromSelection: (clienteIds: string[]) => Promise<number>
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [isCreatingBulkTasks, setIsCreatingBulkTasks] = useState(false)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const statusTotals = new Map(funil.map((item) => [item.status, item]))
  const selectableLeadIds = leads.map((cliente) => cliente.id)
  const allLeadsSelected = selectableLeadIds.length > 0 && selectableLeadIds.every((id) => selectedLeadIds.includes(id))

  useEffect(() => {
    setSelectedLeadIds([])
  }, [page, query, statusFilter])

  async function registerFirstContact(cliente: Cliente) {
    await onAddInteraction({
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId ?? currentUser.id,
      canal: 'WhatsApp',
      tipo: 'primeiro contato lista externa',
      resumo: 'Primeiro contato iniciado pela fila de clientes sem cadastro.',
      resultado: 'WhatsApp aberto',
    })
    await onCreateTask({
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId,
      titulo: 'Follow-up de cliente sem cadastro',
      descricao: 'Retornar cliente abordado pela fila de listas externas.',
      dataVencimento: new Date().toISOString().slice(0, 10),
      prioridade: 80,
      origem: 'rodobens',
    })
    await onUpdateQualificacao(cliente, 'contatado', 'Primeiro contato iniciado pela fila de clientes sem cadastro.')
    setStatusMessage(`Contato registrado para ${cliente.nome}.`)
  }

  async function updateLead(cliente: Cliente, status: LeadQualificacaoStatus) {
    const observacao = rodobensQualificacaoLabel(status)
    await onUpdateQualificacao(cliente, status, observacao)
    setStatusMessage(`${cliente.nome}: ${observacao}.`)
  }

  async function createBulkContactTasks() {
    const selectedLeads = leads.filter((cliente) => selectedLeadIds.includes(cliente.id))
    if (selectedLeads.length === 0) return

    setIsCreatingBulkTasks(true)
    setStatusMessage('')
    try {
      for (const cliente of selectedLeads) {
        await onCreateTask({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId,
          titulo: 'Primeiro contato de cliente sem cadastro',
          descricao: 'Abordar lead de lista externa, qualificar frota e registrar resultado do contato.',
          dataVencimento: new Date().toISOString().slice(0, 10),
          prioridade: 85,
          origem: 'rodobens:primeiro_contato',
        })
      }
      setSelectedLeadIds([])
      setStatusMessage(`${selectedLeads.length} tarefas de primeiro contato criadas.`)
    } catch (exception) {
      setStatusMessage(exception instanceof Error ? exception.message : 'Nao foi possivel criar as tarefas em lote.')
    } finally {
      setIsCreatingBulkTasks(false)
    }
  }

  async function createCampaignFromSelectedLeads() {
    if (selectedLeadIds.length === 0) return

    setIsCreatingCampaign(true)
    setStatusMessage('')
    try {
      const totalEnvios = await onCreateCampaignFromSelection(selectedLeadIds)
      setSelectedLeadIds([])
      setStatusMessage(`Campanha criada com ${totalEnvios} contatos selecionados.`)
    } catch (exception) {
      setStatusMessage(exception instanceof Error ? exception.message : 'Nao foi possivel criar a campanha selecionada.')
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Clientes sem cadastro</h2>
          <p>Fila de primeiro contato para clientes vindos de listas externas antes de entrarem na carteira Capital.</p>
        </div>
        <div className="toolbar-actions">
          <label className="search compact-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar cliente sem cadastro"
            />
          </label>
          <select
            className="compact-select"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as LeadQualificacaoStatus | 'todos')}
          >
            <option value="todos">Todos os status</option>
            {rodobensQualificacaoStatuses.map((status) => (
              <option value={status} key={status}>{rodobensQualificacaoLabel(status)}</option>
            ))}
          </select>
          <span className="status-pill">{total} registros</span>
        </div>
      </div>
      <div className="lead-funnel-strip">
        {rodobensQualificacaoStatuses.map((status) => {
          const item = statusTotals.get(status)
          return (
            <button
              className={statusFilter === status ? 'lead-funnel-card active' : 'lead-funnel-card'}
              type="button"
              key={status}
              onClick={() => onStatusFilterChange(status)}
            >
              <strong>{item?.total ?? 0}</strong>
              <span>{rodobensQualificacaoLabel(status)}</span>
              <small>{item?.comWhatsapp ?? 0} com WhatsApp · {item?.comVendedor ?? 0} com vendedor</small>
            </button>
          )
        })}
      </div>
      {leads.length > 0 && (
        <div className="bulk-action-bar">
          <button
            className="button"
            type="button"
            onClick={() => setSelectedLeadIds(allLeadsSelected ? [] : selectableLeadIds)}
          >
            {allLeadsSelected ? 'Limpar selecao' : 'Selecionar pagina'}
          </button>
          <button
            className="button primary"
            type="button"
            disabled={selectedLeadIds.length === 0 || isCreatingBulkTasks}
            onClick={createBulkContactTasks}
          >
            {isCreatingBulkTasks ? 'Criando...' : `Criar ${selectedLeadIds.length || ''} tarefas`}
          </button>
          <button
            className="button"
            type="button"
            disabled={selectedLeadIds.length === 0 || isCreatingCampaign}
            onClick={createCampaignFromSelectedLeads}
          >
            {isCreatingCampaign ? 'Gerando...' : 'Gerar campanha'}
          </button>
          <span className="status-pill">{selectedLeadIds.length} selecionados</span>
        </div>
      )}
      {statusMessage && <div className="readiness ok">{statusMessage}</div>}
      {isLoading && <div className="empty-state compact">Carregando clientes sem cadastro...</div>}
      {!isLoading && leads.length === 0 && (
        <div className="empty-state">
          Nenhum cliente sem cadastro encontrado na classificacao atual.
        </div>
      )}
      {leads.length > 0 && (
        <div className="table">
          <div className="table-head rodobens-row rodobens-bulk-row">
            <span>Sel.</span>
            <span>Cliente</span>
            <span>Origem</span>
            <span>Status</span>
            <span>Contexto</span>
            <span>Acoes</span>
          </div>
          {leads.map((cliente) => {
            const message = `Bom dia, ${cliente.responsavel ?? cliente.nome}. Aqui e da Capital Truck Center. Identifiquei seu cadastro em uma lista externa e gostaria de entender se podemos ajudar com pneus ou servicos.`
            const waUrl = cliente.whatsapp ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(message)}` : undefined

            return (
              <div className="table-row rodobens-row rodobens-bulk-row" key={cliente.id}>
                <span>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(cliente.id)}
                    onChange={(event) => {
                      setSelectedLeadIds((current) =>
                        event.target.checked
                          ? [...new Set([...current, cliente.id])]
                          : current.filter((id) => id !== cliente.id),
                      )
                    }}
                    aria-label={`Selecionar ${cliente.nome}`}
                  />
                </span>
                <span>
                  <strong>{cliente.nome}</strong>
                  <small>{cliente.cidade}/{cliente.uf} - {cliente.whatsapp ?? 'Sem WhatsApp'}</small>
                </span>
                <span>
                  <strong>{origemLabel(cliente.origemBase)}</strong>
                  <small>{origemDetalheLabel(cliente)}</small>
                </span>
                <span>
                  <strong>{rodobensQualificacaoLabel(cliente.leadQualificacaoStatus ?? 'novo')}</strong>
                  <small>{cliente.leadQualificacaoObservacao ?? 'Sem qualificacao registrada'}</small>
                </span>
                <span>
                  <small>Ultima compra: {dateLabel(cliente.ultimaCompraEm)}</small>
                  <small>Total historico: {money(cliente.totalComprado + cliente.totalServicos)}</small>
                </span>
                <span className="campaign-actions">
                  <button className="button" type="button" onClick={() => onSelect(cliente)}>
                    <UserRound size={16} /> Ficha
                  </button>
                  <a className={!waUrl ? 'button disabled' : 'button'} href={waUrl} target="_blank" rel="noreferrer">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <button className="button primary" type="button" onClick={() => registerFirstContact(cliente)}>
                    Registrar contato
                  </button>
                  <button className="button" type="button" onClick={() => updateLead(cliente, 'qualificado')}>
                    Qualificar
                  </button>
                  <button className="button" type="button" onClick={() => updateLead(cliente, 'virou_cliente')}>
                    Virou cliente
                  </button>
                  <button className="button" type="button" onClick={() => updateLead(cliente, 'descartado')}>
                    Descartar
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}
      <div className="pagination-row">
        <button className="button" type="button" disabled={safePage <= 1 || isLoading} onClick={() => onPageChange(Math.max(1, safePage - 1))}>
          Anterior
        </button>
        <span>Pagina {safePage} de {totalPages}</span>
        <button className="button" type="button" disabled={safePage >= totalPages || isLoading} onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}>
          Proxima
        </button>
      </div>
    </section>
  )
}

function FilterControl({
  clientes,
  orcamentos,
  value,
  onChange,
}: {
  clientes: Cliente[]
  orcamentos: Orcamento[]
  value: CarteiraFiltro
  onChange: (value: CarteiraFiltro) => void
}) {
  return (
    <label className="filter-control">
      <Filter size={16} />
      <select value={value} onChange={(event) => onChange(event.target.value as CarteiraFiltro)}>
        {carteiraFiltros.map((filtro) => (
          <option key={filtro.id} value={filtro.id}>
            {filtro.label} ({filterClientes(clientes, filtro.id, orcamentos).length})
          </option>
        ))}
      </select>
    </label>
  )
}

function opportunityTypeLabel(type: string) {
  const labels: Record<string, string> = {
    sem_vendedor: 'Sem vendedor',
    rodobens_primeiro_contato: 'Clientes sem cadastro',
    cliente_risco_180: 'Risco 180d',
    recompra_90: 'Recompra 90d',
    alto_valor_sem_contato: 'Alto valor',
    orcamento_aberto: 'Orc. aberto',
    orcamento_vencido: 'Orc. vencido',
    sem_whatsapp: 'Sem WhatsApp',
  }
  return labels[type] ?? type.replaceAll('_', ' ')
}

function Oportunidades({
  oportunidades,
  resumo,
  page,
  pageSize,
  total,
  filter,
  tipoFilter,
  isLoading,
  canRefresh,
  usuarios,
  onPageChange,
  onFilterChange,
  onTipoFilterChange,
  onRefresh,
  onAssignSelected,
  onCreateTask,
  onCreateCampaignFromSelection,
}: {
  oportunidades: Oportunidade[]
  resumo: OportunidadeResumo[]
  page: number
  pageSize: number
  total: number
  filter: OportunidadeFilter
  tipoFilter: string
  isLoading: boolean
  canRefresh: boolean
  usuarios: Vendedor[]
  onPageChange: (page: number) => void
  onFilterChange: (filter: OportunidadeFilter) => void
  onTipoFilterChange: (tipo: string) => void
  onRefresh: () => Promise<void>
  onAssignSelected: (clienteIds: string[], vendedorId: string) => Promise<number>
  onCreateTask: (oportunidade: Oportunidade) => Promise<Tarefa>
  onCreateCampaignFromSelection: (clienteIds: string[], tipo: string) => Promise<number>
}) {
  const [createdTasks, setCreatedTasks] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkVendedorId, setBulkVendedorId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const vendedores = usuarios.filter((usuario) => usuario.role === 'vendedor')
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const totalAtivas = resumo.reduce((sum, item) => sum + item.ativas, 0)
  const totalBloqueadas = resumo.reduce((sum, item) => sum + item.bloqueadas, 0)
  const topResumo = resumo.slice(0, 6)
  const filtered = isSupabaseConfigured ? oportunidades : oportunidades.filter((oportunidade) => {
    if (filter === 'bloqueadas') return oportunidade.bloqueada
    if (filter === 'ativas') return !oportunidade.bloqueada
    return true
  }).slice((page - 1) * pageSize, page * pageSize)
  const isSemVendedor = tipoFilter === 'sem_vendedor'
  const selectableIds = filtered
    .filter((oportunidade) => !oportunidade.bloqueada && !oportunidade.tarefaExistente)
    .map((oportunidade) => oportunidade.id)
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))
  const selectedOportunidades = filtered.filter((oportunidade) => selectedIds.includes(oportunidade.id))
  const resumoByTipo = new Map(resumo.map((item) => [item.tipo, item]))
  const workBatches = [
    { tipo: 'cliente_risco_180', title: 'Reativar carteira parada', detail: 'Clientes com alto risco de perda e sem compra recente.' },
    { tipo: 'sem_vendedor', title: 'Distribuir sem responsavel', detail: 'Clientes sem vendedor atual para redistribuir em lote.' },
    { tipo: 'recompra_90', title: 'Recompra por ciclo', detail: 'Clientes com janela provavel para nova compra.' },
    { tipo: 'rodobens', title: 'Converter lista externa', detail: 'Leads externos prontos para primeira abordagem.' },
  ].map((batch) => ({ ...batch, resumo: resumoByTipo.get(batch.tipo) })).filter((batch) => batch.resumo)

  useEffect(() => {
    setSelectedIds([])
  }, [filter, page, tipoFilter])

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Motor de oportunidades</h2>
          <p>{total} oportunidades na fila cacheada, com paginacao e bloqueio de duplicidade de tarefa.</p>
        </div>
        <div className="panel-actions">
          {canRefresh && (
            <button
              className="button"
              type="button"
              disabled={isRefreshing}
              onClick={async () => {
                setError('')
                setIsRefreshing(true)
                try {
                  await onRefresh()
                } catch (exception) {
                  setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar a fila.')
                } finally {
                  setIsRefreshing(false)
                }
              }}
            >
              <RefreshCw size={16} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar fila'}
            </button>
          )}
          <div className="segmented">
            <button className={filter === 'ativas' ? 'active' : ''} type="button" onClick={() => onFilterChange('ativas')}>Ativas</button>
            <button className={filter === 'bloqueadas' ? 'active' : ''} type="button" onClick={() => onFilterChange('bloqueadas')}>Bloqueadas</button>
            <button className={filter === 'todas' ? 'active' : ''} type="button" onClick={() => onFilterChange('todas')}>Todas</button>
          </div>
        </div>
      </div>
      <div className="filter-row compact-filter-row">
        <label>
          Tipo de oportunidade
          <select value={tipoFilter} onChange={(event) => onTipoFilterChange(event.target.value)}>
            <option value="todos">Todos os tipos</option>
            {resumo.map((item) => (
              <option value={item.tipo} key={item.tipo}>{opportunityTypeLabel(item.tipo)}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="work-batch-grid">
        {workBatches.map((batch) => (
          <button
            className={tipoFilter === batch.tipo ? 'work-batch-card active' : 'work-batch-card'}
            key={batch.tipo}
            type="button"
            onClick={() => {
              onFilterChange('ativas')
              onTipoFilterChange(batch.tipo)
            }}
          >
            <span>
              <strong>{batch.title}</strong>
              <small>{batch.detail}</small>
            </span>
            <b>{batch.resumo?.ativas ?? 0}</b>
          </button>
        ))}
      </div>
      <div className="bulk-action-bar">
        {isSemVendedor && (
          <label>
            Vendedor responsavel
            <select value={bulkVendedorId} onChange={(event) => setBulkVendedorId(event.target.value)}>
              <option value="">Selecionar vendedor</option>
              {vendedores.map((usuario) => (
                <option value={usuario.id} key={usuario.id}>{usuario.nome}</option>
              ))}
            </select>
          </label>
        )}
        <button
          className="button"
          type="button"
          disabled={selectableIds.length === 0}
          onClick={() => {
            setSelectedIds(allVisibleSelected ? [] : selectableIds)
          }}
        >
          {allVisibleSelected ? 'Limpar selecao' : 'Selecionar pagina'}
        </button>
        {isSemVendedor && (
          <button
            className="button primary"
            type="button"
            disabled={selectedIds.length === 0 || !bulkVendedorId || isAssigning}
            onClick={async () => {
              setError('')
              setIsAssigning(true)
              try {
                const clienteIds = selectedOportunidades.map((oportunidade) => oportunidade.clienteId)
                const updated = await onAssignSelected(clienteIds, bulkVendedorId)
                setSelectedIds([])
                setBulkVendedorId('')
                setError(`${updated} clientes atribuidos e fila recalculada.`)
              } catch (exception) {
                setError(exception instanceof Error ? exception.message : 'Nao foi possivel atribuir os clientes.')
              } finally {
                setIsAssigning(false)
              }
            }}
          >
            {isAssigning ? 'Atribuindo...' : `Atribuir ${selectedIds.length || ''}`}
          </button>
        )}
        <button
          className="button"
          type="button"
          disabled={selectedIds.length === 0 || isCreatingCampaign}
          onClick={async () => {
            setError('')
            setIsCreatingCampaign(true)
            try {
              const clienteIds = selectedOportunidades.map((oportunidade) => oportunidade.clienteId)
              const totalEnvios = await onCreateCampaignFromSelection(clienteIds, tipoFilter)
              setSelectedIds([])
              setError(`Campanha criada com ${totalEnvios} contatos selecionados.`)
            } catch (exception) {
              setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar a campanha.')
            } finally {
              setIsCreatingCampaign(false)
            }
          }}
        >
          {isCreatingCampaign ? 'Gerando...' : 'Gerar campanha'}
        </button>
        <span className="status-pill">{selectedIds.length} selecionados</span>
      </div>
      <div className="opportunity-summary-strip">
        <div className="opportunity-summary-card">
          <strong>{totalAtivas || total}</strong>
          <span>Ativas</span>
          <small>{totalBloqueadas} bloqueadas/com tarefa</small>
        </div>
        {topResumo.map((item) => (
          <button
            className="opportunity-summary-card"
            type="button"
            key={item.tipo}
            onClick={() => onTipoFilterChange(item.tipo)}
          >
            <strong>{item.ativas}</strong>
            <span>{opportunityTypeLabel(item.tipo)}</span>
            <small>{item.total} totais · prioridade {Math.round(item.prioridadeMaxima)}</small>
          </button>
        ))}
      </div>
      {isLoading && filtered.length === 0 && <div className="empty-state">Carregando oportunidades...</div>}
      <div className="table">
        <div className="table-head opportunity assign-opportunity">
          <span>Sel.</span>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Motivo</span>
          <span>Proxima acao</span>
          <span>Prioridade</span>
          <span>Acoes</span>
        </div>
        {filtered.map((oportunidade) => (
          <div className={oportunidade.bloqueada ? 'table-row opportunity assign-opportunity blocked' : 'table-row opportunity assign-opportunity'} key={oportunidade.id}>
            <span>
              <input
                type="checkbox"
                checked={selectedIds.includes(oportunidade.id)}
                disabled={oportunidade.bloqueada || oportunidade.tarefaExistente}
                onChange={(event) => {
                  setSelectedIds((current) =>
                    event.target.checked
                      ? [...new Set([...current, oportunidade.id])]
                      : current.filter((id) => id !== oportunidade.id),
                  )
                }}
                aria-label={`Selecionar ${oportunidade.clienteNome}`}
              />
            </span>
            <span><strong>{oportunidade.clienteNome}</strong></span>
            <span>{oportunidade.tipo}</span>
            <span>{oportunidade.motivo}</span>
            <span>{oportunidade.proximaAcao}</span>
            <span className="score">{oportunidade.prioridade}</span>
            <span>
              {oportunidade.tarefaExistente ? (
                <span className="status-pill">tarefa existente</span>
              ) : oportunidade.bloqueada ? (
                <span className="status-pill">bloqueada</span>
              ) : createdTasks.includes(oportunidade.id) ? (
                <span className="status-pill">tarefa criada</span>
              ) : (
                <button
                  className="button primary"
                  type="button"
                  onClick={async () => {
                    setError('')
                    try {
                      await onCreateTask(oportunidade)
                      setCreatedTasks((current) => [...current, oportunidade.id])
                    } catch (exception) {
                      setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar a tarefa.')
                    }
                  }}
                >
                  Criar tarefa
                </button>
              )}
            </span>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <div className="empty-state">Nenhuma oportunidade neste filtro.</div>}
      </div>
      <div className="pagination">
        <button className="button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span>Pagina {page} de {totalPages}</span>
        <button className="button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Proxima</button>
      </div>
    </section>
  )
}

function Catalogo({
  itens,
  total,
  page,
  pageSize,
  query,
  tipoFilter,
  ativoFilter,
  isLoading,
  onQueryChange,
  onTipoFilterChange,
  onAtivoFilterChange,
  onPageChange,
  onQuoteItem,
}: {
  itens: CatalogoItem[]
  total: number
  page: number
  pageSize: number
  query: string
  tipoFilter: CatalogoTipoFilter
  ativoFilter: CatalogoAtivoFilter
  isLoading: boolean
  onQueryChange: (query: string) => void
  onTipoFilterChange: (filter: CatalogoTipoFilter) => void
  onAtivoFilterChange: (filter: CatalogoAtivoFilter) => void
  onPageChange: (page: number) => void
  onQuoteItem: (item: CatalogoItem) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const produtos = itens.filter((item) => item.tipo === 'produto').length
  const servicos = itens.filter((item) => item.tipo === 'servico').length
  const semPreco = itens.filter((item) => item.preco <= 0).length
  const [selectedItem, setSelectedItem] = useState<CatalogoItem | undefined>()
  const [priceHistory, setPriceHistory] = useState<CatalogoPrecoHistorico[]>([])
  const [suggestions, setSuggestions] = useState<CatalogoSugestao[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  async function openPriceHistory(item: CatalogoItem) {
    setSelectedItem(item)
    setIsLoadingHistory(true)
    setHistoryError('')
    try {
      const [precos, sugestoes] = await Promise.all([
        listCatalogoPrecos(item.id),
        listCatalogoSugestoes(item.id),
      ])
      setPriceHistory(precos)
      setSuggestions(sugestoes)
    } catch (exception) {
      setHistoryError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar historico de precos.')
      setPriceHistory([])
      setSuggestions([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Catalogo profissional</h2>
          <p>Produtos e servicos vindos das listas de preco importadas, prontos para orcamento.</p>
        </div>
        <div className="segmented">
          <button className={tipoFilter === 'todos' ? 'active' : ''} type="button" onClick={() => onTipoFilterChange('todos')}>Todos</button>
          <button className={tipoFilter === 'produto' ? 'active' : ''} type="button" onClick={() => onTipoFilterChange('produto')}>Produtos</button>
          <button className={tipoFilter === 'servico' ? 'active' : ''} type="button" onClick={() => onTipoFilterChange('servico')}>Servicos</button>
        </div>
      </div>

      <div className="filter-row">
        <label>
          Buscar
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Codigo, medida, descricao, marca ou grupo" />
        </label>
        <label>
          Status
          <select value={ativoFilter} onChange={(event) => onAtivoFilterChange(event.target.value as CatalogoAtivoFilter)}>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </label>
      </div>

      <div className="metrics-grid">
        <Metric icon={ClipboardList} label="Itens nesta pagina" value={itens.length.toString()} tone="blue" />
        <Metric icon={WalletCards} label="Produtos" value={produtos.toString()} tone="green" />
        <Metric icon={Truck} label="Servicos" value={servicos.toString()} tone="blue" />
        <Metric icon={AlertTriangle} label="Sem preco" value={semPreco.toString()} tone="amber" />
      </div>

      {isLoading && <div className="empty-state">Carregando catalogo...</div>}
      <div className="table">
        <div className="table-head catalog-row">
          <span>Codigo</span>
          <span>Descricao</span>
          <span>Tipo</span>
          <span>Marca/grupo</span>
          <span>Preco</span>
          <span>Regra</span>
          <span>Acoes</span>
        </div>
        {itens.map((item) => (
          <div className="table-row catalog-row" key={item.id}>
            <span><strong>{item.codigo}</strong><small>{item.unidade || 'un.'}</small></span>
            <span><strong>{item.descricao}</strong><small>{item.subgrupo || item.grupo || 'Sem classificacao'}</small></span>
            <span>{item.tipo === 'produto' ? 'Produto' : 'Servico'}</span>
            <span>{item.marca || item.grupo || 'Nao informado'}</span>
            <strong>{money(item.preco)}</strong>
            <span>
              {item.descontoMaximo !== undefined ? `Desc. max ${item.descontoMaximo}%` : 'Sem limite'}
              <small>{item.ativo ? 'Ativo' : 'Inativo'} - {item.estoque !== undefined ? `Estoque ${item.estoque}` : 'Sem estoque'}</small>
            </span>
            <span className="catalog-actions">
              <button className="button compact-button primary" type="button" onClick={() => onQuoteItem(item)}>Usar no orcamento</button>
              <button className="button compact-button" type="button" onClick={() => openPriceHistory(item)}>Historico</button>
            </span>
          </div>
        ))}
        {!isLoading && itens.length === 0 && <div className="empty-state">Nenhum item encontrado no catalogo.</div>}
      </div>

      <div className="pagination">
        <button className="button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span>Pagina {page} de {totalPages} - {total} itens</span>
        <button className="button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Proxima</button>
      </div>

      {selectedItem && (
        <section className="panel catalog-history">
          <div className="panel-header">
            <div>
              <h2>Historico de preco</h2>
              <p>{selectedItem.codigo} - {selectedItem.descricao}</p>
            </div>
            <button className="button" type="button" onClick={() => setSelectedItem(undefined)}>Fechar</button>
          </div>
          {historyError && <div className="alert">{historyError}</div>}
          {isLoadingHistory && <div className="empty-state">Carregando historico...</div>}
          {!isLoadingHistory && suggestions.length > 0 && (
            <div className="catalog-suggestions">
              <strong>Sugestoes complementares</strong>
              <div>
                {suggestions.map((sugestao) => (
                  <span className="status-pill" key={sugestao.catalogoItemId}>
                    {sugestao.descricao}
                    <small>{sugestao.ocorrencias} ocorrencias em {sugestao.clientes} clientes</small>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="table">
            <div className="table-head catalog-price-row">
              <span>Vigencia</span>
              <span>Preco</span>
              <span>Desconto</span>
              <span>Estoque</span>
              <span>Origem</span>
            </div>
            {priceHistory.map((preco) => (
              <div className="table-row catalog-price-row" key={preco.id}>
                <span>{dateLabel(preco.vigenciaInicio)}</span>
                <strong>{money(preco.valor)}</strong>
                <span>{preco.descontoMaximo !== undefined ? `${preco.descontoMaximo}%` : 'Sem limite'}</span>
                <span>{preco.estoque !== undefined ? preco.estoque : 'Sem estoque'}</span>
                <span>{preco.arquivoNome || dateLabel(preco.criadoEm) || 'Sem origem'}</span>
              </div>
            ))}
            {!isLoadingHistory && priceHistory.length === 0 && <div className="empty-state">Nenhum historico de preco encontrado.</div>}
          </div>
        </section>
      )}
    </section>
  )
}

function Tarefas({
  clientes,
  usuarios,
  tarefas,
  orcamentos,
  page,
  pageSize,
  total,
  filter,
  originFilter,
  ownerFilter,
  isLoading,
  onPageChange,
  onFilterChange,
  onOriginFilterChange,
  onOwnerFilterChange,
  onOpenClient,
  onOpenBudgetEditor,
  onCreate,
  onComplete,
  onReschedule,
}: {
  clientes: Cliente[]
  usuarios: Vendedor[]
  tarefas: Tarefa[]
  orcamentos: Orcamento[]
  page: number
  pageSize: number
  total: number
  filter: TarefaStatusFilter
  originFilter: TarefaOriginFilter
  ownerFilter: string
  isLoading: boolean
  onPageChange: (page: number) => void
  onFilterChange: (filter: TarefaStatusFilter) => void
  onOriginFilterChange: (filter: TarefaOriginFilter) => void
  onOwnerFilterChange: (ownerId: string) => void
  onOpenClient: (clienteId: string) => void
  onOpenBudgetEditor: (clienteId: string, originContext?: QuoteOriginContext) => void
  onCreate: (task: TarefaInput) => Promise<Tarefa>
  onComplete: (id: string) => void
  onReschedule: (id: string, dataVencimento: string, motivo: string) => Promise<Tarefa>
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [createdSuggestions, setCreatedSuggestions] = useState<string[]>([])
  const [reschedulingId, setReschedulingId] = useState('')
  const [rescheduleDrafts, setRescheduleDrafts] = useState<Record<string, { data: string; motivo: string }>>({})
  const [executionMode, setExecutionMode] = useState(false)
  const [executionIndex, setExecutionIndex] = useState(0)
  const [form, setForm] = useState({
    clienteId: clientes[0]?.id ?? '',
    vendedorId: '',
    titulo: '',
    descricao: '',
    dataVencimento: new Date().toISOString().slice(0, 10),
    prioridade: '60',
  })
  const [error, setError] = useState('')
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const abertas = tarefas.filter((tarefa) => tarefa.status === 'aberta')
  const suggestionQueue = buildRoutineSuggestions(clientes, orcamentos, abertas)
  const vendedores = usuarios.filter((usuario) => usuario.role === 'vendedor')
  const workload = vendedores
    .map((vendedor) => {
      const abertasVendedor = abertas.filter((tarefa) => tarefa.vendedorId === vendedor.id)
      return {
        id: vendedor.id,
        nome: vendedor.nome,
        abertas: abertasVendedor.length,
        vencidas: abertasVendedor.filter((tarefa) => daysSince(tarefa.dataVencimento) > 0).length,
        prioridadeMedia: abertasVendedor.length
          ? Math.round(abertasVendedor.reduce((total, tarefa) => total + tarefa.prioridade, 0) / abertasVendedor.length)
          : 0,
      }
    })
    .sort((a, b) => b.vencidas - a.vencidas || b.prioridadeMedia - a.prioridadeMedia)
  const overloaded = workload[0]
  const agendaBuckets = [
    {
      id: 'orcamentos',
      label: 'Orcamentos',
      hint: 'vencidos ou vencendo',
      tarefas: suggestionQueue.filter((item) => item.tipo.startsWith('orcamento')),
      onClick: () => onOriginFilterChange('orcamento'),
    },
    {
      id: 'rodobens',
      label: 'Sem cadastro',
      hint: 'primeiro contato',
      tarefas: suggestionQueue.filter((item) => item.tipo === 'rodobens'),
      onClick: () => onOriginFilterChange('rodobens'),
    },
    {
      id: 'vencidas',
      label: 'Vencidas',
      hint: 'pedem acao imediata',
      tarefas: abertas.filter((tarefa) => daysSince(tarefa.dataVencimento) > 0),
      onClick: () => onFilterChange('vencidas'),
    },
    {
      id: 'hoje',
      label: 'Hoje',
      hint: 'para fechar o dia',
      tarefas: abertas.filter((tarefa) => daysSince(tarefa.dataVencimento) === 0),
      onClick: () => onFilterChange('abertas'),
    },
    {
      id: 'semana',
      label: 'Proximos 7 dias',
      hint: 'preparar abordagens',
      tarefas: abertas.filter((tarefa) => daysSince(tarefa.dataVencimento) < 0 && daysSince(tarefa.dataVencimento) >= -7),
      onClick: () => onFilterChange('abertas'),
    },
    {
      id: 'prioridade',
      label: 'Alta prioridade',
      hint: 'maior potencial',
      tarefas: abertas.filter((tarefa) => tarefa.prioridade >= 80),
      onClick: () => onFilterChange('abertas'),
    },
  ].map((bucket) => ({
    ...bucket,
    tarefas: bucket.tarefas.sort((a, b) => b.prioridade - a.prioridade || a.dataVencimento.localeCompare(b.dataVencimento)),
  }))
  const filtered = tarefas
  const executionQueue = filtered
    .filter((tarefa) => tarefa.status === 'aberta')
    .sort((a, b) => b.prioridade - a.prioridade || daysSince(b.dataVencimento) - daysSince(a.dataVencimento))
  const activeExecutionTask = executionQueue[Math.min(executionIndex, Math.max(executionQueue.length - 1, 0))]

  async function saveTaskReschedule(tarefa: Tarefa) {
    const draft = rescheduleDrafts[tarefa.id]
    if (!draft?.data || !draft.motivo.trim()) {
      setError('Informe nova data e motivo para reagendar.')
      return
    }
    setError('')
    try {
      const updated = await onReschedule(tarefa.id, draft.data, draft.motivo.trim())
      setReschedulingId('')
      setRescheduleDrafts((current) => {
        const next = { ...current }
        delete next[tarefa.id]
        return next
      })
      setError(`${updated.titulo} reagendada para ${dateLabel(updated.dataVencimento)}.`)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel reagendar a tarefa.')
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Proximas acoes</h2>
          <p>Tarefas vindas de retornos, orcamentos, importacoes e oportunidades automaticas.</p>
        </div>
        <div className="toolbar-actions">
          <label className="mini-select">
            <Filter size={15} />
            <select value={originFilter} onChange={(event) => onOriginFilterChange(event.target.value as TarefaOriginFilter)}>
              <option value="todas">Todas as origens</option>
              <option value="manual">Manual</option>
              <option value="interacao">Interacao</option>
              <option value="orcamento">Orcamento</option>
              <option value="importacao">Importacao</option>
              <option value="campanha">Campanha</option>
              <option value="oportunidade">Oportunidade</option>
              <option value="rodobens">Clientes sem cadastro</option>
            </select>
          </label>
          <label className="mini-select">
            <UserRound size={15} />
            <select value={ownerFilter} onChange={(event) => onOwnerFilterChange(event.target.value)}>
              <option value="todos">Todos vendedores</option>
              {vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
            </select>
          </label>
          <div className="segmented">
            <button className={filter === 'abertas' ? 'active' : ''} onClick={() => onFilterChange('abertas')} type="button">
              Abertas
            </button>
            <button className={filter === 'vencidas' ? 'active' : ''} onClick={() => onFilterChange('vencidas')} type="button">
              Vencidas
            </button>
            <button className={filter === 'concluidas' ? 'active' : ''} onClick={() => onFilterChange('concluidas')} type="button">
              Concluidas
            </button>
          </div>
          <button className="button primary" type="button" onClick={() => setShowCreate((current) => !current)}>
            Nova tarefa
          </button>
          <button className={executionMode ? 'button primary' : 'button'} type="button" onClick={() => {
            setExecutionMode((current) => !current)
            setExecutionIndex(0)
          }}>
            {executionMode ? 'Fechar execucao' : 'Iniciar fila'}
          </button>
        </div>
      </div>
      {showCreate && (
        <form
          className="task-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            try {
              await onCreate({
                clienteId: form.clienteId,
                vendedorId: form.vendedorId || undefined,
                titulo: form.titulo,
                descricao: form.descricao || undefined,
                dataVencimento: form.dataVencimento,
                prioridade: Number(form.prioridade),
                origem: 'manual',
              })
              setForm({
                clienteId: clientes[0]?.id ?? '',
                vendedorId: '',
                titulo: '',
                descricao: '',
                dataVencimento: new Date().toISOString().slice(0, 10),
                prioridade: '60',
              })
              setShowCreate(false)
            } catch (exception) {
              setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar a tarefa.')
            }
          }}
        >
          <label>
            Cliente
            <select
              value={form.clienteId}
              onChange={(event) => {
                const cliente = clientes.find((item) => item.id === event.target.value)
                setForm({
                  ...form,
                  clienteId: event.target.value,
                  vendedorId: cliente?.vendedorId ?? form.vendedorId,
                  prioridade: String(cliente ? Math.max(50, Math.min(95, opportunityScore(cliente, []))) : form.prioridade),
                })
              }}
            >
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </select>
          </label>
          <label>
            Vendedor
            <select value={form.vendedorId} onChange={(event) => setForm({ ...form, vendedorId: event.target.value })}>
              <option value="">Sem vendedor</option>
              {usuarios
                .filter((usuario) => usuario.role === 'vendedor')
                .map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
            </select>
          </label>
          <label>
            Vencimento
            <input type="date" value={form.dataVencimento} onChange={(event) => setForm({ ...form, dataVencimento: event.target.value })} />
          </label>
          <label>
            Prioridade
            <input type="number" min="0" max="100" value={form.prioridade} onChange={(event) => setForm({ ...form, prioridade: event.target.value })} />
          </label>
          <label className="span-2">
            Titulo
            <input value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} required />
          </label>
          <label className="span-2">
            Descricao
            <textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
          </label>
          <button className="button primary" type="submit">Criar tarefa</button>
        </form>
      )}
      {error && <div className="alert">{error}</div>}
      {executionMode && (
        <section className="task-execution-panel">
          {activeExecutionTask ? (
            <>
              <div className="task-execution-main">
                <span className={`sla-pill ${taskSla(activeExecutionTask).tone}`}>{taskSla(activeExecutionTask).label}</span>
                <h2>{activeExecutionTask.titulo}</h2>
                <p>{activeExecutionTask.descricao ?? activeExecutionTask.origem}</p>
                <div className="info-grid">
                  <Info label="Cliente" value={activeExecutionTask.clienteNome} />
                  <Info label="Vendedor" value={activeExecutionTask.vendedorNome ?? 'Sem vendedor'} />
                  <Info label="Vencimento" value={dateLabel(activeExecutionTask.dataVencimento)} />
                  <Info label="Prioridade" value={activeExecutionTask.prioridade.toString()} />
                </div>
              </div>
              <div className="task-execution-actions">
                <span>{Math.min(executionIndex + 1, executionQueue.length)} de {executionQueue.length}</span>
                <button className="button" type="button" onClick={() => onOpenClient(activeExecutionTask.clienteId)}>Ficha</button>
                <button
                  className="button"
                  type="button"
                  onClick={() => onOpenBudgetEditor(activeExecutionTask.clienteId, {
                    kind: 'tarefa',
                    sourceId: activeExecutionTask.id,
                    label: activeExecutionTask.titulo,
                  })}
                >
                  Orcamento
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={executionIndex <= 0}
                  onClick={() => setExecutionIndex((current) => Math.max(0, current - 1))}
                >
                  Anterior
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={executionIndex >= executionQueue.length - 1}
                  onClick={() => setExecutionIndex((current) => Math.min(executionQueue.length - 1, current + 1))}
                >
                  Proxima
                </button>
                <button className="button primary" type="button" onClick={() => {
                  onComplete(activeExecutionTask.id)
                  setExecutionIndex((current) => Math.min(current, Math.max(executionQueue.length - 2, 0)))
                }}>
                  Concluir e avancar
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state compact">Nenhuma tarefa aberta nesta fila.</div>
          )}
        </section>
      )}
      <div className="routine-queue">
        <div className="routine-queue-header">
          <div>
            <h2>Fila inteligente</h2>
            <p>Acionamentos sugeridos a partir de orcamentos, listas externas e clientes em risco.</p>
          </div>
          <strong>{suggestionQueue.length} acoes</strong>
        </div>
        {suggestionQueue.slice(0, 8).map((suggestion) => {
          const wasCreated = createdSuggestions.includes(suggestion.id)
          return (
            <article className="routine-card" key={suggestion.id}>
              <span>
                <strong>{suggestion.titulo}</strong>
                <small>{suggestion.clienteNome} - {suggestion.motivo}</small>
              </span>
              <b>{suggestion.prioridade}</b>
              <div className="routine-actions">
                <button className="button" onClick={() => onOpenClient(suggestion.clienteId)} type="button">
                  Ficha
                </button>
                {suggestion.tipo.startsWith('orcamento') && (
                  <button
                    className="button"
                    onClick={() => onOpenBudgetEditor(suggestion.clienteId, {
                      kind: 'tarefa',
                      sourceId: suggestion.id,
                      label: suggestion.titulo,
                    })}
                    type="button"
                  >
                    Orcamento
                  </button>
                )}
                {wasCreated ? (
                  <span className="status-pill">tarefa criada</span>
                ) : (
                  <button
                    className="button primary"
                    type="button"
                    onClick={async () => {
                      setError('')
                      try {
                        await onCreate({
                          clienteId: suggestion.clienteId,
                          vendedorId: suggestion.vendedorId,
                          titulo: suggestion.titulo,
                          descricao: suggestion.motivo,
                          dataVencimento: suggestion.dataVencimento,
                          prioridade: suggestion.prioridade,
                          origem: suggestion.origem,
                        })
                        setCreatedSuggestions((current) => [...current, suggestion.id])
                      } catch (exception) {
                        setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar a tarefa sugerida.')
                      }
                    }}
                  >
                    Criar tarefa
                  </button>
                )}
              </div>
            </article>
          )
        })}
        {suggestionQueue.length === 0 && <div className="empty-state">Nenhuma acao automatica pendente.</div>}
      </div>
      <div className="task-insight">
        <span>
          <strong>{overloaded ? `Maior atencao: ${overloaded.nome}` : 'Sem carga atribuida'}</strong>
          <small>
            {overloaded
              ? `${overloaded.vencidas} vencidas, ${overloaded.abertas} abertas, prioridade media ${overloaded.prioridadeMedia}.`
              : 'Crie ou atribua tarefas para acompanhar a operacao.'}
          </small>
        </span>
        <div className="status-list compact-status">
          {workload.map((row) => (
            <div className="status-row" key={row.id}>
              <span>{row.nome}</span>
              <strong>{row.abertas} abertas</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="agenda-board">
        {agendaBuckets.map((bucket) => (
          <button className="agenda-item" key={bucket.id} onClick={bucket.onClick} type="button">
            <span>
              <strong>{bucket.label}</strong>
              <small>{bucket.hint}</small>
            </span>
            <b>{bucket.tarefas.length}</b>
            <small>{bucket.tarefas[0] ? `${bucket.tarefas[0].clienteNome} - ${dateLabel(bucket.tarefas[0].dataVencimento)}` : 'Sem pendencias'}</small>
          </button>
        ))}
      </div>
      <div className="table">
        <div className="table-head task">
          <span>Tarefa</span>
          <span>Cliente</span>
          <span>Vendedor</span>
          <span>Vencimento</span>
          <span>Prioridade</span>
          <span>Acoes</span>
        </div>
        {isLoading && <div className="empty-state compact">Carregando tarefas...</div>}
        {!isLoading && filtered.map((tarefa) => (
          <div className={tarefa.status === 'concluida' ? 'table-row task done' : 'table-row task'} key={tarefa.id}>
            <span>
              <strong>{tarefa.titulo}</strong>
              <small>{tarefa.descricao ?? tarefa.origem}</small>
              {tarefa.reagendamentoMotivo && <small>Reagendada: {tarefa.reagendamentoMotivo}</small>}
            </span>
            <span>{tarefa.clienteNome}</span>
            <span>{tarefa.vendedorNome ?? 'Sem vendedor'}</span>
            <span>
              <strong>{dateLabel(tarefa.dataVencimento)}</strong>
              <span className={`sla-pill ${taskSla(tarefa).tone}`}>{taskSla(tarefa).label}</span>
            </span>
            <span className="score">{tarefa.prioridade}</span>
            <span>
              {tarefa.status === 'aberta' ? (
                <div className="task-action-stack">
                  <button className="button primary" onClick={() => onComplete(tarefa.id)} type="button">
                    Concluir
                  </button>
                  {reschedulingId === tarefa.id ? (
                    <div className="reschedule-inline">
                      <input
                        type="date"
                        value={rescheduleDrafts[tarefa.id]?.data ?? tomorrowDate()}
                        onChange={(event) => setRescheduleDrafts((current) => ({
                          ...current,
                          [tarefa.id]: { data: event.target.value, motivo: current[tarefa.id]?.motivo ?? '' },
                        }))}
                      />
                      <input
                        value={rescheduleDrafts[tarefa.id]?.motivo ?? ''}
                        onChange={(event) => setRescheduleDrafts((current) => ({
                          ...current,
                          [tarefa.id]: { data: current[tarefa.id]?.data ?? tomorrowDate(), motivo: event.target.value },
                        }))}
                        placeholder="Motivo"
                      />
                      <button className="button" type="button" onClick={() => saveTaskReschedule(tarefa)}>Salvar</button>
                    </div>
                  ) : (
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        setReschedulingId(tarefa.id)
                        setRescheduleDrafts((current) => ({
                          ...current,
                          [tarefa.id]: current[tarefa.id] ?? { data: tomorrowDate(), motivo: '' },
                        }))
                      }}
                    >
                      Reagendar
                    </button>
                  )}
                </div>
              ) : (
                <span className="status-pill">concluida</span>
              )}
            </span>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <div className="empty-state">Nenhuma tarefa nesta visao.</div>}
      </div>
      <div className="pagination-bar">
        <span>Pagina {page} de {totalPages} - {total} tarefas</span>
        <div className="toolbar-actions">
          <button className="button" type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(Math.max(1, page - 1))}>
            Anterior
          </button>
          <button className="button" type="button" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
            Proxima
          </button>
        </div>
      </div>
    </section>
  )
}

type RoutineSuggestion = {
  id: string
  tipo: 'orcamento_vencido' | 'orcamento_vencendo' | 'rodobens' | 'cliente_risco'
  clienteId: string
  clienteNome: string
  vendedorId?: string
  titulo: string
  motivo: string
  dataVencimento: string
  prioridade: number
  origem: string
}

function buildRoutineSuggestions(clientes: Cliente[], orcamentos: Orcamento[], tarefasAbertas: Tarefa[]): RoutineSuggestion[] {
  const today = new Date().toISOString().slice(0, 10)
  const hasOpenTask = (clienteId: string, origem: string) =>
    tarefasAbertas.some((tarefa) => tarefa.clienteId === clienteId && tarefa.origem === origem)
  const clienteById = new Map(clientes.map((cliente) => [cliente.id, cliente]))
  const suggestions: RoutineSuggestion[] = []

  for (const orcamento of orcamentos) {
    const cliente = clienteById.get(orcamento.clienteId)
    if (!cliente || !['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'].includes(orcamento.status)) continue

    const dias = daysSince(orcamento.validade)
    if (dias > 0 && !hasOpenTask(cliente.id, 'orcamento:vencido')) {
      suggestions.push({
        id: `orcamento-vencido-${orcamento.id}`,
        tipo: 'orcamento_vencido',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        vendedorId: orcamento.vendedorId ?? cliente.vendedorId,
        titulo: 'Retomar orcamento vencido',
        motivo: `${money(orcamento.valorTotal)} vencido em ${dateLabel(orcamento.validade)}.`,
        dataVencimento: today,
        prioridade: 95,
        origem: 'orcamento:vencido',
      })
    } else if (dias <= 0 && dias >= -3 && !hasOpenTask(cliente.id, 'orcamento:vencendo')) {
      suggestions.push({
        id: `orcamento-vencendo-${orcamento.id}`,
        tipo: 'orcamento_vencendo',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        vendedorId: orcamento.vendedorId ?? cliente.vendedorId,
        titulo: 'Follow-up de orcamento vencendo',
        motivo: `${money(orcamento.valorTotal)} com validade ${dateLabel(orcamento.validade)}.`,
        dataVencimento: today,
        prioridade: 85,
        origem: 'orcamento:vencendo',
      })
    }
  }

  for (const cliente of clientes) {
    if (cliente.status === 'Nao contatar') continue
    if (cliente.origemBase === 'rodobens' && daysSince(cliente.ultimoContatoEm) > 30 && !hasOpenTask(cliente.id, 'rodobens:primeiro_contato')) {
      suggestions.push({
        id: `rodobens-${cliente.id}`,
        tipo: 'rodobens',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        vendedorId: cliente.vendedorId,
        titulo: 'Primeiro contato de cliente sem cadastro',
        motivo: `${cliente.cidade || 'Cidade nao informada'} - lead ainda precisa qualificacao.`,
        dataVencimento: today,
        prioridade: 82,
        origem: 'rodobens:primeiro_contato',
      })
    }

    if (daysSince(cliente.ultimaCompraEm) > 180 && !hasOpenTask(cliente.id, 'oportunidade:cliente_risco')) {
      suggestions.push({
        id: `risco-${cliente.id}`,
        tipo: 'cliente_risco',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        vendedorId: cliente.vendedorId,
        titulo: 'Reativar cliente em risco',
        motivo: `Sem compra desde ${dateLabel(cliente.ultimaCompraEm)}. Total historico ${money(cliente.totalComprado + cliente.totalServicos)}.`,
        dataVencimento: today,
        prioridade: Math.min(90, 60 + Math.round((cliente.totalComprado + cliente.totalServicos) / 50000)),
        origem: 'oportunidade:cliente_risco',
      })
    }
  }

  return suggestions
    .sort((a, b) => b.prioridade - a.prioridade || a.clienteNome.localeCompare(b.clienteNome))
    .slice(0, 40)
}

function FichaCliente({
  currentUser,
  cliente,
  interacoes,
  orcamentos,
  vendasItens,
  servicosItens,
  catalogo,
  onUpdateClient,
  onAddInteraction,
  onAddBudget,
  onOpenFullProfile,
  onOpenBudgetEditor,
}: {
  currentUser: SessaoUsuario
  cliente: Cliente
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  vendasItens: VendaItem[]
  servicosItens: ServicoItem[]
  catalogo: CatalogoItem[]
  onUpdateClient: (clienteId: string, patch: Partial<Cliente>) => void
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onAddBudget: (orcamento: OrcamentoInput) => Promise<Orcamento>
  onOpenFullProfile: () => void
  onOpenBudgetEditor: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showFullProfile] = useState(false)
  const [historySeller, setHistorySeller] = useState('todos')
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    canal: 'WhatsApp',
    tipo: 'retorno',
    resultado: 'WhatsApp enviado',
    resumo: '',
    dataProximaAcao: '',
  })
  const [budgetForm, setBudgetForm] = useState({
    validade: '',
    previsaoFechamento: '',
    formaPagamento: '',
    observacao: '',
  })
  const [budgetItems, setBudgetItems] = useState<OrcamentoItemInput[]>([
    { descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0 },
  ])
  const [editForm, setEditForm] = useState({
    telefone: cliente.telefone ?? '',
    whatsapp: cliente.whatsapp ?? '',
    responsavel: cliente.responsavel ?? '',
    status: cliente.status,
    observacoes: cliente.observacoes ?? '',
  })
  const clienteInteracoes = interacoes.filter((interacao) => interacao.clienteId === cliente.id)
  const clienteOrcamentos = orcamentos.filter((orcamento) => orcamento.clienteId === cliente.id)
  const clienteVendas = vendasItens.filter((venda) => venda.clienteId === cliente.id)
  const clienteServicos = servicosItens.filter((servico) => servico.clienteId === cliente.id)
  const historicalSellers = Array.from(new Set([
    ...clienteVendas.map((venda) => venda.vendedorNome).filter(Boolean),
    ...clienteServicos.map((servico) => servico.vendedorNome).filter(Boolean),
  ] as string[])).sort((a, b) => a.localeCompare(b))
  const filteredVendas = historySeller === 'todos'
    ? clienteVendas
    : clienteVendas.filter((venda) => venda.vendedorNome === historySeller)
  const filteredServicos = historySeller === 'todos'
    ? clienteServicos
    : clienteServicos.filter((servico) => servico.vendedorNome === historySeller)
  const totalHistorico = filteredVendas.reduce((total, venda) => total + venda.valorTotal, 0) +
    filteredServicos.reduce((total, servico) => total + servico.valorTotal, 0)
  const openBudget = clienteOrcamentos.find((orcamento) => ['aberto', 'enviado', 'negociando'].includes(orcamento.status))
  const commercialAlerts = [
    openBudget ? `Orcamento ${openBudget.status} de ${money(openBudget.valorTotal)} com validade ${dateLabel(openBudget.validade)}.` : '',
    openBudget && daysSince(openBudget.validade) > 0 ? 'Orcamento vencido: fazer follow-up imediato.' : '',
    !cliente.whatsapp ? 'Cliente sem WhatsApp cadastrado.' : '',
    daysSince(cliente.ultimoContatoEm) > 60 ? 'Sem contato comercial ha mais de 60 dias.' : '',
    daysSince(cliente.ultimaCompraEm) > 180 ? 'Cliente em risco: mais de 180 dias sem compra.' : '',
  ].filter(Boolean)
  const whatsUrl = cliente.whatsapp
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(
        `Bom dia, ${cliente.responsavel ?? cliente.nome}. Aqui e da Capital Truck Center. Estou passando para ver se precisa cotar pneus ou algum servico.`,
      )}`
    : undefined
  const validBudgetItems = budgetItems
    .filter((item) => item.descricao.trim() && item.quantidade > 0 && item.valorUnitario > 0)
    .map((item) => {
      const discountFactor = 1 - Math.min(Math.max(item.descontoPercentual ?? 0, 0), 100) / 100
      const valorTotal = item.quantidade * item.valorUnitario * discountFactor
      return { ...item, valorTotal }
    })
  const budgetTotal = validBudgetItems.reduce((total, item) => total + (item.valorTotal ?? 0), 0)
  const quoteMessage = buildQuoteMessage(
    cliente,
    validBudgetItems,
    budgetForm.validade,
    budgetForm.observacao,
    budgetForm.formaPagamento
      ? [{ id: budgetForm.formaPagamento, label: budgetForm.formaPagamento, adjustment: 0, total: budgetTotal }]
      : [],
  )
  const quoteWhatsUrl = cliente.whatsapp && validBudgetItems.length > 0
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(quoteMessage)}`
    : undefined

  async function submitInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.resumo.trim()) return

    setFormError('')
    try {
      await onAddInteraction({
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId ?? currentUser.id,
      canal: form.canal as Interacao['canal'],
      tipo: form.tipo,
      resumo: form.resumo.trim(),
      resultado: form.resultado,
      proximaAcao: form.dataProximaAcao ? bestNextAction(cliente) : undefined,
      dataProximaAcao: form.dataProximaAcao || undefined,
      })
      setForm({
        canal: 'WhatsApp',
        tipo: 'retorno',
        resultado: 'WhatsApp enviado',
        resumo: '',
        dataProximaAcao: '',
      })
      setShowForm(false)
    } catch (exception) {
      setFormError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar o contato.')
    }
  }

  async function submitBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!Number.isFinite(budgetTotal) || budgetTotal <= 0) return

    setFormError('')
    try {
      await onAddBudget({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        valorTotal: budgetTotal,
        validade: budgetForm.validade,
        previsaoFechamento: budgetForm.previsaoFechamento || undefined,
        formaPagamento: budgetForm.formaPagamento || undefined,
        observacao: budgetForm.observacao || undefined,
        itens: validBudgetItems,
      })

      await onAddInteraction({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        canal: 'WhatsApp',
        tipo: 'orcamento',
        resumo: budgetForm.observacao || `Orcamento criado no valor de ${money(budgetTotal)}.`,
        resultado: 'pediu orcamento',
      })

      setBudgetForm({ validade: '', previsaoFechamento: '', formaPagamento: '', observacao: '' })
      setBudgetItems([{ descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0 }])
      setShowBudgetForm(false)
    } catch (exception) {
      setFormError(exception instanceof Error ? exception.message : 'Nao foi possivel criar o orcamento.')
    }
  }

  return (
    <aside className="panel client-card">
      <div className="client-hero">
        <span className="status-pill">{cliente.status}</span>
        <h2>{cliente.nome}</h2>
        <p>{cliente.cidade}/{cliente.uf} · {cliente.tipoCliente} · {origemLabel(cliente.origemBase)}</p>
      </div>

      {formError && <div className="alert">{formError}</div>}
      <div className="next-action-card">
        <span>
          <strong>Proxima melhor acao</strong>
          <small>{bestNextAction(cliente)}</small>
        </span>
      </div>
      {commercialAlerts.length > 0 && (
        <div className="client-alerts">
          {commercialAlerts.map((alert) => (
            <div key={alert}>
              <AlertTriangle size={15} />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}
      <div className="quick-actions">
        <a className={!whatsUrl ? 'button disabled' : 'button'} href={whatsUrl} target="_blank" rel="noreferrer">
          <MessageCircle size={16} /> WhatsApp
        </a>
        <button
          className="button"
          type="button"
          onClick={() => {
            setForm((current) => ({
              ...current,
              resumo: current.resumo || bestNextAction(cliente),
            }))
            setShowForm((current) => !current)
          }}
        >
          <Phone size={16} /> Contato
        </button>
        <button className="button" type="button" onClick={onOpenBudgetEditor}>
          <WalletCards size={16} /> Orcamento
        </button>
        <button className="button" type="button" onClick={onOpenFullProfile}>
          <ClipboardList size={16} /> Ficha 360
        </button>
        <button className="button" type="button" onClick={() => {
          setEditForm({
            telefone: cliente.telefone ?? '',
            whatsapp: cliente.whatsapp ?? '',
            responsavel: cliente.responsavel ?? '',
            status: cliente.status,
            observacoes: cliente.observacoes ?? '',
          })
          setShowEditForm((current) => !current)
        }}>
          <UserRound size={16} /> Editar
        </button>
        <button
          className="button danger"
          type="button"
          onClick={async () => {
            onUpdateClient(cliente.id, { status: 'Nao contatar' })
            await onAddInteraction({
              clienteId: cliente.id,
              vendedorId: cliente.vendedorId ?? currentUser.id,
              canal: 'WhatsApp',
              tipo: 'atualizacao cadastral',
              resumo: 'Cliente marcado como nao contatar.',
              resultado: 'nao contatar',
            })
          }}
        >
          Nao contatar
        </button>
      </div>

      {showEditForm && (
        <form
          className="contact-form"
          onSubmit={(event) => {
            event.preventDefault()
            onUpdateClient(cliente.id, {
              telefone: editForm.telefone,
              whatsapp: editForm.whatsapp,
              responsavel: editForm.responsavel,
              status: editForm.status as Cliente['status'],
              observacoes: editForm.observacoes,
            })
            setShowEditForm(false)
          }}
        >
          <label>
            Telefone
            <input value={editForm.telefone} onChange={(event) => setEditForm({ ...editForm, telefone: event.target.value })} />
          </label>
          <label>
            WhatsApp
            <input value={editForm.whatsapp} onChange={(event) => setEditForm({ ...editForm, whatsapp: event.target.value })} />
          </label>
          <label>
            Responsavel
            <input value={editForm.responsavel} onChange={(event) => setEditForm({ ...editForm, responsavel: event.target.value })} />
          </label>
          <label>
            Status
            <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as Cliente['status'] })}>
              <option>Novo</option>
              <option>Ativo</option>
              <option>Em acompanhamento</option>
              <option>Orcamento aberto</option>
              <option>Reativar</option>
              <option>Inativo</option>
              <option>Nao contatar</option>
            </select>
          </label>
          <label className="span-2">
            Observacoes comerciais
            <textarea value={editForm.observacoes} onChange={(event) => setEditForm({ ...editForm, observacoes: event.target.value })} />
          </label>
          <button className="button primary" type="submit">Salvar cadastro</button>
        </form>
      )}

      {showForm && (
        <form className="contact-form" onSubmit={submitInteraction}>
          <label>
            Canal
            <select value={form.canal} onChange={(event) => setForm({ ...form, canal: event.target.value })}>
              <option>WhatsApp</option>
              <option>Ligacao</option>
              <option>Presencial</option>
              <option>Email</option>
              <option>Campanha</option>
            </select>
          </label>
          <label>
            Resultado
            <select value={form.resultado} onChange={(event) => setForm({ ...form, resultado: event.target.value })}>
              <option>WhatsApp enviado</option>
              <option>respondeu</option>
              <option>pediu orcamento</option>
              <option>pediu retorno depois</option>
              <option>sem interesse</option>
              <option>telefone invalido</option>
            </select>
          </label>
          <label className="span-2">
            Resumo
            <textarea
              value={form.resumo}
              onChange={(event) => setForm({ ...form, resumo: event.target.value })}
              placeholder="Ex.: pediu cotacao para 4 pneus 295/80R22.5 na sexta-feira"
            />
          </label>
          <label>
            Proxima acao
            <input
              type="date"
              value={form.dataProximaAcao}
              onChange={(event) => setForm({ ...form, dataProximaAcao: event.target.value })}
            />
          </label>
          <button className="button primary" type="submit">Registrar</button>
        </form>
      )}

      {showBudgetForm && (
        <form className="contact-form" onSubmit={submitBudget}>
          <label>
            Validade
            <input
              type="date"
              value={budgetForm.validade}
              onChange={(event) => setBudgetForm({ ...budgetForm, validade: event.target.value })}
              required
            />
          </label>
          <label>
            Prev. fechamento
            <input
              type="date"
              value={budgetForm.previsaoFechamento}
              onChange={(event) => setBudgetForm({ ...budgetForm, previsaoFechamento: event.target.value })}
            />
          </label>
          <label className="span-2">
            Condicao de pagamento
            <input
              value={budgetForm.formaPagamento}
              onChange={(event) => setBudgetForm({ ...budgetForm, formaPagamento: event.target.value })}
              placeholder="Ex.: a vista, 30 dias, 30/60/90 ou no cartao"
            />
          </label>
          <div className="budget-items span-2">
            {catalogo.length === 0 && (
              <div className="empty-state compact">Catalogo ainda nao carregado. Voce pode montar o orcamento manualmente.</div>
            )}
            {budgetItems.map((item, index) => (
              <div className="budget-item-row" key={index}>
                <select
                  value={item.catalogoItemId ?? ''}
                  onChange={(event) => {
                    const selected = catalogo.find((catalogoItem) => catalogoItem.id === event.target.value)
                    const next = [...budgetItems]
                    next[index] = selected
                      ? {
                          ...item,
                          catalogoItemId: selected.id,
                          codigo: selected.codigo,
                          descricao: selected.descricao,
                          tipo: selected.tipo,
                          valorUnitario: selected.preco,
                          descontoPercentual: item.descontoPercentual ?? 0,
                          apresentacao: item.apresentacao ?? 'normal',
                        }
                      : { ...item, catalogoItemId: undefined, codigo: undefined }
                    setBudgetItems(next)
                  }}
                >
                  <option value="">Catalogo</option>
                  {catalogo.map((catalogoItem) => (
                    <option key={catalogoItem.id} value={catalogoItem.id}>
                      {catalogoItem.tipo === 'produto' ? 'Produto' : 'Servico'} | {catalogoItem.codigo} | {catalogoItem.descricao} | {money(catalogoItem.preco)}
                    </option>
                  ))}
                </select>
                <select
                  value={item.tipo}
                  onChange={(event) => {
                    const next = [...budgetItems]
                    next[index] = { ...item, tipo: event.target.value as OrcamentoItemInput['tipo'] }
                    setBudgetItems(next)
                  }}
                >
                  <option value="produto">Produto</option>
                  <option value="servico">Servico</option>
                </select>
                <input
                  value={item.descricao}
                  onChange={(event) => {
                    const next = [...budgetItems]
                    next[index] = { ...item, descricao: event.target.value }
                    setBudgetItems(next)
                  }}
                  placeholder="Produto ou servico"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantidade}
                  onChange={(event) => {
                    const next = [...budgetItems]
                    next[index] = { ...item, quantidade: Number(event.target.value) }
                    setBudgetItems(next)
                  }}
                  placeholder="Qtd."
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.valorUnitario}
                  onChange={(event) => {
                    const next = [...budgetItems]
                    next[index] = { ...item, valorUnitario: Number(event.target.value) }
                    setBudgetItems(next)
                  }}
                  placeholder="Unitario"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={item.descontoPercentual ?? 0}
                  onChange={(event) => {
                    const next = [...budgetItems]
                    next[index] = { ...item, descontoPercentual: Number(event.target.value) }
                    setBudgetItems(next)
                  }}
                  placeholder="Desc. %"
                />
                <strong>{money((item.quantidade * item.valorUnitario) * (1 - Math.min(Math.max(item.descontoPercentual ?? 0, 0), 100) / 100))}</strong>
              </div>
            ))}
            <button
              className="button"
              type="button"
              onClick={() => setBudgetItems([...budgetItems, { descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0 }])}
            >
              Adicionar item
            </button>
          </div>
          <label className="span-2">
            Observacao
            <textarea
              value={budgetForm.observacao}
              onChange={(event) => setBudgetForm({ ...budgetForm, observacao: event.target.value })}
              placeholder="Ex.: quatro pneus 275/80R22.5 com condicao para pagamento em 30 dias"
            />
          </label>
          <label className="span-2">
            Mensagem para WhatsApp
            <textarea readOnly value={quoteMessage} />
          </label>
          <div className="budget-total span-2">
            <span>Total</span>
            <strong>{money(budgetTotal)}</strong>
          </div>
          <a className={!quoteWhatsUrl ? 'button disabled' : 'button'} href={quoteWhatsUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={16} /> Abrir WA.ME
          </a>
          <button className="button primary" type="submit">Criar orcamento</button>
        </form>
      )}

      <div className="summary-box">
        <strong>Resumo inteligente</strong>
        <p>{smartSummary(cliente, interacoes)}</p>
      </div>

      <div className="info-grid">
        <Info label="Ultima compra" value={dateLabel(cliente.ultimaCompraEm)} />
        <Info label="Ultimo servico" value={dateLabel(cliente.ultimoServicoEm)} />
        <Info label="Total comprado" value={money(cliente.totalComprado)} />
        <Info label="Servicos" value={money(cliente.totalServicos)} />
        <Info label="Origem" value={origemLabel(cliente.origemBase)} />
        <Info label="Vendedor" value={cliente.vendedorNome ?? 'Sem vendedor'} />
      </div>

      <div className="tags">
        {cliente.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>

      {showFullProfile && (
        <div className="history-section">
          <div className="panel-header compact">
            <div>
              <h3>Ficha 360</h3>
              <p>{filteredVendas.length} vendas · {filteredServicos.length} servicos · {money(totalHistorico)}</p>
            </div>
            <label className="mini-select">
              <UserRound size={15} />
              <select value={historySeller} onChange={(event) => setHistorySeller(event.target.value)}>
                <option value="todos">Todos vendedores</option>
                {historicalSellers.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
              </select>
            </label>
          </div>
          <div className="info-grid">
            <Info label="CPF/CNPJ" value={cliente.cpfCnpj || 'Nao informado'} />
            <Info label="Codigo ERP" value={cliente.codigoErp || 'Nao informado'} />
            <Info label="Telefone" value={cliente.telefone || 'Nao informado'} />
            <Info label="Email" value={cliente.email || 'Nao informado'} />
          </div>
        </div>
      )}

      <div className="history-section">
        <h3>{showFullProfile ? 'Todas as vendas' : 'Vendas'}</h3>
        {(showFullProfile ? filteredVendas : clienteVendas.slice(0, 4)).map((venda) => (
          <div className="history-row" key={venda.id}>
            <span>
              <strong>{venda.produtoNome}</strong>
              <small>{dateLabel(venda.dataVenda)} · {venda.quantidade}x · {venda.medida ?? venda.marca ?? 'Produto'}</small>
            </span>
            <strong>{money(venda.valorTotal)}</strong>
          </div>
        ))}
        {clienteVendas.length === 0 && <small className="muted">Sem venda registrada.</small>}
      </div>

      <div className="history-section">
        <h3>{showFullProfile ? 'Todos os servicos' : 'Servicos'}</h3>
        {(showFullProfile ? filteredServicos : clienteServicos.slice(0, 4)).map((servico) => (
          <div className="history-row" key={servico.id}>
            <span>
              <strong>{servico.servicoNome}</strong>
              <small>{dateLabel(servico.dataServico)} · {servico.quantidade}x {servico.placa ? `· ${servico.placa}` : ''}</small>
            </span>
            <strong>{money(servico.valorTotal)}</strong>
          </div>
        ))}
        {clienteServicos.length === 0 && <small className="muted">Sem servico registrado.</small>}
      </div>

      <div className="timeline">
        <h3>Timeline</h3>
        {clienteInteracoes.map((interacao) => (
          <div className="timeline-item" key={interacao.id}>
            <CheckCircle2 size={16} />
            <span>
              <strong>{interacao.canal}</strong>
              <small>{interacao.resumo}</small>
            </span>
          </div>
        ))}
        {clienteOrcamentos.map((orcamento) => (
          <div className="timeline-item" key={orcamento.id}>
            <WalletCards size={16} />
            <span>
              <strong>Orcamento {orcamento.status}</strong>
              <small>{money(orcamento.valorTotal)} · validade {dateLabel(orcamento.validade)}</small>
              {orcamento.itens?.map((item) => (
                <small key={item.id}>{item.quantidade}x {item.descricao} · {money(item.valorTotal)}</small>
              ))}
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function OrcamentoEditor({
  cliente,
  currentUser,
  catalogo,
  regrasDesconto,
  originContext,
  onBack,
  onCreateTask,
  onCreate,
}: {
  cliente: Cliente
  currentUser: SessaoUsuario
  catalogo: CatalogoItem[]
  regrasDesconto: CatalogoRegraDesconto[]
  originContext: QuoteOriginContext
  onBack: () => void
  onCreateTask: (task: TarefaInput) => Promise<Tarefa>
  onCreate: (orcamento: OrcamentoInput) => Promise<Orcamento>
}) {
  const [validade, setValidade] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [previsaoFechamento, setPrevisaoFechamento] = useState('')
  const [paymentAdjustments, setPaymentAdjustments] = useState<Record<string, number>>({
    'A vista': -3,
    '30 dias': 3,
    '30/60 dias': 4.5,
    '30/60/90 dias': 6,
    '60 dias': 6,
    '90 dias': 9,
    '120 dias': 12,
    cartao: 1,
    custom1: 0,
    custom2: 0,
  })
  const [enabledPaymentConditions, setEnabledPaymentConditions] = useState<Record<string, boolean>>({
    'A vista': true,
    '30 dias': true,
    '30/60 dias': true,
    cartao: false,
    custom1: false,
    custom2: false,
  })
  const [cardInstallments, setCardInstallments] = useState(3)
  const [customCondition1, setCustomCondition1] = useState('')
  const [customCondition2, setCustomCondition2] = useState('')
  const [observacao, setObservacao] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [items, setItems] = useState<OrcamentoItemInput[]>(() =>
    originContext.initialItems?.length
      ? originContext.initialItems.map((item) => ({ apresentacao: 'normal', ...item }))
      : [{ descricao: '', tipo: 'produto' as const, quantidade: 1, valorUnitario: 0, descontoPercentual: 0, apresentacao: 'normal' }],
  )
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [catalogSuggestions, setCatalogSuggestions] = useState<CatalogoSugestao[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const proposalPreviewRef = useRef<HTMLDivElement | null>(null)

  const catalogQuickResults = catalogo
    .filter((item) => {
      const term = catalogSearch.trim().toLowerCase()
      if (!item.ativo) return false
      if (!term) return false
      return `${item.codigo} ${item.descricao} ${item.tipo} ${item.grupo ?? ''} ${item.marca ?? ''}`.toLowerCase().includes(term)
    })
    .slice(0, 12)
  const validItems = items
    .filter((item) => item.descricao.trim() && item.quantidade > 0 && item.valorUnitario > 0)
    .map((item) => ({ ...item, valorTotal: quoteItemTotal(item) }))
  const total = quoteBaseTotal(validItems)
  const paymentConditionDrafts = quoteConditionDrafts(total, paymentAdjustments, enabledPaymentConditions, cardInstallments, customCondition1, customCondition2)
  const paymentScenarios = paymentConditionDrafts.filter((scenario) => {
    if (!scenario.enabled) return false
    if ((scenario.id === 'custom1' || scenario.id === 'custom2') && scenario.label.startsWith('Condicao personalizada')) return false
    return true
  })
  const formaPagamento = paymentScenarios.length
    ? paymentScenarios.map((scenario) => quoteConditionLabel(scenario.label)).join(', ')
    : undefined
  const approvalWarnings = quoteApprovalWarnings(validItems, catalogo, regrasDesconto)
  const generatedQuoteMessage = buildQuoteMessage(cliente, validItems, validade, observacao, paymentScenarios)
  const [manualQuoteMessage, setManualQuoteMessage] = useState('')
  const [isQuoteMessageEdited, setIsQuoteMessageEdited] = useState(false)
  const quoteMessage = isQuoteMessageEdited ? manualQuoteMessage : generatedQuoteMessage
  const waUrl = cliente.whatsapp && validItems.length > 0
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(quoteMessage)}`
    : undefined

  function updateItem(index: number, patch: Partial<OrcamentoItemInput>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function togglePaymentCondition(id: string, enabled: boolean) {
    setEnabledPaymentConditions((current) => ({ ...current, [id]: enabled }))
  }

  async function loadCatalogSuggestions(catalogoItemId: string) {
    if (!catalogoItemId) {
      setCatalogSuggestions([])
      return
    }
    setIsLoadingSuggestions(true)
    try {
      setCatalogSuggestions(await listCatalogoSugestoes(catalogoItemId))
    } catch {
      setCatalogSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  function addCatalogItem(catalogoItem: CatalogoItem) {
    setItems((current) => [
      ...current,
      {
        catalogoItemId: catalogoItem.id,
        codigo: catalogoItem.codigo,
        tipo: catalogoItem.tipo,
        descricao: catalogoItem.descricao,
        apresentacao: 'normal',
        quantidade: 1,
        valorUnitario: catalogoItem.preco,
        descontoPercentual: 0,
      },
    ])
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validItems.length === 0 || total <= 0) {
      setError('Adicione pelo menos um item com valor para criar a proposta.')
      return
    }
    setIsSaving(true)
    setError('')
    setFeedback('')
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const needsApproval = approvalWarnings.length > 0
    const shouldSend = submitter?.value === 'send' && !needsApproval
    const originNote = `Origem: ${originContext.label}${originContext.sourceId ? ` (${originContext.sourceId})` : ''}.`
    const finalObservation = [observacao.trim(), originNote].filter(Boolean).join('\n\n')
    try {
      const created = await onCreate({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        status: needsApproval ? 'aguardando_aprovacao' : shouldSend ? 'enviado' : 'aberto',
        valorTotal: total,
        validade,
        previsaoFechamento: previsaoFechamento || undefined,
        formaPagamento,
        aprovacaoMotivo: needsApproval ? approvalWarnings.join(' ') : undefined,
        observacao: finalObservation,
        itens: validItems,
        condicoes: quoteConditionInputs(paymentScenarios),
        versaoMensagem: quoteMessage,
        versaoOrigem: originContext.label,
      })
      await onCreateTask({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        titulo: shouldSend ? 'Follow-up de proposta enviada' : 'Follow-up do orcamento',
        descricao: `${shouldSend ? 'Confirmar recebimento da proposta' : 'Retornar proposta'} ${created.id.slice(0, 8)} de ${money(created.valorTotal)}.`,
        dataVencimento: previsaoFechamento || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        prioridade: needsApproval ? 90 : 80,
        origem: shouldSend ? 'orcamento:envio' : 'orcamento:followup',
      })
      if (shouldSend && waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer')
      setFeedback(`Orcamento ${created.id.slice(0, 8)} ${shouldSend ? 'criado e marcado como enviado' : 'criado'} com total de ${money(created.valorTotal)}.`)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar o orcamento.')
    } finally {
      setIsSaving(false)
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(quoteMessage)
    setCopyFeedback('Mensagem copiada.')
    window.setTimeout(() => setCopyFeedback(''), 2000)
  }

  return (
    <section className="panel wide quote-editor">
      <div className="panel-header">
        <div>
          <h2>Proposta para {cliente.nome}</h2>
          <p>{cliente.cidade}/{cliente.uf} - {cliente.whatsapp ?? 'sem WhatsApp'} - {origemLabel(cliente.origemBase)} - Origem: {originContext.label}</p>
        </div>
        <div className="toolbar-actions">
          <button className="button" type="button" onClick={onBack}>Voltar</button>
          <button className="button" type="button" onClick={() => void downloadQuotePdf(proposalPreviewRef.current, cliente.nome)}>
            Baixar PDF
          </button>
          <a className={!waUrl ? 'button disabled' : 'button'} href={waUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={16} /> Abrir WA.ME
          </a>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      {feedback && <div className="readiness ok">{feedback}</div>}
      {copyFeedback && <div className="readiness ok">{copyFeedback}</div>}
      {approvalWarnings.length > 0 && (
        <div className="readiness warning">
          <strong>Requer aprovacao comercial</strong>
          {approvalWarnings.map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      )}
      <form className="quote-layout" onSubmit={submit}>
        <section className="quote-main">
          <div className="quote-controls">
            <label>
              Validade
              <input type="date" value={validade} onChange={(event) => setValidade(event.target.value)} required />
            </label>
            <label>
              Prev. fechamento
              <input type="date" value={previsaoFechamento} onChange={(event) => setPrevisaoFechamento(event.target.value)} />
            </label>
          </div>
          <label className="quote-search">
            Adicionar produto ou servico
            <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Codigo, medida, produto, servico ou marca" />
          </label>
          <div className="quote-catalog-picker">
            {catalogSearch.trim() && catalogQuickResults.length === 0 && <small>Nenhum item encontrado no catalogo.</small>}
            {!catalogSearch.trim() && <small>Digite para localizar no catalogo e adicionar direto na proposta.</small>}
            {catalogQuickResults.map((catalogItem) => (
              <button className="catalog-pick-item" type="button" key={catalogItem.id} onClick={() => {
                addCatalogItem(catalogItem)
                void loadCatalogSuggestions(catalogItem.id)
              }}>
                <span>
                  <strong>{catalogItem.descricao}</strong>
                  <small>{catalogItem.codigo} - {catalogItem.tipo} {catalogItem.marca ? `- ${catalogItem.marca}` : ''}</small>
                </span>
                <b>{money(catalogItem.preco)}</b>
              </button>
            ))}
          </div>
          <div className="quote-items">
            <div className="quote-item-head">
              <span>Origem</span>
              <span>Descricao</span>
              <span>Qtd.</span>
              <span>Unitario</span>
              <span>Desc.</span>
              <span>Bloco</span>
              <span>Bloco/uso</span>
              <span>Total</span>
            </div>
            {items.map((item, index) => (
              <div className="quote-item-row" key={index}>
                <span className="quote-item-source">
                  <strong>{item.codigo ?? 'Manual'}</strong>
                  <small>{item.catalogoItemId ? 'Catalogo' : item.tipo}</small>
                </span>
                <input value={item.descricao} onChange={(event) => updateItem(index, { descricao: event.target.value })} placeholder="Descricao" />
                <input type="number" min="0" step="0.01" value={item.quantidade} onChange={(event) => updateItem(index, { quantidade: Number(event.target.value) })} />
                <input type="number" min="0" step="0.01" value={item.valorUnitario} onChange={(event) => updateItem(index, { valorUnitario: Number(event.target.value) })} />
                <input type="number" min="0" max="100" step="0.01" value={item.descontoPercentual ?? 0} onChange={(event) => updateItem(index, { descontoPercentual: Number(event.target.value) })} />
                <select value={item.apresentacao ?? 'normal'} onChange={(event) => updateItem(index, { apresentacao: event.target.value as OrcamentoItemInput['apresentacao'] })}>
                  <option value="normal">Normal</option>
                  <option value="alternativa">Alternativa</option>
                  <option value="pacote">Pacote</option>
                  <option value="complementar">Complementar</option>
                </select>
                <input value={item.observacao ?? ''} onChange={(event) => updateItem(index, { observacao: event.target.value })} placeholder="Ex.: Bloco 1, eixo direcional, kit montagem" />
                <strong>{money(quoteItemTotal(item))}</strong>
              </div>
            ))}
          </div>
          <div className="quote-suggestions">
            <strong>Complementares sugeridos</strong>
            {isLoadingSuggestions && <small>Buscando no historico de vendas...</small>}
            {!isLoadingSuggestions && catalogSuggestions.length === 0 && <small>Selecione um item do catalogo para ver cross-sell baseado no historico.</small>}
            <div>
              {catalogSuggestions.map((suggestion) => {
                const catalogItem = catalogo.find((item) => item.id === suggestion.catalogoItemId)
                return (
                  <button
                    className="button"
                    type="button"
                    key={suggestion.catalogoItemId}
                    disabled={!catalogItem}
                    onClick={() => catalogItem && addCatalogItem(catalogItem)}
                  >
                    {suggestion.descricao}
                    <small>{suggestion.clientes} clientes</small>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="quote-actions">
            <button className="button" type="button" onClick={() => setItems((current) => [...current, { descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0, descontoPercentual: 0, apresentacao: 'normal' }])}>
              Adicionar item
            </button>
            <button className="button" type="button" disabled={items.length <= 1} onClick={() => setItems((current) => current.slice(0, -1))}>
              Remover ultima linha
            </button>
          </div>
          <label className="quote-observation">
            Observacoes e termos
            <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} placeholder="Prazos, disponibilidade, condicoes comerciais e observacoes para o cliente." />
          </label>
          <div className="quote-payment-scenarios">
            <div>
              <strong>Condicoes para enviar</strong>
              <small>Selecione apenas as condicoes que devem aparecer na mensagem. A vista inicia com -3%; prazos usam 3% a cada 30 dias de prazo medio.</small>
            </div>
            {paymentConditionDrafts.map((scenario) => (
              <label key={scenario.id} className="quote-condition-row">
                <input
                  type="checkbox"
                  checked={scenario.enabled}
                  onChange={(event) => togglePaymentCondition(scenario.id, event.target.checked)}
                />
                {scenario.id === 'custom1' || scenario.id === 'custom2' ? (
                  <input
                    value={scenario.id === 'custom1' ? customCondition1 : customCondition2}
                    onChange={(event) => scenario.id === 'custom1' ? setCustomCondition1(event.target.value) : setCustomCondition2(event.target.value)}
                    placeholder="Nome da condicao"
                  />
                ) : scenario.id === 'cartao' ? (
                  <span>Cartao em <input className="inline-number" type="number" min="1" max="24" value={cardInstallments} onChange={(event) => setCardInstallments(Math.max(1, Number(event.target.value) || 1))} />x</span>
                ) : (
                  <span>{scenario.label}</span>
                )}
                <input
                  type="number"
                  step="0.1"
                  value={paymentAdjustments[scenario.id] ?? 0}
                  onChange={(event) => setPaymentAdjustments((current) => ({
                    ...current,
                    [scenario.id]: Number(event.target.value),
                  }))}
                />
                <strong>{quoteConditionValueLabel(scenario.total, scenario.parcelas)}</strong>
              </label>
            ))}
          </div>
        </section>
        <aside className="quote-summary-panel">
          <div className="info-grid quote-kpis">
            <Info label="Itens validos" value={validItems.length.toString()} />
            <Info label="Total" value={money(total)} />
            <Info label="Catalogo" value={catalogo.length.toString()} />
            <Info label="Aprovacao" value={approvalWarnings.length > 0 ? 'Necessaria' : 'Dentro do limite'} />
          </div>
          <div className="proposal-preview" ref={proposalPreviewRef}>
            <QuoteProposalPreview
              cliente={cliente}
              itens={validItems}
              total={total}
              validade={validade}
              condicoes={paymentScenarios}
              observacao={observacao}
              vendedorNome={cliente.vendedorNome ?? currentUser.nome}
            />
          </div>
          <label>
            Mensagem WhatsApp
            <textarea
              value={quoteMessage}
              onChange={(event) => {
                setIsQuoteMessageEdited(true)
                setManualQuoteMessage(event.target.value)
              }}
            />
          </label>
          <button className="button" type="button" onClick={() => {
            setIsQuoteMessageEdited(false)
            setManualQuoteMessage('')
          }}>
            Regerar mensagem
          </button>
          <button className="button" type="button" onClick={copyMessage} disabled={validItems.length === 0}>
            Copiar mensagem
          </button>
          <button className="button" type="submit" value="draft" disabled={isSaving}>
            {isSaving ? 'Criando...' : 'Criar orcamento'}
          </button>
          <button className="button primary" type="submit" value="send" disabled={isSaving || approvalWarnings.length > 0 || !waUrl}>
            {isSaving ? 'Criando...' : 'Criar e enviar'}
          </button>
        </aside>
      </form>
    </section>
  )
}

function quoteItemTotal(item: OrcamentoItemInput) {
  const discount = Math.min(Math.max(item.descontoPercentual ?? 0, 0), 100)
  return item.quantidade * item.valorUnitario * (1 - discount / 100)
}

function quoteApprovalWarnings(items: OrcamentoItemInput[], catalogo: CatalogoItem[], regrasDesconto: CatalogoRegraDesconto[] = []) {
  return items.flatMap((item) => {
    const catalogItem = item.catalogoItemId ? catalogo.find((entry) => entry.id === item.catalogoItemId) : undefined
    const regra = catalogItem ? bestDiscountRule(catalogItem, regrasDesconto) : undefined
    const maxDiscount = regra?.requerAprovacaoAcimaDe ?? catalogItem?.descontoMaximo
    if (maxDiscount === undefined || maxDiscount === null) return []
    const discount = item.descontoPercentual ?? 0
    if (discount <= maxDiscount) return []
    return [`${item.descricao}: desconto ${discount}% acima do limite ${maxDiscount}%${regra ? ` pela regra ${regra.nome}` : ''}.`]
  })
}

function bestDiscountRule(item: CatalogoItem, regras: CatalogoRegraDesconto[]) {
  const matches = regras.filter((regra) => {
    if (!regra.ativo) return false
    if (regra.tipo && regra.tipo !== item.tipo) return false
    if (regra.codigo && regra.codigo !== item.codigo) return false
    if (regra.marca && regra.marca.toLowerCase() !== (item.marca ?? '').toLowerCase()) return false
    if (regra.grupo && regra.grupo.toLowerCase() !== (item.grupo ?? '').toLowerCase()) return false
    if (regra.subgrupo && regra.subgrupo.toLowerCase() !== (item.subgrupo ?? '').toLowerCase()) return false
    return true
  })
  return matches.sort((a, b) => discountRuleSpecificity(b) - discountRuleSpecificity(a))[0]
}

function discountRuleSpecificity(regra: CatalogoRegraDesconto) {
  return [regra.codigo, regra.marca, regra.subgrupo, regra.grupo, regra.tipo].filter(Boolean).length
}

type QuoteConditionScenario = {
  id: string
  label: string
  adjustment: number
  total: number
  parcelas?: number
  enabled?: boolean
}

function quotePaymentScenarios(total: number, adjustments: Record<string, number>): QuoteConditionScenario[] {
  return Object.entries(adjustments).map(([label, adjustment]) => ({
    id: label,
    label,
    adjustment,
    total: quoteRoundedTotal(total * (1 + adjustment / 100)),
    parcelas: installmentsFromLabel(label),
  }))
}

function quoteBaseItems(itens: OrcamentoItemInput[]) {
  const base = itens.filter((item) => (item.apresentacao ?? 'normal') !== 'alternativa')
  return base.length > 0 ? base : itens
}

function quoteBaseTotal(itens: OrcamentoItemInput[]) {
  return quoteBaseItems(itens).reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
}

function quoteConditionDrafts(
  total: number,
  adjustments: Record<string, number>,
  enabled: Record<string, boolean>,
  cardInstallments: number,
  customCondition1: string,
  customCondition2: string,
): QuoteConditionScenario[] {
  const base: QuoteConditionScenario[] = [
    'A vista',
    '30 dias',
    '30/60 dias',
    '30/60/90 dias',
    '60 dias',
    '90 dias',
    '120 dias',
  ].map((id) => ({
    id,
    label: id,
    adjustment: adjustments[id] ?? 0,
    total: quoteRoundedTotal(total * (1 + (adjustments[id] ?? 0) / 100)),
    parcelas: installmentsFromLabel(id),
    enabled: Boolean(enabled[id]),
  }))

  const cardAdjustment = adjustments.cartao ?? 1
  base.push({
    id: 'cartao',
    label: `Cartao ${cardInstallments}x`,
    adjustment: cardAdjustment,
    total: quoteRoundedTotal(total * (1 + cardAdjustment / 100)),
    parcelas: cardInstallments,
    enabled: Boolean(enabled.cartao),
  })

  base.push({
    id: 'custom1',
    label: customCondition1.trim() || 'Condicao personalizada 1',
    adjustment: adjustments.custom1 ?? 0,
    total: quoteRoundedTotal(total * (1 + (adjustments.custom1 ?? 0) / 100)),
    parcelas: installmentsFromLabel(customCondition1),
    enabled: Boolean(enabled.custom1),
  })
  base.push({
    id: 'custom2',
    label: customCondition2.trim() || 'Condicao personalizada 2',
    adjustment: adjustments.custom2 ?? 0,
    total: quoteRoundedTotal(total * (1 + (adjustments.custom2 ?? 0) / 100)),
    parcelas: installmentsFromLabel(customCondition2),
    enabled: Boolean(enabled.custom2),
  })

  return base
}

function quoteConditionInputs(
  scenarios: QuoteConditionScenario[],
): OrcamentoCondicaoInput[] {
  return scenarios.map((scenario, index) => ({
    label: scenario.label,
    ajustePercentual: scenario.adjustment,
    valorTotal: scenario.total,
    parcelas: scenario.parcelas ?? installmentsFromLabel(scenario.label),
    ordem: index,
  }))
}

function quoteScenariosFromBudget(orcamento: Orcamento) {
  if (orcamento.condicoes?.length) {
    return [...orcamento.condicoes]
      .sort((a, b) => a.ordem - b.ordem)
      .map((condicao) => ({
        id: condicao.label,
        label: condicao.label,
        adjustment: condicao.ajustePercentual,
        total: quoteRoundedTotal(condicao.valorTotal),
        parcelas: condicao.parcelas ?? installmentsFromLabel(condicao.label),
      }))
  }

  return quotePaymentScenarios(orcamento.valorTotal, {
    'A vista': -3,
    '30 dias': 3,
    '30/60 dias': 4.5,
    '30/60/90 dias': 6,
    '60 dias': 6,
    '90 dias': 9,
    '120 dias': 12,
  })
}

function installmentsFromLabel(label: string) {
  const normalized = label.toLowerCase()
  const timesMatch = normalized.match(/(\d+)\s*x/)
  if (timesMatch) return Math.max(Number(timesMatch[1]), 1)
  if (normalized.includes('/')) {
    const parts = normalized.split('/').filter((part) => /\d+/.test(part))
    return Math.max(parts.length, 1)
  }
  return 1
}

function buildQuoteMessage(
  cliente: Cliente,
  itens: OrcamentoItemInput[],
  validade?: string,
  observacao?: string,
  paymentScenarios: QuoteConditionScenario[] = [],
) {
  const baseItems = quoteBaseItems(itens)
  const total = quoteBaseTotal(itens)
  const blocks = groupQuoteItemsForMessage(itens)
  const produtosTotal = baseItems.filter((item) => item.tipo === 'produto').reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
  const servicosTotal = baseItems.filter((item) => item.tipo === 'servico').reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
  const hasAlternatives = itens.some((item) => (item.apresentacao ?? 'normal') === 'alternativa')
  const hasSeparatedBlocks = quoteHasSeparatedBlocks(blocks)
  const lines = [
    `Olá, ${cliente.responsavel ?? cliente.nome}. Tudo bem?`,
    '',
    '📄 *Proposta comercial - Capital Truck Center*',
    '',
    `👤 Cliente: ${cliente.nome}`,
    cliente.cidade || cliente.uf ? `📍 Local: ${[cliente.cidade, cliente.uf].filter(Boolean).join('/')}` : undefined,
    validade ? `📅 Validade: ${dateLabel(validade)}` : undefined,
    '',
  ].filter(Boolean) as string[]

  blocks.forEach((block, blockIndex) => {
    const blockTitle = quoteDisplayBlockTitle(block, blockIndex)
    lines.push('------------------------------')
    lines.push(`📦 *${quoteMessageBlockTitle(blockTitle, block.kind)}*`)
    lines.push('')
    const mainItems = block.items.filter((item) => (item.apresentacao ?? 'normal') !== 'alternativa')
    const alternativeItems = block.items.filter((item) => (item.apresentacao ?? 'normal') === 'alternativa')

    mainItems.forEach((item) => {
      lines.push(`- ${formatQuantity(item.quantidade)}x ${item.descricao}`)
      lines.push(`  Unit.: ${money(item.valorUnitario)} | Total: ${money(item.valorTotal ?? 0)}`)
      lines.push('')
    })
    if (mainItems.length > 0) lines.push(`*Subtotal do bloco:* ${money(quotePrincipalTotal(block.items))}`)

    if (alternativeItems.length > 0) {
      if (mainItems.length > 0) lines.push('')
      lines.push('🔁 Alternativas deste bloco:')
      lines.push('')
      alternativeItems.forEach((item, index) => {
        lines.push(`Opção ${String.fromCharCode(65 + index)}: ${formatQuantity(item.quantidade)}x ${item.descricao}`)
        lines.push(`  Unit.: ${money(item.valorUnitario)} | Total: ${money(item.valorTotal ?? 0)}`)
        lines.push('')
      })
      lines.push(`*Opções:* ${quoteAlternativeRangeLabel(alternativeItems)}`)
    }
    lines.push('')
  })

  lines.push('------------------------------')
  lines.push('🧾 *Resumo da proposta*')
  lines.push('')
  if (hasSeparatedBlocks) {
    lines.push('Totais por bloco:')
    lines.push('')
    blocks.forEach((block, index) => {
      lines.push(`- ${quoteDisplayBlockTitle(block, index)}: ${quoteBlockTotalLabel(block)}`)
    })
  } else {
    if (produtosTotal > 0) lines.push(`Produtos: ${money(produtosTotal)}`)
    if (servicosTotal > 0) lines.push(`Serviços: ${money(servicosTotal)}`)
    lines.push(`Total principal: ${money(total)}`)
  }
  if (hasAlternatives) lines.push('', 'As alternativas são opções de escolha e não entram no subtotal principal do bloco.')
  if (paymentScenarios.length > 0) {
    if (hasSeparatedBlocks) {
      lines.push('', '💳 *Condições por bloco*')
      blocks.forEach((block, index) => {
        const hasConditionBase = quotePrincipalTotal(block.items) > 0 || block.items.some((item) => (item.apresentacao ?? 'normal') === 'alternativa')
        if (!hasConditionBase) return
        lines.push('')
        lines.push(`*${quoteDisplayBlockTitle(block, index)}*`)
        paymentScenarios.forEach((scenario) => {
          lines.push(`- ${quoteConditionLabel(scenario.label)}: ${quoteBlockConditionLabel(block, scenario)}`)
        })
      })
    } else {
      lines.push('', '💳 *Condições de pagamento*')
      paymentScenarios.forEach((scenario) => {
        lines.push(`- ${quoteConditionLabel(scenario.label)}: ${quoteConditionValueLabel(scenario.total, scenario.parcelas)}`)
      })
    }
  }
  if (observacao?.trim()) lines.push('', '📝 *Observações*', observacao.trim())
  lines.push('', '⚠️ Antes da emissão da ordem de compra, solicite a confirmação de disponibilidade, prazo e condições.')
  lines.push('', 'Posso confirmar disponibilidade para você?')
  return lines.join('\n')
}

function quoteMessageBlockTitle(title: string, kind: NonNullable<OrcamentoItemInput['apresentacao']>) {
  const prefix = title
  if (kind === 'alternativa' && !prefix.toLowerCase().includes('alternativa')) return `${prefix} - alternativas`
  if (kind === 'pacote' && !prefix.toLowerCase().includes('pacote')) return `${prefix} - pacote`
  if (kind === 'complementar' && !prefix.toLowerCase().includes('complement')) return `${prefix} - complementos`
  return prefix
}

function quoteDisplayBlockTitle(block: { title: string }, index: number) {
  const rawTitle = block.title.trim()
  const ordinal = quoteOrdinalBlockLabel(index)
  const namedTitle = rawTitle.replace(/^bloco\s*\d+\s*[-:–—]?\s*/i, '').trim()
  const normalized = rawTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  if (!rawTitle || /^\d+$/.test(normalized) || /^bloco\s*\d+$/.test(normalized)) return ordinal
  if (normalized === 'itens principais' || normalized === 'servicos' || normalized === 'servicos principais') return ordinal
  return namedTitle || rawTitle
}

function quoteOrdinalBlockLabel(index: number) {
  const labels = [
    'Primeiro bloco',
    'Segundo bloco',
    'Terceiro bloco',
    'Quarto bloco',
    'Quinto bloco',
    'Sexto bloco',
    'Sétimo bloco',
    'Oitavo bloco',
    'Nono bloco',
    'Décimo bloco',
  ]
  return labels[index] ?? `Bloco ${index + 1}`
}

function quoteConditionLabel(label: string) {
  if (label.toLowerCase() === 'a vista') return 'À vista'
  return label
}

function quoteRoundedTotal(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.round(value / 5) * 5
}

function moneyWithCents(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function quoteConditionValueLabel(total: number, parcelas = 1) {
  const roundedTotal = quoteRoundedTotal(total)
  if (parcelas <= 1) return money(roundedTotal)
  return `${money(roundedTotal)} (${parcelas}x de ${moneyWithCents(roundedTotal / parcelas)})`
}

function quotePdfFileName(clienteNome: string, date?: string) {
  const datePart = quotePdfDatePart(date)
  const safeCliente = clienteNome
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return `Orcamento - ${safeCliente || 'Cliente'} - ${datePart}`
}

function quotePdfDatePart(date?: string) {
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.slice(0, 10).split('-')
    return `${day}-${month}-${year}`
  }
  return new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
}

async function downloadQuotePdf(element: HTMLElement | null, clienteNome: string, date?: string) {
  if (!element) return
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const exportStage = document.createElement('div')
  const exportElement = element.cloneNode(true) as HTMLElement
  exportStage.className = 'pdf-export-stage'
  exportStage.appendChild(exportElement)
  document.body.appendChild(exportStage)

  try {
    await waitForImages(exportElement)
    const canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      windowWidth: exportElement.scrollWidth,
    })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2
    const imageWidth = contentWidth
    const pageCanvasHeight = Math.floor((contentHeight * canvas.width) / imageWidth)
    let sourceY = 0
    let pageIndex = 0

    while (sourceY < canvas.height) {
      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeight
      const context = pageCanvas.getContext('2d')
      if (!context) break
      context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
      if (pageIndex > 0) pdf.addPage()
      const sliceImageHeight = (sliceHeight * imageWidth) / canvas.width
      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, imageWidth, Math.min(sliceImageHeight, contentHeight))
      sourceY += sliceHeight
      pageIndex += 1
    }

    pdf.save(`${quotePdfFileName(clienteNome, date)}.pdf`)
  } finally {
    exportStage.remove()
  }
}

function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll('img'))
  return Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve()
    return new Promise<void>((resolve) => {
      image.onload = () => resolve()
      image.onerror = () => resolve()
    })
  }))
}

function groupQuoteItemsForMessage(itens: OrcamentoItemInput[]) {
  const groups = new Map<string, { kind: NonNullable<OrcamentoItemInput['apresentacao']>; items: OrcamentoItemInput[] }>()
  const order: string[] = []
  itens.forEach((item) => {
    const kind = item.apresentacao ?? 'normal'
    const groupLabel = item.observacao?.trim()
    const key = groupLabel || quoteDefaultBlockTitle(kind, item)
    if (!groups.has(key)) {
      groups.set(key, { kind, items: [] })
      order.push(key)
    }
    groups.get(key)?.items.push(item)
  })
  return order.map((key) => {
    const group = groups.get(key) ?? { kind: 'normal' as const, items: [] }
    const kind = quoteDominantBlockKind(group.items)
    return {
      title: key,
      kind,
      items: group.items,
      total: group.items.reduce((sum, item) => sum + (item.valorTotal ?? 0), 0),
    }
  })
}

function quoteDominantBlockKind(items: OrcamentoItemInput[]): NonNullable<OrcamentoItemInput['apresentacao']> {
  const kinds = items.map((item) => item.apresentacao ?? 'normal')
  if (kinds.every((kind) => kind === 'alternativa')) return 'alternativa'
  if (kinds.some((kind) => kind === 'pacote')) return 'pacote'
  if (kinds.every((kind) => kind === 'complementar')) return 'complementar'
  return 'normal'
}

function quoteDefaultBlockTitle(kind: NonNullable<OrcamentoItemInput['apresentacao']>, item: OrcamentoItemInput) {
  if (kind === 'alternativa') return 'Alternativas'
  if (kind === 'pacote') return 'Pacote principal'
  if (kind === 'complementar') return 'Complementos'
  return item.tipo === 'servico' ? 'Servicos' : 'Itens principais'
}

function quoteBlockTotalLabel(block: { items: OrcamentoItemInput[]; total: number; kind: NonNullable<OrcamentoItemInput['apresentacao']> }) {
  const baseTotal = quotePrincipalTotal(block.items)
  const alternativeItems = block.items.filter((item) => (item.apresentacao ?? 'normal') === 'alternativa')
  if (baseTotal > 0 && alternativeItems.length === 0) return money(baseTotal)
  if (baseTotal > 0 && alternativeItems.length > 0) return `${money(baseTotal)} + opcoes ${quoteAlternativeRangeLabel(alternativeItems)}`
  return quoteAlternativeRangeLabel(alternativeItems)
}

function quotePrincipalTotal(items: OrcamentoItemInput[]) {
  return items
    .filter((item) => (item.apresentacao ?? 'normal') !== 'alternativa')
    .reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
}

function quoteAlternativeRangeLabel(items: OrcamentoItemInput[]) {
  const totals = items.map((item) => item.valorTotal ?? 0).filter((value) => value > 0)
  if (totals.length === 0) return money(0)
  const min = Math.min(...totals)
  const max = Math.max(...totals)
  return min === max ? money(min) : `${money(min)} a ${money(max)}`
}

function quoteAlternativeAdjustedRangeLabel(items: OrcamentoItemInput[], scenario: QuoteConditionScenario) {
  const totals = items
    .map((item) => quoteRoundedTotal(quoteAdjustedTotal(item.valorTotal ?? 0, scenario.adjustment)))
    .filter((value) => value > 0)
  if (totals.length === 0) return money(0)
  const min = Math.min(...totals)
  const max = Math.max(...totals)
  const totalRange = min === max ? money(min) : `${money(min)} a ${money(max)}`
  const parcelas = scenario.parcelas ?? installmentsFromLabel(scenario.label)
  if (parcelas <= 1) return totalRange
  const minInstallment = min / parcelas
  const maxInstallment = max / parcelas
  const installmentRange = min === max
    ? moneyWithCents(minInstallment)
    : `${moneyWithCents(minInstallment)} a ${moneyWithCents(maxInstallment)}`
  return `${totalRange} (${parcelas}x de ${installmentRange})`
}

function quoteBlockConditionLabel(
  block: { items: OrcamentoItemInput[] },
  scenario: QuoteConditionScenario,
) {
  const principalTotal = quotePrincipalTotal(block.items)
  if (principalTotal > 0) {
    return quoteConditionValueLabel(quoteAdjustedTotal(principalTotal, scenario.adjustment), scenario.parcelas)
  }
  const alternativeItems = block.items.filter((item) => (item.apresentacao ?? 'normal') === 'alternativa')
  return quoteAlternativeAdjustedRangeLabel(alternativeItems, scenario)
}

function quoteHasSeparatedBlocks(blocks: Array<{ title: string; items: OrcamentoItemInput[] }>) {
  return blocks.filter((block) => block.items.length > 0).length > 1
}

function quoteAdjustedTotal(total: number, adjustment: number) {
  return total * (1 + adjustment / 100)
}

function QuoteProposalPreview({
  cliente,
  itens,
  total,
  validade,
  condicoes,
  observacao,
  vendedorNome,
}: {
  cliente: Cliente
  itens: OrcamentoItemInput[]
  total: number
  validade?: string
  condicoes?: QuoteConditionScenario[]
  observacao?: string
  vendedorNome?: string
}) {
  const blocks = groupQuoteItemsForMessage(itens)
  const baseItems = quoteBaseItems(itens)
  const produtosTotal = baseItems.filter((item) => item.tipo === 'produto').reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
  const servicosTotal = baseItems.filter((item) => item.tipo === 'servico').reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
  const hasSeparatedBlocks = quoteHasSeparatedBlocks(blocks)

  return (
    <>
      <div className="proposal-heading">
        <div>
          <img className="proposal-logo" src={capitalLogo} alt="Capital Truck Center" />
          <strong>Capital Truck Center</strong>
          <span>Proposta comercial</span>
        </div>
        <div className="proposal-meta">
          <small>{validade ? `Validade: ${dateLabel(validade)}` : 'Validade nao informada'}</small>
          <small>Emitida em {dateLabel(new Date().toISOString())}</small>
        </div>
      </div>
      <div className="proposal-client">
        <strong>{cliente.nome}</strong>
        <span>{[cliente.cidade, cliente.uf].filter(Boolean).join('/') || 'Local nao informado'}</span>
        <span>{cliente.whatsapp ?? cliente.telefone ?? cliente.cpfCnpj ?? cliente.codigoErp ?? 'Contato nao informado'}</span>
      </div>
      <div className="proposal-commercial">
        <span>Consultor comercial</span>
        <strong>{vendedorNome || cliente.vendedorNome || 'Capital Truck Center'}</strong>
      </div>
      <div className="proposal-blocks">
        {blocks.map((block, blockIndex) => {
          const blockTitle = quoteDisplayBlockTitle(block, blockIndex)
          const mainItems = block.items.filter((item) => (item.apresentacao ?? 'normal') !== 'alternativa')
          const alternativeItems = block.items.filter((item) => (item.apresentacao ?? 'normal') === 'alternativa')
          return (
            <section className={`proposal-block ${block.kind}`} key={`${block.title}-${blockIndex}`}>
              <div className="proposal-block-title">
                <strong>{blockTitle}</strong>
                <span>{quoteBlockHint(block.kind)}</span>
              </div>
              {mainItems.length > 0 && (
                <div className="proposal-lines">
                  {mainItems.map((item, index) => (
                    <div key={`${item.descricao}-${index}`}>
                      <span>{index + 1}. {formatQuantity(item.quantidade)}x {item.descricao}</span>
                      <strong>{money(item.valorTotal ?? 0)}</strong>
                    </div>
                  ))}
                </div>
              )}
              {alternativeItems.length > 0 && (
                <div className="proposal-alternatives">
                  <strong>Alternativas do bloco</strong>
                  {alternativeItems.map((item, index) => (
                    <div key={`${item.descricao}-alternative-${index}`}>
                      <span>Opcao {String.fromCharCode(65 + index)}. {formatQuantity(item.quantidade)}x {item.descricao}</span>
                      <strong>{money(item.valorTotal ?? 0)}</strong>
                    </div>
                  ))}
                </div>
              )}
              <div className="proposal-subtotal">
                <span>{mainItems.length > 0 ? 'Subtotal do bloco' : 'Faixa das opcoes'}</span>
                <strong>{quoteBlockTotalLabel(block)}</strong>
              </div>
            </section>
          )
        })}
        {itens.length === 0 && <span className="muted">Adicione itens para montar a proposta.</span>}
      </div>
      {hasSeparatedBlocks ? (
        <div className="proposal-block-totals">
          <strong>Totais por bloco</strong>
          {blocks.map((block, index) => (
            <div key={`total-${block.title}`}>
              <span>{quoteDisplayBlockTitle(block, index)}</span>
              <strong>{quoteBlockTotalLabel(block)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="proposal-total">
          <span>Total principal</span>
          <strong>{money(total)}</strong>
        </div>
      )}
      {itens.some((item) => (item.apresentacao ?? 'normal') === 'alternativa') && (
        <small>Alternativas nao somadas no total principal.</small>
      )}
      {(produtosTotal > 0 || servicosTotal > 0) && (
        <div className="proposal-breakdown">
          {produtosTotal > 0 && <span>Produtos: {money(produtosTotal)}</span>}
          {servicosTotal > 0 && <span>Servicos: {money(servicosTotal)}</span>}
        </div>
      )}
      {condicoes && condicoes.length > 0 && (
        <div className="proposal-conditions">
          {hasSeparatedBlocks
            ? blocks.map((block, index) => (
                <section className="proposal-condition-block" key={`condition-${block.title}`}>
                  <strong>{quoteDisplayBlockTitle(block, index)}</strong>
                  {condicoes.map((scenario) => (
                    <div key={`${block.title}-${scenario.label}`}>
                      <span>{quoteConditionLabel(scenario.label)}</span>
                      <b>{quoteBlockConditionLabel(block, scenario)}</b>
                    </div>
                  ))}
                </section>
              ))
            : condicoes.map((scenario) => (
                <span key={scenario.label}>{quoteConditionLabel(scenario.label)}: {quoteConditionValueLabel(scenario.total, scenario.parcelas)}</span>
              ))}
        </div>
      )}
      {observacao?.trim() && (
        <div className="proposal-notes">
          <strong>Observacoes</strong>
          <p>{observacao.trim()}</p>
        </div>
      )}
      <div className="proposal-footer">
        <strong>Capital Truck Center</strong>
        <span>Antes da emissao da ordem de compra, solicite a confirmacao de disponibilidade, prazo e condicoes.</span>
      </div>
    </>
  )
}

function quoteBlockHint(kind: NonNullable<OrcamentoItemInput['apresentacao']>) {
  if (kind === 'alternativa') return 'escolha uma opcao'
  if (kind === 'pacote') return 'itens em conjunto'
  if (kind === 'complementar') return 'recomendado'
  return 'item principal'
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? quantity.toString() : quantity.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function quoteItemFromVenda(venda: VendaItem): OrcamentoItemInput {
  return {
    codigo: venda.produtoCodigo,
    descricao: venda.produtoNome,
    tipo: 'produto',
    quantidade: venda.quantidade || 1,
    valorUnitario: venda.valorUnitario || (venda.valorTotal / Math.max(venda.quantidade || 1, 1)),
    descontoPercentual: 0,
    observacao: `Baseado na venda de ${dateLabel(venda.dataVenda)}${venda.nota ? `, nota ${venda.nota}` : ''}.`,
    apresentacao: 'normal',
  }
}

function quoteItemFromServico(servico: ServicoItem): OrcamentoItemInput {
  return {
    codigo: servico.servicoCodigo,
    descricao: servico.servicoNome,
    tipo: 'servico',
    quantidade: servico.quantidade || 1,
    valorUnitario: servico.valorUnitario || (servico.valorTotal / Math.max(servico.quantidade || 1, 1)),
    descontoPercentual: 0,
    observacao: `Baseado no servico de ${dateLabel(servico.dataServico)}${servico.placa ? `, placa ${servico.placa}` : ''}.`,
    apresentacao: 'complementar',
  }
}

function quoteItemFromCatalogo(item: CatalogoItem): OrcamentoItemInput {
  return {
    catalogoItemId: item.id,
    codigo: item.codigo,
    descricao: item.descricao,
    tipo: item.tipo,
    quantidade: 1,
    valorUnitario: item.preco,
    descontoPercentual: 0,
    observacao: item.grupo || item.marca || undefined,
    apresentacao: item.tipo === 'servico' ? 'complementar' : 'normal',
  }
}

function origemLabel(origemBase?: Cliente['origemBase']) {
  const labels: Record<NonNullable<Cliente['origemBase']>, string> = {
    capital_truck: 'Capital Truck',
    rodobens: 'Clientes sem cadastro',
    desconhecida: 'Origem pendente',
  }
  return origemBase ? labels[origemBase] : labels.desconhecida
}

function origemDetalheLabel(cliente: Cliente) {
  const detalhe = cliente.origemDetalhe ?? cliente.origem
  if (!detalhe) return 'Lista externa'
  return detalhe.replace(/rodobens/gi, 'lista externa')
}

function campaignStatusLabel(status: CampanhaEnvioStatus) {
  const labels: Record<CampanhaEnvioStatus, string> = {
    pendente: 'Pendente',
    enviado: 'Enviado',
    respondeu: 'Respondeu',
    nao_respondeu: 'Nao respondeu',
    virou_orcamento: 'Virou orcamento',
    ganhou: 'Ganhou',
    perdido: 'Perdido',
    nao_contatar: 'Nao contatar',
  }
  return labels[status] ?? status
}

function Cliente360({
  cliente,
  interacoes,
  orcamentos,
  vendasItens,
  servicosItens,
  veiculos,
  tarefas,
  campanhaEnvios,
  currentUser,
  onAddInteraction,
  onCreateTask,
  onCreateQuote,
  onBack,
}: {
  cliente: Cliente
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  vendasItens: VendaItem[]
  servicosItens: ServicoItem[]
  veiculos: ClienteVeiculoResumo[]
  tarefas: Tarefa[]
  campanhaEnvios: CampanhaEnvio[]
  currentUser: SessaoUsuario
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onCreateTask: () => Promise<Tarefa>
  onCreateQuote: (initialItems?: OrcamentoItemInput[]) => void
  onBack: () => void
}) {
  const [sellerFilter, setSellerFilter] = useState('todos')
  const [vehicleFilter, setVehicleFilter] = useState('todos')
  const [kindFilter, setKindFilter] = useState<'todos' | 'vendas' | 'servicos'>('todos')
  const [activeTab, setActiveTab] = useState<'resumo' | 'veiculos' | 'vendas' | 'servicos' | 'orcamentos' | 'tarefas' | 'campanhas' | 'timeline'>('resumo')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [contactChannel, setContactChannel] = useState<Interacao['canal']>('WhatsApp')
  const [contactNote, setContactNote] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [contactFeedback, setContactFeedback] = useState('')

  const clienteVendas = vendasItens.filter((venda) => venda.clienteId === cliente.id)
  const clienteServicos = servicosItens.filter((servico) => servico.clienteId === cliente.id)
  const clienteInteracoes = interacoes.filter((interacao) => interacao.clienteId === cliente.id)
  const clienteOrcamentos = orcamentos.filter((orcamento) => orcamento.clienteId === cliente.id)
  const clienteTarefas = tarefas.filter((tarefa) => tarefa.clienteId === cliente.id)
  const clienteCampanhas = campanhaEnvios.filter((envio) => envio.clienteId === cliente.id)
  const sellers = Array.from(new Set([
    ...clienteVendas.map((venda) => venda.vendedorNome).filter(Boolean),
    ...clienteServicos.map((servico) => servico.vendedorNome).filter(Boolean),
  ] as string[])).sort((a, b) => a.localeCompare(b))
  const vehicles = Array.from(new Set([
    ...veiculos.map((veiculo) => veiculo.placa).filter(Boolean),
    ...clienteServicos.map((servico) => servico.placa).filter(Boolean),
  ] as string[]))
    .sort((a, b) => a.localeCompare(b))

  const vendasFiltradas = clienteVendas.filter((venda) =>
    (kindFilter === 'todos' || kindFilter === 'vendas') &&
    (sellerFilter === 'todos' || venda.vendedorNome === sellerFilter) &&
    inDateRange(venda.dataVenda, startDate, endDate),
  )
  const servicosFiltrados = clienteServicos.filter((servico) =>
    (kindFilter === 'todos' || kindFilter === 'servicos') &&
    (sellerFilter === 'todos' || servico.vendedorNome === sellerFilter) &&
    (vehicleFilter === 'todos' || servico.placa === vehicleFilter) &&
    inDateRange(servico.dataServico, startDate, endDate),
  )
  const totalVendas = vendasFiltradas.reduce((total, venda) => total + venda.valorTotal, 0)
  const totalServicos = servicosFiltrados.reduce((total, servico) => total + servico.valorTotal, 0)
  const ticketMedio = vendasFiltradas.length + servicosFiltrados.length
    ? (totalVendas + totalServicos) / (vendasFiltradas.length + servicosFiltrados.length)
    : 0
  const allEvents = [
    ...clienteVendas.map((venda) => ({ data: venda.dataVenda, tipo: 'Venda', nome: venda.produtoNome, valor: venda.valorTotal })),
    ...clienteServicos.map((servico) => ({ data: servico.dataServico, tipo: 'Servico', nome: servico.servicoNome, valor: servico.valorTotal })),
  ].sort((a, b) => a.data.localeCompare(b.data))
  const produtoPrincipal = topByValue(clienteVendas, (venda) => venda.produtoNome, (venda) => venda.valorTotal)
  const servicoRecorrente = topByCount(clienteServicos, (servico) => servico.servicoNome)
  const frequenciaDias = averageDaysBetween(allEvents.map((item) => item.data))
  const ultimaMovimentacao = allEvents.at(-1)?.data
  const proximaRecompra = frequenciaDias && ultimaMovimentacao ? addDays(ultimaMovimentacao, Math.max(30, Math.round(frequenciaDias))) : undefined
  const veiculosResumo = buildVehicleSummary(veiculos, clienteServicos, clienteVendas)
  const tarefasAbertas = clienteTarefas.filter((tarefa) => tarefa.status === 'aberta')
  const orcamentosAbertos = clienteOrcamentos.filter((orcamento) => ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'].includes(orcamento.status))
  const ultimoOrcamento = [...clienteOrcamentos].sort((a, b) => b.data.localeCompare(a.data))[0]
  const latestMovements = buildClientServiceTimeline(clienteInteracoes, clienteOrcamentos, clienteTarefas, clienteCampanhas)
  const whatsappUrl = cliente.whatsapp
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(buildServiceOpeningMessage(cliente))}`
    : undefined

  async function handleCreateTask() {
    setIsCreatingTask(true)
    try {
      await onCreateTask()
      setActiveTab('tarefas')
    } finally {
      setIsCreatingTask(false)
    }
  }

  async function registerContact(resultado: string, createQuote = false) {
    setIsSavingContact(true)
    setContactFeedback('')
    try {
      const created = await onAddInteraction({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        canal: contactChannel,
        tipo: createQuote ? 'orcamento' : 'atendimento',
        resumo: contactNote.trim() || `Atendimento registrado: ${resultado}.`,
        resultado,
        proximaAcao: nextActionDate ? nextActionLabelFromResult(resultado) : undefined,
        dataProximaAcao: nextActionDate || undefined,
      })
      setContactFeedback(`Contato registrado em ${dateLabel(created.data)}.`)
      setContactNote('')
      setNextActionDate('')
      if (createQuote) onCreateQuote()
    } finally {
      setIsSavingContact(false)
    }
  }

  return (
    <section className="client360">
      <div className="panel wide client360-hero">
        <button className="button" type="button" onClick={onBack}>Voltar para clientes</button>
        <div>
          <span className="status-pill">{origemLabel(cliente.origemBase)}</span>
          <h2>{cliente.nome}</h2>
          <p>{cliente.cidade}/{cliente.uf} · {cliente.tipoCliente} · {cliente.vendedorNome ?? 'Sem vendedor responsavel'}</p>
        </div>
        <div className="client360-actions">
          {whatsappUrl && (
            <a className="button primary" href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> Abrir WhatsApp
            </a>
          )}
          <button className="button primary" type="button" onClick={() => onCreateQuote()}>Criar orcamento</button>
          <button className="button" type="button" onClick={handleCreateTask} disabled={isCreatingTask}>
            {isCreatingTask ? 'Criando...' : 'Criar tarefa'}
          </button>
        </div>
        <div className="info-grid">
          <Info label="CPF/CNPJ" value={cliente.cpfCnpj || 'Nao informado'} />
          <Info label="Codigo ERP" value={cliente.codigoErp || 'Nao informado'} />
          <Info label="WhatsApp" value={cliente.whatsapp || 'Nao informado'} />
          <Info label="Email" value={cliente.email || 'Nao informado'} />
          <Info label="Total vendas" value={money(cliente.totalComprado)} />
          <Info label="Total servicos" value={money(cliente.totalServicos)} />
          <Info label="Orcamentos abertos" value={orcamentosAbertos.length.toString()} />
          <Info label="Ultimo orcamento" value={ultimoOrcamento ? `${money(ultimoOrcamento.valorTotal)} · ${ultimoOrcamento.status}` : 'Sem historico'} />
        </div>
      </div>

      <section className="client360-workbench">
        <div className="panel client360-contact-panel">
          <div className="panel-header">
            <div>
              <h2>Atendimento agora</h2>
              <p>Registre o resultado do contato sem sair da ficha.</p>
            </div>
          </div>
          {contactFeedback && <div className="readiness ok">{contactFeedback}</div>}
          <div className="client360-contact-grid">
            <label>
              Canal
              <select value={contactChannel} onChange={(event) => setContactChannel(event.target.value as Interacao['canal'])}>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Ligacao">Ligacao</option>
                <option value="Email">Email</option>
                <option value="Presencial">Presencial</option>
              </select>
            </label>
            <label>
              Proxima acao
              <input type="date" value={nextActionDate} onChange={(event) => setNextActionDate(event.target.value)} />
            </label>
          </div>
          <label className="client360-contact-note">
            Observacao do contato
            <textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} placeholder="Ex.: pediu pneu 295/80 para cotar hoje, prefere pagamento 30/60." />
          </label>
          <div className="client360-result-actions">
            <button className="button primary" type="button" disabled={isSavingContact} onClick={() => registerContact('pediu orcamento', true)}>Pediu orcamento</button>
            <button className="button" type="button" disabled={isSavingContact} onClick={() => registerContact('respondeu')}>Respondeu</button>
            <button className="button" type="button" disabled={isSavingContact} onClick={() => registerContact('nao respondeu')}>Nao respondeu</button>
            <button className="button" type="button" disabled={isSavingContact} onClick={() => registerContact('comprar depois')}>Comprar depois</button>
            <button className="button" type="button" disabled={isSavingContact} onClick={() => registerContact('sem interesse')}>Sem interesse</button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Na mao para o contato</h2>
              <p>Contexto comercial antes de chamar o cliente.</p>
            </div>
          </div>
          <div className="status-list">
            <div className="status-row"><span>Ultima compra</span><strong>{dateLabel(cliente.ultimaCompraEm)}</strong></div>
            <div className="status-row"><span>Produto principal</span><strong>{produtoPrincipal || cliente.produtoPrincipal || 'Sem historico'}</strong></div>
            <div className="status-row"><span>Servico recorrente</span><strong>{servicoRecorrente || 'Sem historico'}</strong></div>
            <div className="status-row"><span>Proxima recompra</span><strong>{dateLabel(proximaRecompra)}</strong></div>
            <div className="status-row"><span>Tarefas abertas</span><strong>{tarefasAbertas.length}</strong></div>
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Filtros do historico</h2>
            <p>{vendasFiltradas.length} vendas · {servicosFiltrados.length} servicos · {money(totalVendas + totalServicos)}</p>
          </div>
          <Filter size={18} />
        </div>
        <div className="client360-filters">
          <label>
            Tipo
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}>
              <option value="todos">Vendas e servicos</option>
              <option value="vendas">Somente vendas</option>
              <option value="servicos">Somente servicos</option>
            </select>
          </label>
          <label>
            Vendedor historico
            <select value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)}>
              <option value="todos">Todos vendedores</option>
              {sellers.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
            </select>
          </label>
          <label>
            Veiculo/placa
            <select value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)}>
              <option value="todos">Todos veiculos</option>
              {vehicles.map((vehicle) => <option key={vehicle} value={vehicle}>{vehicle}</option>)}
            </select>
          </label>
          <label>
            De
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            Ate
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <button className="button" type="button" onClick={() => {
            setSellerFilter('todos')
            setVehicleFilter('todos')
            setKindFilter('todos')
            setStartDate('')
            setEndDate('')
          }}>
            Limpar filtros
          </button>
        </div>
      </section>

      <div className="metrics-grid">
        <Metric icon={WalletCards} label="Historico filtrado" value={money(totalVendas + totalServicos)} tone="green" />
        <Metric icon={Truck} label="Veiculos" value={veiculosResumo.length.toString()} tone="blue" />
        <Metric icon={UserRound} label="Vendedores historicos" value={sellers.length.toString()} tone="blue" />
        <Metric icon={BarChart3} label="Ticket medio" value={money(ticketMedio)} tone="amber" />
      </div>

      <div className="client360-tabs">
        <button className={activeTab === 'resumo' ? 'active' : ''} type="button" onClick={() => setActiveTab('resumo')}>Resumo</button>
        <button className={activeTab === 'veiculos' ? 'active' : ''} type="button" onClick={() => setActiveTab('veiculos')}>Veiculos</button>
        <button className={activeTab === 'vendas' ? 'active' : ''} type="button" onClick={() => setActiveTab('vendas')}>Vendas</button>
        <button className={activeTab === 'servicos' ? 'active' : ''} type="button" onClick={() => setActiveTab('servicos')}>Servicos</button>
        <button className={activeTab === 'orcamentos' ? 'active' : ''} type="button" onClick={() => setActiveTab('orcamentos')}>Orcamentos</button>
        <button className={activeTab === 'tarefas' ? 'active' : ''} type="button" onClick={() => setActiveTab('tarefas')}>Tarefas</button>
        <button className={activeTab === 'campanhas' ? 'active' : ''} type="button" onClick={() => setActiveTab('campanhas')}>Campanhas</button>
        <button className={activeTab === 'timeline' ? 'active' : ''} type="button" onClick={() => setActiveTab('timeline')}>Timeline</button>
      </div>

      {activeTab === 'resumo' && (
        <section className="detail-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Resumo comercial</h2>
                <p>Leitura rapida para orientar o proximo contato.</p>
              </div>
            </div>
            <div className="status-list">
              <div className="status-row"><span>Ultima compra</span><strong>{dateLabel(cliente.ultimaCompraEm)}</strong></div>
              <div className="status-row"><span>Ultimo servico</span><strong>{dateLabel(cliente.ultimoServicoEm)}</strong></div>
              <div className="status-row"><span>Frequencia media</span><strong>{frequenciaDias ? `${Math.round(frequenciaDias)} dias` : 'Sem base'}</strong></div>
              <div className="status-row"><span>Proxima recompra sugerida</span><strong>{dateLabel(proximaRecompra)}</strong></div>
              <div className="status-row"><span>Responsavel</span><strong>{cliente.responsavel || 'Nao informado'}</strong></div>
              <div className="status-row"><span>Origem</span><strong>{origemLabel(cliente.origemBase)}</strong></div>
              <div className="status-row"><span>Tarefas abertas</span><strong>{tarefasAbertas.length}</strong></div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Potencial de venda</h2>
                <p>Itens mais fortes para orientar abordagem e proposta.</p>
              </div>
            </div>
            <div className="status-list">
              <div className="status-row"><span>Produto principal</span><strong>{produtoPrincipal || cliente.produtoPrincipal || 'Sem historico'}</strong></div>
              <div className="status-row"><span>Servico recorrente</span><strong>{servicoRecorrente || 'Sem historico'}</strong></div>
              <div className="status-row"><span>Veiculos identificados</span><strong>{veiculosResumo.length}</strong></div>
              <div className="status-row"><span>Ticket medio filtrado</span><strong>{money(ticketMedio)}</strong></div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'veiculos' && (
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Veiculos e KM</h2>
            <p>Placas, quilometragem e historico vinculado ao cliente.</p>
          </div>
        </div>
        <div className="table">
          <div className="table-head client360-vehicle">
            <span>Veiculo</span>
            <span>KM</span>
            <span>Ultimo atendimento</span>
            <span>Historico</span>
            <span>Total</span>
          </div>
          {veiculosResumo.map((veiculo) => (
            <div className="table-row client360-vehicle" key={veiculo.id}>
              <span>
                <strong>{veiculo.placa || veiculo.chassi || 'Sem identificador'}</strong>
                <small>{veiculo.descricao || veiculo.origem || 'Sem descricao'}</small>
              </span>
              <span>{veiculo.ultimoKm ? veiculo.ultimoKm.toLocaleString('pt-BR') : 'Sem KM'}</span>
              <span>{dateLabel(veiculo.ultimoAtendimentoEm)}</span>
              <span>{veiculo.totalAtendimentos} registros</span>
              <strong>{money(veiculo.valorTotalAtendimentos)}</strong>
            </div>
          ))}
          {veiculosResumo.length === 0 && <div className="empty-state">Nenhum veiculo estruturado encontrado para este cliente.</div>}
        </div>
      </section>
      )}

      {activeTab === 'vendas' && (
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Vendas</h2>
            <p>Produtos comprados, vendedor historico e nota/pedido.</p>
          </div>
        </div>
        <div className="table">
          <div className="table-head client360-sale">
            <span>Data</span>
            <span>Produto</span>
            <span>Vendedor</span>
            <span>Veiculo/KM</span>
            <span>Total</span>
            <span>Acao</span>
          </div>
          {vendasFiltradas.map((venda) => (
            <div className="table-row client360-sale" key={venda.id}>
              <span>{dateLabel(venda.dataVenda)}</span>
              <span><strong>{venda.produtoNome}</strong><small>{venda.produtoCodigo || venda.medida || venda.marca || 'Sem detalhe'}</small></span>
              <span>{venda.vendedorNome ?? 'Sem vendedor'}</span>
              <span>{venda.kmExtraido ? `${venda.kmExtraido.toLocaleString('pt-BR')} km` : venda.veiculoObservacao || venda.nota || venda.pedido || 'Sem veiculo'}</span>
              <strong>{money(venda.valorTotal)}</strong>
              <button className="button compact-button" type="button" onClick={() => onCreateQuote([quoteItemFromVenda(venda)])}>Orcar</button>
            </div>
          ))}
          {vendasFiltradas.length === 0 && <div className="empty-state">Nenhuma venda neste filtro.</div>}
        </div>
      </section>
      )}

      {activeTab === 'servicos' && (
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Servicos e veiculos</h2>
            <p>Quando a placa veio no arquivo, ela aparece aqui para filtrar o veiculo.</p>
          </div>
        </div>
        <div className="table">
          <div className="table-head client360-service">
            <span>Data</span>
            <span>Servico</span>
            <span>Veiculo</span>
            <span>Vendedor</span>
            <span>Total</span>
            <span>Acao</span>
          </div>
          {servicosFiltrados.map((servico) => (
            <div className="table-row client360-service" key={servico.id}>
              <span>{dateLabel(servico.dataServico)}</span>
              <span><strong>{servico.servicoNome}</strong><small>{servico.observacao || servico.veiculoObservacao || servico.servicoCodigo || 'Sem observacao'}</small></span>
              <span>{servico.placa || 'Sem placa'}<small>{servico.kmExtraido ? `${servico.kmExtraido.toLocaleString('pt-BR')} km` : ''}</small></span>
              <span>{servico.vendedorNome ?? 'Sem vendedor'}</span>
              <strong>{money(servico.valorTotal)}</strong>
              <button className="button compact-button" type="button" onClick={() => onCreateQuote([quoteItemFromServico(servico)])}>Orcar</button>
            </div>
          ))}
          {servicosFiltrados.length === 0 && <div className="empty-state">Nenhum servico neste filtro.</div>}
        </div>
      </section>
      )}

      {activeTab === 'orcamentos' && (
      <section className="detail-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Orcamentos</h2>
              <p>{clienteOrcamentos.length} registros.</p>
            </div>
          </div>
          <div className="status-list">
            {clienteOrcamentos.map((orcamento) => (
              <div className="status-row" key={orcamento.id}>
                <span>{dateLabel(orcamento.data)} · {orcamento.status}</span>
                <strong>{money(orcamento.valorTotal)}</strong>
              </div>
            ))}
            {clienteOrcamentos.length === 0 && <div className="empty-state">Sem orcamentos.</div>}
          </div>
        </div>
      </section>
      )}
      {activeTab === 'tarefas' && (
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Tarefas e atividades</h2>
              <p>{tarefasAbertas.length} abertas de {clienteTarefas.length} tarefas registradas.</p>
            </div>
            <button className="button" type="button" onClick={handleCreateTask} disabled={isCreatingTask}>
              {isCreatingTask ? 'Criando...' : 'Nova tarefa'}
            </button>
          </div>
          <div className="table">
            <div className="table-head client360-task">
              <span>Vencimento</span>
              <span>Tarefa</span>
              <span>Responsavel</span>
              <span>Origem</span>
              <span>Status</span>
            </div>
            {clienteTarefas.map((tarefa) => (
              <div className="table-row client360-task" key={tarefa.id}>
                <span>{dateLabel(tarefa.dataVencimento)}</span>
                <span><strong>{tarefa.titulo}</strong><small>{tarefa.descricao || 'Sem descricao'}</small></span>
                <span>{tarefa.vendedorNome || 'Sem responsavel'}</span>
                <span>{tarefa.origem}</span>
                <strong>{tarefa.status}</strong>
              </div>
            ))}
            {clienteTarefas.length === 0 && <div className="empty-state">Nenhuma tarefa criada para este cliente.</div>}
          </div>
        </section>
      )}

      {activeTab === 'campanhas' && (
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Campanhas do cliente</h2>
              <p>Historico de abordagens em campanhas e resultado comercial.</p>
            </div>
          </div>
          <div className="table">
            <div className="table-head client360-campaign">
              <span>Campanha</span>
              <span>Status</span>
              <span>Telefone</span>
              <span>Orcamento</span>
              <span>Receita</span>
            </div>
            {clienteCampanhas.map((envio) => (
              <div className="table-row client360-campaign" key={envio.id}>
                <span><strong>{envio.campanhaNome || envio.campanhaId}</strong><small>{envio.mensagemFinal}</small></span>
                <span>{campaignStatusLabel(envio.status)}</span>
                <span>{envio.telefone || 'Sem telefone'}</span>
                <span>{envio.virouOrcamento ? 'Sim' : 'Nao'}</span>
                <strong>{money(envio.receitaAtribuida ?? 0)}</strong>
              </div>
            ))}
            {clienteCampanhas.length === 0 && <div className="empty-state">Nenhum envio de campanha registrado para este cliente.</div>}
          </div>
        </section>
      )}

      {activeTab === 'timeline' && (
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <h2>Timeline operacional</h2>
              <p>Contatos, orcamentos, tarefas e campanhas em ordem cronologica.</p>
            </div>
          </div>
          <div className="timeline">
            {latestMovements.map((event) => (
              <div className={`timeline-item ${event.tone ?? ''}`} key={event.id}>
                <CheckCircle2 size={16} />
                <span>
                  <strong>{event.title}</strong>
                  <small>{dateLabel(event.date)} · {event.detail}</small>
                </span>
              </div>
            ))}
            {latestMovements.length === 0 && <div className="empty-state">Sem movimentos registrados.</div>}
          </div>
        </section>
      )}
    </section>
  )
}

function inDateRange(value: string | undefined, startDate: string, endDate: string) {
  if (!value) return true
  const day = value.slice(0, 10)
  if (startDate && day < startDate) return false
  if (endDate && day > endDate) return false
  return true
}

function buildServiceOpeningMessage(cliente: Cliente) {
  const firstName = (cliente.responsavel || cliente.nome).split(' ')[0]
  return `Bom dia, ${firstName}. Aqui é da Capital Truck Center. Estou passando para ver se precisa cotar pneus ou algum serviço.`
}

function nextActionLabelFromResult(resultado: string) {
  if (resultado === 'nao respondeu') return 'Tentar novo contato'
  if (resultado === 'comprar depois') return 'Retomar oportunidade'
  if (resultado === 'pediu orcamento') return 'Follow-up de proposta'
  return 'Próximo contato'
}

function buildClientServiceTimeline(
  interacoes: Interacao[],
  orcamentos: Orcamento[],
  tarefas: Tarefa[],
  campanhas: CampanhaEnvio[],
) {
  const events = [
    ...interacoes.map((interacao) => ({
      id: `interacao-${interacao.id}`,
      date: interacao.data,
      title: `${interacao.canal} · ${interacao.resultado}`,
      detail: interacao.resumo,
      tone: 'ok',
    })),
    ...orcamentos.map((orcamento) => ({
      id: `orcamento-${orcamento.id}`,
      date: orcamento.data,
      title: `Orcamento ${orcamento.status}`,
      detail: `${money(orcamento.valorTotal)} · validade ${dateLabel(orcamento.validade)}`,
      tone: orcamento.status === 'perdido' ? 'danger' : orcamento.status === 'ganho' ? 'ok' : 'warn',
    })),
    ...tarefas.map((tarefa) => ({
      id: `tarefa-${tarefa.id}`,
      date: tarefa.concluidaEm || tarefa.dataVencimento,
      title: `Tarefa ${tarefa.status}`,
      detail: `${tarefa.titulo}${tarefa.descricao ? ` · ${tarefa.descricao}` : ''}`,
      tone: tarefa.status === 'aberta' ? 'warn' : 'ok',
    })),
    ...campanhas.map((envio) => ({
      id: `campanha-${envio.id}`,
      date: envio.dataMarcadoEnviado || envio.dataAberturaWhatsapp || new Date(0).toISOString(),
      title: `Campanha · ${campaignStatusLabel(envio.status)}`,
      detail: envio.campanhaNome || envio.mensagemFinal || 'Campanha sem nome',
      tone: envio.status === 'perdido' || envio.status === 'nao_contatar' ? 'danger' : envio.status === 'ganhou' ? 'ok' : 'warn',
    })),
  ]
  return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40)
}

function topByValue<T>(items: T[], label: (item: T) => string | undefined, value: (item: T) => number) {
  const totals = new Map<string, number>()
  items.forEach((item) => {
    const key = label(item)?.trim()
    if (!key) return
    totals.set(key, (totals.get(key) ?? 0) + value(item))
  })
  return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
}

function topByCount<T>(items: T[], label: (item: T) => string | undefined) {
  const totals = new Map<string, number>()
  items.forEach((item) => {
    const key = label(item)?.trim()
    if (!key) return
    totals.set(key, (totals.get(key) ?? 0) + 1)
  })
  return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
}

function averageDaysBetween(dates: string[]) {
  const ordered = Array.from(new Set(dates.map((date) => date.slice(0, 10)))).sort()
  if (ordered.length < 2) return 0
  const gaps = ordered.slice(1).map((date, index) => {
    const current = new Date(`${date}T12:00:00`)
    const previous = new Date(`${ordered[index]}T12:00:00`)
    return Math.max(0, Math.round((current.getTime() - previous.getTime()) / 86400000))
  })
  return gaps.reduce((total, gap) => total + gap, 0) / gaps.length
}

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date.slice(0, 10)}T12:00:00`)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate.toISOString().slice(0, 10)
}

function buildVehicleSummary(
  veiculos: ClienteVeiculoResumo[],
  servicos: ServicoItem[],
  vendas: VendaItem[],
): ClienteVeiculoResumo[] {
  const byIdOrPlate = new Map<string, ClienteVeiculoResumo>()

  veiculos.forEach((veiculo) => {
    const summary = { ...veiculo }
    byIdOrPlate.set(veiculo.id, summary)
    if (veiculo.placa) byIdOrPlate.set(`placa:${veiculo.placa}`, summary)
  })

  servicos.forEach((servico) => {
    const key = servico.veiculoId ?? (servico.placa ? `placa:${servico.placa}` : '')
    if (!key) return
    const isExistingVehicle = byIdOrPlate.has(key)
    const current = byIdOrPlate.get(key) ?? {
      id: key,
      clienteId: servico.clienteId,
      placa: servico.placa,
      totalAtendimentos: 0,
      valorTotalAtendimentos: 0,
    }
    if (!isExistingVehicle) {
      current.totalAtendimentos += 1
      current.valorTotalAtendimentos += servico.valorTotal
    }
    current.ultimoAtendimentoEm = maxDate(current.ultimoAtendimentoEm, servico.dataServico)
    current.primeiroAtendimentoEm = minDate(current.primeiroAtendimentoEm, servico.dataServico)
    if (servico.kmExtraido && (!current.ultimoKm || servico.kmExtraido > current.ultimoKm)) {
      current.ultimoKm = servico.kmExtraido
      current.kmAtualizadoEm = servico.dataServico
    }
    byIdOrPlate.set(key, current)
  })

  vendas.forEach((venda) => {
    if (!venda.veiculoId) return
    const current = byIdOrPlate.get(venda.veiculoId)
    if (!current) return
    current.valorTotalAtendimentos += venda.valorTotal
    current.ultimoAtendimentoEm = maxDate(current.ultimoAtendimentoEm, venda.dataVenda)
    if (venda.kmExtraido && (!current.ultimoKm || venda.kmExtraido > current.ultimoKm)) {
      current.ultimoKm = venda.kmExtraido
      current.kmAtualizadoEm = venda.dataVenda
    }
  })

  return Array.from(new Map(Array.from(byIdOrPlate.values()).map((veiculo) => [veiculo.id, veiculo])).values())
    .sort((a, b) => (b.ultimoAtendimentoEm ?? '').localeCompare(a.ultimoAtendimentoEm ?? ''))
}

function maxDate(current: string | undefined, next: string) {
  return !current || next > current ? next : current
}

function minDate(current: string | undefined, next: string) {
  return !current || next < current ? next : current
}

function Importacoes({
  importacoes,
  onAddImportacao,
}: {
  importacoes: Importacao[]
  onAddImportacao: (importacao: Importacao) => void
}) {
  const [arquivosResumo, setArquivosResumo] = useState<ImportacaoArquivoResumo[]>([])
  const [qualidadeResumo, setQualidadeResumo] = useState<ImportacaoQualidadeResumo | undefined>()
  const [previews, setPreviews] = useState<XmlImportPreview[]>([])
  const [workbookPreviews, setWorkbookPreviews] = useState<WorkbookImportPreview[]>([])
  const [referencePreview, setReferencePreview] = useState<ReferenceImportPreview | null>(null)
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const [isReading, setIsReading] = useState(false)
  const [isReadingWorkbook, setIsReadingWorkbook] = useState(false)
  const [isReadingReference, setIsReadingReference] = useState(false)
  const [isImportingReference, setIsImportingReference] = useState(false)
  const [isFinalizingImport, setIsFinalizingImport] = useState(false)
  const [referenceImportResult, setReferenceImportResult] = useState('')
  const [error, setError] = useState('')
  const [registeredFiles, setRegisteredFiles] = useState<string[]>([])
  const arquivosPorImportacao = useMemo(() => {
    return arquivosResumo.reduce<Record<string, ImportacaoArquivoResumo[]>>((acc, arquivo) => {
      acc[arquivo.importacaoId] = [...(acc[arquivo.importacaoId] ?? []), arquivo]
      return acc
    }, {})
  }, [arquivosResumo])
  const importacaoIndicadores = useMemo(() => {
    const recentes = importacoes.slice(0, 10)
    return {
      linhas: recentes.reduce((total, importacao) => total + importacao.totalItens, 0),
      novos: recentes.reduce((total, importacao) => total + (importacao.itensCriados ?? 0), 0),
      ignorados: recentes.reduce((total, importacao) => total + (importacao.itensIgnorados ?? 0), 0),
      clientesCriados: recentes.reduce((total, importacao) => total + importacao.clientesCriados, 0),
    }
  }, [importacoes])
  const importacoesRecentes = useMemo(() => importacoes.slice(0, 8), [importacoes])

  useEffect(() => {
    listImportacaoArquivos().then(setArquivosResumo).catch(() => setArquivosResumo([]))
    getImportacaoQualidadeResumo().then(setQualidadeResumo).catch(() => setQualidadeResumo(undefined))
  }, [importacoes.length])

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setIsReading(true)
    setError('')

    try {
      setPreviews(await previewXmlFiles(files))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel ler o XML.')
    } finally {
      setIsReading(false)
    }
  }

  async function handleWorkbookFiles(files: FileList | null) {
    if (!files?.length) return
    setIsReadingWorkbook(true)
    setError('')

    try {
      setWorkbookPreviews(await previewWorkbookFiles(files))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel ler a planilha.')
    } finally {
      setIsReadingWorkbook(false)
    }
  }

  async function handleReferenceFiles(files: FileList | null) {
    if (!files?.length) return
    setIsReadingReference(true)
    setError('')
    setReferenceImportResult('')

    try {
      const selectedFiles = Array.from(files)
      setReferenceFiles(selectedFiles)
      setReferencePreview(await previewReferenceImportFiles(selectedFiles))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel validar os arquivos diarios.')
    } finally {
      setIsReadingReference(false)
    }
  }

  async function registerPreview(preview: XmlImportPreview) {
    setError('')

    try {
      const created = await createImportacaoPreview({
        tipo: 'xml-diario',
        arquivoNome: preview.arquivoNome,
        totalItens: preview.totalItens,
        clientesEncontrados: preview.clientesDetectados,
        conflitos: preview.avisos.length,
      })
      onAddImportacao(created)
      setRegisteredFiles((current) => [...current, preview.arquivoNome])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar a previa.')
    }
  }

  async function registerWorkbookPreview(preview: WorkbookImportPreview) {
    setError('')

    try {
      const created = await createImportacaoPreview({
        tipo: 'base-inicial',
        arquivoNome: preview.arquivoNome,
        totalItens: preview.totalRows,
        clientesEncontrados: preview.clientesDetectados,
        conflitos: workbookIssueCount(preview),
      })
      onAddImportacao(created)
      setRegisteredFiles((current) => [...current, preview.arquivoNome])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar a previa da planilha.')
    }
  }

  async function registerReferencePreview(preview: ReferenceImportPreview) {
    setError('')

    try {
      const created = await createImportacaoPreview({
        tipo: 'referencias-diarias',
        arquivoNome: preview.arquivoNome,
        totalItens: preview.itensDetectados,
        clientesEncontrados: preview.clientesDetectados,
        conflitos: preview.avisos.length,
      })
      onAddImportacao(created)
      setRegisteredFiles((current) => [...current, preview.arquivoNome])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar a previa da importacao diaria.')
    }
  }

  async function runReferenceImport() {
    if (!referencePreview?.ready || referenceFiles.length === 0) return
    setIsImportingReference(true)
    setError('')
    setReferenceImportResult('')

    try {
      const result = await importReferenceFiles(referenceFiles)
      const catalogoResumo = result.catalogo
        ? ` Catalogo: ${result.catalogo.itens} itens, ${result.catalogo.precosNovos ?? 0} precos novos, ${result.catalogo.precosAlterados ?? 0} alterados, ${result.catalogo.precosInalterados ?? 0} inalterados.`
        : ''
      const postProcessResumo = result.postProcess
        ? ` Pos-processamento: ${result.postProcess.clientes_atualizados ?? 0} clientes recalculados, ${result.postProcess.oportunidades_geradas ?? 0} oportunidades e ${result.postProcess.tarefas_followup?.tarefas_followup_total ?? 0} follow-ups sincronizados.`
        : ''
      setReferenceImportResult(
        `Importacao concluida: ${result.clientes} clientes, ${result.veiculos} veiculos, ${result.ordens} ordens, ${result.vendas.created + result.servicos.created} itens.${catalogoResumo}${postProcessResumo}`,
      )
      const updated = await listImportacoes()
      const created = updated.find((item) => item.id === result.importacaoId)
      if (created) onAddImportacao(created)
      setArquivosResumo(await listImportacaoArquivos())
      setQualidadeResumo(await getImportacaoQualidadeResumo())
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel concluir a importacao diaria.')
    } finally {
      setIsImportingReference(false)
    }
  }

  async function runImportPostProcess() {
    setIsFinalizingImport(true)
    setError('')
    setReferenceImportResult('')

    try {
      const result = await finalizeImportacaoDiaria()
      setReferenceImportResult(
        `Fechamento reprocessado: ${result.clientes_atualizados ?? 0} clientes recalculados, ${result.oportunidades_geradas ?? 0} oportunidades e ${result.tarefas_followup?.tarefas_followup_total ?? 0} follow-ups sincronizados.`,
      )
      setQualidadeResumo(await getImportacaoQualidadeResumo())
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel reprocessar o fechamento da importacao.')
    } finally {
      setIsFinalizingImport(false)
    }
  }

  return (
    <section className="grid-layout">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Pipeline de importacao</h2>
            <p>Base Excel inicial, XML diario e cadastro semanal entram pelo mesmo controle.</p>
          </div>
          <FileUp size={18} />
        </div>
        <div className="import-flow">
          {['Selecionar arquivos', 'Extrair itens', 'Deduplicar', 'Previa', 'Confirmar', 'Auditar'].map((step) => (
            <div key={step}>{step}</div>
          ))}
        </div>
      </section>
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Saude da base</h2>
            <p>Alertas operacionais calculados direto no Supabase.</p>
          </div>
          <div className="panel-actions">
            <button
              className="button"
              type="button"
              disabled={isFinalizingImport}
              onClick={runImportPostProcess}
            >
              <RefreshCw size={16} />
              {isFinalizingImport ? 'Reprocessando...' : 'Reprocessar fechamento'}
            </button>
            <ShieldCheck size={18} />
          </div>
        </div>
        <div className="metrics-grid">
          <Metric
            icon={FileUp}
            label="Ultima importacao"
            value={dateLabel(qualidadeResumo?.ultimaImportacaoEm)}
            tone={qualidadeResumo?.ultimaImportacaoStatus === 'erro' ? 'red' : 'green'}
          />
          <Metric
            icon={CheckCircle2}
            label="Arquivos obrigatorios"
            value={`${qualidadeResumo?.arquivosObrigatoriosOk ?? 0}/${qualidadeResumo?.arquivosObrigatoriosTotal ?? 4}`}
            tone={(qualidadeResumo?.arquivosObrigatoriosOk ?? 0) >= (qualidadeResumo?.arquivosObrigatoriosTotal ?? 4) ? 'green' : 'amber'}
          />
          <Metric icon={AlertTriangle} label="Conflitos pendentes" value={(qualidadeResumo?.conflitosPendentes ?? 0).toString()} tone="amber" />
          <Metric icon={UsersRound} label="Sem vendedor" value={(qualidadeResumo?.clientesSemVendedor ?? 0).toString()} tone="amber" />
          <Metric
            icon={Gauge}
            label="Fila oportunidades"
            value={(qualidadeResumo?.oportunidadesAtivas ?? 0).toString()}
            tone={qualidadeResumo?.oportunidadesDesatualizadas ? 'red' : 'green'}
          />
        </div>
        {referenceImportResult && <div className="success-alert">{referenceImportResult}</div>}
        <div className="status-list quality-list">
          <div className="status-row"><span>Clientes sem WhatsApp</span><strong>{qualidadeResumo?.clientesSemWhatsapp ?? 0}</strong></div>
          <div className="status-row"><span>Origem desconhecida</span><strong>{qualidadeResumo?.clientesOrigemDesconhecida ?? 0}</strong></div>
          <div className="status-row"><span>Status da ultima importacao</span><strong>{qualidadeResumo?.ultimaImportacaoStatus ?? 'Sem registro'}</strong></div>
          <div className="status-row">
            <span>Fila recalculada</span>
            <strong>{qualidadeResumo?.oportunidadesAtualizadoEm ? dateLabel(qualidadeResumo.oportunidadesAtualizadoEm) : 'Sem registro'}</strong>
          </div>
          {qualidadeResumo?.oportunidadesDesatualizadas && (
            <div className="status-row danger-row">
              <span>Fechamento pendente</span>
              <strong>Reprocessar</strong>
            </div>
          )}
        </div>
        <div className="info-grid import-quality">
          <Info label="Linhas recentes" value={importacaoIndicadores.linhas.toString()} />
          <Info label="Itens novos" value={importacaoIndicadores.novos.toString()} />
          <Info label="Ignorados/repetidos" value={importacaoIndicadores.ignorados.toString()} />
          <Info label="Clientes novos" value={importacaoIndicadores.clientesCriados.toString()} />
        </div>
      </section>
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Previa de XML diario</h2>
            <p>Escolha um ou mais XMLs para validar a estrutura antes da importacao.</p>
          </div>
          <label className="file-button">
            <FileUp size={16} />
            {isReading ? 'Lendo...' : 'Selecionar XML'}
            <input type="file" accept=".xml,text/xml" multiple onChange={(event) => handleFiles(event.target.files)} />
          </label>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="reference-import-box">
          <div className="reference-import-copy">
            <h2>Importacao diaria Capital</h2>
            <p>Valida carros atendidos, clientes, vendas de produtos, vendas de servicos e listas de preco.</p>
          </div>
          <label className="file-button">
            <FileUp size={16} />
            {isReadingReference ? 'Validando...' : 'Selecionar pacote'}
            <input type="file" accept=".xls,.xlsx,.csv" multiple onChange={(event) => handleReferenceFiles(event.target.files)} />
          </label>
        </div>
        {referencePreview && (
          <div className="preview-card reference-preview">
            <div className="panel-header">
              <div>
                <h2>{referencePreview.ready ? 'Pacote pronto para importar' : 'Pacote incompleto'}</h2>
                <p>
                  {referencePreview.files.filter((file) => file.status === 'ok').length} arquivos reconhecidos -
                  {' '}{referencePreview.itensDetectados} itens - {referencePreview.ordensDetectadas} ordens
                </p>
              </div>
              <button
                className="button primary"
                disabled={!referencePreview.ready || registeredFiles.includes(referencePreview.arquivoNome)}
                onClick={() => registerReferencePreview(referencePreview)}
                type="button"
              >
                {registeredFiles.includes(referencePreview.arquivoNome) ? 'Previa registrada' : 'Registrar previa'}
              </button>
              <button
                className="button"
                disabled={!referencePreview.ready || isImportingReference}
                onClick={runReferenceImport}
                type="button"
              >
                {isImportingReference ? 'Importando...' : 'Importar agora'}
              </button>
            </div>
            {referenceImportResult && <div className="success-alert">{referenceImportResult}</div>}
            <div className={`readiness ${referencePreview.ready ? 'ok' : 'danger'}`}>
              <strong>{referencePreview.ready ? 'Estrutura obrigatoria reconhecida' : 'Faltam arquivos obrigatorios'}</strong>
              <span>Clientes, ordens, itens, placas e KM serao deduplicados antes de gravar.</span>
            </div>
            <div className="info-grid import-quality">
              <Info label="Clientes" value={referencePreview.clientesDetectados.toString()} />
              <Info label="Ordens" value={referencePreview.ordensDetectadas.toString()} />
              <Info label="Itens" value={referencePreview.itensDetectados.toString()} />
              <Info label="Placas" value={referencePreview.placasDetectadas.toString()} />
              <Info label="KM" value={referencePreview.kmsDetectados.toString()} />
            </div>
            {referencePreview.avisos.length > 0 && (
              <div className="warning-list">
                {referencePreview.avisos.map((aviso) => <span key={aviso}>{aviso}</span>)}
              </div>
            )}
            <div className="table compact">
              <div className="table-head reference-file">
                <span>Arquivo</span>
                <span>Status</span>
                <span>Linhas</span>
                <span>Clientes</span>
                <span>Ordens</span>
                <span>Itens</span>
                <span>Placas/KM</span>
              </div>
              {referencePreview.files.map((file) => (
                <div className="table-row reference-file" key={file.kind}>
                  <span>{file.label}</span>
                  <span>{file.status === 'ok' ? file.fileName : file.required ? 'Obrigatorio ausente' : 'Opcional ausente'}</span>
                  <span>{file.totalRows}</span>
                  <span>{file.clientes}</span>
                  <span>{file.ordens}</span>
                  <span>{file.itens}</span>
                  <span>{file.placas}/{file.kms}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="dual-upload">
          <label className="file-button secondary">
            <FileUp size={16} />
            {isReadingWorkbook ? 'Lendo planilha...' : 'Selecionar Excel'}
            <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={(event) => handleWorkbookFiles(event.target.files)} />
          </label>
          <span>Use para validar abas, linhas e campos essenciais da base inicial.</span>
        </div>
        {workbookPreviews.length > 0 && (
          <div className="preview-list">
            {workbookPreviews.map((preview) => {
              const stats = workbookStats(preview)
              const readiness = workbookReadiness(preview)
              return (
                <div className="preview-card" key={preview.arquivoNome}>
                  <div className="panel-header">
                    <div>
                      <h2>{preview.arquivoNome}</h2>
                      <p>
                        {preview.totalRows} linhas - {preview.clientesDetectados} clientes detectados - {preview.clientesDuplicados} duplicados
                      </p>
                    </div>
                    <button
                      className="button primary"
                      disabled={registeredFiles.includes(preview.arquivoNome)}
                      onClick={() => registerWorkbookPreview(preview)}
                      type="button"
                    >
                      {registeredFiles.includes(preview.arquivoNome) ? 'Registrada' : 'Registrar previa'}
                    </button>
                  </div>
                  <div className={`readiness ${readiness.tone}`}>
                    <strong>{readiness.label}</strong>
                    <span>{readiness.detail}</span>
                  </div>
                  <div className="info-grid import-quality">
                    <Info label="Abas clientes" value={stats.clientesSheets.toString()} />
                    <Info label="Abas vendas" value={stats.vendasSheets.toString()} />
                    <Info label="Abas servicos" value={stats.servicosSheets.toString()} />
                    <Info label="Duplicados" value={preview.clientesDuplicados.toString()} />
                    <Info label="Campos faltantes" value={workbookIssueCount(preview).toString()} />
                  </div>
                  {preview.avisos.length > 0 && (
                    <div className="warning-list">
                      {preview.avisos.map((aviso) => <span key={aviso}>{aviso}</span>)}
                    </div>
                  )}
                  <div className="recommendation-list">
                    {workbookRecommendations(preview).map((recommendation) => (
                      <div key={recommendation}>
                        <CheckCircle2 size={15} />
                        <span>{recommendation}</span>
                      </div>
                    ))}
                  </div>
                  <div className="table compact">
                    <div className="table-head workbook">
                      <span>Aba</span>
                      <span>Tipo</span>
                      <span>Linhas</span>
                      <span>Clientes</span>
                      <span>Campos</span>
                      <span>Avisos</span>
                    </div>
                    {preview.sheets.map((sheet) => (
                      <div className="table-row workbook" key={sheet.sheetName}>
                        <span>{sheet.sheetName}</span>
                        <span>{sheet.role}</span>
                        <span>{sheet.totalRows}</span>
                        <span>{sheet.uniqueClientKeys}</span>
                        <span>{sheet.headers.slice(0, 4).join(', ') || 'Sem cabecalho'}</span>
                        <span>{sheet.missingClientName + sheet.missingDocument + sheet.duplicateClientKeys}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {previews.length > 0 && (
          <div className="preview-list">
            {previews.map((preview) => (
              <div className="preview-card" key={preview.arquivoNome}>
                <div className="panel-header">
                  <div>
                    <h2>{preview.arquivoNome}</h2>
                    <p>{preview.totalItens} itens · {preview.clientesDetectados} clientes · {money(preview.valorTotal)}</p>
                  </div>
                  <button
                    className="button primary"
                    disabled={registeredFiles.includes(preview.arquivoNome)}
                    onClick={() => registerPreview(preview)}
                    type="button"
                  >
                    {registeredFiles.includes(preview.arquivoNome) ? 'Registrada' : 'Registrar previa'}
                  </button>
                </div>
                {preview.avisos.length > 0 && (
                  <div className="warning-list">
                    {preview.avisos.map((aviso) => <span key={aviso}>{aviso}</span>)}
                  </div>
                )}
                <div className="table compact">
                  <div className="table-head xml">
                    <span>Tipo</span>
                    <span>Cliente</span>
                    <span>Item</span>
                    <span>Qtd.</span>
                    <span>Total</span>
                  </div>
                  {preview.itens.map((item, index) => (
                    <div className="table-row xml" key={`${item.documento}-${item.itemCodigo}-${index}`}>
                      <span>{item.tipo}</span>
                      <span>{item.clienteNome || item.codigoCliente || item.cpfCnpj || 'Sem cliente'}</span>
                      <span>{item.itemNome || 'Sem descricao'}</span>
                      <span>{item.quantidade}</span>
                      <span>{money(item.valorTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel wide import-timeline-panel">
        <div className="panel-header">
          <div>
            <h2>Historico recente</h2>
            <p>Ultimas importacoes em formato operacional. Detalhes tecnicos ficam recolhidos por evento.</p>
          </div>
          <span className="status-pill">{importacoes.length} registros</span>
        </div>
        <div className="import-timeline">
          {importacoesRecentes.map((importacao) => (
            <article className={`import-timeline-item ${importacao.status}`} key={importacao.id}>
              <div>
                <strong>{importacao.tipo}</strong>
                <small>{importacao.arquivoNome}</small>
              </div>
              <div className="import-timeline-kpis">
                <span>{importacao.totalItens} itens</span>
                <span>{importacao.clientesEncontrados} clientes</span>
                <span>{importacao.clientesCriados} novos</span>
                <span>{importacao.conflitos} conflitos</span>
              </div>
              <span className="status-pill">{importacao.status}</span>
              {arquivosPorImportacao[importacao.id]?.length > 0 && (
                <details className="import-details">
                  <summary>Arquivos processados</summary>
                  <div className="import-file-list">
                    {arquivosPorImportacao[importacao.id].map((arquivo) => (
                      <span key={arquivo.id}>
                        <strong>{arquivo.tipo}</strong>
                        {arquivo.arquivoNome} - {arquivo.totalLinhas} linhas
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </article>
          ))}
          {importacoesRecentes.length === 0 && <div className="empty-state">Nenhuma importacao registrada ainda.</div>}
        </div>
      </section>
    </section>
  )
}

function workbookStats(preview: WorkbookImportPreview) {
  return {
    clientesSheets: preview.sheets.filter((sheet) => sheet.role === 'clientes').length,
    vendasSheets: preview.sheets.filter((sheet) => sheet.role === 'vendas').length,
    servicosSheets: preview.sheets.filter((sheet) => sheet.role === 'servicos').length,
  }
}

function workbookReadiness(preview: WorkbookImportPreview) {
  const stats = workbookStats(preview)
  const issues = workbookIssueCount(preview)
  const hasCoreSheets = stats.clientesSheets > 0 && (stats.vendasSheets > 0 || stats.servicosSheets > 0)

  if (!hasCoreSheets || preview.clientesDetectados === 0) {
    return {
      tone: 'danger',
      label: 'Bloquear importacao',
      detail: 'A planilha ainda nao tem clientes e movimento suficientes para alimentar o CRM.',
    }
  }

  if (issues > 0 || preview.clientesDuplicados > 0) {
    return {
      tone: 'warning',
      label: 'Revisar antes de confirmar',
      detail: `${issues} pontos de atencao e ${preview.clientesDuplicados} clientes repetidos detectados.`,
    }
  }

  return {
    tone: 'ok',
    label: 'Pronta para confirmar',
    detail: 'Estrutura essencial reconhecida sem conflitos automaticos.',
  }
}

function workbookIssueCount(preview: WorkbookImportPreview) {
  return preview.sheets.reduce(
    (total, sheet) => total + sheet.missingClientName + (sheet.role === 'resumo' ? 0 : sheet.missingDocument) + sheet.duplicateClientKeys,
    preview.avisos.length,
  )
}

function workbookRecommendations(preview: WorkbookImportPreview) {
  const recommendations = []
  const stats = workbookStats(preview)

  if (stats.clientesSheets === 0) recommendations.push('Conferir se a aba de clientes consolidada esta presente no arquivo.')
  if (stats.vendasSheets === 0) recommendations.push('Anexar ou revisar a aba de vendas para alimentar historico de pneus.')
  if (stats.servicosSheets === 0) recommendations.push('Anexar ou revisar a aba de servicos para gerar oportunidades de oficina.')
  if (preview.clientesDuplicados > 0) recommendations.push('Resolver duplicidades por CPF/CNPJ ou codigo ERP antes da confirmacao final.')
  if (preview.sheets.some((sheet) => sheet.missingDocument > 0 && sheet.role !== 'resumo')) {
    recommendations.push('Completar CPF/CNPJ ou codigo ERP das linhas sinalizadas para reduzir conflitos.')
  }
  if (recommendations.length === 0) recommendations.push('Registrar a previa e seguir para confirmacao da importacao.')

  return recommendations
}

function Conflitos({
  conflitos,
  onResolve,
}: {
  conflitos: ImportacaoConflito[]
  onResolve: (id: string, decisao: NonNullable<ImportacaoConflito['decisao']>) => void
}) {
  const [statusFilter, setStatusFilter] = useState<'pendentes' | 'resolvidos' | 'todos'>('pendentes')
  const [typeFilter, setTypeFilter] = useState('todos')
  const pendentes = conflitos.filter((conflito) => !conflito.resolvido)
  const resolvidos = conflitos.filter((conflito) => conflito.resolvido)
  const tipos = Array.from(new Set(conflitos.map((conflito) => conflito.tipo))).sort()
  const filtered = conflitos.filter((conflito) => {
    const statusMatches =
      statusFilter === 'todos' ||
      (statusFilter === 'pendentes' && !conflito.resolvido) ||
      (statusFilter === 'resolvidos' && conflito.resolvido)
    const typeMatches = typeFilter === 'todos' || conflito.tipo === typeFilter
    return statusMatches && typeMatches
  })
  const decisoes = resolvidos.reduce<Record<string, number>>((acc, conflito) => {
    if (conflito.decisao) acc[conflito.decisao] = (acc[conflito.decisao] ?? 0) + 1
    return acc
  }, {})

  return (
    <section className="grid-layout">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Fila de conflitos</h2>
            <p>{pendentes.length} pendentes · {resolvidos.length} resolvidos</p>
          </div>
          <div className="toolbar-actions">
            <label className="mini-select">
              <Filter size={15} />
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="todos">Todos os tipos</option>
                {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </label>
            <div className="segmented">
              <button className={statusFilter === 'pendentes' ? 'active' : ''} onClick={() => setStatusFilter('pendentes')} type="button">
                Pendentes
              </button>
              <button className={statusFilter === 'resolvidos' ? 'active' : ''} onClick={() => setStatusFilter('resolvidos')} type="button">
                Resolvidos
              </button>
              <button className={statusFilter === 'todos' ? 'active' : ''} onClick={() => setStatusFilter('todos')} type="button">
                Todos
              </button>
            </div>
          </div>
        </div>
        <div className="info-grid conflict-summary">
          <Info label="Pendentes" value={pendentes.length.toString()} />
          <Info label="Resolvidos" value={resolvidos.length.toString()} />
          <Info label="Unidos" value={(decisoes.unir ?? 0).toString()} />
          <Info label="Novos" value={(decisoes['criar-novo'] ?? 0).toString()} />
        </div>
        <div className="conflict-list">
          {filtered.map((conflito) => (
            <article className={conflito.resolvido ? 'conflict-card resolved' : 'conflict-card'} key={conflito.id}>
              <div>
                <span className="status-pill">{conflito.tipo}</span>
                <h2>{conflito.resumo}</h2>
                <p>{conflito.dadosRecebidos}</p>
                <div className="tags">
                  {conflito.possiveisClientes.map((cliente) => <span key={cliente}>{cliente}</span>)}
                </div>
              </div>
              {conflito.resolvido ? (
                <strong className="resolved-label">Resolvido: {conflito.decisao}</strong>
              ) : (
                <div className="conflict-actions">
                  <button className="button" type="button" onClick={() => onResolve(conflito.id, 'unir')}>Unir</button>
                  <button className="button" type="button" onClick={() => onResolve(conflito.id, 'manter-separado')}>
                    Separar
                  </button>
                  <button className="button" type="button" onClick={() => onResolve(conflito.id, 'criar-novo')}>
                    Novo
                  </button>
                  <button className="button" type="button" onClick={() => onResolve(conflito.id, 'ignorar')}>
                    Ignorar
                  </button>
                </div>
              )}
            </article>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhum conflito nesta visao.</div>}
        </div>
      </section>
    </section>
  )
}

function Mesclagem({
  duplicados,
  mesclagens,
  onMerge,
}: {
  duplicados: PossivelDuplicado[]
  mesclagens: ClienteMesclagem[]
  onMerge: (duplicado: PossivelDuplicado, principal: 'a' | 'b') => Promise<ClienteMesclagem>
}) {
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState('')
  const [minConfidence, setMinConfidence] = useState(70)
  const filteredDuplicados = duplicados
    .filter((duplicado) => duplicado.confianca >= minConfidence)
    .sort((a, b) => b.confianca - a.confianca)
  const highConfidence = duplicados.filter((duplicado) => duplicado.confianca >= 90).length
  const needsReview = duplicados.filter((duplicado) => duplicado.confianca < 90).length

  async function merge(duplicado: PossivelDuplicado, principal: 'a' | 'b') {
    setError('')
    setProcessingId(duplicado.id)
    try {
      await onMerge(duplicado, principal)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar a mesclagem.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <section className="grid-layout">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Possiveis duplicados</h2>
            <p>Escolha o cliente principal antes de mover historico comercial.</p>
          </div>
          <label className="confidence-control">
            <span>Min. confianca {minConfidence}%</span>
            <input
              min="0"
              max="100"
              step="5"
              type="range"
              value={minConfidence}
              onChange={(event) => setMinConfidence(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="info-grid merge-summary">
          <Info label="Pendentes" value={duplicados.length.toString()} />
          <Info label="Alta confianca" value={highConfidence.toString()} />
          <Info label="Revisao manual" value={needsReview.toString()} />
          <Info label="Exibidos" value={filteredDuplicados.length.toString()} />
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="merge-list">
          {filteredDuplicados.map((duplicado) => (
            <article className="merge-card" key={duplicado.id}>
              <div>
                <span className="status-pill">{duplicado.confianca}% confianca</span>
                <h2>{duplicado.clienteANome}</h2>
                <p>{duplicado.clienteBNome}</p>
                <small>{duplicado.motivo}</small>
              </div>
              <div className="merge-actions">
                <button className="button primary" disabled={processingId === duplicado.id} onClick={() => merge(duplicado, 'a')} type="button">
                  Manter primeiro
                </button>
                <button className="button" disabled={processingId === duplicado.id} onClick={() => merge(duplicado, 'b')} type="button">
                  Manter segundo
                </button>
              </div>
            </article>
          ))}
          {filteredDuplicados.length === 0 && <div className="empty-state">Nenhum duplicado pendente nesta visao.</div>}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Historico de mesclagens</h2>
            <p>Nada e apagado: vendas, servicos, interacoes, orcamentos e campanhas devem ser movidos.</p>
          </div>
          <CheckCircle2 size={18} />
        </div>
        <div className="table">
          <div className="table-head merge">
            <span>Data</span>
            <span>Principal</span>
            <span>Mesclado</span>
            <span>Dados movidos</span>
            <span>Usuario</span>
          </div>
          {mesclagens.map((mesclagem) => (
            <div className="table-row merge" key={mesclagem.id}>
              <span>{dateLabel(mesclagem.criadoEm)}</span>
              <span><strong>{mesclagem.clientePrincipalNome}</strong><small>{mesclagem.motivo}</small></span>
              <span>{mesclagem.clienteMescladoNome}</span>
              <span>{mesclagem.dadosMovidos.join(', ')}</span>
              <span>{mesclagem.usuarioNome}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function Campanhas({
  usuarios,
  currentUser,
  initialCampanhaId,
  inboxItems,
  inboxStatusFilter,
  inboxOwnerFilter,
  isLoadingInbox,
  onInboxStatusFilterChange,
  onInboxOwnerFilterChange,
  onOpenInboxClient,
  onOpenInboxBudget,
  onCreateInboxTask,
  onUpdateInboxStatus,
  onOpenBudgetEditor,
  onAddInteraction,
  onAddTask,
}: {
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
  initialCampanhaId?: string
  inboxItems: CampanhaInboxItem[]
  inboxStatusFilter: CampanhaEnvioStatus | 'todos'
  inboxOwnerFilter: string
  isLoadingInbox: boolean
  onInboxStatusFilterChange: (status: CampanhaEnvioStatus | 'todos') => void
  onInboxOwnerFilterChange: (ownerId: string) => void
  onOpenInboxClient: (clienteId: string) => Promise<void>
  onOpenInboxBudget: (item: CampanhaInboxItem) => Promise<void>
  onCreateInboxTask: (item: CampanhaInboxItem) => Promise<Tarefa>
  onUpdateInboxStatus: (item: CampanhaInboxItem, status: CampanhaEnvioStatus) => Promise<void>
  onOpenBudgetEditor: (cliente: Cliente, originContext: QuoteOriginContext) => void
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onAddTask: (task: TarefaInput) => Promise<Tarefa>
}) {
  const pageSize = 50
  const [segmentoId, setSegmentoId] = useState<CampanhaSegmentoId>('inativos-90')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [mensagemModelo, setMensagemModelo] = useState(campanhaSegmentos[0].template)
  const [campanhasSalvas, setCampanhasSalvas] = useState<CampanhaSalva[]>([])
  const [campanhasResumo, setCampanhasResumo] = useState<CampanhaResumo[]>([])
  const [activeCampanhaId, setActiveCampanhaId] = useState('')
  const [saveName, setSaveName] = useState('')
  const [campaignObjective, setCampaignObjective] = useState('')
  const [campaignCost, setCampaignCost] = useState('')
  const [campaignRevenueGoal, setCampaignRevenueGoal] = useState('')
  const [campaignWindowDays, setCampaignWindowDays] = useState('7')
  const [campaignImage, setCampaignImage] = useState<CampanhaImagemPadrao | undefined>()
  const [campaignClipboardMessage, setCampaignClipboardMessage] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [publicoFiltros, setPublicoFiltros] = useState<CampanhaPublicoFiltros>({})
  const [statuses, setStatuses] = useState<Record<string, CampanhaEnvioStatus>>({})
  const [elegibilidade, setElegibilidade] = useState<Record<string, CampanhaElegibilidade>>({})
  const [statusFilter, setStatusFilter] = useState<CampanhaEnvioStatus | 'todos'>('todos')
  const [campaignTab, setCampaignTab] = useState<'publico' | 'mensagem' | 'execucao' | 'resultado'>('publico')
  const [campaignError, setCampaignError] = useState('')
  const [selectedCampaignClientIds, setSelectedCampaignClientIds] = useState<string[]>([])
  const [isBulkCampaignUpdating, setIsBulkCampaignUpdating] = useState(false)
  const [isCreatingCampaignTasks, setIsCreatingCampaignTasks] = useState(false)
  const appliedInitialCampanhaIdRef = useRef('')
  const segmento = campanhaSegmentos.find((item) => item.id === segmentoId) ?? campanhaSegmentos[0]
  const activeCampaignResumo = campanhasResumo.find((resumo) => resumo.campanhaId === activeCampanhaId)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const campanhaClientes = clientes
  const campaignQuality = campanhaClientes.reduce(
    (acc, cliente) => {
      const readiness = campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7)
      if (readiness.blocked) acc.bloqueados += 1
      if (!cliente.whatsapp) acc.semWhatsapp += 1
      if (cliente.status === 'Nao contatar' || cliente.leadQualificacaoStatus === 'nao_contatar') acc.optOut += 1
      return acc
    },
    { bloqueados: 0, semWhatsapp: 0, optOut: 0 },
  )
  const nextClient = campanhaClientes
    .filter((cliente) => (statuses[cliente.id] ?? 'pendente') === 'pendente' && !campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7).blocked)
    .sort((a, b) => (b.totalComprado + b.totalServicos) - (a.totalComprado + a.totalServicos))[0]
  const campaignCounts = campanhaClientes.reduce<Record<CampanhaEnvioStatus, number>>(
    (acc, cliente) => {
      const status = statuses[cliente.id] ?? 'pendente'
      acc[status] += 1
      return acc
    },
    { pendente: 0, enviado: 0, respondeu: 0, nao_respondeu: 0, virou_orcamento: 0, ganhou: 0, perdido: 0, nao_contatar: 0 },
  )
  const filteredClientes = campanhaClientes.filter((cliente) => statusFilter === 'todos' || (statuses[cliente.id] ?? 'pendente') === statusFilter)
  const selectableCampaignIds = filteredClientes.filter((cliente) => !campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7).blocked).map((cliente) => cliente.id)
  const allCampaignRowsSelected = selectableCampaignIds.length > 0 && selectableCampaignIds.every((id) => selectedCampaignClientIds.includes(id))
  const activePublicoFilterCount = Object.entries(publicoFiltros).filter(([, value]) => {
    if (value === undefined || value === '' || value === 'todos' || value === false) return false
    return true
  }).length
  const campaignReadyCount = Math.max(0, total - campaignQuality.bloqueados - campaignQuality.semWhatsapp - campaignQuality.optOut)
  const campaignStepHelp: Record<typeof campaignTab, string> = {
    publico: 'Defina quem entra na campanha e valide se o publico faz sentido antes de escrever.',
    mensagem: 'Edite a mensagem, variaveis e imagem padrao que o vendedor vai usar no WhatsApp.',
    execucao: 'Trabalhe os primeiros 50 contatos, registre envios e crie tarefas em lote.',
    resultado: 'Acompanhe respostas, orcamentos, ganhos, perdas e ROI da campanha.',
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setCampaignError('')

    const activeSavedCampaign = campanhasSalvas.find((campanha) => campanha.id === activeCampanhaId)
    listCampanhaSegmento({
      segmentoId,
      page,
      pageSize,
      query,
      filtros: publicoFiltros,
      campanhaId: activeCampanhaId,
      clienteIds: activeSavedCampaign?.filtroUsado.clienteIds,
    })
      .then((result) => {
        if (cancelled) return
        setClientes(result.clientes)
        setTotal(result.total)
        setStatuses(result.statuses)
        setElegibilidade(result.elegibilidade)
      })
      .catch((exception) => {
        if (cancelled) return
        setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar o segmento de campanha.')
        setClientes([])
        setTotal(0)
        setStatuses({})
        setElegibilidade({})
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [segmentoId, page, query, publicoFiltros, activeCampanhaId, campanhasSalvas])

  useEffect(() => {
    setSelectedCampaignClientIds([])
  }, [activeCampanhaId, page, query, segmentoId, statusFilter, publicoFiltros])

  useEffect(() => {
    Promise.all([listCampanhasSalvas(), listCampanhasResumo()])
      .then(([salvas, resumos]) => {
        setCampanhasSalvas(salvas)
        setCampanhasResumo(resumos)
      })
      .catch((exception) => setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar campanhas salvas.'))
  }, [])

  useEffect(() => {
    if (!initialCampanhaId || appliedInitialCampanhaIdRef.current === initialCampanhaId) return
    if (!campanhasSalvas.some((campanha) => campanha.id === initialCampanhaId)) return
    appliedInitialCampanhaIdRef.current = initialCampanhaId
    applySavedCampaign(initialCampanhaId)
  }, [initialCampanhaId, campanhasSalvas])

  async function refreshCampaignResumo() {
    try {
      setCampanhasResumo(await listCampanhasResumo())
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o resumo da campanha.')
    }
  }

  function changeSegment(nextSegmentoId: CampanhaSegmentoId) {
    const nextSegmento = campanhaSegmentos.find((item) => item.id === nextSegmentoId) ?? campanhaSegmentos[0]
    setSegmentoId(nextSegmentoId)
    setMensagemModelo(nextSegmento.template)
    setActiveCampanhaId('')
    setPage(1)
    setStatusFilter('todos')
  }

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery)
    setPage(1)
  }

  function updatePublicoFiltro<K extends keyof CampanhaPublicoFiltros>(key: K, value: CampanhaPublicoFiltros[K]) {
    setPublicoFiltros((current) => ({ ...current, [key]: value || undefined }))
    setActiveCampanhaId('')
    setPage(1)
    setStatusFilter('todos')
  }

  function applyCampaignPreset(preset: 'sem-cadastro' | 'compradores-produto' | 'regiao' | 'alto-valor') {
    setActiveCampanhaId('')
    setStatusFilter('todos')
    setPage(1)
    if (preset === 'sem-cadastro') {
      setSegmentoId('rodobens-pendentes')
      setPublicoFiltros({ origemBase: 'rodobens', leadQualificacaoStatus: 'novo', somenteComWhatsapp: true })
      setMensagemModelo(campanhaSegmentos.find((item) => item.id === 'rodobens-pendentes')?.template ?? mensagemModelo)
      return
    }
    if (preset === 'compradores-produto') {
      setSegmentoId('selecionados')
      setPublicoFiltros({ somenteComWhatsapp: true })
      return
    }
    if (preset === 'regiao') {
      setPublicoFiltros((current) => ({ ...current, somenteComWhatsapp: true }))
      return
    }
    setSegmentoId('inativos-90')
    setPublicoFiltros({ valorMin: 5000, diasSemCompraMin: 90, somenteComWhatsapp: true })
  }

  function resetCampaignAudience() {
    setPublicoFiltros({})
    setQuery('')
    setActiveCampanhaId('')
    setPage(1)
    setStatusFilter('todos')
  }

  function applySavedCampaign(campanhaId: string) {
    const campanha = campanhasSalvas.find((item) => item.id === campanhaId)
    if (!campanha) {
      setActiveCampanhaId('')
      return
    }
    setActiveCampanhaId(campanha.id)
    setSegmentoId(campanha.filtroUsado.segmentoId)
    setPublicoFiltros(campanha.filtroUsado.filtros ?? {})
    setQuery(campanha.filtroUsado.query ?? '')
    setMensagemModelo(campanha.mensagemModelo)
    setSaveName(campanha.nome)
    setCampaignObjective(campanha.objetivo ?? '')
    setCampaignCost(campanha.custoEstimado ? String(campanha.custoEstimado) : '')
    setCampaignRevenueGoal(campanha.metaReceita ? String(campanha.metaReceita) : '')
    setCampaignWindowDays(String(campanha.filtroUsado.janelaMinimaDias ?? 7))
    setCampaignImage(campanha.filtroUsado.imagemPadrao)
    setCampaignClipboardMessage('')
    setPage(1)
    setStatusFilter('todos')
  }

  function messageFor(cliente: Cliente) {
    const primeiroNome = (cliente.responsavel || cliente.nome).split(' ')[0]
    return mensagemModelo
      .replace('{primeiro_nome}', primeiroNome)
      .replace('{nome_vendedor}', cliente.vendedorNome || 'Capital Truck Center')
  }

  async function saveCurrentCampaign() {
    const nome = saveName.trim()
    if (!nome) {
      setCampaignError('Informe um nome para salvar a campanha.')
      return
    }

    setIsSaving(true)
    setCampaignError('')
    try {
      const activeSavedCampaign = campanhasSalvas.find((campanha) => campanha.id === activeCampanhaId)
      const created = await createCampanhaSalva({
        nome,
        descricao: segmento.descricao,
        objetivo: campaignObjective.trim() || undefined,
        custoEstimado: numberFromInput(campaignCost),
        metaReceita: numberFromInput(campaignRevenueGoal),
        mensagemModelo,
        filtroUsado: {
          segmentoId,
          filtros: publicoFiltros,
          query,
          clienteIds: activeSavedCampaign?.filtroUsado.clienteIds,
          origemLista: activeSavedCampaign?.filtroUsado.origemLista,
          imagemPadrao: campaignImage,
          janelaMinimaDias: numberFromInput(campaignWindowDays) || 7,
        },
        criadaPor: currentUser.id,
      })
      setCampanhasSalvas((current) => [created, ...current.filter((campanha) => campanha.id !== created.id)])
      setActiveCampanhaId(created.id)
      await refreshCampaignResumo()
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar a campanha.')
    } finally {
      setIsSaving(false)
    }
  }

  async function markStatus(cliente: Cliente, status: CampanhaEnvioStatus, mensagemFinal: string, optOutMotivo?: string) {
    setCampaignError('')

    try {
      const envio = await upsertCampanhaEnvio({
        campanhaId: activeCampanhaId || segmento.campanhaId,
        campanhaNome: activeCampanhaId ? saveName || segmento.campanhaNome : segmento.campanhaNome,
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId,
        telefone: cliente.whatsapp,
        mensagemFinal,
        status,
      })
      await onAddInteraction({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        canal: 'Campanha',
        tipo: 'campanha',
        resumo: campaignSummary(status, mensagemFinal),
        resultado: status,
        campanhaId: envio.campanhaId,
      })
      if (status === 'virou_orcamento') {
        await onAddTask({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId,
          titulo: 'Criar orcamento da campanha',
          descricao: 'Cliente respondeu campanha e deve receber cotacao formal.',
          dataVencimento: new Date().toISOString().slice(0, 10),
          prioridade: 90,
          origem: `campanha:${envio.campanhaId}:orcamento`,
        })
      }
      if (status === 'nao_contatar') {
        updateClienteComercial(cliente.id, {
          status: 'Nao contatar',
          optOutMotivo: optOutMotivo || 'Bloqueado pela campanha',
          optOutPor: currentUser.id,
        }).catch((exception) => {
          setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel marcar cliente como nao contatar.')
        })
      }
      setStatuses((current) => ({ ...current, [cliente.id]: status }))
      await refreshCampaignResumo()
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o envio.')
    }
  }

  async function markCampaignOptOut(cliente: Cliente, mensagemFinal: string) {
    const motivo = window.prompt('Motivo para marcar este cliente como nao contatar:', 'Solicitou nao receber campanhas')
    if (motivo === null) return
    await markStatus(cliente, 'nao_contatar', mensagemFinal, motivo.trim() || 'Sem motivo informado')
  }

  async function markSelectedCampaignStatus(status: CampanhaEnvioStatus) {
    const selectedClientes = filteredClientes.filter((cliente) => selectedCampaignClientIds.includes(cliente.id))
    if (selectedClientes.length === 0) return

    setIsBulkCampaignUpdating(true)
    setCampaignError('')
    try {
      for (const cliente of selectedClientes) {
        await markStatus(cliente, status, messageFor(cliente))
      }
      setSelectedCampaignClientIds([])
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar a campanha em lote.')
    } finally {
      setIsBulkCampaignUpdating(false)
    }
  }

  async function createSelectedCampaignTasks() {
    const selectedClientes = filteredClientes.filter((cliente) => selectedCampaignClientIds.includes(cliente.id))
    if (selectedClientes.length === 0) return

    setIsCreatingCampaignTasks(true)
    setCampaignError('')
    try {
      const campanhaKey = activeCampanhaId || segmento.campanhaId
      const dueDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      for (const cliente of selectedClientes) {
        const status = statuses[cliente.id] ?? 'pendente'
        await onAddTask({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId,
          titulo: campaignTaskTitle(status),
          descricao: `Follow-up da campanha ${saveName || segmento.campanhaNome}. Status atual: ${campaignStatusLabel(status)}.`,
          dataVencimento: dueDate,
          prioridade: campaignTaskPriority(status),
          origem: `campanha:${campanhaKey}:followup:${status}`,
        })
      }
      setSelectedCampaignClientIds([])
      setCampaignError(`${selectedClientes.length} tarefas de follow-up criadas ou atualizadas.`)
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel criar tarefas de follow-up.')
    } finally {
      setIsCreatingCampaignTasks(false)
    }
  }

  async function handleCampaignImageChange(file?: File) {
    setCampaignClipboardMessage('')
    if (!file) return
    try {
      const image = await optimizeCampaignImage(file)
      setCampaignImage(image)
      setActiveCampanhaId('')
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel preparar a imagem da campanha.')
    }
  }

  async function openCampaignWhatsapp(cliente: Cliente, finalMessage: string, options?: { forceRegister?: boolean }) {
    const waUrl = `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(finalMessage)}`
    const whatsappWindow = window.open('about:blank', '_blank')
    if (whatsappWindow) whatsappWindow.opener = null

    let copiedImage = false
    if (campaignImage) {
      copiedImage = await copyCampaignImageToClipboard(campaignImage)
      setCampaignClipboardMessage(
        copiedImage
          ? 'Imagem copiada. No WhatsApp, use Ctrl+V e Enter para anexar.'
          : 'Nao foi possivel copiar a imagem automaticamente neste navegador. Abra o WhatsApp e copie a imagem manualmente pela previa.',
      )
    }

    const currentStatus = statuses[cliente.id] ?? 'pendente'
    if (currentStatus === 'pendente' || options?.forceRegister) {
      try {
        const envio = await upsertCampanhaEnvio({
          campanhaId: activeCampanhaId || segmento.campanhaId,
          campanhaNome: activeCampanhaId ? saveName || segmento.campanhaNome : segmento.campanhaNome,
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId,
          telefone: cliente.whatsapp,
          mensagemFinal: finalMessage,
          status: 'pendente',
        })
        await onAddInteraction({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId ?? currentUser.id,
          canal: 'Campanha',
          tipo: 'campanha',
          resumo: campaignSummary('pendente', finalMessage),
          resultado: 'pendente',
          campanhaId: envio.campanhaId,
        })
        setStatuses((current) => ({ ...current, [cliente.id]: 'pendente' }))
        refreshCampaignResumo().catch(() => undefined)
      } catch (exception) {
        setCampaignError(exception instanceof Error ? exception.message : 'WhatsApp aberto, mas nao foi possivel registrar a abertura da campanha.')
      }
    }

    if (whatsappWindow) {
      whatsappWindow.location.href = waUrl
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <section className={`panel wide campaign-workspace campaign-view-${campaignTab}`}>
      <div className="panel-header">
        <div>
          <h2>Campanhas</h2>
          <p>Construa o publico, escreva a mensagem e acompanhe respostas no mesmo lugar. {total} clientes no publico atual.</p>
        </div>
        <div className="toolbar-actions">
          <label className="mini-select">
            <ClipboardList size={15} />
            <select value={activeCampanhaId} onChange={(event) => applySavedCampaign(event.target.value)}>
              <option value="">Campanha nova</option>
              {campanhasSalvas.map((campanha) => (
                <option value={campanha.id} key={campanha.id}>{campanha.nome}</option>
              ))}
            </select>
          </label>
          <label className="mini-select">
            <Filter size={15} />
            <select value={segmentoId} onChange={(event) => changeSegment(event.target.value as CampanhaSegmentoId)}>
              {campanhaSegmentos.map((item) => (
                <option value={item.id} key={item.id}>{item.nome}</option>
              ))}
            </select>
          </label>
          <Send size={18} />
        </div>
      </div>
      <div className="campaign-workflow-tabs">
        <button className={campaignTab === 'publico' ? 'active' : ''} type="button" onClick={() => setCampaignTab('publico')}>
          1. Publico <span>{total}</span>
        </button>
        <button className={campaignTab === 'mensagem' ? 'active' : ''} type="button" onClick={() => setCampaignTab('mensagem')}>
          2. Mensagem
        </button>
        <button className={campaignTab === 'execucao' ? 'active' : ''} type="button" onClick={() => setCampaignTab('execucao')}>
          3. Execucao <span>{filteredClientes.length}</span>
        </button>
        <button className={campaignTab === 'resultado' ? 'active' : ''} type="button" onClick={() => setCampaignTab('resultado')}>
          4. Resultado
        </button>
      </div>
      <div className="campaign-guide-summary">
        <div>
          <strong>{campaignStepHelp[campaignTab]}</strong>
          <small>{activePublicoFilterCount} filtros ativos · {campaignReadyCount} prontos · {campaignQuality.bloqueados} bloqueados · {campaignQuality.semWhatsapp} sem WhatsApp</small>
        </div>
        <div className="toolbar-actions">
          {campaignTab !== 'publico' && (
            <button
              className="button"
              type="button"
              onClick={() => setCampaignTab(campaignTab === 'mensagem' ? 'publico' : campaignTab === 'execucao' ? 'mensagem' : 'execucao')}
            >
              Voltar etapa
            </button>
          )}
          {campaignTab !== 'resultado' && (
            <button
              className="button primary"
              type="button"
              onClick={() => setCampaignTab(campaignTab === 'publico' ? 'mensagem' : campaignTab === 'mensagem' ? 'execucao' : 'resultado')}
            >
              Proxima etapa
            </button>
          )}
        </div>
      </div>
      <div className="message-template">
        <strong>{segmento.nome}</strong>
        <span>{segmento.descricao}</span>
      </div>
      <section className="campaign-builder-stage">
        <div className="campaign-stage-header">
          <span>1. Mensagem</span>
          <small>Edite livremente. Variaveis disponiveis: {'{primeiro_nome}'} e {'{nome_vendedor}'}.</small>
        </div>
        <label className="campaign-message-editor">
          Texto que sera enviado no WhatsApp
          <textarea
            value={mensagemModelo}
            onChange={(event) => {
              setMensagemModelo(event.target.value)
              setActiveCampanhaId('')
            }}
            rows={4}
          />
        </label>
      </section>
      <section className="campaign-builder-stage">
        <div className="campaign-stage-header">
          <span>2. Configuracao</span>
          <small>Identifique a campanha, objetivo e metas antes de trabalhar a lista de clientes.</small>
        </div>
        <div className="campaign-audience-toolbar visually-hidden">
          <span>{total} clientes no publico · pagina {page} de {totalPages}</span>
          <button className="button" type="button" onClick={resetCampaignAudience}>Limpar publico</button>
        </div>
      <div className="campaign-filter-grid">
        <label>
          Nome da campanha
          <input
            value={saveName}
            onChange={(event) => {
              setSaveName(event.target.value)
              setActiveCampanhaId('')
            }}
            placeholder="Ex.: Michelin Curitiba - maio"
          />
        </label>
        <label>
          Objetivo
          <input
            value={campaignObjective}
            onChange={(event) => {
              setCampaignObjective(event.target.value)
              setActiveCampanhaId('')
            }}
            placeholder="Ex.: reativar compradores de pneus"
          />
        </label>
        <label>
          Custo estimado
          <input
            inputMode="decimal"
            value={campaignCost}
            onChange={(event) => {
              setCampaignCost(event.target.value)
              setActiveCampanhaId('')
            }}
            placeholder="0,00"
          />
        </label>
        <label>
          Meta de receita
          <input
            inputMode="decimal"
            value={campaignRevenueGoal}
            onChange={(event) => {
              setCampaignRevenueGoal(event.target.value)
              setActiveCampanhaId('')
            }}
            placeholder="0,00"
          />
        </label>
        <label>
          Janela entre campanhas
          <input
            inputMode="numeric"
            value={campaignWindowDays}
            onChange={(event) => {
              setCampaignWindowDays(event.target.value.replace(/\D/g, ''))
              setActiveCampanhaId('')
            }}
            placeholder="7"
          />
        </label>
        <div className="visually-hidden">
        <label>
          Cidade
          <input
            value={publicoFiltros.cidade ?? ''}
            onChange={(event) => updatePublicoFiltro('cidade', event.target.value)}
            placeholder="Ex.: Curitiba"
          />
        </label>
        <label>
          UF / regiao
          <input
            value={publicoFiltros.uf ?? ''}
            onChange={(event) => updatePublicoFiltro('uf', event.target.value.toUpperCase().slice(0, 2))}
            placeholder="PR"
          />
        </label>
        <label>
          Vendedor
          <select
            value={publicoFiltros.vendedorId ?? ''}
            onChange={(event) => updatePublicoFiltro('vendedorId', event.target.value)}
          >
            <option value="">Todos</option>
            {usuarios.map((usuario) => (
              <option value={usuario.id} key={usuario.id}>{usuario.nome}</option>
            ))}
          </select>
        </label>
        <label>
          Vendedor historico
          <input
            value={publicoFiltros.vendedorHistoricoNome ?? ''}
            onChange={(event) => updatePublicoFiltro('vendedorHistoricoNome', event.target.value)}
            placeholder="Nome no sistema"
          />
        </label>
        <label>
          Produto ou servico comprado
          <input
            value={publicoFiltros.produtoTerm ?? ''}
            onChange={(event) => updatePublicoFiltro('produtoTerm', event.target.value)}
            placeholder="Ex.: 295/80; Michelin; alinhamento"
          />
        </label>
        <label>
          Medida
          <input
            value={publicoFiltros.medidaTerm ?? ''}
            onChange={(event) => updatePublicoFiltro('medidaTerm', event.target.value)}
            placeholder="Ex.: 295/80R22.5"
          />
        </label>
        <label>
          Placa / veiculo
          <input
            value={publicoFiltros.placaTerm ?? ''}
            onChange={(event) => updatePublicoFiltro('placaTerm', event.target.value.toUpperCase())}
            placeholder="ABC1D23"
          />
        </label>
        <label>
          KM minimo
          <input
            inputMode="numeric"
            value={publicoFiltros.kmMin ?? ''}
            onChange={(event) => updatePublicoFiltro('kmMin', positiveIntegerOrUndefined(event.target.value))}
            placeholder="Ex.: 80000"
          />
        </label>
        <label>
          KM maximo
          <input
            inputMode="numeric"
            value={publicoFiltros.kmMax ?? ''}
            onChange={(event) => updatePublicoFiltro('kmMax', positiveIntegerOrUndefined(event.target.value))}
            placeholder="Ex.: 180000"
          />
        </label>
        <label>
          Origem da base
          <select
            value={publicoFiltros.origemBase ?? 'todos'}
            onChange={(event) => updatePublicoFiltro('origemBase', event.target.value as CampanhaPublicoFiltros['origemBase'])}
          >
            <option value="todos">Todas</option>
            <option value="capital_truck">Capital Truck</option>
            <option value="rodobens">Clientes sem cadastro</option>
            <option value="desconhecida">Origem pendente</option>
          </select>
        </label>
        <label>
          Status lead
          <select
            value={publicoFiltros.leadQualificacaoStatus ?? 'todos'}
            onChange={(event) => updatePublicoFiltro('leadQualificacaoStatus', event.target.value as CampanhaPublicoFiltros['leadQualificacaoStatus'])}
          >
            <option value="todos">Todos</option>
            <option value="novo">Novo</option>
            <option value="contatado">Contatado</option>
            <option value="qualificado">Qualificado</option>
            <option value="virou_cliente">Virou cliente</option>
            <option value="descartado">Descartado</option>
            <option value="nao_contatar">Nao contatar</option>
          </select>
        </label>
        <label>
          Dias sem compra
          <input
            inputMode="numeric"
            value={publicoFiltros.diasSemCompraMin ?? ''}
            onChange={(event) => updatePublicoFiltro('diasSemCompraMin', positiveIntegerOrUndefined(event.target.value))}
            placeholder="Ex.: 90"
          />
        </label>
        <label>
          Dias sem contato
          <input
            inputMode="numeric"
            value={publicoFiltros.diasSemContatoMin ?? ''}
            onChange={(event) => updatePublicoFiltro('diasSemContatoMin', positiveIntegerOrUndefined(event.target.value))}
            placeholder="Ex.: 60"
          />
        </label>
        <label>
          Valor minimo historico
          <input
            inputMode="decimal"
            value={publicoFiltros.valorMin ?? ''}
            onChange={(event) => updatePublicoFiltro('valorMin', numberFromInput(event.target.value) || undefined)}
            placeholder="Ex.: 5000,00"
          />
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={Boolean(publicoFiltros.somenteComWhatsapp)}
            onChange={(event) => updatePublicoFiltro('somenteComWhatsapp', event.target.checked)}
          />
          Somente com WhatsApp
        </label>
        </div>
      </div>
      </section>
      <div className="campaign-image-panel">
        <label className="button">
          <FileUp size={16} /> Imagem padrao
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => handleCampaignImageChange(event.target.files?.[0])}
          />
        </label>
        {campaignImage ? (
          <div className="campaign-image-preview">
            <img src={campaignImage.dataUrl} alt={campaignImage.nome} />
            <span>
              <strong>{campaignImage.nome}</strong>
              <small>Ao abrir WhatsApp, o sistema tenta copiar esta imagem para colar na conversa.</small>
            </span>
            <button className="button" type="button" onClick={() => setCampaignImage(undefined)}>
              Remover
            </button>
          </div>
        ) : (
          <span className="muted">Sem imagem padrao nesta campanha.</span>
        )}
        {campaignClipboardMessage && <small className="score">{campaignClipboardMessage}</small>}
      </div>
      <div className="campaign-save-bar">
        <span>{activeCampanhaId ? 'Campanha salva selecionada.' : 'Ajuste filtros e mensagem antes de salvar para reutilizar.'}</span>
        <button className="button primary" disabled={isSaving} onClick={saveCurrentCampaign} type="button">
          {isSaving ? 'Salvando...' : 'Salvar campanha'}
        </button>
      </div>
      <div className="campaign-report">
        <div className="campaign-report-header">
          <div>
            <strong>{activeCampaignResumo ? activeCampaignResumo.nome : 'Resumo da pagina atual'}</strong>
            <small>{activeCampaignResumo ? `${activeCampaignResumo.objetivo || 'Sem objetivo'} - criada em ${dateLabel(activeCampaignResumo.criadaEm)}` : 'Salve ou selecione uma campanha para ver o resultado global.'}</small>
          </div>
          {activeCampaignResumo && <span>{conversionRate(activeCampaignResumo.viraramVenda || activeCampaignResumo.viraramOrcamento, activeCampaignResumo.total)}% conversao</span>}
        </div>
        <div className="info-grid campaign-summary">
          <Info label="Alcance" value={(activeCampaignResumo?.total ?? campanhaClientes.length).toString()} />
          <Info label="Enviados" value={(activeCampaignResumo?.enviados ?? campaignCounts.enviado).toString()} />
          <Info label="Responderam" value={(activeCampaignResumo?.responderam ?? campaignCounts.respondeu).toString()} />
          <Info label="Orcamentos" value={(activeCampaignResumo?.viraramOrcamento ?? campaignCounts.virou_orcamento).toString()} />
          <Info label="Ganhos" value={(activeCampaignResumo?.viraramVenda ?? campaignCounts.ganhou).toString()} />
          <Info label="Receita atribuida" value={money(activeCampaignResumo?.receitaAtribuida ?? 0)} />
          <Info label="Custo" value={money(activeCampaignResumo?.custoEstimado ?? numberFromInput(campaignCost))} />
          <Info label="ROI" value={`${activeCampaignResumo?.roiPercent ?? 0}%`} />
          <Info label="Meta" value={money(activeCampaignResumo?.metaReceita ?? numberFromInput(campaignRevenueGoal))} />
          <Info label="Perdidos" value={(activeCampaignResumo?.perdidos ?? campaignCounts.perdido).toString()} />
          <Info label="Bloqueados" value={campaignQuality.bloqueados.toString()} />
          <Info label="Sem WhatsApp" value={campaignQuality.semWhatsapp.toString()} />
          <Info label="Opt-out" value={campaignQuality.optOut.toString()} />
        </div>
      </div>
      <CampanhasInbox
        embedded
        items={inboxItems}
        usuarios={usuarios}
        currentUser={currentUser}
        statusFilter={inboxStatusFilter}
        ownerFilter={inboxOwnerFilter}
        isLoading={isLoadingInbox}
        onStatusFilterChange={onInboxStatusFilterChange}
        onOwnerFilterChange={onInboxOwnerFilterChange}
        onOpenClient={onOpenInboxClient}
        onOpenBudget={onOpenInboxBudget}
        onCreateTask={onCreateInboxTask}
        onUpdateStatus={onUpdateInboxStatus}
      />
      {nextClient && (
        <div className="next-campaign-target">
          <span>
            <strong>Proximo contato sugerido: {nextClient.nome}</strong>
            <small>{nextClient.cidade || 'Cidade nao informada'} · ultima compra {dateLabel(nextClient.ultimaCompraEm)}</small>
          </span>
          <button
            className="button primary"
            type="button"
            disabled={!nextClient.whatsapp}
            onClick={() => openCampaignWhatsapp(nextClient, messageFor(nextClient))}
          >
            <MessageCircle size={16} /> Abrir WhatsApp
          </button>
        </div>
      )}
      <div className="campaign-history">
        {campanhasResumo.slice(0, 5).map((resumo) => (
          <button
            className={resumo.campanhaId === activeCampanhaId ? 'campaign-history-item active' : 'campaign-history-item'}
            key={resumo.campanhaId}
            onClick={() => applySavedCampaign(resumo.campanhaId)}
            type="button"
          >
            <span>
              <strong>{resumo.nome}</strong>
              <small>{resumo.total} envios · {resumo.responderam} respostas · {resumo.viraramOrcamento} orcamentos · {money(resumo.receitaAtribuida)}</small>
            </span>
            <b>{conversionRate(resumo.viraramVenda || resumo.viraramOrcamento, resumo.total)}%</b>
          </button>
        ))}
      </div>
      <section className="campaign-builder-stage campaign-audience-stage">
        <div className="campaign-stage-header">
          <span>Publico e filtros da lista</span>
          <small>{activePublicoFilterCount} filtros ativos. Os filtros abaixo controlam apenas a lista de clientes desta campanha.</small>
        </div>
        <div className="campaign-preset-grid">
          <button className="campaign-preset" type="button" onClick={() => applyCampaignPreset('sem-cadastro')}>
            <strong>Clientes sem cadastro</strong>
            <small>Listas externas novas, com WhatsApp e ainda nao qualificadas.</small>
          </button>
          <button className="campaign-preset" type="button" onClick={() => applyCampaignPreset('compradores-produto')}>
            <strong>Comprou produto/servico</strong>
            <small>Use produto, medida, marca ou servico para montar a audiencia.</small>
          </button>
          <button className="campaign-preset" type="button" onClick={() => applyCampaignPreset('regiao')}>
            <strong>Cidade ou regiao</strong>
            <small>Comece por localidade e refine por vendedor ou historico.</small>
          </button>
          <button className="campaign-preset" type="button" onClick={() => applyCampaignPreset('alto-valor')}>
            <strong>Reativar alto valor</strong>
            <small>Clientes com historico relevante e mais de 90 dias sem compra.</small>
          </button>
        </div>
        <div className="campaign-audience-toolbar">
          <label className="mini-select">
            <Search size={15} />
            <input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Buscar cliente" />
          </label>
          <label className="mini-select">
            <Filter size={15} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CampanhaEnvioStatus | 'todos')}>
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="enviado">Enviados</option>
              <option value="respondeu">Responderam</option>
              <option value="virou_orcamento">Virou orcamento</option>
              <option value="ganhou">Ganhos</option>
              <option value="perdido">Perdidos</option>
              <option value="nao_respondeu">Nao respondeu</option>
              <option value="nao_contatar">Nao contatar</option>
            </select>
          </label>
          <span>{total} clientes no publico · pagina {page} de {totalPages}</span>
          <button className="button" type="button" onClick={resetCampaignAudience}>Limpar publico</button>
        </div>
        <div className="campaign-filter-grid">
          <label>
            Cidade
            <input value={publicoFiltros.cidade ?? ''} onChange={(event) => updatePublicoFiltro('cidade', event.target.value)} placeholder="Ex.: Curitiba" />
          </label>
          <label>
            UF / regiao
            <input value={publicoFiltros.uf ?? ''} onChange={(event) => updatePublicoFiltro('uf', event.target.value.toUpperCase().slice(0, 2))} placeholder="PR" />
          </label>
          <label>
            Vendedor
            <select value={publicoFiltros.vendedorId ?? ''} onChange={(event) => updatePublicoFiltro('vendedorId', event.target.value)}>
              <option value="">Todos</option>
              {usuarios.map((usuario) => (
                <option value={usuario.id} key={usuario.id}>{usuario.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Vendedor historico
            <input value={publicoFiltros.vendedorHistoricoNome ?? ''} onChange={(event) => updatePublicoFiltro('vendedorHistoricoNome', event.target.value)} placeholder="Nome no sistema" />
          </label>
          <label>
            Produto ou servico comprado
            <input value={publicoFiltros.produtoTerm ?? ''} onChange={(event) => updatePublicoFiltro('produtoTerm', event.target.value)} placeholder="Ex.: 295/80; Michelin; alinhamento" />
          </label>
          <label>
            Medida
            <input value={publicoFiltros.medidaTerm ?? ''} onChange={(event) => updatePublicoFiltro('medidaTerm', event.target.value)} placeholder="Ex.: 295/80R22.5" />
          </label>
          <label>
            Placa / veiculo
            <input value={publicoFiltros.placaTerm ?? ''} onChange={(event) => updatePublicoFiltro('placaTerm', event.target.value.toUpperCase())} placeholder="ABC1D23" />
          </label>
          <label>
            KM minimo
            <input inputMode="numeric" value={publicoFiltros.kmMin ?? ''} onChange={(event) => updatePublicoFiltro('kmMin', positiveIntegerOrUndefined(event.target.value))} placeholder="Ex.: 80000" />
          </label>
          <label>
            KM maximo
            <input inputMode="numeric" value={publicoFiltros.kmMax ?? ''} onChange={(event) => updatePublicoFiltro('kmMax', positiveIntegerOrUndefined(event.target.value))} placeholder="Ex.: 180000" />
          </label>
          <label>
            Origem da base
            <select value={publicoFiltros.origemBase ?? 'todos'} onChange={(event) => updatePublicoFiltro('origemBase', event.target.value as CampanhaPublicoFiltros['origemBase'])}>
              <option value="todos">Todas</option>
              <option value="capital_truck">Capital Truck</option>
              <option value="rodobens">Clientes sem cadastro</option>
              <option value="desconhecida">Origem pendente</option>
            </select>
          </label>
          <label>
            Status lead
            <select value={publicoFiltros.leadQualificacaoStatus ?? 'todos'} onChange={(event) => updatePublicoFiltro('leadQualificacaoStatus', event.target.value as CampanhaPublicoFiltros['leadQualificacaoStatus'])}>
              <option value="todos">Todos</option>
              <option value="novo">Novo</option>
              <option value="contatado">Contatado</option>
              <option value="qualificado">Qualificado</option>
              <option value="virou_cliente">Virou cliente</option>
              <option value="descartado">Descartado</option>
              <option value="nao_contatar">Nao contatar</option>
            </select>
          </label>
          <label>
            Dias sem compra
            <input inputMode="numeric" value={publicoFiltros.diasSemCompraMin ?? ''} onChange={(event) => updatePublicoFiltro('diasSemCompraMin', positiveIntegerOrUndefined(event.target.value))} placeholder="Ex.: 90" />
          </label>
          <label>
            Dias sem contato
            <input inputMode="numeric" value={publicoFiltros.diasSemContatoMin ?? ''} onChange={(event) => updatePublicoFiltro('diasSemContatoMin', positiveIntegerOrUndefined(event.target.value))} placeholder="Ex.: 60" />
          </label>
          <label>
            Valor minimo historico
            <input inputMode="decimal" value={publicoFiltros.valorMin ?? ''} onChange={(event) => updatePublicoFiltro('valorMin', numberFromInput(event.target.value) || undefined)} placeholder="Ex.: 5000,00" />
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={Boolean(publicoFiltros.somenteComWhatsapp)} onChange={(event) => updatePublicoFiltro('somenteComWhatsapp', event.target.checked)} />
            Somente com WhatsApp
          </label>
        </div>
      </section>
      {campaignError && <div className="alert">{campaignError}</div>}
      {isLoading && <div className="empty-state">Carregando segmento de campanha...</div>}
      {!isLoading && filteredClientes.length > 0 && (
        <div className="bulk-action-bar">
          <button
            className="button"
            type="button"
            onClick={() => setSelectedCampaignClientIds(allCampaignRowsSelected ? [] : selectableCampaignIds)}
          >
            {allCampaignRowsSelected ? 'Limpar selecao' : 'Selecionar pagina'}
          </button>
          <button
            className="button primary"
            type="button"
            disabled={selectedCampaignClientIds.length === 0 || isBulkCampaignUpdating}
            onClick={() => markSelectedCampaignStatus('enviado')}
          >
            {isBulkCampaignUpdating ? 'Atualizando...' : `Marcar ${selectedCampaignClientIds.length || ''} enviados`}
          </button>
          <button
            className="button"
            type="button"
            disabled={selectedCampaignClientIds.length === 0 || isBulkCampaignUpdating}
            onClick={() => markSelectedCampaignStatus('nao_respondeu')}
          >
            Sem resposta
          </button>
          <button
            className="button"
            type="button"
            disabled={selectedCampaignClientIds.length === 0 || isCreatingCampaignTasks}
            onClick={createSelectedCampaignTasks}
          >
            {isCreatingCampaignTasks ? 'Criando...' : 'Criar tarefas'}
          </button>
          <span className="status-pill">{selectedCampaignClientIds.length} selecionados</span>
        </div>
      )}
      {!isLoading && (
      <div className="table">
        <div className="table-head campaign campaign-bulk-row">
          <span>Sel.</span>
          <span>Cliente</span>
          <span>Mensagem</span>
          <span>Status</span>
          <span>Acoes</span>
        </div>
        {filteredClientes.map((cliente) => {
          const finalMessage = messageFor(cliente)
          const readiness = campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7)
          const canResend = Boolean(cliente.whatsapp && cliente.status !== 'Nao contatar' && cliente.leadQualificacaoStatus !== 'nao_contatar')
          const canOpenNormally = !readiness.blocked && canResend

          return (
            <div className="table-row campaign campaign-bulk-row" key={cliente.id}>
              <span>
                <input
                  type="checkbox"
                  checked={selectedCampaignClientIds.includes(cliente.id)}
                  disabled={readiness.blocked}
                  onChange={(event) => {
                    setSelectedCampaignClientIds((current) =>
                      event.target.checked
                        ? [...new Set([...current, cliente.id])]
                        : current.filter((id) => id !== cliente.id),
                    )
                  }}
                  aria-label={`Selecionar ${cliente.nome}`}
                />
              </span>
              <span>
                <strong>{cliente.nome}</strong>
                <small>{cliente.whatsapp}</small>
                {readiness.blocked && <small className="score danger">{readiness.reason}</small>}
              </span>
              <span>{finalMessage}</span>
              <span className="status-pill">{statuses[cliente.id] ?? 'pendente'}</span>
              <span className="campaign-actions">
                <button
                  className={canOpenNormally ? 'button' : 'button disabled'}
                  type="button"
                  disabled={!canOpenNormally}
                  onClick={() => openCampaignWhatsapp(cliente, finalMessage)}
                >
                  <MessageCircle size={16} /> Abrir
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={!canResend}
                  onClick={() => openCampaignWhatsapp(cliente, finalMessage, { forceRegister: true })}
                  title="Reabre o WhatsApp e volta o envio para pendente, mesmo quando ha contato recente."
                >
                  Reenviar
                </button>
                <button className="button" type="button" disabled={!canOpenNormally} onClick={() => markStatus(cliente, 'enviado', finalMessage)}>
                  Enviado
                </button>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'pendente', finalMessage)}>
                  Voltar p/ pendente
                </button>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'respondeu', finalMessage)}>
                  Respondeu
                </button>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'nao_respondeu', finalMessage)}>
                  Sem resposta
                </button>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'virou_orcamento', finalMessage)}>
                  Virou orc.
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => onOpenBudgetEditor(cliente, {
                    kind: 'campanha',
                    sourceId: activeCampanhaId || undefined,
                    label: activeCampanhaId ? saveName || segmento.campanhaNome : segmento.campanhaNome,
                  })}
                >
                  Orcamento
                </button>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'ganhou', finalMessage)}>
                  Ganhou
                </button>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'perdido', finalMessage)}>
                  Perdido
                </button>
                <button className="button" type="button" onClick={() => markCampaignOptOut(cliente, finalMessage)}>
                  Nao contatar
                </button>
              </span>
            </div>
          )
        })}
        {filteredClientes.length === 0 && <div className="empty-state">Nenhum cliente neste status de campanha.</div>}
      </div>
      )}
      <div className="pagination-bar">
        <button className="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
          Anterior
        </button>
        <span>Pagina {page} de {totalPages}</span>
        <button className="button" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)} type="button">
          Proxima
        </button>
      </div>
    </section>
  )
}

function campaignSummary(status: CampanhaEnvioStatus, mensagem: string) {
  const labels: Record<CampanhaEnvioStatus, string> = {
    pendente: 'WhatsApp aberto com mensagem de campanha.',
    enviado: 'Mensagem de campanha marcada como enviada.',
    respondeu: 'Cliente respondeu a campanha.',
    nao_respondeu: 'Cliente nao respondeu a campanha.',
    virou_orcamento: 'Campanha virou oportunidade de orcamento.',
    ganhou: 'Campanha marcada como venda ganha.',
    perdido: 'Campanha marcada como oportunidade perdida.',
    nao_contatar: 'Cliente marcado como nao contatar pela campanha.',
  }
  return `${labels[status]} Mensagem: ${mensagem}`
}

function campaignTaskTitle(status: CampanhaEnvioStatus) {
  const titles: Record<CampanhaEnvioStatus, string> = {
    pendente: 'Enviar campanha WhatsApp',
    enviado: 'Follow-up de campanha enviada',
    respondeu: 'Responder cliente da campanha',
    nao_respondeu: 'Retentar contato da campanha',
    virou_orcamento: 'Formalizar orcamento da campanha',
    ganhou: 'Confirmar pos-venda da campanha',
    perdido: 'Registrar motivo de perda da campanha',
    nao_contatar: 'Revisar bloqueio de contato',
  }
  return titles[status]
}

function campaignTaskPriority(status: CampanhaEnvioStatus) {
  if (status === 'respondeu' || status === 'virou_orcamento') return 95
  if (status === 'pendente' || status === 'enviado') return 80
  if (status === 'nao_respondeu') return 70
  return 50
}

function campaignContactReadiness(cliente: Cliente, elegibilidade?: CampanhaElegibilidade, windowDays = 7) {
  if (elegibilidade) {
    if (elegibilidade.motivoBloqueio === 'Nao contatar' || elegibilidade.motivoBloqueio.startsWith('Nao contatar')) {
      return {
        blocked: true,
        reason: elegibilidade.optOutMotivo ? `Nao contatar: ${elegibilidade.optOutMotivo}` : elegibilidade.motivoBloqueio,
      }
    }
    if (elegibilidade.motivoBloqueio === 'Sem WhatsApp') {
      return { blocked: true, reason: elegibilidade.motivoBloqueio }
    }
    if (daysSince(elegibilidade.ultimoAcionamento) <= windowDays) {
      return { blocked: true, reason: `Contato recente: aguardar ${windowDays}d` }
    }
    return {
      blocked: !elegibilidade.elegivel,
      reason: elegibilidade.motivoBloqueio,
    }
  }
  if (cliente.status === 'Nao contatar' || cliente.leadQualificacaoStatus === 'nao_contatar') {
    return { blocked: true, reason: 'Nao contatar' }
  }
  if (!cliente.whatsapp) return { blocked: true, reason: 'Sem WhatsApp' }
  if (daysSince(cliente.ultimoContatoEm) <= windowDays) return { blocked: true, reason: `Contato recente: aguardar ${windowDays}d` }
  return { blocked: false, reason: 'Apto' }
}

function tomorrowDate() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10)
}

function taskSla(tarefa: Tarefa): { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' } {
  if (tarefa.status !== 'aberta') return { label: 'concluida', tone: 'neutral' }

  const days = daysSince(tarefa.dataVencimento)
  const origin = tarefa.origem.toLowerCase()
  const expected = taskSlaExpected(origin)
  const originLabel = taskOriginSlaLabel(origin)

  if (days > 0) {
    return { label: `${originLabel}: ${days}d atrasada`, tone: 'danger' }
  }
  if (days === 0) {
    return { label: `${originLabel}: vence hoje`, tone: 'warn' }
  }

  const daysUntilDue = Math.abs(days)
  if (daysUntilDue <= 1) {
    return { label: `${originLabel}: no limite`, tone: 'warn' }
  }
  return { label: `${originLabel}: ${daysUntilDue}d restantes / SLA ${expected}d`, tone: 'ok' }
}

function taskSlaExpected(origin: string) {
  if (origin.startsWith('campanha')) return 1
  if (origin.startsWith('orcamento')) return 2
  if (origin.startsWith('rodobens')) return 1
  if (origin.startsWith('oportunidade')) return 3
  return 3
}

function taskOriginSlaLabel(origin: string) {
  if (origin.startsWith('campanha')) return 'Campanha'
  if (origin.startsWith('orcamento')) return 'Orcamento'
  if (origin.startsWith('rodobens')) return 'Clientes sem cadastro'
  if (origin.startsWith('oportunidade')) return 'Oportunidade'
  if (origin.startsWith('interacao')) return 'Interacao'
  return 'SLA'
}

function sellerCriticalOrigin(row?: TarefaSlaVendedorResumo) {
  if (!row) return 'Sem dados globais'
  const origins = [
    { label: 'Campanhas', value: row.campanhasAtrasadas },
    { label: 'Orcamentos', value: row.orcamentosAtrasados },
    { label: 'Sem cadastro', value: row.rodobensAtrasados },
    { label: 'Oportunidades', value: row.oportunidadesAtrasadas },
  ].sort((a, b) => b.value - a.value)
  return origins[0]?.value > 0 ? `${origins[0].label}: ${origins[0].value}` : 'Sem origem critica'
}

function conversionRate(conversions: number, total: number) {
  if (!total) return 0
  return Math.round((conversions / total) * 100)
}

function numberFromInput(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function positiveIntegerOrUndefined(value: string) {
  const parsed = Number(value.replace(/\D/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

async function optimizeCampaignImage(file: File): Promise<CampanhaImagemPadrao> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem valido.')
  const source = await fileToDataUrl(file)
  const image = await loadBrowserImage(source)
  const maxSize = 1200
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Nao foi possivel otimizar a imagem.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return {
    nome: file.name,
    dataUrl: canvas.toDataURL('image/png'),
    mimeType: 'image/png',
  }
}

async function copyCampaignImageToClipboard(image: CampanhaImagemPadrao) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') return false
  try {
    const blob = await (await fetch(image.dataUrl)).blob()
    await navigator.clipboard.write([new ClipboardItem({ [image.mimeType]: blob })])
    return true
  } catch {
    return false
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

function loadBrowserImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem.'))
    image.src = src
  })
}

function lossReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    preco: 'Preco',
    prazo: 'Prazo',
    concorrente: 'Concorrente',
    sem_estoque: 'Sem estoque',
    nao_respondeu: 'Nao respondeu',
    aprovacao_rejeitada: 'Aprovacao rejeitada',
    desconto_excessivo: 'Aprovacao rejeitada - desconto excessivo',
    margem_insuficiente: 'Aprovacao rejeitada - margem insuficiente',
    preco_desatualizado: 'Aprovacao rejeitada - preco desatualizado',
    revisar_comercial: 'Aprovacao rejeitada - revisar condicao comercial',
  }
  if (reason.startsWith('aprovacao_rejeitada:')) {
    return labels[reason.split(':')[1]] ?? labels.aprovacao_rejeitada
  }
  return labels[reason] ?? reason
}

function Orcamentos({
  clientes,
  orcamentos,
  usuarios,
  currentUser,
  catalogo,
  preparedQuoteContext,
  page,
  pageSize,
  total,
  statusFilter,
  isLoading,
  onPageChange,
  onStatusFilterChange,
  onOpenDetail,
  onCreateLooseBudget,
  onRevise,
  onStatusChange,
}: {
  clientes: Cliente[]
  orcamentos: Orcamento[]
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
  catalogo: CatalogoItem[]
  preparedQuoteContext: QuoteOriginContext
  page: number
  pageSize: number
  total: number
  statusFilter: OrcamentoListFilter
  isLoading: boolean
  onPageChange: (page: number) => void
  onStatusFilterChange: (filter: OrcamentoListFilter) => void
  onOpenDetail: (orcamento: Orcamento) => void
  onCreateLooseBudget: (cliente: Cliente) => void
  onRevise: (id: string, orcamento: OrcamentoInput) => Promise<Orcamento>
  onStatusChange: (id: string, status: Orcamento['status'], motivoPerda?: string) => void
}) {
  const [lossReasons, setLossReasons] = useState<Record<string, string>>({})
  const [approvalRejectReasons, setApprovalRejectReasons] = useState<Record<string, string>>({})
  const [versionTarget, setVersionTarget] = useState<Orcamento | null>(null)
  const [revisionTarget, setRevisionTarget] = useState<Orcamento | null>(null)
  const [versions, setVersions] = useState<OrcamentoVersao[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsError, setVersionsError] = useState('')
  const [showLooseBudgetSearch, setShowLooseBudgetSearch] = useState(false)
  const [looseBudgetQuery, setLooseBudgetQuery] = useState('')
  const [looseBudgetResults, setLooseBudgetResults] = useState<Cliente[]>([])
  const [looseBudgetTotal, setLooseBudgetTotal] = useState(0)
  const [isSearchingLooseBudget, setIsSearchingLooseBudget] = useState(false)
  const [looseBudgetError, setLooseBudgetError] = useState('')
  const openStatuses: Orcamento['status'][] = ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando']
  const valorAberto = orcamentos
    .filter((orcamento) => openStatuses.includes(orcamento.status))
    .reduce((total, orcamento) => total + orcamento.valorTotal, 0)
  const vencidos = orcamentos.filter((orcamento) => openStatuses.includes(orcamento.status) && daysSince(orcamento.validade) > 0).length
  const aguardandoAprovacao = orcamentos.filter((orcamento) => orcamento.status === 'aguardando_aprovacao').length
  const negociando = orcamentos.filter((orcamento) => orcamento.status === 'negociando').length
  const ganhos = orcamentos.filter((orcamento) => orcamento.status === 'ganho').length
  const canApprove = currentUser.role === 'admin'
  const targetClient = versionTarget ? clientes.find((item) => item.id === versionTarget.clienteId) ?? clienteFromOrcamento(versionTarget) : undefined
  const targetVendor = versionTarget ? usuarios.find((item) => item.id === versionTarget.vendedorId) : undefined
  const revisionClient = revisionTarget ? clientes.find((item) => item.id === revisionTarget.clienteId) ?? clienteFromOrcamento(revisionTarget) : undefined
  const latestVersion = versions[0]
  const firstVersion = versions[versions.length - 1]
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    let cancelled = false
    if (!showLooseBudgetSearch) return

    async function searchClientsForLooseBudget() {
      setIsSearchingLooseBudget(true)
      setLooseBudgetError('')
      try {
        const result = await listClientesPage({
          page: 1,
          pageSize: 20,
          query: looseBudgetQuery,
          vendedorId: currentUser.role === 'vendedor' ? currentUser.id : undefined,
        })
        if (cancelled) return
        setLooseBudgetResults(result.clientes)
        setLooseBudgetTotal(result.total)
      } catch (exception) {
        if (cancelled) return
        setLooseBudgetResults([])
        setLooseBudgetTotal(0)
        setLooseBudgetError(exception instanceof Error ? exception.message : 'Nao foi possivel buscar clientes.')
      } finally {
        if (!cancelled) setIsSearchingLooseBudget(false)
      }
    }

    const handle = window.setTimeout(searchClientsForLooseBudget, looseBudgetQuery.trim() ? 250 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [currentUser.id, currentUser.role, looseBudgetQuery, showLooseBudgetSearch])

  useEffect(() => {
    if (preparedQuoteContext.initialItems?.length) {
      setShowLooseBudgetSearch(true)
    }
  }, [preparedQuoteContext])

  async function openVersionHistory(orcamento: Orcamento) {
    setVersionTarget(orcamento)
    setVersions([])
    setVersionsError('')
    setVersionsLoading(true)
    try {
      setVersions(await listOrcamentoVersoes(orcamento.id))
    } catch (exception) {
      setVersionsError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar as versoes.')
    } finally {
      setVersionsLoading(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Orcamentos abertos</h2>
          <p>Status, validade, previsao de fechamento e motivo de perda ficam centralizados.</p>
        </div>
        <div className="toolbar-actions">
          <button
            className="button primary"
            type="button"
            onClick={() => setShowLooseBudgetSearch((current) => !current)}
          >
            <WalletCards size={16} /> Novo orcamento
          </button>
          <label className="mini-select">
            <Filter size={15} />
            <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as OrcamentoListFilter)}>
              <option value="todos">Todos os status</option>
              <option value="aberto">Abertos</option>
              <option value="aguardando_aprovacao">Aguardando aprovacao</option>
              <option value="enviado">Enviados</option>
              <option value="negociando">Negociando</option>
              <option value="ganho">Ganhos</option>
              <option value="perdido">Perdidos</option>
              <option value="vencidos">Vencidos</option>
            </select>
          </label>
          <WalletCards size={18} />
        </div>
      </div>
      {showLooseBudgetSearch && (
        <section className="quote-client-search">
          <div className="panel-header">
            <div>
              <h3>Novo orcamento avulso</h3>
              <p>
                {preparedQuoteContext.initialItems?.length
                  ? `Item preparado a partir de ${preparedQuoteContext.label}. Escolha o cliente para montar a proposta.`
                  : 'Pesquise qualquer cliente por nome, cidade, CPF/CNPJ ou codigo e escolha para montar a proposta.'}
              </p>
            </div>
            <button className="button" type="button" onClick={() => setShowLooseBudgetSearch(false)}>Fechar</button>
          </div>
          <label className="search quote-client-search-input">
            <Search size={18} />
            <input
              value={looseBudgetQuery}
              onChange={(event) => setLooseBudgetQuery(event.target.value)}
              placeholder="Buscar cliente para orcamento"
              autoFocus
            />
          </label>
          {looseBudgetError && <div className="alert">{looseBudgetError}</div>}
          {isSearchingLooseBudget && <div className="empty-state compact">Buscando clientes...</div>}
          {!isSearchingLooseBudget && (
            <div className="quote-client-results">
              <span>{looseBudgetTotal} clientes encontrados. Exibindo ate 20 resultados.</span>
              {looseBudgetResults.map((cliente) => (
                <button
                  className="quote-client-result"
                  key={cliente.id}
                  type="button"
                  onClick={() => onCreateLooseBudget(cliente)}
                >
                  <span>
                    <strong>{cliente.nome}</strong>
                    <small>{cliente.cidade}/{cliente.uf} · {cliente.whatsapp ?? 'sem WhatsApp'} · {origemLabel(cliente.origemBase)}</small>
                  </span>
                  <b>Criar proposta</b>
                </button>
              ))}
              {looseBudgetResults.length === 0 && (
                <div className="empty-state compact">Nenhum cliente encontrado para esta busca.</div>
              )}
            </div>
          )}
        </section>
      )}
      <div className="info-grid budget-summary">
        <Info label="Pipeline aberto" value={money(valorAberto)} />
        <Info label="Vencidos" value={vencidos.toString()} />
        <Info label="Aguardando aprov." value={aguardandoAprovacao.toString()} />
        <Info label="Negociando" value={negociando.toString()} />
        <Info label="Ganhos" value={ganhos.toString()} />
      </div>
      <div className="table">
        <div className="table-head five">
          <span>Cliente</span>
          <span>Status</span>
          <span>Valor</span>
          <span>Validade</span>
          <span>Vendedor</span>
        </div>
        {isLoading && <div className="empty-state compact">Carregando orcamentos...</div>}
        {!isLoading && orcamentos.map((orcamento) => {
          const cliente = clientes.find((item) => item.id === orcamento.clienteId)
          const vendedor = usuarios.find((item) => item.id === orcamento.vendedorId)
          const isExpired = openStatuses.includes(orcamento.status) && daysSince(orcamento.validade) > 0
          return (
            <div className={isExpired ? 'table-row five expired-budget' : 'table-row five'} key={orcamento.id}>
              <span><strong>{cliente?.nome ?? orcamento.clienteNome ?? 'Cliente nao carregado'}</strong></span>
              <span>
                <span className={isExpired ? 'status-pill danger' : 'status-pill'}>{isExpired ? 'vencido' : orcamento.status}</span>
                {orcamento.aprovacaoMotivo && <small>{orcamento.aprovacaoMotivo}</small>}
                {orcamento.motivoPerda && <small>Motivo: {lossReasonLabel(orcamento.motivoPerda)}</small>}
                {orcamento.aprovadoEm && <small>Aprovado em {dateLabel(orcamento.aprovadoEm)}</small>}
              </span>
              <span>
                <strong>{money(orcamento.valorTotal)}</strong>
                <small>{orcamento.itens?.length ?? 0} itens</small>
              </span>
              <span>
                <strong>{dateLabel(orcamento.validade)}</strong>
                {isExpired && <small>Follow-up imediato</small>}
              </span>
              <span>
                <strong>{vendedor?.nome ?? orcamento.vendedorNome ?? 'Vendedor nao carregado'}</strong>
                <div className="budget-row-actions">
                  <button className="button primary" type="button" onClick={() => onOpenDetail(orcamento)}>
                    Abrir
                  </button>
                  <select
                    className="assign-select"
                    value=""
                    aria-label="Acoes da proposta"
                    onChange={(event) => {
                      const action = event.target.value
                      event.currentTarget.value = ''
                      if (action === 'enviado') onStatusChange(orcamento.id, 'enviado')
                      if (action === 'negociando') onStatusChange(orcamento.id, 'negociando')
                      if (action === 'ganho') onStatusChange(orcamento.id, 'ganho')
                      if (action === 'versoes') openVersionHistory(orcamento)
                      if (action === 'revisar') setRevisionTarget(orcamento)
                    }}
                  >
                    <option value="">Mais acoes</option>
                    <option value="enviado">Marcar enviado</option>
                    <option value="negociando">Marcar negociando</option>
                    <option value="ganho">Marcar ganho</option>
                    <option value="versoes">Ver versoes</option>
                    <option value="revisar">Revisar proposta</option>
                  </select>
                  {orcamento.status === 'aguardando_aprovacao' && canApprove && (
                    <button className="button primary" type="button" onClick={() => onStatusChange(orcamento.id, 'enviado')}>
                      Aprovar
                    </button>
                  )}
                  {orcamento.status === 'aguardando_aprovacao' && canApprove && (
                    <>
                      <select
                        className="assign-select"
                        value={approvalRejectReasons[orcamento.id] ?? ''}
                        onChange={(event) => setApprovalRejectReasons({ ...approvalRejectReasons, [orcamento.id]: event.target.value })}
                      >
                        <option value="">Motivo rejeicao</option>
                        <option value="desconto_excessivo">Desconto excessivo</option>
                        <option value="margem_insuficiente">Margem insuficiente</option>
                        <option value="preco_desatualizado">Preco desatualizado</option>
                        <option value="sem_estoque">Sem estoque</option>
                        <option value="revisar_comercial">Revisar condicao comercial</option>
                      </select>
                      <button
                        className="button danger"
                        disabled={!approvalRejectReasons[orcamento.id]}
                        type="button"
                        onClick={() => onStatusChange(orcamento.id, 'perdido', `aprovacao_rejeitada:${approvalRejectReasons[orcamento.id]}`)}
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                </div>
                <div className="budget-loss-row">
                  <select
                    className="assign-select"
                    value={lossReasons[orcamento.id] ?? ''}
                    onChange={(event) => setLossReasons({ ...lossReasons, [orcamento.id]: event.target.value })}
                  >
                    <option value="">Motivo perda</option>
                    <option value="preco">Preco</option>
                    <option value="prazo">Prazo</option>
                    <option value="concorrente">Concorrente</option>
                    <option value="sem_estoque">Sem estoque</option>
                    <option value="nao_respondeu">Nao respondeu</option>
                    <option value="aprovacao_rejeitada">Aprovacao rejeitada</option>
                  </select>
                  <button
                    className="button"
                    disabled={!lossReasons[orcamento.id]}
                    type="button"
                    onClick={() => onStatusChange(orcamento.id, 'perdido', lossReasons[orcamento.id])}
                  >
                    Perder
                  </button>
                </div>
              </span>
            </div>
          )
        })}
        {!isLoading && orcamentos.length === 0 && <div className="empty-state">Nenhum orcamento nesta visao.</div>}
      </div>
      <div className="pagination-bar">
        <span>Pagina {page} de {totalPages} - {total} orcamentos</span>
        <div className="toolbar-actions">
          <button className="button" type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(Math.max(1, page - 1))}>
            Anterior
          </button>
          <button className="button" type="button" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
            Proxima
          </button>
        </div>
      </div>
      {versionTarget && (
        <section className="quote-version-panel">
          <div className="panel-header">
            <div>
              <h3>Versoes da proposta {versionTarget.id.slice(0, 8)}</h3>
              <p>{targetClient?.nome ?? 'Cliente'} - {targetVendor?.nome ?? 'Vendedor'} - status atual {versionTarget.status}</p>
            </div>
            <button className="button" type="button" onClick={() => setVersionTarget(null)}>Fechar</button>
          </div>
          {versionsLoading && <div className="empty-state">Carregando versoes...</div>}
          {versionsError && <div className="alert">{versionsError}</div>}
          {!versionsLoading && versions.length === 0 && (
            <div className="empty-state">Nenhuma versao registrada para esta proposta ainda.</div>
          )}
          {!versionsLoading && versions.length > 0 && (
            <>
              <div className="info-grid quote-version-summary">
                <Info label="Versoes" value={versions.length.toString()} />
                <Info label="Primeira versao" value={firstVersion ? money(firstVersion.valorTotal) : '-'} />
                <Info label="Ultima versao" value={latestVersion ? money(latestVersion.valorTotal) : '-'} />
                <Info label="Diferenca atual" value={latestVersion ? money(versionTarget.valorTotal - latestVersion.valorTotal) : '-'} />
              </div>
              <div className="quote-version-grid">
                {versions.map((version) => (
                  <article className="quote-version-card" key={version.id}>
                    <div>
                      <strong>v{version.numero} - {version.status}</strong>
                      <small>{dateLabel(version.criadoEm)} - {version.origem ?? 'sem origem'}</small>
                    </div>
                    <div className="proposal-lines">
                      {version.itens.slice(0, 8).map((item, index) => (
                        <div key={`${version.id}-${index}`}>
                          <span>{item.quantidade}x {item.descricao}</span>
                          <strong>{money(item.valorTotal ?? 0)}</strong>
                        </div>
                      ))}
                      {version.itens.length > 8 && <small>+ {version.itens.length - 8} itens</small>}
                    </div>
                    <div className="proposal-total">
                      <span>Total</span>
                      <strong>{money(version.valorTotal)}</strong>
                    </div>
                    <small>Condicao: {version.formaPagamento ?? 'nao informada'} - Validade: {version.validade ? dateLabel(version.validade) : 'sem validade'}</small>
                    {version.mensagem && <textarea readOnly value={version.mensagem} />}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {revisionTarget && revisionClient && (
        <OrcamentoRevisionEditor
          orcamento={revisionTarget}
          cliente={revisionClient}
          catalogo={catalogo}
          onCancel={() => setRevisionTarget(null)}
          onSave={async (input) => {
            const revised = await onRevise(revisionTarget.id, input)
            setRevisionTarget(null)
            setVersionTarget(revised)
            setVersions(await listOrcamentoVersoes(revised.id))
          }}
        />
      )}
    </section>
  )
}

function OrcamentoWorkspace({
  orcamento,
  cliente,
  vendedor,
  currentUser,
  catalogo,
  onBack,
  onRevise,
  onStatusChange,
}: {
  orcamento: Orcamento
  cliente: Cliente
  vendedor?: Vendedor
  currentUser: SessaoUsuario
  catalogo: CatalogoItem[]
  onBack: () => void
  onRevise: (id: string, orcamento: OrcamentoInput) => Promise<Orcamento>
  onStatusChange: (status: Orcamento['status'], motivoPerda?: string) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<'resumo' | 'itens' | 'mensagem' | 'versoes'>('resumo')
  const [versions, setVersions] = useState<OrcamentoVersao[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [revisionTarget, setRevisionTarget] = useState<Orcamento | null>(null)
  const [lossReason, setLossReason] = useState('')
  const [approvalRejectReason, setApprovalRejectReason] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const proposalPreviewRef = useRef<HTMLDivElement | null>(null)
  const validItems = (orcamento.itens ?? []).map((item) => ({ ...item, valorTotal: item.valorTotal ?? quoteItemTotal(item) }))
  const scenarios = quoteScenariosFromBudget(orcamento)
  const message = buildQuoteMessage(cliente, validItems, orcamento.validade, orcamento.observacao, scenarios)
  const waUrl = cliente.whatsapp && validItems.length > 0
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(message)}`
    : undefined
  const isExpired = ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'].includes(orcamento.status) && daysSince(orcamento.validade) > 0
  const canApprove = currentUser.role === 'admin'

  useEffect(() => {
    let isMounted = true

    async function loadVersions() {
      if (activeTab !== 'versoes') return
      setVersionsLoading(true)
      try {
        const data = await listOrcamentoVersoes(orcamento.id)
        if (isMounted) setVersions(data)
      } catch {
        if (isMounted) setVersions([])
      } finally {
        if (isMounted) setVersionsLoading(false)
      }
    }

    void loadVersions()
    return () => {
      isMounted = false
    }
  }, [activeTab, orcamento.id])

  async function updateStatus(status: Orcamento['status'], motivo?: string) {
    setIsUpdatingStatus(true)
    setError('')
    setFeedback('')
    try {
      await onStatusChange(status, motivo)
      setFeedback(`Status atualizado para ${status}.`)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setFeedback('Mensagem copiada.')
  }

  function downloadCurrentPdf() {
    if (activeTab !== 'resumo' || !proposalPreviewRef.current) {
      setActiveTab('resumo')
      window.setTimeout(() => {
        void downloadQuotePdf(proposalPreviewRef.current, cliente.nome, orcamento.data)
      }, 100)
      return
    }
    void downloadQuotePdf(proposalPreviewRef.current, cliente.nome, orcamento.data)
  }

  return (
    <section className="quote-workspace">
      <section className={isExpired ? 'panel wide quote-workspace-hero expired-budget' : 'panel wide quote-workspace-hero'}>
        <div>
          <p className="eyebrow">Proposta {orcamento.id.slice(0, 8)}</p>
          <h2>{cliente.nome}</h2>
          <p>{cliente.cidade}/{cliente.uf} - {cliente.whatsapp ?? cliente.telefone ?? 'sem contato'} - {vendedor?.nome ?? orcamento.vendedorNome ?? 'sem vendedor'}</p>
        </div>
        <div className="toolbar-actions">
          <button className="button" type="button" onClick={onBack}>Voltar</button>
          <button className="button" type="button" onClick={downloadCurrentPdf}>Baixar PDF</button>
          <a className={!waUrl ? 'button disabled' : 'button primary'} href={waUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={16} /> Enviar WA.ME
          </a>
        </div>
      </section>

      {feedback && <div className="success-alert">{feedback}</div>}
      {error && <div className="alert">{error}</div>}

      <section className="panel wide">
        <div className="info-grid quote-kpis">
          <Info label="Status" value={isExpired ? 'Vencido' : orcamento.status} />
          <Info label="Total" value={money(orcamento.valorTotal)} />
          <Info label="Validade" value={dateLabel(orcamento.validade)} />
          <Info label="Previsao" value={dateLabel(orcamento.previsaoFechamento)} />
          <Info label="Condicao" value={orcamento.formaPagamento ?? 'Nao informada'} />
        </div>
        <div className="quote-workspace-actions">
          {orcamento.status === 'aguardando_aprovacao' && canApprove && (
            <button className="button primary" type="button" disabled={isUpdatingStatus} onClick={() => updateStatus('enviado')}>
              Aprovar e marcar enviado
            </button>
          )}
          {orcamento.status === 'aguardando_aprovacao' && canApprove && (
            <>
              <select className="assign-select" value={approvalRejectReason} onChange={(event) => setApprovalRejectReason(event.target.value)}>
                <option value="">Motivo rejeicao</option>
                <option value="desconto_excessivo">Desconto excessivo</option>
                <option value="margem_insuficiente">Margem insuficiente</option>
                <option value="preco_desatualizado">Preco desatualizado</option>
                <option value="sem_estoque">Sem estoque</option>
                <option value="revisar_comercial">Revisar condicao comercial</option>
              </select>
              <button className="button danger" type="button" disabled={!approvalRejectReason || isUpdatingStatus} onClick={() => updateStatus('perdido', `aprovacao_rejeitada:${approvalRejectReason}`)}>
                Rejeitar
              </button>
            </>
          )}
          <button className="button" type="button" disabled={isUpdatingStatus} onClick={() => updateStatus('enviado')}>Enviado</button>
          <button className="button" type="button" disabled={isUpdatingStatus} onClick={() => updateStatus('negociando')}>Negociando</button>
          <button className="button" type="button" disabled={isUpdatingStatus} onClick={() => updateStatus('ganho')}>Ganho</button>
          <select className="assign-select" value={lossReason} onChange={(event) => setLossReason(event.target.value)}>
            <option value="">Motivo perda</option>
            <option value="preco">Preco</option>
            <option value="prazo">Prazo</option>
            <option value="concorrente">Concorrente</option>
            <option value="sem_estoque">Sem estoque</option>
            <option value="nao_respondeu">Nao respondeu</option>
            <option value="aprovacao_rejeitada">Aprovacao rejeitada</option>
          </select>
          <button className="button" type="button" disabled={!lossReason || isUpdatingStatus} onClick={() => updateStatus('perdido', lossReason)}>Perdido</button>
          <button className="button primary" type="button" onClick={() => setRevisionTarget(orcamento)}>Revisar proposta</button>
        </div>
      </section>

      <section className="panel wide">
        <div className="tabs">
          {[
            ['resumo', 'Resumo'],
            ['itens', 'Itens'],
            ['mensagem', 'Mensagem'],
            ['versoes', 'Versoes'],
          ].map(([tab, label]) => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} type="button" onClick={() => setActiveTab(tab as typeof activeTab)}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'resumo' && (
          <div className="quote-workspace-grid">
            <div className="proposal-preview" ref={proposalPreviewRef}>
              <QuoteProposalPreview
                cliente={cliente}
                itens={validItems}
                total={orcamento.valorTotal}
                validade={orcamento.validade}
                condicoes={scenarios}
                observacao={orcamento.observacao}
                vendedorNome={vendedor?.nome ?? orcamento.vendedorNome ?? currentUser.nome}
              />
            </div>
            <div className="summary-box">
              <strong>Controle comercial</strong>
              <p>{orcamento.observacao ?? 'Sem observacoes comerciais registradas.'}</p>
              {orcamento.aprovacaoMotivo && <p>Aprovacao: {orcamento.aprovacaoMotivo}</p>}
              {orcamento.motivoPerda && <p>Motivo perda: {lossReasonLabel(orcamento.motivoPerda)}</p>}
            </div>
          </div>
        )}

        {activeTab === 'itens' && (
          <div className="table">
            <div className="table-head five">
              <span>Item</span>
              <span>Tipo</span>
              <span>Quantidade</span>
              <span>Unitario</span>
              <span>Total</span>
            </div>
            {validItems.map((item) => (
              <div className="table-row five" key={item.id}>
                <span><strong>{item.descricao}</strong><small>{item.codigo ?? item.catalogoItemId ?? 'manual'}</small></span>
                <span>{item.tipo}</span>
                <span>{item.quantidade}</span>
                <span>{money(item.valorUnitario)}<small>{item.descontoPercentual ? `${item.descontoPercentual}% desc.` : 'sem desconto'}</small></span>
                <span><strong>{money(item.valorTotal ?? 0)}</strong></span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'mensagem' && (
          <div className="quote-message-grid">
            <label>
              Mensagem WhatsApp
              <textarea readOnly value={message} />
            </label>
            <div className="quote-payment-scenarios">
              <strong>Condicoes comparativas</strong>
              {scenarios.map((scenario) => (
                <div className="status-row" key={scenario.label}>
                  <span>{scenario.label}</span>
                  <strong>{quoteConditionValueLabel(scenario.total, scenario.parcelas)}</strong>
                </div>
              ))}
              <button className="button" type="button" onClick={copyMessage}>Copiar mensagem</button>
              <a className={!waUrl ? 'button disabled' : 'button primary'} href={waUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> Abrir WhatsApp
              </a>
            </div>
          </div>
        )}

        {activeTab === 'versoes' && (
          <>
            {versionsLoading && <div className="empty-state">Carregando versoes...</div>}
            {!versionsLoading && versions.length === 0 && <div className="empty-state">Nenhuma versao registrada.</div>}
            {!versionsLoading && versions.length > 0 && (
              <div className="quote-version-grid">
                {versions.map((version) => (
                  <article className="quote-version-card" key={version.id}>
                    <div>
                      <strong>v{version.numero} - {version.status}</strong>
                      <small>{dateLabel(version.criadoEm)} - {version.origem ?? 'sem origem'}</small>
                    </div>
                    <div className="proposal-lines">
                      {version.itens.slice(0, 8).map((item, index) => (
                        <div key={`${version.id}-${index}`}>
                          <span>{item.quantidade}x {item.descricao}</span>
                          <strong>{money(item.valorTotal ?? 0)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="proposal-total">
                      <span>Total</span>
                      <strong>{money(version.valorTotal)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {revisionTarget && (
        <OrcamentoRevisionEditor
          orcamento={revisionTarget}
          cliente={cliente}
          catalogo={catalogo}
          onCancel={() => setRevisionTarget(null)}
          onSave={async (input) => {
            const revised = await onRevise(revisionTarget.id, input)
            setRevisionTarget(null)
            setFeedback(`Proposta ${revised.id.slice(0, 8)} revisada e versionada.`)
            setActiveTab('versoes')
            setVersions(await listOrcamentoVersoes(revised.id))
          }}
        />
      )}
    </section>
  )
}

function OrcamentoRevisionEditor({
  orcamento,
  cliente,
  catalogo,
  onCancel,
  onSave,
}: {
  orcamento: Orcamento
  cliente: Cliente
  catalogo: CatalogoItem[]
  onCancel: () => void
  onSave: (orcamento: OrcamentoInput) => Promise<void>
}) {
  const [validade, setValidade] = useState(() => orcamento.validade || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [previsaoFechamento, setPrevisaoFechamento] = useState(orcamento.previsaoFechamento ?? '')
  const [paymentAdjustments, setPaymentAdjustments] = useState<Record<string, number>>(() => {
    if (orcamento.condicoes?.length) {
      return Object.fromEntries(orcamento.condicoes.map((condicao) => [condicao.label, condicao.ajustePercentual]))
    }
    return { 'A vista': -3, '30 dias': 3, '30/60 dias': 4.5, '30/60/90 dias': 6, '60 dias': 6, '90 dias': 9, '120 dias': 12 }
  })
  const [observacao, setObservacao] = useState(orcamento.observacao ?? '')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [items, setItems] = useState<OrcamentoItemInput[]>(
    orcamento.itens && orcamento.itens.length > 0
      ? orcamento.itens.map((item) => ({
          catalogoItemId: item.catalogoItemId,
          codigo: item.codigo,
          descricao: item.descricao,
          tipo: item.tipo,
          apresentacao: item.apresentacao ?? 'normal',
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          descontoPercentual: item.descontoPercentual ?? 0,
          observacao: item.observacao,
        }))
      : [{ descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0, descontoPercentual: 0, apresentacao: 'normal' }],
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredCatalog = catalogo
    .filter((item) => {
      const term = catalogSearch.trim().toLowerCase()
      if (!term) return true
      return `${item.codigo} ${item.descricao} ${item.tipo} ${item.grupo ?? ''} ${item.marca ?? ''}`.toLowerCase().includes(term)
    })
    .slice(0, 120)
  const validItems = items
    .filter((item) => item.descricao.trim() && item.quantidade > 0 && item.valorUnitario > 0)
    .map((item) => ({ ...item, valorTotal: quoteItemTotal(item) }))
  const total = quoteBaseTotal(validItems)
  const approvalWarnings = quoteApprovalWarnings(validItems, catalogo)
  const paymentScenarios = quotePaymentScenarios(total, paymentAdjustments)
  const formaPagamento = paymentScenarios.length
    ? paymentScenarios.map((scenario) => quoteConditionLabel(scenario.label)).join(', ')
    : orcamento.formaPagamento
  const quoteMessage = buildQuoteMessage(cliente, validItems, validade, observacao, paymentScenarios)

  function updateItem(index: number, patch: Partial<OrcamentoItemInput>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function applyCatalogItem(index: number, catalogoItemId: string) {
    const selected = catalogo.find((item) => item.id === catalogoItemId)
    if (!selected) {
      updateItem(index, { catalogoItemId: undefined, codigo: undefined })
      return
    }
    updateItem(index, {
      catalogoItemId: selected.id,
      codigo: selected.codigo,
      tipo: selected.tipo,
      descricao: selected.descricao,
      valorUnitario: selected.preco,
      descontoPercentual: 0,
      apresentacao: 'normal',
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validItems.length === 0 || total <= 0) {
      setError('Adicione pelo menos um item com valor para revisar a proposta.')
      return
    }

    setError('')
    setIsSaving(true)
    const needsApproval = approvalWarnings.length > 0
    const revisionNote = `Revisao da proposta ${orcamento.id.slice(0, 8)} em ${dateLabel(new Date().toISOString())}.`
    try {
      await onSave({
        clienteId: orcamento.clienteId,
        vendedorId: orcamento.vendedorId,
        status: needsApproval ? 'aguardando_aprovacao' : 'negociando',
        valorTotal: total,
        validade,
        previsaoFechamento: previsaoFechamento || undefined,
        formaPagamento,
        aprovacaoMotivo: needsApproval ? approvalWarnings.join(' ') : undefined,
        motivoPerda: undefined,
        aprovadoPor: undefined,
        aprovadoEm: undefined,
        observacao: [observacao.trim(), revisionNote].filter(Boolean).join('\n\n'),
        itens: validItems,
        condicoes: quoteConditionInputs(paymentScenarios),
        versaoMensagem: quoteMessage,
        versaoOrigem: 'revisao de proposta',
      })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel revisar a proposta.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="quote-version-panel quote-revision-panel">
      <div className="panel-header">
        <div>
          <h3>Revisar proposta {orcamento.id.slice(0, 8)}</h3>
          <p>{cliente.nome} - versao nova sera registrada ao salvar.</p>
        </div>
        <button className="button" type="button" onClick={onCancel}>Cancelar</button>
      </div>
      {error && <div className="alert">{error}</div>}
      {approvalWarnings.length > 0 && (
        <div className="readiness warning">
          <strong>Requer aprovacao comercial</strong>
          {approvalWarnings.map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      )}
      <form className="quote-layout" onSubmit={submit}>
        <section className="quote-main">
          <div className="quote-controls">
            <label>
              Validade
              <input type="date" value={validade} onChange={(event) => setValidade(event.target.value)} required />
            </label>
            <label>
              Prev. fechamento
              <input type="date" value={previsaoFechamento} onChange={(event) => setPrevisaoFechamento(event.target.value)} />
            </label>
          </div>
          <label className="quote-search">
            Buscar catalogo
            <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Codigo, medida, produto, servico ou marca" />
          </label>
          <div className="quote-items">
            <div className="quote-item-head">
              <span>Catalogo</span>
              <span>Descricao</span>
              <span>Qtd.</span>
              <span>Unitario</span>
              <span>Desc.</span>
              <span>Bloco</span>
              <span>Bloco/uso</span>
              <span>Total</span>
            </div>
            {items.map((item, index) => (
              <div className="quote-item-row" key={index}>
                <select value={item.catalogoItemId ?? ''} onChange={(event) => applyCatalogItem(index, event.target.value)}>
                  <option value="">Selecionar</option>
                  {filteredCatalog.map((catalogItem) => (
                    <option key={catalogItem.id} value={catalogItem.id}>
                      {catalogItem.tipo} | {catalogItem.codigo} | {catalogItem.descricao} | {money(catalogItem.preco)}
                    </option>
                  ))}
                </select>
                <input value={item.descricao} onChange={(event) => updateItem(index, { descricao: event.target.value })} placeholder="Descricao" />
                <input type="number" min="0" step="0.01" value={item.quantidade} onChange={(event) => updateItem(index, { quantidade: Number(event.target.value) })} />
                <input type="number" min="0" step="0.01" value={item.valorUnitario} onChange={(event) => updateItem(index, { valorUnitario: Number(event.target.value) })} />
                <input type="number" min="0" max="100" step="0.01" value={item.descontoPercentual ?? 0} onChange={(event) => updateItem(index, { descontoPercentual: Number(event.target.value) })} />
                <select value={item.apresentacao ?? 'normal'} onChange={(event) => updateItem(index, { apresentacao: event.target.value as OrcamentoItemInput['apresentacao'] })}>
                  <option value="normal">Normal</option>
                  <option value="alternativa">Alternativa</option>
                  <option value="pacote">Pacote</option>
                  <option value="complementar">Complementar</option>
                </select>
                <input value={item.observacao ?? ''} onChange={(event) => updateItem(index, { observacao: event.target.value })} placeholder="Bloco 1, eixo ou uso" />
                <strong>{money(quoteItemTotal(item))}</strong>
              </div>
            ))}
          </div>
          <div className="quote-actions">
            <button className="button" type="button" onClick={() => setItems((current) => [...current, { descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0, descontoPercentual: 0, apresentacao: 'normal' }])}>
              Adicionar item
            </button>
            <button className="button" type="button" disabled={items.length <= 1} onClick={() => setItems((current) => current.slice(0, -1))}>
              Remover ultima linha
            </button>
          </div>
          <label className="quote-observation">
            Observacoes e termos
            <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} />
          </label>
          <div className="quote-payment-scenarios">
            <div>
              <strong>Condicoes comerciais</strong>
              <small>Ficam gravadas na proposta revisada.</small>
            </div>
            {paymentScenarios.map((scenario) => (
              <label key={scenario.label}>
                <span>{scenario.label}</span>
                <input
                  type="number"
                  step="0.1"
                  value={paymentAdjustments[scenario.label] ?? 0}
                  onChange={(event) => setPaymentAdjustments((current) => ({
                    ...current,
                    [scenario.label]: Number(event.target.value),
                  }))}
                />
                <strong>{quoteConditionValueLabel(scenario.total, scenario.parcelas)}</strong>
              </label>
            ))}
          </div>
        </section>
        <aside className="quote-summary-panel">
          <div className="info-grid quote-kpis">
            <Info label="Total anterior" value={money(orcamento.valorTotal)} />
            <Info label="Novo total" value={money(total)} />
            <Info label="Diferenca" value={money(total - orcamento.valorTotal)} />
            <Info label="Aprovacao" value={approvalWarnings.length > 0 ? 'Necessaria' : 'Dentro do limite'} />
          </div>
          <label>
            Mensagem WhatsApp revisada
            <textarea readOnly value={quoteMessage} />
          </label>
          <button className="button primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar nova versao'}
          </button>
        </aside>
      </form>
    </section>
  )
}

function clienteFromOrcamento(orcamento: Orcamento): Cliente {
  return {
    id: orcamento.clienteId,
    codigoErp: '',
    nome: orcamento.clienteNome ?? 'Cliente',
    tipoCliente: '',
    cidade: '',
    uf: '',
    vendedorId: orcamento.vendedorId,
    vendedorNome: orcamento.vendedorNome,
    status: 'Orcamento aberto',
    origem: 'orcamento',
    totalComprado: 0,
    totalServicos: 0,
    tags: [],
  }
}

function Relatorios({
  clientes,
  resumo,
  vendedoresResumo,
  rankingMedidas,
  rankingServicos,
  funilGerencial,
  motivosPerda,
  atividadesDia,
  forecastVendedor,
  interacoes,
  orcamentos,
  importacoes,
  conflitos,
  usuarios,
  tarefas,
  oportunidades,
  campanhasVendedorResumo,
  vendasItens,
  servicosItens,
}: {
  clientes: Cliente[]
  resumo?: DashboardResumo
  vendedoresResumo: VendedorResumo[]
  rankingMedidas: RankingResumo[]
  rankingServicos: RankingResumo[]
  funilGerencial: FunilGerencialResumo[]
  motivosPerda: MotivoPerdaResumo[]
  atividadesDia: AtividadeDiaResumo[]
  forecastVendedor: ForecastVendedorResumo[]
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  importacoes: Importacao[]
  conflitos: ImportacaoConflito[]
  usuarios: Vendedor[]
  tarefas: Tarefa[]
  oportunidades: Oportunidade[]
  campanhasVendedorResumo: CampanhaVendedorResumo[]
  vendasItens: VendaItem[]
  servicosItens: ServicoItem[]
}) {
  const orcamentosGanhos = resumo?.orcamentosGanhos ?? orcamentos.filter((orcamento) => orcamento.status === 'ganho').length
  const orcamentosTotal = resumo?.orcamentosTotal ?? orcamentos.length
  const taxaConversao = orcamentosTotal ? Math.round((orcamentosGanhos / orcamentosTotal) * 100) : 0
  const valorAberto = resumo?.pipelineAberto ?? orcamentos
      .filter((orcamento) => ['aberto', 'enviado', 'negociando'].includes(orcamento.status))
      .reduce((total, orcamento) => total + orcamento.valorTotal, 0)
  const clientesRisco = resumo
    ? resumo.clientesInativos90
    : clientes.filter((cliente) => daysSince(cliente.ultimaCompraEm) > 180).length
  const conflitosPendentes = conflitos.filter((conflito) => !conflito.resolvido).length
  const tarefasVencidas = resumo?.tarefasVencidas ?? tarefas.filter((tarefa) => tarefa.status === 'aberta' && daysSince(tarefa.dataVencimento) > 0).length
  const oportunidadesBloqueadas = oportunidades.filter((oportunidade) => oportunidade.bloqueada).length
  const forecastTotal = forecastVendedor.reduce((total, row) => total + row.forecastPonderado, 0)
  const pipelineForecast = forecastVendedor.reduce((total, row) => total + row.pipelineAberto, 0)
  const propostasVencidasForecast = forecastVendedor.reduce((total, row) => total + row.vencidas, 0)
  const medidas = rankingMedidas.length > 0
    ? rankingMedidas.map((item) => ({ label: item.label, count: item.itens }))
    : rankBy(vendasItens, (venda) => venda.medida ?? venda.produtoNome)
  const servicos = rankingServicos.length > 0
    ? rankingServicos.map((item) => ({ label: item.label, count: item.itens }))
    : rankBy(servicosItens, (servico) => servico.servicoNome)

  const vendedorRows = vendedoresResumo.length > 0
    ? vendedoresResumo
        .filter((vendedor) => vendedor.role !== 'operacao')
        .map((vendedor) => {
          const coberturaContato = vendedor.clientes
            ? Math.round(((vendedor.clientes - vendedor.clientesRisco) / vendedor.clientes) * 100)
            : 0
          const saude = Math.max(0, Math.min(100, coberturaContato - vendedor.tarefasVencidas * 8))
          return {
            vendedor: vendedor.vendedorNome,
            clientes: vendedor.clientes,
            contatos: vendedor.contatos,
            clientesEmRisco: vendedor.clientesRisco,
            tarefasAtrasadas: vendedor.tarefasVencidas,
            pipeline: vendedor.pipeline,
            saude,
          }
        })
        .sort((a, b) => a.saude - b.saude)
    : usuarios
        .filter((vendedor) => vendedor.role !== 'operacao')
        .map((vendedor) => {
          const clientesVendedor = clientes.filter((cliente) => cliente.vendedorId === vendedor.id)
          const contatos = interacoes.filter((interacao) => interacao.vendedorId === vendedor.id)
          const clientesEmRisco = clientesVendedor.filter((cliente) => daysSince(cliente.ultimaCompraEm) > 180).length
          const tarefasAtrasadas = tarefas.filter(
            (tarefa) => tarefa.vendedorId === vendedor.id && tarefa.status === 'aberta' && daysSince(tarefa.dataVencimento) > 0,
          ).length
          const pipeline = orcamentos
            .filter((orcamento) => orcamento.vendedorId === vendedor.id)
            .reduce((total, orcamento) => total + orcamento.valorTotal, 0)
          const coberturaContato = clientesVendedor.length
            ? Math.round((clientesVendedor.filter((cliente) => daysSince(cliente.ultimoContatoEm) <= 60).length / clientesVendedor.length) * 100)
            : 0
          const saude = Math.max(0, Math.min(100, coberturaContato - tarefasAtrasadas * 8 - clientesEmRisco * 5))

          return {
            vendedor: vendedor.nome,
            clientes: clientesVendedor.length,
            contatos: contatos.length,
            clientesEmRisco,
            tarefasAtrasadas,
            pipeline,
            saude,
          }
        })
        .sort((a, b) => a.saude - b.saude)
  const planoGerencial = [
    tarefasVencidas > 0 ? `Revisar ${tarefasVencidas} tarefas vencidas antes de novas campanhas.` : '',
    conflitosPendentes > 0 ? `Resolver ${conflitosPendentes} conflitos de importacao pendentes.` : '',
    clientesRisco > 0 ? `Priorizar contato com ${clientesRisco} clientes sem compra ha mais de 180 dias.` : '',
    oportunidadesBloqueadas > 0 ? `Desbloquear ${oportunidadesBloqueadas} oportunidades impedidas por status ou falta de dados.` : '',
  ].filter(Boolean)

  return (
    <section className="grid-layout">
      <div className="metric-grid">
        <Metric icon={WalletCards} label="Pipeline aberto" value={money(valorAberto)} tone="blue" />
        <Metric icon={CheckCircle2} label="Conversao orcamentos" value={`${taxaConversao}%`} tone="green" />
        <Metric icon={AlertTriangle} label="Clientes em risco" value={clientesRisco.toString()} tone="red" />
        <Metric icon={FileUp} label="Conflitos pendentes" value={conflitosPendentes.toString()} tone="amber" />
        <Metric icon={CalendarClock} label="Tarefas vencidas" value={tarefasVencidas.toString()} tone="red" />
        <Metric icon={ShieldCheck} label="Oport. bloqueadas" value={oportunidadesBloqueadas.toString()} tone="blue" />
        <Metric icon={BarChart3} label="Forecast ponderado" value={money(forecastTotal)} tone="green" />
      </div>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Forecast e gargalos</h2>
            <p>Pipeline ponderado por etapa, propostas vencidas e proxima acao gerencial.</p>
          </div>
          <Gauge size={18} />
        </div>
        <div className="info-grid forecast-summary">
          <Info label="Pipeline aberto" value={money(pipelineForecast)} />
          <Info label="Forecast ponderado" value={money(forecastTotal)} />
          <Info label="Propostas vencidas" value={propostasVencidasForecast.toString()} />
          <Info label="Ganho no mes" value={money(forecastVendedor.reduce((total, row) => total + row.ganhoMes, 0))} />
        </div>
        <div className="table">
          <div className="table-head forecast-report">
            <span>Vendedor</span>
            <span>Aberto</span>
            <span>Forecast</span>
            <span>Ganho mes</span>
            <span>Vencidas</span>
            <span>7 dias</span>
            <span>Gargalo</span>
          </div>
          {forecastVendedor.map((row) => (
            <div className="table-row forecast-report" key={row.vendedorId}>
              <span><strong>{row.vendedorNome}</strong><small>{row.propostasAbertas} propostas abertas</small></span>
              <span>{money(row.pipelineAberto)}</span>
              <span><strong>{money(row.forecastPonderado)}</strong></span>
              <span>{money(row.ganhoMes)}</span>
              <span className={row.vencidas > 0 ? 'score danger' : 'score'}>{row.vencidas}</span>
              <span>{row.vencem7d}</span>
              <span><strong>{row.gargaloPrincipal}</strong><small>{dateLabel(row.ultimoMovimento)}</small></span>
            </div>
          ))}
          {forecastVendedor.length === 0 && <div className="empty-state">Sem dados de forecast ainda.</div>}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Campanhas por vendedor</h2>
            <p>Execucao e resultado das campanhas por responsavel comercial.</p>
          </div>
          <Send size={18} />
        </div>
        <div className="table">
          <div className="table-head campaign-seller-report">
            <span>Vendedor</span>
            <span>Envios</span>
            <span>Respostas</span>
            <span>Orc.</span>
            <span>Ganhos</span>
            <span>Tarefas</span>
            <span>Receita</span>
            <span>ROI</span>
          </div>
          {campanhasVendedorResumo.map((row) => (
            <div className="table-row campaign-seller-report" key={row.vendedorId ?? row.vendedorNome}>
              <span><strong>{row.vendedorNome}</strong><small>{row.campanhas} campanhas</small></span>
              <span>{row.enviados}<small>{row.total} total</small></span>
              <span>{row.responderam}<small>{conversionRate(row.responderam, row.total)}%</small></span>
              <span>{row.viraramOrcamento}</span>
              <span>{row.viraramVenda}</span>
              <span className={row.tarefasAbertas > 0 ? 'score danger' : 'score'}>{row.tarefasAbertas}</span>
              <span>{money(row.receitaAtribuida)}</span>
              <span className={row.roiPercent > 0 ? 'status-pill ok' : row.custoEstimado > 0 ? 'status-pill warn' : 'status-pill'}>
                {row.roiPercent}%
              </span>
            </div>
          ))}
          {campanhasVendedorResumo.length === 0 && <div className="empty-state">Sem resumo de campanhas por vendedor.</div>}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Produtividade comercial</h2>
            <p>Resumo por vendedor para acompanhamento gerencial.</p>
          </div>
          <BarChart3 size={18} />
        </div>
        <div className="table">
          <div className="table-head report">
            <span>Vendedor</span>
            <span>Clientes</span>
            <span>Contatos</span>
            <span>Risco</span>
            <span>Atrasos</span>
            <span>Pipeline</span>
            <span>Saude</span>
          </div>
          {vendedorRows.map((row) => (
            <div className="table-row report" key={row.vendedor}>
              <span><strong>{row.vendedor}</strong></span>
              <span>{row.clientes}</span>
              <span>{row.contatos}</span>
              <span>{row.clientesEmRisco}</span>
              <span>{row.tarefasAtrasadas}</span>
              <span>{money(row.pipeline)}</span>
              <span className={row.saude >= 75 ? 'status-pill ok' : row.saude >= 45 ? 'status-pill warn' : 'status-pill danger'}>
                {row.saude}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Funil comercial 30 dias</h2>
            <p>Contatos, propostas, ganhos, perdas e pipeline por responsavel.</p>
          </div>
          <BarChart3 size={18} />
        </div>
        <div className="table">
          <div className="table-head funnel-report">
            <span>Vendedor</span>
            <span>Clientes</span>
            <span>Contatos</span>
            <span>Orc.</span>
            <span>Ganhos</span>
            <span>Perdas</span>
            <span>Pipeline</span>
            <span>Tempo</span>
          </div>
          {funilGerencial.map((row) => (
            <div className="table-row funnel-report" key={row.vendedorId}>
              <span><strong>{row.vendedorNome}</strong><small>{row.leadsRodobens} sem cadastro</small></span>
              <span>{row.clientes}</span>
              <span>{row.contatos30d}</span>
              <span>{row.orcamentos30d}</span>
              <span>{row.ganhos30d}</span>
              <span>{row.perdidos30d}</span>
              <span>{money(row.pipelineAberto)}</span>
              <span>{Math.round(row.tempoMedioFechamento)} dias</span>
            </div>
          ))}
          {funilGerencial.length === 0 && <div className="empty-state">Sem dados agregados de funil.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Motivos de perda</h2>
            <p>Principais razoes registradas em propostas perdidas.</p>
          </div>
          <AlertTriangle size={18} />
        </div>
        <div className="table compact">
          <div className="table-head loss-report">
            <span>Motivo</span>
            <span>Qtd.</span>
            <span>Valor</span>
          </div>
          {motivosPerda.map((row) => (
            <div className="table-row loss-report" key={row.motivo}>
              <span><strong>{lossReasonLabel(row.motivo)}</strong><small>{dateLabel(row.ultimoRegistro)}</small></span>
              <span>{row.total}</span>
              <span>{money(row.valorTotal)}</span>
            </div>
          ))}
          {motivosPerda.length === 0 && <div className="empty-state">Sem perdas registradas.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Atividades de hoje</h2>
            <p>Contatos, propostas e tarefas por vendedor.</p>
          </div>
          <CalendarClock size={18} />
        </div>
        <div className="table compact">
          <div className="table-head activity-report">
            <span>Vendedor</span>
            <span>Cont.</span>
            <span>Orc.</span>
            <span>Feitas</span>
            <span>Atrasos</span>
          </div>
          {atividadesDia.map((row) => (
            <div className="table-row activity-report" key={row.vendedorId}>
              <span><strong>{row.vendedorNome}</strong></span>
              <span>{row.contatosHoje}</span>
              <span>{row.orcamentosHoje}</span>
              <span>{row.tarefasConcluidasHoje}</span>
              <span>{row.tarefasVencidas}</span>
            </div>
          ))}
          {atividadesDia.length === 0 && <div className="empty-state">Sem atividades registradas hoje.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Plano gerencial</h2>
            <p>Fila executiva gerada pelos indicadores atuais.</p>
          </div>
          <Gauge size={18} />
        </div>
        <div className="recommendation-list">
          {(planoGerencial.length ? planoGerencial : ['Operacao sem gargalos criticos no momento.']).map((item) => (
            <div key={item}>
              <CheckCircle2 size={15} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Importacoes</h2>
            <p>Volume processado e registros em revisao.</p>
          </div>
          <FileUp size={18} />
        </div>
        <div className="status-list">
          <div className="status-row"><span>Arquivos registrados</span><strong>{importacoes.length}</strong></div>
          <div className="status-row">
            <span>Itens amostrados/processados</span>
            <strong>{importacoes.reduce((total, importacao) => total + importacao.totalItens, 0)}</strong>
          </div>
          <div className="status-row">
            <span>Clientes criados</span>
            <strong>{importacoes.reduce((total, importacao) => total + importacao.clientesCriados, 0)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Carteira</h2>
            <p>Qualidade e cobertura dos dados comerciais.</p>
          </div>
          <UsersRound size={18} />
        </div>
        <div className="status-list">
          <div className="status-row">
            <span>Sem vendedor</span>
            <strong>{resumo?.clientesSemVendedor ?? clientes.filter((cliente) => !cliente.vendedorId).length}</strong>
          </div>
          <div className="status-row">
            <span>Sem WhatsApp</span>
            <strong>{resumo?.clientesSemWhatsapp ?? clientes.filter((cliente) => !cliente.whatsapp).length}</strong>
          </div>
          <div className="status-row">
            <span>Sem contato recente</span>
            <strong>{resumo?.clientesSemContato60 ?? clientes.filter((cliente) => daysSince(cliente.ultimoContatoEm) > 60).length}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Medidas mais vendidas</h2>
            <p>Base para campanhas por recompra.</p>
          </div>
          <Truck size={18} />
        </div>
        <div className="status-list">
          {medidas.slice(0, 5).map((item) => (
            <div className="status-row" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Servicos recorrentes</h2>
            <p>Base para venda cruzada de pneus e manutencao.</p>
          </div>
          <ClipboardList size={18} />
        </div>
        <div className="status-list">
          {servicos.slice(0, 5).map((item) => (
            <div className="status-row" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function rankBy<T>(items: T[], getLabel: (item: T) => string) {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const label = getLabel(item) || 'Nao informado'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function VendedoresCarteira({
  clientes,
  usuarios,
  vendedoresResumo,
  vendedoresHistoricosResumo,
  tarefas,
  orcamentos,
  onAssignClient,
  onAssignFiltered,
}: {
  clientes: Cliente[]
  usuarios: Vendedor[]
  vendedoresResumo: VendedorResumo[]
  vendedoresHistoricosResumo: VendedorHistoricoResumo[]
  tarefas: Tarefa[]
  orcamentos: Orcamento[]
  onAssignClient: (clienteId: string, vendedorId: string) => void
  onAssignFiltered: (filters: ClientePageFilters, vendedorId: string) => Promise<number>
}) {
  const vendedores = usuarios.filter((usuario) => usuario.role === 'vendedor')
  const [responsavelFilter, setResponsavelFilter] = useState('todos')
  const [historicoFilter, setHistoricoFilter] = useState('todos')
  const [cidadeFilter, setCidadeFilter] = useState('todas')
  const [origemFilter, setOrigemFilter] = useState<'todas' | NonNullable<Cliente['origemBase']>>('todas')
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | 'todos'>('todos')
  const [page, setPage] = useState(1)
  const [carteiraClientes, setCarteiraClientes] = useState<Cliente[]>(clientes)
  const [total, setTotal] = useState(clientes.length)
  const [isLoading, setIsLoading] = useState(false)
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [bulkFeedback, setBulkFeedback] = useState('')
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)
  const [error, setError] = useState('')
  const pageSize = 50
  const cidades = Array.from(new Set(clientes.map((cliente) => cliente.cidade).filter(Boolean))).sort()
  const vendedoresHistoricos = Array.from(new Set(clientes.map((cliente) => cliente.vendedorHistoricoNome).filter(Boolean))).sort()
  const resumoRows = vendedoresResumo.length > 0
    ? vendedoresResumo
        .filter((row) => row.role === 'vendedor')
        .map((row) => ({
          id: row.vendedorId,
          nome: row.vendedorNome,
          clientes: row.clientes,
          risco: row.clientesRisco,
          tarefasVencidas: row.tarefasVencidas,
          pipeline: row.pipeline,
          contatos: row.contatos,
          cobertura: row.clientes ? Math.round(((row.clientes - row.clientesRisco) / row.clientes) * 100) : 0,
        }))
    : vendedores.map((vendedor) => {
        const carteira = clientes.filter((cliente) => cliente.vendedorId === vendedor.id)
        return {
          id: vendedor.id,
          nome: vendedor.nome,
          clientes: carteira.length,
          risco: carteira.filter((cliente) => daysSince(cliente.ultimaCompraEm) > 180).length,
          tarefasVencidas: tarefas.filter((tarefa) => tarefa.vendedorId === vendedor.id && tarefa.status === 'aberta' && daysSince(tarefa.dataVencimento) > 0).length,
          pipeline: orcamentos.filter((orcamento) => orcamento.vendedorId === vendedor.id).reduce((total, orcamento) => total + orcamento.valorTotal, 0),
          contatos: 0,
          cobertura: carteira.length ? Math.round((carteira.filter((cliente) => daysSince(cliente.ultimoContatoEm) <= 60).length / carteira.length) * 100) : 0,
        }
      })
  const clientesSemVendedor = clientes.filter((cliente) => !cliente.vendedorId)
  const vendedorSugerido = [...resumoRows].sort((a, b) => a.clientes - b.clientes || a.risco - b.risco)[0]
  const statusOptions = Array.from(new Set(clientes.map((cliente) => cliente.status))).sort()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentFilters: ClientePageFilters = {
    filtro: responsavelFilter === 'sem-vendedor' ? 'sem-vendedor' : undefined,
    vendedorId: responsavelFilter !== 'todos' && responsavelFilter !== 'sem-vendedor' ? responsavelFilter : undefined,
    vendedorHistoricoNome: historicoFilter !== 'todos' ? historicoFilter : undefined,
    cidade: cidadeFilter !== 'todas' ? cidadeFilter : undefined,
    origemBase: origemFilter === 'todas' ? 'todos' : origemFilter,
    status: statusFilter,
  }

  useEffect(() => {
    let isMounted = true

    async function loadCarteira() {
      setIsLoading(true)
      setError('')
      try {
        const result = await listClientesPage({
          page,
          pageSize,
          ...currentFilters,
        })
        if (!isMounted) return
        setCarteiraClientes(result.clientes)
        setTotal(result.total)
      } catch (exception) {
        if (isMounted) setError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar a carteira.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadCarteira()

    return () => {
      isMounted = false
    }
  }, [cidadeFilter, historicoFilter, origemFilter, page, responsavelFilter, statusFilter])

  function resetAndSet(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function handleAssign(cliente: Cliente, vendedorId: string) {
    onAssignClient(cliente.id, vendedorId)
    const vendedor = vendedores.find((item) => item.id === vendedorId)
    setCarteiraClientes((current) =>
      responsavelFilter === 'sem-vendedor'
        ? current.filter((item) => item.id !== cliente.id)
        : current.map((item) => item.id === cliente.id ? { ...item, vendedorId, vendedorNome: vendedor?.nome } : item),
    )
  }

  async function assignFiltered() {
    if (!bulkAssignTo || total === 0) return
    setIsBulkAssigning(true)
    setBulkFeedback('')
    setError('')
    try {
      const updated = await onAssignFiltered(currentFilters, bulkAssignTo)
      const vendedor = vendedores.find((item) => item.id === bulkAssignTo)
      setBulkFeedback(`${updated} clientes atribuidos para ${vendedor?.nome ?? 'vendedor selecionado'}.`)
      setCarteiraClientes((current) =>
        responsavelFilter === 'sem-vendedor'
          ? []
          : current.map((cliente) => ({ ...cliente, vendedorId: bulkAssignTo, vendedorNome: vendedor?.nome })),
      )
      setTotal((current) => responsavelFilter === 'sem-vendedor' ? 0 : current)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel redistribuir a carteira filtrada.')
    } finally {
      setIsBulkAssigning(false)
    }
  }

  return (
    <section className="grid-layout">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Gestao de vendedores</h2>
            <p>Carteira atual, risco, tarefas, pipeline e cobertura por responsavel comercial.</p>
          </div>
          <UserRound size={18} />
        </div>
        <div className="table">
          <div className="table-head report">
            <span>Vendedor</span>
            <span>Clientes</span>
            <span>Risco</span>
            <span>Atrasos</span>
            <span>Pipeline</span>
            <span>Contatos</span>
            <span>Cobertura</span>
          </div>
          {resumoRows.map((row) => (
            <div className="table-row report" key={row.id}>
              <span><strong>{row.nome}</strong></span>
              <span>{row.clientes}</span>
              <span>{row.risco}</span>
              <span>{row.tarefasVencidas}</span>
              <span>{money(row.pipeline)}</span>
              <span>{row.contatos}</span>
              <span className="score">{row.cobertura}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Historico ERP</h2>
            <p>Origem comercial importada do sistema operacional, separada do responsavel atual.</p>
          </div>
          <BarChart3 size={18} />
        </div>
        <div className="table">
          <div className="table-head report">
            <span>Historico</span>
            <span>Clientes</span>
            <span>Sem resp.</span>
            <span>Capital</span>
            <span>Sem cadastro</span>
            <span>Risco</span>
            <span>Comprado</span>
          </div>
          {vendedoresHistoricosResumo.slice(0, 8).map((row) => (
            <div className="table-row report" key={`${row.codigo}-${row.nome}`}>
              <span><strong>{row.nome}</strong></span>
              <span>{row.clientes}</span>
              <span>{row.semResponsavel}</span>
              <span>{row.capitalTruck}</span>
              <span>{row.rodobens}</span>
              <span>{row.clientesRisco}</span>
              <span>{money(row.totalComprado)}</span>
            </div>
          ))}
          {vendedoresHistoricosResumo.length === 0 && <div className="empty-state">Sem vendedor historico importado ainda.</div>}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Filtro de carteira</h2>
            <p>Separe responsavel atual de vendedor historico e encontre carteiras para redistribuir.</p>
          </div>
          <Filter size={18} />
        </div>
        <div className="campaign-filter-grid">
          <label>
            Responsavel atual
            <select value={responsavelFilter} onChange={(event) => resetAndSet(setResponsavelFilter, event.target.value)}>
              <option value="todos">Todos</option>
              <option value="sem-vendedor">Sem vendedor</option>
              {vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
            </select>
          </label>
          <label>
            Vendedor historico
            <select value={historicoFilter} onChange={(event) => resetAndSet(setHistoricoFilter, event.target.value)}>
              <option value="todos">Todos</option>
              {vendedoresHistoricos.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
            </select>
          </label>
          <label>
            Cidade
            <select value={cidadeFilter} onChange={(event) => resetAndSet(setCidadeFilter, event.target.value)}>
              <option value="todas">Todas</option>
              {cidades.map((cidade) => <option key={cidade} value={cidade}>{cidade}</option>)}
            </select>
          </label>
          <label>
            Origem
            <select value={origemFilter} onChange={(event) => {
              setOrigemFilter(event.target.value as typeof origemFilter)
              setPage(1)
            }}>
              <option value="todas">Todas</option>
              <option value="capital_truck">Capital Truck</option>
              <option value="rodobens">Clientes sem cadastro</option>
              <option value="desconhecida">Desconhecida</option>
            </select>
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter)
              setPage(1)
            }}>
              <option value="todos">Todos</option>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </div>
        <div className="info-grid campaign-summary">
          <Info label="Filtrados" value={total.toString()} />
          <Info label="Sem vendedor" value={clientesSemVendedor.length.toString()} />
          <Info label="Sugestao" value={vendedorSugerido?.nome ?? 'Sem vendedor'} />
          <Info label="Menor carteira" value={vendedorSugerido ? `${vendedorSugerido.clientes} clientes` : '-'} />
        </div>
        <div className="campaign-save-bar">
          <span>Redistribuir todos os {total} clientes filtrados para um responsavel atual.</span>
          <select className="assign-select" value={bulkAssignTo} onChange={(event) => setBulkAssignTo(event.target.value)}>
            <option value="">Selecionar vendedor</option>
            {vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
          </select>
          <button className="button primary" type="button" disabled={!bulkAssignTo || total === 0 || isBulkAssigning} onClick={assignFiltered}>
            {isBulkAssigning ? 'Atribuindo...' : 'Atribuir filtro'}
          </button>
        </div>
        {bulkFeedback && <div className="readiness ok">{bulkFeedback}</div>}
        {error && <div className="alert">{error}</div>}
        <div className="table">
          <div className="table-head client360-sale">
            <span>Cliente</span>
            <span>Cidade</span>
            <span>Responsavel</span>
            <span>Historico</span>
            <span>Atribuir</span>
          </div>
          {isLoading && <div className="empty-state compact">Carregando carteira filtrada...</div>}
          {!isLoading && carteiraClientes.map((cliente) => (
            <div className="table-row client360-sale" key={cliente.id}>
              <span>
                <strong>{cliente.nome}</strong>
                <small>{origemLabel(cliente.origemBase)} - {cliente.status}</small>
              </span>
              <span>{cliente.cidade}/{cliente.uf}</span>
              <span>{vendedores.find((vendedor) => vendedor.id === cliente.vendedorId)?.nome ?? 'Sem vendedor'}</span>
              <span>{cliente.vendedorHistoricoNome ?? 'Nao informado'}</span>
              <span>
                <select
                  className="assign-select"
                  defaultValue={cliente.vendedorId ?? ''}
                  onChange={(event) => {
                    if (event.target.value && event.target.value !== cliente.vendedorId) handleAssign(cliente, event.target.value)
                  }}
                >
                  <option value="">Selecionar</option>
                  {vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                </select>
              </span>
            </div>
          ))}
          {!isLoading && carteiraClientes.length === 0 && <div className="empty-state">Nenhum cliente encontrado nestes filtros.</div>}
        </div>
        <div className="pagination-bar">
          <span>Pagina {page} de {totalPages} - {total} clientes</span>
          <div className="toolbar-actions">
            <button className="button" type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Anterior
            </button>
            <button className="button" type="button" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Proxima
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

function Usuarios({
  clientes,
  usuarios,
  resumo,
  vendedoresResumo,
  onAssignClient,
}: {
  clientes: Cliente[]
  usuarios: Vendedor[]
  resumo?: DashboardResumo
  vendedoresResumo: VendedorResumo[]
  onAssignClient: (clienteId: string, vendedorId: string) => void
}) {
  const [activeUserId, setActiveUserId] = useState(usuarios[0]?.id ?? seedVendedores[0].id)
  const activeUser = usuarios.find((vendedor) => vendedor.id === activeUserId) ?? usuarios[0] ?? seedVendedores[0]
  const clientesSemVendedor = clientes.filter((cliente) => !cliente.vendedorId)
  const clientesSemVendedorTotal = resumo?.clientesSemVendedor ?? clientesSemVendedor.length
  const vendedores = usuarios.filter((usuario) => usuario.role === 'vendedor')
  const cargaVendedores = vendedores
    .map((vendedor) => {
      const resumoVendedor = vendedoresResumo.find((row) => row.vendedorId === vendedor.id)
      return {
        ...vendedor,
        carteira: resumoVendedor?.clientes ?? clientes.filter((cliente) => cliente.vendedorId === vendedor.id).length,
        risco: resumoVendedor?.clientesRisco ?? clientes.filter((cliente) => cliente.vendedorId === vendedor.id && daysSince(cliente.ultimaCompraEm) > 180).length,
      }
    })
    .sort((a, b) => a.carteira - b.carteira || a.risco - b.risco)
  const vendedorSugerido = cargaVendedores[0]

  return (
    <section className="grid-layout">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Perfis de acesso</h2>
            <p>Base preparada para Supabase Auth, RLS e permissao por carteira.</p>
          </div>
          <ShieldCheck size={18} />
        </div>
        <div className="user-grid">
          {usuarios.map((usuario) => {
            const resumoUsuario = vendedoresResumo.find((row) => row.vendedorId === usuario.id)
            const carteiraTotal = resumoUsuario?.clientes ?? clientes.filter((cliente) => cliente.vendedorId === usuario.id).length

            return (
              <button
                className={activeUserId === usuario.id ? 'user-card active' : 'user-card'}
                key={usuario.id}
                onClick={() => setActiveUserId(usuario.id)}
                type="button"
              >
                <span className="avatar">{usuario.nome.slice(0, 1)}</span>
                <strong>{usuario.nome}</strong>
                <small>{usuario.email}</small>
                <span className="status-pill">{usuario.role}</span>
                <span>{carteiraTotal} clientes na carteira</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Permissoes do perfil</h2>
            <p>{activeUser.nome}</p>
          </div>
          <UserRound size={18} />
        </div>
        <div className="permission-list">
          {permissionsFor(activeUser.role).map((permission) => (
            <div className="permission-row" key={permission.label}>
              <CheckCircle2 size={16} />
              <span>
                <strong>{permission.label}</strong>
                <small>{permission.description}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Carteira atribuida</h2>
            <p>Amostra da pagina atual; totais completos aparecem nos cards.</p>
          </div>
          <UsersRound size={18} />
        </div>
        <div className="status-list">
          {clientes
            .filter((cliente) => cliente.vendedorId === activeUser.id)
            .map((cliente) => (
              <div className="status-row" key={cliente.id}>
                <span>{cliente.nome}</span>
                <strong>{cliente.status}</strong>
              </div>
            ))}
          {clientes.filter((cliente) => cliente.vendedorId === activeUser.id).length === 0 && (
            <div className="status-row">
              <span>Nenhum cliente atribuido</span>
              <strong>0</strong>
            </div>
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Distribuicao pendente</h2>
            <p>{clientesSemVendedorTotal} clientes sem responsavel comercial.</p>
          </div>
          <ClipboardList size={18} />
        </div>
        <div className="assignment-advice">
          <div>
            <strong>{vendedorSugerido ? `Sugerido: ${vendedorSugerido.nome}` : 'Sem vendedor disponivel'}</strong>
            <span>
              {vendedorSugerido
                ? `${vendedorSugerido.carteira} clientes na carteira e ${vendedorSugerido.risco} em risco.`
                : 'Cadastre um vendedor antes de distribuir clientes.'}
            </span>
          </div>
          <div className="status-list compact-status">
            {cargaVendedores.map((vendedor) => (
              <div className="status-row" key={vendedor.id}>
                <span>{vendedor.nome}</span>
                <strong>{vendedor.carteira} carteira</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="table">
          <div className="table-head assign">
            <span>Cliente</span>
            <span>Cidade</span>
            <span>Tipo</span>
            <span>Vendedor</span>
          </div>
          {clientesSemVendedor.map((cliente) => (
            <div className="table-row assign" key={cliente.id}>
              <span><strong>{cliente.nome}</strong></span>
              <span>{cliente.cidade}/{cliente.uf}</span>
              <span>{cliente.tipoCliente}</span>
              <span>
                <select
                  className="assign-select"
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) onAssignClient(cliente.id, event.target.value)
                  }}
                >
                  <option value="">Selecionar</option>
                  {usuarios
                    .filter((vendedor) => vendedor.role === 'vendedor')
                    .map((vendedor) => (
                      <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>
                    ))}
                </select>
              </span>
            </div>
          ))}
          {clientesSemVendedor.length === 0 && (
            <div className="empty-state">Todos os clientes demonstrativos ja possuem vendedor responsavel.</div>
          )}
        </div>
      </section>
    </section>
  )
}

function Auditoria({ alteracoes }: { alteracoes: ClienteAlteracao[] }) {
  const [field, setField] = useState('todos')
  const fields = ['todos', ...Array.from(new Set(alteracoes.map((alteracao) => alteracao.campo)))]
  const filtered = field === 'todos' ? alteracoes : alteracoes.filter((alteracao) => alteracao.campo === field)

  return (
    <section className="grid-layout">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Alteracoes sensiveis</h2>
            <p>Telefone, WhatsApp, responsavel, vendedor e status ficam registrados para LGPD e gestao.</p>
          </div>
          <select className="assign-select audit-filter" value={field} onChange={(event) => setField(event.target.value)}>
            {fields.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="table">
          <div className="table-head audit">
            <span>Data</span>
            <span>Cliente</span>
            <span>Campo</span>
            <span>Antes</span>
            <span>Depois</span>
            <span>Usuario</span>
          </div>
          {filtered.map((alteracao) => (
            <div className="table-row audit" key={alteracao.id}>
              <span>{dateLabel(alteracao.criadoEm)}</span>
              <span><strong>{alteracao.clienteNome}</strong><small>{alteracao.origem}</small></span>
              <span>{alteracao.campo}</span>
              <span>{alteracao.valorAnterior || 'Vazio'}</span>
              <span>{alteracao.valorNovo || 'Vazio'}</span>
              <span>{alteracao.usuarioNome}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function permissionsFor(role: string) {
  if (role === 'admin') {
    return [
      { label: 'Ver todos os clientes', description: 'Acesso gerencial a toda a base.' },
      { label: 'Importar arquivos', description: 'Pode registrar XML, planilha semanal e conflitos.' },
      { label: 'Distribuir carteira', description: 'Pode alterar vendedor responsavel.' },
      { label: 'Gerenciar campanhas', description: 'Pode criar campanhas e acompanhar envios.' },
    ]
  }

  return [
    { label: 'Ver propria carteira', description: 'Acesso limitado aos clientes atribuidos.' },
    { label: 'Registrar contatos', description: 'Pode criar interacoes e proximas acoes.' },
    { label: 'Criar orcamentos', description: 'Pode abrir e atualizar os proprios orcamentos.' },
    { label: 'Usar WhatsApp', description: 'Pode abrir mensagens personalizadas via wa.me.' },
  ]
}

function PriorityTable({
  clientes,
  onSelect,
  showActions,
}: {
  clientes: Array<Cliente & { score?: number; motivo?: string; proximaMelhorAcao?: string }>
  onSelect?: (cliente: Cliente) => void
  showActions?: boolean
}) {
  return (
    <div className="table">
      <div className="table-head priority">
        <span>Cliente</span>
        <span>Motivo</span>
        <span>Proxima acao</span>
        <span>Score</span>
        {showActions && <span>Acoes</span>}
      </div>
      {clientes.map((cliente) => (
        <div className="table-row priority" key={cliente.id}>
          <span>
            <strong>{cliente.nome}</strong>
            <small>{cliente.cidade}/{cliente.uf} · {cliente.produtoPrincipal ?? 'Sem produto principal'}</small>
          </span>
          <span>{cliente.motivo ?? opportunityReason(cliente, cliente.score ?? 0)}</span>
          <span>{cliente.proximaMelhorAcao ?? bestNextAction(cliente)}</span>
          <span className="score">{cliente.score ?? 0}</span>
          {showActions && (
            <span className="row-actions">
              <button type="button" title="Abrir ficha" onClick={() => onSelect?.(cliente)}><UserRound size={16} /></button>
              <a title="WhatsApp" href={cliente.whatsapp ? `https://wa.me/${cliente.whatsapp}` : '#'}><MessageCircle size={16} /></a>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound
  label: string
  value: string
  tone: string
}) {
  return (
    <section className={`metric ${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
