import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!user?.access_token) return
    fetch(`${API}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${user.access_token}` }
    })
      .then(r => r.json())
      .then(setStats)
  }, [user])

  const perfil = profile?.perfil

  return (
    <Layout>
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Dashboard</h2>

      {/* Cards de totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Contatos" value={stats?.totalContatos ?? '—'} />
        <StatCard label="Ações de Campo" value={stats?.totalAcoes ?? '—'} />
        {perfil === 'gestor_geral' && <>
          <StatCard label="Coordenadores" value={stats?.totalUsuarios?.coordenador_zona ?? 0} />
          <StatCard label="Lideranças" value={stats?.totalUsuarios?.lideranca ?? 0} />
        </>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Contatos por zona */}
        {perfil === 'gestor_geral' && stats?.contatosPorZona?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <h3 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-200">Contatos por Zona</h3>
            <ul className="space-y-2">
              {stats.contatosPorZona.map((z: any) => (
                <li key={z.nome} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{z.nome}</span>
                  <span className="font-semibold text-brand-500">{z.total}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ranking de captação */}
        {(perfil === 'gestor_geral' || perfil === 'coordenador_zona') && stats?.ranking?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <h3 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-200">Ranking de Captação</h3>
            <ol className="space-y-2">
              {stats.ranking.slice(0, 10).map((r: any, i: number) => (
                <li key={r.nome} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 w-5 text-right">{i + 1}.</span>
                  <span className="flex-1 text-gray-600 dark:text-gray-300">{r.nome}</span>
                  <span className="font-semibold text-accent-500">{r.total}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NavCard to="/acoes" label="Ações de Campo" />
        <NavCard to="/dobradinhas" label="Dobradinhas" />
        {perfil === 'gestor_geral' && <>
          <NavCard to="/usuarios" label="Usuários" />
          <NavCard to="/zonas" label="Zonas" />
          <NavCard to="/segmentos" label="Segmentos" />
          <NavCard to="/locais-votacao" label="Locais de Votação" />
        </>}
      </div>
    </Layout>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-5 py-4">
      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-700 dark:text-brand-500">{value}</p>
    </div>
  )
}

function NavCard({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-gray-800 rounded-lg shadow px-5 py-4 text-sm font-medium text-brand-500 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 transition-colors"
    >
      {label} →
    </Link>
  )
}
