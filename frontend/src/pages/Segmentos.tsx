import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { Segmento, TipoSegmento } from '../types'

const API = import.meta.env.VITE_API_URL

const TIPOS: { value: TipoSegmento; label: string }[] = [
  { value: 'igreja', label: 'Igreja' },
  { value: 'associacao', label: 'Associação' },
  { value: 'sindicato', label: 'Sindicato' },
  { value: 'lideranca_comunitaria', label: 'Liderança Comunitária' }
]

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

export default function Segmentos() {
  const { token } = useAuth()
  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', tipo: 'igreja' as TipoSegmento })
  const [erro, setErro] = useState('')

  async function carregar() {
    setLoading(true)
    const data = await apiFetch('/segmentos', token)
    setSegmentos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { if (token) carregar() }, [token])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch('/segmentos', token, { method: 'POST', body: JSON.stringify(form) })
    if (res.error) { setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)) }
    else { setShowForm(false); setForm({ nome: '', tipo: 'igreja' }); carregar() }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Segmentos</h1>
        <button onClick={() => setShowForm(true)} className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          + Novo segmento
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Novo segmento</h2>
          <form onSubmit={handleCriar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome *</label>
              <input className={input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo</label>
              <select className={input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoSegmento })}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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

      {loading ? <p className="text-gray-500">Carregando...</p> : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {segmentos.map(s => (
                <tr key={s.id} className={row}>
                  <td className={cell}>{s.nome}</td>
                  <td className={cell}>{TIPOS.find(t => t.value === s.tipo)?.label ?? s.tipo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
