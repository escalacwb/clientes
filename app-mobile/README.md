# App Mobile - Configuracao

O app mobile agora usa Supabase direto (sem FastAPI e sem Streamlit no login).
Fluxo: `mobile -> Supabase`.

## 1) Configurar variaveis do Supabase

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Edite `app-mobile/.env` e defina:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY
```

## 2) Criar funcoes RPC no banco

No Supabase SQL Editor, execute:

`supabase/sql/mobile_direct_api.sql`

Esse script cria as funcoes `mobile_*` usadas pelo app.

## 3) Reiniciar Expo

```bash
npx expo start -c
```

## 4) Importante sobre segredos

- Nao coloque segredos no app mobile.
- `EXPO_PUBLIC_*` e visivel no app compilado.
- Nao use `DB_URL`, `service_role` ou qualquer token sensivel no app.
