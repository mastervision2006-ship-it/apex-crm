import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  const bytes = randomBytes(8)
  return Array.from(bytes).map((b: number) => CHARSET[b % CHARSET.length]).join('')
}

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const discount = Number(body.discount)
  if (!discount || discount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  const supabase = adminSupabase()

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode()
    const { error } = await supabase.from('coupons').insert({ code, discount })

    if (!error) return NextResponse.json({ code, discount })
    if (error.code !== '23505') {
      return NextResponse.json({ error: 'Erro ao gerar código' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Falha ao gerar código único' }, { status: 500 })
}
