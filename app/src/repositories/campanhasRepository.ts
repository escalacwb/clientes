import { getSupabase } from '../lib/supabase'
import { listClientesPage } from './clientesRepository'
import type { CampanhaEnvio, CampanhaEnvioStatus, CarteiraFiltro, Cliente } from '../types'

export type CampanhaSegmentoId = 'inativos-90' | 'rodobens-pendentes' | 'sem-contato-60' | 'sem-whatsapp'

export type CampanhaSegmento = {
  id: CampanhaSegmentoId
  nome: string
  descricao: string
  campanhaNome: string
  campanhaId: string
  filtro?: CarteiraFiltro
  template: string
}

export type CampanhaPublicoFiltros = {
  cidade?: string
  uf?: string
  vendedorId?: string
  produtoTerm?: string
}

export type CampanhaFiltroUsado = {
  segmentoId: CampanhaSegmentoId
  filtros?: CampanhaPublicoFiltros
  query?: string
}

export type CampanhaSalva = {
  id: string
  nome: string
  descricao?: string
  mensagemModelo: string
  filtroUsado: CampanhaFiltroUsado
  criadaEm: string
}

export type CampanhaResumo = {
  campanhaId: string
  nome: string
  criadaEm: string
  total: number
  pendentes: number
  enviados: number
  responderam: number
  semResposta: number
  viraramOrcamento: number
  viraramVenda: number
  perdidos: number
  naoContatar: number
  receitaAtribuida: number
}

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
  orcamento_id: string | null
  receita_atribuida: number | null
}

type CampanhaRow = {
  id: string
  nome: string
  descricao: string | null
  mensagem_modelo: string
  filtro_usado: CampanhaFiltroUsado | null
  criada_em: string
  campanha_envios?: Array<{
    status: CampanhaEnvioStatus | string | null
    virou_orcamento: boolean | null
    virou_venda: boolean | null
    receita_atribuida: number | null
  }>
}

export const campanhaSegmentos: CampanhaSegmento[] = [
  {
    id: 'inativos-90',
    nome: 'Reativacao 90 dias',
    descricao: 'Clientes sem compra recente para cotacao ativa de pneus e servicos.',
    campanhaNome: 'Clientes sem compra ha 90 dias',
    campanhaId: 'campanha-inativos-90',
    filtro: 'sem-compra-90',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Vi que faz um tempo desde sua ultima compra e estou passando para ver se precisa cotar pneus ou algum servico.',
  },
  {
    id: 'rodobens-pendentes',
    nome: 'Primeiro contato Rodobens',
    descricao: 'Leads vindos da Rodobens para qualificacao antes de entrar na carteira Capital.',
    campanhaNome: 'Rodobens - primeiro contato',
    campanhaId: 'campanha-rodobens-primeiro-contato',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Estou entrando em contato para entender sua frota e ver como podemos ajudar com pneus e servicos.',
  },
  {
    id: 'sem-contato-60',
    nome: 'Sem contato 60 dias',
    descricao: 'Clientes sem interacao recente para recuperar relacionamento comercial.',
    campanhaNome: 'Clientes sem contato ha 60 dias',
    campanhaId: 'campanha-sem-contato-60',
    filtro: 'sem-contato-60',
    template:
      'Bom dia, {primeiro_nome}. Aqui e {nome_vendedor}, da Capital Truck Center. Faz um tempo que nao falamos e queria saber se precisa de algum apoio com pneus ou servicos.',
  },
  {
    id: 'sem-whatsapp',
    nome: 'Higiene de cadastro',
    descricao: 'Clientes sem WhatsApp cadastrado para correcao antes de novas campanhas.',
    campanhaNome: 'Clientes sem WhatsApp',
    campanhaId: 'campanha-sem-whatsapp',
    filtro: 'sem-whatsapp',
    template:
      'Atualizar cadastro de {primeiro_nome}: cliente sem WhatsApp principal no CRM.',
  },
]

