# Roadmap Técnico — Sistema de Gestão de Campanha

> Versão atualizada com stack definida: VPS (Vite + React + Fastify) + Supabase (Postgres + Auth)

---

## 1. Objetivo do MVP

Construir a primeira versão funcional do sistema para:

- Cadastrar usuários por hierarquia
- Gerar links únicos de indicação
- Captar apoiadores via autocadastro
- Registrar ações de campo
- Visualizar dados em dashboards por perfil
- Estruturar base territorial por zona eleitoral

A lógica do MVP deve validar o modelo operacional da campanha antes de avançar para automações mais complexas.

---

## 2. Stack Definida

### Front-end (VPS)
- **Vite + React** (mesma base do projeto rede-guti)
- **TypeScript**
- **Tailwind CSS** para padronização visual

### Back-end (VPS)
- **Fastify** (mesma base do projeto rede-guti)
- **TypeScript**
- **@supabase/supabase-js** para comunicação com o banco
- **JWT via Supabase Auth** (substitui o JWT próprio do rede-guti)

### Banco de dados / Auth
- **Supabase Postgres** — banco principal
- **Supabase Auth** — autenticação e JWT
- **Row Level Security (RLS)** — controle de acesso no banco

### Infraestrutura (VPS compartilhada com rede-guti)
- **Nginx** — proxy reverso com server block separado
- **Docker Compose** — containers isolados do rede-guti
- **Certbot** — SSL via novo domínio/subdomínio
- **PM2 ou Docker** — gerenciamento do processo

---

## 3. Convivência com o rede-guti na VPS

### Separação obrigatória

| Recurso | rede-guti | Este projeto |
|---|---|---|
| Domínio | redeguti.ddns.net | subdomínio próprio (ex: campanha.seudominio.com) |
| Porta Fastify | 4000 | **4001** |
| Porta front (dev) | 5173 | **5174** |
| Banco | Postgres local (Docker, porta 5432) | Supabase (externo) |
| Nginx config | /etc/nginx/sites-available/rede | /etc/nginx/sites-available/campanha |
| Docker network | padrão | rede isolada própria |

### Regras críticas

- **Nunca editar** o bloco Nginx do rede-guti
- **Nunca apontar** `DATABASE_URL` para `localhost:5432` (banco do rede-guti)
- **Sempre usar** a connection string do Supabase no `.env`
- Fazer o `next build` / `vite build` **localmente ou em CI** para evitar travar a VPS por falta de RAM
- Certificado SSL solicitado para o novo domínio **separadamente** via `certbot --nginx -d campanha.seudominio.com`

### Bloco Nginx do novo projeto

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

---

## 4. Modelagem do Banco (Supabase Postgres)

### Tabelas principais

**users** (gerenciada via Supabase Auth + tabela pública de perfil)
```
id, nome, email, whatsapp, perfil, status,
coordenador_id, zona_id, segmento_id, link_codigo, created_at
```

**roles** — perfis do sistema
```
gestor_geral | coordenador_zona | lideranca | apoiador
```

**zonas_eleitorais**
```
id, nome, codigo, observacoes
```

**segmentos**
```
id, nome, tipo (igreja | associacao | sindicato | lideranca_comunitaria)
```

**contatos**
```
id, nome, whatsapp, email, endereco, bairro, cidade, cep,
zona_id, segmento_id, responsavel_user_id, origem_cadastro, observacoes, created_at
```

**indicacoes**
```
id, indicador_user_id, indicado_user_id, link_codigo, origem, created_at
```

**acoes_campo**
```
id, titulo, tipo_acao, descricao, anfitriao_nome, anfitriao_telefone,
anfitriao_email, endereco, zona_id, responsavel_user_id,
coordenador_user_id, data_acao, created_at
```

**dobradinhas**
```
id, nome, responsavel_user_id, descricao, ativa
```

**locais_votacao**
```
id, nome_local, endereco, zona_id, secao_observacao
```

