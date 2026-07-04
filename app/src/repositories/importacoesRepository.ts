import { importacoes as mockImportacoes } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Importacao } from '../types'

type ImportacaoRow = {
  id: string
  tipo: Importacao['tipo']
  arquivo_nome: string
  data_importacao: string
  total_linhas: number
  clientes_encontrados: number
  clientes_criados: number
  conflitos: number
  itens_criados: number
  itens_ignorados: number
  status: string
}

type DashboardResumoRow = {
  clientes_sem_vendedor?: number | null
}

export type ImportacaoPreviewInput = {
  tipo: Importacao['tipo']
  arquivoNome: string
  totalItens: number
  clientesEncontrados: number
  clientesCriados?: number
  conflitos?: number
}

export type ReferenceImportResult = {
  importacaoId: string
  clientes: number
  veiculos: number
  ordens: number
  vendas: { created: number; ignored: number; conflitos: number }
  servicos: { created: number; ignored: number; conflitos: number }
  catalogo?: {
    itens: number
    precos: number
    precosNovos?: number
    precosAlterados?: number
    precosInalterados?: number
  }
  postProcess?: {
    adiado?: boolean
    erro?: string
    code?: string
    clientes_atualizados?: number
    oportunidades_geradas?: number
    tarefas_followup?: FollowupAutomationResult
    patio_vinculos?: PatioVinculosResult
  }
  movimentosComVeiculo: number
  movimentosSemVeiculo: number
}

export type PatioVinculosResult = {
  importacao_id?: string | null
  data_inicio?: string
  data_fim?: string
  dry_run?: boolean
  candidatos_placa_km_data?: number
  atendimentos_seguros?: number
  atendimentos_atualizar?: number
  atendimentos_atualizados?: number
  itens_atualizados?: number
  veiculos_atualizados?: number
  conflitos_ambiguos?: number
  conflitos_registrados?: number
  auditorias_registradas?: number
}

export type FollowupAutomationResult = {
  orcamentos_vencidos_tarefas?: number
  campanhas_resposta_tarefas?: number
  tarefas_followup_total?: number
}

export type ImportacaoArquivoResumo = {
  id: string
  importacaoId: string
  tipo: string
  arquivoNome: string
  obrigatorio: boolean
  totalLinhas: number
  processadoEm?: string
}

export type ImportacaoQualidadeResumo = {
  ultimaImportacaoEm?: string
  ultimaImportacaoStatus?: Importacao['status']
  oportunidadesAtualizadoEm?: string
  oportunidadesTotal: number
  oportunidadesAtivas: number
  oportunidadesDesatualizadas: boolean
  clientesSemWhatsapp: number
  clientesSemVendedor: number
  clientesOrigemDesconhecida: number
  conflitosPendentes: number
  arquivosObrigatoriosOk: number
  arquivosObrigatoriosTotal: number
}

export type ImportacaoQualidadeIssue = {
  id: string
  tipo: 'cliente_sem_whatsapp' | 'cliente_sem_vendedor' | 'origem_desconhecida' | 'servico_sem_placa' | 'conflito_importacao'
  severidade: 'alta' | 'media' | 'baixa'
  titulo: string
  detalhe: string
  clienteId?: string
  clienteNome?: string
  acaoSugerida: string
}

export type ImportacaoSaneamentoRegistro = {
  issueId: string
  issueType: ImportacaoQualidadeIssue['tipo'] | string
  assignedTo?: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionNote?: string
  updatedAt?: string
}

type ImportacaoSaneamentoRow = {
  issue_id: string
  issue_type: string
  assigned_to: string | null
  resolved_at: string | null
  resolved_by: string | null
  resolution_note: string | null
  updated_at: string | null
}

export async function listImportacoes(limit = 100): Promise<Importacao[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockImportacoes

  const { data, error } = await supabase
    .from('importacoes')
    .select('*')
    .order('data_importacao', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data as ImportacaoRow[]).map(mapImportacao)
}

export async function createImportacaoPreview(input: ImportacaoPreviewInput): Promise<Importacao> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `imp-${Date.now()}`,
      tipo: input.tipo,
      arquivoNome: input.arquivoNome,
      dataImportacao: new Date().toISOString(),
      totalItens: input.totalItens,
      clientesEncontrados: input.clientesEncontrados,
      clientesCriados: input.clientesCriados ?? 0,
      conflitos: input.conflitos ?? 0,
      itensCriados: 0,
      itensIgnorados: 0,
      status: input.conflitos ? 'com-conflitos' : 'pendente',
    }
  }

  const { data, error } = await supabase
    .from('importacoes')
    .insert({
      tipo: input.tipo,
      arquivo_nome: input.arquivoNome,
      total_linhas: input.totalItens,
      clientes_encontrados: input.clientesEncontrados,
      clientes_criados: input.clientesCriados ?? 0,
      conflitos: input.conflitos ?? 0,
      status: input.conflitos ? 'com_conflitos' : 'pendente',
    })
    .select('*')
    .single()

  if (error) throw error

  return mapImportacao(data as ImportacaoRow)
}

