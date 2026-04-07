import { fetchLeads, FASES, COR } from '@/lib/sheets'
import { OverviewClient } from './OverviewClient'
import { getSession } from '@/lib/session'
export const dynamic = 'force-dynamic'
export default async function DashboardPage() {
  const session = await getSession()
  const leads = await fetchLeads(session.role)
  return <OverviewClient leads={leads} />
}
