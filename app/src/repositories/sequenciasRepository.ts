import { getSupabase } from '../lib/supabase'

type SequenciaRow = {
  id: string
  nome: string
}

type SequenciaExecucaoEstagnadaRow = {
  id: string
  cliente_id: string
  vendedor_id: string | null
  etapa_atual: number | null
  proxima_acao_em: string | null
}

const defaultSequenceCode = 'whatsapp-retorno-comercial-0-2-7-15'

export async function startDefaultCommercialSequence(clienteIds: string[], vendedorId?: string): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase || clienteIds.length === 0) return 0

  const sequence = await ensureDefaultSequence()
  const rows = [...new Set(clienteIds)].map((clienteId) => ({
    sequencia_id: sequence.id,
    cliente_id: clienteId,
    vendedor_id: vendedorId ?? null,
    status: 'ativa',
    etapa_atual: 1,
    proxima_acao_em: new Date().toISOString().slice(0, 10),
  }))

  const { data, error } = await supabase
    .from('sequencia_execucoes')
    .upsert(rows, { onConflict: 'sequencia_id,cliente_id', ignoreDuplicates: true })
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

export async function pauseActiveSequencesForClient(clienteId: string, motivo: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('sequencia_execucoes')
    .update({
      status: 'pausada',
      motivo_encerramento: motivo,
      encerrada_em: new Date().toISOString(),
    })
    .eq('cliente_id', clienteId)
    .eq('status', 'ativa')

  if (error) throw error

  await supabase.from('automacao_logs').insert({
    regra_codigo: 'pausar-sequencia-cliente',
    entidade_tipo: 'cliente',
    entidade_id: clienteId,
    resultado: motivo,
  })
}

export async function escalateStaleCommercialSequences(limit = 50): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase) return 0

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sequencia_execucoes')
    .select('id,cliente_id,vendedor_id,etapa_atual,proxima_acao_em')
    .eq('status', 'ativa')
    .gte('etapa_atual', 4)
    .lte('proxima_acao_em', today)
    .order('proxima_acao_em', { ascending: true })
    .limit(limit)

  if (error) throw error
  const rows = (data ?? []) as SequenciaExecucaoEstagnadaRow[]
  if (rows.length === 0) return 0

  const origins = rows.map((row) => `sequencia:estagnada:${row.id}`)
  const { data: existing, error: existingError } = await supabase
    .from('tarefas')
    .select('origem')
    .in('origem', origins)
    .eq('status', 'aberta')

  if (existingError) throw existingError
  const existingOrigins = new Set((existing ?? []).map((row) => row.origem as string))
  const taskRows = rows
    .filter((row) => !existingOrigins.has(`sequencia:estagnada:${row.id}`))
    .map((row) => ({
      cliente_id: row.cliente_id,
      vendedor_id: row.vendedor_id,
      titulo: 'Sequencia comercial estagnada',
      descricao: 'Cadencia 0/2/7/15 chegou ao encerramento sem conversao. Gerente deve decidir: nova abordagem, oportunidade, campanha futura ou descartar.',
      data_vencimento: today,
      status: 'aberta',
      prioridade: 88,
      origem: `sequencia:estagnada:${row.id}`,
    }))

  if (taskRows.length > 0) {
    const { error: taskError } = await supabase.from('tarefas').insert(taskRows)
    if (taskError) throw taskError
  }

  const executionIds = rows.map((row) => row.id)
  const { error: updateError } = await supabase
    .from('sequencia_execucoes')
    .update({
      status: 'pausada',
      motivo_encerramento: 'Escalada para tarefa gerencial por estagnacao.',
      encerrada_em: new Date().toISOString(),
    })
    .in('id', executionIds)

  if (updateError) throw updateError

  await supabase.from('automacao_logs').insert({
    regra_codigo: 'sequencia-estagnada-gerente',
    entidade_tipo: 'sequencia_execucoes',
    entidade_id: executionIds.join(','),
    resultado: `${taskRows.length} tarefas gerenciais criadas; ${rows.length} sequencias pausadas.`,
  })

  return taskRows.length
}

async function ensureDefaultSequence(): Promise<SequenciaRow> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data: existing, error: selectError } = await supabase
    .from('sequencias_comerciais')
    .select('id,nome')
    .eq('codigo', defaultSequenceCode)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return existing as SequenciaRow

  const { data: created, error: createError } = await supabase
    .from('sequencias_comerciais')
    .insert({
      codigo: defaultSequenceCode,
      nome: 'WhatsApp comercial 0/2/7/15',
      descricao: 'Cadencia manual para primeiro contato, retorno, nova tentativa e encerramento assistido.',
      status: 'ativa',
    })
    .select('id,nome')
    .single()

  if (createError) throw createError

  const sequence = created as SequenciaRow
  const { error: stepsError } = await supabase
    .from('sequencia_etapas')
    .insert([
      {
        sequencia_id: sequence.id,
        ordem: 1,
        dias_apos_inicio: 0,
        titulo: 'Primeiro contato',
        mensagem: 'Primeira abordagem pelo WhatsApp com contexto comercial do cliente.',
      },
      {
        sequencia_id: sequence.id,
        ordem: 2,
        dias_apos_inicio: 2,
        titulo: 'Retorno curto',
        mensagem: 'Follow-up objetivo para saber se o cliente conseguiu avaliar.',
      },
      {
        sequencia_id: sequence.id,
        ordem: 3,
        dias_apos_inicio: 7,
        titulo: 'Nova tentativa',
        mensagem: 'Retomar com alternativa de produto, servico ou prazo.',
      },
      {
        sequencia_id: sequence.id,
        ordem: 4,
        dias_apos_inicio: 15,
        titulo: 'Encerrar ou escalar',
        mensagem: 'Encerrar cadencia ou criar tarefa para gerente se houver potencial.',
      },
    ])

  if (stepsError) throw stepsError
  return sequence
}
