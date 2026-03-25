import { supabaseAdmin } from '../lib/supabase'

export default async function authRoutes(fastify: any) {
  fastify.get('/auth/me', async (request: any, reply: any) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, zonas_eleitorais(nome), segmentos(nome)')
      .eq('id', request.user.id)
      .single()
    if (error) return reply.status(400).send({ error })
    return data
  })
}
