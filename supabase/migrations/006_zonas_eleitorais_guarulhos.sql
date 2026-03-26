-- Migration 006: expande zonas_eleitorais e importa dados reais de Guarulhos

alter table zonas_eleitorais
  add column if not exists numero           integer unique,
  add column if not exists regiao_principal text,
  add column if not exists bairros          text[];

-- Seed dos dados reais (idempotente via ON CONFLICT no codigo)
insert into zonas_eleitorais (nome, numero, codigo, regiao_principal, bairros)
values
  (
    '176ª ZE', 176, '176',
    'Centro e região Sul',
    ARRAY['Centro','Cocaia','Jardim Cocaia','Parque Cecap Zezinho de Magalhães Prado',
          'Vila Tijuco','Jardim Bom Clima','Jardim Tranquilidade','Jardim Santa Lidia']
  ),
  (
    '278ª ZE', 278, '278',
    'Ponte Grande / Gopouva / Itapegica',
    ARRAY['Gopouva','Ponte Grande','Itapegica','Vila Sorocabana','Cabuçu','Lavras','Jardim Fortaleza']
  ),
  (
    '279ª ZE', 279, '279',
    'Taboão / Jardim Mikail / Praça VIII',
    ARRAY['Taboão','Jardim Paraíso','Jardim Mikail','Praça VIII','Jardim Acácio',
          'Jardim Nova Taboão','Jardim Santa Rita','Parque das Laranjeiras','Vila Flórida']
  ),
  (
    '393ª ZE', 393, '393',
    'Vila Galvão / Vila Rosália / Recreio São Jorge',
    ARRAY['Vila Galvão','Vila Rosália','Recreio São Jorge','Jardim Palmira','Jardim Betel',
          'Jardim Rosa de França','Parque Continental II','Jardim Flor da Montanha',
          'Jardim Las Vegas','Jardim Santa Mena','Jardim Aliança']
  ),
  (
    '394ª ZE', 394, '394',
    'Jardim Presidente Dutra / São João / Bonsucesso',
    ARRAY['Jardim Presidente Dutra','Jardim São João','Bonsucesso','Ponte Alta',
          'Jardim Santa Paula','Chácara das Lavras','Jardim Quarto Centenário',
          'Vila Carmela I','Água Azul','Cidade Soberana']
  ),
  (
    '395ª ZE', 395, '395',
    'Cumbica e adjacências',
    ARRAY['Cidade Jardim Cumbica','Jardim Cumbica','Parque Uirapuru',
          'Conjunto Inocoop-Bonsucesso','Residencial Parque Cumbica',
          'Jardim das Nações','Vila Paraíso']
  ),
  (
    '185ª ZE', 185, '185',
    'Bairro dos Pimentas',
    ARRAY['Bairro dos Pimentas','Água Chata','Alvorada','Aracília','Dinamarca','Itaim']
  )
on conflict (codigo) do update set
  numero           = excluded.numero,
  regiao_principal = excluded.regiao_principal,
  bairros          = excluded.bairros;
