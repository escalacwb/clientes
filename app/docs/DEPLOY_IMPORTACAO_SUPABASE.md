# Deploy da importacao diaria

A importacao real pelo app depende da Edge Function `import-reference-files`.

## Publicar a funcao

Antes do deploy, autentique a CLI:

```bash
supabase login
```

Depois publique:

```bash
npm run supabase:deploy:import-function
```

O script publica a funcao com `--no-verify-jwt` porque o proprio codigo valida o JWT e confere se o usuario e admin em `public.users`. Isso evita bloqueio de CORS no preflight do navegador sem abrir a importacao para usuarios anonimos.

## Variaveis esperadas

No ambiente da Edge Function precisam existir:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Em projetos hospedados do Supabase essas variaveis normalmente ja ficam disponiveis para Edge Functions.

## Fluxo no app

1. Abrir `Importacoes`.
2. Selecionar o pacote da importacao diaria.
3. Conferir a previa.
4. Clicar em `Importar agora`.

Somente usuarios admin conseguem concluir a importacao.

## Arquivos obrigatorios

- `carrosatendidos.xls`
- `listaclientessistema.xls`
- `vendasprodutos.xls`
- `vendasservicos.xls`

Arquivos opcionais:

- `precoprodutos.xls`
- `precoservicos.xls`
