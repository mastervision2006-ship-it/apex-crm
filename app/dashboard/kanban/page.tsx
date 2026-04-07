import { fetchLeads } from '@/lib/sheets'
import { KanbanClient } from './KanbanClient'
import { getSession } from '@/lib/session'
export const dynamic = 'force-dynamic'
export default async function KanbanPage() {
  const session = await getSession()
  const leads = await fetchLeads(session.role)
  return <KanbanClient initialLeads={leads} />
}
