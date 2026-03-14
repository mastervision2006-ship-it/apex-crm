import { fetchLeads } from '@/lib/sheets'
import { AtendimentosClient } from './AtendimentosClient'
export const dynamic = 'force-dynamic'
export default async function AtendimentosPage() {
  const leads = await fetchLeads()
  return <AtendimentosClient leads={leads} />
}
