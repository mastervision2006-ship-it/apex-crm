'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Lead } from '@/lib/sheets'

type SetLeads = React.Dispatch<React.SetStateAction<Lead[]>>

export function useRealtimeLeads(setLeads: SetLeads) {
  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
        setLeads(prev => [...prev, payload.new as Lead])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, payload => {
        setLeads(prev => prev.map(l => l.id === (payload.new as Lead).id ? payload.new as Lead : l))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, payload => {
        setLeads(prev => prev.filter(l => l.id !== (payload.old as Lead).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [setLeads])
}
