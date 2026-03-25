# Gestão de Campanha — CLAUDE.md

## O que é esse projeto

Sistema de gestão de campanha eleitoral. MVP para cadastro hierárquico de usuários, links de indicação, captação de apoiadores, registro de ações de campo e dashboards por perfil.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS — porta `5174` em dev
- **Backend:** Fastify + TypeScript — porta `4001`
- **Banco/Auth:** Supabase Postgres + Supabase Auth + RLS
- **Infra:** VPS compartilhada com projeto `rede-guti`, Nginx server block separado, Docker Compose isolado

## Estrutura

```
gestao-campanha/
├── frontend/               # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/          # Login, RecuperarSenha, Dashboard, Usuarios, Zonas, Segmentos
│   │   ├── hooks/          # useAuth.ts
│   │   ├── lib/            # supabase.ts (cliente anon)
│   │   └── types/          # index.ts
│   ├── .env                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│   └── .env.example
│
├── backend/                # Fastify + TypeScript
│   ├── src/
│   │   ├── routes/         # auth.ts, usuarios.ts, zonas.ts, segmentos.ts
│   │   ├── plugins/        # supabaseAuth.ts (middleware JWT)
│   │   └── lib/            # supabase.ts (admin + getSupabaseForUser)
│   ├── .env                # PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
│   └── .env.example
│
├── supabase/migrations/
│   ├── 001_tabelas_base.sql
│   └── 002_rls.sql
│
├── docker-compose.yml      # só o backend em container
└── deploy.sh
```

## Rodar localmente

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

## Perfis de usuário

| Perfil | Acesso |
|---|---|
| `gestor_geral` | Tudo |
| `coordenador_zona` | Usuários e dados da sua zona |
| `lideranca` | Próprios contatos e ações |
| `apoiador` | Apenas próprio perfil |

## Regras críticas — convivência com rede-guti na VPS

- **NUNCA** editar o bloco Nginx do rede-guti (`/etc/nginx/sites-available/rede`)
- **NUNCA** apontar para `localhost:5432` (banco do rede-guti)
- Backend deste projeto sempre na porta **4001** (rede-guti usa 4000)
- Frontend dev sempre na porta **5174** (rede-guti usa 5173)
- Banco sempre via Supabase (connection string externa), nunca Postgres local
- Build do frontend feito **localmente ou em CI**, nunca na VPS (pouca RAM)

## Autenticação

- Login/logout/recuperação de senha: feito direto no frontend via `supabase-js`
- O backend valida o JWT do Supabase no middleware `supabaseAuth.ts`
- Backend usa `SERVICE_ROLE_KEY` (admin), frontend usa `ANON_KEY`
- RLS no banco filtra dados automaticamente pelo perfil do usuário

## Banco de dados

### Tabelas ativas (Sprint 1)
- `profiles` — espelho do Supabase Auth com perfil, zona, segmento, link_codigo
- `zonas_eleitorais`
- `segmentos`

### Tabelas futuras
- `contatos`, `indicacoes`, `acoes_campo`
- `dobradinhas`, `locais_votacao`, `metas_dobradinha`
- `grupos_whatsapp`, `audit_logs`

### Helper functions no banco
- `get_perfil()` — retorna perfil do usuário logado (usado nas policies RLS)
- `get_zona_id()` — retorna zona_id do usuário logado

### Trigger
- `on_auth_user_created` — cria registro em `profiles` ao registrar novo usuário no Auth

## Sprints

| Sprint | Foco | Status |
|---|---|---|
| 1 | Base estrutural: auth, perfis, zonas, segmentos, deploy | Em andamento |
| 2 | Captação: links únicos, autocadastro, indicações, deduplicação | Pendente |
| 3 | Operação: ações de campo, dashboards, ranking | Pendente |
| 4 | Dobradinhas: cadastro, locais de votação, metas | Pendente |
| 5 | Escala: QR codes, exportação, auditoria, importação | Pendente |

## Deploy

```bash
./deploy.sh
```

O script faz: `git pull` → build do frontend → rsync do dist → rebuild do container backend → reload Nginx.

### Nginx
- Config: `/etc/nginx/sites-available/campanha`
- Frontend servido de `/var/www/campanha/dist`
- API proxiada de `/api/` → `http://127.0.0.1:4001/`

## Observações técnicas

- O trigger `handle_new_user` usa `security definer set search_path = public` — necessário para referenciar `public.profiles` corretamente no Supabase
- `getSupabaseForUser(authorization)` no backend cria um cliente com o JWT do usuário para que o RLS seja aplicado nas queries
- Rotas públicas do backend: `/health`, `/auth/login`, `/auth/recuperar` (não passam pelo middleware de auth)
