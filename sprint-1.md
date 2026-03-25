# Sprint 1 — Base Estrutural

**Meta:** sistema rodando na VPS com auth, permissões, e cadastros base funcionando.

---

## Entregas do Sprint

- [ ] Repositório criado e estruturado
- [ ] Supabase configurado (tabelas + RLS)
- [ ] Auth completo: login, logout, recuperação de senha
- [ ] Cadastro de zonas eleitorais
- [ ] Cadastro de segmentos
- [ ] Cadastro de usuários com hierarquia
- [ ] Deploy manual na VPS rodando (Nginx + Docker)

---

## Estrutura do Repositório

```
campanha/
├── frontend/               # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── RecuperarSenha.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Usuarios.tsx
│   │   │   ├── Zonas.tsx
│   │   │   └── Segmentos.tsx
│   │   ├── lib/
│   │   │   └── supabase.ts       # cliente Supabase
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Fastify + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── usuarios.ts
│   │   │   ├── zonas.ts
│   │   │   └── segmentos.ts
│   │   ├── plugins/
│   │   │   └── supabaseAuth.ts   # middleware JWT
│   │   ├── lib/
│   │   │   └── supabase.ts       # cliente admin (service_role)
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 001_tabelas_base.sql
│       └── 002_rls.sql
│
├── docker-compose.yml
├── deploy.sh
└── README.md
```

---

## Passo 1 — Supabase: Tabelas e RLS

### 001_tabelas_base.sql

```sql
-- Extensão para UUIDs
create extension if not exists "pgcrypto";

-- Zonas eleitorais
create table zonas_eleitorais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text unique,
  observacoes text,
  created_at timestamptz default now()
);

-- Segmentos
create table segmentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text check (tipo in ('igreja','associacao','sindicato','lideranca_comunitaria')),
  created_at timestamptz default now()
);

-- Perfis públicos (espelho do Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  whatsapp text unique,
  perfil text not null check (perfil in ('gestor_geral','coordenador_zona','lideranca','apoiador')),
  status text default 'ativo' check (status in ('ativo','inativo','pendente')),
  coordenador_id uuid references profiles(id),
  zona_id uuid references zonas_eleitorais(id),
  segmento_id uuid references segmentos(id),
  link_codigo text unique default substring(gen_random_uuid()::text, 1, 8),
  created_at timestamptz default now()
);
```

### 002_rls.sql

```sql
-- Habilitar RLS em todas as tabelas
alter table profiles enable row level security;
alter table zonas_eleitorais enable row level security;
alter table segmentos enable row level security;

-- Helper: retorna perfil do usuário logado
create or replace function get_perfil()
returns text as $$
  select perfil from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper: retorna zona do usuário logado
create or replace function get_zona_id()
returns uuid as $$
  select zona_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- =====================
-- PROFILES
-- =====================

-- Gestor vê tudo
create policy "gestor_select_all" on profiles
  for select using (get_perfil() = 'gestor_geral');

-- Coordenador vê usuários da sua zona
create policy "coord_select_zona" on profiles
  for select using (
    get_perfil() = 'coordenador_zona'
    and zona_id = get_zona_id()
  );

-- Liderança vê apenas si mesmo e seus apoiadores diretos
create policy "lider_select_own" on profiles
  for select using (
    id = auth.uid()
    or (get_perfil() = 'lideranca' and coordenador_id = auth.uid())
  );

-- Qualquer autenticado pode ver o próprio perfil
create policy "self_select" on profiles
  for select using (id = auth.uid());

-- Somente gestor pode inserir/editar usuários
create policy "gestor_insert" on profiles
  for insert with check (get_perfil() = 'gestor_geral');

create policy "gestor_update" on profiles
  for update using (get_perfil() = 'gestor_geral');

-- =====================
-- ZONAS ELEITORAIS
-- =====================

-- Todos os autenticados podem ler zonas
create policy "auth_select_zonas" on zonas_eleitorais
  for select using (auth.uid() is not null);

-- Somente gestor gerencia zonas
create policy "gestor_manage_zonas" on zonas_eleitorais
  for all using (get_perfil() = 'gestor_geral');

-- =====================
-- SEGMENTOS
-- =====================

create policy "auth_select_segmentos" on segmentos
  for select using (auth.uid() is not null);

create policy "gestor_manage_segmentos" on segmentos
  for all using (get_perfil() = 'gestor_geral');

-- =====================
-- TRIGGER: criar profile ao registrar usuário
-- =====================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Sem nome'),
    coalesce(new.raw_user_meta_data->>'perfil', 'apoiador')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## Passo 2 — Backend (Fastify)

### .env.example

```env
PORT=4001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### src/plugins/supabaseAuth.ts

```typescript
import fp from 'fastify-plugin'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default fp(async (fastify) => {
  fastify.addHook('preHandler', async (request: any, reply) => {
    // Rotas públicas não precisam de auth
    const publicRoutes = ['/health', '/auth/login', '/auth/recuperar']
    if (publicRoutes.includes(request.url)) return

    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) return reply.status(401).send({ error: 'Token não fornecido' })

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return reply.status(401).send({ error: 'Token inválido' })

    request.user = user
  })
})
```

### src/routes/auth.ts

