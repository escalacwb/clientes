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
  clientes?: { nome: string } | null
  users?: { nome: string } | null
}

export async function listTarefas(): Promise<Tarefa[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockTarefas

  const { data, error } = await supabase
    .from('tarefas')
    .select('*, clientes(nome), users(nome)')
    .order('status', { ascending: true })
    .order('data_vencimento', { ascending: true })

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
    .select('*, clientes(nome), users(nome)')
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

function mapTarefa(row: TarefaRow): Tarefa {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? 'Cliente',
    vendedorId: row.vendedor_id ?? undefined,
    vendedorNome: row.users?.nome ?? undefined,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    dataVencimento: row.data_vencimento,
    status: row.status,
    prioridade: row.prioridade,
    origem: row.origem ?? 'app',
    concluidaEm: row.concluida_em ?? undefined,
  }
}
