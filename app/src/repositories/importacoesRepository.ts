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
  movimentosComVeiculo: number
  movimentosSemVeiculo: number
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
    status: row.status === 'com_conflitos' ? 'com-conflitos' : (row.status as Importacao['status']),
  }
}
