import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { DashboardLayoutClient } from './DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.loggedIn) redirect('/login')

  return <DashboardLayoutClient role={session.role || 'admin'}>{children}</DashboardLayoutClient>
}
