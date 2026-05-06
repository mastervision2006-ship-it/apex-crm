import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET() {
  const session = await getSession()
  if (!session.loggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminSupabase()
    .from('coupons')
    .select('id, code, discount, used, used_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erro ao buscar códigos' }, { status: 500 })

  return NextResponse.json(data)
}
