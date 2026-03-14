import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, fase } = await req.json()
  const { error } = await supabase.from('leads').update({ fase }).eq('id', id)
  if (error) { console.error('update-lead:', error.message); return NextResponse.json({ success: false }) }

  revalidatePath('/dashboard/kanban')
  return NextResponse.json({ success: true })
}
