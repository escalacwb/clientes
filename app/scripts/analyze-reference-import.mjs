import {
  REFERENCE_FILES,
  parseCarrosAtendidos,
  parseClientesSistema,
  parseListaPreco,
  parseMovimento,
} from './reference-file-reader.mjs'

const clientes = parseClientesSistema()
const carros = parseCarrosAtendidos()
const precosProdutos = parseListaPreco(REFERENCE_FILES.precoProdutos, 'produto')
const precosServicos = parseListaPreco(REFERENCE_FILES.precoServicos, 'servico')
const vendasProdutos = parseMovimento(REFERENCE_FILES.vendasProdutos, 'produto')
const vendasServicos = parseMovimento(REFERENCE_FILES.vendasServicos, 'servico')

const clienteCodigos = new Set(clientes.map((cliente) => cliente.codigo_erp).filter(Boolean))
const carrosComCliente = carros.filter((item) => clienteCodigos.has(item.codigo_cliente_erp))
const vendasComCliente = vendasProdutos.filter((item) => clienteCodigos.has(item.codigo_cliente_erp))
const servicosComCliente = vendasServicos.filter((item) => clienteCodigos.has(item.codigo_cliente_erp))
const movimentos = [...vendasProdutos, ...vendasServicos]

console.log(JSON.stringify({
  arquivosObrigatorios: {
    carrosatendidos: carros.length,
    listaclientessistema: clientes.length,
    vendasprodutos: vendasProdutos.length,
    vendasservicos: vendasServicos.length,
  },
  arquivosOpcionais: {
    precoprodutos: precosProdutos.length,
    precoservicos: precosServicos.length,
  },
  cruzamento: {
    clientesUnicos: clienteCodigos.size,
    carrosComCliente: carrosComCliente.length,
    carrosSemCliente: carros.length - carrosComCliente.length,
    vendasProdutosComCliente: vendasComCliente.length,
    vendasProdutosSemCliente: vendasProdutos.length - vendasComCliente.length,
    vendasServicosComCliente: servicosComCliente.length,
    vendasServicosSemCliente: vendasServicos.length - servicosComCliente.length,
    placasUnicas: new Set(carros.map((item) => item.placa).filter(Boolean)).size,
    kmsEmCarrosAtendidos: carros.filter((item) => item.km).length,
    itensComPlacaNaVenda: movimentos.filter((item) => item.placa).length,
    itensComKmNaVenda: movimentos.filter((item) => item.km).length,
    itensComObservacaoVeiculo: movimentos.filter((item) => item.raw_vehicle_note).length,
    produtosVendidosUnicos: new Set(vendasProdutos.map((item) => item.produto_codigo).filter(Boolean)).size,
    servicosVendidosUnicos: new Set(vendasServicos.map((item) => item.produto_codigo).filter(Boolean)).size,
  },
  amostras: {
    cliente: clientes.slice(0, 2),
    carroAtendido: carros.slice(0, 2),
    vendaProduto: vendasProdutos.slice(0, 2),
    vendaServico: vendasServicos.slice(0, 2),
    precoProduto: precosProdutos.slice(0, 2),
    precoServico: precosServicos.slice(0, 2),
  },
}, null, 2))
