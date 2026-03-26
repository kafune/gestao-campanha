import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { Profile, ZonaEleitoral, Perfil } from '../types'

const API = import.meta.env.VITE_API_URL

const input = 'w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const row = 'border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
const cell = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300'

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }
  })
  return res.json()
}

export default function Usuarios() {
  const { token } = useAuth()
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', senha: '', nome: '', perfil: 'lideranca' as Perfil, zona_id: '', whatsapp: '', coordenador_id: '' })
  const [erro, setErro] = useState('')

  async function carregar() {
    setLoading(true)
    const [u, z] = await Promise.all([apiFetch('/usuarios', token), apiFetch('/zonas', token)])
    setUsuarios(Array.isArray(u) ? u : [])
    setZonas(Array.isArray(z) ? z : [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch('/usuarios', token, { method: 'POST', body: JSON.stringify(form) })
    if (res.error) { setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)) }
    else { setShowForm(false); setForm({ email: '', senha: '', nome: '', perfil: 'lideranca', zona_id: '', whatsapp: '', coordenador_id: '' }); carregar() }
  }

  const STATUS_COLORS: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    inativo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Usuários</h1>
        <button onClick={() => setShowForm(true)} className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          + Novo usuário
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Novo usuário</h2>
          <form onSubmit={handleCriar} className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nome', key: 'nome', type: 'text', required: true },
              { label: 'WhatsApp', key: 'whatsapp', type: 'text' },
              { label: 'E-mail', key: 'email', type: 'email', required: true },
              { label: 'Senha', key: 'senha', type: 'password', required: true }
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{f.label}{f.required ? ' *' : ''}</label>
                <input type={f.type} className={input} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Perfil</label>
              <select className={input} value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value as Perfil })}>
                <option value="coordenador_zona">Coordenador de Zona</option>
                <option value="lideranca">Liderança</option>
                <option value="apoiador">Apoiador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Zona Eleitoral</label>
              <select className={input} value={form.zona_id} onChange={e => setForm({ ...form, zona_id: e.target.value })}>
                <option value="">Selecione...</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}
              </select>
            </div>
            {erro && <p className="col-span-2 text-red-500 text-sm">{erro}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500">Carregando...</p> : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Nome', 'Perfil', 'Zona', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className={row}>
                  <td className={cell}>{u.nome}</td>
                  <td className={cell}>{u.perfil}</td>
                  <td className={cell}>{(u.zonas_eleitorais as any)?.nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[u.status] ?? ''}`}>{u.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
