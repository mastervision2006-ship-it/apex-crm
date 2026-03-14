import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const USERS = [
  { username: 'Admin',   password: process.env.CRM_PASSWORD   || '@Apex26', role: 'admin'   as const },
  { username: 'Gerente', password: process.env.GERENTE_PASSWORD || '@Apex26', role: 'gerente' as const },
]

export async function POST(req: Request) {
  const { username, password } = await req.json()
  const user = USERS.find(u => u.username === username && u.password === password)

  if (user) {
    const session = await getSession()
    session.loggedIn = true
    session.role = user.role
    await session.save()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
}
