import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST() {
  const session = await getSession()
  session.loggedIn = false
  await session.save()
  return NextResponse.json({ success: true })
}