export async function listCampanhaSegmento(input: {
  segmentoId: CampanhaSegmentoId
  page: number
  pageSize: number
  query?: string
  filtros?: CampanhaPublicoFiltros
  campanhaId?: string
  campanhaNome?: string
}): Promise<{ clientes: Cliente[]; total: number; statuses: Record<string, CampanhaEnvioStatus> }> {
  const segmento = campanhaSegmentos.find((item) => item.id === input.segmentoId) ?? campanhaSegmentos[0]
  const clienteIds = input.filtros?.produtoTerm?.trim()
    ? await findClientesByProdutoOuServico(input.filtros.produtoTerm)
    : undefined
  const result =
    segmento.id === 'rodobens-pendentes'
      ? await listClientesPage({
          page: input.page,
          pageSize: input.pageSize,
          query: input.query,
          origemBase: 'rodobens',
          cidade: input.filtros?.cidade,
          uf: input.filtros?.uf,
          vendedorId: input.filtros?.vendedorId,
          clienteIds,
        })
      : await listClientesPage({
          page: input.page,
          pageSize: input.pageSize,
          query: input.query,
          filtro: segmento.filtro,
          cidade: input.filtros?.cidade,
          uf: input.filtros?.uf,
          vendedorId: input.filtros?.vendedorId,
          clienteIds,
        })

  return {
    ...result,
    statuses: input.campanhaId
      ? await listCampanhaStatusesById(input.campanhaId, result.clientes.map((cliente) => cliente.id))
      : await listCampanhaStatuses(input.campanhaNome ?? segmento.campanhaNome, result.clientes.map((cliente) => cliente.id)),
  }
}

export async function listCampanhasSalvas(): Promise<CampanhaSalva[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campanhas')
    .select('id,nome,descricao,mensagem_modelo,filtro_usado,criada_em')
    .order('criada_em', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? [])
    .map(mapCampanha)
    .filter((campanha) => Boolean(campanha.filtroUsado.segmentoId))
}

export async function createCampanhaSalva(input: {
  nome: string
  descricao?: string
  mensagemModelo: string
  filtroUsado: CampanhaFiltroUsado
  criadaPor?: string
}): Promise<CampanhaSalva> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `campanha-${Date.now()}`,
      nome: input.nome,
      descricao: input.descricao,
      mensagemModelo: input.mensagemModelo,
      filtroUsado: input.filtroUsado,
      criadaEm: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('campanhas')
    .insert({
      nome: input.nome,
      descricao: input.descricao ?? 'Campanha salva pelo app web',
      mensagem_modelo: input.mensagemModelo,
      filtro_usado: input.filtroUsado,
      criada_por: input.criadaPor ?? null,
    })
    .select('id,nome,descricao,mensagem_modelo,filtro_usado,criada_em')
    .single()

  if (error) throw error
  return mapCampanha(data as CampanhaRow)
}

export async function listCampanhasResumo(): Promise<CampanhaResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campanhas')
    .select('id,nome,criada_em,filtro_usado,campanha_envios(status,virou_orcamento,virou_venda,receita_atribuida)')
    .order('criada_em', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? [])
    .map((row) => row as CampanhaRow)
    .filter((campanha) => Boolean(campanha.filtro_usado?.segmentoId))
    .map(mapCampanhaResumo)
}

async function findClientesByProdutoOuServico(term: string): Promise<string[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  const terms = term
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)

  const clienteIds = new Set<string>()
  for (const item of terms) {
    const pattern = `%${item}%`
    const [vendas, servicos] = await Promise.all([
      supabase
        .from('vendas_itens')
        .select('cliente_id')
        .or(`produto_nome.ilike.${pattern},produto_codigo.ilike.${pattern},marca.ilike.${pattern},modelo.ilike.${pattern},medida.ilike.${pattern}`)
        .limit(5000),
      supabase
        .from('servicos_itens')
        .select('cliente_id')
        .or(`servico_nome.ilike.${pattern},servico_codigo.ilike.${pattern},observacao.ilike.${pattern},placa.ilike.${pattern}`)
        .limit(5000),
    ])

    if (vendas.error) throw vendas.error
    if (servicos.error) throw servicos.error

    for (const row of vendas.data ?? []) clienteIds.add(row.cliente_id as string)
    for (const row of servicos.data ?? []) clienteIds.add(row.cliente_id as string)
  }

  return Array.from(clienteIds)
}

