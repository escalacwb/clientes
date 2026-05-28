import { daysSince, opportunityScore } from './crm'
import type { CarteiraFiltro, Cliente, Orcamento } from '../types'

export const carteiraFiltros: Array<{ id: CarteiraFiltro; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'acao-hoje', label: 'Acao hoje' },
  { id: 'sem-compra-90', label: '+90 dias sem compra' },
  { id: 'sem-contato-60', label: '+60 dias sem contato' },
  { id: 'sem-whatsapp', label: 'Sem WhatsApp' },
  { id: 'sem-vendedor', label: 'Sem vendedor' },
  { id: 'orcamento-aberto', label: 'Orcamento aberto' },
  { id: 'alto-potencial', label: 'Alto potencial' },
]

export function filterClientes<T extends Cliente>(
  clientes: T[],
  filtro: CarteiraFiltro,
  orcamentos: Orcamento[],
): T[] {
  return clientes.filter((cliente) => {
    const hasOpenBudget = orcamentos.some(
      (orcamento) => orcamento.clienteId === cliente.id && ['aberto', 'enviado', 'negociando'].includes(orcamento.status),
    )

    switch (filtro) {
      case 'acao-hoje':
        return Boolean(cliente.proximaAcaoEm && daysSince(cliente.proximaAcaoEm) >= 0)
      case 'sem-compra-90':
        return daysSince(cliente.ultimaCompraEm) > 90
      case 'sem-contato-60':
        return daysSince(cliente.ultimoContatoEm) > 60
      case 'sem-whatsapp':
        return !cliente.whatsapp
      case 'sem-vendedor':
        return !cliente.vendedorId
      case 'orcamento-aberto':
        return hasOpenBudget
      case 'alto-potencial':
        return opportunityScore(cliente, orcamentos) >= 60 || cliente.tags.includes('Alto potencial')
      default:
        return true
    }
  })
}
