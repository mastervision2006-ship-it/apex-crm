'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href:'/dashboard',           icon:'📊', label:'Overview'  },
  { href:'/dashboard/kanban',    icon:'🗂️', label:'Kanban'    },
  { href:'/dashboard/leads',     icon:'👥', label:'Leads'     },
  { href:'/dashboard/relatorio', icon:'📈', label:'Relatório' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method:'POST' })
    router.push('/login')
  }

  return (
    <aside style={{
      position:'fixed', left:0, top:0, height:'100vh', width:220,
      background:'var(--surface)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', zIndex:50,
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6c63ff,#00d4aa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
        <div>
          <p style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, lineHeight:1.2 }}>Apex Quantum</p>
          <p style={{ color:'var(--muted)', fontSize:11 }}>CRM Premium</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 }}>
        {nav.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:12, fontSize:13, fontWeight:500,
              textDecoration:'none', transition:'all 0.15s',
              background: active ? 'linear-gradient(135deg,rgba(108,99,255,0.25),rgba(0,212,170,0.15))' : 'transparent',
              color: active ? '#f0f2f8' : 'var(--muted)',
              border: active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
            }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              {label}
              {active && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#00d4aa' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding:'12px', borderTop:'1px solid var(--border)' }}>
        <button onClick={logout} style={{
          width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid var(--border)',
          background:'transparent', color:'var(--muted)', fontSize:13, cursor:'pointer',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  )
}
