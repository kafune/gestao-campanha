import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { ZonaEleitoral } from '../types'

const API = import.meta.env.VITE_API_URL

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }
  })
  return res.json()
}

export default function Zonas() {
  const { user } = useAuth()
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', codigo: '', observacoes: '' })
  const [erro, setErro] = useState('')
  const token = user?.access_token ?? ''

  async function carregar() {
    setLoading(true)
    const data = await apiFetch('/zonas', token)
    setZonas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch('/zonas', token, { method: 'POST', body: JSON.stringify(form) })
    if (res.error) { setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)) }
    else { setShowForm(false); setForm({ nome: '', codigo: '', observacoes: '' }); carregar() }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Zonas Eleitorais</h1>
        <button onClick={() => setShowForm(true)} className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          + Nova zona
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Nova zona eleitoral</h2>
          <form onSubmit={handleCriar} className="space-y-4">
            <Field label="Nome" required><input className={input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></Field>
            <Field label="Código"><input className={input} value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} /></Field>
            <Field label="Observações"><textarea className={input} rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <FormActions onCancel={() => setShowForm(false)} />
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500">Carregando...</p> : (
        <Table heads={['Nome', 'Código', 'Observações']}>
          {zonas.map(z => (
            <tr key={z.id} className={row}>
              <td className={cell}>{z.nome}</td>
              <td className={cell}>{z.codigo ?? '—'}</td>
              <td className={cell}>{z.observacoes ?? '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </Layout>
  )
}

// ---- shared mini-components ----
const input = 'w-full border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const row = 'border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
const cell = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}{required && ' *'}</label>
      {children}
    </div>
  )
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="submit" className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Salvar</button>
      <button type="button" onClick={onCancel} className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
    </div>
  )
}

function Table({ heads, children }: { heads: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>{heads.map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
