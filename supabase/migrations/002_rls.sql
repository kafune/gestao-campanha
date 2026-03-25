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
