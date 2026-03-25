-- Contatos captados
create table contatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text unique not null,
  email text,
  endereco text,
  bairro text,
  cidade text,
  cep text,
  zona_id uuid references zonas_eleitorais(id),
  segmento_id uuid references segmentos(id),
  responsavel_user_id uuid references profiles(id),
  origem_cadastro text check (origem_cadastro in ('link_individual','qr_code','importacao','cadastro_manual')) default 'link_individual',
  observacoes text,
  created_at timestamptz default now()
);

-- Indicações (vínculo indicador → contato)
create table indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicador_user_id uuid references profiles(id),
  contato_id uuid references contatos(id) on delete cascade,
  link_codigo text,
  origem text,
  created_at timestamptz default now()
);

-- RLS
alter table contatos enable row level security;
alter table indicacoes enable row level security;

-- Gestor vê tudo
create policy "gestor_all_contatos" on contatos
  for all using (get_perfil() = 'gestor_geral');

-- Coordenador vê contatos da sua zona
create policy "coord_select_contatos" on contatos
  for select using (
    get_perfil() = 'coordenador_zona'
    and zona_id = get_zona_id()
  );

-- Liderança vê apenas seus próprios contatos
create policy "lider_select_contatos" on contatos
  for select using (
    get_perfil() = 'lideranca'
    and responsavel_user_id = auth.uid()
  );

-- Liderança pode inserir contatos (vínculo definido no backend)
create policy "lider_insert_contatos" on contatos
  for insert with check (
    get_perfil() in ('gestor_geral', 'coordenador_zona', 'lideranca')
  );

-- Indicações: gestor vê tudo
create policy "gestor_all_indicacoes" on indicacoes
  for all using (get_perfil() = 'gestor_geral');

-- Cada usuário vê suas próprias indicações
create policy "user_select_indicacoes" on indicacoes
  for select using (indicador_user_id = auth.uid());
