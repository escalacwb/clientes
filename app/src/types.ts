export type Role = 'admin' | 'vendedor' | 'operacao'

export type ClienteStatus =
  | 'Novo'
  | 'Ativo'
  | 'Em acompanhamento'
  | 'Orcamento aberto'
  | 'Reativar'
  | 'Inativo'
  | 'Nao contatar'

export type LeadQualificacaoStatus =
  | 'novo'
  | 'contatado'
  | 'qualificado'
  | 'virou_cliente'
  | 'descartado'
  | 'nao_contatar'

export type Cliente = {
  id: string
  codigoErp: string
  cpfCnpj?: string
  nome: string
  nomeFantasia?: string
  tipoCliente: string
  cidade: string
  uf: string
  telefone?: string
  whatsapp?: string
  email?: string
  responsavel?: string
  vendedorId?: string
  vendedorNome?: string
  vendedorHistoricoNome?: string
  vendedorHistoricoCodigo?: string
  status: ClienteStatus
  origem: string
  origemBase?: 'capital_truck' | 'rodobens' | 'desconhecida'
  origemDetalhe?: string
  leadQualificacaoStatus?: LeadQualificacaoStatus
  leadQualificacaoObservacao?: string
  leadQualificadoEm?: string
  primeiraCompraEm?: string
  ultimaCompraEm?: string
  ultimoServicoEm?: string
  ultimoContatoEm?: string
  proximaAcaoEm?: string
  totalComprado: number
  totalServicos: number
  produtoPrincipal?: string
  tags: string[]
  observacoes?: string
}

export type Vendedor = {
  id: string
  nome: string
  email: string
  role: Role
}

export type SessaoUsuario = Vendedor & {
  modo: 'local' | 'supabase'
}

export type Interacao = {
  id: string
  clienteId: string
  vendedorId: string
  data: string
  canal: 'WhatsApp' | 'Ligacao' | 'Presencial' | 'Email' | 'Campanha'
  tipo: string
  resumo: string
  resultado: string
  proximaAcao?: string
  dataProximaAcao?: string
  campanhaId?: string
  orcamentoId?: string
}

export type InteracaoInput = Omit<Interacao, 'id' | 'data'> & {
  data?: string
}

export type Orcamento = {
  id: string
  clienteId: string
  clienteNome?: string
  vendedorId: string
  vendedorNome?: string
  data: string
  status: 'aberto' | 'aguardando_aprovacao' | 'enviado' | 'negociando' | 'ganho' | 'perdido'
  valorTotal: number
  validade: string
  previsaoFechamento?: string
  formaPagamento?: string
  motivoPerda?: string
  aprovacaoMotivo?: string
  aprovadoPor?: string
  aprovadoEm?: string
  enviadoPor?: string
  enviadoEm?: string
  pedidoConfirmadoPor?: string
  pedidoConfirmadoEm?: string
  pedidoReferencia?: string
  pedidoObservacao?: string
  proximoFollowupEm?: string
  prazoEntrega?: string
  prazoExecucao?: string
  observacao?: string
  itens?: OrcamentoItem[]
  condicoes?: OrcamentoCondicao[]
}

export type OrcamentoInput = Omit<Orcamento, 'id' | 'data' | 'status' | 'itens' | 'condicoes'> & {
  data?: string
  status?: Orcamento['status']
  itens?: OrcamentoItemInput[]
  condicoes?: OrcamentoCondicaoInput[]
  versaoMensagem?: string
  versaoOrigem?: string
}

export type OrcamentoCondicao = {
  id: string
  orcamentoId: string
  label: string
  ajustePercentual: number
  valorTotal: number
  parcelas?: number
  observacao?: string
  ordem: number
}

export type OrcamentoCondicaoInput = Omit<OrcamentoCondicao, 'id' | 'orcamentoId'>

export type OrcamentoItem = {
  id: string
  orcamentoId: string
  catalogoItemId?: string
  codigo?: string
  descricao: string
  tipo: 'produto' | 'servico'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  descontoPercentual?: number
  observacao?: string
  apresentacao?: 'normal' | 'alternativa' | 'pacote' | 'complementar'
}

export type OrcamentoItemInput = Omit<OrcamentoItem, 'id' | 'orcamentoId' | 'valorTotal'> & {
  valorTotal?: number
}

export type OrcamentoVersao = {
  id: string
  orcamentoId: string
  numero: number
  status: Orcamento['status']
  valorTotal: number
  validade?: string
  formaPagamento?: string
  observacao?: string
  mensagem?: string
  origem?: string
  itens: OrcamentoItemInput[]
  criadoEm: string
}

export type OrcamentoAprovacao = {
  id: string
  orcamentoId: string
  acao: 'solicitada' | 'aprovada' | 'rejeitada' | 'enviada'
  motivo?: string
  usuarioId?: string
  usuarioNome?: string
  criadoEm: string
  rawData?: Record<string, unknown>
}

export type CatalogoItem = {
  id: string
  tipo: 'produto' | 'servico'
  codigo: string
  descricao: string
  unidade?: string
  grupo?: string
  subgrupo?: string
  marca?: string
  ativo: boolean
  preco: number
  descontoMaximo?: number
  estoque?: number
}

export type CatalogoRegraDesconto = {
  id: string
  nome: string
  tipo?: CatalogoItem['tipo']
  grupo?: string
  subgrupo?: string
  marca?: string
  codigo?: string
  descontoMaximo: number
  requerAprovacaoAcimaDe: number
  ativo: boolean
}

