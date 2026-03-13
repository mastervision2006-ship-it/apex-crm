import { fetchLeads } from '@/lib/sheets'
import { LeadsClient } from './LeadsClient'
export default async function LeadsPage() {
  const leads = await fetchLeads()
  return <LeadsClient leads={leads} />
}
