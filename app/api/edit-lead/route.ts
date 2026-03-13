import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.loggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, fields } = await req.json()
  const url = process.env.APPS_SCRIPT_URL
  if (!url || url.includes('SEU_ID')) {
    revalidatePath('/dashboard/leads')
    return NextResponse.json({ success: true })
  }

  try {
    const res  = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateLead', id, fields }),
    })
    const data = await res.json()
    if (data.success) revalidatePath('/dashboard/leads')
    return NextResponse.json({ success: data.success })
  } catch {
    return NextResponse.json({ success: false })
  }
}
