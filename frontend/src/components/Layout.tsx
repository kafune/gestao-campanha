import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const PERFIL_LABEL: Record<string, string> = {
  gestor_geral: 'Gestor Geral',
  coordenador_zona: 'Coordenador de Zona',
  lideranca: 'Liderança',
  apoiador: 'Apoiador'
}

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', perfis: ['gestor_geral', 'coordenador_zona', 'lideranca', 'apoiador'] },
  { to: '/acoes', label: 'Ações', perfis: ['gestor_geral', 'coordenador_zona', 'lideranca'] },
  { to: '/dobradinhas', label: 'Dobradinhas', perfis: ['gestor_geral', 'coordenador_zona', 'lideranca'] },
  { to: '/usuarios', label: 'Usuários', perfis: ['gestor_geral'] },
  { to: '/zonas', label: 'Zonas', perfis: ['gestor_geral'] },
  { to: '/segmentos', label: 'Segmentos', perfis: ['gestor_geral'] },
  { to: '/locais-votacao', label: 'Locais', perfis: ['gestor_geral'] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navLinks = NAV_LINKS.filter(l => l.perfis.includes(profile?.perfil ?? ''))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="bg-brand-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <span className="font-bold tracking-wide text-white">Campanha</span>
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  pathname === link.to
                    ? 'bg-brand-500 text-white'
                    : 'text-blue-200 hover:bg-brand-700 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            className="text-blue-200 hover:text-white transition-colors text-lg leading-none"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          <Link
            to="/perfil"
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            {profile?.nome}
          </Link>

          <span className="text-xs bg-accent-500 text-white px-2 py-0.5 rounded">
            {PERFIL_LABEL[profile?.perfil ?? ''] ?? profile?.perfil}
          </span>

          <button
            onClick={handleLogout}
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  )
}