export async function importReferenceFiles(files: FileList | File[]): Promise<ReferenceImportResult> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado para importacao real.')

  const formData = new FormData()
  Array.from(files).forEach((file) => formData.append('files', file))

  const { data, error } = await supabase.functions.invoke('import-reference-files', {
    body: formData,
  })

  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'Nao foi possivel importar os arquivos.')

  return data as ReferenceImportResult
}

export async function importCatalogPriceFiles(files: FileList | File[]): Promise<ReferenceImportResult> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado para importacao real.')

  const formData = new FormData()
  formData.append('mode', 'catalogo-precos')
  Array.from(files).forEach((file) => formData.append('files', file))

  const { data, error } = await supabase.functions.invoke('import-reference-files', {
    body: formData,
  })

  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'Nao foi possivel importar catalogo e precos.')

  return data as ReferenceImportResult
}

export async function finalizeImportacaoDiaria(): Promise<NonNullable<ReferenceImportResult['postProcess']>> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado para finalizar importacao.')

  const { data, error } = await supabase.rpc('finalizar_importacao_diaria')
  if (error) throw error
  return data as NonNullable<ReferenceImportResult['postProcess']>
}

export async function runFollowupAutomations(): Promise<FollowupAutomationResult> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado para automacoes de follow-up.')

  const { data, error } = await supabase.rpc('criar_tarefas_followup_automaticas')
  if (error) throw error
  return data as FollowupAutomationResult
}

export async function listImportacaoArquivos(): Promise<ImportacaoArquivoResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('importacao_arquivos')
    .select('id,importacao_id,tipo,arquivo_nome,obrigatorio,total_linhas,processado_em')
    .order('processado_em', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    importacaoId: row.importacao_id,
    tipo: row.tipo,
    arquivoNome: row.arquivo_nome,
    obrigatorio: row.obrigatorio,
    totalLinhas: row.total_linhas,
    processadoEm: row.processado_em ?? undefined,
  }))
}

