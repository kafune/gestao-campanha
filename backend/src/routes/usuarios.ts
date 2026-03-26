import { supabaseAdmin, getSupabaseForUser } from '../lib/supabase'

export default async function usuariosRoutes(fastify: any) {
  fastify.get('/usuarios', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, zonas_eleitorais(nome), segmentos(nome)')
      .order('nome')
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.post('/usuarios', async (request: any, reply: any) => {
    const { email, senha, nome, perfil, zona_id, coordenador_id, whatsapp } = request.body

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      user_metadata: { nome, perfil }
    })
    if (authError) return reply.status(400).send({ error: authError.message })

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        nome,
        perfil,
        zona_id: zona_id || null,
        coordenador_id: coordenador_id || null,
        whatsapp
      })
      .eq('id', authData.user.id)
      .select()
      .single()
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.put('/usuarios/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const { nome, perfil, zona_id, coordenador_id, whatsapp, status } = request.body

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ nome, perfil, zona_id: zona_id || null, coordenador_id: coordenador_id || null, whatsapp, status })
      .eq('id', id)
      .select()
      .single()
    if (error) return reply.status(400).send({ error })
    return data
  })
}
