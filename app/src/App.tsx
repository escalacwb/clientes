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
import { lazy, type FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import './App.css'
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
  createCampanhaSalva,
  listClienteCampanhaEnvios,
  listCampanhaSegmento,
  listCampanhasResumo,
  listCampanhasSalvas,
  upsertCampanhaEnvio,
  type CampanhaPublicoFiltros,
  type CampanhaResumo,
  type CampanhaSalva,
  type CampanhaSegmentoId,
  attributeCampanhaRevenueByOrcamento,
} from './repositories/campanhasRepository'
import {
  listCatalogoItens,
  listCatalogoPage,
  listCatalogoPrecos,
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
  listAtividadesDia,
  listFunilGerencial,
  listMotivosPerda,
  listRankingMedidas,
  listRankingServicos,
  listVendedoresResumo,
  type DashboardResumo,
  type AtividadeDiaResumo,
  type FunilGerencialResumo,
  type MotivoPerdaResumo,
  type RankingResumo,
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
  type TarefaOriginFilter,
  type TarefaStatusFilter,
} from './repositories/tarefasRepository'
import { listUsuarios } from './repositories/usuariosRepository'
import type {
  CampanhaEnvioStatus,
  CampanhaEnvio,
  CarteiraFiltro,
  CatalogoItem,
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

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'clientes', label: 'Clientes', icon: UsersRound },
  { id: 'rodobens', label: 'Inbox Rodobens', icon: UserCheck },
  { id: 'carteira', label: 'Minha carteira', icon: ClipboardList },
  { id: 'oportunidades', label: 'Oportunidades', icon: AlertTriangle },
  { id: 'tarefas', label: 'Tarefas', icon: CalendarClock },
  { id: 'importacoes', label: 'Importacoes', icon: FileUp },
  { id: 'conflitos', label: 'Conflitos', icon: AlertTriangle },
  { id: 'mesclagem', label: 'Mesclagem', icon: UsersRound },
  { id: 'campanhas', label: 'Campanhas', icon: Send },
  { id: 'orcamentos', label: 'Orcamentos', icon: WalletCards },
  { id: 'catalogo', label: 'Catalogo', icon: ClipboardList },
  { id: 'relatorios', label: 'Relatorios', icon: BarChart3 },
  { id: 'vendedores', label: 'Vendedores', icon: UserRound },
  { id: 'usuarios', label: 'Usuarios', icon: ShieldCheck },
  { id: 'auditoria', label: 'Auditoria', icon: CheckCircle2 },
]

const adminOnlyViews = new Set(['importacoes', 'conflitos', 'mesclagem', 'relatorios', 'vendedores', 'usuarios', 'auditoria'])

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

type QuoteOriginContext =
  | { kind: 'campanha'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }
  | { kind: 'tarefa'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }
  | { kind: 'cliente'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }

