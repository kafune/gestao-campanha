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