```typescript
// O login/logout/recuperação de senha são feitos direto no frontend
// via supabase-js. O backend expõe apenas /auth/me para validar sessão.

export default async function authRoutes(fastify: any) {
  fastify.get('/auth/me', async (request: any) => {
    const { data } = await fastify.supabase
      .from('profiles')
      .select('*')
      .eq('id', request.user.id)
      .single()
    return data
  })
}
```

### src/routes/usuarios.ts

```typescript
export default async function usuariosRoutes(fastify: any) {
  // Listar usuários (RLS filtra automaticamente pelo perfil)
  fastify.get('/usuarios', async (request: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, zonas_eleitorais(nome), segmentos(nome)')
      .order('nome')
    if (error) return { error }
    return data
  })

  // Criar usuário (gestor_geral apenas — RLS garante)
  fastify.post('/usuarios', async (request: any, reply: any) => {
    const { email, senha, nome, perfil, zona_id, coordenador_id, whatsapp } = request.body

    // Criar no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      user_metadata: { nome, perfil }
    })
    if (authError) return reply.status(400).send({ error: authError.message })

    // Atualizar profile com dados extras
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ nome, perfil, zona_id, coordenador_id, whatsapp })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return data
  })
}
```

---

## Passo 3 — Frontend (Vite + React)

### .env.example

```env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### src/hooks/useAuth.ts

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function login(email: string, senha: string) {
    return supabase.auth.signInWithPassword({ email, password: senha })
  }

  async function logout() {
    return supabase.auth.signOut()
  }

  async function recuperarSenha(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`
    })
  }

  return { user, profile, loading, login, logout, recuperarSenha }
}
```

### Roteamento com proteção por perfil

```typescript
// src/App.tsx
function ProtectedRoute({ children, perfis }: { children: React.ReactNode, perfis?: string[] }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" />
  if (perfis && !perfis.includes(profile?.perfil)) return <Navigate to="/dashboard" />
  return <>{children}</>
}

// Uso:
<Route path="/usuarios" element={
  <ProtectedRoute perfis={['gestor_geral']}>
    <Usuarios />
  </ProtectedRoute>
} />
```

---

## Passo 4 — Docker e Deploy

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: ./frontend
    volumes:
      - ./frontend/dist:/app/dist
    # O build é feito localmente — o container apenas serve o artefato via Nginx

  api:
    build:
      context: ./backend
    env_file:
      - ./backend/.env
    ports:
      - "4001:4001"   # Porta diferente do rede-guti (4000)
    restart: unless-stopped
```

### deploy.sh

```bash
#!/bin/bash
set -e

echo "==> Pull do repositório"
git pull origin main

echo "==> Build do frontend (local, não na VPS)"
cd frontend
npm install
npm run build
cd ..

echo "==> Sincronizando dist para a VPS"
rsync -av --delete frontend/dist/ /var/www/campanha/dist/

echo "==> Rebuild e restart do backend"
docker-compose build api
docker-compose up -d api

echo "==> Reload Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy concluído"
```

### Nginx — /etc/nginx/sites-available/campanha

```nginx
server {
    listen 80;
    server_name campanha.seudominio.com;

    root /var/www/campanha/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Ativar e gerar SSL
sudo ln -sf /etc/nginx/sites-available/campanha /etc/nginx/sites-enabled/campanha
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d campanha.seudominio.com
```

---

## Checklist de Validação do Sprint 1

### Supabase
- [ ] Tabelas criadas: `profiles`, `zonas_eleitorais`, `segmentos`
- [ ] Trigger `on_auth_user_created` funcionando
- [ ] RLS testada: coordenador não vê dados de outra zona
- [ ] RLS testada: liderança vê apenas seus próprios dados
- [ ] Usuário gestor_geral criado manualmente no Supabase Auth

### Backend
- [ ] `GET /health` retorna 200
- [ ] `GET /auth/me` retorna profile do usuário logado
- [ ] `GET /usuarios` filtra por perfil corretamente
- [ ] `POST /usuarios` cria usuário no Auth + atualiza profile
- [ ] `GET /zonas` e `POST /zonas` funcionando
- [ ] `GET /segmentos` e `POST /segmentos` funcionando

### Frontend
- [ ] Login funciona e persiste sessão
- [ ] Logout limpa sessão corretamente
- [ ] Recuperação de senha envia e-mail pelo Supabase
- [ ] Rota protegida redireciona não autenticado para /login
- [ ] Rota de gestor bloqueia coordenador/liderança
- [ ] Tela de usuários lista corretamente por perfil
- [ ] Tela de zonas: listar e criar
- [ ] Tela de segmentos: listar e criar

### Infraestrutura
- [ ] Container do backend rodando na porta 4001
- [ ] Nginx servindo o frontend em campanha.seudominio.com
- [ ] SSL ativo via Certbot
- [ ] `deploy.sh` executado com sucesso
- [ ] rede-guti continua funcionando sem interrupção

---

## Riscos Específicos do Sprint 1

| Risco | Mitigação |
|---|---|
| Trigger do Supabase não disparar ao criar usuário | Testar manualmente no Supabase Studio antes de conectar o backend |
| RLS bloqueando o próprio gestor | Testar com `select get_perfil()` no SQL Editor logado como gestor |
| Porta 4001 já em uso na VPS | Verificar com `sudo ss -tlnp` antes do deploy |
| `.env` com chave errada do Supabase | Usar `service_role` no backend, `anon` no frontend — nunca ao contrário |
| `certbot` falhar por DNS não propagado | Aguardar propagação DNS antes de rodar o certbot |
