'use client'
import { useState } from 'react'
import { Lead, FASES, COR } from '@/lib/sheets'

export function LeadsClient({ leads }: { leads: Lead[] }) {
  const [search, setSearch]         = useState('')
  const [faseFilter, setFaseFilter] = useState('todas')

  const filtered = [...leads].reverse().filter(l => {
    const q = search.toLowerCase()
    const ok = !q || l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.tel.includes(q)
    return ok && (faseFilter === 'todas' || l.fase === faseFilter)
  })

  return (
    <div className="page-pad">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Leads</h1>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>{leads.length} leads captados no total</p>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Buscar nome, email ou telefone..."
          style={{ flex:1, minWidth:200, padding:'10px 14px', borderRadius:12, background:'var(--surface)', border:'1px solid var(--border)', color:'#f0f2f8', fontSize:13, outline:'none' }} />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['todas',...FASES].map(f => {
            const active = faseFilter === f
            const cor = f !== 'todas' ? COR[f as keyof typeof COR] : null
            return (
              <button key={f} onClick={()=>setFaseFilter(f)} style={{
                padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer',
                border:`1px solid ${active?(cor?.border||'rgba(108,99,255,0.4)'):'var(--border)'}`,
                background: active ? (cor?.bg||'rgba(108,99,255,0.2)') : 'var(--surface)',
                color: active ? (cor?.text||'#6c63ff') : 'var(--muted)',
              }}>{f==='todas'?'Todos':f}</button>
            )
          })}
        </div>
      </div>

      {/* Tabela — desktop */}
      <div className="leads-table-wrap" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['ID','Nome','Telefone','Email','Cadastro','Atendimento','Fase','Feedback','Dias'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted)', fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0 && (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:48, color:'var(--muted)', fontSize:13 }}>Nenhum lead encontrado</td></tr>
            )}
            {filtered.map(l => {
              const cor = COR[l.fase] || { bg:'rgba(107,114,128,0.1)', text:'#6b7280', border:'rgba(107,114,128,0.3)' }
              return (
                <tr key={l.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding:'12px 16px', fontSize:11, color:'var(--muted)', fontFamily:'monospace' }}>{l.id}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(108,99,255,0.15)', color:'#6c63ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {(l.nome||'?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:500 }}>{l.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)' }}>{l.tel}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.email}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)' }}>{l.dataCad?.split(' ')[0]}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#f5a623' }}>{l.atend||'—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, whiteSpace:'nowrap', background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{l.fase}</span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.feedback||'—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{l.dias}d</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="leads-cards-wrap">
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:48, color:'var(--muted)', fontSize:13, background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)' }}>
            Nenhum lead encontrado
          </div>
        )}
        {filtered.map(l => {
          const cor = COR[l.fase] || { bg:'rgba(107,114,128,0.1)', text:'#6b7280', border:'rgba(107,114,128,0.3)' }
          return (
            <div key={l.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:16 }}>
              {/* Header do card */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(108,99,255,0.15)', color:'#6c63ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0 }}>
                  {(l.nome||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.nome}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', margin:0, fontFamily:'monospace' }}>{l.id}</p>
                </div>
                <span style={{ fontSize:10, padding:'4px 10px', borderRadius:20, fontWeight:600, background:cor.bg, color:cor.text, border:`1px solid ${cor.border}`, flexShrink:0, whiteSpace:'nowrap' }}>{l.fase}</span>
              </div>

              {/* Campos */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <p style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 3px' }}>Telefone</p>
                  <p style={{ fontSize:12, margin:0 }}>{l.tel||'—'}</p>
                </div>
                <div>
                  <p style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 3px' }}>Cadastro</p>
                  <p style={{ fontSize:12, margin:0 }}>{l.dataCad?.split(' ')[0]||'—'}</p>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <p style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 3px' }}>Email</p>
                  <p style={{ fontSize:12, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.email||'—'}</p>
                </div>
                {l.atend && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <p style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 3px' }}>Atendimento</p>
                    <p style={{ fontSize:12, color:'#f5a623', margin:0 }}>{l.atend}</p>
                  </div>
                )}
                {l.feedback && (
                  <div style={{ gridColumn:'1/-1', padding:'8px 10px', background:'rgba(255,255,255,0.04)', borderRadius:8, marginTop:2 }}>
                    <p style={{ fontSize:11, color:'var(--muted)', margin:0, lineHeight:1.5 }}>💬 {l.feedback}</p>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{l.dias}d</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
