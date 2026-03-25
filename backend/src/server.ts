import Fastify from 'fastify'
import supabaseAuth from './plugins/supabaseAuth'
import authRoutes from './routes/auth'
import usuariosRoutes from './routes/usuarios'
import zonasRoutes from './routes/zonas'
import segmentosRoutes from './routes/segmentos'
import cadastroRoutes from './routes/cadastro'
import contatosRoutes from './routes/contatos'
import acoesRoutes from './routes/acoes'
import dashboardRoutes from './routes/dashboard'
import dobradinhasRoutes from './routes/dobradinhas'
import locaisVotacaoRoutes from './routes/locaisVotacao'

const fastify = Fastify({ logger: true })

fastify.get('/health', async () => ({ status: 'ok' }))

fastify.register(supabaseAuth)
fastify.register(authRoutes)
fastify.register(usuariosRoutes)
fastify.register(zonasRoutes)
fastify.register(segmentosRoutes)
fastify.register(cadastroRoutes)
fastify.register(contatosRoutes)
fastify.register(acoesRoutes)
fastify.register(dashboardRoutes)
fastify.register(dobradinhasRoutes)
fastify.register(locaisVotacaoRoutes)

const PORT = Number(process.env.PORT) || 4001

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
