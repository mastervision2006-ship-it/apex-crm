import { fetchLeads } from '@/lib/sheets'
import { AtendimentosClient } from './AtendimentosClient'
import { getSession } from '@/lib/session'
export const dynamic = 'force-dynamic'
export default async function AtendimentosPage() {
  const session = await getSession()
  const leads = await fetchLeads(session.role)
  return <AtendimentosClient leads={leads} />
}
