import { mesclagens as mockMesclagens, possiveisDuplicados as mockPossiveisDuplicados } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { ClienteMesclagem, PossivelDuplicado } from '../types'

type MesclagemRow = {
  id: string
  cliente_principal_id: string
  cliente_mesclado_id: string
  motivo: string | null
  dados_movidos: unknown
  criado_em: string
  principal?: { nome: string } | null
  mesclado?: { nome: string } | null
  usuario?: { nome: string } | null
}

const MESCLAGEM_SELECT = '*, principal:clientes!cliente_principal_id(nome), mesclado:clientes!cliente_mesclado_id(nome), usuario:users!cliente_mesclagens_usuario_id_fkey(nome)'

export async function listPossiveisDuplicados(): Promise<PossivelDuplicado[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockPossiveisDuplicados

  const { data, error } = await supabase
    .from('importacao_conflitos')
    .select('id,tipo_conflito,dados_recebidos,possiveis_clientes')
    .eq('resolvido', false)
    .limit(50)

  if (error) throw error

  return data.map((row, index) => ({
    id: row.id,
    clienteAId: `conflito-${index}-a`,
    clienteANome: JSON.stringify(row.dados_recebidos),
    clienteBId: `conflito-${index}-b`,
    clienteBNome: Array.isArray(row.possiveis_clientes) ? row.possiveis_clientes.map(String).join(', ') : 'Possivel cliente',
    motivo: row.tipo_conflito,
    confianca: 60,
  }))
}

export async function listMesclagens(): Promise<ClienteMesclagem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockMesclagens

  const { data, error } = await supabase
    .from('cliente_mesclagens')
    .select(MESCLAGEM_SELECT)
    .order('criado_em', { ascending: false })

  if (error) throw error

  return (data as MesclagemRow[]).map(mapMesclagem)
}

export async function createMesclagem(input: {
  clientePrincipalId: string
  clientePrincipalNome: string
  clienteMescladoId: string
  clienteMescladoNome: string
  motivo: string
}): Promise<ClienteMesclagem> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `merge-${Date.now()}`,
      usuarioNome: 'Usuario local',
      dadosMovidos: ['vendas', 'servicos', 'interacoes', 'orcamentos', 'campanhas'],
      criadoEm: new Date().toISOString(),
      ...input,
    }
  }

  const { error: rpcError } = await supabase.rpc('mesclar_clientes', {
    cliente_principal: input.clientePrincipalId,
    cliente_mesclado: input.clienteMescladoId,
    motivo_mesclagem: input.motivo,
  })

  if (rpcError) throw rpcError

  const { data, error } = await supabase
    .from('cliente_mesclagens')
    .select(MESCLAGEM_SELECT)
    .eq('cliente_principal_id', input.clientePrincipalId)
    .eq('cliente_mesclado_id', input.clienteMescladoId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error

  return mapMesclagem(data as MesclagemRow)
}

function mapMesclagem(row: MesclagemRow): ClienteMesclagem {
  const dadosMovidos = Array.isArray(row.dados_movidos) ? row.dados_movidos.map(String) : []

  return {
    id: row.id,
    clientePrincipalId: row.cliente_principal_id,
    clientePrincipalNome: row.principal?.nome ?? 'Cliente principal',
    clienteMescladoId: row.cliente_mesclado_id,
    clienteMescladoNome: row.mesclado?.nome ?? 'Cliente mesclado',
    usuarioNome: row.usuario?.nome ?? 'Sistema',
    motivo: row.motivo ?? '',
    dadosMovidos,
    criadoEm: row.criado_em,
  }
}
