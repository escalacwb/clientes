import { getSupabase } from '../lib/supabase'

type SequenciaRow = {
  id: string
  nome: string
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
