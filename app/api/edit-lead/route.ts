import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, fields } = await req.json()
  const { error } = await supabase.from('leads').update(fields).eq('id', id)
  if (error) { console.error('edit-lead:', error.message); return NextResponse.json({ success: false }) }

  return NextResponse.json({ success: true })
}
