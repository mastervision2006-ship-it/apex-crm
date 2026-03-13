'use client'
import { useState } from 'react'
import { Lead, FASES, COR, Fase } from '@/lib/sheets'

export function KanbanClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads]     = useState<Lead[]>(initialLeads)
  const [dragging, setDragging] = useState<string|null>(null)
  const [over, setOver]         = useState<Fase|null>(null)

  const handleDrop = async (fase: Fase) => {
    if (!dragging) return
    const lead = leads.find(l => l.id === dragging)
    if (!lead || lead.fase === fase) { setDragging(null); setOver(null); return }
    setLeads(prev => prev.map(l => l.id === dragging ? {...l, fase} : l))
    setDragging(null); setOver(null)
    await fetch('/api/update-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id: dragging, fase}) })
  }

  const refresh = async () => {
    const res = await fetch('/api/leads')
    const data = await res.json()
    setLeads(data.leads || [])
  }

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Kanban Board</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>Arraste os cards para mover entre fases</p>
        </div>
        <button onClick={refresh} style={{ padding:'8px 18px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>
          🔄 Atualizar
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, alignItems:'start' }}>
        {FASES.map(fase => {
          const cor      = COR[fase]
          const colLeads = leads.filter(l => l.fase === fase)
          const isOver   = over === fase

          return (
            <div key={fase}
              onDragOver={e => { e.preventDefault(); setOver(fase) }}
              onDrop={() => handleDrop(fase)}
              onDragLeave={() => setOver(null)}
              style={{
                borderRadius:16, padding:12, minHeight:500, transition:'all 0.15s',
                background: isOver ? cor.bg : 'var(--surface)',
                border: `1px solid ${isOver ? cor.border : 'var(--border)'}`,
                borderTop: `3px solid ${cor.text}`,
              }}
            >
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'0 4px' }}>
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:cor.text }}>{fase}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, background:cor.bg, color:cor.text }}>{colLeads.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {colLeads.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px 0', fontSize:11, color:'var(--muted)', border:'1px dashed var(--border)', borderRadius:10 }}>
                    Solte aqui
                  </div>
                )}
                {colLeads.map(lead => (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => { setDragging(null); setOver(null) }}
                    style={{
                      background:'var(--surface2)', border:'1px solid var(--border)',
                      borderRadius:12, padding:14, cursor:'grab',
                      opacity: dragging === lead.id ? 0.4 : 1,
                      transition:'all 0.15s',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:cor.bg, color:cor.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {(lead.nome||'?')[0].toUpperCase()}
                      </div>
                      <p style={{ fontSize:12, fontWeight:600, lineHeight:1.3 }}>{lead.nome}</p>
                    </div>

                    {lead.tel && <p style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>📱 {lead.tel}</p>}
                    {lead.atend && <p style={{ fontSize:11, color:'#f5a623', marginBottom:4 }}>📅 {lead.atend}</p>}
                    {lead.feedback && (
                      <div style={{ marginTop:8, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.04)', fontSize:11, color:'var(--muted)', lineHeight:1.4 }}>
                        💬 {lead.feedback.substring(0,80)}{lead.feedback.length>80?'…':''}
                      </div>
                    )}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize:10, color:'var(--muted)' }}>{lead.dataCad?.split(' ')[0]}</span>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{lead.dias}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
