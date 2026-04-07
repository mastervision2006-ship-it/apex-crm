import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { fetchLeads } from '@/lib/sheets'

export async function GET() {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const leads = await fetchLeads(session.role)
  return NextResponse.json({ leads })
}
