import { fetchLeads, FASES, COR } from '@/lib/sheets'
import { OverviewClient } from './OverviewClient'

export default async function DashboardPage() {
  const leads = await fetchLeads()
  return <OverviewClient leads={leads} />
}