export async function getImportacaoQualidadeResumo(): Promise<ImportacaoQualidadeResumo> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      clientesSemWhatsapp: 0,
      clientesSemVendedor: 0,
      clientesOrigemDesconhecida: 0,
      oportunidadesTotal: 0,
      oportunidadesAtivas: 0,
      oportunidadesDesatualizadas: false,
      conflitosPendentes: 0,
      arquivosObrigatoriosOk: 0,
      arquivosObrigatoriosTotal: 4,
    }
  }

  const [
    ultimaImportacao,
    semWhatsapp,
    semVendedor,
    origemDesconhecida,
    conflitosPendentes,
    arquivosObrigatorios,
    oportunidadesTotal,
    oportunidadesAtivas,
    oportunidadesAtualizacao,
  ] = await Promise.all([
    supabase
      .from('importacoes')
      .select('data_importacao,status')
      .order('data_importacao', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .is('excluido_em', null)
      .or('whatsapp_principal.is.null,whatsapp_principal.eq.'),
    supabase
      .from('vw_dashboard_resumo')
      .select('clientes_sem_vendedor')
      .maybeSingle(),
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .is('excluido_em', null)
      .eq('origem_base', 'desconhecida'),
    supabase
      .from('importacao_conflitos')
      .select('id', { count: 'exact', head: true })
      .eq('resolvido', false),
    supabase
      .from('importacao_arquivos')
      .select('tipo,obrigatorio,processado_em')
      .eq('obrigatorio', true)
      .order('processado_em', { ascending: false })
      .limit(20),
    supabase
      .from('oportunidades_cache')
      .select('cliente_id', { count: 'exact', head: true }),
    supabase
      .from('oportunidades_cache')
      .select('cliente_id', { count: 'exact', head: true })
      .eq('bloqueada', false)
      .eq('tarefa_existente', false),
    supabase
      .from('vw_oportunidades_resumo_cache')
      .select('gerado_em')
      .order('gerado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const errors = [
    ultimaImportacao.error,
    semWhatsapp.error,
    semVendedor.error,
    origemDesconhecida.error,
    conflitosPendentes.error,
    arquivosObrigatorios.error,
    oportunidadesTotal.error,
    oportunidadesAtivas.error,
    oportunidadesAtualizacao.error,
  ].filter(Boolean)
  if (errors.length > 0) throw errors[0]

  const requiredTypes = ['carrosatendidos', 'listaclientessistema', 'vendasprodutos', 'vendasservicos']
  const latestRequired = new Set(
    ((arquivosObrigatorios.data ?? []) as Array<{ tipo: string; processado_em: string | null }>)
      .filter((arquivo) => requiredTypes.includes(arquivo.tipo) && arquivo.processado_em)
      .map((arquivo) => arquivo.tipo),
  )
  const latest = ultimaImportacao.data as { data_importacao?: string; status?: string } | null
  const latestOportunidades = oportunidadesAtualizacao.data as { gerado_em?: string } | null
  const importacaoTime = latest?.data_importacao ? new Date(latest.data_importacao).getTime() : 0
  const oportunidadeTime = latestOportunidades?.gerado_em ? new Date(latestOportunidades.gerado_em).getTime() : 0

  return {
    ultimaImportacaoEm: latest?.data_importacao,
    ultimaImportacaoStatus: latest?.status === 'com_conflitos' ? 'com-conflitos' : latest?.status as Importacao['status'] | undefined,
    oportunidadesAtualizadoEm: latestOportunidades?.gerado_em,
    oportunidadesTotal: oportunidadesTotal.count ?? 0,
    oportunidadesAtivas: oportunidadesAtivas.count ?? 0,
    oportunidadesDesatualizadas: Boolean(importacaoTime && (!oportunidadeTime || oportunidadeTime < importacaoTime)),
    clientesSemWhatsapp: semWhatsapp.count ?? 0,
    clientesSemVendedor: Number((semVendedor.data as DashboardResumoRow | null)?.clientes_sem_vendedor ?? 0),
    clientesOrigemDesconhecida: origemDesconhecida.count ?? 0,
    conflitosPendentes: conflitosPendentes.count ?? 0,
    arquivosObrigatoriosOk: latestRequired.size,
    arquivosObrigatoriosTotal: requiredTypes.length,
  }
}

export async function listImportacaoQualidadeIssues(limit = 40): Promise<ImportacaoQualidadeIssue[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const perGroup = Math.max(5, Math.ceil(limit / 5))
  const [
    semWhatsapp,
    semVendedor,
    origemDesconhecida,
    servicosSemPlaca,
    conflitos,
  ] = await Promise.all([
    supabase
      .from('clientes')
      .select('id,nome,cidade,uf')
      .is('excluido_em', null)
      .or('whatsapp_principal.is.null,whatsapp_principal.eq.')
      .order('ultima_compra_em', { ascending: false, nullsFirst: false })
      .limit(perGroup),
    supabase
      .from('clientes')
      .select('id,nome,cidade,uf')
      .is('excluido_em', null)
      .is('vendedor_id', null)
      .limit(perGroup),
    supabase
      .from('clientes')
      .select('id,nome,cidade,uf,origem')
      .is('excluido_em', null)
      .eq('origem_base', 'desconhecida')
      .order('total_comprado', { ascending: false })
      .limit(perGroup),
    Promise.resolve({ data: [], error: null }),
    supabase
      .from('importacao_conflitos')
      .select('id,tipo_conflito,dados_recebidos')
      .eq('resolvido', false)
      .limit(perGroup),
  ])

  const firstError = [semWhatsapp.error, semVendedor.error, origemDesconhecida.error, servicosSemPlaca.error, conflitos.error].find(Boolean)
  if (firstError) throw firstError

  const issues: ImportacaoQualidadeIssue[] = []
  ;((semWhatsapp.data ?? []) as Array<{ id: string; nome: string; cidade?: string | null; uf?: string | null }>).forEach((row) => {
    issues.push({
      id: `sem-whatsapp-${row.id}`,
      tipo: 'cliente_sem_whatsapp',
      severidade: 'alta',
      titulo: 'Cliente sem WhatsApp',
      detalhe: `${row.nome}${localLabel(row.cidade, row.uf)} precisa de contato valido para campanhas e propostas.`,
      clienteId: row.id,
      clienteNome: row.nome,
      acaoSugerida: 'Completar contato na ficha do cliente.',
    })
  })

  ;((semVendedor.data ?? []) as Array<{ id: string; nome: string; cidade?: string | null; uf?: string | null }>).forEach((row) => {
    issues.push({
      id: `sem-vendedor-${row.id}`,
      tipo: 'cliente_sem_vendedor',
      severidade: 'alta',
      titulo: 'Cliente sem vendedor',
      detalhe: `${row.nome}${localLabel(row.cidade, row.uf)} nao entra em carteira nem metas ate receber responsavel.`,
      clienteId: row.id,
      clienteNome: row.nome,
      acaoSugerida: 'Atribuir vendedor em Clientes ou Vendedores.',
    })
  })

  ;((origemDesconhecida.data ?? []) as Array<{ id: string; nome: string; cidade?: string | null; uf?: string | null; origem?: string | null }>).forEach((row) => {
    issues.push({
      id: `origem-${row.id}`,
      tipo: 'origem_desconhecida',
      severidade: 'media',
      titulo: 'Origem sem classificacao',
      detalhe: `${row.nome}${localLabel(row.cidade, row.uf)} esta como origem desconhecida${row.origem ? ` (${row.origem})` : ''}.`,
      clienteId: row.id,
      clienteNome: row.nome,
      acaoSugerida: 'Classificar como base propria ou lista externa.',
    })
  })

  ;((servicosSemPlaca.data ?? []) as Array<{ id: string; cliente_id?: string | null; servico_nome: string; data_servico?: string | null; clientes?: { nome?: string | null } | null }>).forEach((row) => {
    issues.push({
      id: `servico-sem-placa-${row.id}`,
      tipo: 'servico_sem_placa',
      severidade: 'media',
      titulo: 'Servico sem placa vinculada',
      detalhe: `${row.servico_nome} em ${row.data_servico ?? 'data nao informada'} ficou sem veiculo estruturado.`,
      clienteId: row.cliente_id ?? undefined,
      clienteNome: row.clientes?.nome ?? undefined,
      acaoSugerida: 'Revisar extracao de placa/KM nos arquivos de servico.',
    })
  })

  ;((conflitos.data ?? []) as Array<{ id: string; tipo_conflito?: string | null; dados_recebidos?: Record<string, unknown> | null }>).forEach((row) => {
    const cliente = typeof row.dados_recebidos?.clienteNome === 'string' ? row.dados_recebidos.clienteNome : undefined
    issues.push({
      id: `conflito-${row.id}`,
      tipo: 'conflito_importacao',
      severidade: 'alta',
      titulo: 'Conflito de importacao pendente',
      detalhe: `${row.tipo_conflito ?? 'Conflito'}${cliente ? ` - ${cliente}` : ''}.`,
      acaoSugerida: 'Resolver em Conflitos antes da proxima importacao.',
    })
  })

  return issues
    .sort((a, b) => severityWeight(b.severidade) - severityWeight(a.severidade))
    .slice(0, limit)
}

export async function listImportacaoSaneamentoRegistros(): Promise<ImportacaoSaneamentoRegistro[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('importacao_saneamento_resolucoes')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) {
    if (error.code === '42P01') return []
    throw error
  }

  return ((data ?? []) as ImportacaoSaneamentoRow[]).map(mapImportacaoSaneamentoRegistro)
}

export async function upsertImportacaoSaneamentoRegistro(input: {
  issueId: string
  issueType: ImportacaoQualidadeIssue['tipo'] | string
  assignedTo?: string
  resolvedBy?: string
  resolutionNote?: string
  resolved?: boolean
}): Promise<ImportacaoSaneamentoRegistro> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      issueId: input.issueId,
      issueType: input.issueType,
      assignedTo: input.assignedTo || undefined,
      resolvedAt: input.resolved ? new Date().toISOString() : undefined,
      resolvedBy: input.resolvedBy,
      resolutionNote: input.resolutionNote,
      updatedAt: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('importacao_saneamento_resolucoes')
    .upsert({
      issue_id: input.issueId,
      issue_type: input.issueType,
      assigned_to: input.assignedTo || null,
      resolved_at: input.resolved ? new Date().toISOString() : null,
      resolved_by: input.resolved ? input.resolvedBy ?? null : null,
      resolution_note: input.resolutionNote ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'issue_id' })
    .select('*')
    .single()

  if (error) throw error
  return mapImportacaoSaneamentoRegistro(data as ImportacaoSaneamentoRow)
}

function localLabel(cidade?: string | null, uf?: string | null) {
  const local = [cidade, uf].filter(Boolean).join('/')
  return local ? ` (${local})` : ''
}

function severityWeight(severidade: ImportacaoQualidadeIssue['severidade']) {
  if (severidade === 'alta') return 3
  if (severidade === 'media') return 2
  return 1
}

function mapImportacaoSaneamentoRegistro(row: ImportacaoSaneamentoRow): ImportacaoSaneamentoRegistro {
  return {
    issueId: row.issue_id,
    issueType: row.issue_type,
    assignedTo: row.assigned_to ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    resolutionNote: row.resolution_note ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  }
}

function mapImportacao(row: ImportacaoRow): Importacao {
  return {
    id: row.id,
    tipo: row.tipo,
    arquivoNome: row.arquivo_nome,
    dataImportacao: row.data_importacao,
    totalItens: row.total_linhas || row.itens_criados,
    clientesEncontrados: row.clientes_encontrados,
    clientesCriados: row.clientes_criados,
    conflitos: row.conflitos,
    itensCriados: row.itens_criados,
    itensIgnorados: row.itens_ignorados,
    status: row.status === 'com_conflitos' ? 'com-conflitos' : (row.status as Importacao['status']),
  }
}
