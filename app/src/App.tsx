import {
  Activity,
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
  Settings,
  ShieldCheck,
  Trophy,
  Truck,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
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
  opportunityScoreDetails,
  smartSummary,
} from './lib/crm'
import { previewXmlFiles, type XmlImportPreview } from './lib/xmlImport'
import { previewWorkbookFiles, type WorkbookImportPreview } from './lib/workbookPreview'
import { previewCatalogPriceFiles, previewReferenceImportFiles, type ReferenceImportPreview } from './lib/referenceImportPreview'
import { isSupabaseConfigured } from './lib/supabase'
import { buildOportunidades } from './lib/oportunidades'
import { carteiraFiltros, filterClientes } from './lib/filtros'
import { getCurrentSession, signInWithPassword, signOut } from './repositories/authRepository'
import { listAutomacaoRegras, setAutomacaoRegraAtiva, type AutomacaoRegra } from './repositories/automacoesRepository'
import { analyzeTireInspection, analyzeWhatsAppContact, type TireInspectionAnalysis, type WhatsAppContactAnalysis } from './repositories/aiRepository'
import { listAuditoriaEventos, listClienteAlteracoes, type AuditoriaEvento } from './repositories/auditoriaRepository'
import {
  campanhaSegmentos,
  createCampanhaFromClienteIds,
  createCampanhaSalva,
  deleteCampanha,
  listClienteCampanhaEnvios,
  listCampanhaSegmento,
  listCampanhaInbox,
  listCampanhasResumo,
  listCampanhasSalvas,
  listCampanhasVendedorResumo,
  upsertCampanhaEnvio,
  updateCampanhaSalva,
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
  listCatalogoPriceChanges,
  listCatalogoPrecos,
  listCatalogoRegrasDesconto,
  listCatalogoSugestoes,
  uploadCatalogoImagem,
  upsertCatalogoMidia,
  deleteCatalogoMidia,
  type CatalogoAtivoFilter,
  type CatalogoPrecoHistorico,
  type CatalogoPriceChange,
  type CatalogoSugestao,
  type CatalogoTipoFilter,
} from './repositories/catalogoRepository'
import {
  assignClientesVendedorByFilter,
  countClientesTotal,
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
  listMetasVendedores,
  listAtividadesDia,
  listFunilGerencial,
  listMotivosPerda,
  listRankingMedidas,
  listRankingServicos,
  listTarefasSlaVendedor,
  listVendedoresResumo,
  type DashboardResumo,
  type ForecastVendedorResumo,
  type MetaVendedor,
  type AtividadeDiaResumo,
  type FunilGerencialResumo,
  type MotivoPerdaResumo,
  type RankingResumo,
  type TarefaSlaVendedorResumo,
  type VendedorResumo,
  upsertMetaVendedor,
} from './repositories/dashboardRepository'
import { listClienteServicosItens, listClienteVeiculos, listClienteVendasItens } from './repositories/historicoRepository'
import { createInteracao } from './repositories/interacoesRepository'
import { listInteracoes } from './repositories/interacoesRepository'
import { createImportacaoPreview } from './repositories/importacoesRepository'
import { finalizeImportacaoDiaria } from './repositories/importacoesRepository'
import { getImportacaoQualidadeResumo } from './repositories/importacoesRepository'
import { importCatalogPriceFiles } from './repositories/importacoesRepository'
import { importReferenceFiles } from './repositories/importacoesRepository'
import { listImportacaoArquivos, listImportacaoQualidadeIssues, listImportacaoSaneamentoRegistros, type ImportacaoArquivoResumo, type ImportacaoQualidadeIssue, type ImportacaoQualidadeResumo, type ImportacaoSaneamentoRegistro } from './repositories/importacoesRepository'
import { listImportacoes } from './repositories/importacoesRepository'
import { runFollowupAutomations } from './repositories/importacoesRepository'
import { upsertImportacaoSaneamentoRegistro } from './repositories/importacoesRepository'
import { createMesclagem, listMesclagens, listPossiveisDuplicados } from './repositories/mesclagensRepository'
import { createOrcamento } from './repositories/orcamentosRepository'
import { deleteOrcamento } from './repositories/orcamentosRepository'
import { listOrcamentos } from './repositories/orcamentosRepository'
import { listOrcamentosPage, type OrcamentoListFilter } from './repositories/orcamentosRepository'
import { listOrcamentoAprovacoes } from './repositories/orcamentosRepository'
import { listOrcamentoVersoes } from './repositories/orcamentosRepository'
import { reviseOrcamento } from './repositories/orcamentosRepository'
import { updateOrcamentoFollowup } from './repositories/orcamentosRepository'
import { updateOrcamentoStatus, type PedidoConfirmadoInput } from './repositories/orcamentosRepository'
import { listOportunidadesPage, listOportunidadesResumo, markOportunidadeComTarefa, refreshOportunidadesCache, type OportunidadeFilter, type OportunidadeResumo } from './repositories/oportunidadesRepository'
import {
  allocatePatioServices,
  addPatioBoxServico,
  consultPatioPlate,
  finishPatioBox,
  getClienteContatoRecomendado,
  listPatioAlocacaoVeiculos,
  listPatioAreasPendentes,
  listPatioBoxServicos,
  listClientePatioAtendimentoItens,
  listClientePatioAtendimentos,
  listPatioBoxesPainel,
  listPatioBoxesLivres,
  listPatioCatalogoServicos,
  listPatioConcluidoAtendimentoItens,
  listPatioConcluidos,
  listPatioContatosExportacao,
  listPatioFeedbackPendente,
  listPatioFilaItens,
  listPatioFilaPainel,
  listPatioFuncionarios,
  listPatioRevisaoProativa,
  listPatioRevisaoResultados,
  listPatioRelatorioServicos,
  listPatioVeiculoAtendimentoItens,
  listPatioVeiculoAtendimentos,
  markPatioContatosExportados,
  markPatioFeedbackDone,
  markPatioRevisaoDone,
  notifyPatioBoxFinalized,
  registerPatioEntrada,
  revertPatioVisit,
  searchPatioVeiculos,
  unassignPatioBox,
  updatePatioAtendimentoKm,
  updatePatioAtendimentoItemTipo,
  updatePatioClienteDados,
  updatePatioVeiculoMediaKm,
  updatePatioVeiculoDados,
  type PatioContatoExportacao,
  type PatioRelatorioServico,
  type PatioRevisaoResultado,
} from './repositories/patioRepository'
import { createPipelineFromSuggestion, listPipelineOportunidades, updatePipelineOportunidade, updatePipelineStage } from './repositories/pipelineRepository'
import { escalateStaleCommercialSequences, listDefaultCommercialSequenceSteps, listSequenciaExecucoes, startDefaultCommercialSequence, updateSequenceStep, type SequenciaEtapaConfig } from './repositories/sequenciasRepository'
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
  CatalogoItemMidia,
  CatalogoRegraDesconto,
  Cliente,
  ClienteAlteracao,
  ClienteContatoRecomendado,
  ClienteMesclagem,
  ClienteStatus,
  ClienteVeiculoResumo,
  Importacao,
  ImportacaoConflito,
  Interacao,
  InteracaoInput,
  LeadQualificacaoStatus,
  Orcamento,
  OrcamentoAprovacao,
  OrcamentoCondicaoInput,
  OrcamentoInput,
  OrcamentoItem,
  OrcamentoItemInput,
  OrcamentoVersao,
  Oportunidade,
  OportunidadeEstagio,
  OportunidadePipeline,
  PatioAtendimentoItemResumo,
  PatioAtendimentoResumo,
  PatioAlocacaoVeiculo,
  PatioAreaPendente,
  PatioBox,
  PatioBoxServico,
  PatioCatalogoServico,
  PatioEntradaInput,
  PatioEntradaServicoInput,
  PatioFeedbackPendente,
  PatioFilaPainel,
  PatioFilaItem,
  PatioFuncionario,
  PatioPainelBox,
  PatioRevisaoProativa,
  PatioVeiculoBusca,
  PossivelDuplicado,
  ServicoItem,
  SessaoUsuario,
  SequenciaExecucao,
  Tarefa,
  TarefaInput,
  Vendedor,
  VendaItem,
} from './types'

const SalesChart = lazy(() => import('./components/SalesChart'))

type AppMode = 'patio' | 'crm' | 'gestao'

const navSectionsByMode: Record<AppMode, Array<{ title: string; items: Array<{ id: string; label: string; icon: typeof Gauge }> }>> = {
  patio: [
    {
      title: 'Operacao',
      items: [
        { id: 'patio-entrada', label: 'Cadastro de Servico', icon: Truck },
        { id: 'patio-dados', label: 'Dados de Clientes', icon: UsersRound },
        { id: 'patio-alocacao', label: 'Alocar Servicos', icon: ClipboardList },
        { id: 'patio-fila', label: 'Filas de Servico', icon: BarChart3 },
        { id: 'patio-boxes', label: 'Boxes', icon: Gauge },
        { id: 'patio-concluidos', label: 'Servicos Concluidos', icon: CheckCircle2 },
        { id: 'patio-historico', label: 'Historico placa', icon: Search },
        { id: 'patio-pneus', label: 'Analise de Pneus', icon: Activity },
        { id: 'patio-contatos', label: 'Exportar contatos', icon: FileUp },
      ],
    },
  ],
  crm: [
    {
      title: 'Rotina',
      items: [
        { id: 'cockpit', label: 'Minha rotina', icon: Gauge },
        { id: 'clientes', label: 'Clientes', icon: UsersRound },
        { id: 'oportunidades', label: 'Oportunidades', icon: AlertTriangle },
        { id: 'patio-feedback', label: 'Feedback patio', icon: MessageCircle },
        { id: 'patio-revisao', label: 'Revisao proativa', icon: RefreshCw },
      ],
    },
    {
      title: 'Comercial',
      items: [
        { id: 'campanhas', label: 'Campanhas', icon: Send },
        { id: 'orcamentos', label: 'Propostas', icon: WalletCards },
        { id: 'catalogo', label: 'Catalogo', icon: ClipboardList },
      ],
    },
  ],
  gestao: [
    {
      title: 'Gestao',
      items: [
        { id: 'importacoes', label: 'Importacoes', icon: FileUp },
        { id: 'relatorio-patio', label: 'Relatorio Patio', icon: BarChart3 },
        { id: 'patio-km-medio', label: 'KM medio placa', icon: Gauge },
        { id: 'patio-resultados', label: 'Resultados Patio', icon: Trophy },
        { id: 'vendedores', label: 'Equipe', icon: UserRound },
        { id: 'usuarios', label: 'Usuarios', icon: ShieldCheck },
        { id: 'auditoria', label: 'Auditoria', icon: CheckCircle2 },
      ],
    },
  ],
}

const firstViewByMode: Record<AppMode, string> = {
  patio: 'patio-entrada',
  crm: 'cockpit',
  gestao: 'importacoes',
}

const hiddenViewRedirects: Record<string, string> = {
  dashboard: 'cockpit',
  carteira: 'clientes',
  conflitos: 'importacoes',
  mesclagem: 'importacoes',
  'campanhas-inbox': 'campanhas',
}

const adminOnlyViews = new Set(['importacoes', 'conflitos', 'mesclagem', 'relatorios', 'relatorio-patio', 'patio-km-medio', 'patio-resultados', 'vendedores', 'usuarios', 'auditoria'])
const sellerPrimaryViews = new Set(['cockpit', 'clientes', 'campanhas', 'orcamentos', 'catalogo'])
const mobilePrimaryViews = new Set(['cockpit', 'clientes', 'campanhas', 'orcamentos'])
const mobileAllowedViews = new Set(['cockpit', 'clientes', 'campanhas', 'orcamentos', 'cliente360', 'orcamento-editor', 'orcamento-detalhe'])

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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return matches
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

type QuoteOriginContext =
  | { kind: 'campanha'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }
  | { kind: 'tarefa'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }
  | { kind: 'cliente'; sourceId?: string; label: string; initialItems?: OrcamentoItemInput[] }

function App() {
  const clientePageSize = 50
  const isMobileShell = useMediaQuery('(max-width: 720px)')
  const [session, setSession] = useState<SessaoUsuario | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [view, setView] = useState(() => normalizeView(localStorage.getItem('capital-crm:last-view') ?? 'cockpit'))
  const [appMode, setAppMode] = useState<AppMode>(() => (localStorage.getItem('capital-crm:mode') as AppMode | null) ?? 'crm')
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
  const [auditoriaEventos, setAuditoriaEventos] = useState<AuditoriaEvento[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>(isSupabaseConfigured ? [] : seedTarefas)
  const [tarefasTotal, setTarefasTotal] = useState(isSupabaseConfigured ? 0 : seedTarefas.length)
  const [tarefasPage, setTarefasPage] = useState(1)
  const [tarefasStatusFilter, setTarefasStatusFilter] = useState<TarefaStatusFilter>('abertas')
  const [tarefasOriginFilter, setTarefasOriginFilter] = useState<TarefaOriginFilter>('todas')
  const [tarefasOwnerFilter, setTarefasOwnerFilter] = useState('todos')
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [oportunidadesTotal, setOportunidadesTotal] = useState(0)
  const [oportunidadesResumo, setOportunidadesResumo] = useState<OportunidadeResumo[]>([])
  const [pipelineOportunidades, setPipelineOportunidades] = useState<OportunidadePipeline[]>([])
  const [oportunidadesPage, setOportunidadesPage] = useState(1)
  const [oportunidadesFilter, setOportunidadesFilter] = useState<OportunidadeFilter>('ativas')
  const [oportunidadesTipoFilter, setOportunidadesTipoFilter] = useState('todos')
  const [oportunidadesRefreshKey, setOportunidadesRefreshKey] = useState(0)
  const [vendasItens, setVendasItens] = useState<VendaItem[]>(isSupabaseConfigured ? [] : seedVendasItens)
  const [servicosItens, setServicosItens] = useState<ServicoItem[]>(isSupabaseConfigured ? [] : seedServicosItens)
  const [clienteVeiculos, setClienteVeiculos] = useState<ClienteVeiculoResumo[]>([])
  const [clienteTarefas, setClienteTarefas] = useState<Tarefa[]>([])
  const [clienteCampanhas, setClienteCampanhas] = useState<CampanhaEnvio[]>([])
  const [clienteContatoRecomendado, setClienteContatoRecomendado] = useState<ClienteContatoRecomendado | undefined>()
  const [clientePatioAtendimentos, setClientePatioAtendimentos] = useState<PatioAtendimentoResumo[]>([])
  const [clientePatioItens, setClientePatioItens] = useState<PatioAtendimentoItemResumo[]>([])
  const [patioFeedbackItems, setPatioFeedbackItems] = useState<PatioFeedbackPendente[]>([])
  const [patioFeedbackTotal, setPatioFeedbackTotal] = useState(0)
  const [patioFeedbackPage, setPatioFeedbackPage] = useState(1)
  const [patioFeedbackQuery, setPatioFeedbackQuery] = useState('')
  const [patioFeedbackRefreshKey, setPatioFeedbackRefreshKey] = useState(0)
  const [isLoadingPatioFeedback, setIsLoadingPatioFeedback] = useState(false)
  const [patioEntradaQuery, setPatioEntradaQuery] = useState('')
  const [patioEntradaResults, setPatioEntradaResults] = useState<PatioVeiculoBusca[]>([])
  const [isLoadingPatioEntrada, setIsLoadingPatioEntrada] = useState(false)
  const [patioAlocacaoVeiculos, setPatioAlocacaoVeiculos] = useState<PatioAlocacaoVeiculo[]>([])
  const [patioAreasPendentes, setPatioAreasPendentes] = useState<PatioAreaPendente[]>([])
  const [patioFuncionarios, setPatioFuncionarios] = useState<PatioFuncionario[]>([])
  const [patioBoxesLivres, setPatioBoxesLivres] = useState<PatioBox[]>([])
  const [isLoadingPatioAlocacao, setIsLoadingPatioAlocacao] = useState(false)
  const [patioFilaItems, setPatioFilaItems] = useState<PatioFilaItem[]>([])
  const [patioFilaTotal, setPatioFilaTotal] = useState(0)
  const [patioFilaPage, setPatioFilaPage] = useState(1)
  const [patioFilaQuery, setPatioFilaQuery] = useState('')
  const [patioFilaArea, setPatioFilaArea] = useState<PatioFilaItem['area'] | 'todas'>('todas')
  const [isLoadingPatioFila, setIsLoadingPatioFila] = useState(false)
  const [patioFilaLastUpdated, setPatioFilaLastUpdated] = useState('')
  const [patioPainelBoxes, setPatioPainelBoxes] = useState<PatioPainelBox[]>([])
  const [patioPainelFila, setPatioPainelFila] = useState<PatioFilaPainel[]>([])
  const [patioBoxesAtivos, setPatioBoxesAtivos] = useState<PatioPainelBox[]>([])
  const [isLoadingPatioBoxes, setIsLoadingPatioBoxes] = useState(false)
  const [patioCatalogoServicos, setPatioCatalogoServicos] = useState<PatioCatalogoServico[]>([])
  const [patioConcluidos, setPatioConcluidos] = useState<PatioAtendimentoResumo[]>([])
  const [patioConcluidosTotal, setPatioConcluidosTotal] = useState(0)
  const [patioConcluidosPage, setPatioConcluidosPage] = useState(1)
  const [patioConcluidosQuery, setPatioConcluidosQuery] = useState('')
  const [patioConcluidosStartDate, setPatioConcluidosStartDate] = useState(() => addDays(new Date().toISOString().slice(0, 10), -30))
  const [patioConcluidosEndDate, setPatioConcluidosEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [patioConcluidosItens, setPatioConcluidosItens] = useState<PatioAtendimentoItemResumo[]>([])
  const [isLoadingPatioConcluidos, setIsLoadingPatioConcluidos] = useState(false)
  const [patioRevisaoItems, setPatioRevisaoItems] = useState<PatioRevisaoProativa[]>([])
  const [patioRevisaoTotal, setPatioRevisaoTotal] = useState(0)
  const [patioRevisaoPage, setPatioRevisaoPage] = useState(1)
  const [patioRevisaoQuery, setPatioRevisaoQuery] = useState('')
  const [patioRevisaoMode, setPatioRevisaoMode] = useState<'km' | 'tempo'>('km')
  const [patioRevisaoKmMin, setPatioRevisaoKmMin] = useState(20000)
  const [patioRevisaoDiasMin, setPatioRevisaoDiasMin] = useState(180)
  const [isLoadingPatioRevisao, setIsLoadingPatioRevisao] = useState(false)
  const [patioRevisaoRefreshKey, setPatioRevisaoRefreshKey] = useState(0)
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
  const [metasVendedores, setMetasVendedores] = useState<MetaVendedor[]>([])
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
  const [quoteSearchRequestKey, setQuoteSearchRequestKey] = useState(0)
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
    if (session?.role !== 'admin' && appMode === 'gestao') {
      setAppMode('crm')
      localStorage.setItem('capital-crm:mode', 'crm')
      setView('cockpit')
      return
    }
    if (isMobileShell && session?.role !== 'admin' && appMode !== 'crm') {
      setAppMode('crm')
      localStorage.setItem('capital-crm:mode', 'crm')
      setView('cockpit')
      return
    }
    if (isMobileShell && session && appMode === 'crm' && !mobileAllowedViews.has(nextView)) {
      setView('cockpit')
      return
    }
    localStorage.setItem('capital-crm:last-view', nextView)
  }, [appMode, isMobileShell, session, view])

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
        const needsDashboardResumo = ['dashboard', 'relatorios', 'usuarios'].includes(view)
        const needsVendedorHistorico = ['relatorios', 'vendedores'].includes(view)
        const needsRelatorioGerencial = view === 'relatorios'
        const results = await Promise.allSettled([
          listInteracoes(),
          listOrcamentos(),
          listImportacoes(),
          listConflitos(),
          listUsuarios(),
          listClienteAlteracoes(),
          listAuditoriaEventos(),
          listTarefas(),
          listPossiveisDuplicados(),
          listMesclagens(),
          listCatalogoItens(),
          listCatalogoRegrasDesconto(),
          needsDashboardResumo ? getDashboardResumo() : Promise.resolve(dashboardResumo),
          listVendedoresResumo(),
          needsVendedorHistorico ? listVendedoresHistoricosResumo() : Promise.resolve(vendedoresHistoricosResumo),
          needsRelatorioGerencial ? listRankingMedidas() : Promise.resolve(rankingMedidas),
          needsRelatorioGerencial ? listRankingServicos() : Promise.resolve(rankingServicos),
          needsRelatorioGerencial ? listFunilGerencial() : Promise.resolve(funilGerencial),
          needsRelatorioGerencial ? listMotivosPerda() : Promise.resolve(motivosPerda),
          needsRelatorioGerencial ? listAtividadesDia() : Promise.resolve(atividadesDia),
          needsRelatorioGerencial ? listForecastVendedor() : Promise.resolve(forecastVendedor),
          needsRelatorioGerencial ? listMetasVendedores() : Promise.resolve(metasVendedores),
        ])
        const rejected = results.find((result) => result.status === 'rejected')
        const valueAt = <T,>(index: number, fallback: T): T => {
          const result = results[index]
          return result?.status === 'fulfilled' ? result.value as T : fallback
        }

        const loadedInteracoes = valueAt(0, interacoes)
        const loadedOrcamentos = valueAt(1, orcamentos)
        const loadedImportacoes = valueAt(2, importacoes)
        const loadedConflitos = valueAt(3, conflitos)
        const loadedUsuarios = valueAt(4, usuarios.length ? usuarios : authUsuarios)
        const loadedAlteracoes = valueAt(5, alteracoes)
        const loadedAuditoriaEventos = valueAt(6, auditoriaEventos)
        const loadedTarefas = valueAt(7, tarefas)
        const loadedPossiveisDuplicados = valueAt(8, possiveisDuplicados)
        const loadedMesclagens = valueAt(9, mesclagens)
        const loadedCatalogo = valueAt(10, catalogo)
        const loadedCatalogoRegrasDesconto = valueAt(11, catalogoRegrasDesconto)
        const loadedDashboardResumo = valueAt(12, dashboardResumo)
        const loadedVendedoresResumo = valueAt(13, vendedoresResumo)
        const loadedVendedoresHistoricosResumo = valueAt(14, vendedoresHistoricosResumo)
        const loadedRankingMedidas = valueAt(15, rankingMedidas)
        const loadedRankingServicos = valueAt(16, rankingServicos)
        const loadedFunilGerencial = valueAt(17, funilGerencial)
        const loadedMotivosPerda = valueAt(18, motivosPerda)
        const loadedAtividadesDia = valueAt(19, atividadesDia)
        const loadedForecastVendedor = valueAt(20, forecastVendedor)
        const loadedMetasVendedores = valueAt(21, metasVendedores)

        if (!isMounted) return
        setInteracoes(loadedInteracoes)
        setOrcamentos(loadedOrcamentos)
        setImportacoes(loadedImportacoes)
        setConflitos(loadedConflitos)
        setUsuarios(loadedUsuarios)
        setAlteracoes(loadedAlteracoes)
        setAuditoriaEventos(loadedAuditoriaEventos)
        setTarefas(loadedTarefas)
        setPossiveisDuplicados(loadedPossiveisDuplicados)
        setMesclagens(loadedMesclagens)
        setCatalogo(loadedCatalogo)
        setCatalogoRegrasDesconto(loadedCatalogoRegrasDesconto)
        setDashboardResumo(loadedDashboardResumo)
        if (loadedDashboardResumo?.clientesTotal && !query.trim() && clienteFiltro === 'todos') {
          setClientesTotal(loadedDashboardResumo.clientesTotal)
        }
        setVendedoresResumo(loadedVendedoresResumo)
        setVendedoresHistoricosResumo(loadedVendedoresHistoricosResumo)
        setRankingMedidas(loadedRankingMedidas)
        setRankingServicos(loadedRankingServicos)
        setFunilGerencial(loadedFunilGerencial)
        setMotivosPerda(loadedMotivosPerda)
        setAtividadesDia(loadedAtividadesDia)
        setForecastVendedor(loadedForecastVendedor)
        setMetasVendedores(loadedMetasVendedores)
        if (rejected) {
          setModuleError('dashboard', rejected.reason instanceof Error ? rejected.reason.message : 'Alguns indicadores nao carregaram agora.')
        }
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
  }, [isCheckingSession, session, view])

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

    async function loadExactClientesTotal() {
      if (isCheckingSession || !session || query.trim() || clienteFiltro !== 'todos') return

      try {
        const total = await countClientesTotal({
          vendedorId: session.role === 'vendedor' ? session.id : undefined,
        })
        if (isMounted) setClientesTotal(total)
      } catch {
        // A lista ja usa contagem estimada; se a contagem exata falhar, mantemos a tela responsiva.
      }
    }

    void loadExactClientesTotal()

    return () => {
      isMounted = false
    }
  }, [clienteFiltro, isCheckingSession, query, session])

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
          listCampanhaInbox({ statuses: ['respondeu', 'virou_orcamento', 'enviado'], vendedorId, limit: 12 }),
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
        if (isMounted) setModuleError('orcamentos', exception instanceof Error ? exception.message : 'Nao foi possivel carregar as propostas.')
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

    async function loadPatioCatalogo() {
      if (isCheckingSession || !session || appMode !== 'patio') return
      if (!['patio-entrada', 'patio-boxes'].includes(view)) return

      try {
        const rows = await listPatioCatalogoServicos()
        if (isMounted) setPatioCatalogoServicos(rows)
      } catch (exception) {
        if (isMounted) setModuleError(view, exception instanceof Error ? exception.message : 'Nao foi possivel carregar catalogo do patio.')
      }
    }

    void loadPatioCatalogo()
    return () => {
      isMounted = false
    }
  }, [appMode, isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioEntrada() {
      if (isCheckingSession || !session || !['patio-entrada', 'patio-historico', 'patio-dados', 'patio-km-medio'].includes(view)) return
      if (patioEntradaQuery.trim().length < 2) {
        setPatioEntradaResults([])
        return
      }

      setIsLoadingPatioEntrada(true)
      try {
        const rows = await searchPatioVeiculos(patioEntradaQuery)
        if (!isMounted) return
        setPatioEntradaResults(rows)
        clearModuleError('patio-entrada')
      } catch (exception) {
        if (isMounted) setModuleError('patio-entrada', exception instanceof Error ? exception.message : 'Nao foi possivel buscar placa no patio.')
      } finally {
        if (isMounted) setIsLoadingPatioEntrada(false)
      }
    }

    const handle = window.setTimeout(loadPatioEntrada, 250)
    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [isCheckingSession, patioEntradaQuery, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioFila(silent = false) {
      if (isCheckingSession || !session || view !== 'patio-fila') return

      if (!silent) setIsLoadingPatioFila(true)
      try {
        const result = await listPatioFilaItens({
          page: patioFilaPage,
          pageSize: 50,
          query: patioFilaQuery,
          area: patioFilaArea,
        })
        const [boxesPainel, filaPainel] = await Promise.all([
          listPatioBoxesPainel(),
          listPatioFilaPainel(),
        ])
        if (!isMounted) return
        setPatioFilaItems(result.items)
        setPatioFilaTotal(result.total)
        setPatioPainelBoxes(boxesPainel)
        setPatioPainelFila(filaPainel)
        setPatioFilaLastUpdated(new Date().toISOString())
        clearModuleError('patio-fila')
      } catch (exception) {
        if (isMounted) setModuleError('patio-fila', exception instanceof Error ? exception.message : 'Nao foi possivel carregar a fila do patio.')
      } finally {
        if (isMounted && !silent) setIsLoadingPatioFila(false)
      }
    }

    const handle = window.setTimeout(() => void loadPatioFila(false), patioFilaQuery.trim() ? 250 : 0)
    const interval = view === 'patio-fila' ? window.setInterval(() => void loadPatioFila(true), 30000) : undefined
    return () => {
      isMounted = false
      window.clearTimeout(handle)
      if (interval) window.clearInterval(interval)
    }
  }, [isCheckingSession, patioFilaArea, patioFilaPage, patioFilaQuery, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioAlocacao() {
      if (isCheckingSession || !session || view !== 'patio-alocacao') return

      setIsLoadingPatioAlocacao(true)
      try {
        const [veiculos, funcionarios, boxes] = await Promise.all([
          listPatioAlocacaoVeiculos(),
          listPatioFuncionarios(),
          listPatioBoxesLivres(),
        ])
        if (!isMounted) return
        setPatioAlocacaoVeiculos(veiculos)
        setPatioFuncionarios(funcionarios)
        setPatioBoxesLivres(boxes)
        setPatioAreasPendentes(veiculos[0] ? await listPatioAreasPendentes(veiculos[0].patioVeiculoId) : [])
        clearModuleError('patio-alocacao')
      } catch (exception) {
        if (isMounted) setModuleError('patio-alocacao', exception instanceof Error ? exception.message : 'Nao foi possivel carregar alocacao do patio.')
      } finally {
        if (isMounted) setIsLoadingPatioAlocacao(false)
      }
    }

    void loadPatioAlocacao()
    return () => {
      isMounted = false
    }
  }, [isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioBoxes() {
      if (isCheckingSession || !session || view !== 'patio-boxes') return

      setIsLoadingPatioBoxes(true)
      try {
        const rows = await listPatioBoxesPainel()
        if (!isMounted) return
        setPatioBoxesAtivos(rows)
        clearModuleError('patio-boxes')
      } catch (exception) {
        if (isMounted) setModuleError('patio-boxes', exception instanceof Error ? exception.message : 'Nao foi possivel carregar boxes.')
      } finally {
        if (isMounted) setIsLoadingPatioBoxes(false)
      }
    }

    loadPatioBoxes()
    return () => {
      isMounted = false
    }
  }, [isCheckingSession, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioConcluidos() {
      if (isCheckingSession || !session || view !== 'patio-concluidos') return

      setIsLoadingPatioConcluidos(true)
      try {
        const result = await listPatioConcluidos({
          page: patioConcluidosPage,
          pageSize: 50,
          query: patioConcluidosQuery,
          startDate: patioConcluidosStartDate,
          endDate: patioConcluidosEndDate,
        })
        const itens = await listPatioConcluidoAtendimentoItens(result.items.map((item) => item.patioExecucaoId))
        if (!isMounted) return
        setPatioConcluidos(result.items)
        setPatioConcluidosItens(itens)
        setPatioConcluidosTotal(result.total)
        clearModuleError('patio-concluidos')
      } catch (exception) {
        if (isMounted) {
          setPatioConcluidosItens([])
          setModuleError('patio-concluidos', exception instanceof Error ? exception.message : 'Nao foi possivel carregar concluidos.')
        }
      } finally {
        if (isMounted) setIsLoadingPatioConcluidos(false)
      }
    }

    const handle = window.setTimeout(loadPatioConcluidos, patioConcluidosQuery.trim() ? 250 : 0)
    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [isCheckingSession, patioConcluidosEndDate, patioConcluidosPage, patioConcluidosQuery, patioConcluidosStartDate, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioFeedback() {
      if (isCheckingSession) return
      if (!session) {
        setPatioFeedbackItems([])
        setPatioFeedbackTotal(0)
        return
      }
      if (view !== 'patio-feedback') return

      setIsLoadingPatioFeedback(true)
      try {
        const result = await listPatioFeedbackPendente({
          page: patioFeedbackPage,
          pageSize: 50,
          vendedorId: session.role === 'vendedor' ? session.id : undefined,
          query: patioFeedbackQuery,
        })
        if (!isMounted) return
        setPatioFeedbackItems(result.items)
        setPatioFeedbackTotal(result.total)
        clearModuleError('patio-feedback')
      } catch (exception) {
        if (isMounted) setModuleError('patio-feedback', exception instanceof Error ? exception.message : 'Nao foi possivel carregar feedbacks do patio.')
      } finally {
        if (isMounted) setIsLoadingPatioFeedback(false)
      }
    }

    const handle = window.setTimeout(loadPatioFeedback, patioFeedbackQuery.trim() ? 250 : 0)

    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [isCheckingSession, patioFeedbackPage, patioFeedbackQuery, patioFeedbackRefreshKey, session, view])

  useEffect(() => {
    let isMounted = true

    async function loadPatioRevisao() {
      if (isCheckingSession) return
      if (!session) {
        setPatioRevisaoItems([])
        setPatioRevisaoTotal(0)
        return
      }
      if (view !== 'patio-revisao') return

      setIsLoadingPatioRevisao(true)
      try {
        const result = await listPatioRevisaoProativa({
          page: patioRevisaoPage,
          pageSize: 50,
          vendedorId: session.role === 'vendedor' ? session.id : undefined,
          query: patioRevisaoQuery,
          kmMin: patioRevisaoMode === 'km' ? patioRevisaoKmMin : undefined,
          diasMin: patioRevisaoMode === 'tempo' ? patioRevisaoDiasMin : undefined,
        })
        if (!isMounted) return
        setPatioRevisaoItems(result.items)
        setPatioRevisaoTotal(result.total)
        clearModuleError('patio-revisao')
      } catch (exception) {
        if (isMounted) setModuleError('patio-revisao', exception instanceof Error ? exception.message : 'Nao foi possivel carregar revisao proativa.')
      } finally {
        if (isMounted) setIsLoadingPatioRevisao(false)
      }
    }

    const handle = window.setTimeout(loadPatioRevisao, patioRevisaoQuery.trim() ? 250 : 0)

    return () => {
      isMounted = false
      window.clearTimeout(handle)
    }
  }, [isCheckingSession, patioRevisaoDiasMin, patioRevisaoKmMin, patioRevisaoMode, patioRevisaoPage, patioRevisaoQuery, patioRevisaoRefreshKey, session, view])

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
        const [result, resumo, pipeline] = await Promise.all([
          listOportunidadesPage({
            page: oportunidadesPage,
            pageSize: 50,
            filter: oportunidadesFilter,
            tipo: oportunidadesTipoFilter,
            vendedorId,
          }),
          listOportunidadesResumo(vendedorId),
          listPipelineOportunidades(120),
        ])
        if (!isMounted) return
        setOportunidades(result.oportunidades)
        setOportunidadesTotal(result.total)
        setOportunidadesResumo(resumo)
        setPipelineOportunidades(
          vendedorId ? pipeline.filter((item) => item.responsavelId === vendedorId) : pipeline,
        )
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
        const [
          loadedVendas,
          loadedServicos,
          loadedVeiculos,
          loadedTarefas,
          loadedCampanhas,
          loadedContatoRecomendado,
          loadedPatioAtendimentos,
          loadedPatioItens,
        ] = await Promise.all([
          listClienteVendasItens(selectedClientId),
          listClienteServicosItens(selectedClientId),
          listClienteVeiculos(selectedClientId),
          listClienteTarefas(selectedClientId),
          listClienteCampanhaEnvios(selectedClientId),
          getClienteContatoRecomendado(selectedClientId),
          listClientePatioAtendimentos(selectedClientId),
          listClientePatioAtendimentoItens(selectedClientId),
        ])
        if (!isMounted) return
        setVendasItens(loadedVendas)
        setServicosItens(loadedServicos)
        setClienteVeiculos(loadedVeiculos)
        setClienteTarefas(loadedTarefas)
        setClienteCampanhas(loadedCampanhas)
        setClienteContatoRecomendado(loadedContatoRecomendado)
        setClientePatioAtendimentos(loadedPatioAtendimentos)
        setClientePatioItens(loadedPatioItens)
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
  const vendedorCarteiraCounts = useMemo(() => {
    const counts = new Map<string, number>()
    vendedoresResumo.forEach((row) => counts.set(row.vendedorId, row.clientes))
    clientes.forEach((cliente) => {
      if (!cliente.vendedorId || counts.has(cliente.vendedorId)) return
      counts.set(cliente.vendedorId, (counts.get(cliente.vendedorId) ?? 0) + 1)
    })
    return counts
  }, [clientes, vendedoresResumo])
  const vendedoresSemCarteira = useMemo(() => {
    if (session?.role !== 'admin') return []
    return usuarios.filter((usuario) => usuario.role === 'vendedor' && (vendedorCarteiraCounts.get(usuario.id) ?? 0) === 0)
  }, [session?.role, usuarios, vendedorCarteiraCounts])
  const sellerHasNoCarteira =
    session?.role === 'vendedor' &&
    !isLoadingClientes &&
    clientesTotal === 0 &&
    clienteFiltro === 'todos' &&
    query.trim().length === 0
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

  async function openQuoteForClient(clienteOrId: Cliente | string, sourceView: string, originContext: QuoteOriginContext) {
    const clienteId = typeof clienteOrId === 'string' ? clienteOrId : clienteOrId.id
    if (!clienteId) {
      openQuoteSearch(originContext)
      return
    }

    if (typeof clienteOrId === 'string') {
      await ensureClientInMemory(clienteId)
    } else {
      setClientes((current) => (current.some((cliente) => cliente.id === clienteId) ? current : [clienteOrId, ...current]))
    }

    setSelectedClientId(clienteId)
    setQuoteSourceView(sourceView)
    setQuoteOriginContext(originContext)
    setView('orcamento-editor')
  }

  function openQuoteSearch(originContext: QuoteOriginContext = { kind: 'cliente', label: 'Proposta avulsa' }) {
    setQuoteSourceView('orcamentos')
    setQuoteOriginContext(originContext)
    setOrcamentosFilter('todos')
    setOrcamentosPage(1)
    setQuoteSearchRequestKey((current) => current + 1)
    setView('orcamentos')
  }

  async function openBudgetFromCockpit(clienteId: string, originContext: QuoteOriginContext) {
    await openQuoteForClient(clienteId, 'cockpit', originContext)
  }

  function openQuickAction(action: 'tarefas-vencidas' | 'orcamentos-vencidos' | 'clientes-sem-cadastro' | 'campanhas' | 'orcamentos') {
    setAppMode('crm')
    localStorage.setItem('capital-crm:mode', 'crm')
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
    openQuoteSearch({ kind: 'cliente', label: 'Proposta avulsa' })
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

  const visibleModes = (['patio', 'crm', 'gestao'] as AppMode[]).filter((mode) => {
    if (mode === 'gestao' && session.role !== 'admin') return false
    if (isMobileShell && session.role !== 'admin') return mode === 'crm'
    if (isMobileShell && mode === 'gestao') return false
    return true
  })
  const visibleNavSections = navSectionsByMode[appMode]
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !isMobileShell || appMode === 'patio' || mobileAllowedViews.has(item.id))
        .filter((item) => session.role === 'admin' || !adminOnlyViews.has(item.id))
        .filter(() => appMode !== 'gestao' || session.role === 'admin')
        .filter((item) => appMode !== 'crm' || session.role === 'admin' || sellerPrimaryViews.has(item.id) || item.id === 'oportunidades')
        .map((item) => item.id === 'orcamentos' ? { ...item, label: 'Propostas' } : item),
    }))
    .filter((section) => section.items.length > 0)
  const canUseScopedClientViews = session.role === 'admin' || isMobileShell || !sellerHasNoCarteira
  const modeLabel: Record<AppMode, string> = {
    patio: 'Patio',
    crm: 'CRM',
    gestao: 'Gestao',
  }

  function switchMode(nextMode: AppMode) {
    setAppMode(nextMode)
    localStorage.setItem('capital-crm:mode', nextMode)
    setView(firstViewByMode[nextMode])
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BrandLogo compact />
          <div>
            <strong>Capital Truck</strong>
            <span>{modeLabel[appMode]}</span>
          </div>
        </div>

        {visibleModes.length > 1 && (
          <div className="mode-switcher" aria-label="Modo de trabalho">
          {visibleModes.map((mode) => (
            <button
              className={appMode === mode ? 'active' : ''}
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
            >
              {modeLabel[mode]}
            </button>
          ))}
          </div>
        )}

        <nav className="nav">
          {visibleNavSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <span className="nav-section-title">{section.title}</span>
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    className={`${view === item.id ? 'nav-item active' : 'nav-item'} ${mobilePrimaryViews.has(item.id) ? 'mobile-nav-primary' : 'mobile-nav-secondary'}`}
                    key={item.id}
                    onClick={() => setView(item.id)}
                    type="button"
                    title={item.label}
                  >
                    <Icon size={18} />
                    <span className="nav-label-full">{item.label}</span>
                    {item.id === 'orcamentos' && <span className="nav-label-mobile">Orcar</span>}
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
              <p className="eyebrow">{modeLabel[appMode]}</p>
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
                      <span>{result.kind === 'cliente' ? 'Cliente' : result.kind === 'orcamento' ? 'Proposta' : 'Catalogo'}</span>
                      <strong>{result.title}</strong>
                      <small>{result.detail}</small>
                    </button>
                  ))}
                  {quickSearchResults.length === 0 && <small>Nenhum atalho encontrado. Pressione Enter para buscar em Clientes.</small>}
                </div>
              )}
            </div>
            <div className="quick-jump-bar" aria-label="Atalhos operacionais">
              <button className="primary quick-orcar" type="button" onClick={() => openQuickAction('orcamentos')}>
                Orcar
              </button>
              <button className="mobile-only" type="button" onClick={() => setView('clientes')}>
                Historico
              </button>
              <button className="mobile-only" type="button" onClick={() => setView('cockpit')}>
                Inicio
              </button>
              <button className="quick-tarefas" type="button" onClick={() => openQuickAction('tarefas-vencidas')}>
                <span>{cockpitTarefasVencidas.length}</span>
                Tarefas
              </button>
              <button className="quick-propostas" type="button" onClick={() => openQuickAction('orcamentos-vencidos')}>
                <span>{cockpitOrcamentos.length}</span>
                Propostas
              </button>
              <button className="quick-sem-cadastro" type="button" onClick={() => openQuickAction('clientes-sem-cadastro')}>
                <span>{cockpitRodobens.length}</span>
                Sem cadastro
              </button>
              <button className="quick-campanhas" type="button" onClick={() => openQuickAction('campanhas')}>
                <span>{cockpitCampanhas.length}</span>
                Campanhas
              </button>
            </div>
          </div>
        </header>

        <div className={dataError ? 'data-banner error' : 'data-banner'}>
          <span>
            {isSupabaseConfigured ? 'Base conectada' : 'Modo local com dados demonstrativos'}
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

        {appMode === 'crm' && view === 'cockpit' && session.role === 'admin' && vendedoresSemCarteira.length > 0 && (
          <section className="panel wide seller-wallet-alert">
            <div className="panel-header">
              <div>
                <h2>Vendedores sem carteira</h2>
                <p>
                  {vendedoresSemCarteira.map((vendedor) => vendedor.nome).join(', ')}
                  {vendedoresSemCarteira.length === 1 ? ' ainda nao possui clientes atribuidos.' : ' ainda nao possuem clientes atribuidos.'}
                  Distribua a carteira para liberar uma rotina comercial real.
                </p>
              </div>
              <button className="button primary" type="button" onClick={() => setView('vendedores')}>
                Distribuir carteira
              </button>
            </div>
          </section>
        )}

        {appMode === 'patio' && view === 'patio-entrada' && (
          <PatioEntrada
            query={patioEntradaQuery}
            results={patioEntradaResults}
            isLoading={isLoadingPatioEntrada}
            catalogoServicos={patioCatalogoServicos}
            onQueryChange={setPatioEntradaQuery}
            onConsultPlate={consultPatioPlate}
            onRegisterEntrada={async (input) => {
              await registerPatioEntrada(input)
              setPatioFilaPage(1)
              setView('patio-fila')
            }}
            onEditVehicle={(vehicle) => {
              setPatioEntradaQuery(vehicle.placa ?? vehicle.clienteNome ?? '')
              setView('patio-dados')
            }}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-fila' && (
          <PatioFila
            items={patioFilaItems}
            boxesPainel={patioPainelBoxes}
            filaPainel={patioPainelFila}
            total={patioFilaTotal}
            page={patioFilaPage}
            pageSize={50}
            query={patioFilaQuery}
            area={patioFilaArea}
            isLoading={isLoadingPatioFila}
            lastUpdated={patioFilaLastUpdated}
            onQueryChange={(nextQuery) => {
              setPatioFilaQuery(nextQuery)
              setPatioFilaPage(1)
            }}
            onAreaChange={(nextArea) => {
              setPatioFilaArea(nextArea)
              setPatioFilaPage(1)
            }}
            onPageChange={setPatioFilaPage}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-dados' && (
          <PatioDadosClientes
            query={patioEntradaQuery}
            results={patioEntradaResults}
            isLoading={isLoadingPatioEntrada}
            onQueryChange={setPatioEntradaQuery}
            onSaveCliente={async (input) => {
              await updatePatioClienteDados(input)
              setPatioEntradaResults(await searchPatioVeiculos(patioEntradaQuery))
            }}
            onSaveVeiculo={async (input) => {
              await updatePatioVeiculoDados(input)
              setPatioEntradaResults(await searchPatioVeiculos(patioEntradaQuery))
            }}
            onLoadHistorico={async (patioVeiculoId) => {
              const atendimentos = await listPatioVeiculoAtendimentos(patioVeiculoId)
              const itens = await listPatioVeiculoAtendimentoItens(atendimentos.map((item) => item.patioExecucaoId))
              return { atendimentos, itens }
            }}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-alocacao' && (
          <PatioAlocacao
            veiculos={patioAlocacaoVeiculos}
            areas={patioAreasPendentes}
            funcionarios={patioFuncionarios}
            boxes={patioBoxesLivres}
            isLoading={isLoadingPatioAlocacao}
            onVehicleChange={async (patioVeiculoId) => {
              setPatioAreasPendentes(await listPatioAreasPendentes(patioVeiculoId))
            }}
            onAllocate={async (input) => {
              await allocatePatioServices(input)
              setPatioAlocacaoVeiculos(await listPatioAlocacaoVeiculos())
              setPatioBoxesLivres(await listPatioBoxesLivres())
              setPatioAreasPendentes([])
              setView('patio-boxes')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-boxes' && (
          <PatioBoxes
            items={patioBoxesAtivos}
            isLoading={isLoadingPatioBoxes}
            catalogoServicos={patioCatalogoServicos}
            onLoadServicos={listPatioBoxServicos}
            onAddServico={async (input) => {
              await addPatioBoxServico(input)
              setPatioBoxesAtivos(await listPatioBoxesPainel())
            }}
            onRetirar={async (patioExecucaoId) => {
              await unassignPatioBox(patioExecucaoId)
              setPatioBoxesAtivos(await listPatioBoxesPainel())
            }}
            onFinalizar={async (input) => {
              await finishPatioBox(input)
              notifyPatioBoxFinalized({
                patioExecucaoId: input.patioExecucaoId,
                finalizadoPor: session.nome,
                observacaoFinal: input.observacaoFinal,
              }).catch((error) => {
                console.warn('Nao foi possivel enviar notificacao Telegram do patio.', error)
              })
              setPatioBoxesAtivos(await listPatioBoxesPainel())
            }}
            onRefresh={async () => {
              setPatioBoxesAtivos(await listPatioBoxesPainel())
            }}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-concluidos' && (
          <PatioConcluidos
            items={patioConcluidos}
            total={patioConcluidosTotal}
            servicos={patioConcluidosItens}
            page={patioConcluidosPage}
            pageSize={50}
            query={patioConcluidosQuery}
            startDate={patioConcluidosStartDate}
            endDate={patioConcluidosEndDate}
            isLoading={isLoadingPatioConcluidos}
            onQueryChange={(nextQuery) => {
              setPatioConcluidosQuery(nextQuery)
              setPatioConcluidosPage(1)
            }}
            onDateRangeChange={(startDate, endDate) => {
              setPatioConcluidosStartDate(startDate)
              setPatioConcluidosEndDate(endDate)
              setPatioConcluidosPage(1)
            }}
            onPageChange={setPatioConcluidosPage}
            onUpdateTipoAtendimento={async (servicoId, tipoAtendimento) => {
              await updatePatioAtendimentoItemTipo(servicoId, tipoAtendimento)
              setPatioConcluidosItens((current) => current.map((item) => (
                item.id === servicoId ? { ...item, tipoAtendimento } : item
              )))
            }}
            onReverter={async (patioExecucaoId) => {
              await revertPatioVisit(patioExecucaoId)
              const result = await listPatioConcluidos({
                page: patioConcluidosPage,
                pageSize: 50,
                query: patioConcluidosQuery,
                startDate: patioConcluidosStartDate,
                endDate: patioConcluidosEndDate,
              })
              const itens = await listPatioVeiculoAtendimentoItens(result.items.map((item) => item.patioExecucaoId))
              setPatioConcluidos(result.items)
              setPatioConcluidosItens(itens)
              setPatioConcluidosTotal(result.total)
              setView('patio-alocacao')
            }}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-historico' && (
          <PatioHistoricoVeiculo
            query={patioEntradaQuery}
            results={patioEntradaResults}
            isLoading={isLoadingPatioEntrada}
            onQueryChange={setPatioEntradaQuery}
            onLoadHistorico={async (patioVeiculoId) => {
              const atendimentos = await listPatioVeiculoAtendimentos(patioVeiculoId)
              const itens = await listPatioVeiculoAtendimentoItens(atendimentos.map((item) => item.patioExecucaoId))
              return { atendimentos, itens }
            }}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
          />
        )}

        {appMode === 'patio' && view === 'patio-contatos' && (
          <PatioExportarContatos onLoadContatos={listPatioContatosExportacao} onMarkExported={markPatioContatosExportados} />
        )}

        {appMode === 'patio' && view === 'patio-pneus' && (
          <PatioAnalisePneus onAnalyze={analyzeTireInspection} />
        )}

        {appMode === 'crm' && view === 'patio-feedback' && (
          <PatioFeedback
            items={patioFeedbackItems}
            total={patioFeedbackTotal}
            page={patioFeedbackPage}
            pageSize={50}
            query={patioFeedbackQuery}
            isLoading={isLoadingPatioFeedback}
            onQueryChange={(nextQuery) => {
              setPatioFeedbackQuery(nextQuery)
              setPatioFeedbackPage(1)
            }}
            onRefresh={() => setPatioFeedbackRefreshKey((current) => current + 1)}
            onPageChange={setPatioFeedbackPage}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
            onMarkDone={async (item, observacao) => {
              await markPatioFeedbackDone(item.patioExecucaoId)
              const created = await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'WhatsApp',
                tipo: 'feedback_patio',
                resumo: observacao || `Feedback pos-servico registrado para placa ${item.placa ?? 'sem placa'}.`,
                resultado: 'feedback realizado',
              })
              setInteracoes((current) => [created, ...current])
              setPatioFeedbackItems((current) => current.filter((row) => row.patioExecucaoId !== item.patioExecucaoId))
              setPatioFeedbackTotal((current) => Math.max(0, current - 1))
            }}
            onCreateOpportunity={async (item) => {
              const created = await createTarefa({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                titulo: 'Retorno comercial apos feedback',
                descricao: `Cliente com atendimento de patio em ${dateLabel(item.fimExecucao)} demonstrou necessidade de retorno. Placa: ${item.placa ?? 'sem placa'}.`,
                dataVencimento: tomorrowDate(),
                prioridade: 85,
                origem: 'patio:feedback',
              })
              setTarefas((current) => [created, ...current])
            }}
          />
        )}

        {appMode === 'crm' && view === 'patio-revisao' && (
          <PatioRevisao
            items={patioRevisaoItems}
            total={patioRevisaoTotal}
            page={patioRevisaoPage}
            pageSize={50}
            query={patioRevisaoQuery}
            mode={patioRevisaoMode}
            kmMin={patioRevisaoKmMin}
            diasMin={patioRevisaoDiasMin}
            isLoading={isLoadingPatioRevisao}
            onQueryChange={(nextQuery) => {
              setPatioRevisaoQuery(nextQuery)
              setPatioRevisaoPage(1)
            }}
            onModeChange={(mode) => {
              setPatioRevisaoMode(mode)
              setPatioRevisaoPage(1)
            }}
            onKmMinChange={(value) => {
              setPatioRevisaoKmMin(value)
              setPatioRevisaoPage(1)
            }}
            onDiasMinChange={(value) => {
              setPatioRevisaoDiasMin(value)
              setPatioRevisaoPage(1)
            }}
            onRefresh={() => setPatioRevisaoRefreshKey((current) => current + 1)}
            onAdjustMedia={(item) => {
              setPatioEntradaQuery(item.placa ?? item.clienteNome)
              setAppMode('gestao')
              localStorage.setItem('capital-crm:mode', 'gestao')
              setView('patio-km-medio')
            }}
            onEditVehicle={(item) => {
              setPatioEntradaQuery(item.placa ?? item.clienteNome)
              setAppMode('patio')
              localStorage.setItem('capital-crm:mode', 'patio')
              setView('patio-dados')
            }}
            onPageChange={setPatioRevisaoPage}
            onOpenClient={async (clienteId) => {
              await ensureClientInMemory(clienteId)
              setSelectedClientId(clienteId)
              setAppMode('crm')
              localStorage.setItem('capital-crm:mode', 'crm')
              setView('cliente360')
            }}
            onMarkDone={async (item, observacao) => {
              await markPatioRevisaoDone(item.patioVeiculoId)
              const created = await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'WhatsApp',
                tipo: 'revisao_proativa',
                resumo: observacao || `Contato de revisao proativa registrado para placa ${item.placa ?? 'sem placa'}.`,
                resultado: 'revisao contatada',
              })
              setInteracoes((current) => [created, ...current])
              setPatioRevisaoItems((current) => current.filter((row) => row.patioVeiculoId !== item.patioVeiculoId))
              setPatioRevisaoTotal((current) => Math.max(0, current - 1))
            }}
            onCreateOpportunity={async (item) => {
              const created = await createTarefa({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                titulo: 'Oportunidade de revisao proativa',
                descricao: `Veiculo ${item.placa ?? ''} com ${numberLabel(item.kmEstimadoDesdeVisita)} km estimados desde a ultima visita. Criar proposta ou contato comercial.`,
                dataVencimento: tomorrowDate(),
                prioridade: 88,
                origem: 'patio:revisao',
              })
              setTarefas((current) => [created, ...current])
            }}
          />
        )}

        {appMode === 'crm' && isMobileShell && canUseScopedClientViews && view === 'cockpit' && (
          <MobileActionHome
            clientes={scoredClientes.slice(0, 8)}
            tarefasCount={cockpitTarefasVencidas.length}
            campanhasCount={cockpitCampanhas.length}
            onOpenClient={(cliente) => {
              setSelectedClientId(cliente.id)
              setView('cliente360')
            }}
            onCreateQuote={(cliente) => {
              void openQuoteForClient(cliente, 'mobile', { kind: 'cliente', label: 'Mobile' })
            }}
            onOpenCampaigns={() => setView('campanhas')}
          />
        )}
        {appMode === 'crm' && view === 'cockpit' && !isMobileShell && !sellerHasNoCarteira && (
          <Cockpit
            currentUser={session}
            usuarios={usuarios}
            tarefas={cockpitTarefas}
            tarefasVencidas={cockpitTarefasVencidas}
            orcamentos={cockpitOrcamentos}
            clientes={scoredClientes}
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
            onOpenTasksOrigin={(filter) => {
              setTarefasStatusFilter('abertas')
              setTarefasOriginFilter(filter)
              setTarefasPage(1)
              setView('tarefas')
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
            onCreateTask={async (task) => {
              const created = await createTarefa(task)
              setCockpitTarefas((current) => [created, ...current])
              setTarefas((current) => [created, ...current])
              return created
            }}
            onUpdateCampaignResult={async (item, status, result) => {
              const updated = await upsertCampanhaEnvio({
                campanhaId: item.campanhaId,
                campanhaNome: item.campanhaNome,
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                criadaPor: session.id,
                telefone: item.telefone,
                mensagemFinal: item.mensagemFinal,
                status,
              })
              await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'Campanha',
                tipo: 'campanha_inbox',
                resumo: result.resumo || campaignSummary(status, item.mensagemFinal),
                resultado: campaignStatusLabel(status),
                proximaAcao: result.proximaAcao || undefined,
                dataProximaAcao: result.dataProximaAcao || undefined,
                campanhaId: item.campanhaId,
              })
              const nextStatus = clientStatusFromCampaignStatus(status)
              if (nextStatus) {
                await updateClienteComercial(item.clienteId, { status: nextStatus })
                setClientes((current) => current.map((cliente) => cliente.id === item.clienteId ? { ...cliente, status: nextStatus } : cliente))
              }
              if (result.proximaAcao && result.dataProximaAcao) {
                const created = await createTarefa({
                  clienteId: item.clienteId,
                  vendedorId: item.vendedorId ?? session.id,
                  titulo: result.proximaAcao,
                  descricao: `Follow-up da campanha ${item.campanhaNome ?? item.campanhaId}. Resultado: ${campaignStatusLabel(status)}.`,
                  dataVencimento: result.dataProximaAcao,
                  prioridade: campaignTaskPriority(status),
                  origem: `campanha:${item.campanhaId}:resultado:${status}`,
                })
                setCockpitTarefas((current) => [created, ...current])
                setTarefas((current) => [created, ...current])
              }
              setCockpitCampanhas((current) => current.map((row) => row.id === item.id
                ? { ...item, ...updated, clienteNome: item.clienteNome, clienteCidade: item.clienteCidade, clienteUf: item.clienteUf }
                : row,
              ))
              setCampanhaInboxItems((current) => current.map((row) => row.id === item.id
                ? { ...item, ...updated, clienteNome: item.clienteNome, clienteCidade: item.clienteCidade, clienteUf: item.clienteUf }
                : row,
              ))
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
            <div className="empty-state">
              <strong>Sua carteira ainda nao possui clientes atribuidos.</strong>
              <span>Peça para um administrador distribuir clientes para o seu usuario. Depois disso, clientes, tarefas, propostas e campanhas entram na sua rotina automaticamente.</span>
            </div>
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
              void openQuoteForClient(cliente, 'clientes', { kind: 'cliente', label: 'Lista de clientes' })
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
            contatoRecomendado={clienteContatoRecomendado}
            patioAtendimentos={clientePatioAtendimentos}
            patioItens={clientePatioItens}
            currentUser={session}
            onUpdateClient={async (patch) => {
              await updateClienteComercial(selectedClient.id, patch)
              setClientes((current) => current.map((cliente) => cliente.id === selectedClient.id ? { ...cliente, ...patch } : cliente))
            }}
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
            onOpenBudget={(orcamentoId) => {
              setSelectedOrcamentoId(orcamentoId)
              setView('orcamento-detalhe')
            }}
            onUpdateBudgetStatus={async (orcamentoId, status, motivoPerda) => {
              const changedOrcamento = orcamentos.find((orcamento) => orcamento.id === orcamentoId)
              await updateOrcamentoStatus(orcamentoId, status, motivoPerda, status === 'enviado' ? session.id : undefined)
              if (status === 'ganho' && changedOrcamento) {
                await attributeCampanhaRevenueByOrcamento(orcamentoId, changedOrcamento.valorTotal)
              }
              setOrcamentos((current) => current.map((orcamento) => orcamento.id === orcamentoId
                ? { ...orcamento, status, motivoPerda, aprovadoPor: status === 'enviado' ? session.id : orcamento.aprovadoPor, aprovadoEm: status === 'enviado' ? new Date().toISOString() : orcamento.aprovadoEm }
                : orcamento))
            }}
            onDeleteBudget={async (orcamentoId) => {
              await deleteOrcamento(orcamentoId)
              setOrcamentos((current) => current.filter((orcamento) => orcamento.id !== orcamentoId))
              setOrcamentosTotal((current) => Math.max(0, current - 1))
              setCampanhaInboxItems((current) => current.map((item) => item.orcamentoId === orcamentoId
                ? { ...item, orcamentoId: undefined, virouOrcamento: false }
                : item))
            }}
            onCompleteTask={async (tarefaId) => {
              await completeTarefa(tarefaId)
              setTarefas((current) => current.map((tarefa) => tarefa.id === tarefaId ? { ...tarefa, status: 'concluida', concluidaEm: new Date().toISOString() } : tarefa))
              setClienteTarefas((current) => current.map((tarefa) => tarefa.id === tarefaId ? { ...tarefa, status: 'concluida', concluidaEm: new Date().toISOString() } : tarefa))
            }}
            onUpdateCampaignStatus={async (envio, status) => {
              const updated = await upsertCampanhaEnvio({
                campanhaId: envio.campanhaId,
                campanhaNome: envio.campanhaNome,
                clienteId: envio.clienteId,
                vendedorId: envio.vendedorId ?? selectedClient.vendedorId ?? session.id,
                criadaPor: session.id,
                telefone: envio.telefone ?? selectedClient.whatsapp,
                mensagemFinal: envio.mensagemFinal,
                status,
                orcamentoId: envio.orcamentoId,
                receitaAtribuida: envio.receitaAtribuida,
              })
              setClienteCampanhas((current) => current.map((item) => item.id === envio.id ? updated : item))
            }}
            onCreateTask={async () => {
              const created = await createTarefa({
                clienteId: selectedClient.id,
                vendedorId: selectedClient.vendedorId ?? session?.id,
                titulo: bestNextAction(selectedClient),
                descricao: `Tarefa criada pela ficha completa. ${smartSummary(selectedClient, scopedInteracoes)}`,
                dataVencimento: addDays(new Date().toISOString().slice(0, 10), 1),
                prioridade: 80,
                origem: 'cliente360',
              })
              setTarefas((current) => [created, ...current])
              setClienteTarefas((current) => [created, ...current])
              return created
            }}
            onCreateQuote={(initialItems) => {
              void openQuoteForClient(selectedClient, 'cliente360', { kind: 'cliente', label: 'Ficha completa', initialItems })
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
                  criadaPor: session.id,
                  telefone: selectedClient.whatsapp,
                  mensagemFinal: created.observacao || `Proposta ${created.id.slice(0, 8)} criada a partir da campanha ${quoteOriginContext.label}.`,
                  status: 'virou_orcamento',
                  orcamentoId: created.id,
                })
              }
              const interacao = await createInteracao({
                clienteId: created.clienteId,
                vendedorId: created.vendedorId ?? selectedClient.vendedorId ?? session.id,
                canal: 'WhatsApp',
                tipo: 'orcamento',
                resumo: `${created.observacao || `Proposta criada no valor de ${money(created.valorTotal)}.`} Origem: ${quoteOriginContext.label}.`,
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
            <div className="empty-state">
              Nenhum cliente carregado para esta acao.
              {view === 'orcamento-editor' && (
                <button className="button primary" type="button" onClick={() => openQuoteSearch({ kind: 'cliente', label: 'Proposta avulsa' })}>
                  Buscar cliente para proposta
                </button>
              )}
            </div>
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
            pipeline={pipelineOportunidades}
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
            onCreatePipeline={async (oportunidade) => {
              const cliente = clientes.find((item) => item.id === oportunidade.clienteId)
              const created = await createPipelineFromSuggestion(oportunidade, cliente?.vendedorId ?? session.id)
              setPipelineOportunidades((current) => [created, ...current])
              return created
            }}
            onUpdatePipelineStage={async (dealId, estagio, result) => {
              const deal = pipelineOportunidades.find((item) => item.id === dealId)
              const updated = await updatePipelineStage(dealId, estagio, result?.motivoPerda)
              setPipelineOportunidades((current) => current.map((item) => (item.id === dealId ? updated : item)))
              if (deal) {
                await createInteracao({
                  clienteId: deal.clienteId,
                  vendedorId: deal.responsavelId ?? session.id,
                  canal: 'WhatsApp',
                  tipo: 'pipeline',
                  resumo: result?.resumo || `Oportunidade movida para ${pipelineStageLabel(estagio)}.`,
                  resultado: pipelineStageLabel(estagio),
                  proximaAcao: result?.proximaAcao || undefined,
                  dataProximaAcao: result?.dataProximaAcao || undefined,
                  orcamentoId: deal.orcamentoId,
                  campanhaId: deal.campanhaId,
                })
                if (result?.proximaAcao && result.dataProximaAcao) {
                  const created = await createTarefa({
                    clienteId: deal.clienteId,
                    vendedorId: deal.responsavelId ?? session.id,
                    titulo: result.proximaAcao,
                    descricao: `Follow-up do pipeline: ${deal.titulo} (${pipelineStageLabel(estagio)}).`,
                    dataVencimento: result.dataProximaAcao,
                    prioridade: pipelineTaskPriority(estagio),
                    origem: `pipeline:${deal.id}:${estagio}`,
                  })
                  setTarefas((current) => [created, ...current])
                }
              }
              return updated
            }}
            onUpdatePipeline={async (dealId, patch) => {
              const updated = await updatePipelineOportunidade(dealId, patch)
              setPipelineOportunidades((current) => current.map((item) => (item.id === dealId ? updated : item)))
              return updated
            }}
            onStartSequence={async (clienteIds) => startDefaultCommercialSequence(clienteIds, session.id)}
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
              void openQuoteForClient(clienteId, 'tarefas', originContext ?? { kind: 'tarefa', label: 'Fila de tarefas' })
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
            onCompleteWithResult={async (tarefa, result) => {
              await completeTarefa(tarefa.id)
              const cliente = scopedClientes.find((item) => item.id === tarefa.clienteId) ?? clientes.find((item) => item.id === tarefa.clienteId)
              const vendedorId = tarefa.vendedorId ?? session.id
              const statusByResult: Record<TaskCompletionResult, ClienteStatus | undefined> = {
                respondeu: 'Em acompanhamento',
                pediu_orcamento: 'Orcamento aberto',
                nao_respondeu: 'Em acompanhamento',
                comprar_depois: 'Em acompanhamento',
                sem_interesse: 'Reativar',
                nao_contatar: 'Nao contatar',
              }
              const nextStatus = statusByResult[result.resultado]
              await createInteracao({
                clienteId: tarefa.clienteId,
                vendedorId,
                canal: result.canal,
                tipo: 'Resultado de tarefa',
                resumo: result.resumo || tarefa.titulo,
                resultado: taskCompletionResultLabel(result.resultado),
                proximaAcao: result.proximaAcao || undefined,
                dataProximaAcao: result.dataProximaAcao || undefined,
              })
              if (nextStatus) {
                await updateClienteComercial(tarefa.clienteId, { status: nextStatus })
                setClientes((current) => current.map((row) => row.id === tarefa.clienteId ? { ...row, status: nextStatus } : row))
              }
              if (result.proximaAcao && result.dataProximaAcao) {
                const created = await createTarefa({
                  clienteId: tarefa.clienteId,
                  vendedorId,
                  titulo: result.proximaAcao,
                  descricao: `Follow-up gerado ao concluir: ${tarefa.titulo}`,
                  dataVencimento: result.dataProximaAcao,
                  prioridade: Math.max(55, tarefa.prioridade - 10),
                  origem: `tarefa:${tarefa.id}`,
                })
                const vendedor = usuarios.find((item) => item.id === created.vendedorId)
                setTarefas((current) => [
                  {
                    ...created,
                    clienteNome: cliente?.nome ?? created.clienteNome,
                    vendedorNome: vendedor?.nome ?? created.vendedorNome,
                  },
                  ...current,
                ])
              }
              setTarefas((current) =>
                current.map((item) =>
                  item.id === tarefa.id ? { ...item, status: 'concluida', concluidaEm: new Date().toISOString() } : item,
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
            usuarios={usuarios}
            currentUser={session}
            onAddImportacao={(importacao) => setImportacoes((current) => [importacao, ...current.filter((item) => item.id !== importacao.id)])}
            onOpenClient={openClientFromCockpit}
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
              await openQuoteForClient(item.clienteId, 'campanhas', {
                kind: 'campanha',
                sourceId: item.campanhaId,
                label: item.campanhaNome ?? 'Campanha',
              })
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
            onUpdateInboxStatus={async (item, status, result) => {
              const updated = await upsertCampanhaEnvio({
                campanhaId: item.campanhaId,
                campanhaNome: item.campanhaNome,
                clienteId: item.clienteId,
                vendedorId: item.vendedorId,
                criadaPor: session.id,
                telefone: item.telefone,
                mensagemFinal: item.mensagemFinal,
                status,
              })
              await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'Campanha',
                tipo: 'campanha_inbox',
                resumo: result?.resumo || campaignSummary(status, item.mensagemFinal),
                resultado: campaignStatusLabel(status),
                proximaAcao: result?.proximaAcao || undefined,
                dataProximaAcao: result?.dataProximaAcao || undefined,
                campanhaId: item.campanhaId,
              })
              const nextStatus = clientStatusFromCampaignStatus(status)
              if (nextStatus) {
                await updateClienteComercial(item.clienteId, { status: nextStatus })
                setClientes((current) => current.map((cliente) => cliente.id === item.clienteId ? { ...cliente, status: nextStatus } : cliente))
              }
              if (result?.proximaAcao && result.dataProximaAcao) {
                const created = await createTarefa({
                  clienteId: item.clienteId,
                  vendedorId: item.vendedorId ?? session.id,
                  titulo: result.proximaAcao,
                  descricao: `Follow-up da campanha ${item.campanhaNome ?? item.campanhaId}. Resultado: ${campaignStatusLabel(status)}.`,
                  dataVencimento: result.dataProximaAcao,
                  prioridade: campaignTaskPriority(status),
                  origem: `campanha:${item.campanhaId}:resultado:${status}`,
                })
                setTarefas((current) => [created, ...current])
              }
              setCampanhaInboxItems((current) => current.map((row) => row.id === item.id ? { ...item, ...updated, clienteNome: item.clienteNome, clienteCidade: item.clienteCidade, clienteUf: item.clienteUf } : row))
            }}
            onOpenBudgetEditor={(cliente, originContext) => {
              void openQuoteForClient(cliente, 'campanhas', originContext)
            }}
            onDeleteCampaign={async (campanhaId) => {
              await deleteCampanha(campanhaId)
              setCampanhaInboxItems((current) => current.filter((item) => item.campanhaId !== campanhaId))
              setCampaignToOpenId((current) => (current === campanhaId ? '' : current))
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
            onUpdateStatus={async (item, status, result) => {
              const updated = await upsertCampanhaEnvio({
                campanhaId: item.campanhaId,
                campanhaNome: item.campanhaNome,
                clienteId: item.clienteId,
                vendedorId: item.vendedorId,
                criadaPor: session.id,
                telefone: item.telefone,
                mensagemFinal: item.mensagemFinal,
                status,
              })
              const interacao = await createInteracao({
                clienteId: item.clienteId,
                vendedorId: item.vendedorId ?? session.id,
                canal: 'Campanha',
                tipo: 'campanha_inbox',
                resumo: result?.resumo || campaignSummary(status, item.mensagemFinal),
                resultado: campaignStatusLabel(status),
                proximaAcao: result?.proximaAcao || undefined,
                dataProximaAcao: result?.dataProximaAcao || undefined,
                campanhaId: item.campanhaId,
              })
              setInteracoes((current) => [interacao, ...current])
              const nextStatus = clientStatusFromCampaignStatus(status)
              if (nextStatus) {
                await updateClienteComercial(item.clienteId, { status: nextStatus })
                setClientes((current) => current.map((cliente) => cliente.id === item.clienteId ? { ...cliente, status: nextStatus } : cliente))
              }
              if (result?.proximaAcao && result.dataProximaAcao) {
                const created = await createTarefa({
                  clienteId: item.clienteId,
                  vendedorId: item.vendedorId ?? session.id,
                  titulo: result.proximaAcao,
                  descricao: `Follow-up da campanha ${item.campanhaNome ?? item.campanhaId}. Resultado: ${campaignStatusLabel(status)}.`,
                  dataVencimento: result.dataProximaAcao,
                  prioridade: campaignTaskPriority(status),
                  origem: `campanha:${item.campanhaId}:resultado:${status}`,
                })
                setTarefas((current) => [created, ...current])
              }
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
            openSearchRequestKey={quoteSearchRequestKey}
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
              const originContext = quoteOriginContext.initialItems?.length
                ? { ...quoteOriginContext, label: quoteOriginContext.label || 'Proposta avulsa' }
                : { kind: 'cliente' as const, label: 'Proposta avulsa' }
              void openQuoteForClient(cliente, 'orcamentos', originContext)
            }}
            onRevise={async (id, input) => {
              const revised = await reviseOrcamento(id, input, input.itens)
              setOrcamentos((current) => current.map((orcamento) => (orcamento.id === id ? revised : orcamento)))
              return revised
            }}
            onStatusChange={(id, status, motivoPerda, pedidoConfirmado) => {
              const changedOrcamento = orcamentos.find((orcamento) => orcamento.id === id)
              updateOrcamentoStatus(id, status, motivoPerda, status === 'enviado' ? session.id : undefined, pedidoConfirmado).catch((exception) => {
                setModuleError('orcamentos', exception instanceof Error ? exception.message : 'Nao foi possivel atualizar a proposta.')
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
                        pedidoConfirmadoPor: pedidoConfirmado?.usuarioId ?? orcamento.pedidoConfirmadoPor,
                        pedidoConfirmadoEm: pedidoConfirmado ? new Date().toISOString() : orcamento.pedidoConfirmadoEm,
                        pedidoReferencia: pedidoConfirmado?.referencia || orcamento.pedidoReferencia,
                        pedidoObservacao: pedidoConfirmado?.observacao || orcamento.pedidoObservacao,
                        proximoFollowupEm: pedidoConfirmado ? undefined : orcamento.proximoFollowupEm,
                      }
                    : orcamento,
                  ),
              )
            }}
            onDelete={async (id) => {
              await deleteOrcamento(id)
              setOrcamentos((current) => current.filter((orcamento) => orcamento.id !== id))
              setOrcamentosTotal((current) => Math.max(0, current - 1))
              setCampanhaInboxItems((current) => current.map((item) => item.orcamentoId === id
                ? { ...item, orcamentoId: undefined, virouOrcamento: false }
                : item))
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
            onStatusChange={async (status, motivoPerda, pedidoConfirmado) => {
              await updateOrcamentoStatus(selectedOrcamento.id, status, motivoPerda, status === 'enviado' ? session.id : undefined, pedidoConfirmado)
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
                        pedidoConfirmadoPor: pedidoConfirmado?.usuarioId ?? orcamento.pedidoConfirmadoPor,
                        pedidoConfirmadoEm: pedidoConfirmado ? new Date().toISOString() : orcamento.pedidoConfirmadoEm,
                        pedidoReferencia: pedidoConfirmado?.referencia || orcamento.pedidoReferencia,
                        pedidoObservacao: pedidoConfirmado?.observacao || orcamento.pedidoObservacao,
                        proximoFollowupEm: pedidoConfirmado ? undefined : orcamento.proximoFollowupEm,
                      }
                    : orcamento,
                ),
              )
            }}
            onUpdateFollowup={async (followupDate) => {
              await updateOrcamentoFollowup(selectedOrcamento.id, followupDate)
              setOrcamentos((current) =>
                current.map((orcamento) =>
                  orcamento.id === selectedOrcamento.id
                    ? { ...orcamento, proximoFollowupEm: followupDate || undefined }
                    : orcamento,
                ),
              )
            }}
            onDelete={async () => {
              await deleteOrcamento(selectedOrcamento.id)
              setOrcamentos((current) => current.filter((orcamento) => orcamento.id !== selectedOrcamento.id))
              setOrcamentosTotal((current) => Math.max(0, current - 1))
              setCampanhaInboxItems((current) => current.map((item) => item.orcamentoId === selectedOrcamento.id
                ? { ...item, orcamentoId: undefined, virouOrcamento: false }
                : item))
              setSelectedOrcamentoId('')
              setView('orcamentos')
            }}
          />
        )}
        {canUseScopedClientViews && view === 'orcamento-detalhe' && !selectedOrcamento && (
          <section className="panel wide">
            <div className="empty-state">
              Proposta nao encontrada na pagina atual.
              <button className="button" type="button" onClick={() => setView('orcamentos')}>Voltar para propostas</button>
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
            onMediaChange={(itemId, midia) => {
              const updateCatalogItem = (item: CatalogoItem) => item.id === itemId ? { ...item, midia } : item
              setCatalogo((current) => current.map(updateCatalogItem))
              setCatalogoLista((current) => current.map(updateCatalogItem))
            }}
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
            metasVendedores={metasVendedores}
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
            onSaveMeta={async (input) => {
              const saved = await upsertMetaVendedor(input)
              setMetasVendedores((current) => [saved, ...current.filter((row) => row.id !== saved.id && row.vendedorId !== saved.vendedorId)])
            }}
            onCreateTask={async (task) => {
              const created = await createTarefa(task)
              setTarefas((current) => [created, ...current])
              return created
            }}
            onOpenClient={(clienteId) => {
              setSelectedClientId(clienteId)
              setView('cliente-360')
            }}
            onOpenQuote={(orcamento) => {
              setSelectedOrcamentoId(orcamento.id)
              setSelectedClientId(orcamento.clienteId)
              setView('orcamento-detalhe')
            }}
            onMarkQuoteLost={async (orcamento, motivoPerda) => {
              await updateOrcamentoStatus(orcamento.id, 'perdido', motivoPerda)
              setOrcamentos((current) =>
                current.map((item) => (item.id === orcamento.id ? { ...item, status: 'perdido', motivoPerda } : item)),
              )
            }}
          />
        )}
        {session.role === 'admin' && view === 'relatorio-patio' && (
          <PatioRelatorioGestao onLoad={listPatioRelatorioServicos} />
        )}
        {session.role === 'admin' && view === 'patio-km-medio' && (
          <PatioKmMedio
            query={patioEntradaQuery}
            results={patioEntradaResults}
            isLoading={isLoadingPatioEntrada}
            onQueryChange={setPatioEntradaQuery}
            onLoadHistorico={async (patioVeiculoId) => {
              const atendimentos = await listPatioVeiculoAtendimentos(patioVeiculoId)
              const itens = await listPatioVeiculoAtendimentoItens(atendimentos.map((item) => item.patioExecucaoId))
              return { atendimentos, itens }
            }}
            onSaveMedia={async (input) => {
              await updatePatioVeiculoMediaKm(input)
              setPatioEntradaResults(await searchPatioVeiculos(patioEntradaQuery))
            }}
            onSaveAtendimentoKm={updatePatioAtendimentoKm}
          />
        )}
        {session.role === 'admin' && view === 'patio-resultados' && (
          <PatioResultados onLoad={listPatioRevisaoResultados} />
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
        {session.role === 'admin' && view === 'auditoria' && <Auditoria alteracoes={alteracoes} eventos={auditoriaEventos} />}
      </main>
    </div>
  )
}

function titleFor(view: string) {
  const titles: Record<string, string> = {
    cockpit: 'Minha rotina',
    dashboard: 'Minha rotina',
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
    orcamentos: 'Propostas e conversao',
    catalogo: 'Catalogo e precos',
    relatorios: 'Relatorios gerenciais',
    'relatorio-patio': 'Relatorio Patio',
    'patio-km-medio': 'KM medio por placa',
    'patio-resultados': 'Resultados Patio',
    usuarios: 'Usuarios e permissoes',
    auditoria: 'Auditoria',
    cliente360: 'Ficha completa do cliente',
    'patio-entrada': 'Cadastro de Servico',
    'patio-dados': 'Dados de Clientes',
    'patio-alocacao': 'Alocar Servicos',
    'patio-fila': 'Filas de Servico',
    'patio-boxes': 'Visao dos Boxes',
    'patio-concluidos': 'Servicos concluidos',
    'patio-historico': 'Historico por placa',
    'patio-pneus': 'Analise de Pneus',
    'patio-contatos': 'Exportar contatos',
    'patio-feedback': 'Feedback pos-servico',
    'patio-revisao': 'Revisao proativa',
  }
  return titles[view] ?? 'Capital Truck'
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

function MobileActionHome({
  clientes,
  tarefasCount,
  campanhasCount,
  onOpenClient,
  onCreateQuote,
  onOpenCampaigns,
}: {
  clientes: Array<Cliente & { score?: number; motivo?: string; proximaMelhorAcao?: string }>
  tarefasCount: number
  campanhasCount: number
  onOpenClient: (cliente: Cliente) => void
  onCreateQuote: (cliente: Cliente) => void
  onOpenCampaigns: () => void
}) {
  const [query, setQuery] = useState('')
  const [remoteClientes, setRemoteClientes] = useState<Cliente[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const trimmedQuery = query.trim()

  useEffect(() => {
    let isActive = true
    if (trimmedQuery.length < 2) {
      setRemoteClientes([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    listClientesPage({ page: 1, pageSize: 8, query: trimmedQuery })
      .then((result) => {
        if (isActive) setRemoteClientes(result.clientes)
      })
      .catch(() => {
        if (!isActive) return
        const normalized = normalizeTextForMatch(trimmedQuery)
        setRemoteClientes(
          clientes
            .filter((cliente) => normalizeTextForMatch(`${cliente.nome} ${cliente.cidade} ${cliente.uf} ${cliente.whatsapp ?? ''} ${cliente.cpfCnpj ?? ''}`).includes(normalized))
            .slice(0, 8),
        )
      })
      .finally(() => {
        if (isActive) setIsSearching(false)
      })

    return () => {
      isActive = false
    }
  }, [clientes, trimmedQuery])

  const visibleClientes = trimmedQuery.length >= 2 ? remoteClientes : clientes.slice(0, 5)

  function focusClientSearch() {
    searchRef.current?.focus()
  }

  return (
    <section className="mobile-home" aria-label="Inicio mobile do vendedor">
      <div className="mobile-home-hero">
        <span>Mobile vendedor</span>
        <strong>Orcar, enviar campanha e consultar cliente sem procurar menu.</strong>
        <small>{tarefasCount} tarefas criticas - {campanhasCount} campanhas para tratar</small>
      </div>

      <div className="mobile-action-grid">
        <button className="mobile-action-card primary" type="button" onClick={focusClientSearch}>
          <strong>Orcar cliente</strong>
          <span>Busque o cliente e monte a proposta em poucos toques.</span>
        </button>
        <button className="mobile-action-card" type="button" onClick={onOpenCampaigns}>
          <strong>Enviar campanha</strong>
          <span>Abra campanhas salvas e envie pelo WhatsApp.</span>
        </button>
        <button className="mobile-action-card" type="button" onClick={focusClientSearch}>
          <strong>Consultar historico</strong>
          <span>Abra a ficha 360, contatos, compras e follow-up.</span>
        </button>
      </div>

      <label className="mobile-client-search">
        Cliente
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, cidade, WhatsApp ou CNPJ"
        />
      </label>

      <div className="mobile-client-list">
        <div className="mobile-list-heading">
          <strong>{trimmedQuery.length >= 2 ? 'Resultado da busca' : 'Clientes para acao rapida'}</strong>
          <span>{isSearching ? 'Buscando...' : `${visibleClientes.length} exibidos`}</span>
        </div>
        {visibleClientes.length === 0 && (
          <div className="empty-card">Nenhum cliente encontrado. Refine a busca para abrir historico ou orcar.</div>
        )}
        {visibleClientes.map((cliente) => (
          <article className="mobile-client-card" key={cliente.id}>
            <strong>{cliente.nome}</strong>
            <span>{[cliente.cidade, cliente.uf].filter(Boolean).join('/')} - {cliente.whatsapp || cliente.telefone || 'sem WhatsApp'}</span>
            <small>{mobileClientActionLabel(cliente)} - Ultima compra {dateLabel(cliente.ultimaCompraEm)}</small>
            <div className="mobile-client-card-actions">
              <button className="button primary" type="button" onClick={() => onCreateQuote(cliente)}>
                Orcar
              </button>
              <button className="button" type="button" onClick={() => onOpenClient(cliente)}>
                Historico
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function mobileClientActionLabel(cliente: Cliente) {
  const explicitAction = (cliente as Cliente & { proximaMelhorAcao?: string }).proximaMelhorAcao
  if (explicitAction && explicitAction !== 'Distribuir carteira') return explicitAction
  if (!cliente.vendedorId) return 'Sem vendedor definido'
  return bestNextAction(cliente)
}

function Cockpit({
  currentUser,
  usuarios,
  tarefas,
  tarefasVencidas,
  orcamentos,
  clientes,
  rodobens,
  oportunidades,
  campanhas,
  slaVendedores,
  isLoading,
  onOpenClient,
  onOpenBudget,
  onOpenModule,
  onOpenTasksOrigin,
  onCompleteTask,
  onRescheduleTask,
  onCreateTask,
  onUpdateCampaignResult,
  onRunFollowupAutomations,
}: {
  currentUser: SessaoUsuario
  usuarios: Vendedor[]
  tarefas: Tarefa[]
  tarefasVencidas: Tarefa[]
  orcamentos: Orcamento[]
  clientes: Array<Cliente & { score?: number; motivo?: string; proximaMelhorAcao?: string }>
  rodobens: Cliente[]
  oportunidades: Oportunidade[]
  campanhas: CampanhaInboxItem[]
  slaVendedores: TarefaSlaVendedorResumo[]
  isLoading: boolean
  onOpenClient: (clienteId: string) => Promise<void>
  onOpenBudget: (clienteId: string, originContext: QuoteOriginContext) => Promise<void>
  onOpenModule: (target: 'tarefas' | 'orcamentos' | 'rodobens' | 'oportunidades' | 'campanhas') => void
  onOpenTasksOrigin: (filter: TarefaOriginFilter) => void
  onCompleteTask: (id: string) => Promise<void>
  onRescheduleTask: (id: string, dataVencimento: string, motivo: string) => Promise<void>
  onCreateTask: (task: TarefaInput) => Promise<Tarefa>
  onUpdateCampaignResult: (item: CampanhaInboxItem, status: CampanhaEnvioStatus, result: CampaignInboxResultForm) => Promise<void>
  onRunFollowupAutomations: () => Promise<{ total: number; orcamentos: number; campanhas: number }>
}) {
  const [busyTaskId, setBusyTaskId] = useState('')
  const [creatingTaskClientId, setCreatingTaskClientId] = useState('')
  const [rescheduleTarget, setRescheduleTarget] = useState<Tarefa | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState(tomorrowDate())
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')
  const [slaAlertLimit, setSlaAlertLimit] = useState(3)
  const [isRunningFollowups, setIsRunningFollowups] = useState(false)
  const [followupAutomationMessage, setFollowupAutomationMessage] = useState('')
  const [campaignResultTarget, setCampaignResultTarget] = useState<CampanhaInboxItem | null>(null)
  const [campaignResultStatus, setCampaignResultStatus] = useState<CampanhaEnvioStatus>('respondeu')
  const [campaignResultForm, setCampaignResultForm] = useState<CampaignInboxResultForm>({ resumo: '', proximaAcao: '', dataProximaAcao: '' })
  const [busyCampaignId, setBusyCampaignId] = useState('')
  const todayTasks = uniqueBy(tarefas.filter((tarefa) => daysSince(tarefa.dataVencimento) >= 0), (tarefa) => tarefa.id)
  const contactFollowups = uniqueBy(
    tarefas.filter((tarefa) => isCommercialFollowupTask(tarefa)),
    (tarefa) => tarefa.id,
  )
    .sort((a, b) => taskCommercialPriority(b) - taskCommercialPriority(a) || a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 12)
  const openTaskClientIds = new Set([...tarefas, ...tarefasVencidas].filter((tarefa) => tarefa.status === 'aberta').map((tarefa) => tarefa.clienteId))
  const openBudgetClientIds = new Set(orcamentos.map((orcamento) => orcamento.clienteId))
  const clientesSemProximaAcao = clientes
    .filter((cliente) => {
      if (cliente.status === 'Nao contatar' || cliente.leadQualificacaoStatus === 'nao_contatar') return false
      if (openTaskClientIds.has(cliente.id) || openBudgetClientIds.has(cliente.id)) return false
      const score = Number(cliente.score ?? opportunityScore(cliente, []))
      const ultimaCompra = daysSince(cliente.ultimaCompraEm)
      const ultimoContato = daysSince(cliente.ultimoContatoEm)
      return cliente.status === 'Orcamento aberto'
        || cliente.status === 'Reativar'
        || score >= 62
        || ultimaCompra >= 90
        || ultimoContato >= 45
    })
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 8)
  const highPriorityTasks = tarefas
    .filter((tarefa) => tarefa.prioridade >= 80 && !todayTasks.some((item) => item.id === tarefa.id))
    .slice(0, 4)
  const criticalTasks = uniqueBy([...tarefasVencidas, ...todayTasks, ...highPriorityTasks], (tarefa) => tarefa.id).slice(0, 10)
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
  const clienteContactById = new Map(clientes.map((cliente) => [cliente.id, cliente.whatsapp || cliente.telefone || '']))
  const campaignWhatsappUrl = (envio: CampanhaInboxItem) => waMeUrl(envio.telefone, envio.mensagemFinal)
  const taskWhatsappUrl = (tarefa: Tarefa) => {
    const phone = clienteContactById.get(tarefa.clienteId)
    if (!phone) return ''
    const message = isCampaignCheckTask(tarefa)
      ? `Ola, ${tarefa.clienteNome}. Tudo bem? Estou conferindo se voce viu minha mensagem anterior e se posso ajudar com alguma cotacao.`
      : undefined
    return waMeUrl(phone, message)
  }
  const nextActionCandidates = [
    ...campanhas.map((envio) => ({
      id: `campanha-${envio.id}`,
      kind: 'campanha' as const,
      priority: campaignRoutinePriority(envio.status),
      title: envio.clienteNome,
      label: campaignRoutineLabel(envio.status),
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
        priority: 130 + (sla.tone === 'danger' ? 10 : sla.tone === 'warn' ? 5 : 0) + Math.min(Math.max(tarefa.prioridade - 70, 0), 10),
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
      priority: 120 + Math.min(Math.max(daysSince(orcamento.validade), 0), 20),
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
      priority: opportunityRoutinePriority(oportunidade),
      title: oportunidade.clienteNome,
      label: opportunityTypeLabel(oportunidade.tipo),
      subtitle: opportunityRoutineSubtitle(oportunidade),
      detail: opportunityRoutineDetail(oportunidade),
      clienteId: oportunidade.clienteId,
      oportunidade,
    })),
  ].sort((a, b) => b.priority - a.priority)
  const nextActions = uniqueBy(nextActionCandidates, (item) => item.clienteId).slice(0, 14)
  const responderAgoraActions = nextActions.filter((item) => item.kind === 'campanha' && ['respondeu', 'virou_orcamento'].includes(item.envio.status)).slice(0, 4)
  const checarEnviadosActions = nextActions.filter((item) => item.kind === 'campanha' && item.envio.status === 'enviado').slice(0, 4)
  const propostaActions = nextActions.filter((item) => item.kind === 'orcamento').slice(0, 4)
  const tarefaActions = nextActions.filter((item) => item.kind === 'tarefa').slice(0, 4)
  const oportunidadeActions = nextActions.filter((item) => ['lead', 'oportunidade'].includes(item.kind)).slice(0, 4)
  const campanhasComResposta = campanhas.filter((envio) => ['respondeu', 'virou_orcamento'].includes(envio.status))
  const campanhasParaChecar = campanhas.filter((envio) => envio.status === 'enviado')
  const routineGroups = [
    {
      id: 'responder',
      title: 'Responder agora',
      description: 'Cliente respondeu, pediu cotacao ou precisa de retorno humano.',
      empty: 'Nenhuma resposta aguardando atendimento.',
      actions: responderAgoraActions,
    },
    {
      id: 'checar',
      title: 'Aguardando resposta',
      description: 'Mensagens ja enviadas. Abra a conversa, confira se respondeu e registre o resultado na campanha.',
      empty: 'Nenhuma mensagem aguardando resposta.',
      actions: checarEnviadosActions,
    },
    {
      id: 'propostas',
      title: 'Propostas',
      description: 'Retomar orcamentos vencidos ou em negociacao.',
      empty: 'Nenhuma proposta urgente para retomar.',
      actions: propostaActions,
    },
    {
      id: 'tarefas',
      title: 'Tarefas do dia',
      description: 'Follow-ups planejados, atrasados ou de alta prioridade.',
      empty: 'Nenhuma tarefa critica agora.',
      actions: tarefaActions,
    },
    {
      id: 'oportunidades',
      title: 'Oportunidades',
      description: 'Clientes inativos, lista externa e sinais de recompra.',
      empty: 'Nenhuma oportunidade prioritaria agora.',
      actions: oportunidadeActions,
    },
  ]
  const primaryAction = nextActions[0]
  const actionReason = (item: typeof nextActions[number]) => {
    if (item.kind === 'campanha') return campaignRoutineReason(item.envio.status)
    if (item.kind === 'tarefa') return item.sla.tone === 'danger' ? 'Tarefa atrasada ou de alta prioridade.' : 'Follow-up planejado para agora.'
    if (item.kind === 'orcamento') return 'Proposta aberta passou da validade e precisa de retomada.'
    if (item.kind === 'lead') return 'Lista externa ainda nao qualificada para virar cliente ativo.'
    return opportunityRoutineReason(item.oportunidade)
  }
  const actionDetail = (item: typeof nextActions[number]) => {
    if (item.kind === 'campanha') return item.envio.status === 'enviado'
      ? `Aguardando resposta. Abra a conversa e registre o resultado quando o cliente retornar.`
      : item.detail
    return item.detail
  }

  function openCampaignResult(item: CampanhaInboxItem, status?: CampanhaEnvioStatus) {
    const nextStatus = status ?? (item.status === 'virou_orcamento' ? 'virou_orcamento' : item.status === 'comprar_depois' ? 'comprar_depois' : 'respondeu')
    setCampaignResultTarget(item)
    setCampaignResultStatus(nextStatus)
    setCampaignResultForm(campaignResultDefaults(nextStatus, item.campanhaNome ?? item.campanhaId))
  }

  async function submitCampaignResult() {
    if (!campaignResultTarget) return
    setBusyCampaignId(campaignResultTarget.id)
    try {
      await onUpdateCampaignResult(campaignResultTarget, campaignResultStatus, campaignResultForm)
      setCampaignResultTarget(null)
    } finally {
      setBusyCampaignId('')
    }
  }

  const actionButtons = (item: typeof nextActions[number], compact = false) => (
    <>
      <button className="button" type="button" onClick={() => onOpenClient(item.clienteId)}>{compact ? 'Ficha' : 'Abrir ficha'}</button>
      {item.kind === 'campanha' && (
        <>
          {campaignWhatsappUrl(item.envio) && (
            <a className="button" href={campaignWhatsappUrl(item.envio)} target="_blank" rel="noreferrer">
              Abrir conversa
            </a>
          )}
          {['respondeu', 'virou_orcamento'].includes(item.envio.status) && (
            <button
              className="button primary"
              type="button"
              onClick={() => onOpenBudget(item.clienteId, { kind: 'campanha', sourceId: item.envio.campanhaId, label: item.envio.campanhaNome ?? 'Campanha' })}
            >
              {item.envio.status === 'virou_orcamento' ? 'Criar proposta' : 'Nova proposta'}
            </button>
          )}
          <button
            className={item.envio.status === 'enviado' ? 'button primary' : 'button'}
            type="button"
            onClick={() => openCampaignResult(item.envio, item.envio.status === 'enviado' ? 'respondeu' : item.envio.status)}
          >
            Registrar resultado
          </button>
        </>
      )}
      {item.kind === 'tarefa' && (
        <>
          {taskWhatsappUrl(item.tarefa) && (
            <a className="button" href={taskWhatsappUrl(item.tarefa)} target="_blank" rel="noreferrer">
              Abrir conversa
            </a>
          )}
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
          Revisar proposta
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
          Nova proposta
        </button>
      )}
    </>
  )

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
        `${result.total} tarefas sincronizadas: ${result.orcamentos} propostas vencidas e ${result.campanhas} respostas de campanha.`,
      )
    } catch (exception) {
      setFollowupAutomationMessage(exception instanceof Error ? exception.message : 'Nao foi possivel gerar follow-ups.')
    } finally {
      setIsRunningFollowups(false)
    }
  }

  async function createNoNextActionTask(cliente: Cliente & { score?: number; motivo?: string; proximaMelhorAcao?: string }) {
    setCreatingTaskClientId(cliente.id)
    try {
      const score = Number(cliente.score ?? opportunityScore(cliente, []))
      await onCreateTask({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId || currentUser.id,
        titulo: 'Definir proxima acao comercial',
        descricao: [
          cliente.proximaMelhorAcao ?? bestNextAction(cliente),
          cliente.motivo ? `Motivo: ${cliente.motivo}` : '',
          cliente.whatsapp ? `WhatsApp: ${cliente.whatsapp}` : '',
        ].filter(Boolean).join('\n'),
        dataVencimento: tomorrowDate(),
        prioridade: Math.min(95, Math.max(65, score)),
        origem: 'cockpit:sem_proxima_acao',
      })
    } finally {
      setCreatingTaskClientId('')
    }
  }

  return (
    <section className="cockpit-layout">
      <section className="panel wide cockpit-hero">
        <div>
          <p className="eyebrow">Minha rotina</p>
          <h2>{ownerLabel}</h2>
          <p>Priorize respostas, propostas vencidas, tarefas e leads sem precisar procurar modulo por modulo.</p>
        </div>
        <div className="cockpit-kpis">
          <Info label="Atrasadas" value={tarefasVencidas.length.toString()} />
          <Info label="Follow-ups" value={contactFollowups.length.toString()} />
          <Info label="Respostas campanha" value={campanhasComResposta.length.toString()} />
          <Info label="Aguardando resposta" value={campanhasParaChecar.length.toString()} />
          <Info label="Prop. vencidas" value={orcamentos.length.toString()} />
          <Info label="Sem cadastro" value={rodobens.length.toString()} />
        </div>
      </section>

      {isLoading && <div className="empty-state compact">Carregando rotina comercial...</div>}

      {primaryAction && (
        <section className={`panel wide cockpit-focus-card ${primaryAction.kind}`}>
          <div>
            <span className="next-action-label">Comece por aqui</span>
            <h2>{primaryAction.title}</h2>
            <p>{primaryAction.label} - {primaryAction.subtitle}</p>
            <small className="next-action-why">{actionReason(primaryAction)}</small>
            <small>{primaryAction.detail}</small>
          </div>
          <div className="toolbar-actions">
            {actionButtons(primaryAction)}
          </div>
        </section>
      )}

      <section className="panel wide cockpit-workflow">
        <div className="panel-header">
          <div>
            <h2>Fluxo de trabalho</h2>
            <p>Trabalhe por tipo de acao. Respostas e checagens ficam antes de oportunidades frias.</p>
          </div>
          <button className="button" type="button" onClick={runFollowups} disabled={isRunningFollowups}>
            {isRunningFollowups ? 'Sincronizando...' : 'Sincronizar follow-ups'}
          </button>
        </div>
        {followupAutomationMessage && <div className="success-banner compact">{followupAutomationMessage}</div>}
        <div className="cockpit-workflow-grid">
          {routineGroups.map((group) => (
            <article className={`cockpit-workflow-card ${group.id}`} key={group.id}>
              <div className="cockpit-workflow-heading">
                <span>
                  <strong>{group.title}</strong>
                  <small>{group.description}</small>
                </span>
                <b>{group.actions.length}</b>
              </div>
              <div className="cockpit-workflow-list">
                {group.actions.map((item) => (
                  <div className={`cockpit-workflow-item ${item.kind}`} key={item.id}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <p>{actionReason(item)}</p>
                    <div className="row-actions">
                      {actionButtons(item, true)}
                    </div>
                  </div>
                ))}
                {group.actions.length === 0 && <div className="empty-state compact">{group.empty}</div>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide cockpit-next-actions">
        <div className="panel-header">
          <div>
            <h2>Fila completa priorizada</h2>
            <p>Lista unica deduplicada quando o mesmo cliente aparece em mais de uma frente.</p>
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
                <div>
                  <small className="next-action-why">{actionReason(item)}</small>
                  <p>{actionDetail(item)}</p>
                </div>
              </div>
              <div className="next-action-actions">
                {actionButtons(item, true)}
              </div>
            </article>
          ))}
          {nextActions.length === 0 && <div className="empty-state compact">Nenhuma acao urgente agora.</div>}
        </div>
      </section>

      <section className="panel wide cockpit-followups">
        <div className="panel-header">
          <div>
            <h2>Clientes sem proxima acao</h2>
            <p>Clientes com potencial ou risco, mas sem tarefa aberta nem proposta vencida na fila.</p>
          </div>
          <button className="button" type="button" onClick={() => onOpenTasksOrigin('cockpit')}>Abrir tarefas</button>
        </div>
        <div className="cockpit-list two-col">
          {clientesSemProximaAcao.map((cliente) => (
            <article className="cockpit-card" key={cliente.id}>
              <div>
                <strong>{cliente.nome}</strong>
                <small>{cliente.proximaMelhorAcao ?? bestNextAction(cliente)}</small>
                <small>
                  {cliente.cidade}/{cliente.uf} - {cliente.status} - score {Math.round(Number(cliente.score ?? opportunityScore(cliente, [])))}
                </small>
              </div>
              <p>{cliente.proximaMelhorAcao ?? bestNextAction(cliente)}</p>
              {cliente.motivo && <small className="muted">{cliente.motivo}</small>}
              <div className="row-actions">
                <button className="button" type="button" onClick={() => onOpenClient(cliente.id)}>Ficha</button>
                <button
                  className="button primary"
                  type="button"
                  disabled={creatingTaskClientId === cliente.id}
                  onClick={() => createNoNextActionTask(cliente)}
                >
                  {creatingTaskClientId === cliente.id ? 'Criando...' : 'Criar follow-up'}
                </button>
              </div>
            </article>
          ))}
          {clientesSemProximaAcao.length === 0 && <div className="empty-state compact">Todos os clientes prioritarios ja tem proxima acao.</div>}
        </div>
      </section>

      <section className="panel wide cockpit-followups">
        <div className="panel-header">
          <div>
            <h2>Fila de follow-up comercial</h2>
            <p>Retornos criados por atendimento, propostas, campanhas e ficha completa.</p>
          </div>
          <button className="button" type="button" onClick={() => onOpenModule('tarefas')}>Abrir tarefas</button>
        </div>
        <div className="followup-stage-grid">
          {[
            ['atendimento', 'Atendimento'],
            ['orcamento', 'Propostas'],
            ['campanha', 'Campanhas'],
            ['cliente360', 'Ficha completa'],
            ['cockpit', 'Sem prox. acao'],
          ].map(([origin, label]) => {
            const items = contactFollowups.filter((tarefa) => (tarefa.origem ?? '').startsWith(origin))
            return (
              <article className="followup-stage-card" key={origin}>
                <div>
                  <strong>{label}</strong>
                  <span>{items.length}</span>
                </div>
                {items.slice(0, 3).map((tarefa) => {
                  const sla = taskSla(tarefa)
                  return (
                    <button className="followup-mini-row" key={tarefa.id} type="button" onClick={() => onOpenClient(tarefa.clienteId)}>
                      <span>
                        <strong>{tarefa.clienteNome || tarefa.titulo}</strong>
                        <small>{tarefa.titulo} - {dateLabel(tarefa.dataVencimento)}</small>
                      </span>
                      <b className={`sla-pill ${sla.tone}`}>{sla.label}</b>
                    </button>
                  )
                })}
                {items.length === 0 && <small className="muted">Sem pendencias nesta etapa.</small>}
              </article>
            )
          })}
        </div>
        <div className="cockpit-list">
          {contactFollowups.slice(0, 6).map((tarefa) => {
            const sla = taskSla(tarefa)
            return (
              <article className={sla.tone === 'danger' ? 'cockpit-card danger' : 'cockpit-card'} key={tarefa.id}>
                <div>
                  <strong>{tarefa.clienteNome || tarefa.titulo}</strong>
                  <small>{taskOriginLabel(tarefa.origem)} - {dateLabel(tarefa.dataVencimento)} - prioridade {tarefa.prioridade}</small>
                </div>
                <span className={`sla-pill ${sla.tone}`}>{sla.label}</span>
                {tarefa.descricao && <p>{tarefa.descricao}</p>}
                <div className="row-actions">
                  <button className="button" type="button" onClick={() => onOpenClient(tarefa.clienteId)}>Ficha</button>
                  {taskWhatsappUrl(tarefa) && (
                    <a className="button" href={taskWhatsappUrl(tarefa)} target="_blank" rel="noreferrer">
                      Abrir conversa
                    </a>
                  )}
                  <button className="button" type="button" onClick={() => openReschedule(tarefa)}>Reagendar</button>
                  <button className="button primary" type="button" disabled={busyTaskId === tarefa.id} onClick={() => complete(tarefa.id)}>
                    {busyTaskId === tarefa.id ? 'Concluindo...' : 'Concluir'}
                  </button>
                </div>
              </article>
            )
          })}
          {contactFollowups.length === 0 && <div className="empty-state compact">Nenhum follow-up comercial aberto.</div>}
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
      {campaignResultTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCampaignResultTarget(null)}>
          <div className="campaign-contact-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <span>
                <strong>Registrar resultado do contato</strong>
                <small>{campaignResultTarget.clienteNome} - {campaignResultTarget.campanhaNome ?? 'Campanha'}</small>
              </span>
              <button className="button" type="button" onClick={() => setCampaignResultTarget(null)}>Fechar</button>
            </div>
            <label>
              Resultado
              <select
                value={campaignResultStatus}
                onChange={(event) => {
                  const status = event.target.value as CampanhaEnvioStatus
                  setCampaignResultStatus(status)
                  setCampaignResultForm(campaignResultDefaults(status, campaignResultTarget.campanhaNome ?? campaignResultTarget.campanhaId))
                }}
              >
                <option value="respondeu">Respondeu</option>
                <option value="virou_orcamento">Pediu orcamento</option>
                <option value="comprar_depois">Comprar depois</option>
                <option value="nao_respondeu">Sem resposta</option>
                <option value="perdido">Perdido</option>
                <option value="nao_contatar">Nao contatar</option>
              </select>
            </label>
            <label>
              Resumo do contato
              <textarea
                value={campaignResultForm.resumo}
                onChange={(event) => setCampaignResultForm((current) => ({ ...current, resumo: event.target.value }))}
                placeholder="Ex.: respondeu, pediu 295/80 para cotar; prefere retorno a tarde."
              />
            </label>
            <div className="inline-grid two">
              <label>
                Proxima acao
                <input
                  value={campaignResultForm.proximaAcao}
                  onChange={(event) => setCampaignResultForm((current) => ({ ...current, proximaAcao: event.target.value }))}
                  placeholder="Ex.: Enviar proposta"
                />
              </label>
              <label>
                Data
                <input
                  type="date"
                  value={campaignResultForm.dataProximaAcao}
                  onChange={(event) => setCampaignResultForm((current) => ({ ...current, dataProximaAcao: event.target.value }))}
                />
              </label>
            </div>
            <button
              className="button primary"
              type="button"
              disabled={!campaignResultForm.resumo.trim() || busyCampaignId === campaignResultTarget.id}
              onClick={submitCampaignResult}
            >
              {busyCampaignId === campaignResultTarget.id ? 'Salvando...' : 'Salvar resultado'}
            </button>
          </div>
        </div>
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
  onUpdateStatus: (item: CampanhaInboxItem, status: CampanhaEnvioStatus, result?: CampaignInboxResultForm) => Promise<void>
}) {
  const [busyId, setBusyId] = useState('')
  const [resultTarget, setResultTarget] = useState<CampanhaInboxItem | null>(null)
  const [resultStatus, setResultStatus] = useState<CampanhaEnvioStatus>('respondeu')
  const [resultForm, setResultForm] = useState<CampaignInboxResultForm>({
    resumo: '',
    proximaAcao: '',
    dataProximaAcao: '',
  })
  const actionable = items.filter((item) => ['respondeu', 'virou_orcamento', 'enviado', 'nao_respondeu', 'comprar_depois'].includes(item.status))
  const orderedItems = [...items].sort((a, b) => campaignInboxPriority(b) - campaignInboxPriority(a))
  const nextInboxItem = orderedItems.find((item) => campaignInboxPriority(item) > 0)
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

  function openCampaignResult(item: CampanhaInboxItem, status: CampanhaEnvioStatus) {
    const defaults = campaignResultDefaults(status, item.campanhaNome ?? item.campanhaId)
    setResultTarget(item)
    setResultStatus(status)
    setResultForm({
      resumo: item.respostaCliente || defaults.resumo,
      proximaAcao: defaults.proximaAcao,
      dataProximaAcao: defaults.dataProximaAcao,
    })
  }

  async function submitCampaignResult() {
    if (!resultTarget) return
    if (!resultForm.resumo.trim()) return
    await run(resultTarget.id, async () => {
      await onUpdateStatus(resultTarget, resultStatus, resultForm)
      setResultTarget(null)
    })
  }

  return (
    <section className={embedded ? 'campaign-inbox-embedded' : 'panel wide'}>
      <div className="panel-header">
        <div>
          <h2>Inbox de campanhas</h2>
          <p>Fila operacional para tratar respostas, retornos, propostas e perdas sem voltar para a montagem da campanha.</p>
        </div>
        <div className="toolbar-actions">
          <label className="mini-select">
            <Filter size={15} />
            <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as CampanhaEnvioStatus | 'todos')}>
              <option value="todos">Todos os status</option>
              <option value="respondeu">Responderam</option>
              <option value="virou_orcamento">Virou proposta</option>
              <option value="enviado">Aguardando resposta</option>
              <option value="nao_respondeu">Nao respondeu</option>
              <option value="comprar_depois">Comprar depois</option>
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
        <Info label="Propostas" value={(counts.virou_orcamento ?? 0).toString()} />
        <Info label="Sem resposta" value={(counts.nao_respondeu ?? 0).toString()} />
        <Info label="Comprar depois" value={(counts.comprar_depois ?? 0).toString()} />
        <Info label="Ganhos" value={(counts.ganhou ?? 0).toString()} />
        <Info label="Perdidos" value={(counts.perdido ?? 0).toString()} />
      </div>

      {nextInboxItem && (
        <div className="next-campaign-target">
          <div>
            <strong>Comece por este retorno</strong>
            <span>{nextInboxItem.clienteNome}</span>
            <small>{campaignStatusLabel(nextInboxItem.status)} - {nextInboxItem.campanhaNome ?? 'Campanha'}</small>
          </div>
          <div className="toolbar-actions">
            <button className="button" type="button" onClick={() => onOpenClient(nextInboxItem.clienteId)}>Ficha</button>
            <button className="button primary" type="button" onClick={() => run(nextInboxItem.id, () => onOpenBudget(nextInboxItem))}>Proposta</button>
          </div>
        </div>
      )}

      {isLoading && <div className="empty-state">Carregando inbox de campanhas...</div>}
      {!isLoading && (
        <div className="table">
          <div className="table-head campaign-inbox-row">
            <span>Cliente</span>
            <span>Campanha</span>
            <span>Status</span>
            <span>Mensagem</span>
            <span>Proximo passo</span>
          </div>
          {orderedItems.map((item) => (
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
                  Proposta
                </button>
                <button className="button" type="button" disabled={busyId === item.id} onClick={() => run(item.id, async () => { await onCreateTask(item) })}>
                  Criar tarefa
                </button>
                <select
                  className="assign-select"
                  value=""
                  disabled={busyId === item.id}
                  aria-label={`Registrar resultado de ${item.clienteNome}`}
                  onChange={(event) => {
                    const status = event.target.value as CampanhaEnvioStatus
                    event.currentTarget.value = ''
                    if (status) openCampaignResult(item, status)
                  }}
                >
                  <option value="">Registrar resultado</option>
                  <option value="respondeu">Respondeu</option>
                  <option value="virou_orcamento">Virou proposta</option>
                  <option value="nao_respondeu">Sem resposta</option>
                  <option value="comprar_depois">Comprar depois</option>
                  <option value="ganhou">Ganhou</option>
                  <option value="perdido">Perdido</option>
                  <option value="nao_contatar">Nao contatar</option>
                </select>
              </span>
            </div>
          ))}
          {items.length === 0 && <div className="empty-state">Nenhuma resposta de campanha nesta fila.</div>}
        </div>
      )}
      {resultTarget && (
        <section className="floating-panel task-result-panel">
          <div className="panel-header">
            <div>
              <h2>Resultado da campanha</h2>
              <p>{resultTarget.clienteNome} - {resultTarget.campanhaNome ?? 'Campanha'}</p>
            </div>
            <button className="button" type="button" onClick={() => setResultTarget(null)}>Fechar</button>
          </div>
          <div className="quick-result-grid">
            {(['respondeu', 'virou_orcamento', 'comprar_depois', 'nao_respondeu', 'ganhou', 'perdido', 'nao_contatar'] as CampanhaEnvioStatus[]).map((status) => (
              <button
                className={resultStatus === status ? 'button primary' : 'button'}
                key={status}
                type="button"
                onClick={() => {
                  const defaults = campaignResultDefaults(status, resultTarget.campanhaNome ?? resultTarget.campanhaId)
                  setResultStatus(status)
                  setResultForm(defaults)
                }}
              >
                {campaignStatusLabel(status)}
              </button>
            ))}
          </div>
          <div className="task-form compact-form">
            <label className="span-2">
              Resumo da tratativa
              <textarea value={resultForm.resumo} onChange={(event) => setResultForm({ ...resultForm, resumo: event.target.value })} />
            </label>
            <label>
              Proxima data
              <input type="date" value={resultForm.dataProximaAcao} onChange={(event) => setResultForm({ ...resultForm, dataProximaAcao: event.target.value })} />
            </label>
            <label>
              Proxima acao
              <input value={resultForm.proximaAcao} onChange={(event) => setResultForm({ ...resultForm, proximaAcao: event.target.value })} />
            </label>
            <button className="button primary" type="button" disabled={busyId === resultTarget.id || !resultForm.resumo.trim()} onClick={submitCampaignResult}>
              {busyId === resultTarget.id ? 'Salvando...' : 'Salvar resultado'}
            </button>
          </div>
        </section>
      )}
    </section>
  )
}

type CampaignInboxResultForm = {
  resumo: string
  proximaAcao: string
  dataProximaAcao: string
}

function campaignInboxPriority(item: CampanhaInboxItem) {
  const weights: Partial<Record<CampanhaEnvioStatus, number>> = {
    respondeu: 100,
    virou_orcamento: 95,
    enviado: 70,
    nao_respondeu: 55,
    comprar_depois: 50,
    pendente: 25,
  }
  return weights[item.status] ?? 0
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
      detail: 'Propostas vencidas ainda sem ganho/perda.',
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
}: {
  currentUser: SessaoUsuario
  clientes: Array<Cliente & { score: number; motivo: string; proximaMelhorAcao: string }>
  selectedClient: Cliente
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  vendasItens: VendaItem[]
  servicosItens: ServicoItem[]
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
            <span>Local</span>
            <span>Proxima acao</span>
            <span>Prioridade</span>
          </div>
          {visibleClientes.map((cliente) => (
            <button className="table-row four clickable" key={cliente.id} onClick={() => onSelect(cliente)} type="button">
              <span>
                <strong>{cliente.nome}</strong>
                <small>{cliente.tipoCliente} · {origemLabel(cliente.origemBase)}</small>
              </span>
              <span>
                {cliente.cidade}/{cliente.uf}
                <small>{cliente.vendedorNome ?? 'Sem vendedor'}</small>
              </span>
              <span>
                <strong>{cliente.proximaMelhorAcao || bestNextAction(cliente)}</strong>
                <small>{cliente.proximaAcaoEm ? `Agendada: ${dateLabel(cliente.proximaAcaoEm)}` : 'Sem data definida'}</small>
              </span>
              <span className="score">
                {cliente.score >= 75 ? 'Alta' : cliente.score >= 55 ? 'Media' : 'Baixa'}
                <small>{opportunityScoreDetails(cliente, orcamentos).slice(0, 2).map((item) => item.label).join(' + ') || cliente.motivo}</small>
              </span>
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
          onOpenFullProfile={() => onOpenFullProfile(selectedClient)}
          onOpenBudgetEditor={() => onOpenBudgetEditor(selectedClient)}
          onUpdateClient={onUpdateClient}
          onAddInteraction={onAddInteraction}
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
          <p>Fila priorizada por propostas, recompra, inatividade e dados incompletos.</p>
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
    const message = buildExternalLeadOpeningMessage(cliente)
    const waUrl = cliente.whatsapp ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(message)}` : undefined
    if (waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer')
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
      <div className="lead-flow-note">
        <strong>Fluxo simples:</strong>
        <span>abra o WhatsApp, registre o resultado e deixe o follow-up criado para nao perder retorno.</span>
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
            {isCreatingBulkTasks ? 'Criando...' : `Criar ${selectedLeadIds.length || ''} contatos de hoje`}
          </button>
          <button
            className="button"
            type="button"
            disabled={selectedLeadIds.length === 0 || isCreatingCampaign}
            onClick={createCampaignFromSelectedLeads}
          >
            {isCreatingCampaign ? 'Gerando...' : 'Criar campanha com selecionados'}
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
            <span>Proximo passo</span>
          </div>
          {leads.map((cliente) => {
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
                  <button className="button primary" type="button" disabled={!cliente.whatsapp} onClick={() => registerFirstContact(cliente)}>
                    <MessageCircle size={16} /> Abrir e registrar
                  </button>
                  <select
                    className="assign-select"
                    value=""
                    aria-label={`Registrar resultado de ${cliente.nome}`}
                    onChange={(event) => {
                      const status = event.target.value as LeadQualificacaoStatus
                      event.currentTarget.value = ''
                      if (status) void updateLead(cliente, status)
                    }}
                  >
                    <option value="">Registrar resultado</option>
                    <option value="qualificado">Qualificado</option>
                    <option value="virou_cliente">Virou cliente</option>
                    <option value="descartado">Descartado</option>
                    <option value="nao_contatar">Nao contatar</option>
                  </select>
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
    cliente_risco_180: 'Cliente inativo',
    recompra_90: 'Recompra 90d',
    alto_valor_sem_contato: 'Alto valor',
    orcamento_aberto: 'Orc. aberto',
    orcamento_vencido: 'Orc. vencido',
    sem_whatsapp: 'Sem WhatsApp',
  }
  return labels[type] ?? type.replaceAll('_', ' ')
}

function opportunityRoutineReason(oportunidade: Oportunidade) {
  if (oportunidade.tipo === 'cliente_risco_180') return 'Oportunidade: cliente sem compra recente.'
  if (oportunidade.tipo === 'rodobens_primeiro_contato') return 'Oportunidade: lista externa para qualificar.'
  if (oportunidade.tipo === 'sem_vendedor') return 'Oportunidade: cliente precisa ser distribuido para uma carteira.'
  return oportunidade.proximaAcao ? `Oportunidade: ${oportunidade.proximaAcao}` : `Oportunidade detectada: ${oportunidade.motivo}`
}

function opportunityRoutineDetail(oportunidade: Oportunidade) {
  if (oportunidade.tipo === 'cliente_risco_180') return 'Mais de 180 dias sem compra. Retome o contato ou monte uma proposta objetiva.'
  if (oportunidade.tipo === 'rodobens_primeiro_contato') return oportunidade.motivo || 'Validar contato e decidir se vira cliente ativo.'
  if (oportunidade.tipo === 'sem_vendedor') return 'Distribuir carteira antes de iniciar rotina comercial.'
  return oportunidade.proximaAcao || oportunidade.motivo
}

function opportunityRoutinePriority(oportunidade: Oportunidade) {
  if (oportunidade.tipo === 'sem_vendedor') return 90
  if (oportunidade.tipo === 'rodobens_primeiro_contato') return 82
  if (oportunidade.tipo === 'cliente_risco_180') return 70
  return 75
}

function opportunityRoutineSubtitle(oportunidade: Oportunidade) {
  if (oportunidade.tipo === 'cliente_risco_180') return 'Fila automatica de reativacao'
  if (oportunidade.tipo === 'rodobens_primeiro_contato') return 'Lista externa'
  if (oportunidade.tipo === 'sem_vendedor') return 'Precisa de carteira'
  return `Score ${oportunidade.prioridade}`
}

function pipelineStageLabel(stage: OportunidadeEstagio) {
  const labels: Record<OportunidadeEstagio, string> = {
    novo_lead: 'Novo lead',
    contato_iniciado: 'Contato iniciado',
    qualificado: 'Qualificado',
    orcamento: 'Orcamento',
    negociacao: 'Negociacao',
    ganho: 'Ganho',
    perdido: 'Perdido',
  }
  return labels[stage]
}

function pipelineNextActionForStage(stage: OportunidadeEstagio) {
  const actions: Partial<Record<OportunidadeEstagio, string>> = {
    novo_lead: 'Fazer primeiro contato',
    contato_iniciado: 'Qualificar necessidade',
    qualificado: 'Montar proposta comercial',
    orcamento: 'Enviar proposta e confirmar recebimento',
    negociacao: 'Retomar negociacao',
  }
  return actions[stage] ?? ''
}

function pipelineTaskPriority(stage: OportunidadeEstagio) {
  const priorities: Record<OportunidadeEstagio, number> = {
    novo_lead: 70,
    contato_iniciado: 78,
    qualificado: 86,
    orcamento: 94,
    negociacao: 90,
    ganho: 55,
    perdido: 45,
  }
  return priorities[stage]
}

const pipelineStages: OportunidadeEstagio[] = [
  'novo_lead',
  'contato_iniciado',
  'qualificado',
  'orcamento',
  'negociacao',
  'ganho',
  'perdido',
]

function Oportunidades({
  oportunidades,
  pipeline,
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
  onCreatePipeline,
  onUpdatePipelineStage,
  onUpdatePipeline,
  onStartSequence,
  onCreateCampaignFromSelection,
}: {
  oportunidades: Oportunidade[]
  pipeline: OportunidadePipeline[]
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
  onCreatePipeline: (oportunidade: Oportunidade) => Promise<OportunidadePipeline>
  onUpdatePipelineStage: (dealId: string, estagio: OportunidadeEstagio, result?: PipelineStageResultForm) => Promise<OportunidadePipeline>
  onUpdatePipeline: (
    dealId: string,
    patch: Partial<Pick<OportunidadePipeline, 'titulo' | 'valorEstimado' | 'probabilidade' | 'previsaoFechamento' | 'responsavelId' | 'observacao'>>,
  ) => Promise<OportunidadePipeline>
  onStartSequence: (clienteIds: string[]) => Promise<number>
  onCreateCampaignFromSelection: (clienteIds: string[], tipo: string) => Promise<number>
}) {
  const [createdTasks, setCreatedTasks] = useState<string[]>([])
  const [createdPipeline, setCreatedPipeline] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkVendedorId, setBulkVendedorId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [isStartingSequence, setIsStartingSequence] = useState(false)
  const [isCreatingPipelineBatch, setIsCreatingPipelineBatch] = useState(false)
  const [editingDealId, setEditingDealId] = useState('')
  const [dealDraft, setDealDraft] = useState({
    titulo: '',
    valorEstimado: 0,
    probabilidade: 0,
    previsaoFechamento: '',
    responsavelId: '',
    observacao: '',
  })
  const [lossReasons, setLossReasons] = useState<Record<string, string>>({})
  const [stageTarget, setStageTarget] = useState<OportunidadePipeline | null>(null)
  const [stageTargetValue, setStageTargetValue] = useState<OportunidadeEstagio>('novo_lead')
  const [stageResultForm, setStageResultForm] = useState<PipelineStageResultForm>({
    resumo: '',
    motivoPerda: '',
    proximaAcao: '',
    dataProximaAcao: '',
  })
  const [isSavingDeal, setIsSavingDeal] = useState(false)
  const vendedores = usuarios.filter((usuario) => usuario.role === 'vendedor')
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const totalAtivas = resumo.reduce((sum, item) => sum + item.ativas, 0)
  const totalBloqueadas = resumo.reduce((sum, item) => sum + item.bloqueadas, 0)
  const topResumo = resumo.slice(0, 6)
  const pipelineAberto = pipeline.filter((item) => item.estagio !== 'ganho' && item.estagio !== 'perdido')
  const pipelineValor = pipelineAberto.reduce((sum, item) => sum + item.valorEstimado, 0)
  const pipelineForecast = pipelineAberto.reduce((sum, item) => sum + (item.valorEstimado * item.probabilidade) / 100, 0)
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

  function startDealEdit(deal: OportunidadePipeline) {
    setEditingDealId(deal.id)
    setDealDraft({
      titulo: deal.titulo,
      valorEstimado: deal.valorEstimado,
      probabilidade: deal.probabilidade,
      previsaoFechamento: deal.previsaoFechamento ?? '',
      responsavelId: deal.responsavelId ?? '',
      observacao: deal.observacao ?? '',
    })
  }

  async function saveDealEdit() {
    if (!editingDealId) return
    setError('')
    setIsSavingDeal(true)
    try {
      await onUpdatePipeline(editingDealId, dealDraft)
      setEditingDealId('')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar a oportunidade.')
    } finally {
      setIsSavingDeal(false)
    }
  }

  function openStageResult(deal: OportunidadePipeline, nextStage: OportunidadeEstagio) {
    setStageTarget(deal)
    setStageTargetValue(nextStage)
    setStageResultForm({
      resumo: `${deal.titulo} movida para ${pipelineStageLabel(nextStage)}.`,
      motivoPerda: nextStage === 'perdido' ? (lossReasons[deal.id] ?? '') : '',
      proximaAcao: ['ganho', 'perdido'].includes(nextStage) ? '' : pipelineNextActionForStage(nextStage),
      dataProximaAcao: ['ganho', 'perdido'].includes(nextStage) ? '' : addDays(new Date().toISOString().slice(0, 10), nextStage === 'orcamento' ? 1 : 3),
    })
  }

  async function submitStageResult() {
    if (!stageTarget) return
    if (stageTargetValue === 'perdido' && !stageResultForm.motivoPerda.trim()) {
      setError('Informe o motivo de perda antes de mover para Perdido.')
      return
    }
    if (!stageResultForm.resumo.trim()) {
      setError('Informe um resumo para registrar no historico.')
      return
    }
    setError('')
    setIsSavingDeal(true)
    try {
      await onUpdatePipelineStage(stageTarget.id, stageTargetValue, stageResultForm)
      setStageTarget(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o pipeline.')
    } finally {
      setIsSavingDeal(false)
    }
  }

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
      <div className="pipeline-overview">
        <div className="pipeline-summary-card">
          <span>Pipeline real</span>
          <strong>{pipelineAberto.length}</strong>
          <small>{money(pipelineValor)} em aberto - forecast {money(pipelineForecast)}</small>
        </div>
        {pipelineStages.slice(0, 5).map((stage) => {
          const stageDeals = pipelineAberto.filter((item) => item.estagio === stage)
          return (
            <div className="pipeline-stage-card" key={stage}>
              <span>{pipelineStageLabel(stage)}</span>
              <strong>{stageDeals.length}</strong>
              <small>{money(stageDeals.reduce((sum, item) => sum + item.valorEstimado, 0))}</small>
            </div>
          )
        })}
      </div>
      {pipelineAberto.length === 0 && totalAtivas > 0 && (
        <div className="readiness warn">
          <strong>Pipeline real vazio com oportunidades ativas.</strong>
          <span>Selecione oportunidades priorizadas e crie deals para transformar a fila cacheada em funil comercial acompanhavel.</span>
          <button className="button primary compact-button" type="button" onClick={() => setSelectedIds(selectableIds.slice(0, 10))}>
            Selecionar primeiras oportunidades
          </button>
        </div>
      )}
      {pipelineAberto.length > 0 && (
        <div className="pipeline-kanban">
          {pipelineStages.slice(0, 5).map((stage) => {
            const stageDeals = pipelineAberto.filter((item) => item.estagio === stage).slice(0, 8)
            return (
              <div className="pipeline-column" key={stage}>
                <div className="pipeline-column-header">
                  <strong>{pipelineStageLabel(stage)}</strong>
                  <span>{stageDeals.length}</span>
                </div>
                {stageDeals.map((deal) => (
                  <div className="pipeline-card" key={deal.id}>
                    {editingDealId === deal.id ? (
                      <div className="pipeline-edit-form">
                        <input value={dealDraft.titulo} onChange={(event) => setDealDraft((current) => ({ ...current, titulo: event.target.value }))} />
                        <input type="number" value={dealDraft.valorEstimado} onChange={(event) => setDealDraft((current) => ({ ...current, valorEstimado: Number(event.target.value) }))} />
                        <input type="number" min={0} max={100} value={dealDraft.probabilidade} onChange={(event) => setDealDraft((current) => ({ ...current, probabilidade: Number(event.target.value) }))} />
                        <input type="date" value={dealDraft.previsaoFechamento} onChange={(event) => setDealDraft((current) => ({ ...current, previsaoFechamento: event.target.value }))} />
                        <select value={dealDraft.responsavelId} onChange={(event) => setDealDraft((current) => ({ ...current, responsavelId: event.target.value }))}>
                          <option value="">Sem responsavel</option>
                          {vendedores.map((usuario) => (
                            <option value={usuario.id} key={usuario.id}>{usuario.nome}</option>
                          ))}
                        </select>
                        <textarea value={dealDraft.observacao} onChange={(event) => setDealDraft((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observacao comercial" />
                        <div className="row-actions">
                          <button className="button primary compact-button" type="button" disabled={isSavingDeal} onClick={() => void saveDealEdit()}>
                            {isSavingDeal ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button className="button compact-button" type="button" onClick={() => setEditingDealId('')}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <strong>{deal.titulo}</strong>
                        <small>{deal.clienteNome || 'Cliente'}</small>
                        <span>{deal.responsavelNome || 'Sem responsavel'}</span>
                        <b>{deal.valorEstimado > 0 ? money(deal.valorEstimado) : `${deal.probabilidade}%`}</b>
                        <small>{deal.previsaoFechamento ? dateLabel(deal.previsaoFechamento) : 'Sem previsao'}</small>
                        <select
                          value={deal.estagio}
                          onChange={async (event) => {
                            const nextStage = event.target.value as OportunidadeEstagio
                            openStageResult(deal, nextStage)
                          }}
                        >
                          {pipelineStages.map((stageOption) => (
                            <option value={stageOption} key={stageOption}>{pipelineStageLabel(stageOption)}</option>
                          ))}
                        </select>
                        <input
                          className="compact-input"
                          value={lossReasons[deal.id] ?? ''}
                          onChange={(event) => setLossReasons((current) => ({ ...current, [deal.id]: event.target.value }))}
                          placeholder="Motivo se perdido"
                        />
                        <button className="button compact-button" type="button" onClick={() => startDealEdit(deal)}>Editar</button>
                      </>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && <div className="empty-state compact">Sem oportunidades.</div>}
              </div>
            )
          })}
        </div>
      )}
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
        <button
          className="button"
          type="button"
          disabled={selectedIds.length === 0 || isStartingSequence}
          onClick={async () => {
            setError('')
            setIsStartingSequence(true)
            try {
              const clienteIds = selectedOportunidades.map((oportunidade) => oportunidade.clienteId)
              const totalSequencias = await onStartSequence(clienteIds)
              setSelectedIds([])
              setError(`${totalSequencias} sequencias comerciais iniciadas. Clientes ja existentes na cadencia foram ignorados.`)
            } catch (exception) {
              setError(exception instanceof Error ? exception.message : 'Nao foi possivel iniciar a sequencia.')
            } finally {
              setIsStartingSequence(false)
            }
          }}
        >
          {isStartingSequence ? 'Iniciando...' : 'Sequencia 0/2/7/15'}
        </button>
        <button
          className="button primary"
          type="button"
          disabled={selectedOportunidades.length === 0 || isCreatingPipelineBatch}
          onClick={async () => {
            setError('')
            setIsCreatingPipelineBatch(true)
            let created = 0
            try {
              for (const oportunidade of selectedOportunidades) {
                if (oportunidade.bloqueada || createdPipeline.includes(oportunidade.id)) continue
                await onCreatePipeline(oportunidade)
                setCreatedPipeline((current) => [...new Set([...current, oportunidade.id])])
                created += 1
              }
              setSelectedIds([])
              setError(`${created} deals criados no pipeline real.`)
            } catch (exception) {
              setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar deals em lote.')
            } finally {
              setIsCreatingPipelineBatch(false)
            }
          }}
        >
          {isCreatingPipelineBatch ? 'Criando deals...' : 'Criar deals'}
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
                <span className="row-actions">
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
                    Tarefa
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={createdPipeline.includes(oportunidade.id)}
                    onClick={async () => {
                      setError('')
                      try {
                        await onCreatePipeline(oportunidade)
                        setCreatedPipeline((current) => [...current, oportunidade.id])
                      } catch (exception) {
                        setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar o deal.')
                      }
                    }}
                  >
                    {createdPipeline.includes(oportunidade.id) ? 'Deal criado' : 'Deal'}
                  </button>
                </span>
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
      {stageTarget && (
        <section className="floating-panel task-result-panel">
          <div className="panel-header">
            <div>
              <h2>Atualizar oportunidade</h2>
              <p>{stageTarget.clienteNome} - {pipelineStageLabel(stageTargetValue)}</p>
            </div>
            <button className="button" type="button" onClick={() => setStageTarget(null)}>Fechar</button>
          </div>
          <div className="task-form compact-form">
            <label className="span-2">
              Resumo da etapa
              <textarea value={stageResultForm.resumo} onChange={(event) => setStageResultForm({ ...stageResultForm, resumo: event.target.value })} />
            </label>
            {stageTargetValue === 'perdido' && (
              <label className="span-2">
                Motivo da perda
                <input value={stageResultForm.motivoPerda} onChange={(event) => setStageResultForm({ ...stageResultForm, motivoPerda: event.target.value })} placeholder="Ex.: preco, prazo, comprou concorrente" />
              </label>
            )}
            <label>
              Proxima data
              <input type="date" value={stageResultForm.dataProximaAcao} onChange={(event) => setStageResultForm({ ...stageResultForm, dataProximaAcao: event.target.value })} />
            </label>
            <label>
              Proxima acao
              <input value={stageResultForm.proximaAcao} onChange={(event) => setStageResultForm({ ...stageResultForm, proximaAcao: event.target.value })} />
            </label>
            <button className="button primary" type="button" disabled={isSavingDeal} onClick={submitStageResult}>
              {isSavingDeal ? 'Salvando...' : 'Salvar etapa'}
            </button>
          </div>
        </section>
      )}
    </section>
  )
}

type PipelineStageResultForm = {
  resumo: string
  motivoPerda: string
  proximaAcao: string
  dataProximaAcao: string
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
  onMediaChange,
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
  onMediaChange: (itemId: string, midia?: CatalogoItemMidia) => void
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
  const [mediaDraft, setMediaDraft] = useState({ titulo: '', imagemUrl: '', linkUrl: '' })
  const [isSavingMedia, setIsSavingMedia] = useState(false)

  async function openPriceHistory(item: CatalogoItem) {
    setSelectedItem(item)
    setMediaDraft({
      titulo: item.midia?.titulo ?? '',
      imagemUrl: item.midia?.imagemUrl ?? '',
      linkUrl: item.midia?.linkUrl ?? '',
    })
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

  async function saveCatalogMedia() {
    if (!selectedItem) return
    if (!mediaDraft.imagemUrl.trim()) {
      setHistoryError('Informe a URL da imagem do pneu antes de salvar.')
      return
    }

    setIsSavingMedia(true)
    setHistoryError('')
    try {
      const saved = await upsertCatalogoMidia({
        catalogoItemId: selectedItem.id,
        titulo: mediaDraft.titulo,
        imagemUrl: mediaDraft.imagemUrl,
        linkUrl: mediaDraft.linkUrl,
        ativo: true,
      })
      setSelectedItem({ ...selectedItem, midia: saved })
      onMediaChange(selectedItem.id, saved)
      setMediaDraft({
        titulo: saved.titulo ?? '',
        imagemUrl: saved.imagemUrl,
        linkUrl: saved.linkUrl ?? '',
      })
    } catch (exception) {
      setHistoryError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar a foto do catalogo.')
    } finally {
      setIsSavingMedia(false)
    }
  }

  async function uploadCatalogMedia(file?: File | null) {
    if (!selectedItem || !file) return
    if (!file.type.startsWith('image/')) {
      setHistoryError('Selecione um arquivo de imagem valido.')
      return
    }

    setIsSavingMedia(true)
    setHistoryError('')
    try {
      const publicUrl = await uploadCatalogoImagem({
        catalogoItemId: selectedItem.id,
        codigo: selectedItem.codigo,
        file,
      })
      setMediaDraft((current) => ({
        ...current,
        imagemUrl: publicUrl,
        titulo: current.titulo || selectedItem.descricao,
      }))
    } catch (exception) {
      setHistoryError(exception instanceof Error ? exception.message : 'Nao foi possivel enviar a imagem.')
    } finally {
      setIsSavingMedia(false)
    }
  }

  async function removeCatalogMedia() {
    if (!selectedItem) return
    if (!window.confirm('Remover a foto/link deste item do catalogo?')) return

    setIsSavingMedia(true)
    setHistoryError('')
    try {
      await deleteCatalogoMidia(selectedItem.id)
      setSelectedItem({ ...selectedItem, midia: undefined })
      onMediaChange(selectedItem.id, undefined)
      setMediaDraft({ titulo: '', imagemUrl: '', linkUrl: '' })
    } catch (exception) {
      setHistoryError(exception instanceof Error ? exception.message : 'Nao foi possivel remover a foto do catalogo.')
    } finally {
      setIsSavingMedia(false)
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
            <span>
              <strong>{item.descricao}</strong>
              <small>{item.subgrupo || item.grupo || 'Sem classificacao'}</small>
              {item.midia && <small className="catalog-media-marker">Foto/link cadastrados</small>}
            </span>
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
          <div className="catalog-media-editor">
            <div>
              <h3>Foto e link para proposta</h3>
              <p>Essa imagem aparece no PDF e fica clicavel para abrir o link do pneu.</p>
            </div>
            <div className="catalog-media-form">
              <label>
                Titulo da foto
                <input
                  value={mediaDraft.titulo}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, titulo: event.target.value }))}
                  placeholder="Ex.: Michelin X Multi Z"
                />
              </label>
              <label>
                URL da imagem
                <input
                  value={mediaDraft.imagemUrl}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, imagemUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
              <label>
                Link ao clicar
                <input
                  value={mediaDraft.linkUrl}
                  onChange={(event) => setMediaDraft((current) => ({ ...current, linkUrl: event.target.value }))}
                  placeholder="https://pagina-do-produto"
                />
              </label>
            </div>
            <div className="catalog-media-actions">
              {mediaDraft.imagemUrl.trim() && (
                <a className="catalog-media-preview" href={mediaDraft.linkUrl || mediaDraft.imagemUrl} target="_blank" rel="noreferrer">
                  <img src={mediaDraft.imagemUrl} alt={mediaDraft.titulo || selectedItem.descricao} />
                  <span>{mediaDraft.titulo || 'Abrir imagem'}</span>
                </a>
              )}
              <div className="inline-actions">
                <label className="button">
                  <FileUp size={16} /> Selecionar imagem
                  <input
                    className="visually-hidden-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      void uploadCatalogMedia(event.target.files?.[0])
                      event.currentTarget.value = ''
                    }}
                  />
                </label>
                <button className="button primary" type="button" onClick={() => void saveCatalogMedia()} disabled={isSavingMedia}>
                  {isSavingMedia ? 'Salvando...' : 'Salvar foto/link'}
                </button>
                {selectedItem.midia && (
                  <button className="button danger" type="button" onClick={() => void removeCatalogMedia()} disabled={isSavingMedia}>
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
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
  onCompleteWithResult,
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
  onCompleteWithResult: (tarefa: Tarefa, result: TaskCompletionForm) => Promise<void>
  onReschedule: (id: string, dataVencimento: string, motivo: string) => Promise<Tarefa>
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [completionTarget, setCompletionTarget] = useState<Tarefa | null>(null)
  const [isSavingCompletion, setIsSavingCompletion] = useState(false)
  const [completionForm, setCompletionForm] = useState<TaskCompletionForm>({
    canal: 'WhatsApp',
    resultado: 'respondeu',
    resumo: '',
    proximaAcao: '',
    dataProximaAcao: '',
  })
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
  const commercialTasks = abertas
    .filter((tarefa) => isCommercialFollowupTask(tarefa))
    .sort((a, b) => taskCommercialPriority(b) - taskCommercialPriority(a))
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
      id: 'comercial',
      label: 'Follow-up comercial',
      hint: 'atendimento e propostas',
      tarefas: commercialTasks,
      onClick: () => {
        onFilterChange('abertas')
        onOriginFilterChange('atendimento')
      },
    },
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
  const taskClientById = new Map(clientes.map((cliente) => [cliente.id, cliente]))

  function taskWhatsAppHref(tarefa: Tarefa) {
    const cliente = taskClientById.get(tarefa.clienteId)
    if (!cliente?.whatsapp) return ''
    const message = [
      `Ola, ${cliente.nome}. Tudo bem?`,
      `Aqui e da Capital Truck Center.`,
      `Estou retomando sobre: ${tarefa.titulo}.`,
      tarefa.descricao ? `Observacao: ${tarefa.descricao}` : '',
    ].filter(Boolean).join('\n\n')
    return `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(message)}`
  }

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

  async function quickReschedule(tarefa: Tarefa, days: number, motivo: string) {
    setError('')
    setReschedulingId(tarefa.id)
    try {
      const updated = await onReschedule(tarefa.id, addDays(new Date().toISOString().slice(0, 10), days), motivo)
      setError(`${updated.titulo} reagendada para ${dateLabel(updated.dataVencimento)}.`)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel reagendar a tarefa.')
    } finally {
      setReschedulingId('')
    }
  }

  function openCompletion(tarefa: Tarefa, resultado: TaskCompletionResult = 'respondeu') {
    setCompletionTarget(tarefa)
    setCompletionForm({
      canal: 'WhatsApp',
      resultado,
      resumo: tarefa.descricao ?? tarefa.titulo,
      proximaAcao: ['respondeu', 'comprar_depois', 'nao_respondeu'].includes(resultado) ? 'Retomar contato' : '',
      dataProximaAcao: ['respondeu', 'comprar_depois', 'nao_respondeu'].includes(resultado) ? addDays(new Date().toISOString().slice(0, 10), resultado === 'nao_respondeu' ? 2 : 1) : '',
    })
  }

  async function submitCompletion() {
    if (!completionTarget) return
    if (!completionForm.resumo.trim()) {
      setError('Informe um resumo do contato para salvar no historico.')
      return
    }
    setIsSavingCompletion(true)
    setError('')
    try {
      await onCompleteWithResult(completionTarget, completionForm)
      setCompletionTarget(null)
      setError('Resultado registrado no historico do cliente.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar o resultado.')
    } finally {
      setIsSavingCompletion(false)
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
              <option value="atendimento">Atendimento</option>
              <option value="cliente360">Ficha completa</option>
              <option value="cockpit">Sem proxima acao</option>
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
      <section className="task-commercial-panel">
        <div className="routine-queue-header">
          <div>
            <h2>Fila comercial</h2>
            <p>Retornos de atendimento, propostas e campanhas organizados por prioridade.</p>
          </div>
          <strong>{commercialTasks.length} abertas</strong>
        </div>
        <div className="task-commercial-grid">
          {commercialTasks.slice(0, 6).map((tarefa) => {
            const sla = taskSla(tarefa)
            return (
              <article className={sla.tone === 'danger' ? 'routine-card danger' : 'routine-card'} key={tarefa.id}>
                <span>
                  <strong>{tarefa.clienteNome}</strong>
                  <small>{tarefa.titulo} - {taskOriginLabel(tarefa.origem)} - {dateLabel(tarefa.dataVencimento)}</small>
                </span>
                <b>{tarefa.prioridade}</b>
                <div className="routine-actions">
                  <span className={`sla-pill ${sla.tone}`}>{sla.label}</span>
                  {taskWhatsAppHref(tarefa) && (
                    <a className="button" href={taskWhatsAppHref(tarefa)} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  )}
                  <button className="button" type="button" onClick={() => onOpenClient(tarefa.clienteId)}>Ficha</button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => onOpenBudgetEditor(tarefa.clienteId, { kind: 'tarefa', sourceId: tarefa.id, label: tarefa.titulo })}
                  >
                    Nova proposta
                  </button>
                  <button className="button primary" type="button" onClick={() => onComplete(tarefa.id)}>Concluir</button>
                  <button className="button" type="button" onClick={() => openCompletion(tarefa)}>
                    Registrar resultado
                  </button>
                </div>
              </article>
            )
          })}
          {commercialTasks.length === 0 && <div className="empty-state compact">Sem follow-ups comerciais nesta visao.</div>}
        </div>
      </section>
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
                {taskWhatsAppHref(activeExecutionTask) && (
                  <a className="button primary" href={taskWhatsAppHref(activeExecutionTask)} target="_blank" rel="noreferrer">
                    Abrir WhatsApp
                  </a>
                )}
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
                  disabled={reschedulingId === activeExecutionTask.id}
                  onClick={() => quickReschedule(activeExecutionTask, 1, 'Cliente ficou para retorno amanha')}
                >
                  Amanhã
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={reschedulingId === activeExecutionTask.id}
                  onClick={() => quickReschedule(activeExecutionTask, 3, 'Retorno comercial em 3 dias')}
                >
                  +3 dias
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
                <button className="button" type="button" onClick={() => openCompletion(activeExecutionTask)}>
                  Registrar resultado
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
                  {taskWhatsAppHref(tarefa) && (
                    <a className="button" href={taskWhatsAppHref(tarefa)} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  )}
                  <button className="button" onClick={() => onOpenClient(tarefa.clienteId)} type="button">
                    Ficha
                  </button>
                  <button
                    className="button"
                    onClick={() => onOpenBudgetEditor(tarefa.clienteId, { kind: 'tarefa', sourceId: tarefa.id, label: tarefa.titulo })}
                    type="button"
                  >
                    Nova proposta
                  </button>
                  <button className="button primary" onClick={() => onComplete(tarefa.id)} type="button">
                    Concluir
                  </button>
                  <button className="button" onClick={() => openCompletion(tarefa)} type="button">
                    Resultado
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
      {completionTarget && (
        <section className="floating-panel task-result-panel">
          <div className="panel-header">
            <div>
              <h2>Registrar resultado</h2>
              <p>{completionTarget.clienteNome} - {completionTarget.titulo}</p>
            </div>
            <button className="button" type="button" onClick={() => setCompletionTarget(null)}>Fechar</button>
          </div>
          <div className="quick-result-grid">
            {(['respondeu', 'pediu_orcamento', 'nao_respondeu', 'comprar_depois', 'sem_interesse', 'nao_contatar'] as TaskCompletionResult[]).map((result) => (
              <button
                className={completionForm.resultado === result ? 'button primary' : 'button'}
                type="button"
                key={result}
                onClick={() => setCompletionForm((current) => ({ ...current, resultado: result }))}
              >
                {taskCompletionResultLabel(result)}
              </button>
            ))}
          </div>
          <div className="task-form compact-form">
            <label>
              Canal
              <select value={completionForm.canal} onChange={(event) => setCompletionForm({ ...completionForm, canal: event.target.value as Interacao['canal'] })}>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Ligacao">Ligacao</option>
                <option value="Presencial">Presencial</option>
                <option value="Email">Email</option>
              </select>
            </label>
            <label>
              Proxima data
              <input type="date" value={completionForm.dataProximaAcao} onChange={(event) => setCompletionForm({ ...completionForm, dataProximaAcao: event.target.value })} />
            </label>
            <label className="span-2">
              Resumo do contato
              <textarea value={completionForm.resumo} onChange={(event) => setCompletionForm({ ...completionForm, resumo: event.target.value })} placeholder="Ex.: cliente pediu retorno com preco 30/60, aguardando aprovacao interna." />
            </label>
            <label className="span-2">
              Proxima acao
              <input value={completionForm.proximaAcao} onChange={(event) => setCompletionForm({ ...completionForm, proximaAcao: event.target.value })} placeholder="Ex.: Retomar cotacao com disponibilidade confirmada" />
            </label>
            <button className="button primary" type="button" disabled={isSavingCompletion} onClick={submitCompletion}>
              {isSavingCompletion ? 'Salvando...' : 'Salvar resultado e concluir'}
            </button>
          </div>
        </section>
      )}
    </section>
  )
}

type TaskCompletionResult = 'respondeu' | 'pediu_orcamento' | 'nao_respondeu' | 'comprar_depois' | 'sem_interesse' | 'nao_contatar'

type TaskCompletionForm = {
  canal: Interacao['canal']
  resultado: TaskCompletionResult
  resumo: string
  proximaAcao: string
  dataProximaAcao: string
}

function taskCompletionResultLabel(result: TaskCompletionResult) {
  const labels: Record<TaskCompletionResult, string> = {
    respondeu: 'Respondeu',
    pediu_orcamento: 'Pediu orcamento',
    nao_respondeu: 'Nao respondeu',
    comprar_depois: 'Comprar depois',
    sem_interesse: 'Sem interesse',
    nao_contatar: 'Nao contatar',
  }
  return labels[result]
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
  onUpdateClient,
  onAddInteraction,
  onOpenFullProfile,
  onOpenBudgetEditor,
}: {
  currentUser: SessaoUsuario
  cliente: Cliente
  interacoes: Interacao[]
  orcamentos: Orcamento[]
  vendasItens: VendaItem[]
  servicosItens: ServicoItem[]
  onUpdateClient: (clienteId: string, patch: Partial<Cliente>) => void
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onOpenFullProfile: () => void
  onOpenBudgetEditor: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
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
    openBudget ? `Proposta ${openBudget.status} de ${money(openBudget.valorTotal)} com validade ${dateLabel(openBudget.validade)}.` : '',
    openBudget && daysSince(openBudget.validade) > 0 ? 'Proposta vencida: fazer follow-up imediato.' : '',
    !cliente.whatsapp ? 'Cliente sem WhatsApp cadastrado.' : '',
    daysSince(cliente.ultimoContatoEm) > 60 ? 'Sem contato comercial ha mais de 60 dias.' : '',
    daysSince(cliente.ultimaCompraEm) > 180 ? 'Cliente em risco: mais de 180 dias sem compra.' : '',
  ].filter(Boolean)
  const whatsUrl = cliente.whatsapp
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(
        `Bom dia, ${cliente.responsavel ?? cliente.nome}. Aqui e da Capital Truck Center. Estou passando para ver se precisa cotar pneus ou algum servico.`,
      )}`
    : undefined
  const contactPresets = [
    {
      label: 'Pediu proposta',
      resultado: 'pediu orcamento',
      resumo: 'Cliente pediu proposta. Montar cotacao e retornar ainda hoje.',
      dataProximaAcao: addDays(new Date().toISOString(), 1),
    },
    {
      label: 'Respondeu',
      resultado: 'respondeu',
      resumo: 'Cliente respondeu. Continuar atendimento e registrar proximo passo.',
      dataProximaAcao: addDays(new Date().toISOString(), 2),
    },
    {
      label: 'Nao respondeu',
      resultado: 'sem resposta',
      resumo: 'Contato realizado, cliente ainda nao respondeu.',
      dataProximaAcao: addDays(new Date().toISOString(), 3),
    },
    {
      label: 'Comprar depois',
      resultado: 'pediu retorno depois',
      resumo: 'Cliente pediu retorno em outro momento.',
      dataProximaAcao: addDays(new Date().toISOString(), 15),
    },
  ]
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
          <Phone size={16} /> Registrar contato
        </button>
        <button className="button primary" type="button" onClick={onOpenBudgetEditor}>
          <WalletCards size={16} /> Proposta
        </button>
        <button className="button" type="button" onClick={onOpenFullProfile}>
          <ClipboardList size={16} /> Ficha completa
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
          <div className="contact-form-header span-2">
            <strong>Registrar contato</strong>
            <small>Salve em poucos segundos o que aconteceu e a proxima acao.</small>
          </div>
          <div className="contact-preset-grid span-2">
            {contactPresets.map((preset) => (
              <button
                className="button"
                key={preset.label}
                type="button"
                onClick={() => setForm((current) => ({
                  ...current,
                  resultado: preset.resultado,
                  resumo: current.resumo || preset.resumo,
                  dataProximaAcao: current.dataProximaAcao || preset.dataProximaAcao,
                }))}
              >
                {preset.label}
              </button>
            ))}
          </div>
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
              <option>sem resposta</option>
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
          <button className="button primary" type="submit">Salvar contato e follow-up</button>
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
              <h3>Ficha completa</h3>
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
  const [prazoEntrega, setPrazoEntrega] = useState('')
  const [prazoExecucao, setPrazoExecucao] = useState('')
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
  const commercialChecks = quoteCommercialChecks(validItems, catalogo, regrasDesconto)
  const serviceBundles = useMemo(() => buildQuoteServiceBundles(catalogo, items), [catalogo, items])
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

  function addServiceBundle(bundle: QuoteServiceBundle) {
    setItems((current) => [
      ...current,
      ...bundle.items.map((catalogoItem) => ({
        catalogoItemId: catalogoItem.id,
        codigo: catalogoItem.codigo,
        tipo: catalogoItem.tipo,
        descricao: catalogoItem.descricao,
        apresentacao: 'complementar' as const,
        quantidade: quoteBundleItemQuantity(catalogoItem, bundle.baseQuantity),
        valorUnitario: catalogoItem.preco,
        descontoPercentual: 0,
        observacao: bundle.label,
      })),
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
    const operationalTerms = [
      prazoEntrega.trim() ? `Prazo de entrega: ${prazoEntrega.trim()}.` : '',
      prazoExecucao.trim() ? `Prazo de execucao: ${prazoExecucao.trim()}.` : '',
    ].filter(Boolean).join('\n')
    const finalObservation = [observacao.trim(), operationalTerms, originNote].filter(Boolean).join('\n\n')
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
        enviadoPor: shouldSend ? currentUser.id : undefined,
        enviadoEm: shouldSend ? new Date().toISOString() : undefined,
        proximoFollowupEm: shouldSend ? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) : previsaoFechamento || undefined,
        prazoEntrega: prazoEntrega.trim() || undefined,
        prazoExecucao: prazoExecucao.trim() || undefined,
        observacao: finalObservation,
        itens: validItems,
        condicoes: quoteConditionInputs(paymentScenarios),
        versaoMensagem: quoteMessage,
        versaoOrigem: originContext.label,
      })
      await onCreateTask({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        titulo: shouldSend ? 'Follow-up de proposta enviada' : 'Follow-up da proposta',
        descricao: `${shouldSend ? 'Confirmar recebimento da proposta' : 'Retornar proposta'} ${created.id.slice(0, 8)} de ${money(created.valorTotal)}.`,
        dataVencimento: previsaoFechamento || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        prioridade: needsApproval ? 90 : 80,
        origem: shouldSend ? 'orcamento:envio' : 'orcamento:followup',
      })
      if (shouldSend && waUrl) window.open(waUrl, '_blank', 'noopener,noreferrer')
      setFeedback(
        `Proposta ${created.id.slice(0, 8)} ${shouldSend ? 'criada, marcada como enviada e com follow-up programado' : 'salva com follow-up programado'} para ${dateLabel(previsaoFechamento || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10))}. Total: ${money(created.valorTotal)}.`,
      )
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel criar a proposta.')
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
            <MessageCircle size={16} /> Abrir WhatsApp
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
              Prazo entrega
              <input value={prazoEntrega} onChange={(event) => setPrazoEntrega(event.target.value)} placeholder="Ex.: 2 dias apos confirmacao" />
            </label>
            <label>
              Prazo execucao
              <input value={prazoExecucao} onChange={(event) => setPrazoExecucao(event.target.value)} placeholder="Ex.: montagem sob agendamento" />
            </label>
          </div>
          <div className="quote-preset-row">
            <span>Prazos rapidos</span>
            {quoteDeliveryPresets.map((preset) => (
              <button className="button" type="button" key={`entrega-${preset}`} onClick={() => setPrazoEntrega(preset)}>
                Entrega: {preset}
              </button>
            ))}
            {quoteExecutionPresets.map((preset) => (
              <button className="button" type="button" key={`execucao-${preset}`} onClick={() => setPrazoExecucao(preset)}>
                Execucao: {preset}
              </button>
            ))}
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
          {commercialChecks.length > 0 && (
            <div className="quote-commercial-checks">
              <div>
                <strong>Controle comercial dos itens</strong>
                <small>Validacao rapida de catalogo, preco, estoque e desconto antes de enviar.</small>
              </div>
              <div className="commercial-check-list">
                {commercialChecks.map((check) => (
                  <div className={`commercial-check ${check.tone}`} key={check.id}>
                    <span className="status-pill">{check.status}</span>
                    <strong>{check.label}</strong>
                    <small>{check.detail}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="quote-suggestions">
            <strong>Complementares sugeridos</strong>
            {serviceBundles.length > 0 && (
              <div className="quote-bundle-grid">
                {serviceBundles.map((bundle) => (
                  <button className="quote-bundle-button" type="button" key={bundle.id} onClick={() => addServiceBundle(bundle)}>
                    <strong>{bundle.label}</strong>
                    <small>{bundle.detail}</small>
                  </button>
                ))}
              </div>
            )}
            {isLoadingSuggestions && <small>Buscando no historico de vendas...</small>}
            {!isLoadingSuggestions && catalogSuggestions.length === 0 && serviceBundles.length === 0 && <small>Selecione um item do catalogo para ver complementares baseados no historico.</small>}
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
          <div className={`proposal-preview ${quotePreviewDensityClass(validItems.length, paymentScenarios.length)}`} ref={proposalPreviewRef}>
            <QuoteProposalPreview
              cliente={cliente}
              itens={validItems}
              catalogo={catalogo}
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
          <small className="quote-save-hint">
            A proposta so entra no historico depois de salvar. Ao enviar pelo WhatsApp, o sistema cria um follow-up automatico.
          </small>
          <button className="button" type="submit" value="draft" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar proposta'}
          </button>
          <button className="button primary" type="submit" value="send" disabled={isSaving || approvalWarnings.length > 0 || !waUrl}>
            {isSaving ? 'Salvando...' : 'Salvar e abrir WhatsApp'}
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

function quoteCommercialChecks(items: OrcamentoItemInput[], catalogo: CatalogoItem[], regrasDesconto: CatalogoRegraDesconto[] = []) {
  return items.map((item, index) => {
    const catalogItem = item.catalogoItemId ? catalogo.find((entry) => entry.id === item.catalogoItemId) : undefined
    const regra = catalogItem ? bestDiscountRule(catalogItem, regrasDesconto) : undefined
    const approvalLimit = regra?.requerAprovacaoAcimaDe ?? catalogItem?.descontoMaximo
    const discount = item.descontoPercentual ?? 0
    const expectedPrice = catalogItem?.preco
    const priceDiff = expectedPrice ? ((item.valorUnitario - expectedPrice) / expectedPrice) * 100 : 0
    const id = `${item.catalogoItemId ?? item.descricao}-${index}`

    if (!catalogItem) {
      return {
        id,
        tone: 'warning',
        status: 'Manual',
        label: item.descricao || `Item ${index + 1}`,
        detail: 'Item sem vinculo com catalogo. Confira codigo, preco vigente e margem antes de enviar.',
      }
    }
    if (!catalogItem.ativo) {
      return {
        id,
        tone: 'danger',
        status: 'Inativo',
        label: catalogItem.descricao,
        detail: 'Item inativo no catalogo. Revise antes de manter na proposta.',
      }
    }
    if (catalogItem.preco <= 0) {
      return {
        id,
        tone: 'danger',
        status: 'Sem preco',
        label: catalogItem.descricao,
        detail: 'Catalogo nao possui preco vigente valido para este item.',
      }
    }
    if (approvalLimit !== undefined && discount > approvalLimit) {
      return {
        id,
        tone: 'danger',
        status: 'Aprovar',
        label: catalogItem.descricao,
        detail: `Desconto de ${discount}% acima do limite ${approvalLimit}%${regra ? ` da regra ${regra.nome}` : ''}.`,
      }
    }
    if (Math.abs(priceDiff) >= 2) {
      return {
        id,
        tone: 'warning',
        status: 'Preco alterado',
        label: catalogItem.descricao,
        detail: `Preco usado ${money(item.valorUnitario)} difere do catalogo ${money(catalogItem.preco)}.`,
      }
    }
    if (catalogItem.estoque !== undefined && catalogItem.estoque <= 0) {
      return {
        id,
        tone: 'warning',
        status: 'Estoque',
        label: catalogItem.descricao,
        detail: 'Sem estoque informado no catalogo. Confirmar disponibilidade antes da ordem de compra.',
      }
    }

    return {
      id,
      tone: 'ok',
      status: 'Dentro',
      label: catalogItem.descricao,
      detail: regra
        ? `Preco e desconto dentro da regra ${regra.nome}.`
        : 'Preco e desconto dentro dos limites cadastrados.',
    }
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

const quoteStandardTerms = [
  'Valores sujeitos a confirmacao de disponibilidade antes da emissao da ordem de compra.',
  'Prazos de entrega e execucao dependem de estoque, agenda e confirmacao comercial.',
  'Condicoes de pagamento sao validas apenas para esta proposta.',
  'Garantia conforme politica do fabricante e da Capital Truck Center.',
]

const quoteDeliveryPresets = ['Confirmar disponibilidade', '2 dias apos confirmacao', 'Entrega sob consulta']
const quoteExecutionPresets = ['Sob agendamento', 'Montagem no ato da entrega', 'Execucao na loja']

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
    if (hasSeparatedBlocks && paymentScenarios.length > 0) {
      lines.push('')
      lines.push('ðŸ’³ *CondiÃ§Ãµes deste bloco*')
      lines[lines.length - 1] = '💳 *Condições deste bloco*'
      paymentScenarios.forEach((scenario) => {
        lines.push(`- ${quoteConditionLabel(scenario.label)}: ${quoteBlockConditionLabel(block, scenario)}`)
      })
    }
    lines.push('')
  })

  if (!hasSeparatedBlocks) {
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
  } else if (hasAlternatives) {
    lines.push('As alternativas sao opcoes de escolha e nao entram no subtotal principal do bloco.')
  }
  if (observacao?.trim()) lines.push('', '📝 *Observações*', observacao.trim())
  lines.push('', '⚠️ Antes da emissão da ordem de compra, solicite a confirmação de disponibilidade, prazo e condições.')
  lines.push('', 'Posso confirmar disponibilidade para você?')
  const closingQuestion = lines.pop()
  const messageLines = lines.filter((line) => !line.toLowerCase().includes('ordem de compra'))
  messageLines.push('', '📌 *Condições gerais*')
  quoteStandardTerms.forEach((term) => messageLines.push(`- ${term}`))
  if (closingQuestion) messageLines.push('', closingQuestion)
  return messageLines.join('\n')
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

function quoteForecastWeight(status: Orcamento['status']) {
  const weights: Record<Orcamento['status'], number> = {
    aberto: 0.35,
    aguardando_aprovacao: 0.25,
    enviado: 0.55,
    negociando: 0.75,
    ganho: 1,
    perdido: 0,
  }
  return weights[status] ?? 0
}

function quotePreviewDensityClass(itemCount: number, conditionCount: number) {
  const weight = itemCount + Math.ceil(conditionCount / 2)
  if (weight >= 18) return 'proposal-ultra-compact'
  if (weight >= 10) return 'proposal-compact'
  return ''
}

function forecastItemLabel(item: OrcamentoItem) {
  const normalized = item.descricao.replace(/\s+/g, ' ').trim()
  const medida = normalized.match(/\b\d{3}\/\d{2}\s*R?\s*\d{2}(?:[.,]\d)?\b/i)?.[0]
  if (medida) return medida.toUpperCase().replace(',', '.')
  return normalized.split(' ').slice(0, 5).join(' ') || 'Item sem descricao'
}

function quotePdfFileName(clienteNome: string, date?: string) {
  const datePart = quotePdfDatePart(date)
  const safeCliente = clienteNome
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return `Proposta - ${safeCliente || 'Cliente'} - ${datePart}`
}

function quotePdfDatePart(date?: string) {
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.slice(0, 10).split('-')
    return `${day}-${month}-${year}`
  }
  return new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const content = [
    headers.map(csvEscape).join(';'),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';')),
  ].join('\r\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

async function downloadElementPdf(element: HTMLElement | null, filename: string) {
  if (!element) return
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
    const pdfLinks = collectPdfLinks(exportElement, canvas)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2
    const imageWidth = contentWidth
    const pageCanvasHeight = Math.floor((contentHeight * canvas.width) / imageWidth)
    const naturalImageHeight = (canvas.height * imageWidth) / canvas.width

    if (naturalImageHeight <= contentHeight * 1.18) {
      const fittedWidth = naturalImageHeight > contentHeight
        ? Math.min(imageWidth, (contentHeight * canvas.width) / canvas.height)
        : imageWidth
      const fittedHeight = (canvas.height * fittedWidth) / canvas.width
      const fittedX = margin + (contentWidth - fittedWidth) / 2
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', fittedX, margin, fittedWidth, fittedHeight)
      addPdfLinksForFullPage(pdf, pdfLinks, canvas, fittedX, margin, fittedWidth, fittedHeight)
      pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
      return
    }

    let sourceY = 0
    let pageIndex = 0

    while (sourceY < canvas.height) {
      const remaining = canvas.height - sourceY
      if (remaining < 24) break
      const maxSliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY)
      const sliceHeight = findPdfSliceHeight(canvas, sourceY, maxSliceHeight, exportElement)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeight
      const context = pageCanvas.getContext('2d')
      if (!context) break
      context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
      if (pageIndex > 0) pdf.addPage()
      const sliceImageHeight = (sliceHeight * imageWidth) / canvas.width
      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, imageWidth, Math.min(sliceImageHeight, contentHeight))
      addPdfLinksForSlice(pdf, pdfLinks, canvas, sourceY, sliceHeight, margin, margin, imageWidth, sliceImageHeight)
      sourceY += sliceHeight
      pageIndex += 1
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
  } finally {
    exportStage.remove()
  }
}

type PdfLinkRect = {
  href: string
  x: number
  y: number
  width: number
  height: number
}

function collectPdfLinks(exportElement: HTMLElement, canvas: HTMLCanvasElement): PdfLinkRect[] {
  const anchors = Array.from(exportElement.querySelectorAll<HTMLAnchorElement>('a[href][data-pdf-link="true"]'))
  if (!anchors.length) return []

  const elementRect = exportElement.getBoundingClientRect()
  const scaleX = canvas.width / Math.max(exportElement.scrollWidth, 1)
  const scaleY = canvas.height / Math.max(exportElement.scrollHeight, 1)

  return anchors.flatMap((anchor) => {
    const href = anchor.href
    if (!href || href.startsWith('javascript:')) return []
    const rect = anchor.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return []
    return [{
      href,
      x: (rect.left - elementRect.left) * scaleX,
      y: (rect.top - elementRect.top) * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    }]
  })
}

function addPdfLinksForFullPage(
  pdf: jsPDF,
  links: PdfLinkRect[],
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  links.forEach((link) => {
    pdf.link(
      x + (link.x / canvas.width) * width,
      y + (link.y / canvas.height) * height,
      (link.width / canvas.width) * width,
      (link.height / canvas.height) * height,
      { url: link.href },
    )
  })
}

function addPdfLinksForSlice(
  pdf: jsPDF,
  links: PdfLinkRect[],
  canvas: HTMLCanvasElement,
  sourceY: number,
  sliceHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sliceEnd = sourceY + sliceHeight
  links.forEach((link) => {
    const linkTop = link.y
    const linkBottom = link.y + link.height
    const overlapTop = Math.max(linkTop, sourceY)
    const overlapBottom = Math.min(linkBottom, sliceEnd)
    if (overlapBottom <= overlapTop) return

    pdf.link(
      x + (link.x / canvas.width) * width,
      y + ((overlapTop - sourceY) / sliceHeight) * height,
      (link.width / canvas.width) * width,
      ((overlapBottom - overlapTop) / sliceHeight) * height,
      { url: link.href },
    )
  })
}

function findPdfSliceHeight(
  canvas: HTMLCanvasElement,
  sourceY: number,
  maxSliceHeight: number,
  exportElement?: HTMLElement,
) {
  if (sourceY + maxSliceHeight >= canvas.height) return maxSliceHeight
  const protectedSliceHeight = findProtectedPdfSliceHeight(canvas, sourceY, maxSliceHeight, exportElement)
  if (protectedSliceHeight) return protectedSliceHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return maxSliceHeight

  const minSliceHeight = Math.floor(maxSliceHeight * 0.68)
  const start = sourceY + maxSliceHeight - 1
  const end = sourceY + minSliceHeight
  const sampleStep = Math.max(12, Math.floor(canvas.width / 80))

  for (let y = start; y >= end; y -= 3) {
    const row = context.getImageData(0, y, canvas.width, 1).data
    let whiteSamples = 0
    let totalSamples = 0
    for (let x = 0; x < canvas.width; x += sampleStep) {
      const index = x * 4
      const alpha = row[index + 3]
      const red = row[index]
      const green = row[index + 1]
      const blue = row[index + 2]
      totalSamples += 1
      if (alpha < 16 || (red > 242 && green > 242 && blue > 242)) whiteSamples += 1
    }
    if (totalSamples > 0 && whiteSamples / totalSamples > 0.96) {
      return Math.max(24, y - sourceY)
    }
  }

  return maxSliceHeight
}

function findProtectedPdfSliceHeight(
  canvas: HTMLCanvasElement,
  sourceY: number,
  maxSliceHeight: number,
  exportElement?: HTMLElement,
) {
  if (!exportElement) return null
  const protectedBlocks = Array.from(exportElement.querySelectorAll<HTMLElement>('[data-pdf-keep-together="true"]'))
  if (protectedBlocks.length === 0) return null

  const scaleY = canvas.height / Math.max(exportElement.scrollHeight, 1)
  const pageStart = sourceY
  const pageEnd = sourceY + maxSliceHeight
  const minSliceHeight = Math.floor(maxSliceHeight * 0.45)

  for (const block of protectedBlocks) {
    const blockTop = Math.floor(block.offsetTop * scaleY)
    const blockBottom = Math.ceil((block.offsetTop + block.offsetHeight) * scaleY)
    const blockHeight = blockBottom - blockTop
    const startsInsidePage = blockTop > pageStart + 8 && blockTop < pageEnd - 8
    const wouldBeSplit = startsInsidePage && blockBottom > pageEnd
    const canMoveWholeBlock = blockHeight < maxSliceHeight * 0.92 && blockTop - pageStart >= minSliceHeight
    if (wouldBeSplit && canMoveWholeBlock) {
      return Math.max(24, blockTop - pageStart - 8)
    }
  }

  return null
}

async function downloadQuotePdf(element: HTMLElement | null, clienteNome: string, date?: string) {
  await downloadElementPdf(element, `${quotePdfFileName(clienteNome, date)}.pdf`)
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
  catalogo = [],
  total,
  validade,
  condicoes,
  observacao,
  vendedorNome,
}: {
  cliente: Cliente
  itens: OrcamentoItemInput[]
  catalogo?: CatalogoItem[]
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
            <section className={`proposal-block ${block.kind}`} data-pdf-keep-together="true" key={`${block.title}-${blockIndex}`}>
              <div className="proposal-block-title">
                <strong>{blockTitle}</strong>
                <span>{quoteBlockHint(block.kind)}</span>
              </div>
              {mainItems.length > 0 && (
                <div className="proposal-lines">
                  {mainItems.map((item, index) => (
                    <div key={`${item.descricao}-${index}`}>
                      <ProposalLineContent item={item} index={index} catalogo={catalogo} />
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
                      <ProposalLineContent item={item} index={index} catalogo={catalogo} alternativeLabel={`Opcao ${String.fromCharCode(65 + index)}`} />
                      <strong>{money(item.valorTotal ?? 0)}</strong>
                    </div>
                  ))}
                </div>
              )}
              <div className="proposal-subtotal">
                <span>{mainItems.length > 0 ? 'Subtotal do bloco' : 'Faixa das opcoes'}</span>
                <strong>{quoteBlockTotalLabel(block)}</strong>
              </div>
              {hasSeparatedBlocks && condicoes && condicoes.length > 0 && (
                <div className="proposal-block-conditions">
                  <strong>Condicoes deste bloco</strong>
                  {condicoes.map((scenario) => (
                    <div key={`${block.title}-${scenario.label}`}>
                      <span>{quoteConditionLabel(scenario.label)}</span>
                      <b>{quoteBlockConditionLabel(block, scenario)}</b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
        {itens.length === 0 && <span className="muted">Adicione itens para montar a proposta.</span>}
      </div>
      {!hasSeparatedBlocks && (
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
      {!hasSeparatedBlocks && condicoes && condicoes.length > 0 && (
        <div className="proposal-conditions">
          {condicoes.map((scenario) => (
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
      <div className="proposal-terms">
        <strong>Condicoes gerais</strong>
        <ul>
          {quoteStandardTerms.map((term) => <li key={term}>{term}</li>)}
        </ul>
      </div>
      <div className="proposal-footer">
        <strong>Capital Truck Center</strong>
        <span>Confirme disponibilidade, prazo e condicoes antes da ordem de compra.</span>
      </div>
    </>
  )
}

function ProposalLineContent({
  item,
  index,
  catalogo,
  alternativeLabel,
}: {
  item: OrcamentoItemInput
  index: number
  catalogo: CatalogoItem[]
  alternativeLabel?: string
}) {
  const media = quoteMediaForItem(item, catalogo)
  const label = alternativeLabel ?? `${index + 1}.`
  const link = media?.linkUrl || media?.imagemUrl

  return (
    <span className={media ? 'proposal-line-content with-media' : 'proposal-line-content'}>
      {media && link && (
        <a
          className="proposal-item-media"
          href={link}
          target="_blank"
          rel="noreferrer"
          data-pdf-link="true"
          title={media.titulo || item.descricao}
        >
          <img
            src={media.imagemUrl}
            alt={media.titulo || item.descricao}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </a>
      )}
      <span>
        {label} {formatQuantity(item.quantidade)}x {item.descricao}
        {media && <small>{media.titulo || 'Imagem do produto clicavel'}</small>}
      </span>
    </span>
  )
}

function quoteMediaForItem(item: OrcamentoItemInput, catalogo: CatalogoItem[]) {
  if (item.tipo !== 'produto') return undefined
  const catalogItem = item.catalogoItemId
    ? catalogo.find((entry) => entry.id === item.catalogoItemId)
    : catalogo.find((entry) => entry.tipo === item.tipo && entry.codigo === item.codigo)
  return catalogItem?.midia
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

type QuoteServiceBundle = {
  id: string
  label: string
  detail: string
  baseQuantity: number
  items: CatalogoItem[]
}

function buildQuoteServiceBundles(catalogo: CatalogoItem[], quoteItems: OrcamentoItemInput[]): QuoteServiceBundle[] {
  const lastTire = [...quoteItems]
    .reverse()
    .find((item) => item.tipo === 'produto' && normalizeTextForMatch(`${item.descricao} ${item.codigo ?? ''}`).includes('pneu'))
  if (!lastTire) return []

  const services = catalogo.filter((item) => item.ativo && item.tipo === 'servico' && item.preco > 0)
  const baseQuantity = Math.max(1, Math.round(Number(lastTire.quantidade || 1)))
  const findService = (terms: string[]) => services.find((service) => {
    const text = normalizeTextForMatch(`${service.codigo} ${service.descricao} ${service.grupo ?? ''}`)
    return terms.some((term) => text.includes(term))
  })
  const bundleDefs = [
    {
      id: 'montagem-completa',
      label: 'Pacote montagem completa',
      terms: [['montagem', 'troca de pneu'], ['balanceamento'], ['alinhamento']],
    },
    {
      id: 'alinhamento-balanceamento',
      label: 'Alinhamento + balanceamento',
      terms: [['alinhamento'], ['balanceamento']],
    },
    {
      id: 'geometria',
      label: 'Revisao de geometria',
      terms: [['alinhamento'], ['cambagem']],
    },
  ]

  return bundleDefs
    .map((bundle) => {
      const items = uniqueCatalogItems(bundle.terms.map(findService).filter((item): item is CatalogoItem => Boolean(item)))
      return {
        id: bundle.id,
        label: bundle.label,
        baseQuantity,
        detail: items.length ? items.map((item) => item.descricao).join(' + ') : 'Servicos nao encontrados no catalogo',
        items,
      }
    })
    .filter((bundle) => bundle.items.length > 0)
}

function quoteBundleItemQuantity(item: CatalogoItem, baseQuantity: number) {
  const text = normalizeTextForMatch(item.descricao)
  if (text.includes('alinhamento') || text.includes('cambagem')) return 1
  return baseQuantity
}

function uniqueCatalogItems(items: CatalogoItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function normalizeTextForMatch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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
    enviado: 'Aguardando resposta',
    respondeu: 'Respondeu',
    nao_respondeu: 'Nao respondeu',
    comprar_depois: 'Comprar depois',
    virou_orcamento: 'Virou orcamento',
    ganhou: 'Ganhou',
    perdido: 'Perdido',
    nao_contatar: 'Nao contatar',
  }
  return labels[status] ?? status
}

function campaignRoutinePriority(status: CampanhaEnvioStatus) {
  if (status === 'respondeu') return 170
  if (status === 'virou_orcamento') return 165
  if (status === 'enviado') return 142
  if (status === 'pendente') return 118
  if (status === 'comprar_depois') return 88
  if (status === 'nao_respondeu') return 82
  return 55
}

function campaignRoutineLabel(status: CampanhaEnvioStatus) {
  const labels: Record<CampanhaEnvioStatus, string> = {
    pendente: 'Enviar campanha',
    enviado: 'Aguardando resposta',
    respondeu: 'Responder agora',
    nao_respondeu: 'Retentar contato',
    comprar_depois: 'Comprar depois',
    virou_orcamento: 'Montar proposta',
    ganhou: 'Pos-venda',
    perdido: 'Registrar perda',
    nao_contatar: 'Nao contatar',
  }
  return labels[status]
}

function campaignRoutineReason(status: CampanhaEnvioStatus) {
  const labels: Record<CampanhaEnvioStatus, string> = {
    pendente: 'Mensagem ainda nao foi marcada como enviada.',
    enviado: 'Mensagem ja foi enviada. Abra a conversa e registre o resultado quando houver retorno.',
    respondeu: 'Cliente respondeu campanha e precisa de retorno humano.',
    nao_respondeu: 'Contato ficou sem resposta e pode precisar de nova tentativa.',
    comprar_depois: 'Cliente demonstrou abertura, mas pediu retorno futuro.',
    virou_orcamento: 'Cliente pediu cotacao ou demonstrou interesse em proposta.',
    ganhou: 'Venda ganha pode precisar de pos-venda.',
    perdido: 'Oportunidade perdida deve ter motivo registrado.',
    nao_contatar: 'Cliente bloqueado para campanhas.',
  }
  return labels[status]
}

function contactTypeLabel(tipo?: string) {
  const labels: Record<string, string> = {
    responsavel: 'Responsavel',
    motorista: 'Motorista',
    operacional: 'Operacional',
    cadastro: 'Cadastro',
  }
  return tipo ? labels[tipo] ?? tipo : 'Contato'
}

function numberLabel(value: number) {
  return value.toLocaleString('pt-BR')
}

const PATIO_SUSPICIOUS_KM_MEDIA = 1000

function isSuspiciousPatioKmMedia(media?: number) {
  return Boolean(media && media > PATIO_SUSPICIOUS_KM_MEDIA)
}

function patioQuantidadeLabel(value?: number | null) {
  if (!value || value <= 0) return 'Nao informada'
  return numberLabel(value)
}

function dateTimeLabel(date?: string) {
  if (!date) return 'Sem registro'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Sem registro'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function waMeUrl(phone?: string, message?: string) {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) digits = digits.slice(2)
  if (digits.length > 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) {
    const localNumber = digits.slice(2)
    if (/^[6789]/.test(localNumber)) digits = `${digits.slice(0, 2)}9${localNumber}`
  }
  if (![10, 11].includes(digits.length)) return ''
  return `https://wa.me/55${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}

function areaLabel(area?: string) {
  const labels: Record<string, string> = {
    borracharia: 'Borracharia',
    alinhamento: 'Alinhamento',
    manutencao: 'Manutencao mecanica',
  }
  return area ? labels[area] ?? area : 'Area'
}

function buildPatioDiagnostico(input: {
  numEixos: number
  eixosAlinhar: Record<number, boolean>
  puxando: string
  volante: string
  vibracao: string
  observacaoGeral: string
}) {
  const eixos = Array.from({ length: Math.min(9, Math.max(2, input.numEixos || 2)) }, (_, index) => index + 1)
    .filter((eixo) => input.eixosAlinhar[eixo])
  const lines = [
    eixos.length > 0 ? `Alinhamento solicitado nos eixos: ${eixos.join(', ')}.` : 'Nenhum eixo marcado para alinhamento.',
    `Caminhao puxando: ${input.puxando}.`,
    `Volante: ${input.volante}.`,
    `Vibracao: ${input.vibracao}.`,
  ]
  if (input.observacaoGeral.trim()) lines.push(`Observacao: ${input.observacaoGeral.trim()}`)
  return lines.join('\n')
}

function PatioEntrada({
  query,
  results,
  isLoading,
  catalogoServicos,
  onQueryChange,
  onConsultPlate,
  onRegisterEntrada,
  onEditVehicle,
  onOpenClient,
  title = 'Entrada de veiculo',
  description = 'Busque por placa, cliente ou motorista usando a base ja sincronizada do patio.',
  allowRegister = true,
}: {
  query: string
  results: PatioVeiculoBusca[]
  isLoading: boolean
  catalogoServicos: PatioCatalogoServico[]
  onQueryChange: (query: string) => void
  onConsultPlate?: (placa: string) => Promise<{ placa: string; modelo: string; anoModelo?: number | string | null }>
  onRegisterEntrada?: (input: PatioEntradaInput) => Promise<void>
  onEditVehicle?: (vehicle: PatioVeiculoBusca) => void
  onOpenClient: (clienteId: string) => void | Promise<void>
  title?: string
  description?: string
  allowRegister?: boolean
}) {
  const [selected, setSelected] = useState<PatioVeiculoBusca | undefined>()
  const [quilometragem, setQuilometragem] = useState('')
  const [nomeMotorista, setNomeMotorista] = useState('')
  const [contatoMotorista, setContatoMotorista] = useState('')
  const [servicos, setServicos] = useState<PatioEntradaServicoInput[]>([])
  const [servicoNome, setServicoNome] = useState('')
  const [servicoArea, setServicoArea] = useState<PatioEntradaServicoInput['area']>('borracharia')
  const [servicoQuantidade, setServicoQuantidade] = useState('1')
  const [servicoObservacao, setServicoObservacao] = useState('')
  const [lastAddedServiceName, setLastAddedServiceName] = useState('')
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [numEixos, setNumEixos] = useState('2')
  const [eixosAlinhar, setEixosAlinhar] = useState<Record<number, boolean>>({})
  const [puxando, setPuxando] = useState('Nao')
  const [volante, setVolante] = useState('Normal')
  const [vibracao, setVibracao] = useState('Nao')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [plateConsultResult, setPlateConsultResult] = useState<{ placa: string; modelo: string; anoModelo?: number | string | null } | undefined>()
  const [isConsultingPlate, setIsConsultingPlate] = useState(false)
  const [plateConsultError, setPlateConsultError] = useState('')
  const catalogoDaArea = catalogoServicos.filter((servico) => servico.area === servicoArea)
  const areasEntrada: Array<{ area: PatioEntradaServicoInput['area']; label: string }> = [
    { area: 'borracharia', label: 'Borracharia' },
    { area: 'alinhamento', label: 'Alinhamento' },
    { area: 'manutencao', label: 'Mecanica' },
  ]
  const diagnostico = buildPatioDiagnostico({
    numEixos: Number(numEixos) || 2,
    eixosAlinhar,
    puxando,
    volante,
    vibracao,
    observacaoGeral,
  })

  useEffect(() => {
    if (!selected) return
    setQuilometragem(selected.ultimoKm ? String(selected.ultimoKm) : '')
    setNomeMotorista(selected.nomeMotorista ?? selected.contatoNome ?? '')
    setContatoMotorista(selected.contatoMotorista ?? selected.contatoRecomendado ?? '')
    setFormError('')
  }, [selected])

  const addServico = (nomeSelecionado?: string) => {
    const nome = (nomeSelecionado ?? servicoNome).trim()
    if (!nome) {
      setFormError('Informe o servico antes de adicionar.')
      return
    }
    const quantidade = Math.max(1, Number(servicoQuantidade) || 1)
    const observacao = servicoObservacao.trim()
    setServicos((current) => {
      const existingIndex = current.findIndex((servico) =>
        servico.area === servicoArea &&
        servico.servicoNome.trim().toLowerCase() === nome.toLowerCase() &&
        (servico.observacao ?? '') === observacao,
      )
      if (existingIndex === -1) {
        return [
          ...current,
          {
            area: servicoArea,
            servicoNome: nome,
            descricao: nome,
            quantidade,
            observacao: observacao || undefined,
          },
        ]
      }
      return current.map((servico, index) =>
        index === existingIndex
          ? { ...servico, quantidade: Math.max(1, servico.quantidade) + quantidade }
          : servico,
      )
    })
    setServicoNome('')
    setServicoQuantidade('1')
    setServicoObservacao('')
    setLastAddedServiceName(nome)
    setFormError('')
  }

  const submitEntrada = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !onRegisterEntrada) return
    if (servicos.length === 0) {
      setFormError('Adicione pelo menos um servico para enviar o veiculo para a fila.')
      return
    }
    setIsSaving(true)
    setFormError('')
    try {
      await onRegisterEntrada({
        patioVeiculoId: selected.patioVeiculoId,
        quilometragem: quilometragem ? Number(quilometragem) : undefined,
        nomeMotorista,
        contatoMotorista,
        observacaoGeral: diagnostico,
        servicos,
      })
      setSelected(undefined)
      setServicos([])
      setServicoNome('')
      setObservacaoGeral('')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel registrar a entrada.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConsultPlate = async () => {
    if (!onConsultPlate) return
    setIsConsultingPlate(true)
    setPlateConsultError('')
    setPlateConsultResult(undefined)
    try {
      setPlateConsultResult(await onConsultPlate(query))
    } catch (error) {
      setPlateConsultError(error instanceof Error ? error.message : 'Nao foi possivel consultar a placa.')
    } finally {
      setIsConsultingPlate(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="filters-grid">
        <label>
          Placa, cliente ou motorista
          <input
            value={query}
            onChange={(event) => {
              setPlateConsultResult(undefined)
              setPlateConsultError('')
              onQueryChange(event.target.value)
            }}
            placeholder="Ex.: ABC1D23, cliente ou motorista"
          />
          {isLoading && <small className="field-hint">Consultando base do patio...</small>}
        </label>
      </div>
      {isLoading && <div className="empty-state">Buscando no historico do patio...</div>}
      {!isLoading && query.trim().length >= 2 && results.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum veiculo encontrado.</strong>
          {onConsultPlate && (
            <button className="button" type="button" disabled={isConsultingPlate} onClick={() => void handleConsultPlate()}>
              {isConsultingPlate ? 'Consultando placa...' : 'Buscar placa na API'}
            </button>
          )}
        </div>
      )}
      {plateConsultError && <div className="inline-error">{plateConsultError}</div>}
      {plateConsultResult && (
        <div className="panel subtle">
          <div className="panel-header">
            <div>
              <h3>Dados encontrados na API</h3>
              <p>{plateConsultResult.placa} - {plateConsultResult.modelo} {plateConsultResult.anoModelo ? `- ${plateConsultResult.anoModelo}` : ''}</p>
            </div>
          </div>
          <p className="muted-text">Use esses dados para cadastrar ou corrigir o veiculo quando o fluxo de novo cadastro estiver liberado no banco combinado.</p>
        </div>
      )}
      {query.trim().length < 2 && <div className="empty-state">Digite ao menos 2 caracteres para consultar.</div>}
      {allowRegister && selected && (
        <form className="panel subtle" onSubmit={submitEntrada}>
          <div className="panel-header">
            <div>
              <h3>Entrada: {selected.placa ?? 'Sem placa'}</h3>
              <p>{selected.clienteNome ?? 'Cliente sem vinculo'} - {selected.veiculoDescricao ?? 'Veiculo sem descricao'}</p>
            </div>
            <div className="inline-actions">
              {onEditVehicle && <button className="button" type="button" onClick={() => onEditVehicle(selected)}>Alterar Veiculo</button>}
              {onEditVehicle && <button className="button" type="button" onClick={() => onEditVehicle(selected)}>Alterar Empresa/Responsavel</button>}
              <button className="button" type="button" onClick={() => setSelected(undefined)}>Trocar veiculo</button>
            </div>
          </div>
          {formError && <div className="inline-error">{formError}</div>}
          <div className="patio-entry-flow">
            <div>
              <strong>1. Conferir cadastro</strong>
              <span>KM, motorista e WhatsApp atualizados.</span>
            </div>
            <div>
              <strong>2. Diagnostico rapido</strong>
              <span>Use quando houver alinhamento, puxando, vibracao ou observacao.</span>
            </div>
            <div>
              <strong>3. Servicos para fila</strong>
              <span>Adicione os servicos antes de enviar para alocacao.</span>
            </div>
          </div>
          <div className="filters-grid">
            <label>
              KM atual
              <input inputMode="numeric" value={quilometragem} onChange={(event) => setQuilometragem(event.target.value.replace(/\D/g, ''))} placeholder="Ex.: 185000" />
            </label>
            <label>
              Motorista
              <input value={nomeMotorista} onChange={(event) => setNomeMotorista(event.target.value)} placeholder="Nome do motorista" />
            </label>
            <label>
              WhatsApp/contato
              <input value={contatoMotorista} onChange={(event) => setContatoMotorista(event.target.value)} placeholder="Contato atualizado" />
            </label>
          </div>
          <div className="patio-entry-steps">
            <article className="panel subtle">
              <h3>Diagnostico rapido</h3>
              <div className="filters-grid">
                <label>
                  Numero de eixos
                  <input inputMode="numeric" value={numEixos} onChange={(event) => setNumEixos(event.target.value.replace(/\D/g, '') || '2')} />
                </label>
                <label>
                  Puxando
                  <select value={puxando} onChange={(event) => setPuxando(event.target.value)}>
                    <option value="Nao">Nao</option>
                    <option value="Esquerda">Esquerda</option>
                    <option value="Direita">Direita</option>
                  </select>
                </label>
                <label>
                  Volante
                  <select value={volante} onChange={(event) => setVolante(event.target.value)}>
                    <option value="Normal">Normal</option>
                    <option value="Passarinhando">Passarinhando</option>
                    <option value="Pesado">Pesado</option>
                  </select>
                </label>
                <label>
                  Vibracao
                  <select value={vibracao} onChange={(event) => setVibracao(event.target.value)}>
                    <option value="Nao">Nao</option>
                    <option value="Sim">Sim</option>
                  </select>
                </label>
              </div>
              <div className="patio-axis-grid">
                {Array.from({ length: Math.min(9, Math.max(2, Number(numEixos) || 2)) }, (_, index) => index + 1).map((eixo) => (
                  <label className="checkbox-line" key={eixo}>
                    <input
                      type="checkbox"
                      checked={Boolean(eixosAlinhar[eixo])}
                      onChange={(event) => setEixosAlinhar((current) => ({ ...current, [eixo]: event.target.checked }))}
                    />
                    Alinhar eixo {eixo}
                  </label>
                ))}
              </div>
              <label>
                Observacoes gerais
                <textarea value={observacaoGeral} onChange={(event) => setObservacaoGeral(event.target.value)} placeholder="Ex.: desgaste irregular, cliente pediu urgencia, conferir calibragem..." />
              </label>
              <div className="patio-diagnostic-preview">
                {diagnostico.split('\n').map((line) => <span key={line}>{line}</span>)}
              </div>
            </article>
            <article className="panel subtle">
              <div className="panel-header compact-header">
                <div>
                  <h3>Servicos para a fila</h3>
                  <p>Escolha a area, informe quantidade e clique em adicionar. Os atalhos abaixo ja adicionam direto.</p>
                </div>
                <strong>{servicos.length} adicionados</strong>
              </div>
              <div className="patio-service-areas">
                {areasEntrada.map((areaInfo) => (
                  <button
                    className={servicoArea === areaInfo.area ? 'button primary' : 'button'}
                    type="button"
                    onClick={() => setServicoArea(areaInfo.area)}
                    key={areaInfo.area}
                  >
                    {areaInfo.label}
                  </button>
                ))}
              </div>
              <div className="filters-grid">
                <label>
                  Servico de {areaLabel(servicoArea)}
                  <input
                    list={`patio-servicos-${servicoArea}`}
                    value={servicoNome}
                    onChange={(event) => setServicoNome(event.target.value)}
                    placeholder="Selecione ou digite o servico"
                  />
                  <datalist id={`patio-servicos-${servicoArea}`}>
                    {catalogoDaArea.map((servico) => <option value={servico.nome} key={`${servico.area}-${servico.nome}`} />)}
                  </datalist>
                </label>
                <label>
                  Qtde.
                  <input inputMode="numeric" value={servicoQuantidade} onChange={(event) => setServicoQuantidade(event.target.value.replace(/\D/g, '') || '1')} />
                </label>
                <label>
                  Observacao do servico
                  <input value={servicoObservacao} onChange={(event) => setServicoObservacao(event.target.value)} placeholder="Opcional" />
                </label>
              </div>
              <div className="patio-service-suggestions">
                {catalogoDaArea.slice(0, 12).map((servico) => (
                  <button className="button tiny-button" type="button" onClick={() => addServico(servico.nome)} key={`${servico.area}-${servico.nome}`}>
                    + {servico.nome}
                  </button>
                ))}
              </div>
              <div className="inline-actions">
                <button className={servicoNome.trim() ? 'button primary' : 'button'} type="button" disabled={!servicoNome.trim()} onClick={() => addServico()}>
                  {servicoNome.trim() ? 'Adicionar servico digitado' : 'Digite um servico ou use um atalho'}
                </button>
                <button className="button ghost" type="button" onClick={() => setSelected(undefined)}>Cancelar entrada</button>
              </div>
              {lastAddedServiceName && <small className="field-hint">Ultimo adicionado: {lastAddedServiceName}. Clicar novamente no mesmo atalho aumenta a quantidade.</small>}
              <div className="table-list compact-list patio-selected-services">
                {servicos.map((servico, index) => (
                  <div className="status-row" key={`${servico.servicoNome}-${index}`}>
                    <span>{areaLabel(servico.area)} - {servico.quantidade}x {servico.servicoNome}</span>
                    <button className="button tiny-button" type="button" onClick={() => setServicos((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remover</button>
                  </div>
                ))}
                {servicos.length === 0 && <div className="empty-state compact">Nenhum servico adicionado ainda.</div>}
              </div>
            </article>
          </div>
          <div className="patio-entry-submit-bar">
            <span>
              <strong>{servicos.length} servico{servicos.length === 1 ? '' : 's'} para enviar a fila</strong>
              <small>{selected.placa ?? 'Sem placa'} - {selected.clienteNome ?? 'Cliente sem vinculo'} - KM {quilometragem || 'nao informado'}</small>
            </span>
            <button className="button primary" type="submit" disabled={isSaving || servicos.length === 0}>
              {isSaving ? 'Registrando...' : servicos.length === 0 ? 'Adicione servicos para registrar' : 'Enviar para fila'}
            </button>
          </div>
        </form>
      )}
      {!selected && <div className="table-list">
        {results.map((item) => (
          <article className="panel subtle" key={item.patioVeiculoId}>
            <div className="panel-header">
              <div>
                <h3>{item.placa ?? 'Sem placa'} · {item.clienteNome ?? 'Cliente sem vinculo'}</h3>
                <p>{item.veiculoDescricao ?? 'Veiculo sem descricao'} · ultimo atendimento {dateLabel(item.ultimoAtendimentoEm)}</p>
              </div>
              <div className="inline-actions">
                {allowRegister && <button className="button primary" type="button" onClick={() => setSelected(item)}>Iniciar entrada</button>}
                {allowRegister && onEditVehicle && <button className="button" type="button" onClick={() => onEditVehicle(item)}>Alterar dados</button>}
                {item.clienteId && <button className="button" type="button" onClick={() => onOpenClient(item.clienteId!)}>Abrir ficha CRM</button>}
              </div>
            </div>
            <div className="status-list">
              <div className="status-row"><span>Motorista</span><strong>{item.nomeMotorista || 'Nao informado'}</strong></div>
              <div className="status-row"><span>Contato</span><strong>{item.contatoRecomendado || item.contatoMotorista || 'Nao informado'}</strong></div>
              <div className="status-row"><span>KM</span><strong>{item.ultimoKm ? numberLabel(item.ultimoKm) : 'Sem KM'}</strong></div>
              <div className="status-row"><span>Media km/dia</span><strong>{item.mediaKmDiaria ? numberLabel(Math.round(item.mediaKmDiaria)) : 'Sem media'}</strong></div>
            </div>
          </article>
        ))}
      </div>}
    </section>
  )
}

function PatioHistoricoVeiculo({
  query,
  results,
  isLoading,
  onQueryChange,
  onLoadHistorico,
  onOpenClient,
}: {
  query: string
  results: PatioVeiculoBusca[]
  isLoading: boolean
  onQueryChange: (query: string) => void
  onLoadHistorico: (patioVeiculoId: number) => Promise<{ atendimentos: PatioAtendimentoResumo[]; itens: PatioAtendimentoItemResumo[] }>
  onOpenClient: (clienteId: string) => void | Promise<void>
}) {
  const [selected, setSelected] = useState<PatioVeiculoBusca | undefined>()
  const [atendimentos, setAtendimentos] = useState<PatioAtendimentoResumo[]>([])
  const [itens, setItens] = useState<PatioAtendimentoItemResumo[]>([])
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false)
  const [error, setError] = useState('')

  const selectVehicle = async (vehicle: PatioVeiculoBusca) => {
    setSelected(vehicle)
    setIsLoadingHistorico(true)
    setError('')
    try {
      const result = await onLoadHistorico(vehicle.patioVeiculoId)
      setAtendimentos(result.atendimentos)
      setItens(result.itens)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar o historico da placa.')
    } finally {
      setIsLoadingHistorico(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Historico por placa</h2>
          <p>Consulte visitas, quilometragens, motorista e servicos executados no patio.</p>
        </div>
        {selected?.clienteId && <button className="button" type="button" onClick={() => onOpenClient(selected.clienteId!)}>Abrir ficha CRM</button>}
      </div>
      <div className="filters-grid">
        <label>
          Placa, cliente ou motorista
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Ex.: ABC1D23, cliente ou motorista" />
        </label>
      </div>
      {error && <div className="inline-error">{error}</div>}
      {isLoading && <div className="empty-state">Buscando veiculos...</div>}
      {!isLoading && query.trim().length >= 2 && results.length === 0 && <div className="empty-state">Nenhum veiculo encontrado.</div>}
      {query.trim().length < 2 && <div className="empty-state">Digite ao menos 2 caracteres para consultar.</div>}
      {results.length > 0 && (
        <div className="patio-history-results">
          {results.slice(0, 8).map((item) => (
            <button
              className={selected?.patioVeiculoId === item.patioVeiculoId ? 'button primary' : 'button'}
              type="button"
              onClick={() => void selectVehicle(item)}
              key={item.patioVeiculoId}
            >
              {item.placa ?? 'Sem placa'} - {item.clienteNome ?? 'Cliente sem vinculo'}
            </button>
          ))}
        </div>
      )}
      {isLoadingHistorico && <div className="empty-state">Carregando historico da placa...</div>}
      {!isLoadingHistorico && selected && atendimentos.length === 0 && <div className="empty-state">Nenhuma visita encontrada para esta placa.</div>}
      {!isLoadingHistorico && atendimentos.length > 0 && (
        <div className="table-list">
          {atendimentos.map((atendimento) => {
            const servicosDaVisita = itens.filter((item) => item.patioExecucaoId === atendimento.patioExecucaoId)
            return (
              <article className="panel subtle" key={atendimento.patioExecucaoId}>
                <div className="panel-header">
                  <div>
                    <h3>{dateLabel(atendimento.inicioExecucao || atendimento.fimExecucao)} - KM {atendimento.quilometragem ? numberLabel(atendimento.quilometragem) : 'nao informado'}</h3>
                    <p>{atendimento.status ?? 'sem status'} - {atendimento.nomeMotorista || 'Motorista nao informado'} {atendimento.contatoMotorista ? `(${atendimento.contatoMotorista})` : ''}</p>
                  </div>
                  <strong>{servicosDaVisita.length} servicos</strong>
                </div>
                <div className="status-list">
                  {servicosDaVisita.map((servico) => (
                    <div className="status-row" key={servico.id}>
                      <span>{areaLabel(servico.area)} - {servico.quantidade ?? 1}x {servico.servicoNome || servico.descricao || 'Servico'}</span>
                      <strong>{servico.status ?? 'sem status'}</strong>
                    </div>
                  ))}
                  {servicosDaVisita.length === 0 && <div className="empty-state">Nenhum item detalhado nesta visita.</div>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function PatioDadosClientes({
  query,
  results,
  isLoading,
  onQueryChange,
  onSaveCliente,
  onSaveVeiculo,
  onLoadHistorico,
  onOpenClient,
}: {
  query: string
  results: PatioVeiculoBusca[]
  isLoading: boolean
  onQueryChange: (query: string) => void
  onSaveCliente: (input: { clienteId: string; nome?: string; responsavel?: string; telefone?: string; whatsapp?: string }) => Promise<void>
  onSaveVeiculo: (input: { patioVeiculoId: number; veiculoId?: string; modelo?: string; nomeMotorista?: string; contatoMotorista?: string; mediaKmDiaria?: number }) => Promise<void>
  onLoadHistorico: (patioVeiculoId: number) => Promise<{ atendimentos: PatioAtendimentoResumo[]; itens: PatioAtendimentoItemResumo[] }>
  onOpenClient: (clienteId: string) => void | Promise<void>
}) {
  const [selected, setSelected] = useState<PatioVeiculoBusca | undefined>()
  const [selectedClientKey, setSelectedClientKey] = useState('')
  const [clienteForm, setClienteForm] = useState({ nome: '', responsavel: '', telefone: '', whatsapp: '' })
  const [veiculoForm, setVeiculoForm] = useState({ modelo: '', nomeMotorista: '', contatoMotorista: '', mediaKmDiaria: '' })
  const [atendimentos, setAtendimentos] = useState<PatioAtendimentoResumo[]>([])
  const [itens, setItens] = useState<PatioAtendimentoItemResumo[]>([])
  const [isSaving, setIsSaving] = useState('')
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false)
  const [error, setError] = useState('')

  const clientGroups = useMemo(() => {
    const groups = new Map<string, { key: string; clienteId?: string; clienteNome: string; contatoNome?: string; contatoRecomendado?: string; vehicles: PatioVeiculoBusca[] }>()
    results.forEach((vehicle) => {
      const key = vehicle.clienteId ?? vehicle.clienteNome ?? `sem-cliente-${vehicle.patioVeiculoId}`
      const current = groups.get(key)
      if (current) {
        current.vehicles.push(vehicle)
        return
      }
      groups.set(key, {
        key,
        clienteId: vehicle.clienteId,
        clienteNome: vehicle.clienteNome ?? 'Cliente sem vinculo',
        contatoNome: vehicle.contatoNome,
        contatoRecomendado: vehicle.contatoRecomendado,
        vehicles: [vehicle],
      })
    })
    return Array.from(groups.values())
  }, [results])

  const selectedClient = clientGroups.find((group) => group.key === selectedClientKey)
  const selectedClientVehicles = selectedClient?.vehicles ?? []

  useEffect(() => {
    setSelected(undefined)
    setSelectedClientKey('')
    setAtendimentos([])
    setItens([])
  }, [query])

  const chooseClient = (clientKey: string) => {
    setSelectedClientKey(clientKey)
    setSelected(undefined)
    setAtendimentos([])
    setItens([])
    setError('')
  }

  const chooseVehicle = (vehicle: PatioVeiculoBusca) => {
    setSelected(vehicle)
    setSelectedClientKey(vehicle.clienteId ?? vehicle.clienteNome ?? `sem-cliente-${vehicle.patioVeiculoId}`)
    setError('')
    setClienteForm({
      nome: vehicle.clienteNome ?? '',
      responsavel: vehicle.contatoNome ?? '',
      telefone: vehicle.contatoRecomendado ?? '',
      whatsapp: vehicle.contatoRecomendado ?? '',
    })
    setVeiculoForm({
      modelo: vehicle.veiculoDescricao ?? '',
      nomeMotorista: vehicle.nomeMotorista ?? '',
      contatoMotorista: vehicle.contatoMotorista ?? '',
      mediaKmDiaria: vehicle.mediaKmDiaria ? String(Math.round(vehicle.mediaKmDiaria)) : '',
    })
    setAtendimentos([])
    setItens([])
  }

  const loadHistorico = async () => {
    if (!selected) return
    setIsLoadingHistorico(true)
    setError('')
    try {
      const result = await onLoadHistorico(selected.patioVeiculoId)
      setAtendimentos(result.atendimentos)
      setItens(result.itens)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar historico.')
    } finally {
      setIsLoadingHistorico(false)
    }
  }

  const saveCliente = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected?.clienteId) return
    setIsSaving('cliente')
    setError('')
    try {
      await onSaveCliente({ clienteId: selected.clienteId, ...clienteForm })
      setSelected((current) => current ? { ...current, clienteNome: clienteForm.nome, contatoNome: clienteForm.responsavel, contatoRecomendado: clienteForm.whatsapp || clienteForm.telefone } : current)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar cliente.')
    } finally {
      setIsSaving('')
    }
  }

  const saveVeiculo = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected) return
    setIsSaving('veiculo')
    setError('')
    try {
      await onSaveVeiculo({
        patioVeiculoId: selected.patioVeiculoId,
        veiculoId: selected.veiculoId,
        modelo: veiculoForm.modelo,
        nomeMotorista: veiculoForm.nomeMotorista,
        contatoMotorista: veiculoForm.contatoMotorista,
        mediaKmDiaria: Number(veiculoForm.mediaKmDiaria) || undefined,
      })
      setSelected((current) => current ? {
        ...current,
        veiculoDescricao: veiculoForm.modelo,
        nomeMotorista: veiculoForm.nomeMotorista,
        contatoMotorista: veiculoForm.contatoMotorista,
        mediaKmDiaria: Number(veiculoForm.mediaKmDiaria) || undefined,
      } : current)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar veiculo.')
    } finally {
      setIsSaving('')
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Dados de clientes</h2>
          <p>Busca operacional para corrigir contato, motorista e dados do veiculo sem sair do modo Patio.</p>
        </div>
        {selected?.clienteId && <button className="button" type="button" onClick={() => onOpenClient(selected.clienteId!)}>Abrir ficha CRM</button>}
      </div>
      <div className="filters-grid">
        <label>
          Cliente, placa ou motorista
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Digite ao menos 2 caracteres" />
        </label>
      </div>
      {error && <div className="inline-error">{error}</div>}
      {isLoading && <div className="empty-state">Buscando dados...</div>}
      {!isLoading && query.trim().length >= 2 && results.length === 0 && <div className="empty-state">Nenhum cliente ou veiculo encontrado.</div>}
      {clientGroups.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>Clientes encontrados</h3>
              <p>Selecione o cliente primeiro, depois escolha o veiculo para alterar dados ou consultar historico.</p>
            </div>
            <strong>{clientGroups.length} clientes</strong>
          </div>
          <div className="patio-history-results">
            {clientGroups.slice(0, 12).map((group) => (
              <button className={selectedClientKey === group.key ? 'button primary' : 'button'} type="button" key={group.key} onClick={() => chooseClient(group.key)}>
                {group.clienteNome} - {group.vehicles.length} veiculo{group.vehicles.length === 1 ? '' : 's'}
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedClient && (
        <div className="panel-subsection">
          <div className="panel-header compact-panel-header">
            <div>
              <h3>{selectedClient.clienteNome}</h3>
              <p>
                {selectedClient.clienteId ? `ID CRM: ${selectedClient.clienteId.slice(0, 8)}` : 'Sem cliente vinculado'}
                {selectedClient.contatoNome ? ` - Responsavel: ${selectedClient.contatoNome}` : ''}
                {selectedClient.contatoRecomendado ? ` - Contato: ${selectedClient.contatoRecomendado}` : ''}
              </p>
            </div>
            {selectedClient.clienteId && <button className="button" type="button" onClick={() => onOpenClient(selectedClient.clienteId!)}>Abrir ficha CRM</button>}
          </div>
          <div className="patio-history-results">
            {selectedClientVehicles.map((item) => (
              <button className={selected?.patioVeiculoId === item.patioVeiculoId ? 'button primary' : 'button'} type="button" key={item.patioVeiculoId} onClick={() => chooseVehicle(item)}>
                {item.placa ?? 'Sem placa'} - {item.veiculoDescricao || 'Modelo nao informado'}{item.ultimoAtendimentoEm ? ` - ultima visita ${dateLabel(item.ultimoAtendimentoEm)}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
      {selected && (
        <div className="patio-data-grid">
          <form className="panel subtle" onSubmit={(event) => void saveCliente(event)}>
            <h3>Cliente e contato</h3>
            <div className="filters-grid">
              <label>
                Nome do cliente
                <input value={clienteForm.nome} onChange={(event) => setClienteForm((current) => ({ ...current, nome: event.target.value }))} disabled={!selected.clienteId} />
              </label>
              <label>
                Responsavel
                <input value={clienteForm.responsavel} onChange={(event) => setClienteForm((current) => ({ ...current, responsavel: event.target.value }))} disabled={!selected.clienteId} />
              </label>
              <label>
                Telefone
                <input value={clienteForm.telefone} onChange={(event) => setClienteForm((current) => ({ ...current, telefone: event.target.value }))} disabled={!selected.clienteId} />
              </label>
              <label>
                WhatsApp principal
                <input value={clienteForm.whatsapp} onChange={(event) => setClienteForm((current) => ({ ...current, whatsapp: event.target.value }))} disabled={!selected.clienteId} />
              </label>
            </div>
            {!selected.clienteId && <div className="empty-state">Veiculo ainda sem cliente vinculado no CRM.</div>}
            <button className="button primary" type="submit" disabled={!selected.clienteId || isSaving === 'cliente'}>{isSaving === 'cliente' ? 'Salvando...' : 'Salvar cliente'}</button>
          </form>
          <form className="panel subtle" onSubmit={(event) => void saveVeiculo(event)}>
            <h3>Veiculo e motorista</h3>
            <div className="filters-grid">
              <label>
                Placa
                <input value={selected.placa ?? ''} disabled />
              </label>
              <label>
                Modelo
                <input value={veiculoForm.modelo} onChange={(event) => setVeiculoForm((current) => ({ ...current, modelo: event.target.value }))} />
              </label>
              <label>
                Motorista
                <input value={veiculoForm.nomeMotorista} onChange={(event) => setVeiculoForm((current) => ({ ...current, nomeMotorista: event.target.value }))} />
              </label>
              <label>
                Contato motorista
                <input value={veiculoForm.contatoMotorista} onChange={(event) => setVeiculoForm((current) => ({ ...current, contatoMotorista: event.target.value }))} />
              </label>
              <label>
                Media km/dia
                <input type="number" value={veiculoForm.mediaKmDiaria} onChange={(event) => setVeiculoForm((current) => ({ ...current, mediaKmDiaria: event.target.value }))} />
              </label>
            </div>
            <button className="button primary" type="submit" disabled={isSaving === 'veiculo'}>{isSaving === 'veiculo' ? 'Salvando...' : 'Salvar veiculo'}</button>
          </form>
          <div className="panel subtle wide-field">
            <div className="panel-header">
              <div>
                <h3>Historico rapido</h3>
                <p>Ultimas visitas e servicos desta placa.</p>
              </div>
              <button className="button" type="button" onClick={() => void loadHistorico()} disabled={isLoadingHistorico}>
                {isLoadingHistorico ? 'Carregando...' : 'Ver historico'}
              </button>
            </div>
            {atendimentos.length === 0 && !isLoadingHistorico && <div className="empty-state">Clique em ver historico para consultar esta placa.</div>}
            {atendimentos.slice(0, 6).map((atendimento) => {
              const servicosDaVisita = itens.filter((item) => item.patioExecucaoId === atendimento.patioExecucaoId)
              return (
                <div className="status-list" key={atendimento.patioExecucaoId}>
                  <div className="status-row">
                    <span>{dateLabel(atendimento.inicioExecucao || atendimento.fimExecucao)} - KM {atendimento.quilometragem ? numberLabel(atendimento.quilometragem) : 'nao informado'}</span>
                    <strong>{atendimento.status ?? 'sem status'}</strong>
                  </div>
                  {servicosDaVisita.slice(0, 4).map((servico) => (
                    <div className="status-row" key={servico.id}>
                      <span>{areaLabel(servico.area)} - {servico.quantidade ?? 1}x {servico.servicoNome || servico.descricao || 'Servico'}</span>
                      <strong>{servico.status ?? ''}</strong>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function PatioExportarContatos({
  onLoadContatos,
  onMarkExported,
}: {
  onLoadContatos: (input?: { query?: string; reExportAll?: boolean }) => Promise<PatioContatoExportacao[]>
  onMarkExported: (items: PatioContatoExportacao[]) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [reExportAll, setReExportAll] = useState(false)
  const [items, setItems] = useState<PatioContatoExportacao[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setIsLoading(true)
    setError('')
    setDownloaded(false)
    try {
      setItems(await onLoadContatos({ query, reExportAll }))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar contatos.')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadCsv = () => {
    const csv = buildGoogleContactsCsv(items)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `google_contacts_capital_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  const confirmExported = async () => {
    if (!window.confirm(`Marcar ${items.length} contatos como exportados?`)) return
    setIsMarking(true)
    setError('')
    try {
      await onMarkExported(items)
      setItems([])
      setDownloaded(false)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel marcar contatos como exportados.')
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Exportar contatos</h2>
          <p>Gere CSV para Google Contacts com responsaveis e motoristas da base consolidada.</p>
        </div>
        <button className="button primary" type="button" onClick={() => void load()} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Gerar lista'}
        </button>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="filters-grid">
        <label>
          Filtrar antes de gerar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cliente, placa, motorista ou telefone" />
        </label>
        <label className="checkbox-line">
          <input type="checkbox" checked={reExportAll} onChange={(event) => setReExportAll(event.target.checked)} />
          Forcar re-exportacao de todos os contatos
        </label>
      </div>
      {items.length > 0 && (
        <>
          <div className="status-list">
            <div className="status-row"><span>Contatos prontos</span><strong>{items.length}</strong></div>
            <div className="status-row"><span>Responsaveis</span><strong>{items.filter((item) => item.tipo === 'Responsavel').length}</strong></div>
            <div className="status-row"><span>Motoristas</span><strong>{items.filter((item) => item.tipo === 'Motorista').length}</strong></div>
          </div>
          <div className="row-actions">
            <button className="button primary" type="button" onClick={downloadCsv}>Baixar CSV</button>
            {!reExportAll && (
              <button className="button" type="button" disabled={!downloaded || isMarking} onClick={() => void confirmExported()}>
                {isMarking ? 'Marcando...' : 'Confirmar e marcar exportados'}
              </button>
            )}
          </div>
          {!reExportAll && !downloaded && <p className="muted">Depois de baixar, confirme para estes contatos sairem da proxima exportacao incremental.</p>}
          <div className="table-list">
            {items.slice(0, 50).map((item, index) => (
              <article className="panel subtle" key={`${item.tipo}-${item.telefonePadronizado}-${index}`}>
                <div className="panel-header">
                  <div>
                    <h3>{item.nome}</h3>
                    <p>{item.tipo} - {item.empresa || 'Empresa nao informada'} {item.placa ? `- ${item.placa}` : ''}</p>
                    <small className="muted">
                      Atualizado {item.atualizadoEm ? dateLabel(item.atualizadoEm) : 'sem data'} - Ultima exportacao {item.ultimaExportacao ? dateLabel(item.ultimaExportacao) : 'nunca'}
                    </small>
                  </div>
                  <strong>{item.telefonePadronizado}</strong>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {!isLoading && items.length === 0 && <div className="empty-state">Gere a lista para visualizar e baixar contatos validos.</div>}
    </section>
  )
}

function PatioAnalisePneus({
  onAnalyze,
}: {
  onAnalyze: (input: {
    placa?: string
    clienteNome?: string
    observacao?: string
    images: Array<{ name: string; mimeType: string; dataUrl: string }>
  }) => Promise<TireInspectionAnalysis>
}) {
  const [placa, setPlaca] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [observacao, setObservacao] = useState('')
  const [images, setImages] = useState<Array<{ name: string; mimeType: string; dataUrl: string }>>([])
  const [analysis, setAnalysis] = useState<TireInspectionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setError('')
    try {
      const prepared = await Promise.all(Array.from(files).slice(0, 6).map(async (file) => {
        const image = await optimizeCampaignImage(file)
        return { name: image.nome, mimeType: image.mimeType, dataUrl: image.dataUrl }
      }))
      setImages(prepared)
      setAnalysis(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel preparar as fotos.')
    }
  }

  const run = async () => {
    if (images.length === 0) {
      setError('Selecione ao menos uma foto do pneu.')
      return
    }
    setIsAnalyzing(true)
    setError('')
    try {
      setAnalysis(await onAnalyze({ placa, clienteNome, observacao, images }))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel analisar as fotos.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Analise de pneus</h2>
          <p>Envie fotos do pneu para gerar um parecer tecnico/comercial rapido com IA.</p>
        </div>
        <button className="button primary" type="button" onClick={() => void run()} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analisando...' : 'Analisar fotos'}
        </button>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="filters-grid">
        <label>
          Placa
          <input value={placa} onChange={(event) => setPlaca(event.target.value.toUpperCase())} placeholder="Ex.: ABC1D23" />
        </label>
        <label>
          Cliente
          <input value={clienteNome} onChange={(event) => setClienteNome(event.target.value)} placeholder="Nome do cliente ou frota" />
        </label>
        <label className="wide-field">
          Observacao do atendente
          <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} placeholder="Ex.: desgaste irregular no eixo dianteiro, cliente sente vibracao..." />
        </label>
        <label className="wide-field">
          Fotos do pneu
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => void handleFiles(event.target.files)} />
        </label>
      </div>
      {images.length > 0 && (
        <div className="tire-image-grid">
          {images.map((image) => (
            <figure key={image.name}>
              <img src={image.dataUrl} alt={image.name} />
              <figcaption>{image.name}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {analysis && (
        <div className="patio-analysis-result">
          <div className="panel subtle">
            <div className="panel-header">
              <div>
                <h3>Resultado tecnico</h3>
                <p>Confianca: {Math.round(analysis.confidence * 100)}% - severidade {analysis.severity}</p>
              </div>
              <strong>{analysis.severity.toUpperCase()}</strong>
            </div>
            <p>{analysis.summary}</p>
            <div className="status-list">
              <div className="status-row"><span>Risco imediato</span><strong>{analysis.immediateRisk}</strong></div>
              <div className="status-row"><span>Oportunidade</span><strong>{analysis.commercialOpportunity}</strong></div>
            </div>
          </div>
          <div className="panel subtle">
            <h3>Acoes recomendadas</h3>
            <ul className="clean-list">
              {analysis.recommendedActions.map((item) => <li key={item}>{item}</li>)}
            </ul>
            {analysis.likelyCauses.length > 0 && (
              <>
                <h3>Causas provaveis</h3>
                <ul className="clean-list">
                  {analysis.likelyCauses.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            )}
          </div>
          <div className="panel subtle">
            <h3>Mensagem WhatsApp</h3>
            <textarea value={analysis.whatsappMessage} readOnly />
            <a className="button primary" href={`https://wa.me/?text=${encodeURIComponent(analysis.whatsappMessage)}`} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  )
}

function PatioRelatorioGestao({
  onLoad,
}: {
  onLoad: (input: { startDate: string; endDate: string }) => Promise<PatioRelatorioServico[]>
}) {
  const today = new Date()
  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 30)
  const [startDate, setStartDate] = useState(defaultStart.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10))
  const [items, setItems] = useState<PatioRelatorioServico[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      setItems(await onLoad({ startDate, endDate }))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar relatorio do patio.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visits = new Set(items.map((item) => item.patioExecucaoId)).size
  const totalServicos = items.reduce((total, item) => total + Math.max(1, item.quantidade), 0)
  const duracoes = items.map((item) => item.duracaoMinutos).filter((value): value is number => Boolean(value && value > 0))
  const tempoMedio = duracoes.length ? Math.round(duracoes.reduce((total, value) => total + value, 0) / duracoes.length) : 0
  const topBoxes = rankPatioReport(items, (item) => item.boxNome || (item.boxId ? `Box ${item.boxId}` : 'Sem box'))
  const topServicos = rankPatioReport(items, (item) => item.servicoNome || 'Servico')
  const topClientes = rankPatioReport(items, (item) => item.clienteNome || 'Cliente sem vinculo')
  const topEquipe = rankPatioReport(items, (item) => item.funcionarioNome || 'Sem tecnico')

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Relatorio Patio</h2>
          <p>Indicadores operacionais simples do patio consolidado no CRM.</p>
        </div>
        <button className="button primary" type="button" onClick={() => void load()} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="filters-grid">
        <label>
          Inicio
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          Fim
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>
      <div className="metric-grid">
        <Metric icon={CheckCircle2} label="Visitas finalizadas" value={numberLabel(visits)} tone="green" />
        <Metric icon={ClipboardList} label="Itens executados" value={numberLabel(totalServicos)} tone="blue" />
        <Metric icon={CalendarClock} label="Tempo medio" value={tempoMedio ? `${tempoMedio} min` : 'Sem media'} tone="amber" />
        <Metric icon={BarChart3} label="Registros analisados" value={numberLabel(items.length)} tone="blue" />
      </div>
      <div className="patio-report-grid">
        <RankPanel title="Servicos por box" items={topBoxes} />
        <RankPanel title="Servicos mais feitos" items={topServicos} />
        <RankPanel title="Clientes por volume" items={topClientes} />
        <RankPanel title="Equipe por volume" items={topEquipe} />
      </div>
    </section>
  )
}

function PatioKmMedio({
  query,
  results,
  isLoading,
  onQueryChange,
  onLoadHistorico,
  onSaveMedia,
  onSaveAtendimentoKm,
}: {
  query: string
  results: PatioVeiculoBusca[]
  isLoading: boolean
  onQueryChange: (query: string) => void
  onLoadHistorico: (patioVeiculoId: number) => Promise<{ atendimentos: PatioAtendimentoResumo[]; itens: PatioAtendimentoItemResumo[] }>
  onSaveMedia: (input: { patioVeiculoId: number; veiculoId?: string; mediaKmDiaria: number }) => Promise<void>
  onSaveAtendimentoKm: (input: { patioExecucaoId: number; quilometragem: number }) => Promise<number | undefined>
}) {
  const [selected, setSelected] = useState<PatioVeiculoBusca | undefined>()
  const [atendimentos, setAtendimentos] = useState<PatioAtendimentoResumo[]>([])
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savingKmId, setSavingKmId] = useState<number | undefined>()
  const [feedback, setFeedback] = useState('')
  const [kmDrafts, setKmDrafts] = useState<Record<number, string>>({})
  const [manualMedia, setManualMedia] = useState('')
  const visitDayKey = (visit: PatioAtendimentoResumo) => String(visit.fimExecucao || visit.inicioExecucao || '').slice(0, 10)

  const selectVehicle = async (vehicle: PatioVeiculoBusca) => {
    setSelected(vehicle)
    setFeedback('')
    setManualMedia('')
    setIsLoadingHistorico(true)
    try {
      const result = await onLoadHistorico(vehicle.patioVeiculoId)
      setAtendimentos(result.atendimentos)
      setKmDrafts(Object.fromEntries(result.atendimentos.map((item) => [item.patioExecucaoId, item.quilometragem ? String(item.quilometragem) : ''])))
    } finally {
      setIsLoadingHistorico(false)
    }
  }

  const visits = useMemo(() => {
    const unique = new Map<string, PatioAtendimentoResumo>()
    for (const item of atendimentos) {
      if (!item.fimExecucao || !item.quilometragem || item.quilometragem <= 0) continue
      const key = visitDayKey(item)
      const current = unique.get(key)
      if (!current || (item.quilometragem ?? 0) > (current.quilometragem ?? 0)) unique.set(key, item)
    }
    return Array.from(unique.values()).sort((a, b) => String(a.fimExecucao).localeCompare(String(b.fimExecucao)))
  }, [atendimentos])
  const baseVisits = visits.slice(-3)
  const first = baseVisits[0]
  const last = baseVisits[baseVisits.length - 1]
  const days = first?.fimExecucao && last?.fimExecucao
    ? Math.max(0, Math.round((new Date(last.fimExecucao).getTime() - new Date(first.fimExecucao).getTime()) / 86400000))
    : 0
  const deltaKm = first?.quilometragem && last?.quilometragem ? last.quilometragem - first.quilometragem : 0
  const calculated = days > 0 && deltaKm >= 0 ? deltaKm / days : 0
  const mediaToSave = manualMedia.trim() ? Number(manualMedia.replace(',', '.')) : calculated

  const save = async () => {
    if (!selected || !mediaToSave || mediaToSave <= 0) return
    setIsSaving(true)
    setFeedback('')
    try {
      await onSaveMedia({ patioVeiculoId: selected.patioVeiculoId, veiculoId: selected.veiculoId, mediaKmDiaria: Number(mediaToSave.toFixed(2)) })
      setSelected({ ...selected, mediaKmDiaria: Number(mediaToSave.toFixed(2)) })
      setFeedback(`Media atualizada para ${mediaToSave.toFixed(2)} km/dia.`)
    } catch (exception) {
      setFeedback(exception instanceof Error ? exception.message : 'Nao foi possivel salvar a media.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveVisitKm = async (visit: PatioAtendimentoResumo) => {
    const nextKm = Number(kmDrafts[visit.patioExecucaoId])
    if (!nextKm || nextKm <= 0) {
      setFeedback('Informe um KM valido para a visita.')
      return
    }
    setSavingKmId(visit.patioExecucaoId)
    setFeedback('')
    try {
      const nextMedia = await onSaveAtendimentoKm({ patioExecucaoId: visit.patioExecucaoId, quilometragem: nextKm })
      const changedDay = visitDayKey(visit)
      setAtendimentos((current) => current.map((item) =>
        visitDayKey(item) === changedDay ? { ...item, quilometragem: Math.round(nextKm) } : item,
      ))
      if (nextMedia && selected) {
        setSelected({ ...selected, mediaKmDiaria: nextMedia })
        setManualMedia('')
      }
      setFeedback(nextMedia ? `KM atualizado e media recalculada para ${nextMedia.toFixed(2)} km/dia.` : 'KM da visita atualizado.')
    } catch (exception) {
      setFeedback(exception instanceof Error ? exception.message : 'Nao foi possivel corrigir o KM da visita.')
    } finally {
      setSavingKmId(undefined)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>KM medio por placa</h2>
          <p>Calcule a media usando visitas finalizadas e salve para melhorar revisao proativa.</p>
        </div>
      </div>
      {feedback && <div className={feedback.includes('Nao') ? 'inline-error' : 'inline-success'}>{feedback}</div>}
      <div className="filters-grid">
        <label>
          Placa, cliente ou motorista
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Ex.: ABC1D23" />
        </label>
      </div>
      {isLoading && <div className="empty-state">Buscando veiculos...</div>}
      {results.length > 0 && (
        <div className="patio-history-results">
          {results.slice(0, 10).map((item) => (
            <button className={selected?.patioVeiculoId === item.patioVeiculoId ? 'button primary' : 'button'} type="button" key={item.patioVeiculoId} onClick={() => void selectVehicle(item)}>
              {item.placa ?? 'Sem placa'} - {item.clienteNome ?? 'Cliente sem vinculo'}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="panel subtle">
          <div className="panel-header">
            <div>
              <h3>{selected.placa ?? 'Sem placa'} - {selected.clienteNome ?? 'Cliente sem vinculo'}</h3>
              <p>Media atual: {selected.mediaKmDiaria ? `${numberLabel(Math.round(selected.mediaKmDiaria))} km/dia` : 'sem media'}</p>
            </div>
            <button className="button primary" type="button" disabled={!mediaToSave || mediaToSave <= 0 || isSaving} onClick={() => void save()}>
              {isSaving ? 'Salvando...' : 'Salvar nova media'}
            </button>
          </div>
          {isLoadingHistorico && <div className="empty-state">Carregando visitas...</div>}
          {!isLoadingHistorico && (
            <>
              <div className="metric-grid">
                <Metric icon={ClipboardList} label="Visitas validas" value={numberLabel(visits.length)} tone="blue" />
                <Metric icon={CalendarClock} label="Periodo usado" value={days ? `${days} dias` : 'Sem periodo'} tone="amber" />
                <Metric icon={Gauge} label="Delta KM" value={numberLabel(Math.max(0, deltaKm))} tone="blue" />
                <Metric icon={RefreshCw} label="Nova media" value={calculated ? `${calculated.toFixed(2)} km/dia` : 'Nao calculada'} tone="green" />
              </div>
              <div className="filters-grid">
                <label>
                  Media final manual
                  <input
                    inputMode="decimal"
                    value={manualMedia}
                    onChange={(event) => setManualMedia(event.target.value.replace(/[^0-9,.]/g, ''))}
                    placeholder={calculated ? `${calculated.toFixed(2)} km/dia calculado` : 'Ex.: 165'}
                  />
                </label>
              </div>
              <div className="status-list">
                {visits.slice(-8).map((visit) => (
                  <div className="status-row" key={visit.patioExecucaoId}>
                    <span>{dateLabel(visit.fimExecucao)}</span>
                    <div className="inline-actions">
                      <input
                        className="compact-input"
                        inputMode="numeric"
                        value={kmDrafts[visit.patioExecucaoId] ?? ''}
                        onChange={(event) => setKmDrafts((current) => ({ ...current, [visit.patioExecucaoId]: event.target.value.replace(/\D/g, '') }))}
                        aria-label={`KM da visita ${dateLabel(visit.fimExecucao)}`}
                      />
                      <button
                        className="button tiny-button"
                        type="button"
                        disabled={savingKmId === visit.patioExecucaoId || kmDrafts[visit.patioExecucaoId] === String(visit.quilometragem ?? '')}
                        onClick={() => void saveVisitKm(visit)}
                      >
                        {savingKmId === visit.patioExecucaoId ? 'Salvando...' : 'Salvar KM'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function PatioResultados({
  onLoad,
}: {
  onLoad: (input?: { status?: 'todos' | 'retornou_15d' | 'sem_retorno_15d' | 'aguardando'; limit?: number }) => Promise<PatioRevisaoResultado[]>
}) {
  const [status, setStatus] = useState<'todos' | 'retornou_15d' | 'sem_retorno_15d' | 'aguardando'>('todos')
  const [items, setItems] = useState<PatioRevisaoResultado[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      setItems(await onLoad({ status, limit: 500 }))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar resultados.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [status])

  const retornou = items.filter((item) => item.resultado === 'retornou_15d').length
  const semRetorno = items.filter((item) => item.resultado === 'sem_retorno_15d').length
  const aguardando = items.filter((item) => item.resultado === 'aguardando').length
  const taxa = retornou + semRetorno ? Math.round((retornou / (retornou + semRetorno)) * 100) : 0

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Resultados Patio</h2>
          <p>Controle se revisoes proativas geraram retorno da placa em ate 15 dias.</p>
        </div>
        <button className="button primary" type="button" onClick={() => void load()} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="filters-grid">
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="todos">Todos</option>
            <option value="retornou_15d">Retornou em 15 dias</option>
            <option value="aguardando">Aguardando janela</option>
            <option value="sem_retorno_15d">Sem retorno em 15 dias</option>
          </select>
        </label>
      </div>
      <div className="metric-grid">
        <Metric icon={Trophy} label="Taxa de retorno" value={`${taxa}%`} tone="green" />
        <Metric icon={CheckCircle2} label="Retornaram" value={numberLabel(retornou)} tone="green" />
        <Metric icon={CalendarClock} label="Aguardando" value={numberLabel(aguardando)} tone="amber" />
        <Metric icon={AlertTriangle} label="Sem retorno" value={numberLabel(semRetorno)} tone="red" />
      </div>
      <div className="table-list">
        {items.map((item) => (
          <article className="panel subtle" key={`${item.patioVeiculoId}-${item.dataRevisaoProativa}`}>
            <div className="panel-header">
              <div>
                <h3>{item.placa ?? 'Sem placa'} - {item.clienteNome ?? 'Cliente sem vinculo'}</h3>
                <p>Acionado em {dateLabel(item.dataRevisaoProativa)} - {resultadoRevisaoLabel(item.resultado)} - {item.diasDesdeAcao} dias</p>
              </div>
              <strong>{item.retornoEm ? `Retorno ${dateLabel(item.retornoEm)}` : resultadoRevisaoLabel(item.resultado)}</strong>
            </div>
            <div className="status-list">
              <div className="status-row"><span>Veiculo</span><strong>{item.veiculoDescricao || 'Nao informado'}</strong></div>
              <div className="status-row"><span>Motorista</span><strong>{item.nomeMotorista || 'Nao informado'}</strong></div>
              <div className="status-row"><span>KM retorno</span><strong>{item.retornoKm ? numberLabel(item.retornoKm) : 'Sem retorno'}</strong></div>
            </div>
          </article>
        ))}
        {!isLoading && items.length === 0 && <div className="empty-state">Nenhum resultado encontrado para este filtro.</div>}
      </div>
    </section>
  )
}

function resultadoRevisaoLabel(value: PatioRevisaoResultado['resultado']) {
  const labels: Record<PatioRevisaoResultado['resultado'], string> = {
    retornou_15d: 'Retornou em 15 dias',
    sem_retorno_15d: 'Sem retorno em 15 dias',
    aguardando: 'Aguardando janela',
  }
  return labels[value] ?? value
}

function rankPatioReport(items: PatioRelatorioServico[], labeler: (item: PatioRelatorioServico) => string) {
  return Array.from(items.reduce((acc, item) => {
    const label = labeler(item)
    acc.set(label, (acc.get(label) ?? 0) + Math.max(1, item.quantidade))
    return acc
  }, new Map<string, number>()).entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function RankPanel({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <article className="panel subtle">
      <h3>{title}</h3>
      <div className="status-list">
        {items.map((item) => (
          <div className="status-row" key={item.label}>
            <span>{item.label}</span>
            <strong>{numberLabel(item.count)}</strong>
          </div>
        ))}
        {items.length === 0 && <div className="empty-state">Sem dados no periodo.</div>}
      </div>
    </article>
  )
}

function buildGoogleContactsCsv(items: PatioContatoExportacao[]) {
  const headers = ['Name Prefix', 'First Name', 'Middle Name', 'Last Name', 'Name Suffix', 'Phone 1 - Type', 'Phone 1 - Value', 'Notes']
  const rows = items.map((item) => [
    item.tipo,
    item.nome,
    item.empresa,
    item.placa ?? '',
    item.modelo ?? '',
    'Celular',
    item.telefonePadronizado,
    item.observacao,
  ])
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')
}

function csvCell(value: string) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function PatioFila({
  items,
  boxesPainel,
  filaPainel,
  total,
  page,
  pageSize,
  query,
  area,
  isLoading,
  lastUpdated,
  onQueryChange,
  onAreaChange,
  onPageChange,
  onOpenClient,
}: {
  items: PatioFilaItem[]
  boxesPainel: PatioPainelBox[]
  filaPainel: PatioFilaPainel[]
  total: number
  page: number
  pageSize: number
  query: string
  area: PatioFilaItem['area'] | 'todas'
  isLoading: boolean
  lastUpdated: string
  onQueryChange: (query: string) => void
  onAreaChange: (area: PatioFilaItem['area'] | 'todas') => void
  onPageChange: (page: number) => void
  onOpenClient: (clienteId: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const boxesEmAtendimento = boxesPainel.filter((box) => box.patioExecucaoId)
  const filteredFila = filaPainel.filter((item) => {
    const term = query.trim().toLowerCase()
    if (!term) return true
    return [item.placa, item.clienteNome, item.listaServicos].some((value) => value?.toLowerCase().includes(term))
  })
  return (
    <section className="panel wide patio-queue-panel">
      <div className="panel-header">
        <div>
          <h2>Fila operacional do Patio</h2>
          <p>
            Mesma visao de trabalho do controle de patio: atendimento atual e fila de espera.
            {lastUpdated ? ` Atualizado ${new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` : ''}
          </p>
        </div>
        <strong>{filaPainel.length} veiculos na fila</strong>
      </div>
      <div className="filters-grid">
        <label>
          Buscar
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cliente, placa ou servico" />
        </label>
        <label>
          Area
          <select value={area} onChange={(event) => onAreaChange(event.target.value as PatioFilaItem['area'] | 'todas')}>
            <option value="todas">Todas</option>
            <option value="borracharia">Borracharia</option>
            <option value="alinhamento">Alinhamento</option>
            <option value="manutencao">Manutencao</option>
          </select>
        </label>
      </div>
      {isLoading && <div className="empty-state">Carregando fila...</div>}
      {!isLoading && (
        <>
          <h2 className="patio-section-title">Em atendimento</h2>
          {boxesEmAtendimento.length === 0 && <div className="empty-state">Nenhum veiculo em atendimento nos boxes no momento.</div>}
          <div className="patio-tv-grid">
            {boxesEmAtendimento.map((box) => (
              <article className="patio-tv-card" key={box.boxId}>
                <h3>BOX {box.boxId}</h3>
                <strong className="patio-plate">{box.placa ?? 'SEM PLACA'}</strong>
                <p><b>Empresa:</b> {box.clienteNome ?? 'N/A'}</p>
                <p><b>Mecanico:</b> {box.funcionarioNome ?? 'N/A'}</p>
                {box.listaServicos && <p className="patio-service-list" dangerouslySetInnerHTML={{ __html: box.listaServicos }} />}
              </article>
            ))}
          </div>

          <h2 className="patio-section-title">Fila de espera</h2>
          {filteredFila.length === 0 && <div className="empty-state">Fila de espera vazia.</div>}
          <div className="patio-tv-grid queue">
            {filteredFila.map((item, index) => (
              <article className="patio-tv-card" key={`${item.patioVeiculoId}-${item.placa}`}>
                <h3><span className="queue-number">{index + 1}o</span> NA FILA</h3>
                <strong className="patio-plate">{item.placa ?? 'SEM PLACA'}</strong>
                <p><b>Empresa:</b> {item.clienteNome ?? 'N/A'}</p>
                {item.listaServicos && <p className="patio-service-list" dangerouslySetInnerHTML={{ __html: item.listaServicos }} />}
                {item.clienteId && <button className="button compact-button" type="button" onClick={() => onOpenClient(item.clienteId!)}>Ficha CRM</button>}
              </article>
            ))}
          </div>
        </>
      )}
      <details className="panel subtle">
        <summary>Detalhe tecnico da fila</summary>
      {!isLoading && items.length === 0 && <div className="empty-state">Nenhum item pendente.</div>}
      <div className="table-list">
        {items.map((item) => (
          <article className="panel subtle" key={item.id}>
            <div className="panel-header">
              <div>
                <h3>{item.placa ?? 'Sem placa'} · {item.servicoNome || item.descricao || item.area}</h3>
                <p>{item.clienteNome ?? 'Cliente sem vinculo'} · {item.area} · {item.status ?? 'pendente'}</p>
              </div>
              {item.clienteId && <button className="button" type="button" onClick={() => onOpenClient(item.clienteId!)}>Ficha CRM</button>}
            </div>
          </article>
        ))}
      </div>
      </details>
      <div className="pagination-bar">
        <button className="button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span>Pagina {page} de {totalPages}</span>
        <button className="button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Proxima</button>
      </div>
    </section>
  )
}

function PatioAlocacao({
  veiculos,
  areas,
  funcionarios,
  boxes,
  isLoading,
  onVehicleChange,
  onAllocate,
}: {
  veiculos: PatioAlocacaoVeiculo[]
  areas: PatioAreaPendente[]
  funcionarios: PatioFuncionario[]
  boxes: PatioBox[]
  isLoading: boolean
  onVehicleChange: (patioVeiculoId: number) => Promise<void>
  onAllocate: (input: { patioVeiculoId: number; area: PatioAreaPendente['area']; boxId: number; funcionarioId: number }) => Promise<void>
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedArea, setSelectedArea] = useState<PatioAreaPendente['area'] | ''>('')
  const [selectedBox, setSelectedBox] = useState('')
  const [selectedFuncionario, setSelectedFuncionario] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedVehicleId && veiculos[0]) {
      const firstVehicleId = String(veiculos[0].patioVeiculoId)
      setSelectedVehicleId(firstVehicleId)
      void onVehicleChange(veiculos[0].patioVeiculoId)
    }
  }, [onVehicleChange, selectedVehicleId, veiculos])

  useEffect(() => {
    if (areas[0] && !selectedArea) setSelectedArea(areas[0].area)
  }, [areas, selectedArea])

  useEffect(() => {
    if (boxes[0] && (!selectedBox || !boxes.some((box) => String(box.patioBoxId) === selectedBox))) {
      setSelectedBox(String(boxes[0].patioBoxId))
    }
  }, [boxes, selectedBox])

  useEffect(() => {
    if (funcionarios[0] && (!selectedFuncionario || !funcionarios.some((funcionario) => String(funcionario.patioFuncionarioId) === selectedFuncionario))) {
      setSelectedFuncionario(String(funcionarios[0].patioFuncionarioId))
    }
  }, [funcionarios, selectedFuncionario])

  const selectedVehicle = veiculos.find((item) => String(item.patioVeiculoId) === selectedVehicleId)
  const selectedAreaInfo = areas.find((item) => item.area === selectedArea)
  const selectedBoxInfo = boxes.find((box) => String(box.patioBoxId) === selectedBox)
  const selectedFuncionarioInfo = funcionarios.find((funcionario) => String(funcionario.patioFuncionarioId) === selectedFuncionario)

  const handleVehicleChange = async (value: string) => {
    setSelectedVehicleId(value)
    setSelectedArea('')
    setError('')
    if (value) await onVehicleChange(Number(value))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedVehicleId || !selectedArea || !selectedBox || !selectedFuncionario) {
      setError('Selecione veiculo, area, box e funcionario.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onAllocate({
        patioVeiculoId: Number(selectedVehicleId),
        area: selectedArea,
        boxId: Number(selectedBox),
        funcionarioId: Number(selectedFuncionario),
      })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel alocar o servico.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Alocacao de Servicos por Area</h2>
          <p>Selecione um veiculo com servicos pendentes e aloque-o a um box e funcionario.</p>
        </div>
        <strong>{veiculos.length} veiculos aguardando</strong>
      </div>
      {isLoading && <div className="empty-state">Carregando alocacao...</div>}
      {!isLoading && veiculos.length === 0 && <div className="empty-state">Nenhum veiculo aguardando alocacao no momento.</div>}
      {veiculos.length > 0 && (
        <form className="panel subtle" onSubmit={submit}>
          {error && <div className="inline-error">{error}</div>}
          <div className="patio-action-guide">
            <strong>Sugestao automatica</strong>
            <span>
              {selectedArea ? areaLabel(selectedArea) : 'Area pendente'} - {selectedBoxInfo ? `Box ${selectedBoxInfo.patioBoxId}` : 'escolha um box'} - {selectedFuncionarioInfo?.nome ?? 'escolha um funcionario'}.
              Ajuste apenas se precisar.
            </span>
          </div>
          <div className="filters-grid">
            <label>
              Selecione o Veiculo para Alocar
              <select value={selectedVehicleId} onChange={(event) => void handleVehicleChange(event.target.value)}>
                {veiculos.map((veiculo) => (
                  <option value={veiculo.patioVeiculoId} key={veiculo.patioVeiculoId}>
                    {veiculo.placa ?? 'Sem placa'} ({veiculo.clienteNome ?? 'Empresa nao informada'})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Area do Servico a ser executado
              <select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value as PatioAreaPendente['area'])}>
                <option value="">Selecione</option>
                {areas.map((area) => (
                  <option value={area.area} key={area.area}>{areaLabel(area.area)} ({area.totalItens})</option>
                ))}
              </select>
            </label>
            <label>
              Box Disponivel
              <select value={selectedBox} onChange={(event) => setSelectedBox(event.target.value)}>
                <option value="">Selecione</option>
                {boxes.map((box) => <option value={box.patioBoxId} key={box.patioBoxId}>Box {box.patioBoxId}</option>)}
              </select>
            </label>
            <label>
              Funcionario Responsavel
              <select value={selectedFuncionario} onChange={(event) => setSelectedFuncionario(event.target.value)}>
                <option value="">Selecione</option>
                {funcionarios.map((funcionario) => (
                  <option value={funcionario.patioFuncionarioId} key={funcionario.patioFuncionarioId}>
                    {funcionario.patioFuncionarioId} - {funcionario.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="status-list">
            <div className="status-row"><span>Veiculo</span><strong>{selectedVehicle?.placa ?? 'Selecione'}</strong></div>
            <div className="status-row"><span>Empresa</span><strong>{selectedVehicle?.clienteNome ?? 'Nao informada'}</strong></div>
            <div className="status-row"><span>Quilometragem do cadastro</span><strong>{selectedAreaInfo?.quilometragem ? numberLabel(selectedAreaInfo.quilometragem) : 'Nao encontrada'}</strong></div>
          </div>
          <button className="button primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Alocando...' : 'Alocar Servicos e Iniciar Execucao'}
          </button>
        </form>
      )}
    </section>
  )
}

function PatioBoxes({
  items,
  isLoading,
  catalogoServicos,
  onLoadServicos,
  onAddServico,
  onRetirar,
  onFinalizar,
  onRefresh,
  onOpenClient,
}: {
  items: PatioPainelBox[]
  isLoading: boolean
  catalogoServicos: PatioCatalogoServico[]
  onLoadServicos: (patioExecucaoId: number) => Promise<PatioBoxServico[]>
  onAddServico: (input: { patioExecucaoId: number; area: PatioBoxServico['area']; servicoNome: string; quantidade: number }) => Promise<void>
  onRetirar: (patioExecucaoId: number) => Promise<void>
  onFinalizar: (input: { patioExecucaoId: number; servicos: Array<{ id: string; quantidade: number; observacaoExecucao?: string }>; observacaoFinal?: string }) => Promise<void>
  onRefresh: () => Promise<void>
  onOpenClient: (clienteId: string) => void
}) {
  const activeCount = items.filter((item) => item.patioExecucaoId).length
  const [expanded, setExpanded] = useState<number | undefined>()
  const [servicosByExecucao, setServicosByExecucao] = useState<Record<number, PatioBoxServico[]>>({})
  const [extraServico, setExtraServico] = useState<Record<number, { nome: string; area: PatioBoxServico['area']; quantidade: string }>>({})
  const [observacaoFinal, setObservacaoFinal] = useState<Record<number, string>>({})
  const [savingAction, setSavingAction] = useState('')
  const [error, setError] = useState('')

  const loadServicos = async (patioExecucaoId: number) => {
    const rows = await onLoadServicos(patioExecucaoId)
    setServicosByExecucao((current) => ({ ...current, [patioExecucaoId]: rows }))
    return rows
  }

  const toggleDetails = async (patioExecucaoId: number) => {
    setError('')
    if (expanded === patioExecucaoId) {
      setExpanded(undefined)
      return
    }
    setExpanded(patioExecucaoId)
    if (!servicosByExecucao[patioExecucaoId]) {
      await loadServicos(patioExecucaoId)
    }
  }

  const updateServico = (patioExecucaoId: number, servicoId: string, patch: Partial<Pick<PatioBoxServico, 'quantidade' | 'observacaoExecucao'>>) => {
    setServicosByExecucao((current) => ({
      ...current,
      [patioExecucaoId]: (current[patioExecucaoId] ?? []).map((servico) =>
        servico.id === servicoId ? { ...servico, ...patch } : servico,
      ),
    }))
  }

  const handleAddServico = async (event: FormEvent, patioExecucaoId: number) => {
    event.preventDefault()
    const draft = extraServico[patioExecucaoId] ?? { nome: '', area: 'borracharia', quantidade: '1' }
    const nome = draft.nome.trim()
    if (!nome) {
      setError('Informe o servico extra antes de adicionar.')
      return
    }
    setSavingAction(`add-${patioExecucaoId}`)
    setError('')
    try {
      await onAddServico({
        patioExecucaoId,
        area: draft.area,
        servicoNome: nome,
        quantidade: Math.max(1, Number(draft.quantidade) || 1),
      })
      setExtraServico((current) => ({ ...current, [patioExecucaoId]: { nome: '', area: draft.area, quantidade: '1' } }))
      await loadServicos(patioExecucaoId)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel adicionar o servico extra.')
    } finally {
      setSavingAction('')
    }
  }

  const boxActionLabel = (item: PatioPainelBox) =>
    `BOX ${item.boxId} - ${item.placa ?? 'sem placa'} - ${item.clienteNome ?? 'cliente sem vinculo'}`

  const handleRetirar = async (item: PatioPainelBox) => {
    if (!item.patioExecucaoId) return
    if (!window.confirm(`Retirar do box?\n\n${boxActionLabel(item)}\n\nOs servicos voltarao para a fila de alocacao.`)) return
    const patioExecucaoId = item.patioExecucaoId
    setSavingAction(`retirar-${patioExecucaoId}`)
    setError('')
    try {
      await onRetirar(patioExecucaoId)
      setExpanded(undefined)
      setServicosByExecucao((current) => {
        const next = { ...current }
        delete next[patioExecucaoId]
        return next
      })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel retirar o box.')
    } finally {
      setSavingAction('')
    }
  }

  const handleFinalizar = async (item: PatioPainelBox) => {
    if (!item.patioExecucaoId) return
    if (!window.confirm(`Finalizar atendimento?\n\n${boxActionLabel(item)}\n\nConfira quantidades e observacoes antes de confirmar.`)) return
    const patioExecucaoId = item.patioExecucaoId
    setSavingAction(`finalizar-${patioExecucaoId}`)
    setError('')
    try {
      const rows = servicosByExecucao[patioExecucaoId] ?? await loadServicos(patioExecucaoId)
      await onFinalizar({
        patioExecucaoId,
        servicos: rows.map((servico) => ({
          id: servico.id,
          quantidade: servico.quantidade,
          observacaoExecucao: servico.observacaoExecucao,
        })),
        observacaoFinal: observacaoFinal[patioExecucaoId],
      })
      setExpanded(undefined)
      setServicosByExecucao((current) => {
        const next = { ...current }
        delete next[patioExecucaoId]
        return next
      })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel finalizar o box.')
    } finally {
      setSavingAction('')
    }
  }

  const handleRefresh = async () => {
    setSavingAction('refresh')
    setError('')
    try {
      await onRefresh()
      setExpanded(undefined)
      setServicosByExecucao({})
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel sincronizar os boxes.')
    } finally {
      setSavingAction('')
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Visao Geral dos Boxes</h2>
          <p>Monitore, atualize e finalize os servicos em cada box.</p>
        </div>
        <div className="inline-actions">
          <button className="button" type="button" disabled={savingAction === 'refresh'} onClick={() => void handleRefresh()}>
            {savingAction === 'refresh' ? 'Sincronizando...' : 'Sincronizar Todos os Boxes'}
          </button>
          <strong>{activeCount} ativos</strong>
        </div>
      </div>
      {error && <div className="inline-error">{error}</div>}
      {isLoading && <div className="empty-state">Carregando boxes...</div>}
      {!isLoading && items.length === 0 && <div className="empty-state">Nenhum box cadastrado no snapshot atual.</div>}
      <div className="patio-box-grid">
        {items.map((item) => (
          <article className={item.patioExecucaoId ? 'panel subtle patio-box-card active' : 'panel subtle patio-box-card free'} key={item.boxId}>
            {!item.patioExecucaoId ? (
              <h3>BOX {item.boxId} - Livre</h3>
            ) : (
              <>
                <div className="panel-header">
                  <div>
                    <h3>BOX {item.boxId}</h3>
                    <p>{item.funcionarioNome ?? 'Funcionario nao informado'}</p>
                  </div>
                  {item.clienteId && <button className="button compact-button" type="button" onClick={() => onOpenClient(item.clienteId!)}>Ficha CRM</button>}
                </div>
                <div className="status-list">
                  <div className="status-row"><span>Placa</span><strong>{item.placa ?? 'Sem placa'}</strong></div>
                  <div className="status-row"><span>Empresa</span><strong>{item.clienteNome ?? 'N/A'}</strong></div>
                  <div className="status-row"><span>Motorista</span><strong>{item.nomeMotorista || 'N/A'} {item.contatoMotorista ? `(${item.contatoMotorista})` : ''}</strong></div>
                  <div className="status-row"><span>KM de Entrada</span><strong>{item.quilometragem ? numberLabel(item.quilometragem) : 'N/A'}</strong></div>
                  {item.veiculoDescricao && <div className="status-row"><span>Modelo</span><strong>{item.veiculoDescricao}</strong></div>}
                </div>
                {item.listaServicos && <div className="patio-box-services" dangerouslySetInnerHTML={{ __html: item.listaServicos }} />}
                <div className="patio-box-action-bar">
                  <span>
                    <strong>{item.placa ?? 'Sem placa'}</strong>
                    <small>{item.clienteNome ?? 'Cliente sem vinculo'} - BOX {item.boxId}</small>
                  </span>
                  <button
                    className="button"
                    type="button"
                    disabled={savingAction === `retirar-${item.patioExecucaoId}`}
                    onClick={() => void handleRetirar(item)}
                  >
                    Retirar do Box
                  </button>
                  <button className="button" type="button" onClick={() => void toggleDetails(item.patioExecucaoId!)}>
                    {expanded === item.patioExecucaoId ? 'Ocultar detalhes' : 'Detalhar servicos'}
                  </button>
                  <button
                    className="button primary"
                    type="button"
                    disabled={savingAction === `finalizar-${item.patioExecucaoId}`}
                    onClick={() => void handleFinalizar(item)}
                  >
                    {savingAction === `finalizar-${item.patioExecucaoId}` ? 'Finalizando...' : 'Finalizar Box'}
                  </button>
                </div>
                {expanded === item.patioExecucaoId && (
                  <div className="patio-box-detail">
                    <h4>Servicos em execucao</h4>
                    {(servicosByExecucao[item.patioExecucaoId] ?? []).map((servico) => (
                      <div className="patio-box-service-row" key={servico.id}>
                        <div>
                          <strong>{servico.servicoNome ?? areaLabel(servico.area)}</strong>
                          <span>{areaLabel(servico.area)}{servico.observacaoCadastro ? ` - ${servico.observacaoCadastro}` : ''}</span>
                        </div>
                        <label>
                          Qtd.
                          <input
                            type="number"
                            min="0"
                            value={servico.quantidade}
                            onChange={(event) => updateServico(item.patioExecucaoId!, servico.id, { quantidade: Number(event.target.value) })}
                          />
                        </label>
                        <label>
                          Obs. execucao
                          <input
                            value={servico.observacaoExecucao ?? ''}
                            onChange={(event) => updateServico(item.patioExecucaoId!, servico.id, { observacaoExecucao: event.target.value })}
                            placeholder="Opcional"
                          />
                        </label>
                      </div>
                    ))}
                    <form className="patio-box-extra" onSubmit={(event) => void handleAddServico(event, item.patioExecucaoId!)}>
                      <label>
                        Servico extra
                        <input
                          list={`patio-box-extra-${item.patioExecucaoId}-${extraServico[item.patioExecucaoId!]?.area ?? 'borracharia'}`}
                          value={extraServico[item.patioExecucaoId!]?.nome ?? ''}
                          onChange={(event) => setExtraServico((current) => ({
                            ...current,
                            [item.patioExecucaoId!]: {
                              area: current[item.patioExecucaoId!]?.area ?? 'borracharia',
                              quantidade: current[item.patioExecucaoId!]?.quantidade ?? '1',
                              nome: event.target.value,
                            },
                          }))}
                          placeholder="Ex.: ALINHAMENTO"
                        />
                        <datalist id={`patio-box-extra-${item.patioExecucaoId}-${extraServico[item.patioExecucaoId!]?.area ?? 'borracharia'}`}>
                          {catalogoServicos
                            .filter((servico) => servico.area === (extraServico[item.patioExecucaoId!]?.area ?? 'borracharia'))
                            .map((servico) => <option value={servico.nome} key={`${item.patioExecucaoId}-${servico.area}-${servico.nome}`} />)}
                        </datalist>
                      </label>
                      <label>
                        Area
                        <select
                          value={extraServico[item.patioExecucaoId!]?.area ?? 'borracharia'}
                          onChange={(event) => setExtraServico((current) => ({
                            ...current,
                            [item.patioExecucaoId!]: {
                              nome: current[item.patioExecucaoId!]?.nome ?? '',
                              quantidade: current[item.patioExecucaoId!]?.quantidade ?? '1',
                              area: event.target.value as PatioBoxServico['area'],
                            },
                          }))}
                        >
                          <option value="borracharia">Borracharia</option>
                          <option value="alinhamento">Alinhamento</option>
                          <option value="manutencao">Manutencao</option>
                        </select>
                      </label>
                      <label>
                        Qtd.
                        <input
                          type="number"
                          min="1"
                          value={extraServico[item.patioExecucaoId!]?.quantidade ?? '1'}
                          onChange={(event) => setExtraServico((current) => ({
                            ...current,
                            [item.patioExecucaoId!]: {
                              nome: current[item.patioExecucaoId!]?.nome ?? '',
                              area: current[item.patioExecucaoId!]?.area ?? 'borracharia',
                              quantidade: event.target.value,
                            },
                          }))}
                        />
                      </label>
                      <button className="button" type="submit" disabled={savingAction === `add-${item.patioExecucaoId}`}>
                        {savingAction === `add-${item.patioExecucaoId}` ? 'Adicionando...' : 'Adicionar extra'}
                      </button>
                    </form>
                    <label className="patio-box-final-note">
                      Observacao final do box
                      <textarea
                        value={observacaoFinal[item.patioExecucaoId] ?? ''}
                        onChange={(event) => setObservacaoFinal((current) => ({ ...current, [item.patioExecucaoId!]: event.target.value }))}
                        placeholder="Observacoes finais, avarias, itens nao executados..."
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function PatioConcluidos({
  items,
  total,
  servicos,
  page,
  pageSize,
  query,
  startDate,
  endDate,
  isLoading,
  onQueryChange,
  onDateRangeChange,
  onPageChange,
  onUpdateTipoAtendimento,
  onReverter,
  onOpenClient,
}: {
  items: PatioAtendimentoResumo[]
  total: number
  servicos: PatioAtendimentoItemResumo[]
  page: number
  pageSize: number
  query: string
  startDate: string
  endDate: string
  isLoading: boolean
  onQueryChange: (query: string) => void
  onDateRangeChange: (startDate: string, endDate: string) => void
  onPageChange: (page: number) => void
  onUpdateTipoAtendimento: (servicoId: string, tipoAtendimento: string) => Promise<void>
  onReverter: (patioExecucaoId: number) => Promise<void>
  onOpenClient: (clienteId: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const servicosByExecucao = useMemo(() => {
    const grouped = new Map<number, PatioAtendimentoItemResumo[]>()
    servicos.forEach((servico) => {
      if (!servico.patioExecucaoId) return
      grouped.set(servico.patioExecucaoId, [...(grouped.get(servico.patioExecucaoId) ?? []), servico])
    })
    return grouped
  }, [servicos])
  const [savingId, setSavingId] = useState<number | undefined>()
  const [savingTipoId, setSavingTipoId] = useState<string | undefined>()
  const [error, setError] = useState('')
  const [termTarget, setTermTarget] = useState<PatioAtendimentoResumo | null>(null)
  const [termConditions, setTermConditions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (termTarget) setTermConditions({})
  }, [termTarget?.patioExecucaoId])

  const handleReverter = async (patioExecucaoId: number) => {
    if (!window.confirm('Reverter esta visita concluida e devolver os servicos para alocacao?')) return
    setSavingId(patioExecucaoId)
    setError('')
    try {
      await onReverter(patioExecucaoId)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel reverter a visita.')
    } finally {
      setSavingId(undefined)
    }
  }

  const selectedTermConditions = PATIO_TERMO_CONDICOES.filter((condition) => termConditions[condition.id])

  const handleTipoAtendimentoChange = async (servicoId: string, tipoAtendimento: string) => {
    setSavingTipoId(servicoId)
    setError('')
    try {
      await onUpdateTipoAtendimento(servicoId, tipoAtendimento)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o tipo de atendimento.')
    } finally {
      setSavingTipoId(undefined)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Servicos concluidos</h2>
          <p>Historico operacional recente sincronizado do patio. Acoes comerciais devem seguir pela ficha CRM.</p>
        </div>
        <strong>{total} registros</strong>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="filters-grid">
        <label>
          Buscar
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cliente, placa ou motorista" />
        </label>
        <label>
          Inicio
          <input type="date" value={startDate} onChange={(event) => onDateRangeChange(event.target.value, endDate)} />
        </label>
        <label>
          Fim
          <input type="date" value={endDate} onChange={(event) => onDateRangeChange(startDate, event.target.value)} />
        </label>
      </div>
      {isLoading && <div className="empty-state">Carregando concluidos...</div>}
      {!isLoading && items.length === 0 && <div className="empty-state">Nenhum atendimento encontrado.</div>}
      <div className="table-list">
        {items.map((item) => {
          const itemServicos = servicosByExecucao.get(item.patioExecucaoId) ?? []
          return (
          <article className="panel subtle" key={item.patioExecucaoId}>
            <div className="panel-header">
              <div>
                <h3>{item.placa ?? 'Sem placa'} · {item.clienteNome ?? 'Cliente sem vinculo'}</h3>
                <p>{dateLabel(item.fimExecucao)} · {item.quilometragem ? `${numberLabel(item.quilometragem)} km` : 'KM nao informado'} · {item.status}</p>
              </div>
              <div className="inline-actions">
                {item.clienteId && <button className="button" type="button" onClick={() => onOpenClient(item.clienteId!)}>Ficha CRM</button>}
                <button className="button" type="button" onClick={() => setTermTarget(item)}>Gerar termo</button>
                <button
                  className="button"
                  type="button"
                  disabled={savingId === item.patioExecucaoId}
                  onClick={() => void handleReverter(item.patioExecucaoId)}
                >
                  {savingId === item.patioExecucaoId ? 'Revertendo...' : 'Reverter visita'}
                </button>
              </div>
            </div>
            <div className="status-list">
              <div className="status-row"><span>Motorista</span><strong>{item.nomeMotorista || 'Nao informado'}</strong></div>
              <div className="status-row"><span>Feedback</span><strong>{item.dataFeedback ? dateLabel(item.dataFeedback) : 'Pendente'}</strong></div>
            </div>
            <div className="panel-subsection">
              <h4>Servicos realizados nesta visita</h4>
              {itemServicos.length === 0 ? (
                <p className="muted">Nenhum servico detalhado encontrado para esta visita.</p>
              ) : (
                <div className="compact-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Area</th>
                        <th>Servico</th>
                        <th>Qtd.</th>
                        <th>Cadastrado</th>
                        <th>Finalizado</th>
                        <th>Tipo</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemServicos.map((servico) => (
                        <tr key={servico.id}>
                          <td>{areaLabel(servico.area)}</td>
                          <td>{servico.servicoNome || servico.descricao || 'Servico'}</td>
                          <td>{patioQuantidadeLabel(servico.quantidade)}</td>
                          <td>{dateTimeLabel(servico.solicitadoEm)}</td>
                          <td>{dateTimeLabel(servico.atualizadoEm || item.fimExecucao)}</td>
                          <td>
                            <select
                              value={servico.tipoAtendimento || 'Normal'}
                              disabled={savingTipoId === servico.id}
                              onChange={(event) => void handleTipoAtendimentoChange(servico.id, event.target.value)}
                            >
                              <option value="Normal">Normal</option>
                              <option value="Retorno">Retorno</option>
                            </select>
                          </td>
                          <td>{servico.status || 'finalizado'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </article>
          )
        })}
      </div>
      {termTarget && (
        <div className="patio-term-workspace">
          <div className="panel-header">
            <div>
              <h3>Termo de responsabilidade</h3>
              <p>{termTarget.placa ?? 'Sem placa'} - {termTarget.clienteNome ?? 'Cliente sem vinculo'}</p>
            </div>
            <div className="inline-actions">
              <button className="button" type="button" onClick={() => setTermTarget(null)}>Fechar</button>
              <button
                className="button primary"
                type="button"
                onClick={() => printPatioResponsibilityTerm(termTarget, selectedTermConditions)}
              >
                Imprimir termo
              </button>
            </div>
          </div>
          <div className="patio-term-grid">
            <div className="panel subtle">
              <h4>Condições observadas</h4>
              <div className="checkbox-grid">
                {PATIO_TERMO_CONDICOES.map((condition) => (
                  <label key={condition.id} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={Boolean(termConditions[condition.id])}
                      onChange={(event) => setTermConditions((current) => ({ ...current, [condition.id]: event.target.checked }))}
                    />
                    <span>{condition.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="patio-term-preview">
              <PatioResponsibilityTermPreview atendimento={termTarget} conditions={selectedTermConditions} />
            </div>
          </div>
        </div>
      )}
      <div className="pagination-bar">
        <button className="button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span>Pagina {page} de {totalPages}</span>
        <button className="button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Proxima</button>
      </div>
    </section>
  )
}

type PatioTermCondition = {
  id: string
  label: string
  kind: 'avaria' | 'carga' | 'cambagem'
}

const PATIO_TERMO_CONDICOES: PatioTermCondition[] = [
  { id: 'folga_bucha_jumelo', label: 'Folga em Bucha Jumelo', kind: 'avaria' },
  { id: 'folga_bucha_tirante', label: 'Folga em Bucha Tirante', kind: 'avaria' },
  { id: 'folga_terminal', label: 'Folga em Terminal', kind: 'avaria' },
  { id: 'pino_centro_quebrado', label: 'Pino de Centro Quebrado', kind: 'avaria' },
  { id: 'folga_manga_eixo', label: 'Folga em Manga de Eixo', kind: 'avaria' },
  { id: 'folga_rolamento', label: 'Folga em Rolamento', kind: 'avaria' },
  { id: 'mola_quebrada', label: 'Mola Quebrada', kind: 'avaria' },
  { id: 'carreta_carregada', label: 'Carreta Carregada', kind: 'carga' },
  { id: 'cambagem', label: 'Cambagem', kind: 'cambagem' },
]

function PatioResponsibilityTermPreview({
  atendimento,
  conditions,
}: {
  atendimento: PatioAtendimentoResumo
  conditions: PatioTermCondition[]
}) {
  const term = buildPatioResponsibilityTerm(atendimento, conditions)
  return (
    <article className="patio-term-document">
      <h3>TERMO DE RESPONSABILIDADE</h3>
      {term.paragraphs.slice(0, 1).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
      ))}
      {term.avarias.length > 0 && (
        <ul>
          {term.avarias.map((avaria) => <li key={avaria}>{avaria}</li>)}
        </ul>
      )}
      {term.paragraphs.slice(1).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
      ))}
      <p>{term.dataExtenso}</p>
      <div className="patio-term-signature">
        <span />
        <strong>{term.motorista}</strong>
      </div>
    </article>
  )
}

function buildPatioResponsibilityTerm(atendimento: PatioAtendimentoResumo, conditions: PatioTermCondition[]) {
  const motorista = (atendimento.nomeMotorista || 'RESPONSAVEL PELO VEICULO').toUpperCase()
  const placa = (atendimento.placa || 'NAO INFORMADA').toUpperCase()
  const cliente = (atendimento.clienteNome || 'CLIENTE NAO INFORMADO').toUpperCase()
  const veiculo = (atendimento.veiculoDescricao || 'VEICULO').toUpperCase()
  const avarias = conditions.filter((condition) => condition.kind === 'avaria').map((condition) => condition.label.toUpperCase())
  const hasCarga = conditions.some((condition) => condition.kind === 'carga')
  const hasCambagem = conditions.some((condition) => condition.kind === 'cambagem')
  const dataExtenso = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date())

  const paragraphs = [
    `Eu, ${motorista}, responsável pelo veículo ${veiculo} de placa ${placa}, pertencente à empresa ${cliente}, declaro que autorizo a execução do serviço de alinhamento na unidade acima identificada, ciente de que o serviço será realizado pela Capital Truck Center mesmo diante das condições descritas neste termo.`,
  ]

  if (avarias.length > 0) {
    paragraphs.push('O veículo apresenta avarias ou folgas que podem comprometer a precisão e a eficácia do alinhamento, podendo resultar em resultado insatisfatório ou fora dos padrões recomendados.')
    paragraphs.push('Estou ciente de que a circulação do veículo com tais condições representa risco potencial à segurança, podendo gerar perda de estabilidade, desgaste prematuro dos pneus e danos adicionais ao sistema de suspensão e direção.')
  }
  if (hasCarga) {
    paragraphs.push('O veículo encontra-se carregado, condição que pode interferir na medição precisa dos ângulos de alinhamento devido à alteração temporária na geometria da suspensão e direção.')
  }
  if (hasCambagem) {
    paragraphs.push('Foi constatado que a cambagem do veículo encontra-se fora dos parâmetros recomendados, podendo afetar dirigibilidade, desgaste dos pneus e desempenho geral da suspensão.')
  }
  paragraphs.push('Assumo total responsabilidade pelas consequências decorrentes da realização do alinhamento nestas condições, bem como pela utilização do veículo após a execução do serviço.')
  paragraphs.push('Declaro, ainda, que compreendo e aceito que, devido às condições apresentadas, este serviço será realizado sem garantia, uma vez que não é possível garantir a precisão técnica exigida pelo fabricante.')

  return {
    motorista,
    placa,
    cliente,
    veiculo,
    avarias,
    dataExtenso: `Dourados - MS, ${dataExtenso}`,
    paragraphs,
  }
}

function printPatioResponsibilityTerm(atendimento: PatioAtendimentoResumo, conditions: PatioTermCondition[]) {
  const term = buildPatioResponsibilityTerm(atendimento, conditions)
  const avariasHtml = term.avarias.length > 0
    ? `<p><strong>Condicoes observadas:</strong></p><ul>${term.avarias.map((avaria) => `<li>${escapeHtml(avaria)}</li>`).join('')}</ul>`
    : ''
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Termo - ${escapeHtml(term.placa)}</title>
  <style>
    @page { size: A4 portrait; margin: 1.6cm; }
    body { color: #111827; font-family: Arial, sans-serif; margin: 0; }
    main { max-width: 760px; margin: 0 auto; }
    h1 { font-size: 18px; text-align: center; margin: 0 0 22px; letter-spacing: 0; }
    p { font-size: 12px; line-height: 1.55; margin: 0 0 12px; text-align: justify; }
    ul { margin: 0 0 14px 20px; padding: 0; }
    li { font-size: 12px; margin: 4px 0; }
    .meta { border: 1px solid #d1d5db; margin: 0 0 18px; padding: 10px 12px; }
    .signature { margin-top: 52px; text-align: center; }
    .signature span { display: block; border-top: 1px solid #111827; margin: 0 auto 8px; width: 320px; }
  </style>
</head>
<body>
  <main>
    <h1>TERMO DE RESPONSABILIDADE</h1>
    <div class="meta">
      <p><strong>Cliente:</strong> ${escapeHtml(term.cliente)}<br><strong>Veículo:</strong> ${escapeHtml(term.veiculo)}<br><strong>Placa:</strong> ${escapeHtml(term.placa)}</p>
    </div>
    ${term.paragraphs.slice(0, 1).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    ${avariasHtml}
    ${term.paragraphs.slice(1).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    <p style="text-align:center;margin-top:28px;">${escapeHtml(term.dataExtenso)}</p>
    <div class="signature"><span></span><strong>${escapeHtml(term.motorista)}</strong></div>
  </main>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function PatioFeedback({
  items,
  total,
  page,
  pageSize,
  query,
  isLoading,
  onQueryChange,
  onRefresh,
  onPageChange,
  onOpenClient,
  onMarkDone,
  onCreateOpportunity,
}: {
  items: PatioFeedbackPendente[]
  total: number
  page: number
  pageSize: number
  query: string
  isLoading: boolean
  onQueryChange: (query: string) => void
  onRefresh: () => void
  onPageChange: (page: number) => void
  onOpenClient: (clienteId: string) => void
  onMarkDone: (item: PatioFeedbackPendente, observacao: string) => Promise<void>
  onCreateOpportunity: (item: PatioFeedbackPendente) => Promise<void>
}) {
  const [busyId, setBusyId] = useState<number | undefined>()
  const [notes, setNotes] = useState<Record<number, string>>({})
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const feedbackStats = {
    comContato: items.filter((item) => item.contatoRecomendado || item.contatoMotorista).length,
    semContato: items.filter((item) => !item.contatoRecomendado && !item.contatoMotorista).length,
    atrasados: items.filter((item) => daysSince(item.fimExecucao) >= 3).length,
  }

  async function run(item: PatioFeedbackPendente, action: () => Promise<void>) {
    setBusyId(item.patioExecucaoId)
    try {
      await action()
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Feedback pos-servico</h2>
          <p>Atendimentos finalizados no patio que ainda precisam de retorno simples pelo WhatsApp.</p>
        </div>
        <div className="row-actions">
          <strong>{total} pendentes</strong>
          <button className="button" type="button" onClick={onRefresh} disabled={isLoading}>
            Atualizar Dados
          </button>
        </div>
      </div>
      <div className="filters-grid">
        <label>
          Buscar
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cliente, placa ou motorista" />
        </label>
      </div>
      <div className="patio-action-guide">
        <strong>Fluxo recomendado</strong>
        <span>1. Abrir WhatsApp com a mensagem pronta. 2. Registrar o retorno no campo de observacao. 3. Marcar como feito ou criar retorno comercial se o cliente pedir cotacao, reclamar ou demonstrar interesse.</span>
      </div>
      <div className="patio-feedback-summary">
        <span><strong>{items.length}</strong> nesta pagina</span>
        <span><strong>{feedbackStats.comContato}</strong> com WhatsApp</span>
        <span><strong>{feedbackStats.semContato}</strong> sem contato</span>
        <span><strong>{feedbackStats.atrasados}</strong> ha 3+ dias</span>
      </div>
      {isLoading && <div className="empty-state">Carregando feedbacks...</div>}
      {!isLoading && items.length === 0 && <div className="empty-state">Nenhum feedback pendente com os filtros atuais.</div>}
      <div className="table-list">
        {items.map((item) => {
          const phone = item.contatoRecomendado || item.contatoMotorista
          const message = buildPatioFeedbackMessage(item)
          const whatsappUrl = waMeUrl(phone, message)
          const pendingDays = daysSince(item.fimExecucao)
          const semContato = !phone
          return (
            <article className={`panel subtle patio-feedback-card${semContato ? ' sem-contato' : ''}`} key={item.patioExecucaoId}>
              <div className="panel-header">
                <div>
                  <h3>{item.clienteNome}</h3>
                  <p>{item.placa ?? 'Sem placa'} · {dateLabel(item.fimExecucao)} · {item.quilometragem ? `${numberLabel(item.quilometragem)} km` : 'KM nao informado'}</p>
                </div>
                <div className="row-actions">
                  {whatsappUrl && (
                    <a className="button primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  )}
                  <button className="button" type="button" onClick={() => onOpenClient(item.clienteId)}>Ficha</button>
                </div>
              </div>
              {semContato && (
                <div className="patio-warning">
                  <strong>Contato ausente.</strong>
                  <span>Abra a ficha para atualizar WhatsApp ou telefone antes de registrar o feedback.</span>
                </div>
              )}
              <div className="status-list">
                <div className="status-row"><span>Contato</span><strong>{item.contatoNome || item.nomeMotorista || 'Nao informado'}</strong></div>
                <div className="status-row"><span>Telefone usado</span><strong>{phone || 'Atualizar cadastro'}</strong></div>
                <div className="status-row"><span>Pendencia</span><strong>{pendingDays > 0 ? `${pendingDays} dia(s) aguardando` : 'Finalizado hoje'}</strong></div>
                <div className="status-row"><span>Servicos</span><strong>{item.servicos.slice(0, 3).join(', ') || 'Servico de patio'}</strong></div>
                <div className="status-row"><span>Objetivo</span><strong>Confirmar satisfacao e capturar oportunidade ou problema</strong></div>
              </div>
              <label className="wide-field">
                Observacao do feedback
                <textarea value={notes[item.patioExecucaoId] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.patioExecucaoId]: event.target.value }))} placeholder="Ex.: cliente elogiou atendimento, pediu cotacao ou nao respondeu." />
              </label>
              <div className="row-actions">
                <button className="button primary" type="button" disabled={busyId === item.patioExecucaoId} onClick={() => void run(item, () => onMarkDone(item, notes[item.patioExecucaoId] ?? ''))}>
                  Marcar feedback feito
                </button>
                <button className="button" type="button" disabled={busyId === item.patioExecucaoId} onClick={() => void run(item, () => onCreateOpportunity(item))}>
                  Criar retorno comercial
                </button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="pagination-bar">
        <button className="button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span>Pagina {page} de {totalPages}</span>
        <button className="button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Proxima</button>
      </div>
    </section>
  )
}

function PatioRevisao({
  items,
  total,
  page,
  pageSize,
  query,
  mode,
  kmMin,
  diasMin,
  isLoading,
  onQueryChange,
  onModeChange,
  onKmMinChange,
  onDiasMinChange,
  onRefresh,
  onAdjustMedia,
  onEditVehicle,
  onPageChange,
  onOpenClient,
  onMarkDone,
  onCreateOpportunity,
}: {
  items: PatioRevisaoProativa[]
  total: number
  page: number
  pageSize: number
  query: string
  mode: 'km' | 'tempo'
  kmMin: number
  diasMin: number
  isLoading: boolean
  onQueryChange: (query: string) => void
  onModeChange: (mode: 'km' | 'tempo') => void
  onKmMinChange: (value: number) => void
  onDiasMinChange: (value: number) => void
  onRefresh: () => void
  onAdjustMedia: (item: PatioRevisaoProativa) => void
  onEditVehicle: (item: PatioRevisaoProativa) => void
  onPageChange: (page: number) => void
  onOpenClient: (clienteId: string) => void
  onMarkDone: (item: PatioRevisaoProativa, observacao: string) => Promise<void>
  onCreateOpportunity: (item: PatioRevisaoProativa) => Promise<void>
}) {
  const [busyId, setBusyId] = useState<number | undefined>()
  const [notes, setNotes] = useState<Record<number, string>>({})
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function run(item: PatioRevisaoProativa, action: () => Promise<void>) {
    setBusyId(item.patioVeiculoId)
    try {
      await action()
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Revisao proativa</h2>
          <p>Veiculos priorizados por KM estimado e tempo desde a ultima passagem no patio.</p>
        </div>
        <div className="row-actions">
          <strong>{total} veiculos</strong>
          <button className="button" type="button" onClick={onRefresh} disabled={isLoading}>
            Atualizar Dados
          </button>
        </div>
      </div>
      <div className="filters-grid">
        <label>
          Modo de busca
          <select value={mode} onChange={(event) => onModeChange(event.target.value as 'km' | 'tempo')}>
            <option value="km">Quilometragem rodada</option>
            <option value="tempo">Tempo desde a ultima visita</option>
          </select>
        </label>
        <label>
          Buscar
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cliente, placa ou motorista" />
        </label>
        {mode === 'km' && <label>
          KM minimo estimado
          <input type="number" value={kmMin} onChange={(event) => onKmMinChange(Number(event.target.value || 0))} />
        </label>}
        {mode === 'tempo' && <label>
          Dias minimos sem visita
          <input type="number" value={diasMin} onChange={(event) => onDiasMinChange(Number(event.target.value || 0))} />
        </label>}
      </div>
      <div className="patio-action-guide">
        <strong>Por que aparece aqui?</strong>
        <span>O sistema cruza ultima visita, KM medio por dia e tempo parado. Medias acima de {numberLabel(PATIO_SUSPICIOUS_KM_MEDIA)} km/dia aparecem como validar KM. Use o contato recomendado, confirme a KM atual e marque contato feito para medir retorno da revisao proativa.</span>
      </div>
      {isLoading && <div className="empty-state">Carregando revisoes...</div>}
      {!isLoading && items.length === 0 && <div className="empty-state">Nenhum veiculo encontrado com esses criterios.</div>}
      <div className="table-list">
        {items.map((item) => {
          const motoristaUrl = waMeUrl(item.contatoMotorista, buildPatioRevisaoMessage(item, 'motorista'))
          const gestorUrl = waMeUrl(item.contatoRecomendado, buildPatioRevisaoMessage(item, 'gestor'))
          const mediaSuspeita = isSuspiciousPatioKmMedia(item.mediaKmDiaria)
          return (
            <article className={`panel subtle patio-revisao-card${mediaSuspeita ? ' media-suspeita' : ''}`} key={item.patioVeiculoId}>
              <div className="panel-header">
                <div>
                  <h3>{item.placa ?? 'Sem placa'} - {item.clienteNome}</h3>
                  <p>{numberLabel(item.kmEstimadoDesdeVisita)} km rodados desde a ultima visita - {item.diasDesdeUltimaVisita} dias sem visita - ultimo KM {item.ultimoKm ? numberLabel(item.ultimoKm) : 'n/d'}</p>
                </div>
                <div className="row-actions">
                  {motoristaUrl && (
                    <a className="button primary" href={motoristaUrl} target="_blank" rel="noreferrer">
                      Falar com Motorista
                    </a>
                  )}
                  {gestorUrl && gestorUrl !== motoristaUrl && (
                    <a className="button primary" href={gestorUrl} target="_blank" rel="noreferrer">
                      Falar com Gestor
                    </a>
                  )}
                  <button className="button" type="button" onClick={() => onOpenClient(item.clienteId)}>Ficha</button>
                </div>
              </div>
              {mediaSuspeita && (
                <div className="patio-warning">
                  <strong>Validar KM antes do contato.</strong>
                  <span>Media de {numberLabel(Math.round(item.mediaKmDiaria ?? 0))} km/dia parece alta. Ajuste a media ou confira o KM atual para evitar abordagem errada.</span>
                </div>
              )}
              <div className="status-list">
                <div className="status-row"><span>Motorista/contato</span><strong>{item.contatoNome || item.nomeMotorista || 'Nao informado'}</strong></div>
                <div className="status-row"><span>Ultima visita</span><strong>{dateLabel(item.ultimoAtendimentoEm)}</strong></div>
                <div className="status-row"><span>Media diaria</span><strong>{item.mediaKmDiaria ? `${numberLabel(Math.round(item.mediaKmDiaria))} km/dia` : 'Sem media'}</strong></div>
                <div className="status-row"><span>Estimativa atual</span><strong>{item.ultimoKm ? `${numberLabel(item.ultimoKm + item.kmEstimadoDesdeVisita)} km` : 'Sem KM base'}</strong></div>
                <div className="status-row"><span>Motivo da acao</span><strong>{mode === 'km' ? `Passou de ${numberLabel(kmMin)} km estimados` : `Mais de ${diasMin} dias sem visita`}</strong></div>
                <div className="status-row"><span>Confianca do calculo</span><strong>{mediaSuspeita ? 'Validar media' : 'Media normal'}</strong></div>
              </div>
              <label className="wide-field">
                Observacao do contato
                <textarea value={notes[item.patioVeiculoId] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.patioVeiculoId]: event.target.value }))} placeholder="Ex.: pediu cotacao, agendou revisao, nao respondeu." />
              </label>
              <div className="row-actions">
                <button className="button primary" type="button" disabled={busyId === item.patioVeiculoId} onClick={() => void run(item, () => onMarkDone(item, notes[item.patioVeiculoId] ?? ''))}>
                  Marcar contato feito
                </button>
                <button className="button" type="button" onClick={() => onAdjustMedia(item)}>
                  Ajustar Media
                </button>
                <button className="button" type="button" onClick={() => onEditVehicle(item)}>
                  Alt. Veiculo/Empresa
                </button>
                <button className="button" type="button" disabled={busyId === item.patioVeiculoId} onClick={() => void run(item, () => onCreateOpportunity(item))}>
                  Criar oportunidade
                </button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="pagination-bar">
        <button className="button" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span>Pagina {page} de {totalPages}</span>
        <button className="button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Proxima</button>
      </div>
    </section>
  )
}

function buildPatioFeedbackMessage(item: PatioFeedbackPendente) {
  const servicos = item.servicos.slice(0, 3).join(', ')
  const contato = item.contatoNome || item.nomeMotorista || 'Cliente'
  const dataServico = dateLabel(item.fimExecucao)
  const km = item.quilometragem ? `${numberLabel(item.quilometragem)} km` : 'KM nao informado'
  return `Ola ${contato},

Somos da Capital Truck Center e estamos fazendo o acompanhamento do servico realizado no seu veiculo ${item.veiculoDescricao ?? ''}, placa ${item.placa ?? ''}, no dia ${dataServico}.

Foi feito ${servicos || 'servico de patio'}, com ${km}.

Gostariamos do seu feedback:

1. O servico resolveu o problema?
2. Como voce avalia a agilidade e o conhecimento da equipe?
3. O atendimento e a estrutura da loja foram satisfatorios?

Sua opiniao e muito importante para melhorarmos sempre.

Agradecemos sua parceria e ficamos a disposicao no (67) 98417-3800.

Atenciosamente,
Equipe de Qualidade | Capital Truck Center`
}

function buildPatioRevisaoMessage(item: PatioRevisaoProativa, target: 'motorista' | 'gestor' = 'motorista') {
  const contato = target === 'motorista'
    ? item.nomeMotorista || 'Cliente'
    : item.contatoNome || 'Cliente'
  const kmUltimaVisita = item.ultimoKm ? numberLabel(item.ultimoKm) : 'nao informado'
  const kmRodados = numberLabel(item.kmEstimadoDesdeVisita)
  const kmAtual = item.ultimoKm ? numberLabel(item.ultimoKm + item.kmEstimadoDesdeVisita) : 'nao estimado'
  return `Ola, ${contato}! Tudo bem?

Aqui e da Capital Truck Center. Vimos que o veiculo ${item.veiculoDescricao ?? ''}, placa ${item.placa ?? ''}, pode estar precisando de uma nova revisao.

A ultima visita foi com ${kmUltimaVisita} km e, com base no historico do nosso sistema, ja rodou aproximadamente ${kmRodados} km desde entao, estando agora com cerca de ${kmAtual} km.

Nosso atendimento e por ordem de chegada, entao e so passar na loja quando puder.

Se a quilometragem atual estiver diferente dessa estimativa, por favor nos envie a KM correta para atualizarmos no sistema.`
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
  contatoRecomendado,
  patioAtendimentos,
  patioItens,
  currentUser,
  onUpdateClient,
  onAddInteraction,
  onOpenBudget,
  onUpdateBudgetStatus,
  onDeleteBudget,
  onCompleteTask,
  onUpdateCampaignStatus,
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
  contatoRecomendado?: ClienteContatoRecomendado
  patioAtendimentos: PatioAtendimentoResumo[]
  patioItens: PatioAtendimentoItemResumo[]
  currentUser: SessaoUsuario
  onUpdateClient: (patch: Partial<Cliente>) => Promise<void>
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onOpenBudget: (orcamentoId: string) => void
  onUpdateBudgetStatus: (orcamentoId: string, status: Orcamento['status'], motivoPerda?: string) => Promise<void>
  onDeleteBudget: (orcamentoId: string) => Promise<void>
  onCompleteTask: (tarefaId: string) => Promise<void>
  onUpdateCampaignStatus: (envio: CampanhaEnvio, status: CampanhaEnvioStatus) => Promise<void>
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
  const [contactReason, setContactReason] = useState('prospeccao')
  const [contactNote, setContactNote] = useState('')
  const [contactResult, setContactResult] = useState('respondeu')
  const [contactTemperature, setContactTemperature] = useState('morno')
  const [contactNextActionText, setContactNextActionText] = useState('')
  const [contactBudgetId, setContactBudgetId] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [whatsappHistoryPaste, setWhatsappHistoryPaste] = useState('')
  const [interpretationFeedback, setInterpretationFeedback] = useState('')
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false)
  const [lastAIAnalysis, setLastAIAnalysis] = useState<WhatsAppContactAnalysis | null>(null)
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [contactFeedback, setContactFeedback] = useState('')
  const [savedContactNextAction, setSavedContactNextAction] = useState<{ text: string; date: string } | null>(null)
  const [contactError, setContactError] = useState('')
  const [isEditingClient, setIsEditingClient] = useState(false)
  const [isSavingClient, setIsSavingClient] = useState(false)
  const [clientDraft, setClientDraft] = useState(() => ({
    responsavel: cliente.responsavel ?? '',
    whatsapp: cliente.whatsapp ?? '',
    telefone: cliente.telefone ?? '',
    email: cliente.email ?? '',
    status: cliente.status,
    observacoes: cliente.observacoes ?? '',
  }))
  const [clientFeedback, setClientFeedback] = useState('')
  const [busyActionId, setBusyActionId] = useState('')

  const clienteVendas = vendasItens.filter((venda) => venda.clienteId === cliente.id)
  const clienteServicos = servicosItens.filter((servico) => servico.clienteId === cliente.id)
  const clienteInteracoes = interacoes.filter((interacao) => interacao.clienteId === cliente.id)
  const recentContactHistory = [...clienteInteracoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8)
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
  const historicalQuoteItems = quoteItemsFromClientHistory(clienteVendas, clienteServicos)
  const historicalQuoteLabels = historicalQuoteItems?.map((item) => item.descricao).slice(0, 5) ?? []
  const frequenciaDias = averageDaysBetween(allEvents.map((item) => item.data))
  const ultimaMovimentacao = allEvents.at(-1)?.data
  const proximaRecompra = frequenciaDias && ultimaMovimentacao ? addDays(ultimaMovimentacao, Math.max(30, Math.round(frequenciaDias))) : undefined
  const veiculosResumo = buildVehicleSummary(veiculos, clienteServicos, clienteVendas)
  const tarefasAbertas = clienteTarefas.filter((tarefa) => tarefa.status === 'aberta')
  const orcamentosAbertos = clienteOrcamentos.filter((orcamento) => ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'].includes(orcamento.status))
  const orcamentoAbertoPrincipal = [...orcamentosAbertos].sort((a, b) => b.data.localeCompare(a.data))[0]
  const ultimoOrcamento = [...clienteOrcamentos].sort((a, b) => b.data.localeCompare(a.data))[0]
  const latestMovements = buildClientServiceTimeline(clienteInteracoes, clienteOrcamentos, clienteTarefas, clienteCampanhas)
  const contactIsTerminal = isTerminalContactResult(contactResult)
  const contactMissingNextStep = !contactIsTerminal && (!nextActionDate || !contactNextActionText.trim())
  const shouldCreateQuoteFromContact = contactResult === 'pediu orcamento'
  const nextOpenTasks = tarefasAbertas
    .slice()
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 5)
  const latestInteraction = recentContactHistory[0]
  const latestCampaign = [...clienteCampanhas].sort((a, b) =>
    (b.dataAberturaWhatsapp ?? b.dataMarcadoEnviado ?? '').localeCompare(a.dataAberturaWhatsapp ?? a.dataMarcadoEnviado ?? ''),
  )[0]
  const ultimoAtendimentoPatio = [...patioAtendimentos].sort((a, b) =>
    (b.fimExecucao ?? b.inicioExecucao ?? '').localeCompare(a.fimExecucao ?? a.inicioExecucao ?? ''),
  )[0]
  const patioServicosRecentes = patioItens.slice(0, 8)
  const contatoOperacional = contatoRecomendado?.whatsapp
    ? contatoRecomendado
    : ultimoAtendimentoPatio?.contatoMotorista
      ? {
          clienteId: cliente.id,
          nome: ultimoAtendimentoPatio.nomeMotorista,
          tipo: 'motorista',
          whatsapp: ultimoAtendimentoPatio.contatoMotorista,
          origemSistema: 'patio',
          prioridade: 80,
          atualizadoEm: ultimoAtendimentoPatio.fimExecucao,
      } satisfies ClienteContatoRecomendado
      : undefined
  const whatsappNumber = contatoOperacional?.whatsapp || cliente.whatsapp
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildServiceOpeningMessage(cliente))}`
    : undefined
  const opportunityDetails = opportunityScoreDetails(cliente, clienteOrcamentos)
  const clienteScore = opportunityScore(cliente, clienteOrcamentos)
  const routineReasons = uniqueBy([
    ...tarefasAbertas
      .slice()
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
      .map((tarefa) => ({
        tone: daysSince(tarefa.dataVencimento) > 0 ? 'danger' : 'warn',
        label: daysSince(tarefa.dataVencimento) > 0 ? 'Tarefa atrasada' : 'Tarefa aberta',
        detail: `${tarefa.titulo} - vence em ${dateLabel(tarefa.dataVencimento)}`,
        action: tarefa.descricao || 'Concluir, reagendar ou registrar o atendimento.',
      })),
    ...orcamentosAbertos
      .slice()
      .sort((a, b) => a.validade.localeCompare(b.validade))
      .map((orcamento) => ({
        tone: isExpiredBudget(orcamento) ? 'danger' : 'warn',
        label: isExpiredBudget(orcamento) ? 'Proposta vencida' : 'Proposta aberta',
        detail: `${money(orcamento.valorTotal)} - validade ${dateLabel(orcamento.validade)}`,
        action: 'Retomar proposta, revisar condicao ou registrar perda/ganho.',
      })),
    ...clienteCampanhas
      .filter((envio) => ['respondeu', 'virou_orcamento'].includes(envio.status))
      .map((envio) => ({
        tone: 'warn',
        label: envio.status === 'virou_orcamento' ? 'Campanha virou orcamento' : 'Resposta de campanha',
        detail: `${envio.campanhaNome ?? 'Campanha'} - ${campaignStatusLabel(envio.status)}`,
        action: 'Responder o cliente e registrar o proximo passo.',
      })),
    cliente.status === 'Reativar' ? {
      tone: 'warn',
      label: 'Cliente para reativar',
      detail: `Ultima compra em ${dateLabel(cliente.ultimaCompraEm)}`,
      action: 'Enviar abordagem de recompra ou criar uma tarefa de retorno.',
    } : undefined,
    daysSince(cliente.ultimaCompraEm) > 90 ? {
      tone: 'warn',
      label: 'Janela de recompra',
      detail: `${daysSince(cliente.ultimaCompraEm)} dias sem compra`,
      action: bestNextAction(cliente),
    } : undefined,
    daysSince(cliente.ultimoContatoEm) > 60 ? {
      tone: 'warn',
      label: 'Sem contato recente',
      detail: `${daysSince(cliente.ultimoContatoEm)} dias desde o ultimo contato registrado`,
      action: 'Fazer contato e salvar o resultado para tirar o cliente da fila.',
    } : undefined,
    !cliente.whatsapp ? {
      tone: 'danger',
      label: 'WhatsApp ausente',
      detail: 'Nao ha numero principal para acionar pelo app.',
      action: 'Atualizar cadastro antes de executar campanha ou rotina.',
    } : undefined,
    !cliente.vendedorId ? {
      tone: 'danger',
      label: 'Sem vendedor responsavel',
      detail: 'Cliente ainda nao esta em uma carteira definida.',
      action: 'Distribuir carteira ou assumir atendimento.',
    } : undefined,
  ].filter(Boolean) as Array<{ tone: string; label: string; detail: string; action: string }>, (item) => item.label)
  const primaryRoutineReason = routineReasons[0] ?? {
    tone: 'neutral',
    label: 'Consulta sem pendencia automatica',
    detail: 'Nao encontramos tarefa aberta, proposta pendente ou campanha respondida agora.',
    action: 'Use esta ficha para consultar historico, registrar atendimento ou criar uma proposta.',
  }
  const guidanceEyebrow = routineReasons.length > 0 ? 'Motivo da prioridade' : 'Consulta livre'
  const approachFacts = [
    latestInteraction ? `Ultimo atendimento: ${latestInteraction.resultado || interactionTypeLabel(latestInteraction.tipo)} em ${dateLabel(latestInteraction.data)}` : 'Sem atendimento registrado no CRM.',
    produtoPrincipal || cliente.produtoPrincipal ? `Produto principal: ${produtoPrincipal || cliente.produtoPrincipal}` : undefined,
    servicoRecorrente ? `Servico recorrente: ${servicoRecorrente}` : undefined,
    latestCampaign ? `Ultima campanha: ${latestCampaign.campanhaNome ?? 'Campanha'} - ${campaignStatusLabel(latestCampaign.status)}` : undefined,
    ultimoAtendimentoPatio ? `Ultimo patio: ${dateLabel(ultimoAtendimentoPatio.fimExecucao ?? ultimoAtendimentoPatio.inicioExecucao)}${ultimoAtendimentoPatio.placa ? ` - placa ${ultimoAtendimentoPatio.placa}` : ''}` : undefined,
    contatoOperacional?.whatsapp ? `Contato recomendado: ${contatoOperacional.nome || contatoOperacional.tipo} (${contatoOperacional.origemSistema})` : undefined,
    proximaRecompra ? `Recompra estimada: ${dateLabel(proximaRecompra)}` : undefined,
  ].filter(Boolean)

  useEffect(() => {
    setClientDraft({
      responsavel: cliente.responsavel ?? '',
      whatsapp: cliente.whatsapp ?? '',
      telefone: cliente.telefone ?? '',
      email: cliente.email ?? '',
      status: cliente.status,
      observacoes: cliente.observacoes ?? '',
    })
    setIsEditingClient(false)
  }, [cliente.id, cliente.responsavel, cliente.whatsapp, cliente.telefone, cliente.email, cliente.status, cliente.observacoes])

  async function handleCreateTask() {
    setIsCreatingTask(true)
    try {
      await onCreateTask()
      setActiveTab('tarefas')
    } finally {
      setIsCreatingTask(false)
    }
  }

  async function registerContact(createQuote = false) {
    const resultado = contactResult
    if (contactMissingNextStep) {
      setContactError('Defina a proxima acao e a data antes de salvar um contato que ainda precisa de follow-up.')
      return
    }

    const tipo = createQuote ? 'orcamento' : contactReason
    const resumo = buildContactSummary({
      reason: contactReason,
      result: resultado,
      temperature: contactTemperature,
      note: contactNote,
      nextAction: contactNextActionText,
    })
    setIsSavingContact(true)
    setContactFeedback('')
    setSavedContactNextAction(null)
    setContactError('')
    try {
      const created = await onAddInteraction({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        canal: contactChannel,
        tipo,
        resumo,
        resultado,
        proximaAcao: nextActionDate ? contactNextActionText.trim() || nextActionLabelFromResult(resultado) : undefined,
        dataProximaAcao: nextActionDate || undefined,
        orcamentoId: contactBudgetId || undefined,
      })
      const nextClientStatus = clientStatusFromContactResult(resultado)
      if (nextClientStatus && nextClientStatus !== cliente.status) {
        await onUpdateClient({ status: nextClientStatus })
      }
      const savedNextAction = created.dataProximaAcao
        ? {
            text: created.proximaAcao || contactNextActionText.trim() || nextActionLabelFromResult(resultado),
            date: created.dataProximaAcao,
          }
        : null
      setSavedContactNextAction(savedNextAction)
      setContactFeedback(savedNextAction
        ? `Contato registrado em ${dateLabel(created.data)}. Proxima acao criada para ${dateLabel(savedNextAction.date)}.`
        : `Contato registrado em ${dateLabel(created.data)}.`)
      setContactNote('')
      setNextActionDate('')
      setContactNextActionText('')
      setContactBudgetId('')
      setContactResult('respondeu')
      setContactTemperature('morno')
      setLastAIAnalysis(null)
      if (createQuote) onCreateQuote(quoteItemsFromAnalysis(lastAIAnalysis))
    } finally {
      setIsSavingContact(false)
    }
  }

  function applyWhatsAppInterpretation() {
    const interpretation = interpretWhatsAppConversation(whatsappHistoryPaste, cliente.nome)
    if (!interpretation.summary) {
      setInterpretationFeedback('Cole um trecho maior da conversa para interpretar.')
      return
    }
    setContactChannel('WhatsApp')
    setContactReason(interpretation.reason)
    setContactResult(interpretation.result)
    setContactTemperature(interpretation.temperature)
    setContactNote(interpretation.summary)
    setContactNextActionText(interpretation.nextAction)
    setNextActionDate(interpretation.nextAction ? addDays(new Date().toISOString().slice(0, 10), interpretation.nextActionDays) : '')
    setLastAIAnalysis(null)
    setInterpretationFeedback('Conversa interpretada. Revise os campos antes de salvar no historico.')
  }

  async function applyWhatsAppAIAnalysis() {
    if (!whatsappHistoryPaste.trim()) {
      setInterpretationFeedback('Cole a conversa antes de analisar com IA.')
      return
    }

    setIsAnalyzingWithAI(true)
    setInterpretationFeedback('')
    try {
      const analysis = await analyzeWhatsAppContact({
        conversation: whatsappHistoryPaste,
        clienteNome: cliente.nome,
      })
      setContactChannel('WhatsApp')
      setContactReason(analysis.reason)
      setContactResult(analysis.result)
      setContactTemperature(analysis.temperature)
      setContactNote(formatAIContactSummary(analysis))
      setContactNextActionText(analysis.nextAction)
      setNextActionDate(analysis.nextAction ? addDays(new Date().toISOString().slice(0, 10), analysis.nextActionDays) : '')
      setLastAIAnalysis(analysis)
      setInterpretationFeedback(`IA analisou a conversa com ${Math.round(analysis.confidence * 100)}% de confianca. Revise antes de salvar.`)
    } catch (exception) {
      const fallback = interpretWhatsAppConversation(whatsappHistoryPaste, cliente.nome)
      setContactChannel('WhatsApp')
      setContactReason(fallback.reason)
      setContactResult(fallback.result)
      setContactTemperature(fallback.temperature)
      setContactNote(fallback.summary)
      setContactNextActionText(fallback.nextAction)
      setNextActionDate(fallback.nextAction ? addDays(new Date().toISOString().slice(0, 10), fallback.nextActionDays) : '')
      setLastAIAnalysis(null)
      setInterpretationFeedback(exception instanceof Error
        ? `IA indisponivel: ${exception.message}. Usei a interpretacao local como fallback.`
        : 'IA indisponivel. Usei a interpretacao local como fallback.')
    } finally {
      setIsAnalyzingWithAI(false)
    }
  }

  async function saveClientDraft() {
    setIsSavingClient(true)
    setClientFeedback('')
    try {
      const patch: Partial<Cliente> = {
        responsavel: clientDraft.responsavel || undefined,
        whatsapp: clientDraft.whatsapp || undefined,
        telefone: clientDraft.telefone || undefined,
        email: clientDraft.email || undefined,
        status: clientDraft.status,
        observacoes: clientDraft.observacoes || undefined,
      }
      await onUpdateClient(patch)
      setClientFeedback('Cadastro atualizado.')
      setIsEditingClient(false)
    } finally {
      setIsSavingClient(false)
    }
  }

  async function openWhatsappAndRegister() {
    if (!whatsappUrl) return
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    const created = await onAddInteraction({
      clienteId: cliente.id,
      vendedorId: cliente.vendedorId ?? currentUser.id,
      canal: 'WhatsApp',
      tipo: 'atendimento',
      resumo: 'WhatsApp aberto pela central de atendimento.',
      resultado: 'whatsapp aberto',
    })
    setContactFeedback(`WhatsApp aberto e registrado em ${dateLabel(created.data)}.`)
  }

  async function runAction(id: string, action: () => Promise<void>) {
    setBusyActionId(id)
    try {
      await action()
    } finally {
      setBusyActionId('')
    }
  }

  return (
    <section className="client360">
      <div className="panel wide client360-hero">
        <div>
          <span className="status-pill">{origemLabel(cliente.origemBase)}</span>
          <h2>{cliente.nome}</h2>
          <p>{cliente.cidade}/{cliente.uf} · {cliente.tipoCliente} · {cliente.vendedorNome ?? 'Sem vendedor responsavel'}</p>
        </div>
        <div className="client360-actions">
          <button className="button" type="button" onClick={() => setIsEditingClient((current) => !current)}>
            {isEditingClient ? 'Fechar cadastro' : 'Editar cadastro'}
          </button>
        </div>
        <section className="client360-command-center">
          <article className={`client360-routine-card ${primaryRoutineReason.tone}`}>
            <span className="next-action-label">{guidanceEyebrow}</span>
            <h3>{primaryRoutineReason.label}</h3>
            <p>{primaryRoutineReason.detail}</p>
            <strong>{primaryRoutineReason.action}</strong>
            {routineReasons.length > 1 && (
              <div className="client360-routine-tags">
                {routineReasons.slice(1, 5).map((reason) => (
                  <span className={`status-pill compact ${reason.tone === 'danger' ? 'danger' : reason.tone === 'warn' ? 'warn' : ''}`} key={reason.label}>
                    {reason.label}
                  </span>
                ))}
              </div>
            )}
          </article>
          <article className="client360-routine-card">
            <span className="next-action-label">Antes de chamar</span>
            <h3>{contatoOperacional?.whatsapp || cliente.whatsapp || cliente.telefone || 'Contato nao informado'}</h3>
            {contatoOperacional && (
              <p>
                {contatoOperacional.nome || contactTypeLabel(contatoOperacional.tipo)} - {contactTypeLabel(contatoOperacional.tipo)}
                {' '}via {contatoOperacional.origemSistema === 'patio' ? 'patio' : 'cadastro'}
              </p>
            )}
            <div className="client360-approach-list">
              {approachFacts.slice(0, 5).map((fact) => <span key={fact}>{fact}</span>)}
            </div>
            <div className="client360-guidance-actions">
              <button className="button compact-button" type="button" onClick={() => setActiveTab('timeline')}>Linha do tempo</button>
              <button className="button compact-button" type="button" onClick={() => setActiveTab('vendas')}>Vendas</button>
              <button className="button compact-button" type="button" onClick={() => setActiveTab('orcamentos')}>Propostas</button>
              <button className="button compact-button" type="button" onClick={() => setIsEditingClient(true)}>Cadastro</button>
            </div>
          </article>
          <article className="client360-routine-card compact">
            <span className="next-action-label">Saude comercial</span>
            <div className="status-list">
              <div className="status-row"><span>Score</span><strong>{Math.round(clienteScore)}</strong></div>
              <div className="status-row"><span>Tarefas</span><strong>{tarefasAbertas.length}</strong></div>
              <div className="status-row"><span>Propostas</span><strong>{orcamentosAbertos.length}</strong></div>
              <div className="status-row"><span>Total historico</span><strong>{money(cliente.totalComprado + cliente.totalServicos)}</strong></div>
            </div>
          </article>
        </section>
        {(ultimoAtendimentoPatio || patioServicosRecentes.length > 0) && (
          <section className="client360-command-center">
            <article className="client360-routine-card">
              <span className="next-action-label">Sinal do patio</span>
              <h3>{ultimoAtendimentoPatio ? `Ultimo atendimento ${dateLabel(ultimoAtendimentoPatio.fimExecucao ?? ultimoAtendimentoPatio.inicioExecucao)}` : 'Sem atendimento recente'}</h3>
              <div className="client360-approach-list">
                {ultimoAtendimentoPatio?.placa && <span>Placa: {ultimoAtendimentoPatio.placa}</span>}
                {ultimoAtendimentoPatio?.quilometragem && <span>KM: {numberLabel(ultimoAtendimentoPatio.quilometragem)}</span>}
                {ultimoAtendimentoPatio?.nomeMotorista && <span>Motorista: {ultimoAtendimentoPatio.nomeMotorista}</span>}
                {ultimoAtendimentoPatio?.dataFeedback ? <span>Feedback registrado</span> : <span>Feedback ainda nao registrado</span>}
              </div>
            </article>
            <article className="client360-routine-card">
              <span className="next-action-label">Servicos do patio</span>
              <h3>{patioServicosRecentes.length} itens recentes</h3>
              <div className="client360-approach-list">
                {patioServicosRecentes.slice(0, 5).map((item) => (
                  <span key={item.id}>
                    {dateLabel(item.solicitadoEm)} - {item.servicoNome || item.descricao || item.area}
                    {item.quilometragem ? ` - KM ${numberLabel(item.quilometragem)}` : ''}
                  </span>
                ))}
              </div>
            </article>
          </section>
        )}
        {opportunityDetails.length > 0 && (
          <details className="client360-contact-tools client360-score-details">
            <summary>{routineReasons.length > 0 ? 'Ver criterios que ajudam a priorizar' : 'Ver criterios de potencial comercial'}</summary>
            <div className="client360-score-list">
              {opportunityDetails.map((item) => (
                <span key={item.label}>{item.label} <strong>+{item.points}</strong></span>
              ))}
            </div>
          </details>
        )}
        <div className="info-grid">
          <Info label="Ultima compra" value={dateLabel(cliente.ultimaCompraEm)} />
          <Info label="Produto principal" value={produtoPrincipal || cliente.produtoPrincipal || 'Sem historico'} />
          <Info label="Ultimo contato" value={latestInteraction ? dateLabel(latestInteraction.data) : 'Sem registro'} />
          <Info label="WhatsApp" value={cliente.whatsapp || 'Atualizar cadastro'} />
          <Info label="Propostas abertas" value={orcamentosAbertos.length.toString()} />
          <Info label="Tarefas abertas" value={tarefasAbertas.length.toString()} />
          <Info label="Total historico" value={money(cliente.totalComprado + cliente.totalServicos)} />
          <Info label="Ultima proposta" value={ultimoOrcamento ? `${money(ultimoOrcamento.valorTotal)} · ${ultimoOrcamento.status}` : 'Sem historico'} />
        </div>
        {clientFeedback && <div className="readiness ok">{clientFeedback}</div>}
        {isEditingClient && (
          <div className="client360-edit-grid">
            <label>
              Responsavel
              <input value={clientDraft.responsavel} onChange={(event) => setClientDraft((current) => ({ ...current, responsavel: event.target.value }))} />
            </label>
            <label>
              WhatsApp
              <input value={clientDraft.whatsapp} onChange={(event) => setClientDraft((current) => ({ ...current, whatsapp: event.target.value }))} />
            </label>
            <label>
              Telefone
              <input value={clientDraft.telefone} onChange={(event) => setClientDraft((current) => ({ ...current, telefone: event.target.value }))} />
            </label>
            <label>
              Email
              <input value={clientDraft.email} onChange={(event) => setClientDraft((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Status
              <select value={clientDraft.status} onChange={(event) => setClientDraft((current) => ({ ...current, status: event.target.value as ClienteStatus }))}>
                <option value="Novo">Novo</option>
                <option value="Ativo">Ativo</option>
                <option value="Em acompanhamento">Em acompanhamento</option>
                <option value="Orcamento aberto">Orcamento aberto</option>
                <option value="Reativar">Reativar</option>
                <option value="Inativo">Inativo</option>
                <option value="Nao contatar">Nao contatar</option>
              </select>
            </label>
            <label className="wide-field">
              Observacoes comerciais
              <textarea value={clientDraft.observacoes} onChange={(event) => setClientDraft((current) => ({ ...current, observacoes: event.target.value }))} />
            </label>
            <button className="button primary" type="button" disabled={isSavingClient} onClick={() => void saveClientDraft()}>
              {isSavingClient ? 'Salvando...' : 'Salvar cadastro'}
            </button>
          </div>
        )}
      </div>

      <section className="client360-workbench">
        <div className="panel client360-contact-panel">
          <div className="client360-contact-lead">
            <div>
              <span className="next-action-label">Atendimento do cliente</span>
              <h2>{cliente.nome}</h2>
              <p>{cliente.cidade}/{cliente.uf} - {cliente.vendedorNome ?? 'Sem vendedor responsavel'} - {cliente.status}</p>
            </div>
            <div className="client360-contact-lead-actions">
              {whatsappUrl && (
                <button className="button primary" type="button" onClick={() => void openWhatsappAndRegister()}>
                  <MessageCircle size={16} /> Abrir WhatsApp
                </button>
              )}
              {orcamentoAbertoPrincipal ? (
                <button className="button primary" type="button" onClick={() => onOpenBudget(orcamentoAbertoPrincipal.id)}>
                  Abrir proposta aberta
                </button>
              ) : (
                <button className="button primary" type="button" onClick={() => onCreateQuote()}>Nova proposta</button>
              )}
              <button className="button" type="button" onClick={handleCreateTask} disabled={isCreatingTask}>
                {isCreatingTask ? 'Criando...' : 'Criar tarefa'}
              </button>
              <button className="button" type="button" onClick={onBack}>Voltar</button>
            </div>
          </div>
          <div className="panel-header">
            <div>
              <h2>Atendimento agora</h2>
              <p>Registre o resultado do contato sem sair da ficha.</p>
            </div>
          </div>
          {contactFeedback && <div className="readiness ok">{contactFeedback}</div>}
          {contactError && <div className="alert">{contactError}</div>}
          {interpretationFeedback && <div className="readiness ok">{interpretationFeedback}</div>}
          <details className="client360-contact-tools">
            <summary>Interpretar conversa do WhatsApp</summary>
            <div className="whatsapp-interpret-box">
              <label className="client360-contact-note">
                Colar conversa do WhatsApp
                <textarea
                  value={whatsappHistoryPaste}
                  onChange={(event) => setWhatsappHistoryPaste(event.target.value)}
                  placeholder="Cole aqui o trecho do ultimo atendimento. O sistema resume e preenche os campos abaixo para revisao."
                />
              </label>
              <div className="client360-save-bar">
                <button className="button primary" type="button" disabled={isAnalyzingWithAI} onClick={() => void applyWhatsAppAIAnalysis()}>
                  {isAnalyzingWithAI ? 'Analisando...' : 'Analisar com IA'}
                </button>
                <button className="button primary" type="button" onClick={applyWhatsAppInterpretation}>
                  Interpretar local
                </button>
                <button className="button" type="button" disabled={!whatsappHistoryPaste.trim()} onClick={() => {
                  setWhatsappHistoryPaste('')
                  setInterpretationFeedback('')
                }}>
                  Limpar conversa
                </button>
              </div>
            </div>
          </details>
          <div className="client360-outcome-buttons">
            {[
              ['pediu orcamento', 'Pediu orcamento'],
              ['nao respondeu', 'Nao respondeu'],
              ['comprar depois', 'Comprar depois'],
              ['sem interesse', 'Sem interesse'],
              ['fechou pedido', 'Fechou pedido'],
            ].map(([value, label]) => (
              <button
                className={contactResult === value ? 'button primary' : 'button'}
                type="button"
                key={value}
                onClick={() => {
                  setContactResult(value)
                  if (value === 'pediu orcamento') {
                    setContactReason('orcamento')
                    setContactTemperature('quente')
                    setNextActionDate(new Date().toISOString().slice(0, 10))
                    setContactNextActionText('Montar e enviar proposta')
                  }
                  if (value === 'nao respondeu' && !nextActionDate) {
                    setNextActionDate(addDays(new Date().toISOString().slice(0, 10), 1))
                    setContactNextActionText('Tentar novo contato')
                  }
                  if (value === 'comprar depois') {
                    setContactTemperature('morno')
                    setNextActionDate(addDays(new Date().toISOString().slice(0, 10), 30))
                    setContactNextActionText('Retomar oportunidade')
                  }
                  if (value === 'sem interesse') {
                    setContactTemperature('frio')
                    setNextActionDate('')
                    setContactNextActionText('')
                  }
                  if (value === 'fechou pedido') {
                    setContactTemperature('quente')
                    setNextActionDate('')
                    setContactNextActionText('')
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="client360-contact-note">
            Observacao do contato
            <textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} placeholder="Ex.: pediu pneu 295/80 para cotar hoje, prefere pagamento 30/60." />
          </label>
          <div className="client360-next-action-row">
            <label className="client360-contact-note">
              Proxima acao planejada
              <input value={contactNextActionText} onChange={(event) => setContactNextActionText(event.target.value)} placeholder="Ex.: enviar proposta revisada, ligar as 14h, confirmar disponibilidade." />
            </label>
            <label className="client360-contact-note">
              Data
              <input type="date" value={nextActionDate} onChange={(event) => setNextActionDate(event.target.value)} />
            </label>
          </div>
          <details className="client360-contact-tools">
            <summary>Ajustes opcionais do atendimento</summary>
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
                Objetivo
                <select value={contactReason} onChange={(event) => setContactReason(event.target.value)}>
                  <option value="prospeccao">Prospeccao</option>
                  <option value="reativacao">Reativacao</option>
                  <option value="orcamento">Orcamento</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="pos-venda">Pos-venda</option>
                  <option value="cobranca">Cobranca</option>
                  <option value="cadastro">Cadastro</option>
                </select>
              </label>
              <label>
                Resultado detalhado
                <select value={contactResult} onChange={(event) => setContactResult(event.target.value)}>
                  <option value="respondeu">Respondeu</option>
                  <option value="pediu orcamento">Pediu orcamento</option>
                  <option value="nao respondeu">Nao respondeu</option>
                  <option value="comprar depois">Comprar depois</option>
                  <option value="sem interesse">Sem interesse</option>
                  <option value="numero invalido">Numero invalido</option>
                  <option value="dados atualizados">Dados atualizados</option>
                  <option value="reclamacao">Reclamacao</option>
                  <option value="fechou pedido">Fechou pedido</option>
                </select>
              </label>
              <label>
                Temperatura
                <select value={contactTemperature} onChange={(event) => setContactTemperature(event.target.value)}>
                  <option value="quente">Quente</option>
                  <option value="morno">Morno</option>
                  <option value="frio">Frio</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </label>
              <label>
                Orcamento vinculado
                <select value={contactBudgetId} onChange={(event) => setContactBudgetId(event.target.value)}>
                  <option value="">Sem vinculo</option>
                  {clienteOrcamentos.slice(0, 20).map((orcamento) => (
                    <option value={orcamento.id} key={orcamento.id}>
                      {orcamento.id.slice(0, 8)} - {money(orcamento.valorTotal)} - {orcamento.status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
          {lastAIAnalysis && (
            <div className="ai-contact-brief">
              <div>
                <strong>{lastAIAnalysis.negotiationStatus}</strong>
                <span>{lastAIAnalysis.temperature} - {lastAIAnalysis.result}</span>
              </div>
              {lastAIAnalysis.detectedProducts.length > 0 && (
                <p>Itens detectados: {lastAIAnalysis.detectedProducts.join(', ')}</p>
              )}
              {lastAIAnalysis.objections.length > 0 && (
                <p>Travas: {lastAIAnalysis.objections.join(', ')}</p>
              )}
              {lastAIAnalysis.paymentTerms.length > 0 && (
                <p>Pagamento: {lastAIAnalysis.paymentTerms.join(', ')}</p>
              )}
              {lastAIAnalysis.detectedProducts.length > 0 && (
                <button className="button" type="button" onClick={() => onCreateQuote(quoteItemsFromAnalysis(lastAIAnalysis))}>
                  Nova proposta com itens detectados
                </button>
              )}
            </div>
          )}
          <div className="client360-save-bar">
            <button className="button primary" type="button" disabled={isSavingContact} onClick={() => void registerContact(shouldCreateQuoteFromContact)}>
              {isSavingContact ? 'Salvando...' : shouldCreateQuoteFromContact ? 'Salvar e criar proposta' : 'Salvar atendimento'}
            </button>
            {shouldCreateQuoteFromContact ? (
              <button className="button" type="button" disabled={isSavingContact} onClick={() => void registerContact(false)}>
                Salvar sem proposta
              </button>
            ) : (
              <button className="button" type="button" disabled={isSavingContact} onClick={() => void registerContact(true)}>
                Salvar e criar proposta
              </button>
            )}
            <span>{contactIsTerminal ? 'Contato conclusivo' : nextActionDate ? `Proxima acao em ${dateLabel(nextActionDate)}` : 'Defina proxima acao para nao perder o follow-up'}</span>
          </div>
          {savedContactNextAction && (
            <div className="client360-next-action-confirmed">
              <span className="next-action-label">Proxima acao criada</span>
              <strong>{savedContactNextAction.text}</strong>
              <small>{dateLabel(savedContactNextAction.date)}</small>
            </div>
          )}
          <div className="client360-recent-history">
            <strong>Historico de atendimento</strong>
            {recentContactHistory.map((interacao) => (
              <div className="contact-history-card" key={interacao.id}>
                <div>
                  <span className="status-pill">{interacao.resultado || 'sem resultado'}</span>
                  <strong>{interacao.canal} - {interactionTypeLabel(interacao.tipo)}</strong>
                  <small>{dateLabel(interacao.data)}</small>
                </div>
                <p>{interacao.resumo}</p>
                <div className="contact-history-meta">
                  {interacao.dataProximaAcao && <span>Proxima acao: {dateLabel(interacao.dataProximaAcao)}</span>}
                  {interacao.proximaAcao && <span>{interacao.proximaAcao}</span>}
                  {interacao.orcamentoId && <button className="button compact-button" type="button" onClick={() => onOpenBudget(interacao.orcamentoId!)}>Abrir orcamento</button>}
                </div>
              </div>
            ))}
            {clienteInteracoes.length === 0 && <div className="empty-state compact">Nenhum atendimento registrado ainda.</div>}
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
            <div className="status-row"><span>Status CRM</span><strong>{cliente.status}</strong></div>
            <div className="status-row"><span>Ultima compra</span><strong>{dateLabel(cliente.ultimaCompraEm)}</strong></div>
            <div className="status-row"><span>Produto principal</span><strong>{produtoPrincipal || cliente.produtoPrincipal || 'Sem historico'}</strong></div>
            <div className="status-row"><span>Servico recorrente</span><strong>{servicoRecorrente || 'Sem historico'}</strong></div>
            <div className="status-row"><span>Proxima recompra</span><strong>{dateLabel(proximaRecompra)}</strong></div>
            <div className="status-row"><span>Tarefas abertas</span><strong>{tarefasAbertas.length}</strong></div>
          </div>
          <div className="client360-history-quote">
            <div>
              <strong>Proposta sugerida pelo historico</strong>
              <small>
                {historicalQuoteItems?.length
                  ? `${historicalQuoteItems.length} itens reais para revisar no editor.`
                  : 'Sem compras ou servicos suficientes para sugerir itens.'}
              </small>
            </div>
            {historicalQuoteLabels.length > 0 && (
              <div className="client360-history-quote-tags">
                {historicalQuoteLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            )}
            <button
              className="button primary"
              type="button"
              disabled={!historicalQuoteItems?.length}
              onClick={() => historicalQuoteItems && onCreateQuote(historicalQuoteItems)}
            >
              Nova proposta com historico
            </button>
          </div>
          <div className="client-followup-queue">
            <strong>Fila deste cliente</strong>
            {nextOpenTasks.map((tarefa) => (
              <div className="contact-history-card" key={tarefa.id}>
                <div>
                  <span className="status-pill">{tarefa.status}</span>
                  <strong>{tarefa.titulo}</strong>
                  <small>{dateLabel(tarefa.dataVencimento)}</small>
                </div>
                <p>{tarefa.descricao || 'Sem descricao.'}</p>
              </div>
            ))}
            {orcamentosAbertos.slice(0, 3).map((orcamento) => (
              <div className="contact-history-card" key={orcamento.id}>
                <div>
                  <span className="status-pill">{orcamento.status}</span>
                  <strong>{money(orcamento.valorTotal)}</strong>
                  <small>Validade {dateLabel(orcamento.validade)}</small>
                </div>
                <button className="button compact-button" type="button" onClick={() => onOpenBudget(orcamento.id)}>Abrir proposta</button>
              </div>
            ))}
            {nextOpenTasks.length === 0 && orcamentosAbertos.length === 0 && (
              <div className="empty-state compact">Sem pendencias abertas para este cliente.</div>
            )}
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
              <button className="button compact-button" type="button" onClick={() => onCreateQuote([quoteItemFromVenda(venda)])}>Nova proposta</button>
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
              <button className="button compact-button" type="button" onClick={() => onCreateQuote([quoteItemFromServico(servico)])}>Nova proposta</button>
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
                <div className="row-actions">
                  <button className="button compact-button" type="button" onClick={() => onOpenBudget(orcamento.id)}>Abrir</button>
                  <button className="button compact-button" type="button" onClick={() => onCreateQuote(orcamento.itens?.map((item) => ({ ...item, valorTotal: undefined })))}>Revisar</button>
                  {cliente.whatsapp && (
                    <a
                      className="button compact-button"
                      href={`https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(buildQuoteMessage(cliente, orcamento.itens?.map((item) => ({ ...item, valorTotal: item.valorTotal ?? quoteItemTotal(item) })) ?? [], orcamento.validade, orcamento.observacao, quoteScenariosFromBudget(orcamento)))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Reenviar
                    </a>
                  )}
                  <button className="button compact-button" type="button" disabled={busyActionId === `budget-${orcamento.id}-enviado`} onClick={() => runAction(`budget-${orcamento.id}-enviado`, () => onUpdateBudgetStatus(orcamento.id, 'enviado'))}>Enviado</button>
                  <button className="button compact-button" type="button" disabled={busyActionId === `budget-${orcamento.id}-ganho`} onClick={() => runAction(`budget-${orcamento.id}-ganho`, () => onUpdateBudgetStatus(orcamento.id, 'ganho'))}>Ganho</button>
                  <button
                    className="button compact-button danger"
                    type="button"
                    disabled={busyActionId === `budget-${orcamento.id}-delete`}
                    onClick={() => {
                      if (window.confirm(`Excluir a proposta ${orcamento.id.slice(0, 8)} deste cliente?`)) {
                        void runAction(`budget-${orcamento.id}-delete`, () => onDeleteBudget(orcamento.id))
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {clienteOrcamentos.length === 0 && <div className="empty-state">Sem propostas.</div>}
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
              <span>Acao</span>
            </div>
            {clienteTarefas.map((tarefa) => (
              <div className="table-row client360-task" key={tarefa.id}>
                <span>{dateLabel(tarefa.dataVencimento)}</span>
                <span><strong>{tarefa.titulo}</strong><small>{tarefa.descricao || 'Sem descricao'}</small></span>
                <span>{tarefa.vendedorNome || 'Sem responsavel'}</span>
                <span>{tarefa.origem}</span>
                <strong>{tarefa.status}</strong>
                <button className="button compact-button" type="button" disabled={tarefa.status !== 'aberta' || busyActionId === `task-${tarefa.id}`} onClick={() => runAction(`task-${tarefa.id}`, () => onCompleteTask(tarefa.id))}>
                  Concluir
                </button>
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
              <span>Acao</span>
            </div>
            {clienteCampanhas.map((envio) => (
              <div className="table-row client360-campaign" key={envio.id}>
                <span><strong>{envio.campanhaNome || envio.campanhaId}</strong><small>{envio.mensagemFinal}</small></span>
                <span>{campaignStatusLabel(envio.status)}</span>
                <span>{envio.telefone || 'Sem telefone'}</span>
                <span>{envio.virouOrcamento ? 'Sim' : 'Nao'}</span>
                <strong>{money(envio.receitaAtribuida ?? 0)}</strong>
                <div className="row-actions">
                  <button className="button compact-button" type="button" disabled={busyActionId === `campaign-${envio.id}-respondeu`} onClick={() => runAction(`campaign-${envio.id}-respondeu`, () => onUpdateCampaignStatus(envio, 'respondeu'))}>Respondeu</button>
                  <button className="button compact-button" type="button" disabled={busyActionId === `campaign-${envio.id}-orcamento`} onClick={() => runAction(`campaign-${envio.id}-orcamento`, () => onUpdateCampaignStatus(envio, 'virou_orcamento'))}>Orcamento</button>
                </div>
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

function buildExternalLeadOpeningMessage(cliente: Cliente) {
  const firstName = (cliente.responsavel || cliente.nome).split(' ')[0]
  return `Bom dia, ${firstName}. Aqui e da Capital Truck Center. Estou entrando em contato para entender sua frota e ver se podemos ajudar com pneus ou servicos.`
}

function nextActionLabelFromResult(resultado: string) {
  if (resultado === 'nao respondeu') return 'Tentar novo contato'
  if (resultado === 'comprar depois') return 'Retomar oportunidade'
  if (resultado === 'pediu orcamento') return 'Follow-up de proposta'
  return 'Próximo contato'
}

function interactionTypeLabel(tipo: string) {
  const labels: Record<string, string> = {
    atendimento: 'Atendimento',
    prospeccao: 'Prospeccao',
    reativacao: 'Reativacao',
    orcamento: 'Orcamento',
    'follow-up': 'Follow-up',
    'pos-venda': 'Pos-venda',
    cobranca: 'Cobranca',
    cadastro: 'Cadastro',
    campanha: 'Campanha',
    campanha_inbox: 'Campanha',
  }
  return labels[tipo] ?? tipo
}

function buildContactSummary(input: {
  reason: string
  result: string
  temperature: string
  note: string
  nextAction: string
}) {
  const lines = [
    `Objetivo: ${interactionTypeLabel(input.reason)}.`,
    `Resultado: ${input.result}.`,
    `Temperatura: ${input.temperature}.`,
    input.note.trim() ? `Resumo: ${input.note.trim()}` : '',
    input.nextAction.trim() ? `Proxima acao: ${input.nextAction.trim()}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function formatAIContactSummary(analysis: Awaited<ReturnType<typeof analyzeWhatsAppContact>>) {
  const lines = [
    analysis.summary,
    analysis.negotiationStatus ? `Status da negociacao: ${analysis.negotiationStatus}.` : '',
    analysis.detectedProducts.length ? `Produtos/servicos citados: ${analysis.detectedProducts.join(', ')}.` : '',
    analysis.detectedVehicles.length ? `Veiculos/KM citados: ${analysis.detectedVehicles.join(', ')}.` : '',
    analysis.paymentTerms.length ? `Pagamento citado: ${analysis.paymentTerms.join(', ')}.` : '',
    analysis.objections.length ? `Objecoes/travas: ${analysis.objections.join(', ')}.` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function isTerminalContactResult(result: string) {
  return ['sem interesse', 'numero invalido', 'fechou pedido', 'dados atualizados'].includes(result)
}

function clientStatusFromContactResult(result: string): ClienteStatus | undefined {
  const map: Record<string, ClienteStatus> = {
    'pediu orcamento': 'Orcamento aberto',
    'fechou pedido': 'Ativo',
    'comprar depois': 'Em acompanhamento',
    'nao respondeu': 'Em acompanhamento',
    reclamacao: 'Em acompanhamento',
    'sem interesse': 'Reativar',
    'numero invalido': 'Nao contatar',
    'dados atualizados': 'Em acompanhamento',
  }
  return map[result]
}

function quoteItemsFromAnalysis(analysis: WhatsAppContactAnalysis | null): OrcamentoItemInput[] | undefined {
  if (!analysis?.detectedProducts.length) return undefined
  return analysis.detectedProducts.slice(0, 8).map((description) => ({
    descricao: description,
    tipo: /servi[cç]o|alinhamento|balanceamento|montagem|cambagem/i.test(description) ? 'servico' : 'produto',
    quantidade: quantityFromText(description) ?? 1,
    valorUnitario: 0,
    descontoPercentual: 0,
    apresentacao: 'normal',
    observacao: 'Detectado pela IA a partir da conversa do WhatsApp',
  }))
}

function quoteItemsFromClientHistory(vendas: VendaItem[], servicos: ServicoItem[]): OrcamentoItemInput[] | undefined {
  type RankedSale = {
    venda: VendaItem
    count: number
    total: number
    lastDate: string
  }
  type RankedService = {
    servico: ServicoItem
    count: number
    total: number
    lastDate: string
  }

  const salesByProduct = Array.from(vendas.reduce((acc, venda) => {
    const key = normalizeTextForMatch(`${venda.produtoCodigo ?? ''} ${venda.produtoNome}`)
    if (!key || !venda.produtoNome) return acc
    const current = acc.get(key)
    if (!current) {
      acc.set(key, {
        venda,
        count: 1,
        total: venda.valorTotal || 0,
        lastDate: venda.dataVenda,
      })
      return acc
    }
    current.count += 1
    current.total += venda.valorTotal || 0
    if (venda.dataVenda > current.lastDate) {
      current.venda = venda
      current.lastDate = venda.dataVenda
    }
    return acc
  }, new Map<string, RankedSale>()).values())

  const servicesByName = Array.from(servicos.reduce((acc, servico) => {
    const key = normalizeTextForMatch(`${servico.servicoCodigo ?? ''} ${servico.servicoNome}`)
    if (!key || !servico.servicoNome) return acc
    const current = acc.get(key)
    if (!current) {
      acc.set(key, {
        servico,
        count: 1,
        total: servico.valorTotal || 0,
        lastDate: servico.dataServico,
      })
      return acc
    }
    current.count += 1
    current.total += servico.valorTotal || 0
    if (servico.dataServico > current.lastDate) {
      current.servico = servico
      current.lastDate = servico.dataServico
    }
    return acc
  }, new Map<string, RankedService>()).values())

  const productItems = salesByProduct
    .sort((a, b) => b.count - a.count || b.total - a.total || b.lastDate.localeCompare(a.lastDate))
    .slice(0, 3)
    .map((ranked) => ({
      ...quoteItemFromVenda(ranked.venda),
      observacao: `Historico do cliente: ${ranked.count} compra(s), ultima em ${dateLabel(ranked.lastDate)}.`,
      apresentacao: 'normal' as const,
    }))

  const serviceItems = servicesByName
    .sort((a, b) => b.count - a.count || b.total - a.total || b.lastDate.localeCompare(a.lastDate))
    .slice(0, 3)
    .map((ranked) => ({
      ...quoteItemFromServico(ranked.servico),
      observacao: `Servico recorrente: ${ranked.count} registro(s), ultimo em ${dateLabel(ranked.lastDate)}.`,
      apresentacao: 'complementar' as const,
    }))

  const items = [...productItems, ...serviceItems].filter((item) => item.descricao)
  return items.length ? items : undefined
}

function quantityFromText(value: string) {
  const match = value.match(/\b(\d{1,3})\s*(?:x|un|unidades?|pneus?|pecas?|peças?)\b/i)
  if (!match) return undefined
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function interpretWhatsAppConversation(rawText: string, clienteNome: string) {
  const text = rawText.trim()
  const normalized = removeAccents(text).toLowerCase()
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const cleanLines = lines
    .map((line) => line.replace(/^\[?\d{1,2}\/\d{1,2}\/\d{2,4},?\s*\d{1,2}:\d{2}(?::\d{2})?\]?\s*-?\s*/u, '').trim())
    .filter(Boolean)
  const customerSignals = cleanLines
    .filter((line) => !removeAccents(line).toLowerCase().includes('capital truck'))
    .slice(-6)

  const wantsQuote = /\b(cotar|cotacao|orcar|orcamento|preco|valor|quanto fica|quanto sai|passa.*valor|me ve|manda.*preco)\b/u.test(normalized)
  const closedDeal = /\b(fechou|pode emitir|vou querer|pode fazer|aprovado|manda a ordem|pedido fechado)\b/u.test(normalized)
  const noInterest = /\b(sem interesse|nao tenho interesse|nao preciso|nao quero|ja comprei|comprei em outro|obrigado.*nao)\b/u.test(normalized)
  const later = /\b(mais tarde|depois|mes que vem|semana que vem|vou ver|vou analisar|retorno|te aviso|falo depois)\b/u.test(normalized)
  const complaint = /\b(reclamacao|problema|defeito|garantia|atrasou|nao chegou|ruim|insatisfeito)\b/u.test(normalized)
  const invalidNumber = /\b(numero errado|nao conheco|nao sou|engano)\b/u.test(normalized)
  const payment = Array.from(new Set(text.match(/\b(?:a vista|à vista|pix|boleto|cart[aã]o|30\/60(?:\/90)?|30 dias|60 dias|90 dias|parcelad[oa]|entrada)\b/giu) ?? []))
  const measures = Array.from(new Set(text.match(/\b\d{3}\/\d{2}\s*r?\s*\d{2}(?:[.,]\d)?\b/giu) ?? []))
  const plates = Array.from(new Set(text.match(/\b[A-Z]{3}\d[A-Z0-9]\d{2}\b/giu) ?? []))
  const km = Array.from(new Set(text.match(/\b\d{2,3}(?:\.\d{3})+\s*km\b/giu) ?? []))
  const quantities = Array.from(new Set(text.match(/\b\d+\s*(?:pneus?|un|unidades?|pecas?|peças?)\b/giu) ?? []))

  const result = closedDeal
    ? 'fechou pedido'
    : complaint
      ? 'reclamacao'
      : invalidNumber
        ? 'numero invalido'
        : wantsQuote
          ? 'pediu orcamento'
          : later
            ? 'comprar depois'
            : noInterest
              ? 'sem interesse'
              : 'respondeu'
  const reason = wantsQuote || closedDeal ? 'orcamento' : complaint ? 'pos-venda' : later || noInterest ? 'follow-up' : 'prospeccao'
  const temperature = closedDeal || wantsQuote ? 'quente' : later ? 'morno' : noInterest || invalidNumber ? 'frio' : complaint ? 'quente' : 'morno'
  const nextAction = closedDeal
    ? 'Confirmar disponibilidade, condicoes e emissao do pedido'
    : complaint
      ? 'Tratar reclamacao e retornar com solucao'
      : wantsQuote
        ? 'Montar e enviar proposta'
        : later
          ? 'Retomar contato no prazo combinado'
          : noInterest
            ? 'Registrar baixa prioridade e acompanhar futuramente'
            : invalidNumber
              ? 'Corrigir cadastro e validar contato'
              : 'Continuar atendimento'
  const nextActionDays = closedDeal || wantsQuote || complaint || invalidNumber ? 1 : later ? 7 : noInterest ? 30 : 2
  const details = [
    measures.length ? `Medidas citadas: ${measures.join(', ')}.` : '',
    quantities.length ? `Quantidades citadas: ${quantities.join(', ')}.` : '',
    payment.length ? `Condicoes/pagamento citados: ${payment.join(', ')}.` : '',
    plates.length ? `Placas citadas: ${plates.join(', ')}.` : '',
    km.length ? `KM citado: ${km.join(', ')}.` : '',
  ].filter(Boolean)
  const excerpt = customerSignals.slice(-3).join(' / ')
  const summary = [
    `Conversa WhatsApp com ${clienteNome}.`,
    `Interpretacao: ${result}.`,
    ...details,
    excerpt ? `Trecho relevante: ${excerpt}` : '',
  ].filter(Boolean).join('\n')

  return { reason, result, temperature, nextAction, nextActionDays, summary }
}

function removeAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
      title: `Proposta ${orcamento.status}`,
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
  usuarios,
  currentUser,
  onAddImportacao,
  onOpenClient,
}: {
  importacoes: Importacao[]
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
  onAddImportacao: (importacao: Importacao) => void
  onOpenClient: (clienteId: string) => Promise<void>
}) {
  const [arquivosResumo, setArquivosResumo] = useState<ImportacaoArquivoResumo[]>([])
  const [qualidadeResumo, setQualidadeResumo] = useState<ImportacaoQualidadeResumo | undefined>()
  const [qualidadeIssues, setQualidadeIssues] = useState<ImportacaoQualidadeIssue[]>([])
  const [previews, setPreviews] = useState<XmlImportPreview[]>([])
  const [workbookPreviews, setWorkbookPreviews] = useState<WorkbookImportPreview[]>([])
  const [referencePreview, setReferencePreview] = useState<ReferenceImportPreview | null>(null)
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const [catalogPricePreview, setCatalogPricePreview] = useState<ReferenceImportPreview | null>(null)
  const [catalogPriceFiles, setCatalogPriceFiles] = useState<File[]>([])
  const [isReading, setIsReading] = useState(false)
  const [isReadingWorkbook, setIsReadingWorkbook] = useState(false)
  const [isReadingReference, setIsReadingReference] = useState(false)
  const [isImportingReference, setIsImportingReference] = useState(false)
  const [isReadingCatalogPrices, setIsReadingCatalogPrices] = useState(false)
  const [isImportingCatalogPrices, setIsImportingCatalogPrices] = useState(false)
  const [isFinalizingImport, setIsFinalizingImport] = useState(false)
  const [referenceImportResult, setReferenceImportResult] = useState('')
  const [error, setError] = useState('')
  const [registeredFiles, setRegisteredFiles] = useState<string[]>([])
  const [qualityAssignments, setQualityAssignments] = useState<Record<string, string>>({})
  const [saneamentoRegistros, setSaneamentoRegistros] = useState<ImportacaoSaneamentoRegistro[]>([])
  const [catalogPriceChanges, setCatalogPriceChanges] = useState<CatalogoPriceChange[]>([])
  const [savingQualityIssueId, setSavingQualityIssueId] = useState('')
  const vendedores = usuarios.filter((usuario) => usuario.role === 'vendedor')
  const saneamentoByIssue = useMemo(() => new Map(saneamentoRegistros.map((registro) => [registro.issueId, registro])), [saneamentoRegistros])
  const activeQualityIssues = qualidadeIssues.filter((issue) => !saneamentoByIssue.get(issue.id)?.resolvedAt)
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
  const ultimaImportacaoDetalhe = importacoesRecentes[0]
  const arquivosUltimaImportacao = ultimaImportacaoDetalhe ? arquivosPorImportacao[ultimaImportacaoDetalhe.id] ?? [] : []
  const reconciliacaoResumo = ultimaImportacaoDetalhe
    ? [
        { label: 'Linhas processadas', value: ultimaImportacaoDetalhe.totalItens },
        { label: 'Clientes detectados', value: ultimaImportacaoDetalhe.clientesEncontrados },
        { label: 'Clientes novos', value: ultimaImportacaoDetalhe.clientesCriados },
        { label: 'Itens criados', value: ultimaImportacaoDetalhe.itensCriados ?? 0 },
        { label: 'Ignorados/repetidos', value: ultimaImportacaoDetalhe.itensIgnorados ?? 0 },
        { label: 'Conflitos', value: ultimaImportacaoDetalhe.conflitos },
      ]
    : []

  useEffect(() => {
    listImportacaoArquivos().then(setArquivosResumo).catch(() => setArquivosResumo([]))
    getImportacaoQualidadeResumo().then(setQualidadeResumo).catch(() => setQualidadeResumo(undefined))
    listImportacaoQualidadeIssues().then(setQualidadeIssues).catch(() => setQualidadeIssues([]))
    listCatalogoPriceChanges().then(setCatalogPriceChanges).catch(() => setCatalogPriceChanges([]))
    listImportacaoSaneamentoRegistros()
      .then((registros) => {
        setSaneamentoRegistros(registros)
        setQualityAssignments(Object.fromEntries(registros.filter((registro) => registro.assignedTo).map((registro) => [registro.issueId, registro.assignedTo ?? ''])))
      })
      .catch(() => setSaneamentoRegistros([]))
  }, [importacoes.length])

  async function refreshQuality() {
    const [resumo, issues, registros] = await Promise.all([
      getImportacaoQualidadeResumo(),
      listImportacaoQualidadeIssues(),
      listImportacaoSaneamentoRegistros(),
    ])
    setQualidadeResumo(resumo)
    setQualidadeIssues(issues)
    setSaneamentoRegistros(registros)
    setQualityAssignments(Object.fromEntries(registros.filter((registro) => registro.assignedTo).map((registro) => [registro.issueId, registro.assignedTo ?? ''])))
    listCatalogoPriceChanges().then(setCatalogPriceChanges).catch(() => setCatalogPriceChanges([]))
  }

  async function assignQualityIssue(issue: ImportacaoQualidadeIssue, assignedTo: string) {
    setSavingQualityIssueId(issue.id)
    setError('')
    setQualityAssignments((current) => ({ ...current, [issue.id]: assignedTo }))
    try {
      const saved = await upsertImportacaoSaneamentoRegistro({
        issueId: issue.id,
        issueType: issue.tipo,
        assignedTo,
      })
      setSaneamentoRegistros((current) => [saved, ...current.filter((registro) => registro.issueId !== saved.issueId)])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atribuir responsavel do saneamento.')
    } finally {
      setSavingQualityIssueId('')
    }
  }

  async function resolveQualityIssue(issue: ImportacaoQualidadeIssue) {
    setSavingQualityIssueId(issue.id)
    setError('')
    try {
      const saved = await upsertImportacaoSaneamentoRegistro({
        issueId: issue.id,
        issueType: issue.tipo,
        assignedTo: qualityAssignments[issue.id],
        resolved: true,
        resolvedBy: currentUser.id,
        resolutionNote: issue.acaoSugerida,
      })
      setSaneamentoRegistros((current) => [saved, ...current.filter((registro) => registro.issueId !== saved.issueId)])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel resolver item de saneamento.')
    } finally {
      setSavingQualityIssueId('')
    }
  }

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

  async function handleCatalogPriceFiles(files: FileList | null) {
    if (!files?.length) return
    setIsReadingCatalogPrices(true)
    setError('')
    setReferenceImportResult('')

    try {
      const selectedFiles = Array.from(files)
      setCatalogPriceFiles(selectedFiles)
      setCatalogPricePreview(await previewCatalogPriceFiles(selectedFiles))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel validar a lista de precos.')
    } finally {
      setIsReadingCatalogPrices(false)
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

  async function registerCatalogPricePreview(preview: ReferenceImportPreview) {
    setError('')

    try {
      const created = await createImportacaoPreview({
        tipo: 'catalogo-precos',
        arquivoNome: preview.arquivoNome,
        totalItens: preview.itensDetectados,
        clientesEncontrados: 0,
        conflitos: preview.avisos.length,
      })
      onAddImportacao(created)
      setRegisteredFiles((current) => [...current, preview.arquivoNome])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar a previa de catalogo.')
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
      setCatalogPriceChanges(await listCatalogoPriceChanges())
      await refreshQuality()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel concluir a importacao diaria.')
    } finally {
      setIsImportingReference(false)
    }
  }

  async function runCatalogPriceImport() {
    if (!catalogPricePreview?.ready || catalogPriceFiles.length === 0) return
    setIsImportingCatalogPrices(true)
    setError('')
    setReferenceImportResult('')

    try {
      const result = await importCatalogPriceFiles(catalogPriceFiles)
      const catalogoResumo = result.catalogo
        ? `Catalogo atualizado: ${result.catalogo.itens} itens, ${result.catalogo.precosNovos ?? 0} precos novos, ${result.catalogo.precosAlterados ?? 0} alterados, ${result.catalogo.precosInalterados ?? 0} inalterados.`
        : 'Catalogo atualizado.'
      setReferenceImportResult(catalogoResumo)
      const updated = await listImportacoes()
      const created = updated.find((item) => item.id === result.importacaoId)
      if (created) onAddImportacao(created)
      setArquivosResumo(await listImportacaoArquivos())
      await refreshQuality()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel concluir a importacao de catalogo.')
    } finally {
      setIsImportingCatalogPrices(false)
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
      await refreshQuality()
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
            <h2>Fila de saneamento</h2>
            <p>Problemas priorizados para corrigir cadastro, carteira e historico antes das campanhas.</p>
          </div>
          <button className="button" type="button" onClick={() => void refreshQuality()}>
            <RefreshCw size={16} /> Atualizar fila
          </button>
        </div>
        <div className="quality-issue-grid">
          {activeQualityIssues.map((issue) => (
            <article className={`quality-issue ${issue.severidade}`} key={issue.id}>
              <div>
                <strong>{issue.titulo}</strong>
                <span>{issue.detalhe}</span>
              </div>
              <small>{issue.acaoSugerida}</small>
              <span className="status-pill">{qualityIssueSeverityLabel(issue.severidade)}</span>
              <label>
                Responsavel
                <select
                  value={qualityAssignments[issue.id] ?? ''}
                  disabled={savingQualityIssueId === issue.id}
                  onChange={(event) => void assignQualityIssue(issue, event.target.value)}
                >
                  <option value="">Nao atribuido</option>
                  {vendedores.map((vendedor) => (
                    <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>
                  ))}
                </select>
              </label>
              <div className="row-actions">
                {issue.clienteId && (
                  <button className="button compact-button" type="button" onClick={() => void onOpenClient(issue.clienteId!)}>
                    Abrir ficha
                  </button>
                )}
                <button
                  className="button compact-button"
                  type="button"
                  disabled={savingQualityIssueId === issue.id}
                  onClick={() => void resolveQualityIssue(issue)}
                >
                  {savingQualityIssueId === issue.id ? 'Salvando...' : 'Marcar resolvido'}
                </button>
              </div>
            </article>
          ))}
          {activeQualityIssues.length === 0 && <div className="empty-state">Nenhum problema prioritario encontrado agora.</div>}
        </div>
      </section>
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Reconciliação da última importação</h2>
            <p>Resumo antes/depois para validar se o pacote diário mudou a base como esperado.</p>
          </div>
          <FileUp size={18} />
        </div>
        {ultimaImportacaoDetalhe ? (
          <>
            <div className="message-template">
              <strong>{ultimaImportacaoDetalhe.arquivoNome}</strong>
              <span>{ultimaImportacaoDetalhe.tipo} - {dateLabel(ultimaImportacaoDetalhe.dataImportacao)} - {ultimaImportacaoDetalhe.status}</span>
            </div>
            <div className="info-grid import-quality">
              {reconciliacaoResumo.map((item) => (
                <Info key={item.label} label={item.label} value={item.value.toString()} />
              ))}
            </div>
            <div className="table">
              <div className="table-head five">
                <span>Arquivo</span>
                <span>Tipo</span>
                <span>Obrig.</span>
                <span>Linhas</span>
                <span>Processado</span>
              </div>
              {arquivosUltimaImportacao.map((arquivo) => (
                <div className="table-row five" key={arquivo.id}>
                  <span><strong>{arquivo.arquivoNome}</strong></span>
                  <span>{arquivo.tipo}</span>
                  <span>{arquivo.obrigatorio ? 'Sim' : 'Nao'}</span>
                  <span>{arquivo.totalLinhas}</span>
                  <span>{dateLabel(arquivo.processadoEm)}</span>
                </div>
              ))}
              {arquivosUltimaImportacao.length === 0 && <div className="empty-state compact">Sem arquivos detalhados para a ultima importacao.</div>}
            </div>
            <div className="panel-subsection">
              <div>
                <h3>Mudancas relevantes de preco</h3>
                <p>Itens com variacao recente para validar antes de cotar ou enviar tabela ao cliente.</p>
              </div>
              <div className="table compact">
                <div className="table-head price-change-row">
                  <span>Item</span>
                  <span>Anterior</span>
                  <span>Novo</span>
                  <span>Variacao</span>
                  <span>Origem</span>
                </div>
                {catalogPriceChanges.map((change) => (
                  <div className="table-row price-change-row" key={`${change.catalogoItemId}-${change.criadoEm ?? change.valorNovo}`}>
                    <span>
                      <strong>{change.codigo} - {change.descricao}</strong>
                      <small>{[change.tipo, change.marca, change.grupo].filter(Boolean).join(' - ')}</small>
                    </span>
                    <span>{money(change.valorAnterior)}</span>
                    <span>{money(change.valorNovo)}</span>
                    <span className={change.diferenca >= 0 ? 'positive' : 'negative'}>
                      {change.diferenca >= 0 ? '+' : ''}{money(change.diferenca)} ({formatPriceChangePercent(change.variacaoPercentual)})
                    </span>
                    <span>{change.arquivoNome || dateLabel(change.criadoEm)}</span>
                  </div>
                ))}
                {catalogPriceChanges.length === 0 && <div className="empty-state compact">Nenhuma mudanca de preco recente com historico comparavel.</div>}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">Nenhuma importacao registrada ainda.</div>
        )}
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
            <h2>Atualizar catalogo e precos</h2>
            <p>Importe somente lista de produtos e/ou servicos, sem precisar enviar os arquivos diarios obrigatorios.</p>
          </div>
          <label className="file-button">
            <FileUp size={16} />
            {isReadingCatalogPrices ? 'Validando...' : 'Selecionar listas'}
            <input type="file" accept=".xls,.xlsx,.csv" multiple onChange={(event) => handleCatalogPriceFiles(event.target.files)} />
          </label>
        </div>
        {catalogPricePreview && (
          <div className="preview-card reference-preview">
            <div className="panel-header">
              <div>
                <h2>{catalogPricePreview.ready ? 'Listas prontas para importar' : 'Listas incompletas'}</h2>
                <p>
                  {catalogPricePreview.files.filter((file) => file.status === 'ok').length} listas reconhecidas -
                  {' '}{catalogPricePreview.itensDetectados} produtos/servicos com preco
                </p>
              </div>
              <button
                className="button primary"
                disabled={!catalogPricePreview.ready || registeredFiles.includes(catalogPricePreview.arquivoNome)}
                onClick={() => registerCatalogPricePreview(catalogPricePreview)}
                type="button"
              >
                {registeredFiles.includes(catalogPricePreview.arquivoNome) ? 'Previa registrada' : 'Registrar previa'}
              </button>
              <button
                className="button"
                disabled={!catalogPricePreview.ready || isImportingCatalogPrices}
                onClick={runCatalogPriceImport}
                type="button"
              >
                {isImportingCatalogPrices ? 'Importando...' : 'Atualizar catalogo'}
              </button>
            </div>
            <div className={`readiness ${catalogPricePreview.ready ? 'ok' : 'danger'}`}>
              <strong>{catalogPricePreview.ready ? 'Catalogo reconhecido' : 'Nenhum preco reconhecido'}</strong>
              <span>Novos precos serao comparados com o ultimo historico antes de gravar.</span>
            </div>
            {catalogPricePreview.avisos.length > 0 && (
              <div className="warning-list">
                {catalogPricePreview.avisos.map((aviso) => <span key={aviso}>{aviso}</span>)}
              </div>
            )}
            <div className="table compact">
              <div className="table-head reference-file">
                <span>Lista</span>
                <span>Status</span>
                <span>Linhas</span>
                <span>Clientes</span>
                <span>Ordens</span>
                <span>Itens</span>
                <span>Placas/KM</span>
              </div>
              {catalogPricePreview.files.map((file) => (
                <div className="table-row reference-file" key={file.kind}>
                  <span>{file.label}</span>
                  <span>{file.status === 'ok' ? file.fileName : 'Opcional ausente'}</span>
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

function qualityIssueSeverityLabel(severidade: ImportacaoQualidadeIssue['severidade']) {
  if (severidade === 'alta') return 'Alta prioridade'
  if (severidade === 'media') return 'Media prioridade'
  return 'Baixa prioridade'
}

function formatPriceChangePercent(value: number) {
  const signal = value >= 0 ? '+' : ''
  return `${signal}${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function auditCategoryLabel(category: AuditoriaEvento['categoria']) {
  if (category === 'orcamento') return 'Proposta'
  if (category === 'automacao') return 'Automacao'
  if (category === 'saneamento') return 'Saneamento'
  return 'Cliente'
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
  onDeleteCampaign,
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
  onUpdateInboxStatus: (item: CampanhaInboxItem, status: CampanhaEnvioStatus, result?: CampaignInboxResultForm) => Promise<void>
  onOpenBudgetEditor: (cliente: Cliente, originContext: QuoteOriginContext) => void
  onDeleteCampaign: (campanhaId: string) => Promise<void>
  onAddInteraction: (interacao: InteracaoInput) => Promise<Interacao>
  onAddTask: (task: TarefaInput) => Promise<Tarefa>
}) {
  const pageSize = 50
  const [segmentoId, setSegmentoId] = useState<CampanhaSegmentoId>('selecionados')
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
  const [contactEditTarget, setContactEditTarget] = useState<Cliente | null>(null)
  const [contactEditForm, setContactEditForm] = useState({ responsavel: '', whatsapp: '' })
  const [isSavingContactEdit, setIsSavingContactEdit] = useState(false)
  const [campaignResultTarget, setCampaignResultTarget] = useState<{ cliente: Cliente; mensagemFinal: string } | null>(null)
  const [campaignResultStatus, setCampaignResultStatus] = useState<CampanhaEnvioStatus>('respondeu')
  const [campaignResultForm, setCampaignResultForm] = useState<CampaignInboxResultForm>({
    resumo: '',
    proximaAcao: '',
    dataProximaAcao: '',
  })
  const appliedInitialCampanhaIdRef = useRef('')
  const effectivePublicoFiltros = useMemo(
    () => currentUser.role === 'vendedor'
      ? { ...publicoFiltros, vendedorId: currentUser.id }
      : publicoFiltros,
    [currentUser.id, currentUser.role, publicoFiltros],
  )
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
  const campaignPageReadyCount = campanhaClientes.filter((cliente) => {
    const readiness = campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7)
    return !readiness.blocked && Boolean(cliente.whatsapp) && cliente.status !== 'Nao contatar' && cliente.leadQualificacaoStatus !== 'nao_contatar'
  }).length
  const nextClient = campanhaClientes
    .filter((cliente) => (statuses[cliente.id] ?? 'pendente') === 'pendente' && !campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7).blocked)
    .sort((a, b) => (b.totalComprado + b.totalServicos) - (a.totalComprado + a.totalServicos))[0]
  const campaignCounts = campanhaClientes.reduce<Record<CampanhaEnvioStatus, number>>(
    (acc, cliente) => {
      const status = statuses[cliente.id] ?? 'pendente'
      acc[status] += 1
      return acc
    },
    { pendente: 0, enviado: 0, respondeu: 0, nao_respondeu: 0, comprar_depois: 0, virou_orcamento: 0, ganhou: 0, perdido: 0, nao_contatar: 0 },
  )
  const filteredClientes = campanhaClientes.filter((cliente) => statusFilter === 'todos' || (statuses[cliente.id] ?? 'pendente') === statusFilter)
  const selectableCampaignIds = filteredClientes.filter((cliente) => !campaignContactReadiness(cliente, elegibilidade[cliente.id], numberFromInput(campaignWindowDays) || 7).blocked).map((cliente) => cliente.id)
  const allCampaignRowsSelected = selectableCampaignIds.length > 0 && selectableCampaignIds.every((id) => selectedCampaignClientIds.includes(id))
  const activePublicoFilterCount = (segmento.filtro || segmento.id === 'rodobens-pendentes' ? 1 : 0) + Object.entries(publicoFiltros).filter(([, value]) => {
    if (value === undefined || value === '' || value === 'todos' || value === false) return false
    return true
  }).length
  const campaignStepHelp: Record<typeof campaignTab, string> = {
    publico: 'Escolha quem sera acionado. Comece por um objetivo pronto e refine apenas se precisar.',
    mensagem: 'Escreva o texto que o vendedor vai mandar no WhatsApp. A mensagem pode ser livre.',
    execucao: 'Abra WhatsApp, registre envios e trabalhe a fila sem sair da pagina.',
    resultado: 'Acompanhe respostas, propostas, ganhos e proximos retornos.',
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
      filtros: effectivePublicoFiltros,
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
  }, [segmentoId, page, query, effectivePublicoFiltros, activeCampanhaId, campanhasSalvas])

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

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery)
    setPage(1)
  }

  function updatePublicoFiltro<K extends keyof CampanhaPublicoFiltros>(key: K, value: CampanhaPublicoFiltros[K]) {
    setPublicoFiltros((current) => ({ ...current, [key]: value || undefined }))
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
      setPublicoFiltros((current) => ({
        produtoTerm: current.produtoTerm,
        medidaTerm: current.medidaTerm,
        somenteComWhatsapp: true,
      }))
      return
    }
    if (preset === 'regiao') {
      setPublicoFiltros((current) => ({ ...current, somenteComWhatsapp: true }))
      return
    }
    setSegmentoId('inativos-90')
    setPublicoFiltros({ valorMin: 5000, diasSemCompraMin: 90, somenteComWhatsapp: true })
  }

  function startAssistedCampaign(
    preset: 'sem-cadastro' | 'compradores-produto' | 'regiao' | 'alto-valor',
    name: string,
    objective: string,
  ) {
    applyCampaignPreset(preset)
    setSaveName(name)
    setCampaignObjective(objective)
    setCampaignTab('publico')
  }

  function resetCampaignAudience() {
    setSegmentoId('selecionados')
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

  function openCampaignContactEdit(cliente: Cliente) {
    setContactEditTarget(cliente)
    setContactEditForm({
      responsavel: cliente.responsavel ?? '',
      whatsapp: cliente.whatsapp ?? '',
    })
    setCampaignError('')
  }

  async function saveCampaignContactEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contactEditTarget) return

    const whatsapp = contactEditForm.whatsapp.replace(/\D/g, '')
    setIsSavingContactEdit(true)
    setCampaignError('')
    try {
      await updateClienteComercial(contactEditTarget.id, {
        responsavel: contactEditForm.responsavel.trim() || undefined,
        whatsapp: whatsapp || undefined,
      })
      setClientes((current) =>
        current.map((cliente) =>
          cliente.id === contactEditTarget.id
            ? { ...cliente, responsavel: contactEditForm.responsavel.trim() || undefined, whatsapp: whatsapp || undefined }
            : cliente,
        ),
      )
      setElegibilidade((current) => ({
        ...current,
        [contactEditTarget.id]: {
          ...(current[contactEditTarget.id] ?? { clienteId: contactEditTarget.id, elegivel: true, motivoBloqueio: 'Apto' }),
          elegivel: Boolean(whatsapp),
          motivoBloqueio: whatsapp ? 'Apto' : 'Sem WhatsApp',
        },
      }))
      setContactEditTarget(null)
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar o contato do cliente.')
    } finally {
      setIsSavingContactEdit(false)
    }
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
      const campaignPayload = {
        nome,
        descricao: segmento.descricao,
        objetivo: campaignObjective.trim() || undefined,
        custoEstimado: numberFromInput(campaignCost),
        metaReceita: numberFromInput(campaignRevenueGoal),
        mensagemModelo,
        filtroUsado: {
          segmentoId,
          filtros: effectivePublicoFiltros,
          query,
          clienteIds: activeSavedCampaign?.filtroUsado.clienteIds,
          origemLista: activeSavedCampaign?.filtroUsado.origemLista,
          imagemPadrao: campaignImage,
          janelaMinimaDias: numberFromInput(campaignWindowDays) || 7,
        },
      }
      const saved = activeCampanhaId
        ? await updateCampanhaSalva(activeCampanhaId, campaignPayload)
        : await createCampanhaSalva({
          ...campaignPayload,
        criadaPor: currentUser.id,
        })
      setCampanhasSalvas((current) => [saved, ...current.filter((campanha) => campanha.id !== saved.id)])
      setActiveCampanhaId(saved.id)
      await refreshCampaignResumo()
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar a campanha.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteCurrentCampaign() {
    if (!activeCampanhaId) return
    const campaignName = campanhasSalvas.find((campanha) => campanha.id === activeCampanhaId)?.nome ?? saveName
    const confirmed = window.confirm(`Excluir a campanha "${campaignName || activeCampanhaId.slice(0, 8)}"? Os envios e tarefas gerados por ela tambem serao removidos.`)
    if (!confirmed) return

    setIsSaving(true)
    setCampaignError('')
    try {
      await onDeleteCampaign(activeCampanhaId)
      setCampanhasSalvas((current) => current.filter((campanha) => campanha.id !== activeCampanhaId))
      setCampanhasResumo((current) => current.filter((resumo) => resumo.campanhaId !== activeCampanhaId))
      setSelectedCampaignClientIds([])
      setStatuses({})
      setElegibilidade({})
      setActiveCampanhaId('')
      setSaveName('')
      setCampaignClipboardMessage('')
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel excluir a campanha.')
    } finally {
      setIsSaving(false)
    }
  }

  function openCampaignResult(cliente: Cliente, status: CampanhaEnvioStatus, mensagemFinal: string) {
    const defaults = campaignResultDefaults(status, saveName || segmento.campanhaNome)
    setCampaignResultTarget({ cliente, mensagemFinal })
    setCampaignResultStatus(status)
    setCampaignResultForm(defaults)
    setCampaignError('')
  }

  async function submitCampaignResult() {
    if (!campaignResultTarget) return
    await markStatus(campaignResultTarget.cliente, campaignResultStatus, campaignResultTarget.mensagemFinal, undefined, campaignResultForm)
    setCampaignResultTarget(null)
  }

  async function markStatus(cliente: Cliente, status: CampanhaEnvioStatus, mensagemFinal: string, optOutMotivo?: string, result?: CampaignInboxResultForm) {
    setCampaignError('')

    try {
      const envio = await upsertCampanhaEnvio({
        campanhaId: activeCampanhaId || segmento.campanhaId,
        campanhaNome: activeCampanhaId ? saveName || segmento.campanhaNome : segmento.campanhaNome,
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId,
        criadaPor: currentUser.id,
        telefone: cliente.whatsapp,
        mensagemFinal,
        status,
      })
      await onAddInteraction({
        clienteId: cliente.id,
        vendedorId: cliente.vendedorId ?? currentUser.id,
        canal: 'Campanha',
        tipo: 'campanha',
        resumo: result?.resumo?.trim() || campaignSummary(status, mensagemFinal),
        resultado: status,
        proximaAcao: result?.proximaAcao?.trim() || undefined,
        dataProximaAcao: result?.dataProximaAcao || undefined,
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
      const nextStatus = clientStatusFromCampaignStatus(status)
      if (nextStatus) {
        updateClienteComercial(cliente.id, { status: nextStatus }).catch(() => undefined)
      }
      if (result?.proximaAcao?.trim() && result.dataProximaAcao) {
        await onAddTask({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId ?? currentUser.id,
          titulo: result.proximaAcao.trim(),
          descricao: result.resumo.trim() || `Follow-up da campanha ${saveName || segmento.campanhaNome}. Resultado: ${campaignStatusLabel(status)}.`,
          dataVencimento: result.dataProximaAcao,
          prioridade: campaignTaskPriority(status),
          origem: `campanha:${envio.campanhaId}:resultado:${status}`,
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
    } catch (exception) {
      setCampaignError(exception instanceof Error ? exception.message : 'Nao foi possivel preparar a imagem da campanha.')
    }
  }

  async function openCampaignWhatsapp(cliente: Cliente, finalMessage: string, options?: { forceRegister?: boolean }) {
    const waUrl = waMeUrl(cliente.whatsapp, finalMessage)
    if (!waUrl) {
      setCampaignError('Cliente sem WhatsApp valido para abrir conversa.')
      return
    }
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
          criadaPor: currentUser.id,
          telefone: cliente.whatsapp,
          mensagemFinal: finalMessage,
          status: 'enviado',
        })
        await onAddInteraction({
          clienteId: cliente.id,
          vendedorId: cliente.vendedorId ?? currentUser.id,
          canal: 'Campanha',
          tipo: 'campanha',
          resumo: campaignSummary('enviado', finalMessage),
          resultado: 'enviado',
          campanhaId: envio.campanhaId,
        })
        setStatuses((current) => ({ ...current, [cliente.id]: 'enviado' }))
        refreshCampaignResumo().catch(() => undefined)
      } catch (exception) {
        setCampaignError(exception instanceof Error ? exception.message : 'WhatsApp aberto, mas nao foi possivel registrar o envio da campanha.')
      }
    }

    if (whatsappWindow) {
      whatsappWindow.location.href = waUrl
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const audienceActiveFilters = campaignAudienceFilterLabels(publicoFiltros, query)
  const audienceEmptyMessage = campaignAudienceEmptyMessage(publicoFiltros, query)

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
              <option value="">Nova campanha sem salvar</option>
              {campanhasSalvas.map((campanha) => (
                <option value={campanha.id} key={campanha.id}>{campanha.nome}</option>
              ))}
            </select>
          </label>
          <Send size={18} />
        </div>
      </div>
      <section className="mobile-campaign-quick">
        <div className="mobile-campaign-quick-header">
          <span>
            <strong>Envio rapido</strong>
            <small>{activeCampanhaId ? 'Campanha salva pronta para WhatsApp' : 'Use o texto atual ou escolha uma campanha salva'}</small>
          </span>
          <b>{campaignPageReadyCount}</b>
        </div>
        <label className="mobile-campaign-select">
          Campanha
          <select value={activeCampanhaId} onChange={(event) => applySavedCampaign(event.target.value)}>
            <option value="">Modelo atual</option>
            {campanhasSalvas.map((campanha) => (
              <option value={campanha.id} key={campanha.id}>{campanha.nome}</option>
            ))}
          </select>
        </label>
        {nextClient ? (
          <div className="mobile-campaign-next">
            <span>
              <strong>{nextClient.nome}</strong>
              <small>{nextClient.cidade || 'Cidade nao informada'} / {nextClient.uf || '--'} Â· {nextClient.whatsapp || 'sem WhatsApp'}</small>
            </span>
            <button
              className="button primary"
              type="button"
              disabled={!nextClient.whatsapp}
              onClick={() => openCampaignWhatsapp(nextClient, messageFor(nextClient))}
            >
              <MessageCircle size={16} /> Enviar WhatsApp
            </button>
          </div>
        ) : (
          <div className="empty-state compact">Nenhum contato pendente elegivel nessa campanha.</div>
        )}
        <div className="mobile-campaign-actions">
          <button className="button" type="button" onClick={() => setCampaignTab('publico')}>Ajustar publico</button>
          <button className="button" type="button" onClick={() => setCampaignTab('mensagem')}>Editar texto</button>
          <button className="button" type="button" onClick={() => setCampaignTab('execucao')}>Ver fila</button>
        </div>
      </section>
      <div className="campaign-workflow-tabs">
        <button className={campaignTab === 'publico' ? 'active' : ''} type="button" onClick={() => setCampaignTab('publico')}>
          1. Publico <span>{total}</span>
        </button>
        <button className={campaignTab === 'mensagem' ? 'active' : ''} type="button" onClick={() => setCampaignTab('mensagem')}>
          2. Texto
        </button>
        <button className={campaignTab === 'execucao' ? 'active' : ''} type="button" onClick={() => setCampaignTab('execucao')}>
          3. Enviar <span>{filteredClientes.length}</span>
        </button>
        <button className={campaignTab === 'resultado' ? 'active' : ''} type="button" onClick={() => setCampaignTab('resultado')}>
          4. Retornos
        </button>
      </div>
      <div className="campaign-guide-summary">
        <div>
          <strong>{campaignStepHelp[campaignTab]}</strong>
          <small>{activePublicoFilterCount} filtros ativos · {total} encontrados · {campaignPageReadyCount} prontos nesta pagina · {campaignQuality.bloqueados} bloqueados nesta pagina</small>
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
      <section className="campaign-saved-strip">
        <div>
          <strong>Campanhas salvas</strong>
          <small>{activeCampanhaId ? `Aberta agora: ${saveName || activeCampanhaId.slice(0, 8)}` : 'Selecione uma campanha para continuar de onde parou.'}</small>
        </div>
        <div className="campaign-saved-actions">
          <div className="campaign-saved-list">
            <button className={!activeCampanhaId ? 'button primary' : 'button'} type="button" onClick={() => {
              setActiveCampanhaId('')
              setSaveName('')
              setCampaignObjective('')
              setMensagemModelo(campanhaSegmentos[0].template)
              setSegmentoId('selecionados')
              setPublicoFiltros({})
              setQuery('')
              setPage(1)
            }}>
              Nova
            </button>
            {campanhasSalvas.slice(0, 8).map((campanha) => (
              <button
                className={campanha.id === activeCampanhaId ? 'button primary' : 'button'}
                type="button"
                key={campanha.id}
                onClick={() => applySavedCampaign(campanha.id)}
              >
                {campanha.nome}
              </button>
            ))}
          </div>
          {activeCampanhaId && (
            <button className="button danger" type="button" onClick={() => void deleteCurrentCampaign()} disabled={isSaving}>
              Excluir campanha
            </button>
          )}
        </div>
      </section>
      <section className="campaign-builder-stage campaign-objective-stage">
        <div className="campaign-stage-header">
          <span>Escolha um objetivo</span>
          <small>Use um ponto de partida pronto. Depois ajuste publico, texto e envio.</small>
        </div>
        <div className="campaign-preset-grid">
          <button
            className="campaign-preset"
            type="button"
            onClick={() => startAssistedCampaign('alto-valor', 'Reativacao 90 dias', 'Reativar clientes de alto valor sem compra recente.')}
          >
            <strong>Reativacao 90 dias</strong>
            <small>Clientes com historico relevante e janela de recompra vencida.</small>
          </button>
          <button
            className="campaign-preset"
            type="button"
            onClick={() => startAssistedCampaign('compradores-produto', 'Recompra por produto', 'Ofertar reposicao por medida, produto ou servico comprado.')}
          >
            <strong>Recompra por produto</strong>
            <small>Comece por medida, marca, produto ou servico e refine a audiencia.</small>
          </button>
          <button
            className="campaign-preset"
            type="button"
            onClick={() => startAssistedCampaign('sem-cadastro', 'Lista externa', 'Converter clientes de listas externas em primeiros contatos qualificados.')}
          >
            <strong>Lista externa</strong>
            <small>Clientes sem cadastro, com WhatsApp e pendentes de qualificacao.</small>
          </button>
          <button
            className="campaign-preset"
            type="button"
            onClick={() => startAssistedCampaign('regiao', 'Acao por regiao', 'Trabalhar clientes de uma cidade, UF ou carteira regional.')}
          >
            <strong>Acao por regiao</strong>
            <small>Ideal para rotas, estoque local, feiroes ou campanhas por vendedor.</small>
          </button>
        </div>
      </section>
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
        <span>
          {activeCampanhaId
            ? 'Campanha salva aberta. Altere publico, texto ou fila e clique em Atualizar campanha para manter tudo salvo.'
            : 'Campanha nova ainda nao salva. Informe um nome e clique em Salvar campanha para reabrir depois no seletor do topo.'}
        </span>
        <button className="button primary" disabled={isSaving} onClick={saveCurrentCampaign} type="button">
          {isSaving ? 'Salvando...' : activeCampanhaId ? 'Atualizar campanha' : 'Salvar campanha'}
        </button>
        {activeCampanhaId && (
          <button className="button danger" disabled={isSaving} onClick={deleteCurrentCampaign} type="button">
            Excluir campanha
          </button>
        )}
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
          <Info label="Publico total" value={(activeCampaignResumo?.total ?? total).toString()} />
          <Info label="Nesta pagina" value={campanhaClientes.length.toString()} />
          <Info label="Prontos pág." value={campaignPageReadyCount.toString()} />
          <Info label={activeCampaignResumo ? 'Aguardando resposta' : 'Aguardando pág.'} value={(activeCampaignResumo?.enviados ?? campaignCounts.enviado).toString()} />
          <Info label={activeCampaignResumo ? 'Responderam' : 'Responderam pág.'} value={(activeCampaignResumo?.responderam ?? campaignCounts.respondeu).toString()} />
          <Info label={activeCampaignResumo ? 'Propostas' : 'Propostas pág.'} value={(activeCampaignResumo?.viraramOrcamento ?? campaignCounts.virou_orcamento).toString()} />
          <Info label={activeCampaignResumo ? 'Ganhos' : 'Ganhos pág.'} value={(activeCampaignResumo?.viraramVenda ?? campaignCounts.ganhou).toString()} />
          <Info label="Receita atribuida" value={money(activeCampaignResumo?.receitaAtribuida ?? 0)} />
          <Info label="Custo" value={money(activeCampaignResumo?.custoEstimado ?? numberFromInput(campaignCost))} />
          <Info label="ROI" value={`${activeCampaignResumo?.roiPercent ?? 0}%`} />
          <Info label="Meta" value={money(activeCampaignResumo?.metaReceita ?? numberFromInput(campaignRevenueGoal))} />
          <Info label={activeCampaignResumo ? 'Perdidos' : 'Perdidos pág.'} value={(activeCampaignResumo?.perdidos ?? campaignCounts.perdido).toString()} />
          <Info label="Bloq. pág." value={campaignQuality.bloqueados.toString()} />
          <Info label="Sem WhatsApp pág." value={campaignQuality.semWhatsapp.toString()} />
          <Info label="Opt-out pág." value={campaignQuality.optOut.toString()} />
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
          <span>Monte o publico da campanha</span>
          <small>Preencha somente os criterios que fazem sentido. O publico sera a combinacao dos filtros ativos.</small>
        </div>
        <div className="campaign-audience-toolbar">
          <label className="mini-select">
            <Search size={15} />
            <input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Busca livre dentro do publico" />
          </label>
          <span>{total} clientes no publico · pagina {page} de {totalPages}</span>
          <button className="button" type="button" onClick={resetCampaignAudience}>Limpar publico</button>
        </div>
        {audienceActiveFilters.length > 0 && (
          <div className="campaign-filter-summary">
            <strong>Filtros ativos</strong>
            <div>
              {audienceActiveFilters.map((filter) => <span className="status-pill compact" key={filter}>{filter}</span>)}
            </div>
            <small>Os filtros sao combinados. Ex.: produto "Michelin" + medida "295/80" mostra clientes que batem nos dois criterios.</small>
          </div>
        )}
        <div className="campaign-filter-sections">
          <section className="campaign-filter-section">
            <div>
              <strong>Historico de compra</strong>
              <small>Para reativacao, recompra por medida, marca, produto ou servico.</small>
            </div>
            <div className="campaign-filter-grid">
              <label>
                Produto, servico, marca ou termo comprado
                <input value={publicoFiltros.produtoTerm ?? ''} onChange={(event) => updatePublicoFiltro('produtoTerm', event.target.value)} placeholder="Ex.: 295/80, Michelin, alinhamento" />
              </label>
              <label>
                Medida especifica
                <input value={publicoFiltros.medidaTerm ?? ''} onChange={(event) => updatePublicoFiltro('medidaTerm', event.target.value)} placeholder="Ex.: 295/80R22.5" />
              </label>
              <label>
                Dias sem compra
                <input inputMode="numeric" value={publicoFiltros.diasSemCompraMin ?? ''} onChange={(event) => updatePublicoFiltro('diasSemCompraMin', positiveIntegerOrUndefined(event.target.value))} placeholder="Ex.: 90" />
              </label>
              <label>
                Valor minimo historico
                <input inputMode="decimal" value={publicoFiltros.valorMin ?? ''} onChange={(event) => updatePublicoFiltro('valorMin', numberFromInput(event.target.value) || undefined)} placeholder="Ex.: 5000,00" />
              </label>
            </div>
          </section>
          <section className="campaign-filter-section">
            <div>
              <strong>Regiao e carteira</strong>
              <small>Use para campanhas por praca, rota, vendedor atual ou vendedor historico.</small>
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
            </div>
          </section>
          <section className="campaign-filter-section">
            <div>
              <strong>Origem e contato</strong>
              <small>Use para listas externas, leads sem cadastro e contatos que podem receber WhatsApp.</small>
            </div>
            <div className="campaign-filter-grid">
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
            Dias sem contato
            <input inputMode="numeric" value={publicoFiltros.diasSemContatoMin ?? ''} onChange={(event) => updatePublicoFiltro('diasSemContatoMin', positiveIntegerOrUndefined(event.target.value))} placeholder="Ex.: 60" />
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={Boolean(publicoFiltros.somenteComWhatsapp)} onChange={(event) => updatePublicoFiltro('somenteComWhatsapp', event.target.checked)} />
            Somente com WhatsApp
          </label>
            </div>
          </section>
        </div>
        <section className="campaign-audience-preview">
          <div className="campaign-preview-header">
            <span>
              <strong>Previa dos clientes filtrados</strong>
              <small>{isLoading ? 'Atualizando lista...' : `${campanhaClientes.length} nesta pagina de ${total} encontrados`}</small>
            </span>
            <div className="toolbar-actions">
              <button className="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
                Anterior
              </button>
              <button className="button" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)} type="button">
                Proxima
              </button>
            </div>
          </div>
          <div className="campaign-preview-list">
            {campanhaClientes.slice(0, 12).map((cliente) => (
              <article className="campaign-preview-client" key={cliente.id}>
                <strong>{cliente.nome}</strong>
                <span>{[cliente.cidade, cliente.uf].filter(Boolean).join('/')} - {cliente.whatsapp || 'sem WhatsApp'}</span>
                <small>{cliente.produtoPrincipal || origemLabel(cliente.origemBase)} - ultima compra {dateLabel(cliente.ultimaCompraEm)}</small>
              </article>
            ))}
            {!isLoading && campanhaClientes.length === 0 && (
              <div className="empty-state compact">{audienceEmptyMessage}</div>
            )}
          </div>
        </section>
        <details className="campaign-advanced-filters">
          <summary>Filtros de veiculo: placa e KM</summary>
          <div className="campaign-filter-grid">
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
          </div>
        </details>
      </section>
      {campaignError && <div className="alert">{campaignError}</div>}
      {isLoading && <div className="empty-state">Carregando segmento de campanha...</div>}
      {!isLoading && (
        <div className="bulk-action-bar campaign-execution-filter">
          <label className="mini-select">
            <Filter size={15} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CampanhaEnvioStatus | 'todos')}>
              <option value="todos">Todos os status da fila</option>
              <option value="pendente">Pendentes</option>
              <option value="enviado">Aguardando resposta</option>
              <option value="respondeu">Responderam</option>
              <option value="virou_orcamento">Virou proposta</option>
              <option value="ganhou">Ganhos</option>
              <option value="perdido">Perdidos</option>
              <option value="nao_respondeu">Nao respondeu</option>
              <option value="nao_contatar">Nao contatar</option>
            </select>
          </label>
          <span className="status-pill">{filteredClientes.length} clientes nesta fila</span>
        </div>
      )}
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
                <small>{cliente.responsavel || 'Responsavel nao informado'} - {cliente.whatsapp || 'sem WhatsApp'}</small>
                {readiness.blocked && <small className="score danger">{readiness.reason}</small>}
              </span>
              <span>{finalMessage}</span>
              <span className="status-pill">{campaignStatusLabel(statuses[cliente.id] ?? 'pendente')}</span>
              <span className="campaign-actions">
                <button
                  className={canOpenNormally ? 'button' : 'button disabled'}
                  type="button"
                  disabled={!canOpenNormally}
                  onClick={() => openCampaignWhatsapp(cliente, finalMessage)}
                >
                  <MessageCircle size={16} /> Abrir conversa
                </button>
                <button className="button" type="button" onClick={() => openCampaignContactEdit(cliente)}>
                  Editar contato
                </button>
                <button className="button" type="button" onClick={() => openCampaignResult(cliente, 'respondeu', finalMessage)}>
                  Respondeu
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    void markStatus(cliente, 'virou_orcamento', finalMessage, undefined, campaignResultDefaults('virou_orcamento', saveName || segmento.campanhaNome))
                    onOpenBudgetEditor(cliente, {
                      kind: 'campanha',
                      sourceId: activeCampanhaId || undefined,
                      label: activeCampanhaId ? saveName || segmento.campanhaNome : segmento.campanhaNome,
                    })
                  }}
                >
                  Fazer orcamento
                </button>
                <select
                  className="compact-select"
                  value=""
                  onChange={(event) => {
                    const nextAction = event.target.value
                    event.target.value = ''
                    if (nextAction === 'reenviar') void openCampaignWhatsapp(cliente, finalMessage, { forceRegister: true })
                    if (nextAction === 'enviado') void markStatus(cliente, 'enviado', finalMessage)
                    if (nextAction === 'pendente') void markStatus(cliente, 'pendente', finalMessage)
                    if (nextAction === 'comprar_depois') openCampaignResult(cliente, 'comprar_depois', finalMessage)
                    if (nextAction === 'sem_resposta') openCampaignResult(cliente, 'nao_respondeu', finalMessage)
                    if (nextAction === 'ganhou') void markStatus(cliente, 'ganhou', finalMessage)
                    if (nextAction === 'perdido') void markStatus(cliente, 'perdido', finalMessage)
                    if (nextAction === 'nao_contatar') void markCampaignOptOut(cliente, finalMessage)
                  }}
                >
                  <option value="">Mais acoes</option>
                  <option value="reenviar" disabled={!canResend}>Reenviar WhatsApp</option>
                  <option value="enviado" disabled={!canResend}>Marcar enviado</option>
                  <option value="pendente">Voltar para pendente</option>
                  <option value="comprar_depois">Comprar depois</option>
                  <option value="sem_resposta">Marcar sem resposta</option>
                  <option value="ganhou">Marcar ganho</option>
                  <option value="perdido">Marcar perdido</option>
                  <option value="nao_contatar">Nao contatar</option>
                </select>
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
      {contactEditTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setContactEditTarget(null)}>
          <form className="campaign-contact-modal" onSubmit={saveCampaignContactEdit} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <span>
                <strong>Editar contato rapido</strong>
                <small>{contactEditTarget.nome}</small>
              </span>
              <button className="button" type="button" onClick={() => setContactEditTarget(null)}>
                Fechar
              </button>
            </div>
            <label>
              Responsavel
              <input
                value={contactEditForm.responsavel}
                onChange={(event) => setContactEditForm((current) => ({ ...current, responsavel: event.target.value }))}
                placeholder="Nome da pessoa de contato"
                autoFocus
              />
            </label>
            <label>
              WhatsApp
              <input
                value={contactEditForm.whatsapp}
                onChange={(event) => setContactEditForm((current) => ({ ...current, whatsapp: event.target.value }))}
                inputMode="numeric"
                placeholder="Somente numeros, com DDD"
              />
            </label>
            <small>Esses dados serao salvos no cadastro do cliente e usados no envio desta campanha.</small>
            <div className="modal-actions">
              <button className="button" type="button" onClick={() => setContactEditTarget(null)}>
                Cancelar
              </button>
              <button className="button primary" type="submit" disabled={isSavingContactEdit}>
                {isSavingContactEdit ? 'Salvando...' : 'Salvar contato'}
              </button>
            </div>
          </form>
        </div>
      )}
      {campaignResultTarget && (
        <section className="floating-panel task-result-panel">
          <div className="panel-header">
            <div>
              <h2>Resultado do contato</h2>
              <p>{campaignResultTarget.cliente.nome} - {saveName || segmento.campanhaNome}</p>
            </div>
            <button className="button" type="button" onClick={() => setCampaignResultTarget(null)}>Fechar</button>
          </div>
          <div className="quick-result-grid">
            {(['respondeu', 'virou_orcamento', 'comprar_depois', 'nao_respondeu', 'ganhou', 'perdido', 'nao_contatar'] as CampanhaEnvioStatus[]).map((status) => (
              <button
                className={campaignResultStatus === status ? 'button primary' : 'button'}
                key={status}
                type="button"
                onClick={() => {
                  setCampaignResultStatus(status)
                  setCampaignResultForm(campaignResultDefaults(status, saveName || segmento.campanhaNome))
                }}
              >
                {campaignStatusLabel(status)}
              </button>
            ))}
          </div>
          <div className="task-form compact-form">
            <label className="span-2">
              Resumo do que aconteceu
              <textarea
                value={campaignResultForm.resumo}
                onChange={(event) => setCampaignResultForm({ ...campaignResultForm, resumo: event.target.value })}
                placeholder="Ex.: pediu 295/80 para cotar hoje, prefere pagamento 30/60."
              />
            </label>
            <label>
              Proxima data
              <input
                type="date"
                value={campaignResultForm.dataProximaAcao}
                onChange={(event) => setCampaignResultForm({ ...campaignResultForm, dataProximaAcao: event.target.value })}
              />
            </label>
            <label>
              Proxima acao
              <input
                value={campaignResultForm.proximaAcao}
                onChange={(event) => setCampaignResultForm({ ...campaignResultForm, proximaAcao: event.target.value })}
                placeholder="Ex.: Retomar cotacao"
              />
            </label>
            <button className="button primary" type="button" disabled={!campaignResultForm.resumo.trim()} onClick={submitCampaignResult}>
              Salvar resultado
            </button>
          </div>
        </section>
      )}
    </section>
  )
}

function campaignSummary(status: CampanhaEnvioStatus, mensagem: string) {
  const labels: Record<CampanhaEnvioStatus, string> = {
    pendente: 'WhatsApp aberto com mensagem de campanha.',
    enviado: 'Mensagem de campanha marcada como enviada.',
    respondeu: 'Cliente respondeu a campanha.',
    nao_respondeu: 'Cliente nao respondeu a campanha.',
    comprar_depois: 'Cliente pediu retorno futuro.',
    virou_orcamento: 'Campanha virou oportunidade de orcamento.',
    ganhou: 'Campanha marcada como venda ganha.',
    perdido: 'Campanha marcada como oportunidade perdida.',
    nao_contatar: 'Cliente marcado como nao contatar pela campanha.',
  }
  return `${labels[status]} Mensagem: ${mensagem}`
}

function campaignAudienceFilterLabels(filtros: CampanhaPublicoFiltros, query: string) {
  const labels: string[] = []
  if (query.trim()) labels.push(`Busca: ${query.trim()}`)
  if (filtros.produtoTerm?.trim()) labels.push(`Produto/servico: ${filtros.produtoTerm.trim()}`)
  if (filtros.medidaTerm?.trim()) labels.push(`Medida: ${filtros.medidaTerm.trim()}`)
  if (filtros.cidade?.trim()) labels.push(`Cidade: ${filtros.cidade.trim()}`)
  if (filtros.uf?.trim()) labels.push(`UF: ${filtros.uf.trim()}`)
  if (filtros.vendedorId) labels.push('Vendedor atual')
  if (filtros.vendedorHistoricoNome?.trim()) labels.push(`Vendedor historico: ${filtros.vendedorHistoricoNome.trim()}`)
  if (filtros.origemBase && filtros.origemBase !== 'todos') labels.push(`Origem: ${origemLabel(filtros.origemBase)}`)
  if (filtros.leadQualificacaoStatus && filtros.leadQualificacaoStatus !== 'todos') labels.push(`Status lead: ${rodobensQualificacaoLabel(filtros.leadQualificacaoStatus)}`)
  if (filtros.diasSemCompraMin) labels.push(`${filtros.diasSemCompraMin}+ dias sem compra`)
  if (filtros.diasSemContatoMin) labels.push(`${filtros.diasSemContatoMin}+ dias sem contato`)
  if (filtros.valorMin) labels.push(`Historico acima de ${money(filtros.valorMin)}`)
  if (filtros.somenteComWhatsapp) labels.push('Somente com WhatsApp')
  if (filtros.placaTerm?.trim()) labels.push(`Placa/veiculo: ${filtros.placaTerm.trim()}`)
  if (filtros.kmMin) labels.push(`KM minimo ${numberLabel(filtros.kmMin)}`)
  if (filtros.kmMax) labels.push(`KM maximo ${numberLabel(filtros.kmMax)}`)
  return labels
}

function campaignAudienceEmptyMessage(filtros: CampanhaPublicoFiltros, query: string) {
  const labels = campaignAudienceFilterLabels(filtros, query)
  if (labels.length === 0) return 'Nenhum cliente encontrado nesse publico. Confira a origem da base ou tente outro objetivo.'
  const hasProductAndMeasure = Boolean(filtros.produtoTerm?.trim() && filtros.medidaTerm?.trim())
  if (hasProductAndMeasure) {
    return 'Nenhum cliente bateu em todos os filtros. Produto/servico e medida sao combinados: tente deixar o produto mais amplo ou remover a medida para conferir a base.'
  }
  if (filtros.produtoTerm?.trim() || filtros.medidaTerm?.trim()) {
    return 'Nenhum cliente encontrado no historico importado para esse termo. Tente uma medida mais simples, marca, codigo ou remova filtros de cidade/UF.'
  }
  return `Nenhum cliente encontrado com: ${labels.join(', ')}. Remova algum criterio ou ajuste a busca.`
}

function campaignTaskTitle(status: CampanhaEnvioStatus) {
  const titles: Record<CampanhaEnvioStatus, string> = {
    pendente: 'Enviar campanha WhatsApp',
    enviado: 'Follow-up de campanha enviada',
    respondeu: 'Responder cliente da campanha',
    nao_respondeu: 'Retentar contato da campanha',
    comprar_depois: 'Retomar cliente que pediu para comprar depois',
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
  if (status === 'comprar_depois') return 75
  if (status === 'nao_respondeu') return 70
  return 50
}

function campaignResultDefaults(status: CampanhaEnvioStatus, campanhaNome: string): CampaignInboxResultForm {
  const today = new Date().toISOString().slice(0, 10)
  const defaults: Record<CampanhaEnvioStatus, CampaignInboxResultForm> = {
    pendente: {
      resumo: `Campanha ${campanhaNome}: contato voltou para pendente.`,
      proximaAcao: '',
      dataProximaAcao: '',
    },
    enviado: {
      resumo: `Campanha ${campanhaNome}: mensagem enviada, aguardando checagem de resposta.`,
      proximaAcao: 'Checar retorno no WhatsApp',
      dataProximaAcao: addDays(today, 1),
    },
    respondeu: {
      resumo: `Campanha ${campanhaNome}: cliente respondeu. Registrar necessidade e conduzir atendimento.`,
      proximaAcao: 'Responder e qualificar necessidade',
      dataProximaAcao: today,
    },
    virou_orcamento: {
      resumo: `Campanha ${campanhaNome}: cliente pediu cotacao ou demonstrou interesse em proposta.`,
      proximaAcao: 'Montar proposta comercial',
      dataProximaAcao: today,
    },
    comprar_depois: {
      resumo: `Campanha ${campanhaNome}: cliente pediu retorno futuro.`,
      proximaAcao: 'Retomar no prazo combinado',
      dataProximaAcao: addDays(today, 15),
    },
    nao_respondeu: {
      resumo: `Campanha ${campanhaNome}: conversa checada, sem resposta do cliente.`,
      proximaAcao: 'Fazer nova tentativa',
      dataProximaAcao: addDays(today, 2),
    },
    ganhou: {
      resumo: `Campanha ${campanhaNome}: venda ganha.`,
      proximaAcao: '',
      dataProximaAcao: '',
    },
    perdido: {
      resumo: `Campanha ${campanhaNome}: oportunidade perdida. Registrar motivo se conhecido.`,
      proximaAcao: '',
      dataProximaAcao: '',
    },
    nao_contatar: {
      resumo: `Campanha ${campanhaNome}: cliente marcado como nao contatar.`,
      proximaAcao: '',
      dataProximaAcao: '',
    },
  }
  return defaults[status]
}

function clientStatusFromCampaignStatus(status: CampanhaEnvioStatus): ClienteStatus | undefined {
  const statuses: Partial<Record<CampanhaEnvioStatus, ClienteStatus>> = {
    respondeu: 'Em acompanhamento',
    comprar_depois: 'Em acompanhamento',
    virou_orcamento: 'Orcamento aberto',
    ganhou: 'Ativo',
    perdido: 'Reativar',
    nao_contatar: 'Nao contatar',
  }
  return statuses[status]
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
  if (origin.startsWith('atendimento')) return 1
  if (origin.startsWith('cliente360')) return 2
  if (origin.startsWith('cockpit')) return 1
  if (origin.startsWith('rodobens')) return 1
  if (origin.startsWith('oportunidade')) return 3
  return 3
}

function taskOriginSlaLabel(origin: string) {
  if (origin.startsWith('campanha')) return 'Campanha'
  if (origin.startsWith('orcamento')) return 'Orcamento'
  if (origin.startsWith('atendimento')) return 'Atendimento'
  if (origin.startsWith('cliente360')) return 'Ficha completa'
  if (origin.startsWith('cockpit')) return 'Sem proxima acao'
  if (origin.startsWith('rodobens')) return 'Clientes sem cadastro'
  if (origin.startsWith('oportunidade')) return 'Oportunidade'
  if (origin.startsWith('interacao')) return 'Interacao'
  return 'SLA'
}

function taskOriginLabel(origin?: string) {
  if (!origin) return 'Sem origem'
  return taskOriginSlaLabel(origin.toLowerCase())
}

function isCommercialFollowupTask(tarefa: Tarefa) {
  const origin = (tarefa.origem ?? '').toLowerCase()
  return [
    'atendimento',
    'interacao',
    'cliente360',
    'cockpit',
    'orcamento',
    'campanha',
  ].some((prefix) => origin.startsWith(prefix))
}

function isCampaignCheckTask(tarefa: Tarefa) {
  const origin = (tarefa.origem ?? '').toLowerCase()
  const text = `${tarefa.titulo} ${tarefa.descricao ?? ''}`.toLowerCase()
  return origin.startsWith('campanha') || text.includes('campanha') || text.includes('whatsapp')
}

function taskCommercialPriority(tarefa: Tarefa) {
  const sla = taskSla(tarefa)
  const slaBoost = sla.tone === 'danger' ? 40 : sla.tone === 'warn' ? 20 : 0
  const origin = (tarefa.origem ?? '').toLowerCase()
  const originBoost = origin.startsWith('campanha') ? 20 : origin.startsWith('orcamento') ? 16 : origin.startsWith('atendimento') ? 12 : 0
  return tarefa.prioridade + slaBoost + originBoost
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

function approvalActionLabel(action: OrcamentoAprovacao['acao']) {
  const labels: Record<OrcamentoAprovacao['acao'], string> = {
    solicitada: 'Aprovacao solicitada',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    enviada: 'Enviada',
  }
  return labels[action]
}

function isOpenBudget(orcamento: Orcamento) {
  return ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'].includes(orcamento.status)
}

function isExpiredBudget(orcamento: Orcamento) {
  return isOpenBudget(orcamento) && daysSince(orcamento.validade) > 0
}

function budgetPriorityRank(orcamento: Orcamento) {
  if (isExpiredBudget(orcamento)) return 0
  if (orcamento.status === 'aguardando_aprovacao') return 1
  if (orcamento.status === 'negociando') return 2
  if (orcamento.status === 'enviado') return 3
  if (orcamento.status === 'aberto') return 4
  if (orcamento.status === 'ganho') return 5
  return 6
}

function budgetStatusLabel(orcamento: Orcamento) {
  if (isExpiredBudget(orcamento)) return 'Vencida'
  const labels: Record<Orcamento['status'], string> = {
    aberto: 'Aberta',
    aguardando_aprovacao: 'Aguardando aprovacao',
    enviado: 'Enviada',
    negociando: 'Negociando',
    ganho: 'Ganha',
    perdido: 'Perdida',
  }
  return labels[orcamento.status]
}

function budgetPriorityLabels(orcamentos: Orcamento[]) {
  const labels = new Set<string>()
  const sorted = [...orcamentos]
    .sort((a, b) => budgetPriorityRank(a) - budgetPriorityRank(b) || b.data.localeCompare(a.data))
  sorted.forEach((orcamento) => {
    labels.add(budgetStatusLabel(orcamento))
    if (orcamento.pedidoConfirmadoEm) labels.add('Pedido confirmado')
  })
  return Array.from(labels)
}

function Orcamentos({
  clientes,
  orcamentos,
  usuarios,
  currentUser,
  catalogo,
  preparedQuoteContext,
  openSearchRequestKey,
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
  onDelete,
}: {
  clientes: Cliente[]
  orcamentos: Orcamento[]
  usuarios: Vendedor[]
  currentUser: SessaoUsuario
  catalogo: CatalogoItem[]
  preparedQuoteContext: QuoteOriginContext
  openSearchRequestKey: number
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
  onStatusChange: (id: string, status: Orcamento['status'], motivoPerda?: string, pedidoConfirmado?: PedidoConfirmadoInput) => void
  onDelete: (id: string) => Promise<void>
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
  const [deletingBudgetId, setDeletingBudgetId] = useState('')
  const [budgetActionError, setBudgetActionError] = useState('')
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

  useEffect(() => {
    if (openSearchRequestKey > 0) {
      setShowLooseBudgetSearch(true)
    }
  }, [openSearchRequestKey])

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

  async function handleDeleteBudget(orcamento: Orcamento) {
    const clienteNome = clientes.find((item) => item.id === orcamento.clienteId)?.nome ?? orcamento.clienteNome ?? 'cliente'
    const confirmed = window.confirm(`Excluir a proposta ${orcamento.id.slice(0, 8)} de ${clienteNome}? Esta acao remove itens, versoes e controles vinculados.`)
    if (!confirmed) return

    setDeletingBudgetId(orcamento.id)
    setBudgetActionError('')
    try {
      await onDelete(orcamento.id)
      if (versionTarget?.id === orcamento.id) setVersionTarget(null)
      if (revisionTarget?.id === orcamento.id) setRevisionTarget(null)
    } catch (exception) {
      setBudgetActionError(exception instanceof Error ? exception.message : 'Nao foi possivel excluir a proposta.')
    } finally {
      setDeletingBudgetId('')
    }
  }

  function confirmOrder(orcamento: Orcamento) {
    const referencia = window.prompt('Referencia do pedido / ordem de compra (opcional):')?.trim() ?? ''
    const observacao = window.prompt('Observacao para o pedido confirmado (opcional):')?.trim() ?? ''
    onStatusChange(orcamento.id, 'ganho', undefined, {
      usuarioId: currentUser.id,
      referencia,
      observacao,
    })
  }

  const groupedOrcamentos = useMemo(() => {
    const groups = new Map<string, Orcamento[]>()
    orcamentos.forEach((orcamento) => {
      const key = orcamento.clienteId || orcamento.clienteNome || orcamento.id
      groups.set(key, [...(groups.get(key) ?? []), orcamento])
    })

    return Array.from(groups.values())
      .map((items) => {
        const sorted = [...items].sort((a, b) => budgetPriorityRank(a) - budgetPriorityRank(b) || b.data.localeCompare(a.data))
        return {
          primary: sorted[0],
          all: sorted,
          labels: budgetPriorityLabels(sorted),
          totalValue: sorted.reduce((sum, item) => sum + item.valorTotal, 0),
        }
      })
      .sort((a, b) => budgetPriorityRank(a.primary) - budgetPriorityRank(b.primary) || b.primary.data.localeCompare(a.primary.data))
  }, [orcamentos])

  return (
    <section className="panel wide">
      <div className="panel-header">
        <div>
          <h2>Propostas abertas</h2>
          <p>Status, validade, previsao de fechamento e motivo de perda ficam centralizados.</p>
        </div>
        <div className="toolbar-actions">
          <button
            className="button primary"
            type="button"
            onClick={() => setShowLooseBudgetSearch((current) => !current)}
          >
            <WalletCards size={16} /> Nova proposta
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
              <h3>Nova proposta</h3>
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
              placeholder="Buscar cliente para proposta"
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
      {budgetActionError && <div className="alert">{budgetActionError}</div>}
      <div className="table">
        <div className="table-head five">
          <span>Cliente</span>
          <span>Status</span>
          <span>Valor</span>
          <span>Validade</span>
          <span>Vendedor</span>
        </div>
        {isLoading && <div className="empty-state compact">Carregando propostas...</div>}
        {!isLoading && groupedOrcamentos.map((group) => {
          const orcamento = group.primary
          const cliente = clientes.find((item) => item.id === orcamento.clienteId)
          const vendedor = usuarios.find((item) => item.id === orcamento.vendedorId)
          const isExpired = isExpiredBudget(orcamento)
          const isClosed = orcamento.status === 'ganho' || orcamento.status === 'perdido'
          const secondaryLabels = group.labels.filter((label) => label !== budgetStatusLabel(orcamento))
          return (
            <div className={isExpired ? 'table-row five expired-budget' : 'table-row five'} key={orcamento.id}>
              <span>
                <strong>{cliente?.nome ?? orcamento.clienteNome ?? 'Cliente nao carregado'}</strong>
                {group.all.length > 1 && <small>{group.all.length} propostas agrupadas</small>}
              </span>
              <span>
                <span className={isExpired ? 'status-pill danger' : 'status-pill'}>{budgetStatusLabel(orcamento)}</span>
                {secondaryLabels.length > 0 && (
                  <div className="budget-priority-tags">
                    {secondaryLabels.map((label) => (
                      <small className="status-pill compact" key={label}>{label}</small>
                    ))}
                  </div>
                )}
                {orcamento.aprovacaoMotivo && <small>{orcamento.aprovacaoMotivo}</small>}
                {orcamento.motivoPerda && <small>Motivo: {lossReasonLabel(orcamento.motivoPerda)}</small>}
                {orcamento.aprovadoEm && <small>Aprovado em {dateLabel(orcamento.aprovadoEm)}</small>}
                {orcamento.pedidoConfirmadoEm && <small>Pedido confirmado em {dateLabel(orcamento.pedidoConfirmadoEm)}</small>}
                {orcamento.pedidoReferencia && <small>Pedido: {orcamento.pedidoReferencia}</small>}
              </span>
              <span>
                <strong>{money(orcamento.valorTotal)}</strong>
                <small>{orcamento.itens?.length ?? 0} itens</small>
                {group.all.length > 1 && <small>{group.all.length} propostas no cliente - total {money(group.totalValue)}</small>}
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
                      if (action === 'ganho') confirmOrder(orcamento)
                      if (action === 'versoes') openVersionHistory(orcamento)
                      if (action === 'revisar') setRevisionTarget(orcamento)
                      if (action === 'excluir') void handleDeleteBudget(orcamento)
                    }}
                  >
                    <option value="">Mais acoes</option>
                    {!isClosed && <option value="enviado">Marcar enviado</option>}
                    {!isClosed && <option value="negociando">Marcar negociando</option>}
                    {!isClosed && <option value="ganho">Confirmar pedido</option>}
                    <option value="versoes">Ver versoes</option>
                    <option value="revisar">Revisar proposta</option>
                    <option value="excluir">{deletingBudgetId === orcamento.id ? 'Excluindo...' : 'Excluir proposta'}</option>
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
                {!isClosed && <details className="budget-loss-row">
                  <summary>Marcar perda</summary>
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
                </details>}
                {group.all.length > 1 && (
                  <details className="budget-loss-row">
                    <summary>Outras propostas do cliente</summary>
                    <div className="budget-related-list">
                      {group.all.filter((item) => item.id !== orcamento.id).map((related) => (
                        <button className="button" type="button" key={related.id} onClick={() => onOpenDetail(related)}>
                          {related.status} - {money(related.valorTotal)} - validade {dateLabel(related.validade)}
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </span>
            </div>
          )
        })}
        {!isLoading && groupedOrcamentos.length === 0 && <div className="empty-state">Nenhuma proposta nesta visao.</div>}
      </div>
      <div className="pagination-bar">
        <span>
          Pagina {page} de {totalPages} - {total} propostas
          {groupedOrcamentos.length !== orcamentos.length ? ` - ${groupedOrcamentos.length} clientes nesta pagina` : ''}
        </span>
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
  onUpdateFollowup,
  onDelete,
}: {
  orcamento: Orcamento
  cliente: Cliente
  vendedor?: Vendedor
  currentUser: SessaoUsuario
  catalogo: CatalogoItem[]
  onBack: () => void
  onRevise: (id: string, orcamento: OrcamentoInput) => Promise<Orcamento>
  onStatusChange: (status: Orcamento['status'], motivoPerda?: string, pedidoConfirmado?: PedidoConfirmadoInput) => Promise<void>
  onUpdateFollowup: (followupDate: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<'resumo' | 'itens' | 'mensagem' | 'aprovacao' | 'versoes'>('resumo')
  const [versions, setVersions] = useState<OrcamentoVersao[]>([])
  const [approvals, setApprovals] = useState<OrcamentoAprovacao[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [revisionTarget, setRevisionTarget] = useState<Orcamento | null>(null)
  const [lossReason, setLossReason] = useState('')
  const [approvalRejectReason, setApprovalRejectReason] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [followupDraft, setFollowupDraft] = useState(orcamento.proximoFollowupEm ?? '')
  const [isUpdatingFollowup, setIsUpdatingFollowup] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeletingBudget, setIsDeletingBudget] = useState(false)
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
  const isClosed = orcamento.status === 'ganho' || orcamento.status === 'perdido'

  useEffect(() => {
    setFollowupDraft(orcamento.proximoFollowupEm ?? '')
  }, [orcamento.id, orcamento.proximoFollowupEm])

  useEffect(() => {
    let isMounted = true

    async function loadTabData() {
      if (activeTab === 'versoes') {
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
      if (activeTab === 'aprovacao') {
        setApprovalsLoading(true)
        try {
          const data = await listOrcamentoAprovacoes(orcamento.id)
          if (isMounted) setApprovals(data)
        } catch {
          if (isMounted) setApprovals([])
        } finally {
          if (isMounted) setApprovalsLoading(false)
        }
      }
    }

    void loadTabData()
    return () => {
      isMounted = false
    }
  }, [activeTab, orcamento.id])

  useEffect(() => {
    let isMounted = true

    async function loadApprovalsPreview() {
      if (activeTab === 'aprovacao') return
      try {
        const data = await listOrcamentoAprovacoes(orcamento.id)
        if (isMounted) setApprovals(data.slice(0, 3))
      } catch {
        if (isMounted) setApprovals([])
      }
    }

    void loadApprovalsPreview()
    return () => {
      isMounted = false
    }
  }, [activeTab, orcamento.id])

  async function refreshApprovals() {
    setApprovalsLoading(true)
    try {
      setApprovals(await listOrcamentoAprovacoes(orcamento.id))
    } catch {
      setApprovals([])
    } finally {
      setApprovalsLoading(false)
    }
  }

  async function updateStatus(status: Orcamento['status'], motivo?: string, pedidoConfirmado?: PedidoConfirmadoInput) {
    setIsUpdatingStatus(true)
    setError('')
    setFeedback('')
    try {
      await onStatusChange(status, motivo, pedidoConfirmado)
      setFeedback(`Status atualizado para ${status}.`)
      await refreshApprovals()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function confirmOrderFromDetail() {
    const referencia = window.prompt('Referencia do pedido / ordem de compra (opcional):')?.trim() ?? ''
    const observacao = window.prompt('Observacao para o pedido confirmado (opcional):')?.trim() ?? ''
    await updateStatus('ganho', undefined, {
      usuarioId: currentUser.id,
      referencia,
      observacao,
    })
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setFeedback('Mensagem copiada.')
  }

  async function registerSendAndOpenWhatsapp() {
    if (!waUrl) return
    setIsUpdatingStatus(true)
    setError('')
    setFeedback('')
    try {
      await onStatusChange('enviado')
      await refreshApprovals()
      window.open(waUrl, '_blank', 'noopener,noreferrer')
      setFeedback('Envio registrado. WhatsApp aberto e follow-up programado.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel registrar o envio da proposta.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function saveFollowup(date: string) {
    setIsUpdatingFollowup(true)
    setError('')
    setFeedback('')
    try {
      await onUpdateFollowup(date)
      setFollowupDraft(date)
      setFeedback(`Follow-up ajustado para ${dateLabel(date)}.`)
      await refreshApprovals()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar o follow-up.')
    } finally {
      setIsUpdatingFollowup(false)
    }
  }

  async function deleteCurrentBudget() {
    const confirmed = window.confirm(`Excluir a proposta ${orcamento.id.slice(0, 8)} de ${cliente.nome}? Esta acao remove itens, versoes e controles vinculados.`)
    if (!confirmed) return

    setIsDeletingBudget(true)
    setError('')
    try {
      await onDelete()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Nao foi possivel excluir a proposta.')
      setIsDeletingBudget(false)
    }
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
          <button className="button danger" type="button" disabled={isDeletingBudget} onClick={() => void deleteCurrentBudget()}>
            {isDeletingBudget ? 'Excluindo...' : 'Excluir'}
          </button>
          <button className="button primary" type="button" disabled={!waUrl || isUpdatingStatus} onClick={() => void registerSendAndOpenWhatsapp()}>
            <MessageCircle size={16} /> Enviar pelo WhatsApp
          </button>
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
          <Info label="Follow-up" value={dateLabel(orcamento.proximoFollowupEm)} />
          <Info label="Enviado em" value={dateLabel(orcamento.enviadoEm)} />
          <Info label="Pedido" value={orcamento.pedidoConfirmadoEm ? dateLabel(orcamento.pedidoConfirmadoEm) : 'Nao confirmado'} />
        </div>
        {orcamento.pedidoConfirmadoEm && (
          <div className="readiness ok">
            <strong>Pedido confirmado</strong>
            <span>
              {orcamento.pedidoReferencia ? `Referencia: ${orcamento.pedidoReferencia}. ` : ''}
              {orcamento.pedidoObservacao || 'Cliente confirmou o pedido manualmente nesta proposta.'}
            </span>
          </div>
        )}
        <div className="readiness ok">
          <strong>Envio da proposta</strong>
          <span>
            {orcamento.enviadoEm
              ? `Proposta enviada em ${dateLabel(orcamento.enviadoEm)}. Proximo follow-up: ${dateLabel(orcamento.proximoFollowupEm)}.`
              : 'Clique em Enviar pelo WhatsApp para abrir a conversa e deixar o follow-up programado.'}
          </span>
        </div>
        <div className="quote-followup-panel">
          <div>
            <strong>Proximo retorno</strong>
            <span>{orcamento.proximoFollowupEm ? `Agendado para ${dateLabel(orcamento.proximoFollowupEm)}` : 'Sem follow-up definido'}</span>
          </div>
          <div className="quote-followup-actions">
            <button className="button" type="button" disabled={isUpdatingFollowup} onClick={() => void saveFollowup(new Date().toISOString().slice(0, 10))}>Hoje</button>
            <button className="button" type="button" disabled={isUpdatingFollowup} onClick={() => void saveFollowup(addDays(new Date().toISOString().slice(0, 10), 2))}>2 dias</button>
            <button className="button" type="button" disabled={isUpdatingFollowup} onClick={() => void saveFollowup(addDays(new Date().toISOString().slice(0, 10), 7))}>7 dias</button>
            <input type="date" value={followupDraft} onChange={(event) => setFollowupDraft(event.target.value)} />
            <button className="button primary" type="button" disabled={!followupDraft || isUpdatingFollowup} onClick={() => void saveFollowup(followupDraft)}>
              {isUpdatingFollowup ? 'Salvando...' : 'Salvar follow-up'}
            </button>
          </div>
        </div>
        <div className="quote-workspace-actions">
          {orcamento.status === 'aguardando_aprovacao' && canApprove && (
            <div className="approval-decision-panel">
              <label>
                Parecer da aprovacao
                <textarea
                  value={approvalNote}
                  onChange={(event) => setApprovalNote(event.target.value)}
                  placeholder="Ex.: desconto aprovado por volume, validar disponibilidade antes da ordem de compra."
                />
              </label>
              <button
                className="button primary"
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => updateStatus('enviado', approvalNote.trim() || 'Aprovado e liberado para envio.')}
              >
                Aprovar e liberar envio
              </button>
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
            </div>
          )}
          {!isClosed && (
            <>
              <button className="button" type="button" disabled={isUpdatingStatus} onClick={() => updateStatus('enviado')}>Enviado</button>
              <button className="button" type="button" disabled={isUpdatingStatus} onClick={() => updateStatus('negociando')}>Negociando</button>
              <button className="button primary" type="button" disabled={isUpdatingStatus} onClick={() => void confirmOrderFromDetail()}>Confirmar pedido</button>
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
            </>
          )}
          <button className="button primary" type="button" onClick={() => setRevisionTarget(orcamento)}>Revisar proposta</button>
        </div>
      </section>

      <section className="panel wide">
        <div className="tabs">
          {[
            ['resumo', 'Resumo'],
            ['itens', 'Itens'],
            ['mensagem', 'Mensagem'],
            ['aprovacao', 'Aprovacao'],
            ['versoes', 'Versoes'],
          ].map(([tab, label]) => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} type="button" onClick={() => setActiveTab(tab as typeof activeTab)}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'resumo' && (
          <div className="quote-workspace-grid">
            <div className={`proposal-preview ${quotePreviewDensityClass(validItems.length, scenarios.length)}`} ref={proposalPreviewRef}>
              <QuoteProposalPreview
                cliente={cliente}
                itens={validItems}
                catalogo={catalogo}
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
              <div className="quote-control-list">
                <div><span>Condicoes</span><strong>{orcamento.formaPagamento ?? 'Nao informada'}</strong></div>
                <div><span>Prazo entrega</span><strong>{orcamento.prazoEntrega ?? 'Confirmar disponibilidade'}</strong></div>
                <div><span>Prazo execucao</span><strong>{orcamento.prazoExecucao ?? 'Sob agendamento'}</strong></div>
                <div><span>Proximo follow-up</span><strong>{dateLabel(orcamento.proximoFollowupEm)}</strong></div>
              </div>
              {approvals.length > 0 && (
                <div className="approval-mini-feed">
                  <strong>Ultimos controles</strong>
                  {approvals.slice(0, 3).map((approval) => (
                    <span key={approval.id}>{approvalActionLabel(approval.acao)} - {dateLabel(approval.criadoEm)}</span>
                  ))}
                </div>
              )}
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

        {activeTab === 'aprovacao' && (
          <div className="approval-grid">
            <div className="summary-box">
              <strong>Regra atual</strong>
              <p>{orcamento.aprovacaoMotivo ?? 'Proposta dentro dos limites comerciais cadastrados.'}</p>
              <div className="quote-control-list">
                <div><span>Status</span><strong>{orcamento.status}</strong></div>
                <div><span>Aprovado em</span><strong>{dateLabel(orcamento.aprovadoEm)}</strong></div>
                <div><span>Enviado em</span><strong>{dateLabel(orcamento.enviadoEm)}</strong></div>
                <div><span>Follow-up</span><strong>{dateLabel(orcamento.proximoFollowupEm)}</strong></div>
              </div>
            </div>
            <div className="summary-box">
              <strong>Historico de decisao</strong>
              {approvalsLoading && <p>Carregando historico...</p>}
              {!approvalsLoading && approvals.length === 0 && <p>Nenhuma aprovacao registrada ainda.</p>}
              {!approvalsLoading && approvals.length > 0 && (
                <div className="approval-timeline">
                  {approvals.map((approval) => (
                    <div key={approval.id}>
                      <strong>{approvalActionLabel(approval.acao)}</strong>
                      <span>{dateLabel(approval.criadoEm)}{approval.usuarioNome ? ` - ${approval.usuarioNome}` : ''}</span>
                      {approval.motivo && <small>{approval.motivo}</small>}
                    </div>
                  ))}
                </div>
              )}
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
  const [prazoEntrega, setPrazoEntrega] = useState(orcamento.prazoEntrega ?? '')
  const [prazoExecucao, setPrazoExecucao] = useState(orcamento.prazoExecucao ?? '')
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
        prazoEntrega: prazoEntrega.trim() || undefined,
        prazoExecucao: prazoExecucao.trim() || undefined,
        observacao: [
          observacao.trim(),
          prazoEntrega.trim() ? `Prazo de entrega: ${prazoEntrega.trim()}.` : '',
          prazoExecucao.trim() ? `Prazo de execucao: ${prazoExecucao.trim()}.` : '',
          revisionNote,
        ].filter(Boolean).join('\n\n'),
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
            <label>
              Prazo entrega
              <input value={prazoEntrega} onChange={(event) => setPrazoEntrega(event.target.value)} placeholder="Ex.: 2 dias apos confirmacao" />
            </label>
            <label>
              Prazo execucao
              <input value={prazoExecucao} onChange={(event) => setPrazoExecucao(event.target.value)} placeholder="Ex.: montagem sob agendamento" />
            </label>
          </div>
          <div className="quote-preset-row">
            <span>Prazos rapidos</span>
            {quoteDeliveryPresets.map((preset) => (
              <button className="button" type="button" key={`revisao-entrega-${preset}`} onClick={() => setPrazoEntrega(preset)}>
                Entrega: {preset}
              </button>
            ))}
            {quoteExecutionPresets.map((preset) => (
              <button className="button" type="button" key={`revisao-execucao-${preset}`} onClick={() => setPrazoExecucao(preset)}>
                Execucao: {preset}
              </button>
            ))}
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
  metasVendedores,
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
  onSaveMeta,
  onCreateTask,
  onOpenClient,
  onOpenQuote,
  onMarkQuoteLost,
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
  metasVendedores: MetaVendedor[]
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
  onSaveMeta: (input: { vendedorId: string; metaReceita: number; metaContatos: number; metaOrcamentos: number; observacao?: string }) => Promise<void>
  onCreateTask: (input: TarefaInput) => Promise<Tarefa>
  onOpenClient: (clienteId: string) => void
  onOpenQuote: (orcamento: Orcamento) => void
  onMarkQuoteLost: (orcamento: Orcamento, motivoPerda: string) => Promise<void>
}) {
  const [metaDrafts, setMetaDrafts] = useState<Record<string, { receita: string; contatos: string; orcamentos: string; observacao: string }>>({})
  const [savingMetaId, setSavingMetaId] = useState('')
  const [metaFeedback, setMetaFeedback] = useState('')
  const [automationRules, setAutomationRules] = useState<AutomacaoRegra[]>([])
  const [automationRulesLoading, setAutomationRulesLoading] = useState(false)
  const [automationRulesError, setAutomationRulesError] = useState('')
  const [automationRuleSavingCode, setAutomationRuleSavingCode] = useState('')
  const [isEscalatingSequences, setIsEscalatingSequences] = useState(false)
  const [sequenceEscalationFeedback, setSequenceEscalationFeedback] = useState('')
  const [sequenceExecutions, setSequenceExecutions] = useState<SequenciaExecucao[]>([])
  const [sequenceExecutionsLoading, setSequenceExecutionsLoading] = useState(false)
  const [sequenceSteps, setSequenceSteps] = useState<SequenciaEtapaConfig[]>([])
  const [sequenceStepDrafts, setSequenceStepDrafts] = useState<Record<string, { dias: string; titulo: string; mensagem: string }>>({})
  const [sequenceStepSavingId, setSequenceStepSavingId] = useState('')
  const [sequenceStepFeedback, setSequenceStepFeedback] = useState('')
  const [managementTaskCreatingId, setManagementTaskCreatingId] = useState('')
  const [managementTaskCreatedIds, setManagementTaskCreatedIds] = useState<string[]>([])
  const [managementAlertFeedback, setManagementAlertFeedback] = useState('')
  const [managementLossReasons, setManagementLossReasons] = useState<Record<string, string>>({})
  const [managementLossSavingId, setManagementLossSavingId] = useState('')
  const reportPdfRef = useRef<HTMLElement | null>(null)
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
  const ganhoMesTotal = forecastVendedor.reduce((total, row) => total + row.ganhoMes, 0)
  const previstoVsRealizado = forecastTotal > 0 ? Math.round((ganhoMesTotal / forecastTotal) * 100) : 0
  const medidas = rankingMedidas.length > 0
    ? rankingMedidas.map((item) => ({ label: item.label, count: item.itens }))
    : rankBy(vendasItens, (venda) => venda.medida ?? venda.produtoNome)
  const servicos = rankingServicos.length > 0
    ? rankingServicos.map((item) => ({ label: item.label, count: item.itens }))
    : rankBy(servicosItens, (servico) => servico.servicoNome)
  const metasBySeller = new Map(metasVendedores.map((meta) => [meta.vendedorId, meta]))
  const openQuoteStatuses: Orcamento['status'][] = ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando']
  const openForecastQuotes = orcamentos.filter((orcamento) => openQuoteStatuses.includes(orcamento.status))
  type ForecastBreakdownRow = { label: string; propostas: number; valor: number; forecast: number; itens?: number }
  const forecastBySource = Array.from(openForecastQuotes.reduce((acc, orcamento) => {
    const cliente = clientes.find((item) => item.id === orcamento.clienteId)
    const label = origemLabel(cliente?.origemBase)
    const current = acc.get(label) ?? { label, propostas: 0, valor: 0, forecast: 0 }
    current.propostas += 1
    current.valor += orcamento.valorTotal
    current.forecast += orcamento.valorTotal * quoteForecastWeight(orcamento.status)
    acc.set(label, current)
    return acc
  }, new Map<string, ForecastBreakdownRow>()).values())
    .sort((a, b) => b.forecast - a.forecast)
  const forecastByProduct = Array.from(openForecastQuotes.reduce((acc, orcamento) => {
    const items = orcamento.itens ?? []
    for (const item of items) {
      const label = item.tipo === 'servico' ? item.descricao : forecastItemLabel(item)
      const current = acc.get(label) ?? { label, propostas: 0, valor: 0, forecast: 0, itens: 0 }
      current.propostas += 1
      current.itens = (current.itens ?? 0) + item.quantidade
      current.valor += item.valorTotal
      current.forecast += item.valorTotal * quoteForecastWeight(orcamento.status)
      acc.set(label, current)
    }
    return acc
  }, new Map<string, ForecastBreakdownRow>()).values())
    .sort((a, b) => b.forecast - a.forecast)
    .slice(0, 8)
  const commercialDisciplineRows = usuarios
    .filter((usuario) => usuario.role === 'vendedor')
    .map((usuario) => {
      const contatosHoje = atividadesDia.find((row) => row.vendedorId === usuario.id)?.contatosHoje
        ?? interacoes.filter((interacao) => interacao.vendedorId === usuario.id && interacao.data.slice(0, 10) === new Date().toISOString().slice(0, 10)).length
      const funil = funilGerencial.find((row) => row.vendedorId === usuario.id)
      const contatos30d = funil?.contatos30d ?? interacoes.filter((interacao) => interacao.vendedorId === usuario.id && daysSince(interacao.data) <= 30).length
      const orcamentos30d = funil?.orcamentos30d ?? orcamentos.filter((orcamento) => orcamento.vendedorId === usuario.id && daysSince(orcamento.data) <= 30).length
      const followupsAbertos = tarefas.filter((tarefa) => tarefa.vendedorId === usuario.id && tarefa.status === 'aberta' && isCommercialFollowupTask(tarefa)).length
      const followupsVencidos = tarefas.filter((tarefa) => tarefa.vendedorId === usuario.id && tarefa.status === 'aberta' && isCommercialFollowupTask(tarefa) && daysSince(tarefa.dataVencimento) > 0).length
      const semProximaAcao = clientes.filter((cliente) =>
        cliente.vendedorId === usuario.id &&
        cliente.status !== 'Nao contatar' &&
        !tarefas.some((tarefa) => tarefa.clienteId === cliente.id && tarefa.status === 'aberta') &&
        !orcamentos.some((orcamento) => orcamento.clienteId === cliente.id && ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'].includes(orcamento.status)),
      ).length
      const conversaoContatoOrcamento = contatos30d ? Math.round((orcamentos30d / contatos30d) * 100) : 0
      const disciplina = Math.max(0, Math.min(100, 55 + contatosHoje * 8 + conversaoContatoOrcamento - followupsVencidos * 12 - Math.min(semProximaAcao, 20)))
      return {
        vendedorId: usuario.id,
        vendedorNome: usuario.nome,
        contatosHoje,
        contatos30d,
        orcamentos30d,
        conversaoContatoOrcamento,
        followupsAbertos,
        followupsVencidos,
        semProximaAcao,
        disciplina,
      }
    })
    .sort((a, b) => a.disciplina - b.disciplina)

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
  const metaRows = forecastVendedor.length > 0
    ? forecastVendedor
    : usuarios.filter((usuario) => usuario.role === 'vendedor').map((usuario) => ({
        vendedorId: usuario.id,
        vendedorNome: usuario.nome,
        propostasAbertas: 0,
        pipelineAberto: 0,
        forecastPonderado: 0,
        ganhoMes: 0,
        vencidas: 0,
        vencem7d: 0,
        gargaloPrincipal: 'Sem forecast',
        ultimoMovimento: null,
      }))
  const gamificationRows = metaRows
    .map((row) => {
      const meta = metasBySeller.get(row.vendedorId)
      const atividade = commercialDisciplineRows.find((item) => item.vendedorId === row.vendedorId)
      const receitaScore = meta?.metaReceita ? Math.min(120, Math.round((row.ganhoMes / meta.metaReceita) * 100)) : 0
      const contatosScore = meta?.metaContatos ? Math.min(120, Math.round(((atividade?.contatos30d ?? 0) / meta.metaContatos) * 100)) : 0
      const propostasScore = meta?.metaOrcamentos ? Math.min(120, Math.round((row.propostasAbertas / meta.metaOrcamentos) * 100)) : 0
      const disciplina = atividade?.disciplina ?? 0
      const score = Math.round(receitaScore * 0.45 + contatosScore * 0.2 + propostasScore * 0.2 + disciplina * 0.15)
      const badge = score >= 100 ? 'Meta batida' : score >= 75 ? 'Ritmo bom' : score >= 45 ? 'Acompanhar' : 'Precisa acao'
      return {
        vendedorId: row.vendedorId,
        vendedorNome: row.vendedorNome,
        score,
        badge,
        receitaScore,
        contatosScore,
        propostasScore,
        disciplina,
      }
    })
    .sort((a, b) => b.score - a.score)
  type UsageQualityRow = { id: string; prioridade: number; area: string; responsavel: string; problema: string; acao: string }
  const usageQualityRows: UsageQualityRow[] = commercialDisciplineRows
    .flatMap((row) => [
      row.followupsVencidos > 0
        ? {
            id: `${row.vendedorId}-followups`,
            prioridade: row.followupsVencidos >= 5 ? 95 : 75,
            area: 'Follow-up',
            responsavel: row.vendedorNome,
            problema: `${row.followupsVencidos} follow-ups vencidos`,
            acao: 'Reagendar ou concluir pendencias antes de novas campanhas.',
          }
        : undefined,
      row.semProximaAcao > 0
        ? {
            id: `${row.vendedorId}-sem-proxima`,
            prioridade: row.semProximaAcao >= 20 ? 90 : 70,
            area: 'Carteira',
            responsavel: row.vendedorNome,
            problema: `${row.semProximaAcao} clientes sem proxima acao`,
            acao: 'Criar tarefas pela Minha rotina ou redistribuir carteira parada.',
          }
        : undefined,
      row.contatos30d === 0 && row.orcamentos30d === 0
        ? {
            id: `${row.vendedorId}-sem-uso`,
            prioridade: 85,
            area: 'Uso do CRM',
            responsavel: row.vendedorNome,
            problema: 'Sem contatos ou propostas nos ultimos 30 dias',
            acao: 'Validar carteira, acesso e rotina diaria do vendedor.',
          }
        : undefined,
    ])
    .filter((row): row is UsageQualityRow => Boolean(row))
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, 12)
  type ManagementAlertRow = {
    id: string
    severidade: 'alta' | 'media' | 'baixa'
    tipo: string
    clienteId: string
    orcamento?: Orcamento
    cliente: string
    responsavel: string
    vendedorId?: string
    valor?: number
    problema: string
    acao: string
    tarefaTitulo: string
    tarefaDescricao: string
    tarefaOrigem: TarefaInput['origem']
  }
  const managementAlertRows: ManagementAlertRow[] = [
    ...orcamentos
      .filter((orcamento) =>
        ['enviado', 'negociando'].includes(orcamento.status) &&
        !orcamento.proximoFollowupEm &&
        orcamento.valorTotal > 0,
      )
      .map((orcamento) => ({
        id: `orcamento-sem-followup-${orcamento.id}`,
        severidade: 'alta' as const,
        tipo: 'Proposta sem follow-up',
        clienteId: orcamento.clienteId,
        orcamento,
        cliente: orcamento.clienteNome ?? clientes.find((cliente) => cliente.id === orcamento.clienteId)?.nome ?? 'Cliente',
        responsavel: orcamento.vendedorNome ?? usuarios.find((usuario) => usuario.id === orcamento.vendedorId)?.nome ?? 'Sem responsavel',
        vendedorId: orcamento.vendedorId,
        valor: orcamento.valorTotal,
        problema: `Proposta ${orcamento.status} sem proxima data registrada.`,
        acao: 'Definir follow-up no orcamento ou criar tarefa comercial hoje.',
        tarefaTitulo: 'Follow-up de proposta sem data',
        tarefaDescricao: `Proposta ${orcamento.status} no valor de ${money(orcamento.valorTotal)} esta sem proximo follow-up.`,
        tarefaOrigem: 'orcamento',
      })),
    ...orcamentos
      .filter((orcamento) =>
        openQuoteStatuses.includes(orcamento.status) &&
        daysSince(orcamento.enviadoEm ?? orcamento.data) >= 7 &&
        orcamento.valorTotal > 0,
      )
      .map((orcamento) => ({
        id: `orcamento-parado-${orcamento.id}`,
        severidade: orcamento.valorTotal >= 10000 ? 'alta' as const : 'media' as const,
        tipo: 'Proposta parada',
        clienteId: orcamento.clienteId,
        orcamento,
        cliente: orcamento.clienteNome ?? clientes.find((cliente) => cliente.id === orcamento.clienteId)?.nome ?? 'Cliente',
        responsavel: orcamento.vendedorNome ?? usuarios.find((usuario) => usuario.id === orcamento.vendedorId)?.nome ?? 'Sem responsavel',
        vendedorId: orcamento.vendedorId,
        valor: orcamento.valorTotal,
        problema: `Sem movimento ha ${daysSince(orcamento.enviadoEm ?? orcamento.data)} dias.`,
        acao: 'Retomar contato, atualizar status ou registrar motivo de perda.',
        tarefaTitulo: 'Retomar proposta parada',
        tarefaDescricao: `Proposta sem movimento ha ${daysSince(orcamento.enviadoEm ?? orcamento.data)} dias. Valor: ${money(orcamento.valorTotal)}.`,
        tarefaOrigem: 'orcamento',
      })),
    ...oportunidades
      .filter((oportunidade) => !oportunidade.bloqueada && !oportunidade.tarefaExistente && oportunidade.prioridade >= 75)
      .map((oportunidade) => ({
        id: `oportunidade-sem-tarefa-${oportunidade.id}`,
        severidade: oportunidade.prioridade >= 90 ? 'alta' as const : 'media' as const,
        tipo: 'Oportunidade sem tarefa',
        clienteId: oportunidade.clienteId,
        cliente: oportunidade.clienteNome,
        responsavel: clientes.find((cliente) => cliente.id === oportunidade.clienteId)?.vendedorNome ?? 'Sem responsavel',
        vendedorId: clientes.find((cliente) => cliente.id === oportunidade.clienteId)?.vendedorId,
        problema: `${oportunidade.tipo} com prioridade ${oportunidade.prioridade}.`,
        acao: oportunidade.proximaAcao || 'Criar proxima acao comercial.',
        tarefaTitulo: oportunidade.proximaAcao || 'Tratar oportunidade comercial',
        tarefaDescricao: oportunidade.motivo,
        tarefaOrigem: 'oportunidade',
      })),
  ]
    .sort((a, b) => {
      const order = { alta: 3, media: 2, baixa: 1 }
      return order[b.severidade] - order[a.severidade]
    })
    .slice(0, 12)
  const activeSequenceExecutions = sequenceExecutions.filter((execution) => execution.status === 'ativa')
  const pausedSequenceExecutions = sequenceExecutions.filter((execution) => execution.status === 'pausada')
  const sequenceExecutionsDue = activeSequenceExecutions.filter((execution) => daysSince(execution.proximaAcaoEm) >= 0)
  const sequenceExecutionRows = [...sequenceExecutions]
    .sort((a, b) => {
      const statusOrder = a.status.localeCompare(b.status)
      if (statusOrder !== 0) return statusOrder
      return a.proximaAcaoEm.localeCompare(b.proximaAcaoEm)
    })
    .slice(0, 10)

  useEffect(() => {
    let isMounted = true
    setAutomationRulesLoading(true)
    setAutomationRulesError('')
    listAutomacaoRegras()
      .then((rules) => {
        if (isMounted) setAutomationRules(rules)
      })
      .catch((exception) => {
        if (isMounted) setAutomationRulesError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar regras de automacao.')
      })
      .finally(() => {
        if (isMounted) setAutomationRulesLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setSequenceExecutionsLoading(true)
    Promise.all([listSequenciaExecucoes(), listDefaultCommercialSequenceSteps()])
      .then(([rows, steps]) => {
        if (!isMounted) return
        setSequenceExecutions(rows)
        setSequenceSteps(steps)
        setSequenceStepDrafts(Object.fromEntries(steps.map((step) => [
          step.id,
          { dias: step.diasAposInicio.toString(), titulo: step.titulo, mensagem: step.mensagem },
        ])))
      })
      .catch((exception) => {
        if (isMounted) setAutomationRulesError(exception instanceof Error ? exception.message : 'Nao foi possivel carregar sequencias comerciais.')
      })
      .finally(() => {
        if (isMounted) setSequenceExecutionsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function toggleAutomationRule(rule: AutomacaoRegra, ativo: boolean) {
    setAutomationRuleSavingCode(rule.codigo)
    setAutomationRulesError('')
    try {
      const updated = await setAutomacaoRegraAtiva(rule.codigo, ativo)
      setAutomationRules((current) => current.map((item) => (item.codigo === updated.codigo ? updated : item)))
    } catch (exception) {
      setAutomationRulesError(exception instanceof Error ? exception.message : 'Nao foi possivel atualizar regra de automacao.')
    } finally {
      setAutomationRuleSavingCode('')
    }
  }

  async function runSequenceEscalation() {
    setIsEscalatingSequences(true)
    setAutomationRulesError('')
    setSequenceEscalationFeedback('')
    try {
      const created = await escalateStaleCommercialSequences()
      const rows = await listSequenciaExecucoes()
      setSequenceExecutions(rows)
      setSequenceEscalationFeedback(created > 0
        ? `${created} tarefas gerenciais criadas para sequencias estagnadas.`
        : 'Nenhuma sequencia estagnada encontrada agora.')
    } catch (exception) {
      setAutomationRulesError(exception instanceof Error ? exception.message : 'Nao foi possivel escalar sequencias estagnadas.')
    } finally {
      setIsEscalatingSequences(false)
    }
  }

  async function saveSequenceStep(step: SequenciaEtapaConfig) {
    const draft = sequenceStepDrafts[step.id]
    if (!draft) return
    setSequenceStepSavingId(step.id)
    setSequenceStepFeedback('')
    setAutomationRulesError('')
    try {
      const updated = await updateSequenceStep({
        id: step.id,
        diasAposInicio: Math.max(0, Math.round(numberFromInput(draft.dias))),
        titulo: draft.titulo.trim() || `Etapa ${step.ordem}`,
        mensagem: draft.mensagem.trim(),
      })
      setSequenceSteps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSequenceStepDrafts((current) => ({
        ...current,
        [updated.id]: {
          dias: updated.diasAposInicio.toString(),
          titulo: updated.titulo,
          mensagem: updated.mensagem,
        },
      }))
      setSequenceStepFeedback('Etapa da cadencia salva.')
    } catch (exception) {
      setAutomationRulesError(exception instanceof Error ? exception.message : 'Nao foi possivel salvar etapa da sequencia.')
    } finally {
      setSequenceStepSavingId('')
    }
  }

  function updateSequenceStepDraft(stepId: string, patch: Partial<{ dias: string; titulo: string; mensagem: string }>) {
    setSequenceStepDrafts((current) => ({
      ...current,
      [stepId]: { ...(current[stepId] ?? { dias: '', titulo: '', mensagem: '' }), ...patch },
    }))
  }

  function metaDraftFor(vendedorId: string) {
    const meta = metasBySeller.get(vendedorId)
    return metaDrafts[vendedorId] ?? {
      receita: meta?.metaReceita.toString() ?? '',
      contatos: meta?.metaContatos.toString() ?? '',
      orcamentos: meta?.metaOrcamentos.toString() ?? '',
      observacao: meta?.observacao ?? '',
    }
  }

  function updateMetaDraft(vendedorId: string, patch: Partial<{ receita: string; contatos: string; orcamentos: string; observacao: string }>) {
    setMetaDrafts((current) => ({
      ...current,
      [vendedorId]: { ...metaDraftFor(vendedorId), ...patch },
    }))
  }

  async function saveMeta(vendedorId: string) {
    const draft = metaDraftFor(vendedorId)
    setSavingMetaId(vendedorId)
    setMetaFeedback('')
    try {
      await onSaveMeta({
        vendedorId,
        metaReceita: numberFromInput(draft.receita),
        metaContatos: Math.max(0, Math.round(numberFromInput(draft.contatos))),
        metaOrcamentos: Math.max(0, Math.round(numberFromInput(draft.orcamentos))),
        observacao: draft.observacao.trim() || undefined,
      })
      setMetaFeedback('Meta salva para o mes atual.')
    } finally {
      setSavingMetaId('')
    }
  }

  function exportWeeklyMeetingCsv() {
    const today = new Date().toISOString().slice(0, 10)
    const rows = metaRows.map((row) => {
      const meta = metasBySeller.get(row.vendedorId)
      const atividade = commercialDisciplineRows.find((item) => item.vendedorId === row.vendedorId)
      const atingimentoReceita = meta?.metaReceita ? Math.round((row.ganhoMes / meta.metaReceita) * 100) : 0
      const atingimentoContatos = meta?.metaContatos ? Math.round(((atividade?.contatos30d ?? 0) / meta.metaContatos) * 100) : 0
      const atingimentoPropostas = meta?.metaOrcamentos ? Math.round((row.propostasAbertas / meta.metaOrcamentos) * 100) : 0

      return {
        vendedor: row.vendedorNome,
        meta_receita: meta?.metaReceita ?? 0,
        ganho_mes: row.ganhoMes,
        atingimento_receita_pct: atingimentoReceita,
        pipeline_aberto: row.pipelineAberto,
        forecast_ponderado: row.forecastPonderado,
        propostas_abertas: row.propostasAbertas,
        propostas_vencidas: row.vencidas,
        propostas_vencem_7d: row.vencem7d,
        contatos_30d: atividade?.contatos30d ?? 0,
        meta_contatos: meta?.metaContatos ?? 0,
        atingimento_contatos_pct: atingimentoContatos,
        orcamentos_30d: atividade?.orcamentos30d ?? 0,
        meta_orcamentos: meta?.metaOrcamentos ?? 0,
        atingimento_orcamentos_pct: atingimentoPropostas,
        followups_abertos: atividade?.followupsAbertos ?? 0,
        followups_vencidos: atividade?.followupsVencidos ?? 0,
        clientes_sem_proxima_acao: atividade?.semProximaAcao ?? 0,
        disciplina_pct: atividade?.disciplina ?? 0,
        gargalo_principal: row.gargaloPrincipal,
        ultimo_movimento: row.ultimoMovimento ?? '',
        observacao_meta: meta?.observacao ?? '',
      }
    })

    downloadCsv(`reuniao-gerencial-${today}.csv`, rows)
  }

  function exportWeeklyMeetingPdf() {
    void downloadElementPdf(reportPdfRef.current, `Reuniao gerencial - ${quotePdfDatePart()}.pdf`)
  }

  async function createManagementAlertTask(alert: ManagementAlertRow) {
    setManagementTaskCreatingId(alert.id)
    setManagementAlertFeedback('')
    try {
      await onCreateTask({
        clienteId: alert.clienteId,
        vendedorId: alert.vendedorId,
        titulo: alert.tarefaTitulo,
        descricao: alert.tarefaDescricao,
        dataVencimento: new Date().toISOString().slice(0, 10),
        prioridade: alert.severidade === 'alta' ? 95 : alert.severidade === 'media' ? 75 : 55,
        origem: alert.tarefaOrigem,
      })
      setManagementTaskCreatedIds((current) => [...current, alert.id])
      setManagementAlertFeedback('Tarefa criada para o alerta comercial.')
    } catch (exception) {
      setManagementAlertFeedback(exception instanceof Error ? exception.message : 'Nao foi possivel criar tarefa do alerta.')
    } finally {
      setManagementTaskCreatingId('')
    }
  }

  async function markManagementQuoteLost(alert: ManagementAlertRow) {
    if (!alert.orcamento) return
    const motivoPerda = managementLossReasons[alert.id]?.trim()
    if (!motivoPerda) {
      setManagementAlertFeedback('Informe o motivo de perda antes de encerrar a proposta.')
      return
    }
    setManagementLossSavingId(alert.id)
    setManagementAlertFeedback('')
    try {
      await onMarkQuoteLost(alert.orcamento, motivoPerda)
      setManagementAlertFeedback('Proposta marcada como perdida com motivo registrado.')
    } catch (exception) {
      setManagementAlertFeedback(exception instanceof Error ? exception.message : 'Nao foi possivel marcar a proposta como perdida.')
    } finally {
      setManagementLossSavingId('')
    }
  }

  return (
    <section className="grid-layout" ref={reportPdfRef}>
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
          <div className="inline-actions">
            <button className="button ghost" type="button" onClick={exportWeeklyMeetingCsv} disabled={metaRows.length === 0}>
              <FileUp size={16} />
              Exportar CSV
            </button>
            <button className="button ghost" type="button" onClick={exportWeeklyMeetingPdf}>
              <FileUp size={16} />
              Baixar PDF
            </button>
          </div>
        </div>
        <div className="info-grid forecast-summary">
          <Info label="Pipeline aberto" value={money(pipelineForecast)} />
          <Info label="Forecast ponderado" value={money(forecastTotal)} />
          <Info label="Previsto vs realizado" value={`${previstoVsRealizado}%`} />
          <Info label="Propostas vencidas" value={propostasVencidasForecast.toString()} />
          <Info label="Ganho no mes" value={money(ganhoMesTotal)} />
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
            <h2>Forecast por origem e mix</h2>
            <p>Concentracao do pipeline aberto por origem da base e por produto, medida ou servico cotado.</p>
          </div>
          <BarChart3 size={18} />
        </div>
        <div className="forecast-breakdown-grid">
          <div className="table">
            <div className="table-head forecast-breakdown-row">
              <span>Origem</span>
              <span>Propostas</span>
              <span>Aberto</span>
              <span>Forecast</span>
            </div>
            {forecastBySource.map((row) => (
              <div className="table-row forecast-breakdown-row" key={row.label}>
                <span><strong>{row.label}</strong></span>
                <span>{row.propostas}</span>
                <span>{money(row.valor)}</span>
                <span><strong>{money(row.forecast)}</strong></span>
              </div>
            ))}
            {forecastBySource.length === 0 && <div className="empty-state compact">Sem propostas abertas por origem.</div>}
          </div>
          <div className="table">
            <div className="table-head forecast-breakdown-row">
              <span>Produto / medida</span>
              <span>Itens</span>
              <span>Aberto</span>
              <span>Forecast</span>
            </div>
            {forecastByProduct.map((row) => (
              <div className="table-row forecast-breakdown-row" key={row.label}>
                <span><strong>{row.label}</strong><small>{row.propostas} propostas</small></span>
                <span>{row.itens ?? 0}</span>
                <span>{money(row.valor)}</span>
                <span><strong>{money(row.forecast)}</strong></span>
              </div>
            ))}
            {forecastByProduct.length === 0 && <div className="empty-state compact">Sem itens cotados em propostas abertas.</div>}
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Alertas comerciais</h2>
            <p>Propostas e oportunidades que precisam de decisao antes da proxima reuniao.</p>
          </div>
          <AlertTriangle size={18} />
        </div>
        {managementAlertFeedback && (
          managementAlertFeedback.includes('criada')
            ? <div className="success-alert">{managementAlertFeedback}</div>
            : <div className="alert">{managementAlertFeedback}</div>
        )}
        {managementAlertRows.length > 0 ? (
          <div className="quality-issue-grid">
            {managementAlertRows.map((alert) => (
              <div className={`quality-issue ${alert.severidade}`} key={alert.id}>
                <span className="status-pill warn">{alert.tipo}</span>
                <strong>{alert.cliente}</strong>
                <span>{alert.problema}</span>
                <small>
                  {alert.responsavel}
                  {alert.valor ? ` · ${money(alert.valor)}` : ''}
                </small>
                <small>{alert.acao}</small>
                <div className="inline-actions">
                  <button
                    className="button primary"
                    type="button"
                    disabled={managementTaskCreatingId === alert.id || managementTaskCreatedIds.includes(alert.id)}
                    onClick={() => createManagementAlertTask(alert)}
                  >
                    {managementTaskCreatedIds.includes(alert.id) ? 'Tarefa criada' : managementTaskCreatingId === alert.id ? 'Criando...' : 'Criar tarefa'}
                  </button>
                  {alert.orcamento ? (
                    <button className="button" type="button" onClick={() => onOpenQuote(alert.orcamento!)}>
                      Abrir proposta
                    </button>
                  ) : (
                    <button className="button" type="button" onClick={() => onOpenClient(alert.clienteId)}>
                      Abrir ficha
                    </button>
                  )}
                </div>
                {alert.orcamento && (
                  <div className="management-loss-row">
                    <input
                      value={managementLossReasons[alert.id] ?? ''}
                      onChange={(event) => setManagementLossReasons((current) => ({ ...current, [alert.id]: event.target.value }))}
                      placeholder="Motivo da perda: preco, prazo, concorrente..."
                    />
                    <button
                      className="button danger"
                      type="button"
                      disabled={managementLossSavingId === alert.id || !managementLossReasons[alert.id]?.trim()}
                      onClick={() => markManagementQuoteLost(alert)}
                    >
                      {managementLossSavingId === alert.id ? 'Salvando...' : 'Marcar perda'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Sem alertas comerciais criticos agora.</div>
        )}
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Disciplina comercial</h2>
            <p>Contato, follow-up e conversao em propostas por vendedor.</p>
          </div>
          <Phone size={18} />
        </div>
        <div className="table">
          <div className="table-head commercial-discipline-report">
            <span>Vendedor</span>
            <span>Hoje</span>
            <span>30 dias</span>
            <span>Orc. 30d</span>
            <span>Conv.</span>
            <span>Follow-ups</span>
            <span>Sem prox.</span>
            <span>Disciplina</span>
          </div>
          {commercialDisciplineRows.map((row) => (
            <div className="table-row commercial-discipline-report" key={row.vendedorId}>
              <span><strong>{row.vendedorNome}</strong></span>
              <span>{row.contatosHoje}</span>
              <span>{row.contatos30d}</span>
              <span>{row.orcamentos30d}</span>
              <span>{row.conversaoContatoOrcamento}%</span>
              <span className={row.followupsVencidos > 0 ? 'score danger' : 'score'}>
                {row.followupsAbertos}
                <small>{row.followupsVencidos} vencidos</small>
              </span>
              <span>{row.semProximaAcao}</span>
              <span className={row.disciplina >= 75 ? 'status-pill ok' : row.disciplina >= 50 ? 'status-pill warn' : 'status-pill danger'}>
                {row.disciplina}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Metas do mes</h2>
            <p>Receita, contatos e propostas por vendedor, comparadas com ganho e forecast atual.</p>
          </div>
          <ShieldCheck size={18} />
        </div>
        {metaFeedback && <div className="success-alert">{metaFeedback}</div>}
        <div className="table">
          <div className="table-head seller-goals">
            <span>Vendedor</span>
            <span>Meta receita</span>
            <span>Atingido</span>
            <span>Forecast</span>
            <span>Contatos</span>
            <span>Propostas</span>
            <span>Observacao</span>
            <span>Acao</span>
          </div>
          {metaRows.map((row) => {
            const draft = metaDraftFor(row.vendedorId)
            const metaReceita = numberFromInput(draft.receita)
            const atingimento = metaReceita > 0 ? Math.round((row.ganhoMes / metaReceita) * 100) : 0
            return (
              <div className="table-row seller-goals" key={row.vendedorId}>
                <span><strong>{row.vendedorNome}</strong><small>{row.propostasAbertas} propostas abertas</small></span>
                <input value={draft.receita} onChange={(event) => updateMetaDraft(row.vendedorId, { receita: event.target.value })} placeholder="R$" />
                <span className={atingimento >= 100 ? 'status-pill ok' : atingimento >= 60 ? 'status-pill warn' : 'status-pill danger'}>
                  {atingimento}%
                </span>
                <span>{money(row.forecastPonderado)}</span>
                <input value={draft.contatos} onChange={(event) => updateMetaDraft(row.vendedorId, { contatos: event.target.value })} placeholder="0" />
                <input value={draft.orcamentos} onChange={(event) => updateMetaDraft(row.vendedorId, { orcamentos: event.target.value })} placeholder="0" />
                <input value={draft.observacao} onChange={(event) => updateMetaDraft(row.vendedorId, { observacao: event.target.value })} placeholder="Foco do mes" />
                <button className="button" type="button" disabled={savingMetaId === row.vendedorId} onClick={() => void saveMeta(row.vendedorId)}>
                  {savingMetaId === row.vendedorId ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Ranking comercial</h2>
            <p>Gamificacao simples combinando meta de receita, contatos, propostas e disciplina operacional.</p>
          </div>
          <Trophy size={18} />
        </div>
        <div className="table">
          <div className="table-head seller-goals">
            <span>Pos.</span>
            <span>Vendedor</span>
            <span>Score</span>
            <span>Receita</span>
            <span>Contatos</span>
            <span>Propostas</span>
            <span>Disciplina</span>
            <span>Status</span>
          </div>
          {gamificationRows.map((row, index) => (
            <div className="table-row seller-goals" key={row.vendedorId}>
              <span><strong>{index + 1}</strong></span>
              <span><strong>{row.vendedorNome}</strong></span>
              <span className={row.score >= 75 ? 'status-pill ok' : row.score >= 45 ? 'status-pill warn' : 'status-pill danger'}>{row.score}</span>
              <span>{row.receitaScore}%</span>
              <span>{row.contatosScore}%</span>
              <span>{row.propostasScore}%</span>
              <span>{row.disciplina}%</span>
              <span>{row.badge}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Sequencias comerciais</h2>
            <p>Fila das cadencias 0/2/7/15 em andamento, pausadas e vencidas para acompanhamento gerencial.</p>
          </div>
          <RefreshCw size={18} />
        </div>
        <div className="info-grid">
          <Info label="Ativas" value={activeSequenceExecutions.length.toString()} />
          <Info label="Pausadas" value={pausedSequenceExecutions.length.toString()} />
          <Info label="Vencidas/hoje" value={sequenceExecutionsDue.length.toString()} />
          <Info label="Total na fila" value={sequenceExecutions.length.toString()} />
        </div>
        {sequenceExecutionsLoading && <div className="empty-state compact">Carregando sequencias comerciais...</div>}
        {!sequenceExecutionsLoading && (
          <div className="table">
            <div className="table-head sequence-report-row">
              <span>Cliente</span>
              <span>Status</span>
              <span>Etapa</span>
              <span>Proxima acao</span>
              <span>Sequencia</span>
            </div>
            {sequenceExecutionRows.map((execution) => (
              <div className="table-row sequence-report-row" key={execution.id}>
                <span><strong>{execution.clienteNome}</strong><small>{execution.vendedorId ?? 'Sem vendedor vinculado'}</small></span>
                <span className={execution.status === 'ativa' ? 'status-pill ok' : 'status-pill warn'}>{execution.status}</span>
                <span>{execution.etapaAtual}</span>
                <span className={daysSince(execution.proximaAcaoEm) >= 0 && execution.status === 'ativa' ? 'score danger' : 'score'}>
                  {dateLabel(execution.proximaAcaoEm)}
                </span>
                <span>{execution.sequenciaNome}</span>
              </div>
            ))}
            {sequenceExecutionRows.length === 0 && <div className="empty-state compact">Sem sequencias ativas ou pausadas agora.</div>}
          </div>
        )}
        <div className="sequence-step-editor">
          <div>
            <h3>Cadencia padrao</h3>
            <p>Ajuste dias, titulos e mensagens usadas nas proximas sequencias iniciadas pelo time.</p>
          </div>
          {sequenceStepFeedback && <div className="success-alert">{sequenceStepFeedback}</div>}
          {sequenceSteps.map((step) => {
            const draft = sequenceStepDrafts[step.id] ?? { dias: step.diasAposInicio.toString(), titulo: step.titulo, mensagem: step.mensagem }
            return (
              <div className="sequence-step-row" key={step.id}>
                <label>
                  Dia
                  <input value={draft.dias} onChange={(event) => updateSequenceStepDraft(step.id, { dias: event.target.value })} />
                </label>
                <label>
                  Titulo
                  <input value={draft.titulo} onChange={(event) => updateSequenceStepDraft(step.id, { titulo: event.target.value })} />
                </label>
                <label className="span-2">
                  Mensagem
                  <textarea value={draft.mensagem} onChange={(event) => updateSequenceStepDraft(step.id, { mensagem: event.target.value })} />
                </label>
                <button className="button" type="button" disabled={sequenceStepSavingId === step.id} onClick={() => void saveSequenceStep(step)}>
                  {sequenceStepSavingId === step.id ? 'Salvando...' : 'Salvar etapa'}
                </button>
              </div>
            )
          })}
          {sequenceSteps.length === 0 && !sequenceExecutionsLoading && (
            <div className="empty-state compact">Sem etapas de sequencia configuradas.</div>
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Regras de automacao</h2>
            <p>Controles gerenciais salvos no Supabase para ligar ou desligar automacoes operacionais.</p>
          </div>
          <div className="toolbar-actions">
            <button className="button" type="button" disabled={isEscalatingSequences} onClick={() => void runSequenceEscalation()}>
              <RefreshCw size={15} />
              {isEscalatingSequences ? 'Escalando...' : 'Escalar sequencias'}
            </button>
            <Settings size={18} />
          </div>
        </div>
        {automationRulesError && <div className="alert">{automationRulesError}</div>}
        {sequenceEscalationFeedback && <div className="success-alert">{sequenceEscalationFeedback}</div>}
        {automationRulesLoading && <div className="empty-state compact">Carregando regras de automacao...</div>}
        <div className="info-grid">
          {automationRules.map((rule) => (
            <label className="checkbox-field" key={rule.codigo}>
              <input
                type="checkbox"
                checked={rule.ativo}
                disabled={automationRuleSavingCode === rule.codigo}
                onChange={(event) => void toggleAutomationRule(rule, event.target.checked)}
              />
              <span>
                <strong>{rule.nome}</strong>
                <small>{rule.descricao ?? `${rule.evento} -> ${rule.acao}`}</small>
              </span>
            </label>
          ))}
          {!automationRulesLoading && automationRules.length === 0 && (
            <div className="empty-state compact">Nenhuma regra de automacao cadastrada.</div>
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Qualidade de uso</h2>
            <p>Gargalos que mostram onde o CRM nao esta sendo alimentado ou acompanhado corretamente.</p>
          </div>
          <AlertTriangle size={18} />
        </div>
        <div className="table">
          <div className="table-head five">
            <span>Prioridade</span>
            <span>Area</span>
            <span>Responsavel</span>
            <span>Problema</span>
            <span>Acao sugerida</span>
          </div>
          {usageQualityRows.map((row) => (
            <div className="table-row five" key={row.id}>
              <span className={row.prioridade >= 90 ? 'status-pill danger' : 'status-pill warn'}>{row.prioridade}</span>
              <span>{row.area}</span>
              <span>{row.responsavel}</span>
              <span>{row.problema}</span>
              <span>{row.acao}</span>
            </div>
          ))}
          {usageQualityRows.length === 0 && <div className="empty-state">Nenhum gargalo critico de uso encontrado agora.</div>}
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

function Auditoria({ alteracoes, eventos }: { alteracoes: ClienteAlteracao[]; eventos: AuditoriaEvento[] }) {
  const [field, setField] = useState('todos')
  const [category, setCategory] = useState<AuditoriaEvento['categoria'] | 'todas'>('todas')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<'7d' | '30d' | 'todos'>('30d')
  const auditCoverage = [
    { label: 'Cadastro do cliente', description: 'Nome, telefone, WhatsApp, cidade, UF, origem e campos comerciais.' },
    { label: 'Carteira e responsavel', description: 'Mudancas de vendedor e responsavel ficam rastreaveis por usuario.' },
    { label: 'Status comercial', description: 'Qualificacao, nao contatar e andamento do lead aparecem na trilha.' },
    { label: 'Importacao e saneamento', description: 'Fila de qualidade e conflitos mostram o que precisa ser corrigido.' },
  ]
  const fields = ['todos', ...Array.from(new Set(alteracoes.map((alteracao) => alteracao.campo)))]
  const filteredEvents = eventos.filter((event) => {
    if (category !== 'todas' && event.categoria !== category) return false
    const term = query.trim().toLowerCase()
    if (term && !`${event.titulo} ${event.detalhe} ${event.entidade} ${event.usuarioNome} ${event.categoria}`.toLowerCase().includes(term)) return false
    if (period === 'todos') return true
    const days = period === '7d' ? 7 : 30
    return daysSince(event.data) <= days
  })
  const filtered = alteracoes.filter((alteracao) => {
    if (field !== 'todos' && alteracao.campo !== field) return false
    const term = query.trim().toLowerCase()
    if (term && !`${alteracao.clienteNome} ${alteracao.usuarioNome} ${alteracao.campo} ${alteracao.valorAnterior} ${alteracao.valorNovo}`.toLowerCase().includes(term)) return false
    if (period === 'todos') return true
    const days = period === '7d' ? 7 : 30
    return daysSince(alteracao.criadoEm) <= days
  })
  const auditSummary = useMemo(() => {
    const sensitiveFields = ['whatsapp', 'whatsapp_principal', 'telefone', 'telefone_principal', 'vendedor_id', 'status_comercial', 'lead_qualificacao_status']
    const sensitive = filtered.filter((alteracao) => sensitiveFields.some((campo) => alteracao.campo.includes(campo))).length
    const byUser = new Map<string, number>()
    filtered.forEach((alteracao) => byUser.set(alteracao.usuarioNome, (byUser.get(alteracao.usuarioNome) ?? 0) + 1))
    const topUser = [...byUser.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      total: filtered.length,
      sensitive,
      clientes: new Set(filtered.map((alteracao) => alteracao.clienteNome)).size,
      topUser: topUser ? `${topUser[0]} (${topUser[1]})` : 'Sem registro',
      last: filteredEvents[0]?.data ? dateLabel(filteredEvents[0].data) : filtered[0]?.criadoEm ? dateLabel(filtered[0].criadoEm) : 'Sem registro',
      timeline: filteredEvents.length,
      critical: filteredEvents.filter((event) => event.severidade === 'critico').length,
    }
  }, [filtered, filteredEvents])

  return (
    <section className="grid-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Cobertura de auditoria</h2>
            <p>Controle operacional para saber se alteracoes criticas deixam rastro.</p>
          </div>
          <ShieldCheck size={18} />
        </div>
        <div className="permission-list">
          {auditCoverage.map((item) => (
            <div className="permission-row" key={item.label}>
              <CheckCircle2 size={16} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Atividade recente</h2>
            <p>Leitura rapida da movimentacao filtrada antes de abrir os detalhes.</p>
          </div>
          <Activity size={18} />
        </div>
        <div className="mini-metrics vertical">
          <Info label="Eventos filtrados" value={auditSummary.total.toString()} />
          <Info label="Linha do tempo" value={auditSummary.timeline.toString()} />
          <Info label="Campos sensiveis" value={auditSummary.sensitive.toString()} />
          <Info label="Clientes afetados" value={auditSummary.clientes.toString()} />
          <Info label="Ultima alteracao" value={auditSummary.last} />
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>Alteracoes sensiveis</h2>
            <p>Telefone, WhatsApp, responsavel, vendedor e status ficam registrados para LGPD e gestao.</p>
          </div>
          <div className="audit-toolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, usuario ou valor" />
            <select className="assign-select audit-filter" value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}>
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="todos">Tudo</option>
            </select>
            <select className="assign-select audit-filter" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
              <option value="todas">Todas areas</option>
              <option value="cliente">Cliente</option>
              <option value="orcamento">Orcamento</option>
              <option value="automacao">Automacao</option>
              <option value="saneamento">Saneamento</option>
            </select>
            <select className="assign-select audit-filter" value={field} onChange={(event) => setField(event.target.value)}>
              {fields.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="info-grid audit-summary">
          <Info label="Eventos filtrados" value={auditSummary.total.toString()} />
          <Info label="Campos sensiveis" value={auditSummary.sensitive.toString()} />
          <Info label="Clientes afetados" value={auditSummary.clientes.toString()} />
          <Info label="Eventos criticos" value={auditSummary.critical.toString()} />
          <Info label="Usuario mais ativo" value={auditSummary.topUser} />
        </div>
        <div className="table audit-timeline-table">
          <div className="table-head audit-event">
            <span>Data</span>
            <span>Area</span>
            <span>Evento</span>
            <span>Entidade</span>
            <span>Usuario</span>
          </div>
          {filteredEvents.map((event) => (
            <div className={`table-row audit-event ${event.severidade}`} key={event.id}>
              <span>{dateLabel(event.data)}</span>
              <span className="status-pill">{auditCategoryLabel(event.categoria)}</span>
              <span><strong>{event.titulo}</strong><small>{event.detalhe}</small></span>
              <span>{event.entidade || 'Sistema'}</span>
              <span>{event.usuarioNome || 'Sistema'}</span>
            </div>
          ))}
          {filteredEvents.length === 0 && <div className="empty-state compact">Nenhum evento operacional encontrado para os filtros atuais.</div>}
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
          {filtered.length === 0 && <div className="empty-state">Nenhuma alteracao encontrada para os filtros atuais.</div>}
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
    { label: 'Criar propostas', description: 'Pode abrir e atualizar as proprias propostas.' },
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