**metas_dobradinha**
```
id, dobradinha_id, local_votacao_id, meta_votos, observacoes
```

**grupos_whatsapp**
```
id, nome, dobradinha_id, link_grupo, qr_code_url, mensagem_boas_vindas, ativo
```

**audit_logs**
```
id, tabela, operacao, user_id, dados_anteriores, dados_novos, created_at
```

---

## 5. Autenticação e Permissões

### Supabase Auth

- Login por e-mail e senha
- Recuperação de senha via Supabase
- JWT emitido pelo Supabase, validado no Fastify via `@supabase/supabase-js`
- Ativação manual ou automática de usuários

### Middleware Fastify

```typescript
// Substituir o JWT próprio do rede-guti pelo Supabase Auth
fastify.addHook('preHandler', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return reply.status(401).send({ error: 'Unauthorized' })
  request.user = user
})
```

### RLS por perfil

**Gestor geral** — acesso total a todas as tabelas

**Coordenador de zona**
```sql
-- Lê apenas usuários da sua zona
CREATE POLICY coord_users ON users
  FOR SELECT USING (zona_id = (SELECT zona_id FROM users WHERE id = auth.uid()));
```

**Liderança**
```sql
-- Lê apenas seus próprios contatos
CREATE POLICY lider_contatos ON contatos
  FOR SELECT USING (responsavel_user_id = auth.uid());
```

**Apoiador** — acesso mínimo, apenas leitura/edição do próprio perfil

---

## 6. Fluxo de Cadastro e Indicação

### Links únicos

- Cada usuário captador recebe um `link_codigo` único gerado no cadastro
- URL pública: `/cadastro?ref=abc123`
- Código armazenado na tabela `users.link_codigo`

### Fluxo de autocadastro

1. Usuário acessa `/cadastro?ref=abc123`
2. Front lê o parâmetro `ref` e envia junto ao formulário
3. Fastify identifica o indicador pelo `link_codigo`
4. Cria registro em `contatos`
5. Cria registro em `indicacoes` vinculando indicador → novo contato
6. Atribui `responsavel_user_id` automaticamente ao indicador

### Regras de deduplicação

- WhatsApp é o campo primário de unicidade
- E-mail é secundário
- Se já existir: atualizar vínculo/origem conforme regra definida, não criar duplicata
- Origem registrada: `link_individual | qr_code | importacao | cadastro_manual`

### Campos do formulário público

```
nome, whatsapp, email, endereco, bairro, segmento, zona_eleitoral, observacoes
```

---

## 7. Dashboards por Perfil

### Gestor Geral
- Total de coordenadores, lideranças, apoiadores, contatos
- Total de ações de campo
- Contatos por zona eleitoral
- Ranking de captação por usuário
- Crescimento por período

### Coordenador de Zona
- Equipe ativa na zona
- Contatos captados na zona
- Ações realizadas
- Ranking de lideranças
- Produtividade por bairro

### Liderança
- Total de contatos próprios
- Ações realizadas
- Taxa de crescimento da rede
- Próximas pendências

---

## 8. Registro de Ações de Campo

### Tipos de ação
`visita | reuniao_casa | reuniao_igreja | cafe_lideranca | evento_pequeno | evento_macro`

### Dados mínimos
```
tipo_acao, data_acao, endereco, zona_id,
anfitriao_nome, anfitriao_telefone, anfitriao_email,
responsavel_user_id, observacoes
```

### Regras
- Ação vinculada ao responsável que registrou
- Coordenador vê ações da sua zona
- Gestor vê tudo via RLS

### Evolução futura (pós-MVP)
- Anexos e fotos
- Check-in por geolocalização
- Score de engajamento por tipo de ação

---

## 9. Módulo de Dobradinhas

### Estrutura separada da equipe direta

- Lógica própria para evitar ruído político
- Responsáveis cadastrados independentemente da hierarquia principal

