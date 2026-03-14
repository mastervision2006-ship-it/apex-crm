import { fetchLeads } from '@/lib/sheets'
import { KanbanClient } from './KanbanClient'
export const dynamic = 'force-dynamic'
export default async function KanbanPage() {
  const leads = await fetchLeads()
  return <KanbanClient initialLeads={leads} />
}