function App() {
  const clientePageSize = 50
  const [session, setSession] = useState<SessaoUsuario | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [view, setView] = useState(() => localStorage.getItem('capital-crm:last-view') ?? 'dashboard')
  const [clientes, setClientes] = useState<Cliente[]>(isSupabaseConfigured ? [] : seedClientes)
  const [clientesTotal, setClientesTotal] = useState(isSupabaseConfigured ? 0 : seedClientes.length)
  const [clientesPage, setClientesPage] = useState(1)
  const [selectedClientId, setSelectedClientId] = useState(isSupabaseConfigured ? '' : seedClientes[0].id)
  const [query, setQuery] = useState('')
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
  const [rodobensLeads, setRodobensLeads] = useState<Cliente[]>([])
  const [rodobensTotal, setRodobensTotal] = useState(0)
  const [rodobensFunil, setRodobensFunil] = useState<RodobensFunilResumo[]>([])
  const [rodobensPage, setRodobensPage] = useState(1)
  const [rodobensQuery, setRodobensQuery] = useState('')
  const [rodobensStatusFilter, setRodobensStatusFilter] = useState<LeadQualificacaoStatus | 'todos'>('todos')
  const [isLoadingRodobens, setIsLoadingRodobens] = useState(false)
  const [quoteSourceView, setQuoteSourceView] = useState('clientes')
  const [quoteOriginContext, setQuoteOriginContext] = useState<QuoteOriginContext>({ kind: 'cliente', label: 'Ficha do cliente' })
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
    localStorage.setItem('capital-crm:last-view', view)
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
          loadedDashboardResumo,
          loadedVendedoresResumo,
          loadedVendedoresHistoricosResumo,
          loadedRankingMedidas,
          loadedRankingServicos,
          loadedFunilGerencial,
          loadedMotivosPerda,
          loadedAtividadesDia,
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
          getDashboardResumo(),
          listVendedoresResumo(),
          listVendedoresHistoricosResumo(),
          listRankingMedidas(),
          listRankingServicos(),
          listFunilGerencial(),
          listMotivosPerda(),
          listAtividadesDia(),
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
        setDashboardResumo(loadedDashboardResumo)
        setVendedoresResumo(loadedVendedoresResumo)
        setVendedoresHistoricosResumo(loadedVendedoresHistoricosResumo)
        setRankingMedidas(loadedRankingMedidas)
        setRankingServicos(loadedRankingServicos)
        setFunilGerencial(loadedFunilGerencial)
        setMotivosPerda(loadedMotivosPerda)
        setAtividadesDia(loadedAtividadesDia)
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
        if (isMounted) setModuleError('rodobens', exception instanceof Error ? exception.message : 'Nao foi possivel carregar Inbox Rodobens.')
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
      setView(nextSession.role === 'admin' ? 'dashboard' : 'carteira')
    }} />
  }

  if (isSupabaseConfigured && (isLoadingData || isLoadingClientes) && clientes.length === 0) {
    return (
      <main className="login-screen">
        <section className="login-panel">
          <div className="brand login-brand">
            <div className="brand-mark">
              <Truck size={22} />
            </div>
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

  const visibleNav = nav.filter((item) => session.role === 'admin' || !adminOnlyViews.has(item.id))
  const canUseScopedClientViews = session.role === 'admin' || isSupabaseConfigured || scopedClientes.length > 0

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Truck size={22} />
          </div>
          <div>
            <strong>Capital Truck CRM</strong>
            <span>Central de carteira</span>
          </div>
        </div>

        <nav className="nav">
          {visibleNav.map((item) => {
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
          <div>
            <p className="eyebrow">MVP operacional</p>
            <h1>{titleFor(view)}</h1>
          </div>
          <div className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setClientesPage(1)
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
            catalogo={catalogo}
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
                vendedorId: created.vendedorId ?? selectedClient.vendedorId ?? 'u-1',
                canal: 'WhatsApp',
                tipo: 'orcamento',
                resumo: `${created.observacao || `Orcamento criado no valor de ${money(created.valorTotal)}.`} Origem: ${quoteOriginContext.label}.`,
                resultado: 'pediu orcamento',
              })
              setInteracoes((current) => [interacao, ...current])
              return created
            }}
          />
        )}
        {canUseScopedClientViews && view === 'rodobens' && (
          <RodobensInbox
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
        {canUseScopedClientViews && view === 'orcamentos' && (
          <Orcamentos
            clientes={scopedClientes}
            orcamentos={orcamentos}
            usuarios={usuarios}
            currentUser={session}
            catalogo={catalogo}
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
            interacoes={interacoes}
            orcamentos={orcamentos}
            importacoes={importacoes}
            conflitos={conflitos}
            usuarios={usuarios}
            tarefas={tarefas}
            oportunidades={oportunidades}
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
    dashboard: 'Painel comercial',
    clientes: 'Base unica de clientes',
    rodobens: 'Inbox Rodobens',
    'orcamento-editor': 'Editor de proposta',
    carteira: 'Fila diaria do vendedor',
    oportunidades: 'Oportunidades automaticas',
    tarefas: 'Tarefas e proximas acoes',
    importacoes: 'Controle de importacoes',
    conflitos: 'Conflitos de importacao',
    mesclagem: 'Mesclagem de clientes',
    campanhas: 'Campanhas WhatsApp',
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
          <div className="brand-mark">
            <Truck size={22} />
          </div>
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
      title: 'Qualificar Rodobens',
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
}: {
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
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const [statusMessage, setStatusMessage] = useState('')
  const statusTotals = new Map(funil.map((item) => [item.status, item]))

  async function registerFirstContact(cliente: Cliente) {
    await onAddInteraction({
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId ?? 'u-1',
      canal: 'WhatsApp',
      tipo: 'primeiro contato rodobens',
      resumo: 'Primeiro contato iniciado pela Inbox Rodobens.',
      resultado: 'WhatsApp aberto',
    })
    await onCreateTask({
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId,
      titulo: 'Follow-up Rodobens',
      descricao: 'Retornar cliente abordado pela Inbox Rodobens.',
      dataVencimento: new Date().toISOString().slice(0, 10),
      prioridade: 80,
      origem: 'rodobens',
    })
    await onUpdateQualificacao(cliente, 'contatado', 'Primeiro contato iniciado pela Inbox Rodobens.')
    setStatusMessage(`Contato registrado para ${cliente.nome}.`)
  }

  async function updateLead(cliente: Cliente, status: LeadQualificacaoStatus) {
    const observacao = rodobensQualificacaoLabel(status)
    await onUpdateQualificacao(cliente, status, observacao)
    setStatusMessage(`${cliente.nome}: ${observacao}.`)
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Inbox Rodobens</h2>
          <p>Fila de primeiro contato para clientes identificados com origem Rodobens.</p>
        </div>
        <div className="toolbar-actions">
          <label className="search compact-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar lead Rodobens"
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
          <span className="status-pill">{total} leads</span>
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
      {statusMessage && <div className="readiness ok">{statusMessage}</div>}
      {isLoading && <div className="empty-state compact">Carregando leads Rodobens...</div>}
      {!isLoading && leads.length === 0 && (
        <div className="empty-state">
          Nenhum lead Rodobens encontrado na classificacao atual.
        </div>
      )}
      {leads.length > 0 && (
        <div className="table">
          <div className="table-head rodobens-row">
            <span>Cliente</span>
            <span>Origem</span>
            <span>Status</span>
            <span>Contexto</span>
            <span>Acoes</span>
          </div>
          {leads.map((cliente) => {
            const message = `Bom dia, ${cliente.responsavel ?? cliente.nome}. Aqui e da Capital Truck Center. Identifiquei seu cadastro na nossa base Rodobens e gostaria de entender se podemos ajudar com pneus ou servicos.`
            const waUrl = cliente.whatsapp ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(message)}` : undefined

            return (
              <div className="table-row rodobens-row" key={cliente.id}>
                <span>
                  <strong>{cliente.nome}</strong>
                  <small>{cliente.cidade}/{cliente.uf} - {cliente.whatsapp ?? 'Sem WhatsApp'}</small>
                </span>
                <span>
                  <strong>{origemLabel(cliente.origemBase)}</strong>
                  <small>{cliente.origemDetalhe ?? cliente.origem}</small>
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
    rodobens_primeiro_contato: 'Rodobens',
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
}) {
  const [createdTasks, setCreatedTasks] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkVendedorId, setBulkVendedorId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
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
      {isSemVendedor && (
        <div className="bulk-action-bar">
          <label>
            Vendedor responsavel
            <select value={bulkVendedorId} onChange={(event) => setBulkVendedorId(event.target.value)}>
              <option value="">Selecionar vendedor</option>
              {vendedores.map((usuario) => (
                <option value={usuario.id} key={usuario.id}>{usuario.nome}</option>
              ))}
            </select>
          </label>
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
          <button
            className="button primary"
            type="button"
            disabled={selectedIds.length === 0 || !bulkVendedorId || isAssigning}
            onClick={async () => {
              setError('')
              setIsAssigning(true)
              try {
                const clienteIds = selectedIds.map((id) => id.split('-sem_vendedor')[0])
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
        </div>
      )}
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
        <div className={isSemVendedor ? 'table-head opportunity assign-opportunity' : 'table-head opportunity'}>
          {isSemVendedor && <span>Sel.</span>}
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Motivo</span>
          <span>Proxima acao</span>
          <span>Prioridade</span>
          <span>Acoes</span>
        </div>
        {filtered.map((oportunidade) => (
          <div className={isSemVendedor
            ? oportunidade.bloqueada ? 'table-row opportunity assign-opportunity blocked' : 'table-row opportunity assign-opportunity'
            : oportunidade.bloqueada ? 'table-row opportunity blocked' : 'table-row opportunity'
          } key={oportunidade.id}>
            {isSemVendedor && (
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
            )}
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
            <button className="button compact-button" type="button" onClick={() => openPriceHistory(item)}>Historico</button>
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
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [createdSuggestions, setCreatedSuggestions] = useState<string[]>([])
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
      label: 'Rodobens',
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
              <option value="rodobens">Rodobens</option>
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
      <div className="routine-queue">
        <div className="routine-queue-header">
          <div>
            <h2>Fila inteligente</h2>
            <p>Acionamentos sugeridos a partir de orcamentos, Rodobens e clientes em risco.</p>
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
            </span>
            <span>{tarefa.clienteNome}</span>
            <span>{tarefa.vendedorNome ?? 'Sem vendedor'}</span>
            <span>{dateLabel(tarefa.dataVencimento)}</span>
            <span className="score">{tarefa.prioridade}</span>
            <span>
              {tarefa.status === 'aberta' ? (
                <button className="button primary" onClick={() => onComplete(tarefa.id)} type="button">
                  Concluir
                </button>
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
        titulo: 'Primeiro contato Rodobens',
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
  const quoteMessage = buildQuoteMessage(cliente, validBudgetItems, budgetForm.validade, budgetForm.formaPagamento, budgetForm.observacao)
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
      vendedorId: cliente.vendedorId ?? 'u-1',
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
        vendedorId: cliente.vendedorId ?? 'u-1',
        valorTotal: budgetTotal,
        validade: budgetForm.validade,
        previsaoFechamento: budgetForm.previsaoFechamento || undefined,
        formaPagamento: budgetForm.formaPagamento || undefined,
        observacao: budgetForm.observacao || undefined,
        itens: validBudgetItems,
      })

      await onAddInteraction({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? 'u-1',
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
              vendedorId: cliente.vendedorId ?? 'u-1',
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
  catalogo,
  originContext,
  onBack,
  onCreateTask,
  onCreate,
}: {
  cliente: Cliente
  catalogo: CatalogoItem[]
  originContext: QuoteOriginContext
  onBack: () => void
  onCreateTask: (task: TarefaInput) => Promise<Tarefa>
  onCreate: (orcamento: OrcamentoInput) => Promise<Orcamento>
}) {
  const [validade, setValidade] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [previsaoFechamento, setPrevisaoFechamento] = useState('')
  const [paymentMode, setPaymentMode] = useState('A vista')
  const [customPayment, setCustomPayment] = useState('')
  const [paymentAdjustments, setPaymentAdjustments] = useState<Record<string, number>>({
    'A vista': -3,
    '30 dias': 0,
    '30/60 dias': 2,
    '30/60/90 dias': 4,
    Cartao: 5,
  })
  const [observacao, setObservacao] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [items, setItems] = useState<OrcamentoItemInput[]>(() =>
    originContext.initialItems?.length
      ? originContext.initialItems
      : [{ descricao: '', tipo: 'produto' as const, quantidade: 1, valorUnitario: 0, descontoPercentual: 0 }],
  )
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [catalogSuggestions, setCatalogSuggestions] = useState<CatalogoSugestao[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  const filteredCatalog = catalogo
    .filter((item) => {
      const term = catalogSearch.trim().toLowerCase()
      if (!item.ativo) return false
      if (!term) return true
      return `${item.codigo} ${item.descricao} ${item.tipo} ${item.grupo ?? ''} ${item.marca ?? ''}`.toLowerCase().includes(term)
    })
    .slice(0, 120)
  const validItems = items
    .filter((item) => item.descricao.trim() && item.quantidade > 0 && item.valorUnitario > 0)
    .map((item) => ({ ...item, valorTotal: quoteItemTotal(item) }))
  const total = validItems.reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
  const formaPagamento = paymentMode === 'Personalizado' ? customPayment : paymentMode
  const paymentScenarios = quotePaymentScenarios(total, paymentAdjustments)
  const approvalWarnings = quoteApprovalWarnings(validItems, catalogo)
  const quoteMessage = buildQuoteMessage(cliente, validItems, validade, formaPagamento, observacao, paymentScenarios)
  const waUrl = cliente.whatsapp && validItems.length > 0
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(quoteMessage)}`
    : undefined
  const paymentOptions = ['A vista', '30 dias', '30/60 dias', '30/60/90 dias', 'Cartao', 'Personalizado']

  function updateItem(index: number, patch: Partial<OrcamentoItemInput>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
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
        quantidade: 1,
        valorUnitario: catalogoItem.preco,
        descontoPercentual: 0,
      },
    ])
  }

  function applyCatalogItem(index: number, catalogoItemId: string) {
    const selected = catalogo.find((item) => item.id === catalogoItemId)
    if (!selected) {
      updateItem(index, { catalogoItemId: undefined, codigo: undefined })
      setCatalogSuggestions([])
      return
    }
    updateItem(index, {
      catalogoItemId: selected.id,
      codigo: selected.codigo,
      tipo: selected.tipo,
      descricao: selected.descricao,
      valorUnitario: selected.preco,
      descontoPercentual: 0,
    })
    void loadCatalogSuggestions(selected.id)
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
        vendedorId: cliente.vendedorId ?? 'u-1',
        status: needsApproval ? 'aguardando_aprovacao' : shouldSend ? 'enviado' : 'aberto',
        valorTotal: total,
        validade,
        previsaoFechamento: previsaoFechamento || undefined,
        formaPagamento,
        aprovacaoMotivo: needsApproval ? approvalWarnings.join(' ') : undefined,
        observacao: finalObservation,
        itens: validItems,
        versaoMensagem: quoteMessage,
        versaoOrigem: originContext.label,
      })
      await onCreateTask({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId,
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
          <button className="button" type="button" onClick={() => window.print()}>
            Imprimir/PDF
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
            <label>
              Condicao
              <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
                {paymentOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            {paymentMode === 'Personalizado' && (
              <label>
                Condicao personalizada
                <input value={customPayment} onChange={(event) => setCustomPayment(event.target.value)} placeholder="Ex.: 20/40/60 com entrada" />
              </label>
            )}
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
            <button className="button" type="button" onClick={() => setItems((current) => [...current, { descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0, descontoPercentual: 0 }])}>
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
              <strong>Condicoes comparativas</strong>
              <small>Percentual positivo acresce no total; negativo aplica desconto.</small>
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
                <strong>{money(scenario.total)}</strong>
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
          <div className="proposal-preview">
            <div className="proposal-heading">
              <strong>Capital Truck Center</strong>
              <span>Proposta comercial</span>
            </div>
            <div className="proposal-client">
              <strong>{cliente.nome}</strong>
              <span>{cliente.cidade}/{cliente.uf}</span>
              <span>{cliente.whatsapp ?? cliente.telefone ?? 'Contato nao informado'}</span>
            </div>
            <div className="proposal-lines">
              {validItems.map((item, index) => (
                <div key={`${item.descricao}-${index}`}>
                  <span>{index + 1}. {item.quantidade}x {item.descricao}</span>
                  <strong>{money(item.valorTotal ?? 0)}</strong>
                </div>
              ))}
              {validItems.length === 0 && <span className="muted">Adicione itens para montar a proposta.</span>}
            </div>
            <div className="proposal-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <small>Condicao: {formaPagamento || 'Nao informada'} - Validade: {dateLabel(validade)}</small>
            <div className="proposal-conditions">
              {paymentScenarios.map((scenario) => (
                <span key={scenario.label}>{scenario.label}: {money(scenario.total)}</span>
              ))}
            </div>
          </div>
          <label>
            Mensagem WhatsApp
            <textarea readOnly value={quoteMessage} />
          </label>
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

function quoteApprovalWarnings(items: OrcamentoItemInput[], catalogo: CatalogoItem[]) {
  return items.flatMap((item) => {
    const catalogItem = item.catalogoItemId ? catalogo.find((entry) => entry.id === item.catalogoItemId) : undefined
    const maxDiscount = catalogItem?.descontoMaximo
    if (maxDiscount === undefined || maxDiscount === null) return []
    const discount = item.descontoPercentual ?? 0
    if (discount <= maxDiscount) return []
    return [`${item.descricao}: desconto ${discount}% acima do limite ${maxDiscount}%.`]
  })
}

function quotePaymentScenarios(total: number, adjustments: Record<string, number>) {
  return Object.entries(adjustments).map(([label, adjustment]) => ({
    label,
    adjustment,
    total: total * (1 + adjustment / 100),
  }))
}

function buildQuoteMessage(
  cliente: Cliente,
  itens: OrcamentoItemInput[],
  validade?: string,
  formaPagamento?: string,
  observacao?: string,
  paymentScenarios: Array<{ label: string; adjustment: number; total: number }> = [],
) {
  const lines = [
    `Ola, ${cliente.responsavel ?? cliente.nome}. Segue orcamento Capital Truck Center:`,
    '',
    ...itens.map((item, index) => {
      const desconto = item.descontoPercentual ? `, desc. ${item.descontoPercentual}%` : ''
      return `${index + 1}. ${item.quantidade}x ${item.descricao} - ${money(item.valorUnitario)} un.${desconto} = ${money(item.valorTotal ?? 0)}`
    }),
    '',
    `Total: ${money(itens.reduce((total, item) => total + (item.valorTotal ?? 0), 0))}`,
  ]

  if (formaPagamento?.trim()) lines.push(`Condicao: ${formaPagamento.trim()}`)
  if (paymentScenarios.length > 0) {
    lines.push('', 'Condicoes opcionais:')
    paymentScenarios.forEach((scenario) => {
      const suffix = scenario.adjustment === 0 ? '' : ` (${scenario.adjustment > 0 ? '+' : ''}${scenario.adjustment}%)`
      lines.push(`- ${scenario.label}: ${money(scenario.total)}${suffix}`)
    })
  }
  if (validade) lines.push(`Validade: ${dateLabel(validade)}`)
  if (observacao?.trim()) lines.push('', observacao.trim())
  lines.push('', 'Posso confirmar disponibilidade e prazo para voce?')
  return lines.join('\n')
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
  }
}

function origemLabel(origemBase?: Cliente['origemBase']) {
  const labels: Record<NonNullable<Cliente['origemBase']>, string> = {
    capital_truck: 'Capital Truck',
    rodobens: 'Rodobens',
    desconhecida: 'Origem pendente',
  }
  return origemBase ? labels[origemBase] : labels.desconhecida
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

  async function handleCreateTask() {
    setIsCreatingTask(true)
    try {
      await onCreateTask()
      setActiveTab('tarefas')
    } finally {
      setIsCreatingTask(false)
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
        </div>
      </div>

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
              <h2>Timeline</h2>
              <p>{clienteInteracoes.length} interacoes registradas.</p>
            </div>
          </div>
          <div className="timeline">
            {clienteInteracoes.map((interacao) => (
              <div className="timeline-item" key={interacao.id}>
                <CheckCircle2 size={16} />
                <span><strong>{interacao.canal}</strong><small>{interacao.resumo}</small></span>
              </div>
            ))}
            {clienteInteracoes.length === 0 && <div className="empty-state">Sem interacoes.</div>}
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
        ? ` Pos-processamento: ${result.postProcess.clientes_atualizados ?? 0} clientes recalculados e ${result.postProcess.oportunidades_geradas ?? 0} oportunidades na fila.`
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
        `Fechamento reprocessado: ${result.clientes_atualizados ?? 0} clientes recalculados e ${result.oportunidades_geradas ?? 0} oportunidades na fila.`,
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
      {importacoes.map((importacao) => (
        <section className="panel" key={importacao.id}>
          <div className="panel-header">
            <div>
              <h2>{importacao.tipo}</h2>
              <p>{importacao.arquivoNome}</p>
            </div>
            <span className="status-pill">{importacao.status}</span>
          </div>
          <div className="info-grid">
            <Info label="Itens" value={importacao.totalItens.toString()} />
            <Info label="Encontrados" value={importacao.clientesEncontrados.toString()} />
            <Info label="Novos" value={importacao.clientesCriados.toString()} />
            <Info label="Conflitos" value={importacao.conflitos.toString()} />
            <Info label="Criados" value={(importacao.itensCriados ?? 0).toString()} />
            <Info label="Ignorados" value={(importacao.itensIgnorados ?? 0).toString()} />
          </div>
          {arquivosPorImportacao[importacao.id]?.length > 0 && (
            <div className="import-file-list">
              {arquivosPorImportacao[importacao.id].map((arquivo) => (
                <span key={arquivo.id}>
                  <strong>{arquivo.tipo}</strong>
                  {arquivo.arquivoNome} - {arquivo.totalLinhas} linhas
                </span>
              ))}
            </div>
          )}
        </section>
      ))}
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
  onOpenBudgetEditor,
  onAddInteraction,
  onAddTask,
}: {
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
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
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [publicoFiltros, setPublicoFiltros] = useState<CampanhaPublicoFiltros>({})
  const [statuses, setStatuses] = useState<Record<string, CampanhaEnvioStatus>>({})
  const [statusFilter, setStatusFilter] = useState<CampanhaEnvioStatus | 'todos'>('todos')
  const [campaignError, setCampaignError] = useState('')
  const segmento = campanhaSegmentos.find((item) => item.id === segmentoId) ?? campanhaSegmentos[0]
  const activeCampaignResumo = campanhasResumo.find((resumo) => resumo.campanhaId === activeCampanhaId)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const campanhaClientes = clientes
  const nextClient = campanhaClientes
    .filter((cliente) => (statuses[cliente.id] ?? 'pendente') === 'pendente')
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

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setCampaignError('')

    listCampanhaSegmento({ segmentoId, page, pageSize, query, filtros: publicoFiltros, campanhaId: activeCampanhaId })
      .then((result) => {
        if (cancelled) return
        setClientes(result.clientes)
        setTotal(result.total)
        setStatuses(result.statuses)
      })
      .catch((exception) => {
        if (cancelled) return
        setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar o segmento de campanha.')
        setClientes([])
        setTotal(0)
        setStatuses({})
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [segmentoId, page, query, publicoFiltros, activeCampanhaId, campanhasSalvas])

  useEffect(() => {
    Promise.all([listCampanhasSalvas(), listCampanhasResumo()])
      .then(([salvas, resumos]) => {
        setCampanhasSalvas(salvas)
        setCampanhasResumo(resumos)
      })
      .catch((exception) => setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar campanhas salvas.'))
  }, [])

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

  async function markStatus(cliente: Cliente, status: CampanhaEnvioStatus, mensagemFinal: string) {
    setCampaignError('')

    try {
      await upsertCampanhaEnvio({
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
        vendedorId: cliente.vendedorId ?? 'u-1',
        canal: 'Campanha',
        tipo: 'campanha',
        resumo: campaignSummary(status, mensagemFinal),
        resultado: status,
      })
      if (status === 'virou_orcamento') {
        await onAddTask({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId,
          titulo: 'Criar orcamento da campanha',
          descricao: 'Cliente respondeu campanha e deve receber cotacao formal.',
          dataVencimento: new Date().toISOString().slice(0, 10),
          prioridade: 90,
          origem: 'campanha',
        })
      }
      if (status === 'nao_contatar') {
        updateClienteComercial(cliente.id, { status: 'Nao contatar' }).catch((exception) => {
          setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel marcar cliente como nao contatar.')
        })
      }
      setStatuses((current) => ({ ...current, [cliente.id]: status }))
      await refreshCampaignResumo()
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o envio.')
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Campanhas WhatsApp</h2>
          <p>{total} clientes no segmento. Exibindo ate {pageSize} por pagina para nao carregar a base inteira.</p>
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
          <label className="mini-select">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Buscar cliente"
            />
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
          <Send size={18} />
        </div>
      </div>
      <div className="message-template">
        <strong>{segmento.nome}</strong>
        <span>{segmento.descricao}</span>
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
          Produto ou servico comprado
          <input
            value={publicoFiltros.produtoTerm ?? ''}
            onChange={(event) => updatePublicoFiltro('produtoTerm', event.target.value)}
            placeholder="Ex.: 295/80; Michelin; alinhamento"
          />
        </label>
      </div>
      <label className="campaign-message-editor">
        Mensagem da campanha
        <textarea
          value={mensagemModelo}
          onChange={(event) => {
            setMensagemModelo(event.target.value)
            setActiveCampanhaId('')
          }}
          rows={3}
        />
      </label>
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
        </div>
      </div>
      {nextClient && (
        <div className="next-campaign-target">
          <span>
            <strong>Proximo contato sugerido: {nextClient.nome}</strong>
            <small>{nextClient.cidade || 'Cidade nao informada'} · ultima compra {dateLabel(nextClient.ultimaCompraEm)}</small>
          </span>
          <a
            className="button primary"
            href={nextClient.whatsapp ? `https://wa.me/${nextClient.whatsapp}?text=${encodeURIComponent(messageFor(nextClient))}` : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!nextClient.whatsapp}
          >
            <MessageCircle size={16} /> Abrir WhatsApp
          </a>
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
      {campaignError && <div className="alert">{campaignError}</div>}
      {isLoading && <div className="empty-state">Carregando segmento de campanha...</div>}
      {!isLoading && (
      <div className="table">
        <div className="table-head campaign">
          <span>Cliente</span>
          <span>Mensagem</span>
          <span>Status</span>
          <span>Acoes</span>
        </div>
        {filteredClientes.map((cliente) => {
          const finalMessage = messageFor(cliente)
          const waUrl = `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(finalMessage)}`

          return (
            <div className="table-row campaign" key={cliente.id}>
              <span>
                <strong>{cliente.nome}</strong>
                <small>{cliente.whatsapp}</small>
              </span>
              <span>{finalMessage}</span>
              <span className="status-pill">{statuses[cliente.id] ?? 'pendente'}</span>
              <span className="campaign-actions">
                <a
                  className="button"
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} /> Abrir
                </a>
                <button className="button" type="button" onClick={() => markStatus(cliente, 'enviado', finalMessage)}>
                  Enviado
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
                <button className="button" type="button" onClick={() => markStatus(cliente, 'nao_contatar', finalMessage)}>
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

function conversionRate(conversions: number, total: number) {
  if (!total) return 0
  return Math.round((conversions / total) * 100)
}

function numberFromInput(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
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
  page,
  pageSize,
  total,
  statusFilter,
  isLoading,
  onPageChange,
  onStatusFilterChange,
  onRevise,
  onStatusChange,
}: {
  clientes: Cliente[]
  orcamentos: Orcamento[]
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
  catalogo: CatalogoItem[]
  page: number
  pageSize: number
  total: number
  statusFilter: OrcamentoListFilter
  isLoading: boolean
  onPageChange: (page: number) => void
  onStatusFilterChange: (filter: OrcamentoListFilter) => void
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
                <div className="budget-status-actions">
                  {orcamento.status === 'aguardando_aprovacao' && canApprove && (
                    <button className="button primary" type="button" onClick={() => onStatusChange(orcamento.id, 'enviado')}>
                      Aprovar e enviar
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
                  {orcamento.status === 'enviado' && (
                    <button className="button" type="button" onClick={() => onStatusChange(orcamento.id, 'negociando')}>
                      Negociando
                    </button>
                  )}
                  <button className="button" type="button" onClick={() => onStatusChange(orcamento.id, 'enviado')}>
                    Enviado
                  </button>
                  <button className="button" type="button" onClick={() => onStatusChange(orcamento.id, 'ganho')}>
                    Ganho
                  </button>
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
                    Perdido
                  </button>
                  <button className="button" type="button" onClick={() => openVersionHistory(orcamento)}>
                    Versoes
                  </button>
                  <button className="button" type="button" onClick={() => setRevisionTarget(orcamento)}>
                    Revisar
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
  const [validade, setValidade] = useState(orcamento.validade || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [previsaoFechamento, setPrevisaoFechamento] = useState(orcamento.previsaoFechamento ?? '')
  const [formaPagamento, setFormaPagamento] = useState(orcamento.formaPagamento ?? 'A vista')
  const [observacao, setObservacao] = useState(orcamento.observacao ?? '')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [items, setItems] = useState<OrcamentoItemInput[]>(
    orcamento.itens && orcamento.itens.length > 0
      ? orcamento.itens.map((item) => ({
          catalogoItemId: item.catalogoItemId,
          codigo: item.codigo,
          descricao: item.descricao,
          tipo: item.tipo,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          descontoPercentual: item.descontoPercentual ?? 0,
          observacao: item.observacao,
        }))
      : [{ descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0, descontoPercentual: 0 }],
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
  const total = validItems.reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)
  const approvalWarnings = quoteApprovalWarnings(validItems, catalogo)
  const quoteMessage = buildQuoteMessage(cliente, validItems, validade, formaPagamento, observacao)

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
            <label>
              Condicao
              <input value={formaPagamento} onChange={(event) => setFormaPagamento(event.target.value)} />
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
                <strong>{money(quoteItemTotal(item))}</strong>
              </div>
            ))}
          </div>
          <div className="quote-actions">
            <button className="button" type="button" onClick={() => setItems((current) => [...current, { descricao: '', tipo: 'produto', quantidade: 1, valorUnitario: 0, descontoPercentual: 0 }])}>
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
  interacoes,
  orcamentos,
  importacoes,
  conflitos,
  usuarios,
  tarefas,
  oportunidades,
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
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  importacoes: Importacao[]
  conflitos: ImportacaoConflito[]
  usuarios: Vendedor[]
  tarefas: Tarefa[]
  oportunidades: Oportunidade[]
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
      </div>

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
              <span><strong>{row.vendedorNome}</strong><small>{row.leadsRodobens} Rodobens</small></span>
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
            <span>Rodobens</span>
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
              <option value="rodobens">Rodobens</option>
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
