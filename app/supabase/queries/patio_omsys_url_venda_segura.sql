-- Evita abrir diretamente a acao interna cadvenda_acao1.php fora do contexto do OMSYS.
-- Essa acao depende da sessao/tela ja inicializada e pode cair no erro vet_animal.

update public.patio_omsys_config
set valor = 'http://capitalpneus.omsys.info:8081/omsys/cadvenda.php',
    descricao = 'Tela de vendas OMSYS usada quando o operador confirma abertura manual da venda.',
    atualizado_em = now()
where chave = 'omsys_venda_url';

update public.patio_omsys_vendas_exportacoes
set payload = jsonb_set(
      payload,
      '{url_sistema}',
      to_jsonb('http://capitalpneus.omsys.info:8081/omsys/cadvenda.php'::text),
      true
    ),
    atualizado_em = now()
where payload->>'url_sistema' like '%cadvenda_acao1.php%';
