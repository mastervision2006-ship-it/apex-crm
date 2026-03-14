'use client'
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

interface Notif {
  id:    string
  type:  'new_lead' | 'atend'
  title: string
  body:  string
  time:  Date
  read:  boolean
}

const MESES: Record<string, number> = {
  'jan':0,'fev':1,'mar':2,'abr':3,'mai':4,'jun':5,
  'jul':6,'ago':7,'set':8,'out':9,'nov':10,'dez':11,
}

function parseAtend(atend: string): Date | null {
  if (!atend) return null
  const m = atend.match(/(\d{1,2})\s+de\s+(\w+)\.?\s+(\d{2}):(\d{2})/)
  if (!m) return null
  const [, day, mes, hh, mm] = m
  const month = MESES[mes.toLowerCase()]
  if (month === undefined) return null
  const now = new Date()
  const d = new Date(now.getFullYear(), month, Number(day), Number(hh), Number(mm), 0)
  if (d.getTime() < now.getTime() - 86400000) d.setFullYear(now.getFullYear() + 1)
  return d
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function pushNotif(title: string, body: string) {
  if (typeof window !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' })
  }
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen]     = useState(false)
  const knownIds            = useRef<Set<string> | null>(null)
  const notifiedAt          = useRef<Set<string>>(new Set())
  const dropdownRef         = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  function addNotif(n: Omit<Notif, 'time' | 'read'>) {
    setNotifs(prev => [{ ...n, time: new Date(), read: false }, ...prev].slice(0, 50))
  }

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Polling 60s
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    async function check() {
      try {
        const res  = await fetch('/api/leads')
        const data = await res.json()
        const leads: { id: string; nome: string; atend?: string }[] = data.leads || []

        if (knownIds.current === null) {
          knownIds.current = new Set(leads.map(l => l.id))
        } else {
          for (const l of leads) {
            if (!knownIds.current.has(l.id)) {
              const title = 'Novo Lead'
              const body  = `${l.nome} acabou de entrar no CRM.`
              pushNotif(title, body)
              addNotif({ id: `lead-${l.id}`, type: 'new_lead', title, body })
              knownIds.current.add(l.id)
            }
          }
        }

        const now = Date.now()
        for (const l of leads) {
          if (!l.atend || notifiedAt.current.has(l.id)) continue
          const dt = parseAtend(l.atend)
          if (!dt) continue
          const diff = dt.getTime() - now
          if (diff > 0 && diff <= 15 * 60 * 1000) {
            const min   = Math.round(diff / 60000)
            const title = 'Atendimento próximo'
            const body  = `${l.nome} em ${min} min (${l.atend})`
            pushNotif(title, body)
            addNotif({ id: `atend-${l.id}`, type: 'atend', title, body })
            notifiedAt.current.add(l.id)
          }
        }
      } catch { /* silencioso */ }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div ref={dropdownRef} style={{ position:'relative' }}>
      {/* Botão sino */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead() }}
        style={{
          position:'relative', background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:12, width:40, height:40, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--muted)',
        }}
        aria-label="Notificações"
      >
        <Bell size={18} strokeWidth={1.8} />
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-5, right:-5,
            background:'#ff4d6d', color:'#fff',
            borderRadius:'50%', fontSize:10, fontWeight:700,
            minWidth:17, height:17, display:'flex', alignItems:'center', justifyContent:'center',
            padding:'0 3px', lineHeight:1,
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:'absolute', top:48, right:0,
          width:320, maxHeight:420, overflowY:'auto',
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
          zIndex:100,
        }}>
          <div style={{
            padding:'14px 16px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Notificações</span>
            {notifs.length > 0 && (
              <button onClick={markAllRead} style={{
                background:'none', border:'none', color:'var(--muted)',
                fontSize:11, cursor:'pointer', textDecoration:'underline',
              }}>
                marcar todas lidas
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--muted)', fontSize:13 }}>
              Nenhuma notificação ainda
            </div>
          ) : (
            notifs.map(n => (
              <div key={n.id} style={{
                padding:'12px 16px', borderBottom:'1px solid var(--border)',
                background: n.read ? 'transparent' : 'rgba(108,99,255,0.07)',
                display:'flex', gap:10, alignItems:'flex-start',
              }}>
                <span style={{ fontSize:18, lineHeight:1, marginTop:2 }}>
                  {n.type === 'new_lead' ? '🆕' : '⏰'}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text)' }}>{n.title}</p>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'var(--muted)', wordBreak:'break-word' }}>{n.body}</p>
                  <p style={{ margin:'4px 0 0', fontSize:11, color:'var(--muted)', opacity:0.7 }}>{timeAgo(n.time)}</p>
                </div>
                {!n.read && (
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#6c63ff', marginTop:5, flexShrink:0 }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
