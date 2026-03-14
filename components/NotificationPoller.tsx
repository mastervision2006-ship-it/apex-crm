'use client'
import { useEffect, useRef } from 'react'

// Componente invisível — só faz polling e dispara notificações nativas do browser
// Fica no layout para funcionar em todas as páginas
export function NotificationPoller() {
  const knownIds   = useRef<Set<string> | null>(null)
  const notifiedAt = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    async function check() {
      if (Notification.permission !== 'granted') return
      try {
        const res  = await fetch('/api/leads')
        const data = await res.json()
        const leads: { id: string; nome: string; atend?: string }[] = data.leads || []

        if (knownIds.current === null) {
          knownIds.current = new Set(leads.map(l => l.id))
          return
        }

        for (const l of leads) {
          if (!knownIds.current.has(l.id)) {
            new Notification('Novo Lead!', { body: `${l.nome} acabou de entrar no CRM.`, icon: '/logo.png' })
            knownIds.current.add(l.id)
          }
        }

        const now = Date.now()
        for (const l of leads) {
          if (!l.atend || notifiedAt.current.has(l.id)) continue
          const m = l.atend.match(/(\d{1,2})\s+de\s+(\w+)\.?\s+(\d{2}):(\d{2})/)
          if (!m) continue
          const meses: Record<string,number> = { jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11 }
          const month = meses[m[2].toLowerCase()]
          if (month === undefined) continue
          const dt = new Date(new Date().getFullYear(), month, Number(m[1]), Number(m[3]), Number(m[4]))
          const diff = dt.getTime() - now
          if (diff > 0 && diff <= 15 * 60 * 1000) {
            new Notification('Atendimento próximo!', { body: `${l.nome} em ${Math.round(diff/60000)} min`, icon: '/logo.png' })
            notifiedAt.current.add(l.id)
          }
        }
      } catch { /* silencioso */ }
    }

    check()
    const id = setInterval(check, 15_000)
    return () => clearInterval(id)
  }, [])

  return null
}
