export type Perfil = 'gestor_geral' | 'coordenador_zona' | 'lideranca' | 'apoiador'
export type Status = 'ativo' | 'inativo' | 'pendente'
export type TipoSegmento = 'igreja' | 'associacao' | 'sindicato' | 'lideranca_comunitaria'

export interface Profile {
  id: string
  nome: string
  whatsapp: string | null
  perfil: Perfil
  status: Status
  coordenador_id: string | null
  zona_id: string | null
  segmento_id: string | null
  link_codigo: string
  created_at: string
  zonas_eleitorais?: { nome: string } | null
  segmentos?: { nome: string } | null
}

export interface ZonaEleitoral {
  id: string
  nome: string
  codigo: string | null
  numero: number | null
  regiao_principal: string | null
  bairros: string[] | null
  observacoes: string | null
  created_at: string
}

export interface Segmento {
  id: string
  nome: string
  tipo: TipoSegmento
  created_at: string
}

export interface LocalVotacao {
  id: string
  nome_local: string
  endereco: string | null
  zona_id: string | null
  secao_observacao: string | null
  created_at: string
  zonas_eleitorais?: { nome: string } | null
}

export interface MetaDobradinha {
  id: string
  dobradinha_id: string
  local_votacao_id: string
  meta_votos: number
  observacoes: string | null
  created_at: string
  locais_votacao?: LocalVotacao | null
}

export interface Dobradinha {
  id: string
  nome: string
  responsavel_user_id: string | null
  descricao: string | null
  ativa: boolean
  created_at: string
  profiles?: { id: string; nome: string } | null
  metas_dobradinha?: MetaDobradinha[]
  total_locais?: number
  meta_total?: number
}
