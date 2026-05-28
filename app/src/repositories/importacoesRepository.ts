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

export async function listImportacoes(): Promise<Importacao[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockImportacoes

  const { data, error } = await supabase
    .from('importacoes')
    .select('*')
    .order('data_importacao', { ascending: false })

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
