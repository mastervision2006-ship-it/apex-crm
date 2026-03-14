import { fetchLeads, FASES, COR } from '@/lib/sheets'
import { OverviewClient } from './OverviewClient'
export const dynamic = 'force-dynamic'
export default async function DashboardPage() {
  const leads = await fetchLeads()
  return <OverviewClient leads={leads} />
}
