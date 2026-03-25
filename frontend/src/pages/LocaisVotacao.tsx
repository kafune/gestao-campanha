import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { LocalVotacao, ZonaEleitoral } from '../types'

const API = import.meta.env.VITE_API_URL

const input = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const row = 'border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
const cell = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300'

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }
  })
  return res.json()
}

export default function LocaisVotacao() {
  const { user } = useAuth()
  const [locais, setLocais] = useState<LocalVotacao[]>([])
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome_local: '', endereco: '', zona_id: '', secao_observacao: '' })
  const [erro, setErro] = useState('')
  const token = user?.access_token ?? ''

  async function carregar() {
    setLoading(true)
    const [l, z] = await Promise.all([
      apiFetch('/locais-votacao', token),
      apiFetch('/zonas', token)
    ])
    setLocais(Array.isArray(l) ? l : [])
    setZonas(Array.isArray(z) ? z : [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch('/locais-votacao', token, { method: 'POST', body: JSON.stringify(form) })
    if (res.error) {
      setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error))
    } else {
      setShowForm(false)
      setForm({ nome_local: '', endereco: '', zona_id: '', secao_observacao: '' })
      carregar()
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Locais de Votação</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          + Novo local
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Novo local de votação</h2>
          <form onSubmit={handleCriar} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome do local *</label>
              <input className={input} placeholder="Ex: Escola Estadual João da Silva" value={form.nome_local} onChange={e => setForm({ ...form, nome_local: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Endereço</label>
              <input className={input} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Zona Eleitoral</label>
              <select className={input} value={form.zona_id} onChange={e => setForm({ ...form, zona_id: e.target.value })}>
                <option value="">Selecione...</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observações de seção</label>
              <input className={input} placeholder="Ex: Seções 001-015" value={form.secao_observacao} onChange={e => setForm({ ...form, secao_observacao: e.target.value })} />
            </div>
            {erro && <p className="col-span-2 text-red-500 text-sm">{erro}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Local', 'Endereço', 'Zona', 'Seções'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locais.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Nenhum local cadastrado.</td></tr>
              )}
              {locais.map(l => (
                <tr key={l.id} className={row}>
                  <td className={`${cell} font-medium`}>{l.nome_local}</td>
                  <td className={cell}>{l.endereco ?? '—'}</td>
                  <td className={cell}>{(l.zonas_eleitorais as any)?.nome ?? '—'}</td>
                  <td className={cell}>{l.secao_observacao ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
