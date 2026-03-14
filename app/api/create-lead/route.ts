import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  // Deduplicação: bloqueia o mesmo telefone inserido nos últimos 10 minutos
  if (body.tel) {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('leads')
      .select('id, created_at')
      .eq('tel', body.tel)
      .gte('created_at', since)
      .limit(1)

    if (existing && existing.length > 0) {
      console.warn('create-lead: duplicata bloqueada para', body.tel)
      return NextResponse.json({ success: true, duplicate: true })
    }
  }

  const { error } = await supabase.from('leads').insert([body])
  if (error) { console.error('create-lead:', error.message); return NextResponse.json({ success: false }) }

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/kanban')
  return NextResponse.json({ success: true })
}
