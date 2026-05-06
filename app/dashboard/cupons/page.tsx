import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import CuponsClient from './CuponsClient'

export default async function CuponsPage() {
  const session = await getSession()
  if (!session.loggedIn) redirect('/dashboard')
  return <CuponsClient />
}
