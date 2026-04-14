'use client'
import { useState } from 'react'
import { Lead, FASES, COR } from '@/lib/sheets'
import { useRealtimeLeads } from '@/lib/useRealtimeLeads'

const EMPTY_FORM = { nome:'', email:'', tel:'', atend:'', fase:'Novo Lead' as Lead['fase'], feedback:'' }

function calcDias(dataCad: string): number {
  if (!dataCad) return 0
  const [datePart] = dataCad.split(' ')
  const [day, month, year] = datePart.split('/')
  const start = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(start.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000))
}

type SortKey = 'dataCad' | 'nome'
type SortDir = 'asc' | 'desc'

function parseDateBR(s: string): number {
  if (!s) return 0
  const [datePart, timePart = '00:00'] = s.split(' ')
  const [d, m, y] = datePart.split('/')
  const [h, min]  = timePart.split(':')
  return new Date(+y, +m - 1, +d, +h, +min).getTime()
}

export function LeadsClient({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads]           = useState(initialLeads)
  useRealtimeLeads(setLeads)
  const [search, setSearch]         = useState('')
  const [faseFilter, setFaseFilter] = useState('todas')
  const [sortKey, setSortKey]       = useState<SortKey>('dataCad')
  const [sortDir, setSortDir]       = useState<SortDir>('desc')
  const [tooltip, setTooltip]       = useState<{ feedback: string; x: number; y: number } | null>(null)
  const [editLead, setEditLead]     = useState<Lead | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'dataCad' ? 'desc' : 'asc') }
  }

  const filtered = [...leads]
    .filter(l => {
      const q  = search.toLowerCase()
      const ok = !q || l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.tel.includes(q)
      return ok && (faseFilter === 'todas' || l.fase === faseFilter)
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'nome') return mul * a.nome.localeCompare(b.nome, 'pt-BR')
      return mul * (parseDateBR(a.dataCad) - parseDateBR(b.dataCad))
    })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function openEdit(l: Lead) {
    setForm({ nome: l.nome, email: l.email, tel: l.tel, atend: l.atend||'', fase: l.fase, feedback: l.feedback||'' })
    setEditLead(l)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setShowCreate(true)
  }

  async function handleSave() {
    if (!editLead) return
    setSaving(true)
    setEditLead(null)
    try {
      const res  = await fetch('/api/edit-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: editLead.id, fields: form }) })
      const data = await res.json()
      // Realtime UPDATE dispara automaticamente e sincroniza o estado
      if (!data.success) showToast('Erro ao salvar. Tente novamente.')
      else showToast('Lead atualizado!')
    } catch {
      showToast('Erro de conexão.')
    } finally { setSaving(false) }
  }

  async function handleCreate() {
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      const res  = await fetch('/api/create-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) {
        // Não adiciona manualmente — o Realtime INSERT já cuida disso
        setShowCreate(false)
        showToast('Lead criado!')
      } else {
        showToast('Erro ao criar lead.')
      }
    } catch {
      showToast('Erro de conexão.')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    setLeads(ls => ls.filter(l => l.id !== id))
    try {
      const res  = await fetch('/api/delete-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
      const data = await res.json()
      // Realtime DELETE confirma a remoção; se falhar, restaura
      if (!data.success) {
        setLeads(ls => leads) // restaura estado anterior
        showToast('Erro ao excluir.')
      } else showToast('Lead excluído.')
    } catch {
      setLeads(leads)
      showToast('Erro de conexão.')
    }
  }

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:10,
    background:'var(--surface2)', border:'1px solid var(--border)',
    color:'#f0f2f8', fontSize:13, outline:'none',
  }
  const labelStyle = { fontSize:11, color:'var(--muted)', display:'block' as const, marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'0.6px' }

  return (
    <div className="page-pad">
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Leads</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>{leads.length} leads captados no total</p>
        </div>
        <button onClick={openCreate} style={{
          padding:'10px 20px', borderRadius:12, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#6c63ff,#5a52e0)', color:'#fff', fontSize:13, fontWeight:600,
        }}>+ Novo Lead</button>
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
              {(['ID','Nome','Telefone','Email','Cadastro','Atendimento','Fase','Dias','Ações'] as const).map(h => {
                const key: SortKey | null = h === 'Nome' ? 'nome' : h === 'Cadastro' ? 'dataCad' : null
                const active = key && sortKey === key
                return (
                  <th key={h} onClick={key ? () => toggleSort(key) : undefined}
                    style={{ padding:'12px 16px', textAlign:'left', fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color: active ? '#a89aff' : 'var(--muted)', fontWeight:600, cursor: key ? 'pointer' : 'default', userSelect:'none', whiteSpace:'nowrap' }}>
                    {h}
                    {key && (
                      <span style={{ marginLeft:4, opacity: active ? 1 : 0.3, fontSize:9 }}>
                        {active ? (sortDir === 'asc' ? '▲' : '▼') : '▲'}
                      </span>
                    )}
                  </th>
                )
              })}
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
                    <div
                      style={{ display:'flex', alignItems:'center', gap:10 }}
                      onMouseEnter={l.feedback ? (e) => setTooltip({ feedback: l.feedback, x: e.clientX, y: e.clientY }) : undefined}
                      onMouseMove={l.feedback ? (e) => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null) : undefined}
                      onMouseLeave={l.feedback ? () => setTooltip(null) : undefined}
                    >
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(108,99,255,0.15)', color:'#6c63ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {(l.nome||'?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:500 }}>{l.nome}</span>
                      {l.source === 'apex-ads-privado' && (
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:6, background:'rgba(79,70,229,0.18)', color:'#a5b4fc', border:'1px solid rgba(79,70,229,0.35)', letterSpacing:'0.4px', flexShrink:0 }}>Meta Ads</span>
                      )}
                      {l.feedback && <span style={{ fontSize:9, color:'#6c63ff', marginLeft:2 }}>💬</span>}
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)' }}>{l.tel}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.email}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted)' }}>{l.dataCad?.split(' ')[0]}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#f5a623' }}>{l.atend||'—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, whiteSpace:'nowrap', background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{l.fase}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{calcDias(l.dataCad)}d</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => openEdit(l)} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:11, cursor:'pointer' }}>✏️ Editar</button>
                      <button onClick={() => handleDelete(l.id)} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid rgba(255,77,109,0.3)', background:'transparent', color:'#ff4d6d', fontSize:11, cursor:'pointer' }}>🗑️</button>
                    </div>
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
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(108,99,255,0.15)', color:'#6c63ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0 }}>
                  {(l.nome||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.nome}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', margin:0, fontFamily:'monospace' }}>{l.id}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                  <span style={{ fontSize:10, padding:'4px 10px', borderRadius:20, fontWeight:600, background:cor.bg, color:cor.text, border:`1px solid ${cor.border}`, whiteSpace:'nowrap' }}>{l.fase}</span>
                  {l.source === 'apex-ads-privado' && (
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:6, background:'rgba(79,70,229,0.18)', color:'#a5b4fc', border:'1px solid rgba(79,70,229,0.35)', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>Meta Ads</span>
                  )}
                </div>
              </div>
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
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
                <button onClick={() => openEdit(l)} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:12, cursor:'pointer' }}>✏️ Editar</button>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{calcDias(l.dataCad)}d</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tooltip de feedback */}
      {tooltip && (
        <div style={{
          position:'fixed', left:tooltip.x+14, top:tooltip.y-8, zIndex:9999,
          maxWidth:280, background:'#1a1d26', border:'1px solid rgba(108,99,255,0.35)',
          borderRadius:10, padding:'10px 14px', pointerEvents:'none',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <p style={{ fontSize:10, color:'#6c63ff', textTransform:'uppercase', letterSpacing:'0.8px', margin:'0 0 6px', fontWeight:600 }}>Feedback</p>
          <p style={{ fontSize:12, color:'#f0f2f8', margin:0, lineHeight:1.6 }}>{tooltip.feedback}</p>
        </div>
      )}

      {/* Modal editar / criar */}
      {(editLead || showCreate) && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => { setEditLead(null); setShowCreate(false) }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:800, margin:'0 0 20px' }}>
              {editLead ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input style={inputStyle} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome completo" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input style={inputStyle} value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} placeholder="(11) 99999-0000" />
                </div>
                <div>
                  <label style={labelStyle}>Atendimento</label>
                  <input style={inputStyle} value={form.atend} onChange={e=>setForm(f=>({...f,atend:e.target.value}))} placeholder="dd/mm/aaaa HH:MM" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label style={labelStyle}>Fase</label>
                <select style={{ ...inputStyle, cursor:'pointer' }} value={form.fase} onChange={e=>setForm(f=>({...f,fase:e.target.value as Lead['fase']}))}>
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Feedback</label>
                <textarea style={{ ...inputStyle, resize:'vertical', minHeight:80 }} value={form.feedback} onChange={e=>setForm(f=>({...f,feedback:e.target.value}))} placeholder="Observações sobre o lead..." />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button onClick={() => { setEditLead(null); setShowCreate(false) }} style={{ flex:1, padding:'11px', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={editLead ? handleSave : handleCreate} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#6c63ff,#5a52e0)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : editLead ? 'Salvar alterações' : 'Criar lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#1a1d26', border:'1px solid var(--border)', borderRadius:12, padding:'12px 20px', fontSize:13, color:'#f0f2f8', zIndex:9999, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
