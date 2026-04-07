import { fetchLeads } from '@/lib/sheets'
import { LeadsClient } from './LeadsClient'
import { getSession } from '@/lib/session'
export const dynamic = 'force-dynamic'
export default async function LeadsPage() {
  const session = await getSession()
  const leads = await fetchLeads(session.role)
  return <LeadsClient leads={leads} />
}
