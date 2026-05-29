update public.clientes
set
  origem_base = 'rodobens',
  origem_detalhe = 'Sinal Rodobens identificado no cadastro bruto',
  atualizado_em = now()
where excluido_em is null
  and raw_data::text ilike '%rodobens%';

update public.clientes
set
  origem_base = 'capital_truck',
  origem_detalhe = coalesce(origem_detalhe, 'Cadastro ERP Capital Truck Center'),
  atualizado_em = now()
where excluido_em is null
  and origem_base = 'desconhecida'
  and raw_data::text ilike any (array['%capital truck%', '%capital service%']);
