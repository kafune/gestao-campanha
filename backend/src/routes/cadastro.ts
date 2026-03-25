import { supabaseAdmin } from '../lib/supabase'

export default async function cadastroRoutes(fastify: any) {
  // Busca dados do indicador pelo link_codigo (exibido no formulário público)
  fastify.get('/cadastro/ref/:codigo', async (request: any, reply: any) => {
    const { codigo } = request.params
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, link_codigo')
      .eq('link_codigo', codigo)
      .single()
    if (error || !data) return reply.status(404).send({ error: 'Link inválido' })
    return data
  })

  // Autocadastro público — cria contato + indicação
  fastify.post('/cadastro', async (request: any, reply: any) => {
    const {
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
      ref // link_codigo do indicador
    } = request.body

    if (!nome || !whatsapp) {
      return reply.status(400).send({ error: 'Nome e WhatsApp são obrigatórios' })
    }

    // Busca indicador pelo link_codigo
    let indicador: any = null
    if (ref) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('link_codigo', ref)
        .single()
      indicador = data
    }

    // Deduplicação por WhatsApp
    const { data: existente } = await supabaseAdmin
      .from('contatos')
      .select('id, responsavel_user_id')
      .eq('whatsapp', whatsapp)
      .single()

    let contato: any

    if (existente) {
      // Já existe: atualiza dados mas mantém o responsável original
      const { data, error } = await supabaseAdmin
        .from('contatos')
        .update({ nome, email, endereco, bairro, cidade, cep, zona_id, segmento_id, observacoes })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) return reply.status(400).send({ error })
      contato = data
    } else {
      // Novo contato
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
          responsavel_user_id: indicador?.id ?? null,
          origem_cadastro: ref ? 'link_individual' : 'cadastro_manual'
        })
        .select()
        .single()
      if (error) return reply.status(400).send({ error })
      contato = data
    }

    // Registra indicação se veio por link
    if (indicador && !existente) {
      await supabaseAdmin
        .from('indicacoes')
        .insert({
          indicador_user_id: indicador.id,
          contato_id: contato.id,
          link_codigo: ref,
          origem: 'link_individual'
        })
    }

    return reply.status(201).send({ contato })
  })
}
