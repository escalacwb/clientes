import { getSupabase } from '../lib/supabase'
import type { CatalogoItem } from '../types'

type CatalogoRow = {
  id: string
  tipo: CatalogoItem['tipo']
  codigo: string
  descricao: string
  unidade: string | null
  grupo: string | null
  subgrupo: string | null
  marca: string | null
  ativo: boolean
}

type PrecoRow = {
  id?: string
  catalogo_item_id: string
  valor: number
  desconto_maximo: number | null
  estoque: number | null
  vigencia_inicio: string
  criado_em?: string | null
  importacao_arquivo_id?: string | null
  importacao_arquivos?: { arquivo_nome: string | null } | Array<{ arquivo_nome: string | null }> | null
}

export type CatalogoTipoFilter = 'todos' | CatalogoItem['tipo']
export type CatalogoAtivoFilter = 'ativos' | 'inativos' | 'todos'

export type CatalogoPrecoHistorico = {
  id: string
  catalogoItemId: string
  valor: number
  descontoMaximo?: number
  estoque?: number
  vigenciaInicio: string
  criadoEm?: string
  arquivoNome?: string
}

export type CatalogoSugestao = {
  catalogoItemId: string
  tipo: CatalogoItem['tipo']
  codigo: string
  descricao: string
  ocorrencias: number
  clientes: number
}

type CatalogoSugestaoRow = {
  catalogo_item_id: string
  tipo: CatalogoItem['tipo']
  codigo: string
  descricao: string
  ocorrencias: number
  clientes: number
}

export async function listCatalogoItens(): Promise<CatalogoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const [{ data: itens, error: itensError }, { data: precos, error: precosError }] = await Promise.all([
    supabase
      .from('catalogo_itens')
      .select('id,tipo,codigo,descricao,unidade,grupo,subgrupo,marca,ativo')
      .eq('ativo', true)
      .order('tipo', { ascending: true })
      .order('descricao', { ascending: true }),
    supabase
      .from('catalogo_precos')
      .select('catalogo_item_id,valor,desconto_maximo,estoque,vigencia_inicio')
      .order('vigencia_inicio', { ascending: false }),
  ])

  if (itensError) throw itensError
  if (precosError) throw precosError

  const precoIndex = new Map<string, PrecoRow>()
  ;(precos as PrecoRow[] | null ?? []).forEach((preco) => {
    if (!precoIndex.has(preco.catalogo_item_id)) precoIndex.set(preco.catalogo_item_id, preco)
  })

  return (itens as CatalogoRow[] | null ?? []).map((item) => {
    const preco = precoIndex.get(item.id)
    return {
      id: item.id,
      tipo: item.tipo,
      codigo: item.codigo,
      descricao: item.descricao,
      unidade: item.unidade ?? undefined,
      grupo: item.grupo ?? undefined,
      subgrupo: item.subgrupo ?? undefined,
      marca: item.marca ?? undefined,
      ativo: item.ativo,
      preco: preco?.valor ?? 0,
      descontoMaximo: preco?.desconto_maximo ?? undefined,
      estoque: preco?.estoque ?? undefined,
    }
  })
}

export async function listCatalogoPage(input: {
  page: number
  pageSize: number
  query?: string
  tipo?: CatalogoTipoFilter
  ativo?: CatalogoAtivoFilter
}): Promise<{ itens: CatalogoItem[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { itens: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('catalogo_itens')
    .select('id,tipo,codigo,descricao,unidade,grupo,subgrupo,marca,ativo', { count: 'exact' })

  if (input.tipo && input.tipo !== 'todos') query = query.eq('tipo', input.tipo)
  if (!input.ativo || input.ativo === 'ativos') query = query.eq('ativo', true)
  if (input.ativo === 'inativos') query = query.eq('ativo', false)
  const term = input.query?.trim()
  if (term) {
    const pattern = `%${term.replaceAll('%', '')}%`
    query = query.or(`codigo.ilike.${pattern},descricao.ilike.${pattern},marca.ilike.${pattern},grupo.ilike.${pattern},subgrupo.ilike.${pattern}`)
  }

  const { data: itens, error, count } = await query
    .order('tipo', { ascending: true })
    .order('descricao', { ascending: true })
    .range(from, to)

  if (error) throw error
  const rows = (itens as CatalogoRow[] | null) ?? []
  const prices = await listLatestPrices(rows.map((item) => item.id))

  return {
    itens: rows.map((item) => mapCatalogoItem(item, prices.get(item.id))),
    total: count ?? 0,
  }
}

export async function listCatalogoSugestoes(catalogoItemId: string): Promise<CatalogoSugestao[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .rpc('catalogo_sugestoes_complementares', { item_id: catalogoItemId, limite: 8 })

  if (error) throw error
  return (data as CatalogoSugestaoRow[] | null ?? []).map((row) => ({
    catalogoItemId: row.catalogo_item_id,
    tipo: row.tipo,
    codigo: row.codigo,
    descricao: row.descricao,
    ocorrencias: Number(row.ocorrencias ?? 0),
    clientes: Number(row.clientes ?? 0),
  }))
}

export async function listCatalogoPrecos(catalogoItemId: string): Promise<CatalogoPrecoHistorico[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('catalogo_precos')
    .select('id,catalogo_item_id,valor,desconto_maximo,estoque,vigencia_inicio,criado_em,importacao_arquivo_id,importacao_arquivos(arquivo_nome)')
    .eq('catalogo_item_id', catalogoItemId)
    .order('vigencia_inicio', { ascending: false })
    .order('criado_em', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data as PrecoRow[] | null ?? []).map((preco) => ({
    id: preco.id ?? `${preco.catalogo_item_id}-${preco.vigencia_inicio}-${preco.valor}`,
    catalogoItemId: preco.catalogo_item_id,
    valor: preco.valor,
    descontoMaximo: preco.desconto_maximo ?? undefined,
    estoque: preco.estoque ?? undefined,
    vigenciaInicio: preco.vigencia_inicio,
    criadoEm: preco.criado_em ?? undefined,
    arquivoNome: Array.isArray(preco.importacao_arquivos)
      ? preco.importacao_arquivos[0]?.arquivo_nome ?? undefined
      : preco.importacao_arquivos?.arquivo_nome ?? undefined,
  }))
}

async function listLatestPrices(itemIds: string[]) {
  const supabase = await getSupabase()
  const priceIndex = new Map<string, PrecoRow>()
  if (!supabase || itemIds.length === 0) return priceIndex

  const { data, error } = await supabase
    .from('catalogo_precos')
    .select('catalogo_item_id,valor,desconto_maximo,estoque,vigencia_inicio')
    .in('catalogo_item_id', itemIds)
    .order('vigencia_inicio', { ascending: false })

  if (error) throw error
  ;(data as PrecoRow[] | null ?? []).forEach((preco) => {
    if (!priceIndex.has(preco.catalogo_item_id)) priceIndex.set(preco.catalogo_item_id, preco)
  })
  return priceIndex
}

function mapCatalogoItem(item: CatalogoRow, preco?: PrecoRow): CatalogoItem {
  return {
    id: item.id,
    tipo: item.tipo,
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade ?? undefined,
    grupo: item.grupo ?? undefined,
    subgrupo: item.subgrupo ?? undefined,
    marca: item.marca ?? undefined,
    ativo: item.ativo,
    preco: preco?.valor ?? 0,
    descontoMaximo: preco?.desconto_maximo ?? undefined,
    estoque: preco?.estoque ?? undefined,
  }
}
