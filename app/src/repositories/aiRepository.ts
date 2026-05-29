import { getSupabase } from '../lib/supabase'

export type WhatsAppContactAnalysis = {
  reason: string
  result: string
  temperature: string
  summary: string
  nextAction: string
  nextActionDays: number
  negotiationStatus: string
  detectedProducts: string[]
  detectedVehicles: string[]
  objections: string[]
  paymentTerms: string[]
  confidence: number
}

export async function analyzeWhatsAppContact(input: {
  conversation: string
  clienteNome: string
}): Promise<WhatsAppContactAnalysis> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado para analisar com IA.')

  const { data, error } = await supabase.functions.invoke('analyze-whatsapp-contact', {
    body: input,
  })

  if (error) throw error
  if (!data?.ok || !data.analysis) throw new Error(data?.error ?? 'Nao foi possivel analisar a conversa com IA.')
  return data.analysis as WhatsAppContactAnalysis
}
