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
}

type PrecoRow = {
  catalogo_item_id: string
  valor: number
  desconto_maximo: number | null
  estoque: number | null
  vigencia_inicio: string
}

export async function listCatalogoItens(): Promise<CatalogoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const [{ data: itens, error: itensError }, { data: precos, error: precosError }] = await Promise.all([
    supabase
      .from('catalogo_itens')
      .select('id,tipo,codigo,descricao,unidade,grupo,subgrupo,marca')
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
      preco: preco?.valor ?? 0,
      descontoMaximo: preco?.desconto_maximo ?? undefined,
      estoque: preco?.estoque ?? undefined,
    }
  })
}
