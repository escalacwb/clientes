insert into public.users (nome, email, role)
values
  ('Marina Souza', 'marina@capitaltruck.com.br', 'admin'),
  ('Rafael Costa', 'rafael@capitaltruck.com.br', 'vendedor'),
  ('Diego Lima', 'diego@capitaltruck.com.br', 'vendedor')
on conflict (email) do nothing;

insert into public.clientes (
  codigo_erp,
  cpf_cnpj,
  nome,
  nome_fantasia,
  tipo_cliente,
  cidade,
  uf,
  telefone_principal,
  whatsapp_principal,
  email,
  responsavel_nome,
  vendedor_id,
  status_comercial,
  origem,
  primeira_compra_em,
  ultima_compra_em,
  ultimo_servico_em,
  ultimo_contato_em,
  proxima_acao_em,
  tags,
  observacoes_comerciais
)
select
  'ERP-1042',
  '12345678000190',
  'Trans Norte Logistica Ltda',
  'Trans Norte',
  'Transportadora',
  'Cuiaba',
  'MT',
  '(65) 3321-4410',
  '5565999991111',
  'compras@transnorte.com.br',
  'Carlos Mendes',
  u.id,
  'reativar',
  'seed_demo',
  '2025-02-13',
  '2026-01-20',
  '2026-03-12',
  '2026-03-18 10:20:00-04',
  '2026-05-28 09:00:00-04',
  array['Frota', 'Cliente Michelin', 'Inativo 90 dias', 'Alto potencial'],
  'Compra por cotacao, sensivel a prazo e disponibilidade.'
from public.users u
where u.email = 'rafael@capitaltruck.com.br'
on conflict (codigo_erp) do nothing;

insert into public.vendas_itens (
  cliente_id,
  codigo_cliente_erp,
  data_venda,
  nota,
  pedido,
  produto_codigo,
  produto_nome,
  marca,
  modelo,
  medida,
  quantidade,
  valor_unitario,
  valor_total,
  vendedor_nome,
  unidade,
  chave_unica
)
select
  c.id,
  c.codigo_erp,
  '2026-01-20',
  '000123',
  'P-8841',
  'PN29580',
  'PNEU 295/80 R22.5 MICHELIN',
  'Michelin',
  'Multi Z',
  '295/80R22.5',
  4,
  4200.50,
  16802.00,
  'Rafael Costa',
  'Capital Truck Center',
  'seed|venda|000123|ERP-1042|PN29580|2026-01-20|4|16802'
from public.clientes c
where c.codigo_erp = 'ERP-1042'
on conflict (chave_unica) do nothing;

insert into public.interacoes (
  cliente_id,
  vendedor_id,
  data_interacao,
  canal,
  tipo,
  resumo,
  resultado,
  proxima_acao,
  data_proxima_acao
)
select
  c.id,
  u.id,
  '2026-03-18 10:20:00-04',
  'WhatsApp',
  'pos-venda',
  'Cliente confirmou servico ok e pediu para chamar no fim de maio.',
  'pediu retorno depois',
  'Cotar reposicao 295/80R22.5',
  '2026-05-28 09:00:00-04'
from public.clientes c
join public.users u on u.email = 'rafael@capitaltruck.com.br'
where c.codigo_erp = 'ERP-1042';
