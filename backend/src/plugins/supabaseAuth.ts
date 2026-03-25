import fp from 'fastify-plugin'
import { supabaseAdmin } from '../lib/supabase'

const PUBLIC_ROUTES = ['/health', '/auth/login', '/auth/recuperar']
const PUBLIC_PREFIXES = ['/cadastro']

export default fp(async (fastify) => {
  fastify.addHook('preHandler', async (request: any, reply) => {
    if (PUBLIC_ROUTES.includes(request.url)) return
    if (PUBLIC_PREFIXES.some(p => request.url.startsWith(p))) return

    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) return reply.status(401).send({ error: 'Token não fornecido' })

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return reply.status(401).send({ error: 'Token inválido' })

    request.user = user
  })
})
