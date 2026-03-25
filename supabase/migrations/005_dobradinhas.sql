-- Dobradinhas
create table dobradinhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  responsavel_user_id uuid references profiles(id),
  descricao text,
  ativa boolean default true,
  created_at timestamptz default now()
);

-- Locais de votação (escolas/seções)
create table locais_votacao (
  id uuid primary key default gen_random_uuid(),
  nome_local text not null,
  endereco text,
  zona_id uuid references zonas_eleitorais(id),
  secao_observacao text,
  created_at timestamptz default now()
);

-- Metas por dobradinha × local de votação
create table metas_dobradinha (
  id uuid primary key default gen_random_uuid(),
  dobradinha_id uuid references dobradinhas(id) on delete cascade,
  local_votacao_id uuid references locais_votacao(id) on delete cascade,
  meta_votos integer not null default 0,
  observacoes text,
  created_at timestamptz default now(),
  unique (dobradinha_id, local_votacao_id)
);

-- RLS
alter table dobradinhas enable row level security;
alter table locais_votacao enable row level security;
alter table metas_dobradinha enable row level security;

-- Gestor gerencia tudo
create policy "gestor_all_dobradinhas" on dobradinhas
  for all using (get_perfil() = 'gestor_geral');

create policy "gestor_all_locais" on locais_votacao
  for all using (get_perfil() = 'gestor_geral');

create policy "gestor_all_metas" on metas_dobradinha
  for all using (get_perfil() = 'gestor_geral');

-- Responsável vê e edita sua própria dobradinha
create policy "responsavel_select_dobradinha" on dobradinhas
  for select using (responsavel_user_id = auth.uid());

create policy "responsavel_update_dobradinha" on dobradinhas
  for update using (responsavel_user_id = auth.uid());

-- Responsável acessa metas da sua dobradinha
create policy "responsavel_select_metas" on metas_dobradinha
  for select using (
    dobradinha_id in (
      select id from dobradinhas where responsavel_user_id = auth.uid()
    )
  );

-- Qualquer autenticado lê locais (necessário para selects de formulário)
create policy "auth_select_locais" on locais_votacao
  for select using (auth.uid() is not null);
