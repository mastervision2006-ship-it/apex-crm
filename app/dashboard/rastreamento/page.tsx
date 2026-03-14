import { fetchLeads } from '@/lib/sheets'
import { RastreamentoClient } from './RastreamentoClient'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
export default async function RastreamentoPage() {
  const session = await getSession()
  if (session.role === 'gerente') redirect('/dashboard')
  const leads = await fetchLeads()
  return <RastreamentoClient leads={leads} />
}
