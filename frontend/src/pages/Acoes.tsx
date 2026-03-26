import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { ZonaEleitoral } from '../types'

const API = import.meta.env.VITE_API_URL

const TIPOS_ACAO = [
  { value: 'visita', label: 'Visita' },
  { value: 'reuniao_casa', label: 'Reunião em Casa' },
  { value: 'reuniao_igreja', label: 'Reunião em Igreja' },
  { value: 'cafe_lideranca', label: 'Café com Liderança' },
  { value: 'evento_pequeno', label: 'Evento Pequeno' },
  { value: 'evento_macro', label: 'Evento Macro' }
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

export default function Acoes() {
  const { token } = useAuth()
  const [acoes, setAcoes] = useState<any[]>([])
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    titulo: '', tipo_acao: 'visita', data_acao: '', endereco: '',
    zona_id: '', anfitriao_nome: '', anfitriao_telefone: '', anfitriao_email: '', descricao: ''
  })

  async function carregar() {
    setLoading(true)
    const [a, z] = await Promise.all([apiFetch('/acoes', token), apiFetch('/zonas', token)])
    setAcoes(Array.isArray(a) ? a : [])
    setZonas(Array.isArray(z) ? z : [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch('/acoes', token, { method: 'POST', body: JSON.stringify(form) })
    if (res.error) { setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)) }
    else {
      setShowForm(false)
      setForm({ titulo: '', tipo_acao: 'visita', data_acao: '', endereco: '', zona_id: '', anfitriao_nome: '', anfitriao_telefone: '', anfitriao_email: '', descricao: '' })
      carregar()
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ações de Campo</h1>
        <button onClick={() => setShowForm(true)} className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          + Nova ação
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Nova ação de campo</h2>
          <form onSubmit={handleCriar} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Título *</label>
              <input className={input} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo *</label>
              <select className={input} value={form.tipo_acao} onChange={e => setForm({ ...form, tipo_acao: e.target.value })}>
                {TIPOS_ACAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data *</label>
              <input type="date" className={input} value={form.data_acao} onChange={e => setForm({ ...form, data_acao: e.target.value })} required />
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
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Anfitrião — Nome</label>
              <input className={input} value={form.anfitriao_nome} onChange={e => setForm({ ...form, anfitriao_nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Anfitrião — Telefone</label>
              <input className={input} value={form.anfitriao_telefone} onChange={e => setForm({ ...form, anfitriao_telefone: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observações</label>
              <textarea className={input} rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
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
                {['Título', 'Tipo', 'Data', 'Zona', 'Responsável'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acoes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nenhuma ação registrada.</td></tr>
              )}
              {acoes.map(a => (
                <tr key={a.id} className={row}>
                  <td className={cell}>{a.titulo}</td>
                  <td className={cell}>{TIPOS_ACAO.find(t => t.value === a.tipo_acao)?.label ?? a.tipo_acao}</td>
                  <td className={cell}>{new Date(a.data_acao).toLocaleDateString('pt-BR')}</td>
                  <td className={cell}>{a.zonas_eleitorais?.nome ?? '—'}</td>
                  <td className={cell}>{a.profiles?.nome ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
