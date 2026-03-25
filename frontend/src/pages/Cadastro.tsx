import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ZonaEleitoral, Segmento, TipoSegmento } from '../types'

const API = import.meta.env.VITE_API_URL

const TIPOS_SEGMENTO: { value: TipoSegmento; label: string }[] = [
  { value: 'igreja', label: 'Igreja' },
  { value: 'associacao', label: 'Associação' },
  { value: 'sindicato', label: 'Sindicato' },
  { value: 'lideranca_comunitaria', label: 'Liderança Comunitária' }
]

const input = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500'

export default function Cadastro() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const ref = params.get('ref')

  const [indicador, setIndicador] = useState<{ nome: string } | null>(null)
  const [refInvalido, setRefInvalido] = useState(false)
  const [zonas, setZonas] = useState<ZonaEleitoral[]>([])
  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', whatsapp: '', email: '', endereco: '',
    bairro: '', cidade: '', cep: '', zona_id: '', segmento_id: '', observacoes: ''
  })

  useEffect(() => {
    async function init() {
      if (ref) {
        const res = await fetch(`${API}/cadastro/ref/${ref}`)
        if (res.ok) { setIndicador(await res.json()) }
        else { setRefInvalido(true) }
      }
      const [{ data: z }, { data: s }] = await Promise.all([
        supabase.from('zonas_eleitorais').select('*').order('nome'),
        supabase.from('segmentos').select('*').order('nome')
      ])
      setZonas(z ?? [])
      setSegmentos(s ?? [])
      setLoading(false)
    }
    init()
  }, [ref])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const res = await fetch(`${API}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ref })
    })
    setEnviando(false)
    if (res.ok) { navigate('/confirmacao') }
    else { const data = await res.json(); setErro(data.error ?? 'Erro ao enviar cadastro.') }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-500">Carregando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-900 mb-3">
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faça parte!</h1>
          {indicador && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Indicado por <span className="font-medium text-brand-500">{indicador.nome}</span>
            </p>
          )}
          {refInvalido && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Link não encontrado. Você pode se cadastrar mesmo assim.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome completo *</label>
            <input className={input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">WhatsApp *</label>
            <input className={input} placeholder="(00) 00000-0000" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail</label>
            <input type="email" className={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bairro</label>
              <input className={input} value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cidade</label>
              <input className={input} value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
            </div>
          </div>
          {zonas.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Zona Eleitoral</label>
              <select className={input} value={form.zona_id} onChange={e => setForm({ ...form, zona_id: e.target.value })}>
                <option value="">Selecione...</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}
              </select>
            </div>
          )}
          {segmentos.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Segmento</label>
              <select className={input} value={form.segmento_id} onChange={e => setForm({ ...form, segmento_id: e.target.value })}>
                <option value="">Selecione...</option>
                {segmentos.map(s => (
                  <option key={s.id} value={s.id}>{s.nome} — {TIPOS_SEGMENTO.find(t => t.value === s.tipo)?.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observações</label>
            <textarea className={input} rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-accent-500 hover:bg-accent-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Confirmar cadastro'}
          </button>
        </form>
      </div>
    </div>
  )
}
