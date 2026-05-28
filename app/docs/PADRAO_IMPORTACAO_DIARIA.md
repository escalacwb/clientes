# Padrao de importacao diaria

Este documento define o fluxo oficial para entrada dos dados operacionais no CRM.

## Arquivos esperados

Obrigatorios em toda importacao:

- `carrosatendidos.xls`
- `listaclientessistema.xls`
- `vendasprodutos.xls`
- `vendasservicos.xls`

Opcionais, usados apenas quando houver alteracao:

- `precoprodutos.xls`
- `precoservicos.xls`

Uso futuro:

- `lancamentosvendasmichelin.xlsx`

## Entidades extraidas

`listaclientessistema.xls` alimenta `clientes`.

- Chave principal: `codigo_erp`
- Alternativas para conferencia: `cpf_cnpj`, `nome`
- Dados preservados: vendedor ERP, canal de venda, cidade, UF, telefone, email, cadastro e `raw_data`

`carrosatendidos.xls` alimenta `veiculos` e ajuda a vincular vendas.

- Chave preferencial: `placa`
- Segunda chave: `chassi` somente quando for chassi valido de 17 caracteres
- Nunca gravar KM como chassi
- KM deve ser extraido para `ultimo_km`

`vendasprodutos.xls` e `vendasservicos.xls` alimentam ordens e itens.

- Ordem: `ordens_movimento`
- Itens de produto: `vendas_itens`
- Itens de servico: `servicos_itens`

## Extracao venda a venda

Cada bloco de venda deve manter o contexto atual:

- cliente
- data
- nota
- pedido
- vendedor
- empresa/unidade
- itens
- observacao de veiculo, quando houver

Linhas livres como `PLACA HRO3B24 MB 1418 KM 41.905` devem ser anexadas ao pedido atual e aos itens desse pedido.

Campos extraidos da observacao:

- `placa`
- `km`
- `veiculo_descricao`
- `raw_vehicle_note`
- `veiculo_match = observacao_movimento`

## Vinculo de veiculo

Prioridade de vinculo:

1. Placa/KM encontrados diretamente na observacao da venda.
2. Cruzamento com `carrosatendidos` por `codigo_cliente_erp + pedido`.
3. Cruzamento por `codigo_cliente_erp + nota + data`.
4. Cruzamento por `codigo_cliente_erp + data`, apenas quando existir um unico atendimento no dia.

Quando nenhum criterio for confiavel, a venda entra sem veiculo vinculado, mas com `raw_data` preservado.

## Deduplicacao

Arquivos:

- Cada arquivo recebe hash SHA-256.
- Arquivos identicos podem ser reconhecidos por `tipo + arquivo_hash`.

Clientes:

- `codigo_erp`

Veiculos:

- `placa`
- `chassi`, somente quando valido
- fallback interno: `codigo_cliente_erp + descricao`

Ordens:

- `tipo + codigo_cliente_erp + nota + pedido + data`

Itens:

- `tipo + nota + pedido + codigo_cliente_erp + codigo_item + data + quantidade + valor_total`

Esse padrao permite importar o historico completo novamente sem duplicar o que ja existe.

## Auditoria

Toda linha transformada deve preservar os dados originais em `raw_data`. Observacoes de veiculo tambem ficam em `veiculo_observacao`, para permitir revisao manual quando a extracao automatica nao for perfeita.
