import { fetchLeads } from '@/lib/sheets'
import { RastreamentoClient } from './RastreamentoClient'
export const dynamic = 'force-dynamic'
export default async function RastreamentoPage() {
  const leads = await fetchLeads()
  return <RastreamentoClient leads={leads} />
}
