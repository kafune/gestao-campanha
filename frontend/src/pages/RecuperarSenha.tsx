import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RecuperarSenha() {
  const { recuperarSenha } = useAuth()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { error } = await recuperarSenha(email)
    setLoading(false)
    if (error) { setErro('Não foi possível enviar o e-mail. Verifique o endereço.') }
    else { setEnviado(true) }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <p className="text-green-500 font-semibold mb-2">E-mail enviado!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Verifique sua caixa de entrada.</p>
          <Link to="/login" className="text-brand-500 hover:text-brand-700 text-sm transition-colors">Voltar ao login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-white">Recuperar senha</h1>
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
          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          <Link to="/login" className="text-brand-500 hover:text-brand-700 transition-colors">Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}
