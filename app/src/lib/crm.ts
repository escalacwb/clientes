import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Cliente, Interacao, Orcamento } from '../types'

const today = new Date('2026-05-28T12:00:00')

export function money(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function dateLabel(date?: string) {
  if (!date) return 'Sem registro'
  return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function daysSince(date?: string) {
  if (!date) return 9999
  return differenceInCalendarDays(today, parseISO(date))
}

export function opportunityScore(cliente: Cliente, orcamentos: Orcamento[]) {
  if (cliente.status === 'Nao contatar') return 0

  return opportunityScoreDetails(cliente, orcamentos).reduce((total, item) => total + item.points, 0)
}

export function opportunityScoreDetails(cliente: Cliente, orcamentos: Orcamento[]) {
  if (cliente.status === 'Nao contatar') {
    return [{ label: 'Nao contatar', points: 0 }]
  }

  const diasSemCompra = daysSince(cliente.ultimaCompraEm)
  const diasSemContato = daysSince(cliente.ultimoContatoEm)
  const details: Array<{ label: string; points: number }> = []

  if (orcamentos.some((orcamento) => orcamento.clienteId === cliente.id && orcamento.status !== 'ganho')) details.push({ label: 'proposta aberta', points: 25 })
  if (diasSemCompra <= 365) details.push({ label: 'compra recente no ciclo anual', points: 10 })
  if (diasSemCompra > 90) details.push({ label: 'recompra possivel', points: 15 })
  if (cliente.totalComprado > 100000) details.push({ label: 'alto valor historico', points: 20 })
  if (cliente.whatsapp) details.push({ label: 'WhatsApp disponivel', points: 10 })
  if (diasSemContato > 60) details.push({ label: 'sem contato recente', points: 15 })
  if (cliente.ultimoServicoEm && daysSince(cliente.ultimoServicoEm) < 60) details.push({ label: 'servico recente', points: 10 })
  if (!cliente.vendedorId) details.push({ label: 'sem vendedor atual', points: 12 })

  return details
}

export function opportunityReason(cliente: Cliente, score: number) {
  if (!cliente.vendedorId) return 'Cliente novo sem vendedor definido'
  if (cliente.status === 'Orcamento aberto') return 'Orcamento precisa de retorno'
  if (daysSince(cliente.ultimaCompraEm) > 180) return 'Mais de 180 dias sem compra'
  if (daysSince(cliente.ultimaCompraEm) > 90) return 'Oportunidade de recompra'
  if (!cliente.ultimoServicoEm && cliente.totalComprado > 0) return 'Comprou pneus e nunca fez servico'
  if (score >= 50) return 'Alto valor sem contato recente'
  return 'Manter relacionamento ativo'
}

export function bestNextAction(cliente: Cliente) {
  if (!cliente.vendedorId) return 'Distribuir carteira'
  if (!cliente.whatsapp) return 'Atualizar WhatsApp'
  if (cliente.status === 'Orcamento aberto') return 'Retomar orcamento'
  if (daysSince(cliente.ultimaCompraEm) > 90) return 'Enviar WhatsApp de recompra'
  if (!cliente.ultimoServicoEm && cliente.totalComprado > 0) return 'Oferecer alinhamento/balanceamento'
  return 'Fazer pos-venda'
}

export function smartSummary(cliente: Cliente, interacoes: Interacao[]) {
  const diasSemCompra = daysSince(cliente.ultimaCompraEm)
  const lastInteraction = interacoes
    .filter((interacao) => interacao.clienteId === cliente.id)
    .sort((a, b) => b.data.localeCompare(a.data))[0]

  const base = `${cliente.nome} e um cliente do tipo ${cliente.tipoCliente.toLowerCase()} em ${cliente.cidade}/${cliente.uf}.`
  const compra = cliente.produtoPrincipal
    ? ` Compra principalmente ${cliente.produtoPrincipal} e esta ha ${diasSemCompra} dias sem compra.`
    : ' Ainda nao possui produto principal identificado.'
  const servico = cliente.ultimoServicoEm
    ? ` Ultimo servico em ${dateLabel(cliente.ultimoServicoEm)}.`
    : ' Nao ha servico registrado.'
  const contato = lastInteraction
    ? ` Ultimo contato: ${lastInteraction.resultado}.`
    : ' Sem contato comercial registrado.'

  return `${base}${compra}${servico}${contato} Sugestao: ${bestNextAction(cliente).toLowerCase()}.`
}
