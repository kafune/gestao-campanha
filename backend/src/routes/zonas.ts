import { getSupabaseForUser, supabaseAdmin } from '../lib/supabase'

export default async function zonasRoutes(fastify: any) {
  fastify.get('/zonas', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('zonas_eleitorais')
      .select('*')
      .order('nome')
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.post('/zonas', async (request: any, reply: any) => {
    const { nome, codigo, observacoes } = request.body
    const { data, error } = await supabaseAdmin
      .from('zonas_eleitorais')
      .insert({ nome, codigo, observacoes })
      .select()
      .single()
    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })

  fastify.put('/zonas/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { nome, codigo, numero, regiao_principal, bairros, observacoes } = request.body
    const { data, error } = await supabaseAdmin
      .from('zonas_eleitorais')
      .update({ nome, codigo, numero: numero || null, regiao_principal, bairros, observacoes })
      .eq('id', id)
      .select()
      .single()
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.delete('/zonas/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { error } = await supabaseAdmin
      .from('zonas_eleitorais')
      .delete()
      .eq('id', id)
    if (error) return reply.status(400).send({ error })
    return reply.status(204).send()
  })
}
