import { supabaseAdmin, getSupabaseForUser } from '../lib/supabase'

export default async function dobradinhasRoutes(fastify: any) {
  // Listagem com meta total agregada
  fastify.get('/dobradinhas', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)

    const { data, error } = await supabase
      .from('dobradinhas')
      .select(`
        *,
        profiles!responsavel_user_id(nome),
        metas_dobradinha(meta_votos, local_votacao_id)
      `)
      .order('nome')

    if (error) return reply.status(400).send({ error })

    const result = data.map((d: any) => ({
      ...d,
      total_locais: d.metas_dobradinha?.length ?? 0,
      meta_total: d.metas_dobradinha?.reduce((sum: number, m: any) => sum + (m.meta_votos ?? 0), 0) ?? 0,
      metas_dobradinha: undefined
    }))

    return result
  })

  // Detalhe completo com locais e metas
  fastify.get('/dobradinhas/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const supabase = getSupabaseForUser(request.headers.authorization)

    const { data, error } = await supabase
      .from('dobradinhas')
      .select(`
        *,
        profiles!responsavel_user_id(id, nome),
        metas_dobradinha(
          id,
          meta_votos,
          observacoes,
          locais_votacao(id, nome_local, endereco, zona_id, secao_observacao, zonas_eleitorais(nome))
        )
      `)
      .eq('id', id)
      .single()

    if (error) return reply.status(404).send({ error: 'Dobradinha não encontrada' })

    const meta_total = data.metas_dobradinha?.reduce((sum: number, m: any) => sum + (m.meta_votos ?? 0), 0) ?? 0

    return { ...data, meta_total }
  })

  // Criar dobradinha
  fastify.post('/dobradinhas', async (request: any, reply: any) => {
    const { nome, descricao, responsavel_user_id, ativa = true } = request.body

    if (!nome) return reply.status(400).send({ error: 'Nome é obrigatório' })

    const { data, error } = await supabaseAdmin
      .from('dobradinhas')
      .insert({ nome, descricao, responsavel_user_id: responsavel_user_id || null, ativa })
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })

  // Atualizar dobradinha
  fastify.put('/dobradinhas/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { nome, descricao, responsavel_user_id, ativa } = request.body

    const { data, error } = await supabaseAdmin
      .from('dobradinhas')
      .update({ nome, descricao, responsavel_user_id: responsavel_user_id || null, ativa })
      .eq('id', id)
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return data
  })

  // Vincular local + meta a uma dobradinha
  fastify.post('/dobradinhas/:id/metas', async (request: any, reply: any) => {
    const { id: dobradinha_id } = request.params
    const { local_votacao_id, meta_votos, observacoes } = request.body

    if (!local_votacao_id || meta_votos == null) {
      return reply.status(400).send({ error: 'local_votacao_id e meta_votos são obrigatórios' })
    }

    const { data, error } = await supabaseAdmin
      .from('metas_dobradinha')
      .insert({ dobradinha_id, local_votacao_id, meta_votos, observacoes })
      .select(`*, locais_votacao(id, nome_local, endereco)`)
      .single()

    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })

  // Atualizar meta
  fastify.put('/metas/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { meta_votos, observacoes } = request.body

    const { data, error } = await supabaseAdmin
      .from('metas_dobradinha')
      .update({ meta_votos, observacoes })
      .eq('id', id)
      .select(`*, locais_votacao(id, nome_local, endereco)`)
      .single()

    if (error) return reply.status(400).send({ error })
    return data
  })

  // Remover meta (desvincular local da dobradinha)
  fastify.delete('/metas/:id', async (request: any, reply: any) => {
    const { id } = request.params

    const { error } = await supabaseAdmin
      .from('metas_dobradinha')
      .delete()
      .eq('id', id)

    if (error) return reply.status(400).send({ error })
    return reply.status(204).send()
  })
}
