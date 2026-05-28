update public.veiculos
set chassi = null
where upper(chassi) in ('S/KM', 'S KM', 'SEM', 'SEM CHASSI', '0', '00', '000');

update public.veiculos
set chassi = null
where upper(chassi) like '%KM%';

update public.veiculos
set chassi = null
where length(chassi) < 8;

update public.veiculos
set chassi = null
where length(chassi) <> 17
   or upper(chassi) like '%SEM%'
   or upper(chassi) like '%TACOGRAFO%'
   or chassi !~ '^[A-Za-z0-9]+$';

select count(*) as veiculos_total from public.veiculos;
