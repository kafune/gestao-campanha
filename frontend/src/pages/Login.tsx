import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

export default function Login() {
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await login(email, senha)
    setLoading(false)
    if (error) { setErro('E-mail ou senha incorretos.') }
    else { navigate('/dashboard') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-900 mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Campanha</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            <Link to="/recuperar-senha" className="text-brand-500 hover:text-brand-700 transition-colors">
              Esqueceu a senha?
            </Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <button onClick={toggle} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {theme === 'dark' ? '☀ Modo claro' : '☾ Modo escuro'}
          </button>
        </div>
      </div>
    </div>
  )
}
