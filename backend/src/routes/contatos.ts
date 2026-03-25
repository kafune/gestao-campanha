import { supabaseAdmin, getSupabaseForUser } from '../lib/supabase'

export default async function contatosRoutes(fastify: any) {
  fastify.get('/contatos', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)
    const { data, error } = await supabase
      .from('contatos')
      .select('*, zonas_eleitorais(nome), segmentos(nome), profiles!responsavel_user_id(nome)')
      .order('created_at', { ascending: false })
    if (error) return reply.status(400).send({ error })
    return data
  })

  fastify.post('/contatos', async (request: any, reply: any) => {
    const { nome, whatsapp, email, endereco, bairro, cidade, cep, zona_id, segmento_id, observacoes } = request.body

    if (!nome || !whatsapp) {
      return reply.status(400).send({ error: 'Nome e WhatsApp são obrigatórios' })
    }

    // Deduplicação por WhatsApp
    const { data: existente } = await supabaseAdmin
      .from('contatos')
      .select('id')
      .eq('whatsapp', whatsapp)
      .single()

    if (existente) {
      return reply.status(409).send({ error: 'Já existe um contato com esse WhatsApp', id: existente.id })
    }

    const { data, error } = await supabaseAdmin
      .from('contatos')
      .insert({
        nome,
        whatsapp,
        email,
        endereco,
        bairro,
        cidade,
        cep,
        zona_id,
        segmento_id,
        observacoes,
        responsavel_user_id: request.user.id,
        origem_cadastro: 'cadastro_manual'
      })
      .select()
      .single()

    if (error) return reply.status(400).send({ error })
    return reply.status(201).send(data)
  })
}
