import { supabaseAdmin, getSupabaseForUser } from '../lib/supabase'

export default async function acoesRoutes(fastify: any) {
  fastify.get('/acoes', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('acoes_campo')
      .select('*, zonas_eleitorais(nome), profiles!responsavel_user_id(nome)')
      .order('data_acao', { ascending: false })
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.post('/acoes', async (request: any, reply: any) => {
    const {
      titulo, tipo_acao, descricao, data_acao,
      endereco, zona_id,
      anfitriao_nome, anfitriao_telefone, anfitriao_email
    } = request.body

    if (!titulo || !tipo_acao || !data_acao) {
      return reply.status(400).send({ error: 'Título, tipo e data são obrigatórios' })
    }

    const { data, error } = await supabaseAdmin
      .from('acoes_campo')
      .insert({
        titulo, tipo_acao, descricao, data_acao,
        endereco, zona_id,
        anfitriao_nome, anfitriao_telefone, anfitriao_email,
        responsavel_user_id: request.user.id
      })
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })
}
