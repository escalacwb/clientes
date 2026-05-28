import { getSupabase } from '../lib/supabase'
import type { CampanhaEnvio, CampanhaEnvioStatus } from '../types'

type CampanhaEnvioRow = {
  id: string
  campanha_id: string
  cliente_id: string
  vendedor_id: string | null
  telefone: string | null
  mensagem_final: string
  status: CampanhaEnvioStatus
  data_abertura_whatsapp: string | null
  data_marcado_enviado: string | null
  resposta_cliente: string | null
  virou_orcamento: boolean
  virou_venda: boolean
}

export async function upsertCampanhaEnvio(input: {
  campanhaId: string
  campanhaNome?: string
  clienteId: string
  vendedorId?: string
  telefone?: string
  mensagemFinal: string
  status: CampanhaEnvioStatus
}): Promise<CampanhaEnvio> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `envio-${input.campanhaId}-${input.clienteId}`,
      campanhaId: input.campanhaId,
      clienteId: input.clienteId,
      vendedorId: input.vendedorId,
      telefone: input.telefone,
      mensagemFinal: input.mensagemFinal,
      status: input.status,
      dataAberturaWhatsapp: input.status === 'pendente' ? new Date().toISOString() : undefined,
      dataMarcadoEnviado: input.status !== 'pendente' ? new Date().toISOString() : undefined,
      virouOrcamento: input.status === 'virou_orcamento',
      virouVenda: false,
    }
  }

  const campanhaId = await ensureCampanha(supabase, input.campanhaId, input.campanhaNome ?? input.campanhaId, input.mensagemFinal)

  const { data, error } = await supabase
    .from('campanha_envios')
    .upsert(
      {
        campanha_id: campanhaId,
        cliente_id: input.clienteId,
        vendedor_id: input.vendedorId ?? null,
        telefone: input.telefone ?? null,
        mensagem_final: input.mensagemFinal,
        status: input.status,
        data_abertura_whatsapp: input.status === 'pendente' ? new Date().toISOString() : undefined,
        data_marcado_enviado: input.status !== 'pendente' ? new Date().toISOString() : undefined,
        virou_orcamento: input.status === 'virou_orcamento',
      },
      { onConflict: 'campanha_id,cliente_id' },
    )
    .select('*')
    .single()

  if (error) throw error

  return mapEnvio(data as CampanhaEnvioRow)
}

async function ensureCampanha(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabase>>>,
  externalId: string,
  nome: string,
  mensagemModelo: string,
) {
  if (isUuid(externalId)) return externalId

  const { data: existing, error: selectError } = await supabase
    .from('campanhas')
    .select('id')
    .eq('nome', nome)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing?.id) return existing.id as string

  const { data, error } = await supabase
    .from('campanhas')
    .insert({
      nome,
      descricao: 'Campanha criada pelo app web',
      mensagem_modelo: mensagemModelo,
      filtro_usado: { origem: externalId },
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function mapEnvio(row: CampanhaEnvioRow): CampanhaEnvio {
  return {
    id: row.id,
    campanhaId: row.campanha_id,
    clienteId: row.cliente_id,
    vendedorId: row.vendedor_id ?? undefined,
    telefone: row.telefone ?? undefined,
    mensagemFinal: row.mensagem_final,
    status: row.status,
    dataAberturaWhatsapp: row.data_abertura_whatsapp ?? undefined,
    dataMarcadoEnviado: row.data_marcado_enviado ?? undefined,
    respostaCliente: row.resposta_cliente ?? undefined,
    virouOrcamento: row.virou_orcamento,
    virouVenda: row.virou_venda,
  }
}
