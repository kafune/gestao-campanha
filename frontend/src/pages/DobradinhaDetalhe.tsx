import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import type { Dobradinha, LocalVotacao, MetaDobradinha } from '../types'

const API = import.meta.env.VITE_API_URL

const input = 'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500'

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }
  })
  if (res.status === 204) return null
  return res.json()
}

export default function DobradinhaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()

  const [dobradinha, setDobradinha] = useState<Dobradinha | null>(null)
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<LocalVotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddLocal, setShowAddLocal] = useState(false)
  const [novaMetaForm, setNovaMetaForm] = useState({ local_votacao_id: '', meta_votos: '', observacoes: '' })
  const [editandoMeta, setEditandoMeta] = useState<string | null>(null)
  const [editMetaVotos, setEditMetaVotos] = useState('')
  const [erro, setErro] = useState('')

  async function carregar() {
    setLoading(true)
    const [d, l] = await Promise.all([
      apiFetch(`/dobradinhas/${id}`, token),
      apiFetch('/locais-votacao', token)
    ])
    setDobradinha(d)
    setLocaisDisponiveis(Array.isArray(l) ? l : [])
    setLoading(false)
  }

  useEffect(() => { if (token) carregar() }, [id, token])

  async function handleToggleAtiva() {
    if (!dobradinha) return
    await apiFetch(`/dobradinhas/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify({ ...dobradinha, ativa: !dobradinha.ativa, responsavel_user_id: (dobradinha.profiles as any)?.id })
    })
    carregar()
  }

  async function handleAddLocal(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await apiFetch(`/dobradinhas/${id}/metas`, token, {
      method: 'POST',
      body: JSON.stringify({
        local_votacao_id: novaMetaForm.local_votacao_id,
        meta_votos: Number(novaMetaForm.meta_votos),
        observacoes: novaMetaForm.observacoes
      })
    })
    if (res?.error) {
      setErro(typeof res.error === 'string' ? res.error : 'Erro ao adicionar local')
    } else {
      setShowAddLocal(false)
      setNovaMetaForm({ local_votacao_id: '', meta_votos: '', observacoes: '' })
      carregar()
    }
  }

  async function handleEditMeta(metaId: string) {
    await apiFetch(`/metas/${metaId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ meta_votos: Number(editMetaVotos) })
    })
    setEditandoMeta(null)
    carregar()
  }

  async function handleRemoveMeta(metaId: string) {
    await apiFetch(`/metas/${metaId}`, token, { method: 'DELETE' })
    carregar()
  }

  // Locais que ainda não estão vinculados
  const locaisVinculados = new Set(dobradinha?.metas_dobradinha?.map(m => m.local_votacao_id))
  const locaisParaAdicionar = locaisDisponiveis.filter(l => !locaisVinculados.has(l.id))

  if (loading) return (
    <Layout>
      <p className="text-gray-500">Carregando...</p>
    </Layout>
  )

  if (!dobradinha) return (
    <Layout>
      <p className="text-red-500">Dobradinha não encontrada.</p>
    </Layout>
  )

  const metas = dobradinha.metas_dobradinha ?? []

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/dobradinhas" className="hover:text-brand-500 transition-colors">Dobradinhas</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200">{dobradinha.nome}</span>
      </div>

      {/* Header da dobradinha */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{dobradinha.nome}</h1>
            {dobradinha.profiles && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Responsável: <span className="font-medium">{(dobradinha.profiles as any).nome}</span>
              </p>
            )}
            {dobradinha.descricao && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{dobradinha.descricao}</p>
            )}
          </div>
          <button
            onClick={handleToggleAtiva}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              dobradinha.ativa
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {dobradinha.ativa ? 'Ativa' : 'Inativa'}
          </button>
        </div>

        {/* Totais */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-2xl font-bold text-brand-500">{metas.length}</p>
            <p className="text-xs text-gray-400">Locais cadastrados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-500">
              {metas.reduce((s, m) => s + (m.meta_votos ?? 0), 0).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-gray-400">Meta total de votos</p>
          </div>
        </div>
      </div>

      {/* Locais e metas */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Locais de Votação</h2>
        {locaisParaAdicionar.length > 0 && (
          <button
            onClick={() => setShowAddLocal(true)}
            className="bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + Vincular local
          </button>
        )}
      </div>

      {showAddLocal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-4">
          <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-100">Vincular local de votação</h3>
          <form onSubmit={handleAddLocal} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Local *</label>
              <select className={input} value={novaMetaForm.local_votacao_id} onChange={e => setNovaMetaForm({ ...novaMetaForm, local_votacao_id: e.target.value })} required>
                <option value="">Selecione...</option>
                {locaisParaAdicionar.map(l => <option key={l.id} value={l.id}>{l.nome_local}{l.endereco ? ` — ${l.endereco}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Meta de votos *</label>
              <input type="number" min="0" className={input} value={novaMetaForm.meta_votos} onChange={e => setNovaMetaForm({ ...novaMetaForm, meta_votos: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observações</label>
              <input className={input} value={novaMetaForm.observacoes} onChange={e => setNovaMetaForm({ ...novaMetaForm, observacoes: e.target.value })} />
            </div>
            {erro && <p className="text-red-500 text-sm">{erro}</p>}
            <div className="flex gap-2">
              <button type="submit" className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Adicionar</button>
              <button type="button" onClick={() => { setShowAddLocal(false); setErro('') }} className="border border-gray-200 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {metas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-400">
          Nenhum local vinculado ainda. Clique em "Vincular local" para começar.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Local</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Endereço</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Meta votos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {metas.map((m: MetaDobradinha) => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                    {(m.locais_votacao as any)?.nome_local ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {(m.locais_votacao as any)?.endereco ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editandoMeta === m.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min="0"
                          className="w-24 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={editMetaVotos}
                          onChange={e => setEditMetaVotos(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => handleEditMeta(m.id)} className="text-brand-500 hover:text-brand-700 text-xs font-medium">OK</button>
                        <button onClick={() => setEditandoMeta(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditandoMeta(m.id); setEditMetaVotos(String(m.meta_votos)) }}
                        className="font-semibold text-accent-500 hover:text-accent-600 transition-colors"
                        title="Clique para editar"
                      >
                        {(m.meta_votos ?? 0).toLocaleString('pt-BR')}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemoveMeta(m.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      title="Remover local"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {/* Linha de total */}
              <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Total</td>
                <td className="px-4 py-3 text-right font-bold text-accent-500">
                  {metas.reduce((s, m) => s + (m.meta_votos ?? 0), 0).toLocaleString('pt-BR')}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
