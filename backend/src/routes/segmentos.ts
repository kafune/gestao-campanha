import { getSupabaseForUser, supabaseAdmin } from '../lib/supabase'

export default async function segmentosRoutes(fastify: any) {
  fastify.get('/segmentos', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('segmentos')
      .select('*')
      .order('nome')
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.post('/segmentos', async (request: any, reply: any) => {
    const { nome, tipo } = request.body
    const { data, error } = await supabaseAdmin
      .from('segmentos')
      .insert({ nome, tipo })
      .select()
      .single()
    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })

  fastify.put('/segmentos/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { nome, tipo } = request.body
    const { data, error } = await supabaseAdmin
      .from('segmentos')
      .update({ nome, tipo })
      .eq('id', id)
      .select()
      .single()
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.delete('/segmentos/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { error } = await supabaseAdmin
      .from('segmentos')
      .delete()
      .eq('id', id)
    if (error) return reply.status(400).send({ error })
    return reply.status(204).send()
  })
}
