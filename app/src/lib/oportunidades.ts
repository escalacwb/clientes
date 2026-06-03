import { bestNextAction, daysSince, opportunityScore } from './crm'
import type { Cliente, Orcamento, Oportunidade } from '../types'

export function buildOportunidades(clientes: Cliente[], orcamentos: Orcamento[]): Oportunidade[] {
  return clientes
    .flatMap((cliente) => buildClienteOportunidades(cliente, orcamentos))
    .sort((a, b) => Number(a.bloqueada) - Number(b.bloqueada) || b.prioridade - a.prioridade)
}

function buildClienteOportunidades(cliente: Cliente, orcamentos: Orcamento[]): Oportunidade[] {
  const bloqueada = cliente.status === 'Nao contatar'
  const oportunidades: Oportunidade[] = []
  const score = opportunityScore(cliente, orcamentos)
  const diasSemCompra = daysSince(cliente.ultimaCompraEm)
  const diasSemContato = daysSince(cliente.ultimoContatoEm)
  const hasOpenBudget = orcamentos.some(
    (orcamento) => orcamento.clienteId === cliente.id && ['aberto', 'enviado', 'negociando'].includes(orcamento.status),
  )

  if (hasOpenBudget) {
    oportunidades.push(create(cliente, 'orcamento_aberto', 'Orcamento aberto precisa de retorno.', 'Retomar orcamento', score + 25, bloqueada))
  }

  if (!cliente.vendedorId) {
    oportunidades.push(create(cliente, 'sem_vendedor', 'Cliente sem responsavel comercial.', 'Distribuir carteira', 90, bloqueada))
  }

  if (diasSemCompra > 180) {
    oportunidades.push(create(cliente, 'inativo_180', 'Mais de 180 dias sem compra.', 'Contato de reativacao', score + 20, bloqueada))
  } else if (diasSemCompra > 90) {
    oportunidades.push(create(cliente, 'recompra_90', 'Mais de 90 dias sem compra.', 'Enviar WhatsApp de recompra', score + 15, bloqueada))
  }

  if (cliente.totalComprado > 100000 && diasSemContato > 60) {
    oportunidades.push(create(cliente, 'alto_valor_sem_contato', 'Cliente de alto valor sem contato recente.', 'Ligar para relacionamento', score + 18, bloqueada))
  }

  if (!cliente.whatsapp) {
    oportunidades.push(create(cliente, 'sem_whatsapp', 'Cadastro sem WhatsApp valido.', 'Atualizar cadastro', 55, bloqueada))
  }

  if (!cliente.ultimoServicoEm && cliente.totalComprado > 0) {
    oportunidades.push(create(cliente, 'pneu_sem_servico', 'Comprou pneus e nunca fez servico.', 'Oferecer alinhamento ou balanceamento', score + 10, bloqueada))
  }

  if (cliente.ultimoServicoEm && !cliente.ultimaCompraEm) {
    oportunidades.push(create(cliente, 'servico_sem_pneu', 'Fez servico, mas nao tem compra de pneu registrada.', 'Oferecer cotacao de pneus', score + 10, bloqueada))
  }

  if (oportunidades.length === 0 && !bloqueada) {
    oportunidades.push(create(cliente, 'relacionamento', 'Cliente sem pendencia critica.', bestNextAction(cliente), score, false))
  }

  return oportunidades
}

function create(
  cliente: Cliente,
  tipo: string,
  motivo: string,
  proximaAcao: string,
  prioridade: number,
  bloqueada: boolean,
): Oportunidade {
  return {
    id: `${cliente.id}-${tipo}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    tipo,
    motivo,
    proximaAcao,
    prioridade,
    bloqueada,
  }
}
