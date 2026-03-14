import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { error } = await supabase.from('leads').insert([body])
  if (error) { console.error('create-lead:', error.message); return NextResponse.json({ success: false }) }

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/kanban')
  return NextResponse.json({ success: true })
}
