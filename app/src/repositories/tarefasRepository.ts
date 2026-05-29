import { clientes as mockClientes, tarefas as mockTarefas, vendedores as mockVendedores } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Tarefa, TarefaInput } from '../types'

type TarefaRow = {
  id: string
  cliente_id: string
  vendedor_id: string | null
  titulo: string
  descricao: string | null
  data_vencimento: string
  status: Tarefa['status']
  prioridade: number
  origem: string | null
  concluida_em: string | null
  reagendada_em: string | null
  reagendamento_motivo: string | null
  clientes?: { nome: string } | null
  vendedor?: { nome: string } | null
}

const TAREFA_SELECT = '*, clientes(nome), vendedor:users!tarefas_vendedor_id_fkey(nome)'

export type TarefaStatusFilter = 'abertas' | 'vencidas' | 'concluidas'

export type TarefaOriginFilter =
  | 'todas'
  | 'manual'
  | 'atendimento'
  | 'cliente360'
  | 'interacao'
  | 'orcamento'
  | 'importacao'
  | 'campanha'
  | 'oportunidade'
  | 'rodobens'

export async function listTarefas(limit = 100): Promise<Tarefa[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockTarefas

  const { data, error } = await supabase
    .from('tarefas')
    .select(TAREFA_SELECT)
    .order('status', { ascending: true })
    .order('data_vencimento', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (data as TarefaRow[]).map(mapTarefa)
}

export async function listTarefasPage(input: {
  page: number
  pageSize: number
  status: TarefaStatusFilter
  origem: TarefaOriginFilter
  vendedorId?: string
}): Promise<{ tarefas: Tarefa[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) {
    const filtered = filterMockTarefas(mockTarefas, input.status, input.origem, input.vendedorId)
    const from = (input.page - 1) * input.pageSize
    return {
      tarefas: filtered.slice(from, from + input.pageSize),
      total: filtered.length,
    }
  }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('tarefas')
    .select(TAREFA_SELECT, { count: 'exact' })
    .order('data_vencimento', { ascending: true })
    .order('prioridade', { ascending: false })
    .range(from, to)

  if (input.status === 'concluidas') {
    query = query.eq('status', 'concluida')
  } else {
    query = query.eq('status', 'aberta')
    if (input.status === 'vencidas') query = query.lt('data_vencimento', new Date().toISOString().slice(0, 10))
  }

  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)
  if (input.origem !== 'todas') {
    query = ['orcamento', 'oportunidade', 'rodobens', 'atendimento', 'cliente360', 'campanha'].includes(input.origem)
      ? query.ilike('origem', `${input.origem}%`)
      : query.eq('origem', input.origem)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    tarefas: (data as TarefaRow[]).map(mapTarefa),
    total: count ?? data?.length ?? 0,
  }
}

export async function listClienteTarefas(clienteId: string, limit = 50): Promise<Tarefa[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockTarefas.filter((tarefa) => tarefa.clienteId === clienteId)

  const { data, error } = await supabase
    .from('tarefas')
    .select(TAREFA_SELECT)
    .eq('cliente_id', clienteId)
    .order('status', { ascending: true })
    .order('data_vencimento', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data as TarefaRow[]).map(mapTarefa)
}

export async function createTarefa(input: TarefaInput): Promise<Tarefa> {
  const supabase = await getSupabase()
  if (!supabase) {
    const cliente = mockClientes.find((item) => item.id === input.clienteId)
    const vendedor = mockVendedores.find((item) => item.id === input.vendedorId)
    return {
      id: `task-${Date.now()}`,
      clienteNome: cliente?.nome ?? 'Cliente',
      vendedorNome: vendedor?.nome,
      status: input.status ?? 'aberta',
      ...input,
    }
  }

  const { data, error } = await supabase
    .from('tarefas')
    .insert({
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId ?? null,
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      data_vencimento: input.dataVencimento,
      status: input.status ?? 'aberta',
      prioridade: input.prioridade,
      origem: input.origem,
    })
    .select(TAREFA_SELECT)
    .single()

  if (error) throw error

  return mapTarefa(data as TarefaRow)
}

export async function completeTarefa(id: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('tarefas')
    .update({ status: 'concluida', concluida_em: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function rescheduleTarefa(id: string, dataVencimento: string, motivo: string): Promise<Tarefa> {
  const supabase = await getSupabase()
  if (!supabase) {
    const tarefa = mockTarefas.find((item) => item.id === id)
    if (!tarefa) throw new Error('Tarefa nao encontrada.')
    return {
      ...tarefa,
      dataVencimento,
      reagendadaEm: new Date().toISOString(),
      reagendamentoMotivo: motivo,
    }
  }

  const { data, error } = await supabase
    .from('tarefas')
    .update({
      data_vencimento: dataVencimento,
      reagendada_em: new Date().toISOString(),
      reagendamento_motivo: motivo,
    })
    .eq('id', id)
    .select(TAREFA_SELECT)
    .single()

  if (error) throw error
  return mapTarefa(data as TarefaRow)
}

function mapTarefa(row: TarefaRow): Tarefa {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? 'Cliente',
    vendedorId: row.vendedor_id ?? undefined,
    vendedorNome: row.vendedor?.nome ?? undefined,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    dataVencimento: row.data_vencimento,
    status: row.status,
    prioridade: row.prioridade,
    origem: row.origem ?? 'app',
    concluidaEm: row.concluida_em ?? undefined,
    reagendadaEm: row.reagendada_em ?? undefined,
    reagendamentoMotivo: row.reagendamento_motivo ?? undefined,
  }
}

function filterMockTarefas(
  tarefas: Tarefa[],
  status: TarefaStatusFilter,
  origem: TarefaOriginFilter,
  vendedorId?: string,
) {
  return tarefas
    .filter((tarefa) => {
      if (vendedorId && tarefa.vendedorId !== vendedorId) return false
      if (status === 'concluidas') return tarefa.status === 'concluida'
      if (status === 'vencidas') return tarefa.status === 'aberta' && new Date(tarefa.dataVencimento) < new Date()
      return tarefa.status === 'aberta'
    })
    .filter((tarefa) => {
      if (origem === 'todas') return true
      if (['orcamento', 'oportunidade', 'rodobens', 'atendimento', 'cliente360', 'campanha'].includes(origem)) return tarefa.origem.startsWith(origem)
      return tarefa.origem === origem
    })
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento) || b.prioridade - a.prioridade)
}
