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

  let score = 0
  const diasSemCompra = daysSince(cliente.ultimaCompraEm)
  const diasSemContato = daysSince(cliente.ultimoContatoEm)

  if (orcamentos.some((orcamento) => orcamento.clienteId === cliente.id && orcamento.status !== 'ganho')) score += 25
  if (diasSemCompra <= 365) score += 10
  if (diasSemCompra > 90) score += 15
  if (cliente.totalComprado > 100000) score += 20
  if (cliente.whatsapp) score += 10
  if (diasSemContato > 60) score += 15
  if (cliente.ultimoServicoEm && daysSince(cliente.ultimoServicoEm) < 60) score += 10
  if (!cliente.vendedorId) score += 12

  return score
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