export async function listCampanhaStatuses(campanhaNome: string, clienteIds: string[]): Promise<Record<string, CampanhaEnvioStatus>> {
  if (clienteIds.length === 0) return {}
  const supabase = await getSupabase()
  if (!supabase) return {}

  const { data: campanha, error: campanhaError } = await supabase
    .from('campanhas')
    .select('id')
    .eq('nome', campanhaNome)
    .limit(1)
    .maybeSingle()

  if (campanhaError) throw campanhaError
  if (!campanha?.id) return {}

  return listCampanhaStatusesById(campanha.id as string, clienteIds)
}

export async function listCampanhaStatusesById(campanhaId: string, clienteIds: string[]): Promise<Record<string, CampanhaEnvioStatus>> {
  if (clienteIds.length === 0) return {}
  const supabase = await getSupabase()
  if (!supabase) return {}

  const { data, error } = await supabase
    .from('campanha_envios')
    .select('cliente_id,status')
    .eq('campanha_id', campanhaId)
    .in('cliente_id', clienteIds)

  if (error) throw error

  return (data ?? []).reduce<Record<string, CampanhaEnvioStatus>>((acc, row) => {
    acc[row.cliente_id as string] = row.status as CampanhaEnvioStatus
    return acc
  }, {})
}

export async function upsertCampanhaEnvio(input: {
  campanhaId: string
  campanhaNome?: string
  clienteId: string
  vendedorId?: string
  telefone?: string
  mensagemFinal: string
  status: CampanhaEnvioStatus
  orcamentoId?: string
  receitaAtribuida?: number
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
      virouOrcamento: input.status === 'virou_orcamento' || input.status === 'ganhou',
      virouVenda: input.status === 'ganhou',
      orcamentoId: input.orcamentoId,
      receitaAtribuida: input.receitaAtribuida,
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
        virou_orcamento: input.status === 'virou_orcamento' || input.status === 'ganhou',
        virou_venda: input.status === 'ganhou',
        orcamento_id: input.orcamentoId ?? undefined,
        receita_atribuida: input.receitaAtribuida ?? undefined,
      },
      { onConflict: 'campanha_id,cliente_id' },
    )
    .select('*')
    .single()

  if (error) throw error

  return mapEnvio(data as CampanhaEnvioRow)
}

export async function attributeCampanhaRevenueByOrcamento(orcamentoId: string, receita: number): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('campanha_envios')
    .update({
      status: 'ganhou',
      virou_orcamento: true,
      virou_venda: true,
      receita_atribuida: receita,
      data_marcado_enviado: new Date().toISOString(),
    })
    .eq('orcamento_id', orcamentoId)

  if (error) throw error
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
    .limit(1)
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
    orcamentoId: row.orcamento_id ?? undefined,
    receitaAtribuida: row.receita_atribuida ?? undefined,
  }
}

function mapCampanha(row: CampanhaRow): CampanhaSalva {
  const filtroUsado = row.filtro_usado?.segmentoId ? row.filtro_usado : { segmentoId: 'inativos-90' as const }
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    mensagemModelo: row.mensagem_modelo,
    filtroUsado,
    criadaEm: row.criada_em,
  }
}

function mapCampanhaResumo(row: CampanhaRow): CampanhaResumo {
  const envios = row.campanha_envios ?? []
  return {
    campanhaId: row.id,
    nome: row.nome,
    criadaEm: row.criada_em,
    total: envios.length,
    pendentes: envios.filter((envio) => envio.status === 'pendente').length,
    enviados: envios.filter((envio) => envio.status === 'enviado').length,
    responderam: envios.filter((envio) => envio.status === 'respondeu').length,
    semResposta: envios.filter((envio) => envio.status === 'nao_respondeu').length,
    viraramOrcamento: envios.filter((envio) => envio.status === 'virou_orcamento' || envio.virou_orcamento).length,
    viraramVenda: envios.filter((envio) => envio.virou_venda).length,
    perdidos: envios.filter((envio) => envio.status === 'perdido').length,
    naoContatar: envios.filter((envio) => envio.status === 'nao_contatar').length,
    receitaAtribuida: envios.reduce((total, envio) => total + Number(envio.receita_atribuida ?? 0), 0),
  }
}
