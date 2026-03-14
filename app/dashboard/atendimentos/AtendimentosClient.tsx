'use client'
import { useState, useEffect } from 'react'
import { Lead, FASES, COR } from '@/lib/sheets'
import { useRealtimeLeads } from '@/lib/useRealtimeLeads'

const MESES: Record<string, number> = {
  'jan':0,'fev':1,'mar':2,'abr':3,'mai':4,'jun':5,
  'jul':6,'ago':7,'set':8,'out':9,'nov':10,'dez':11,
}

function parseAtend(atend: string): Date | null {
  if (!atend) return null
  const m = atend.match(/(\d{1,2})\s+de\s+(\w+)\.?\s+(\d{2}):(\d{2})/)
  if (!m) return null
  const month = MESES[m[2].toLowerCase()]
  if (month === undefined) return null
  const now = new Date()
  const d = new Date(now.getFullYear(), month, Number(m[1]), Number(m[3]), Number(m[4]))
  if (d.getTime() < now.getTime() - 86400000 * 30) d.setFullYear(now.getFullYear() + 1)
  return d
}

function formatWhatsApp(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

function getUrgencia(dt: Date): 'atrasado' | 'urgente' | 'hoje' | 'futuro' {
  const now = Date.now()
  const diff = dt.getTime() - now
  if (diff < 0) return 'atrasado'
  if (diff <= 60 * 60 * 1000) return 'urgente'
  if (dt.toDateString() === new Date().toDateString()) return 'hoje'
  return 'futuro'
}

const COR_URG = {
  atrasado: { bg: 'rgba(255,77,109,0.15)', border: 'rgba(255,77,109,0.4)', dot: '#ff4d6d', label: 'Atrasado' },
  urgente:  { bg: 'rgba(245,166,35,0.15)', border: 'rgba(245,166,35,0.4)', dot: '#f5a623', label: 'Próxima hora' },
  hoje:     { bg: 'rgba(108,99,255,0.1)',  border: 'rgba(108,99,255,0.3)', dot: '#6c63ff', label: 'Hoje' },
  futuro:   { bg: 'rgba(255,255,255,0.03)',border: 'var(--border)',        dot: '#00d4aa', label: 'Futuro' },
}

const HORARIOS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

function proximoDiaUtil(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  if (d.getDay() === 6) d.setDate(d.getDate() + 2)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' })
}

function hoje(): string {
  return new Date().toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' })
}

export function AtendimentosClient({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  useRealtimeLeads(setLeads)

  const [now, setNow] = useState(new Date())
  const [modalAtendido, setModalAtendido] = useState<Lead | null>(null)
  const [modalRemarcar, setModalRemarcar]  = useState<Lead | null>(null)
  const [feedback, setFeedback]  = useState('')
  const [fase, setFase]          = useState<Lead['fase']>('Contato Feito')
  const [novaData, setNovaData]  = useState(hoje())
  const [novoHorario, setNovoHorario] = useState('09:00')
  const [saving, setSaving]      = useState(false)
  const [toast, setToast]        = useState('')

  // Atualiza o relógio a cada minuto para recalcular urgências
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Filtra leads com atend e ordena por prioridade
  const agendados = leads
    .filter(l => l.atend && l.fase !== 'Fechado/Ganho' && l.fase !== 'Perdido')
    .map(l => ({ lead: l, dt: parseAtend(l.atend) }))
    .filter(x => x.dt !== null)
    .sort((a, b) => a.dt!.getTime() - b.dt!.getTime()) as { lead: Lead; dt: Date }[]

  const hoje_count    = agendados.filter(x => x.dt.toDateString() === now.toDateString()).length
  const atrasados     = agendados.filter(x => x.dt.getTime() < now.getTime()).length
  const proximo       = agendados.find(x => x.dt.getTime() > now.getTime())

  function countdown(dt: Date): string {
    const diff = dt.getTime() - now.getTime()
    if (diff <= 0) return 'Agora'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 0) return `em ${h}h ${m}min`
    return `em ${m}min`
  }

  async function handleAtendido() {
    if (!modalAtendido) return
    setSaving(true)
    try {
      const res = await fetch('/api/edit-lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modalAtendido.id, fields: { feedback, fase } })
      })
      const data = await res.json()
      if (data.success) {
        setLeads(ls => ls.map(l => l.id === modalAtendido.id ? { ...l, feedback, fase } : l))
        setModalAtendido(null)
        showToast('Atendimento registrado!')
      } else showToast('Erro ao salvar.')
    } catch { showToast('Erro de conexão.') }
    finally { setSaving(false) }
  }

  async function handleRemarcar() {
    if (!modalRemarcar) return
    setSaving(true)
    const atend = `${novaData} ${novoHorario}`
    try {
      const res = await fetch('/api/edit-lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modalRemarcar.id, fields: { atend } })
      })
      const data = await res.json()
      if (data.success) {
        setLeads(ls => ls.map(l => l.id === modalRemarcar.id ? { ...l, atend } : l))
        setModalRemarcar(null)
        showToast('Atendimento remarcado!')
      } else showToast('Erro ao salvar.')
    } catch { showToast('Erro de conexão.') }
    finally { setSaving(false) }
  }

  return (
    <div className="page-pad">
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:999, background:'#1e2030', border:'1px solid var(--border)', borderRadius:12, padding:'12px 20px', fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Atendimentos</h1>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>Agenda de atendimentos por prioridade</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'#6c63ff' }} />
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', margin:'0 0 8px' }}>Hoje</p>
          <p style={{ fontSize:26, fontWeight:800, color:'#6c63ff', margin:0 }}>{hoje_count}</p>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'#ff4d6d' }} />
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', margin:'0 0 8px' }}>Atrasados</p>
          <p style={{ fontSize:26, fontWeight:800, color:'#ff4d6d', margin:0 }}>{atrasados}</p>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'#00d4aa' }} />
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', margin:'0 0 8px' }}>Próximo</p>
          <p style={{ fontSize:16, fontWeight:800, color:'#00d4aa', margin:0 }}>
            {proximo ? `${proximo.lead.nome.split(' ')[0]} ${countdown(proximo.dt)}` : '—'}
          </p>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'#4a90d9' }} />
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', margin:'0 0 8px' }}>Total agendados</p>
          <p style={{ fontSize:26, fontWeight:800, color:'#4a90d9', margin:0 }}>{agendados.length}</p>
        </div>
      </div>

      {/* Lista */}
      {agendados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)', fontSize:14 }}>Nenhum atendimento agendado</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {agendados.map(({ lead, dt }) => {
            const urg = getUrgencia(dt)
            const c   = COR_URG[urg]
            const cor = COR[lead.fase]
            const waLink = `https://wa.me/${formatWhatsApp(lead.tel)}`
            return (
              <div key={lead.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius:16, padding:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                  {/* Esquerda */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
                      <span style={{ fontSize:10, fontWeight:700, color:c.dot, textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</span>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:600, background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{lead.fase}</span>
                    </div>

                    <p style={{ fontSize:17, fontWeight:800, margin:'0 0 4px', color:'#f0f2f8' }}>{lead.nome}</p>

                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom: lead.feedback ? 10 : 0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color: urg === 'atrasado' ? '#ff4d6d' : '#f5a623' }}>
                        📅 {lead.atend}
                      </span>
                      {lead.tel && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                          fontSize:12, color:'#25d366', textDecoration:'none', fontWeight:600,
                          display:'flex', alignItems:'center', gap:4,
                          padding:'3px 10px', borderRadius:20, background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.25)'
                        }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          {lead.tel}
                        </a>
                      )}
                    </div>

                    {lead.feedback && (
                      <p style={{ fontSize:12, color:'var(--muted)', margin:0, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.04)', lineHeight:1.5 }}>
                        💬 {lead.feedback}
                      </p>
                    )}
                  </div>

                  {/* Botões */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                    <button onClick={() => { setModalAtendido(lead); setFeedback(lead.feedback||''); setFase(lead.fase) }} style={{
                      padding:'8px 16px', borderRadius:10, border:'1px solid rgba(0,212,170,0.3)',
                      background:'rgba(0,212,170,0.1)', color:'#00d4aa',
                      fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                    }}>
                      ✅ Atendido
                    </button>
                    <button onClick={() => { setModalRemarcar(lead); setNovaData(hoje()); setNovoHorario('09:00') }} style={{
                      padding:'8px 16px', borderRadius:10, border:'1px solid var(--border)',
                      background:'rgba(255,255,255,0.04)', color:'var(--muted)',
                      fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                    }}>
                      🔄 Remarcar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Atendido */}
      {modalAtendido && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)' }} onClick={() => setModalAtendido(null)} />
          <div style={{ position:'relative', zIndex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:24, width:'100%', maxWidth:420 }}>
            <h3 style={{ fontWeight:800, fontSize:18, margin:'0 0 4px' }}>Registrar Atendimento</h3>
            <p style={{ color:'var(--muted)', fontSize:13, margin:'0 0 20px' }}>{modalAtendido.nome}</p>

            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Resultado / Feedback</label>
            <textarea
              value={feedback} onChange={e => setFeedback(e.target.value)}
              rows={3} placeholder="O que aconteceu no atendimento?"
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'#f0f2f8', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:14 }}
            />

            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Mover para fase</label>
            <select value={fase} onChange={e => setFase(e.target.value as Lead['fase'])} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'#f0f2f8', fontSize:13, marginBottom:20 }}>
              {FASES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModalAtendido(null)} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={handleAtendido} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background:'#00d4aa', color:'#0a0b14', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Remarcar */}
      {modalRemarcar && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)' }} onClick={() => setModalRemarcar(null)} />
          <div style={{ position:'relative', zIndex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:24, width:'100%', maxWidth:380 }}>
            <h3 style={{ fontWeight:800, fontSize:18, margin:'0 0 4px' }}>Remarcar Atendimento</h3>
            <p style={{ color:'var(--muted)', fontSize:13, margin:'0 0 20px' }}>{modalRemarcar.nome}</p>

            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Data</label>
            <select value={novaData} onChange={e => setNovaData(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'#f0f2f8', fontSize:13, marginBottom:14 }}>
              <option value={hoje()}>{hoje()} (hoje)</option>
              <option value={proximoDiaUtil()}>{proximoDiaUtil()}</option>
            </select>

            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>Horário</label>
            <select value={novoHorario} onChange={e => setNovoHorario(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'#f0f2f8', fontSize:13, marginBottom:20 }}>
              {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModalRemarcar(null)} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={handleRemarcar} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background:'#6c63ff', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Salvando...' : 'Remarcar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
