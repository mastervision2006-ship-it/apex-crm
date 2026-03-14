'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background:'none', border:'none', color:'#f0f2f8', fontSize:22, cursor:'pointer', padding:'4px 8px', borderRadius:8, lineHeight:1 }}
          aria-label="Abrir menu"
        >
          ☰
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo.png" alt="Apex Quantum" style={{ width:28, height:28, borderRadius:8, objectFit:'cover' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14 }}>Apex Quantum</span>
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