export type Importacao = {
  id: string
  tipo: 'base-inicial' | 'xml-diario' | 'clientes-semanal' | 'referencias-diarias' | 'catalogo-precos'
  arquivoNome: string
  dataImportacao: string
  totalItens: number
  clientesEncontrados: number
  clientesCriados: number
  conflitos: number
  itensCriados?: number
  itensIgnorados?: number
  status: 'processada' | 'pendente' | 'com-conflitos' | 'processando' | 'erro'
}

export type ImportacaoConflito = {
  id: string
  importacaoId: string
  tipo: string
  resumo: string
  dadosRecebidos: string
  possiveisClientes: string[]
  resolvido: boolean
  decisao?: 'unir' | 'manter-separado' | 'criar-novo' | 'ignorar'
}

export type ClienteAlteracao = {
  id: string
  clienteId: string
  clienteNome: string
  usuarioNome: string
  campo: string
  valorAnterior?: string
  valorNovo?: string
  origem: string
  criadoEm: string
}

export type Tarefa = {
  id: string
  clienteId: string
  clienteNome: string
  vendedorId?: string
  vendedorNome?: string
  titulo: string
  descricao?: string
  dataVencimento: string
  status: 'aberta' | 'concluida' | 'cancelada'
  prioridade: number
  origem: string
  concluidaEm?: string
  reagendadaEm?: string
  reagendamentoMotivo?: string
}

export type TarefaInput = Omit<Tarefa, 'id' | 'clienteNome' | 'vendedorNome' | 'status'> & {
  status?: Tarefa['status']
}

export type CampanhaEnvioStatus =
  | 'pendente'
  | 'enviado'
  | 'respondeu'
  | 'nao_respondeu'
  | 'virou_orcamento'
  | 'ganhou'
  | 'perdido'
  | 'nao_contatar'

export type CampanhaEnvio = {
  id: string
  campanhaId: string
  campanhaNome?: string
  clienteId: string
  vendedorId?: string
  telefone?: string
  mensagemFinal: string
  status: CampanhaEnvioStatus
  dataAberturaWhatsapp?: string
  dataMarcadoEnviado?: string
  respostaCliente?: string
  virouOrcamento: boolean
  virouVenda: boolean
  orcamentoId?: string
  receitaAtribuida?: number
}

export type VendaItem = {
  id: string
  clienteId: string
  veiculoId?: string
  ordemId?: string
  dataVenda: string
  nota?: string
  pedido?: string
  produtoCodigo?: string
  produtoNome: string
  marca?: string
  modelo?: string
  medida?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  kmExtraido?: number
  veiculoObservacao?: string
  vendedorNome?: string
  unidade?: string
}

export type ServicoItem = {
  id: string
  clienteId: string
  veiculoId?: string
  ordemId?: string
  dataServico: string
  pedido?: string
  servicoCodigo?: string
  servicoNome: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  placa?: string
  kmExtraido?: number
  veiculoObservacao?: string
  observacao?: string
  vendedorNome?: string
  unidade?: string
}

export type ClienteVeiculoResumo = {
  id: string
  clienteId?: string
  placa?: string
  chassi?: string
  descricao?: string
  ultimoKm?: number
  kmAtualizadoEm?: string
  primeiroAtendimentoEm?: string
  ultimoAtendimentoEm?: string
  totalAtendimentos: number
  valorTotalAtendimentos: number
  origem?: string
}

export type CarteiraFiltro =
  | 'todos'
  | 'origem-capital'
  | 'origem-rodobens'
  | 'origem-desconhecida'
  | 'acao-hoje'
  | 'sem-compra-90'
  | 'sem-contato-60'
  | 'sem-whatsapp'
  | 'sem-vendedor'
  | 'orcamento-aberto'
  | 'alto-potencial'

export type Oportunidade = {
  id: string
  clienteId: string
  clienteNome: string
  tipo: string
  motivo: string
  proximaAcao: string
  prioridade: number
  bloqueada: boolean
  tarefaExistente?: boolean
}

export type OportunidadeEstagio =
  | 'novo_lead'
  | 'contato_iniciado'
  | 'qualificado'
  | 'orcamento'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export type OportunidadePipeline = {
  id: string
  clienteId: string
  clienteNome: string
  titulo: string
  estagio: OportunidadeEstagio
  origem: string
  valorEstimado: number
  probabilidade: number
  previsaoFechamento?: string
  responsavelId?: string
  responsavelNome?: string
  campanhaId?: string
  orcamentoId?: string
  motivoPerda?: string
  observacao?: string
  criadoEm: string
  atualizadoEm: string
  encerradaEm?: string
}

export type OportunidadePipelineInput = Omit<
  OportunidadePipeline,
  'id' | 'clienteNome' | 'responsavelNome' | 'criadoEm' | 'atualizadoEm' | 'encerradaEm'
> & {
  encerradaEm?: string
}

export type SequenciaExecucao = {
  id: string
  sequenciaId: string
  sequenciaNome: string
  clienteId: string
  clienteNome: string
  vendedorId?: string
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada'
  etapaAtual: number
  proximaAcaoEm: string
  criadoEm: string
  encerradaEm?: string
}

export type ClienteMesclagem = {
  id: string
  clientePrincipalId: string
  clientePrincipalNome: string
  clienteMescladoId: string
  clienteMescladoNome: string
  usuarioNome: string
  motivo: string
  dadosMovidos: string[]
  criadoEm: string
}

export type PossivelDuplicado = {
  id: string
  clienteAId: string
  clienteANome: string
  clienteBId: string
  clienteBNome: string
  motivo: string
  confianca: number
}
