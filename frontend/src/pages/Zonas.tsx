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

type FormState = { nome: string; codigo: string; numero: string; regiao_principal: string; bairros: string; observacoes: string }

const emptyForm: FormState = { nome: '', codigo: '', numero: '', regiao_principal: '', bairros: '', observacoes: '' }

function zonaToForm(z: ZonaEleitoral): FormState {
  return {
    nome: z.nome,
    codigo: z.codigo ?? '',
    numero: z.numero != null ? String(z.numero) : '',
    regiao_principal: z.regiao_principal ?? '',
    bairros: (z.bairros ?? []).join('\n'),
    observacoes: z.observacoes ?? '',
  }
}

export default function Zonas() {
  const { token } = useAuth()
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([])
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState<'criar' | 'editar' | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [erro, setErro] = useState('')

  async function carregar() {
    setLoading(true)
    const data = await apiFetch('/zonas', token)
    setZonas(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { if (token) carregar() }, [token])

  function abrirCriar() {
    setForm(emptyForm)
    setEditandoId(null)
    setErro('')
    setModo('criar')
  }

  function abrirEditar(z: ZonaEleitoral) {
    setForm(zonaToForm(z))
    setEditandoId(z.id)
    setErro('')
    setModo('editar')
  }

  function fecharForm() {
    setModo(null)
    setEditandoId(null)
    setErro('')
  }

  function payload() {
    return {
      nome: form.nome,
      codigo: form.codigo || null,
      numero: form.numero ? Number(form.numero) : null,
      regiao_principal: form.regiao_principal || null,
      bairros: form.bairros ? form.bairros.split('\n').map(b => b.trim()).filter(Boolean) : null,
      observacoes: form.observacoes || null,
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = modo === 'criar'
      ? await apiFetch('/zonas', token, { method: 'POST', body: JSON.stringify(payload()) })
      : await apiFetch(`/zonas/${editandoId}`, token, { method: 'PUT', body: JSON.stringify(payload()) })
    if (res.error) { setErro(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)) }
    else { fecharForm(); carregar() }
  }

  const f = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Zonas Eleitorais</h1>
        <button onClick={abrirCriar} className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          + Nova zona
        </button>
      </div>

      {modo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">
            {modo === 'criar' ? 'Nova zona eleitoral' : 'Editar zona eleitoral'}
          </h2>
          <form onSubmit={handleSalvar} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label="Nome" required>
                  <input className={input} value={form.nome} onChange={f('nome')} required />
                </Field>
              </div>
              <Field label="Número da zona">
                <input className={input} type="number" value={form.numero} onChange={f('numero')} />
              </Field>
            </div>
            <Field label="Código">
              <input className={input} value={form.codigo} onChange={f('codigo')} />
            </Field>
            <Field label="Região principal">
              <input className={input} value={form.regiao_principal} onChange={f('regiao_principal')} />
            </Field>
            <div className="col-span-2">
              <Field label="Bairros (um por linha)">
                <textarea className={input} rows={4} value={form.bairros} onChange={f('bairros')} placeholder="Centro&#10;Vila Tijuco&#10;Jardim Bom Clima" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Observações">
                <textarea className={input} rows={2} value={form.observacoes} onChange={f('observacoes')} />
              </Field>
            </div>
            {erro && <p className="col-span-2 text-red-500 text-sm">{erro}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Salvar</button>
              <button type="button" onClick={fecharForm} className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500">Carregando...</p> : (
        <Table heads={['Nº', 'Nome', 'Região', 'Bairros', '']}>
          {zonas.map(z => (
            <tr key={z.id} className={row}>
              <td className={cell}>{z.numero ?? '—'}</td>
              <td className={cell}>{z.nome}</td>
              <td className={cell}>{z.regiao_principal ?? '—'}</td>
              <td className={`${cell} max-w-xs`}>
                {z.bairros?.length
                  ? <span className="text-xs text-gray-500 dark:text-gray-400">{z.bairros.join(', ')}</span>
                  : '—'}
              </td>
              <td className={`${cell} text-right`}>
                <button
                  onClick={() => abrirEditar(z)}
                  className="text-brand-500 hover:text-brand-700 text-xs font-medium"
                >
                  Editar
                </button>
              </td>
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
