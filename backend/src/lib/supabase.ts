import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cria cliente com o JWT do usuário para que o RLS seja aplicado
export function getSupabaseForUser(authorization: string | undefined) {
  const token = authorization?.replace('Bearer ', '') ?? ''
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}
