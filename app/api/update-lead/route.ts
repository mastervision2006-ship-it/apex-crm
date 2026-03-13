import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, fase } = await req.json()
  const url = process.env.APPS_SCRIPT_URL
  if (!url || url.includes('SEU_ID')) return NextResponse.json({ success: true }) // mock

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateFase', id, fase }),
    })
    const data = await res.json()
    return NextResponse.json({ success: data.success })
  } catch {
    return NextResponse.json({ success: false })
  }
}
