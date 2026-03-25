create table acoes_campo (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo_acao text not null check (tipo_acao in ('visita','reuniao_casa','reuniao_igreja','cafe_lideranca','evento_pequeno','evento_macro')),
  descricao text,
  anfitriao_nome text,
  anfitriao_telefone text,
  anfitriao_email text,
  endereco text,
  zona_id uuid references zonas_eleitorais(id),
  responsavel_user_id uuid references profiles(id),
  coordenador_user_id uuid references profiles(id),
  data_acao date not null,
  created_at timestamptz default now()
);

alter table acoes_campo enable row level security;

-- Gestor vê tudo
create policy "gestor_all_acoes" on acoes_campo
  for all using (get_perfil() = 'gestor_geral');

-- Coordenador vê ações da sua zona
create policy "coord_select_acoes" on acoes_campo
  for select using (
    get_perfil() = 'coordenador_zona'
    and zona_id = get_zona_id()
  );

-- Liderança vê apenas suas próprias ações
create policy "lider_select_acoes" on acoes_campo
  for select using (
    get_perfil() = 'lideranca'
    and responsavel_user_id = auth.uid()
  );

-- Usuários autenticados podem inserir ações
create policy "auth_insert_acoes" on acoes_campo
  for insert with check (
    get_perfil() in ('gestor_geral', 'coordenador_zona', 'lideranca')
  );
