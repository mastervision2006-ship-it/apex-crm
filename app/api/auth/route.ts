import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  const validUser = username === 'Admin'
  const validPass = password === (process.env.CRM_PASSWORD || '@Apex26')

  if (validUser && validPass) {
    const session = await getSession()
    session.loggedIn = true
    await session.save()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
}
