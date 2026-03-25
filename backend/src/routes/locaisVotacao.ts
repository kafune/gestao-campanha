import { supabaseAdmin, getSupabaseForUser } from '../lib/supabase'

export default async function locaisVotacaoRoutes(fastify: any) {
  fastify.get('/locais-votacao', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('locais_votacao')
      .select('*, zonas_eleitorais(nome)')
      .order('nome_local')
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.post('/locais-votacao', async (request: any, reply: any) => {
    const { nome_local, endereco, zona_id, secao_observacao } = request.body

    if (!nome_local) return reply.status(400).send({ error: 'Nome do local é obrigatório' })

    const { data, error } = await supabaseAdmin
      .from('locais_votacao')
      .insert({ nome_local, endereco, zona_id: zona_id || null, secao_observacao })
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })

  fastify.put('/locais-votacao/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { nome_local, endereco, zona_id, secao_observacao } = request.body

    const { data, error } = await supabaseAdmin
      .from('locais_votacao')
      .update({ nome_local, endereco, zona_id: zona_id || null, secao_observacao })
      .eq('id', id)
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.delete('/locais-votacao/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { error } = await supabaseAdmin
      .from('locais_votacao')
      .delete()
      .eq('id', id)
    if (error) return reply.status(400).send({ error })
    return reply.status(204).send()
  })
}
