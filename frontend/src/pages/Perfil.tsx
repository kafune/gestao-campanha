import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'

export default function Perfil() {
  const { profile } = useAuth()

  const PERFIL_LABEL: Record<string, string> = {
    gestor_geral: 'Gestor Geral',
    coordenador_zona: 'Coordenador de Zona',
    lideranca: 'Liderança',
    apoiador: 'Apoiador'
  }

  const linkIndicacao = profile?.link_codigo
    ? `${window.location.origin}/cadastro?ref=${profile.link_codigo}`
    : null

  return (
    <Layout>
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Meu Perfil</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InfoCard label="Nome" value={profile?.nome} />
        <InfoCard label="Perfil" value={PERFIL_LABEL[profile?.perfil ?? ''] ?? profile?.perfil} />
        <InfoCard label="Zona Eleitoral" value={(profile?.zonas_eleitorais as any)?.nome ?? '—'} />
        <InfoCard label="Segmento" value={(profile?.segmentos as any)?.nome ?? '—'} />
        <InfoCard label="Status" value={profile?.status} />
        <InfoCard label="Membro desde" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'} />
      </div>

      {linkIndicacao && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Seu link de indicação</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={linkIndicacao}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
            <button
              onClick={() => navigator.clipboard.writeText(linkIndicacao)}
              className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Código: {profile?.link_codigo}</p>
        </div>
      )}
    </Layout>
  )
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-5 py-4">
      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value ?? '—'}</p>
    </div>
  )
}
