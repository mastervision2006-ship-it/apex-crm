import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY!

// cache: 'no-store' garante que o Next.js 14 nunca sirva dados cacheados
// do Supabase — sem isso, mesmo com force-dynamic as páginas recebem dados velhos
export const supabase = createClient(url, key, {
  global: {
    fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' })
  }
})
