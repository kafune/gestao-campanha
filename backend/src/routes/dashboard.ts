import { supabaseAdmin, getSupabaseForUser } from '../lib/supabase'

export default async function dashboardRoutes(fastify: any) {
  fastify.get('/dashboard/stats', async (request: any, reply: any) => {
    const supabase = getSupabaseForUser(request.headers.authorization)

    // Busca perfil do usuário logado para saber o escopo
    const { data: me } = await supabaseAdmin
      .from('profiles')
      .select('perfil, zona_id')
      .eq('id', request.user.id)
      .single()

    const perfil = me?.perfil

    // Contagens paralelas — RLS filtra automaticamente pelo perfil
    const [
      { count: totalContatos },
      { count: totalAcoes },
      { data: contatosPorZona },
      { data: rankingRaw }
    ] = await Promise.all([
      supabase.from('contatos').select('*', { count: 'exact', head: true }),
      supabase.from('acoes_campo').select('*', { count: 'exact', head: true }),
      perfil === 'gestor_geral'
        ? supabase
            .from('contatos')
            .select('zona_id, zonas_eleitorais(nome)')
        : Promise.resolve({ data: [] }),
      perfil === 'gestor_geral' || perfil === 'coordenador_zona'
        ? supabase
            .from('contatos')
            .select('responsavel_user_id, profiles!responsavel_user_id(nome)')
        : Promise.resolve({ data: [] })
    ])

    // Totais de usuários por perfil (só gestor)
    let totalUsuarios: Record<string, number> = {}
    if (perfil === 'gestor_geral') {
      const { data: usuarios } = await supabaseAdmin
        .from('profiles')
        .select('perfil')
      if (usuarios) {
        for (const u of usuarios) {
          totalUsuarios[u.perfil] = (totalUsuarios[u.perfil] ?? 0) + 1
        }
      }
    }

    // Agrupa contatos por zona
    const porZona: Record<string, { nome: string; total: number }> = {}
    for (const c of (contatosPorZona ?? [])) {
      const id = c.zona_id ?? 'sem_zona'
      const nome = (c.zonas_eleitorais as any)?.nome ?? 'Sem zona'
      if (!porZona[id]) porZona[id] = { nome, total: 0 }
      porZona[id].total++
    }

    // Ranking de captação
    const ranking: Record<string, { nome: string; total: number }> = {}
    for (const c of (rankingRaw ?? [])) {
      const id = c.responsavel_user_id ?? 'sem_responsavel'
      const nome = (c.profiles as any)?.nome ?? 'Sem responsável'
      if (!ranking[id]) ranking[id] = { nome, total: 0 }
      ranking[id].total++
    }
    const rankingOrdenado = Object.values(ranking).sort((a, b) => b.total - a.total)

    return {
      totalContatos,
      totalAcoes,
      totalUsuarios,
      contatosPorZona: Object.values(porZona).sort((a, b) => b.total - a.total),
      ranking: rankingOrdenado
    }
  })
}
