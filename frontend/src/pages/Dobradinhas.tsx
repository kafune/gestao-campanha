import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { Dobradinha, Profile } from '../types'

const API = import.meta.env.VITE_API_URL

const input = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500'

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }
  })
  return res.json()
}

export default function Dobradinhas() {
  const { token } = useAuth()
  const [dobradinhas, setDobradinhas] = useState<Dobradinha[]>([])
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ nome: '', descricao: '', responsavel_user_id: '', ativa: true })

  async function carregar() {
    setLoading(true)
    const [d, u] = await Promise.all([
      apiFetch('/dobradinhas', token),
      apiFetch('/usuarios', token)
    ])
    setDobradinhas(Array.isArray(d) ? d : [])
    setUsuarios(Array.isArray(u) ? u : [])
    setLoading(false)
  }

  useEffect(() => { if (token) carregar() }, [token])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch('/dobradinhas', token, { method: 'POST', body: JSON.stringify(form) })
    if (res.error) {
      setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error))
    } else {
      setShowForm(false)
      setForm({ nome: '', descricao: '', responsavel_user_id: '', ativa: true })
      carregar()
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dobradinhas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          + Nova dobradinha
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Nova dobradinha</h2>
          <form onSubmit={handleCriar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome *</label>
              <input className={input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descrição</label>
              <textarea className={input} rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Responsável</label>
              <select className={input} value={form.responsavel_user_id} onChange={e => setForm({ ...form, responsavel_user_id: e.target.value })}>
                <option value="">Selecione...</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} — {u.perfil}</option>)}
              </select>
            </div>
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <div className="flex gap-2">
              <button type="submit" className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : dobradinhas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-10 text-center text-gray-400">
          Nenhuma dobradinha cadastrada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dobradinhas.map(d => (
            <Link
              key={d.id}
              to={`/dobradinhas/${d.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{d.nome}</h3>
                  {d.profiles && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Responsável: {(d.profiles as any).nome}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${d.ativa ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {d.ativa ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              {d.descricao && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{d.descricao}</p>
              )}

              <div className="flex gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-500">{d.total_locais ?? 0}</p>
                  <p className="text-xs text-gray-400">Locais</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-accent-500">{(d.meta_total ?? 0).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-gray-400">Meta total de votos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