### Fluxo
1. Cadastrar dobradinha
2. Associar responsável
3. Cadastrar locais de votação (escolas)
4. Definir meta de votos por local
5. Consolidar meta total por dobradinha

### Dashboard da Dobradinha
- Total de locais cadastrados
- Meta total vs. meta por escola
- Equipe vinculada
- Status de execução

---

## 10. QR Codes e Captação Macro

### Links genéricos por dobradinha
- Cada dobradinha tem link e QR code próprio
- QR Code → landing rastreável → botão WhatsApp

### Vantagem operacional
- Mesmo que o WhatsApp seja externo, a entrada passa pela página do sistema
- Métricas disponíveis: acessos por dobradinha, conversão por evento

---

## 11. Administração e Qualidade de Dados

### Área administrativa (gestor)
- Editar usuários e mover vínculos
- Corrigir contatos duplicados
- Importar planilhas
- Exportar dados

### Higienização
- Normalizar telefone (formato único)
- Validar e-mail
- Padronizar bairros
- Regra de unicidade por WhatsApp

### Auditoria
- Logs em `audit_logs` para: criação, edição, exclusão, troca de vínculo, mudança de perfil

---

## 12. Estrutura de Telas

### Telas públicas
- Landing de entrada
- Formulário de autocadastro (`/cadastro?ref=...`)
- Página de confirmação
- Página intermediária para grupo WhatsApp

### Telas autenticadas
- Login
- Dashboard (renderização condicional por perfil)
- Cadastro de contatos
- Cadastro de ação de campo
- Cadastro de usuário
- Cadastro de zona eleitoral
- Cadastro de dobradinha
- Cadastro de local de votação
- Relatórios e exportação
- Área administrativa

---

## 13. Ordem de Desenvolvimento (Sprints)

### Sprint 1 — Base estrutural
- Estrutura do projeto (Vite + React + Fastify)
- Configuração do Supabase (tabelas, RLS básica)
- Integração Supabase Auth no Fastify
- Perfis e zonas
- Deploy inicial na VPS com Nginx configurado

### Sprint 2 — Captação
- Links únicos por usuário
- Formulário de autocadastro público
- Tabela de indicações
- Vínculo automático indicador → contato
- Deduplicação por WhatsApp

### Sprint 3 — Operação
- Cadastro de ações de campo
- Dashboards básicos por perfil
- Ranking de captação
- Relatórios simples

### Sprint 4 — Dobradinhas
- Cadastro de dobradinha e responsável
- Locais de votação e metas
- Painel resumido da dobradinha

### Sprint 5 — Escala e refinamento
- QR Codes e landing de rastreamento
- Exportação de dados
- Logs de auditoria
- Importação de planilhas
- Ajustes de UX e performance

---

## 14. MVP Mínimo de Verdade

Se quiser validar rápido, o menor MVP possível é:

1. Login via Supabase Auth
2. Perfis de usuário (gestor, coordenador, liderança)
3. Cadastro de zonas eleitorais
4. Cadastro de usuários com vínculo hierárquico
5. Link único por liderança/coordenador
6. Formulário público de autocadastro
7. Vínculo automático de quem indicou
8. Dashboard com: total captados, captados por usuário, captados por zona

Com isso já é possível testar a lógica principal da campanha.

---

## 15. Riscos Técnicos

| Risco | Solução |
|---|---|
| Duplicidade de contatos | Unicidade por WhatsApp (campo único no banco) |
| Permissões mal configuradas | RLS testada antes do deploy em produção |
| Conflito com rede-guti na VPS | Server block e porta separados, `.env` apontando apenas para Supabase |
| RAM insuficiente na VPS durante build | Build local ou via GitHub Actions, subir apenas o artefato |
| Crescimento desorganizado | Zonas, segmentos e vínculos padronizados desde o início |
| Dependência excessiva do WhatsApp | Página rastreável antes de redirecionar ao grupo |
| Mudança de estratégia na campanha | Modelagem flexível: campos opcionais, tipos de ação extensíveis |
