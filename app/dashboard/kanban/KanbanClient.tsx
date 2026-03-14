'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Lead, FASES, COR, Fase } from '@/lib/sheets'

export function KanbanClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads]               = useState<Lead[]>(initialLeads)
  const [dragging, setDragging]         = useState<string|null>(null)
  const [over, setOver]                 = useState<Fase|null>(null)
  const [saving, setSaving]             = useState<string|null>(null)
  const [toast, setToast]               = useState<{msg:string, ok:boolean}|null>(null)
  const [activeColIdx, setActiveColIdx] = useState(0)
  const [cardModal, setCardModal]       = useState<Lead|null>(null)   // mobile
  const [moveDropdown, setMoveDropdown] = useState<string|null>(null) // desktop

  const boardRef  = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<ReturnType<typeof setInterval>|null>(null)

  /* ── fechar dropdown ao clicar fora ── */
  useEffect(() => {
    if (!moveDropdown) return
    const close = () => setMoveDropdown(null)
    // Usar 'click' (não 'mousedown') para não fechar antes do onClick dos botões
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [moveDropdown])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const stopScroll = () => {
    if (scrollRef.current) { clearInterval(scrollRef.current); scrollRef.current = null }
  }
  useEffect(() => () => stopScroll(), [])

  const onMobileScroll = useCallback(() => {
    const el = mobileRef.current; if (!el) return
    const colW = el.scrollWidth / FASES.length
    setActiveColIdx(Math.round(el.scrollLeft / colW))
  }, [])

  const goToCol = (idx: number) => {
    const el = mobileRef.current; if (!el) return
    const colW = el.scrollWidth / FASES.length
    el.scrollTo({ left: colW * idx, behavior: 'smooth' })
  }

  /* ════════════════════════════════════
     MOVE LEAD — core da funcionalidade
  ════════════════════════════════════ */
  const moveLead = async (lead: Lead, novaFase: Fase) => {
    if (lead.fase === novaFase) { setCardModal(null); setMoveDropdown(null); return }

    // 1. Fecha UI
    setCardModal(null)
    setMoveDropdown(null)

    // 2. Optimistic update — move imediatamente na tela
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, fase: novaFase } : l))
    setSaving(lead.id)

    try {
      const res  = await fetch('/api/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id, fase: novaFase }),
      })
      const data = await res.json()

      if (data.success) {
        showToast('✅ Movido para ' + novaFase, true)
        // revalidatePath já foi chamado no servidor — próxima visita traz dados frescos
      } else {
        throw new Error()
      }
    } catch {
      // Reverte somente se o servidor confirmou falha
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, fase: lead.fase } : l))
      showToast('❌ Erro ao salvar, tente novamente', false)
    } finally {
      setSaving(null)
    }
  }

  /* ── drag-and-drop (desktop) ── */
  const handleDragOver = (e: React.DragEvent, fase: Fase) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(fase)
    const board = boardRef.current; if (!board) return; stopScroll()
    const x = e.clientX, y = e.clientY, t = 100
    const r = board.getBoundingClientRect()
    const sH = x < r.left + t ? -10 : x > r.right - t ? 10 : 0
    const sV = y < t ? -10 : y > window.innerHeight - t ? 10 : 0
    if (sH || sV) scrollRef.current = setInterval(() => {
      if (sH) board.scrollLeft += sH
      if (sV) window.scrollBy(0, sV)
    }, 16)
  }

  const handleDrop = async (fase: Fase) => {
    stopScroll(); if (!dragging) return
    const lead = leads.find(l => l.id === dragging)
    if (!lead || lead.fase === fase) { setDragging(null); setOver(null); return }
    setDragging(null); setOver(null)
    await moveLead(lead, fase)
  }

  const refresh = async () => {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json()
      if (data.leads) setLeads(data.leads)
      showToast('✅ Atualizado!', true)
    } catch {
      showToast('❌ Erro ao atualizar', false)
    }
  }

  /* ════════════════════════════════════════
     CARD — mobile e desktop compartilhado
  ════════════════════════════════════════ */
  const renderCard = (lead: Lead, fase: Fase, isMobile: boolean) => {
    const cor      = COR[fase]
    const isSaving = saving === lead.id
    const isDropOpen = moveDropdown === lead.id

    return (
      <div
        key={lead.id}
        draggable={!isMobile}
        onDragStart={!isMobile ? e => { setDragging(lead.id); e.dataTransfer.effectAllowed = 'move' } : undefined}
        onDragEnd={!isMobile ? () => { setDragging(null); setOver(null); stopScroll() } : undefined}
        onClick={isMobile ? () => setCardModal(lead) : undefined}
        style={{
          background: 'var(--surface2)',
          borderRadius: 10,
          padding: '12px 14px',
          border: `1px solid ${isSaving ? cor.border : 'var(--border)'}`,
          cursor: isMobile ? 'pointer' : isSaving ? 'wait' : 'grab',
          opacity: dragging === lead.id ? 0.4 : 1,
          transition: 'border-color 0.15s, opacity 0.15s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {/* Indicador de saving */}
        {isSaving && (
          <div style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:'#f5a623', animation:'pulse 1s infinite' }} />
        )}

        {/* Badge de fase — só no mobile */}
        {isMobile && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap', background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{fase}</span>
            <span style={{ fontSize:10, color:'var(--muted)' }}>{lead.dias}d</span>
          </div>
        )}

        {/* Nome */}
        <p style={{ fontSize:13, fontWeight:600, lineHeight:1.35, margin:'0 0 8px', color:'#f0f2f8', paddingRight: isMobile ? 0 : 60 }}>{lead.nome}</p>

        {/* Infos */}
        {lead.tel   && <p style={{ fontSize:11, color:'var(--muted)', margin:'0 0 3px' }}>📱 {lead.tel}</p>}
        {lead.atend && <p style={{ fontSize:11, color:'#f5a623',     margin:'0 0 3px' }}>📅 {lead.atend}</p>}
        {lead.feedback && (
          <p style={{ fontSize:11, color:'var(--muted)', margin:'6px 0 0', padding:'7px 9px', borderRadius:7, background:'rgba(255,255,255,0.04)', lineHeight:1.4 }}>
            💬 {lead.feedback.substring(0,80)}{lead.feedback.length>80?'…':''}
          </p>
        )}

        {/* Footer — desktop */}
        {!isMobile && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize:10, color:'var(--muted)' }}>{lead.dataCad?.split(' ')[0]}</span>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{lead.dias}d</span>
          </div>
        )}

        {/* ── Botão MOVER (desktop only) ── */}
        {!isMobile && (
          <div style={{ position:'absolute', top:10, right:10 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); setMoveDropdown(isDropOpen ? null : lead.id) }}
              style={{
                padding:'3px 8px', borderRadius:7, border:'1px solid var(--border)',
                background: isDropOpen ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: isDropOpen ? '#6c63ff' : 'var(--muted)',
                fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.3px',
                transition:'all 0.15s',
              }}
            >
              MOVER {isDropOpen ? '▲' : '▼'}
            </button>

            {/* Dropdown */}
            {isDropOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50,
                  background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:12, padding:6, minWidth:180,
                  boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
                  display:'flex', flexDirection:'column', gap:3,
                }}
              >
                <p style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.8px', padding:'4px 10px 6px', margin:0, borderBottom:'1px solid var(--border)' }}>
                  Mover para
                </p>
                {FASES.map(f => {
                  const c = COR[f]
                  const isCurrent = lead.fase === f
                  return (
                    <button
                      key={f}
                      onClick={e => { e.stopPropagation(); moveLead(lead, f) }}
                      disabled={isCurrent}
                      style={{
                        width:'100%', padding:'8px 10px', borderRadius:8, textAlign:'left',
                        border:'none', cursor: isCurrent ? 'default' : 'pointer',
                        background: isCurrent ? c.bg : 'transparent',
                        color: isCurrent ? c.text : '#f0f2f8',
                        fontSize:12, fontWeight: isCurrent ? 700 : 400,
                        display:'flex', alignItems:'center', gap:8,
                        transition:'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <span style={{ width:8, height:8, borderRadius:'50%', background:c.text, flexShrink:0, display:'inline-block' }} />
                      {f}
                      {isCurrent && <span style={{ marginLeft:'auto', fontSize:10, opacity:0.6 }}>atual</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ════════════════════════════════════
     MODAL de detalhes do card (mobile)
  ════════════════════════════════════ */
  const CardModal = () => {
    if (!cardModal) return null
    const cor = COR[cardModal.fase]
    return (
      <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'flex-end' }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)' }} onClick={() => setCardModal(null)} />
        <div style={{
          position:'relative', width:'100%', zIndex:1,
          background:'var(--surface)', borderRadius:'20px 20px 0 0',
          padding:'20px 20px 40px', border:'1px solid var(--border)',
          maxHeight:'90vh', overflowY:'auto',
        }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)', margin:'0 auto 20px' }} />
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{cardModal.fase}</span>
          <p style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, margin:'12px 0 4px', lineHeight:1.2 }}>{cardModal.nome}</p>
          <p style={{ fontSize:11, color:'var(--muted)', fontFamily:'monospace', margin:'0 0 20px' }}>{cardModal.id}</p>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {cardModal.email && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:10, color:'var(--muted)', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Email</p>
                <p style={{ fontSize:13, margin:0 }}>{cardModal.email}</p>
              </div>
            )}
            {cardModal.tel && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:10, color:'var(--muted)', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Telefone</p>
                <p style={{ fontSize:13, margin:0 }}>📱 {cardModal.tel}</p>
              </div>
            )}
            {cardModal.atend && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:10, color:'var(--muted)', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Atendimento</p>
                <p style={{ fontSize:13, color:'#f5a623', margin:0 }}>📅 {cardModal.atend}</p>
              </div>
            )}
            {cardModal.feedback && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:10, color:'var(--muted)', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Feedback</p>
                <p style={{ fontSize:13, color:'var(--muted)', margin:0, lineHeight:1.5 }}>💬 {cardModal.feedback}</p>
              </div>
            )}
          </div>

          <p style={{ fontSize:12, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.8px', margin:'0 0 10px' }}>Mover para</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {FASES.map(fase => {
              const c = COR[fase]; const isCurrent = cardModal.fase === fase
              return (
                <button key={fase} onClick={() => moveLead(cardModal, fase)} style={{
                  width:'100%', padding:'13px 16px', borderRadius:12, textAlign:'left',
                  border:`1px solid ${isCurrent ? c.text : 'var(--border)'}`,
                  background: isCurrent ? c.bg : 'rgba(255,255,255,0.03)',
                  color: isCurrent ? c.text : '#f0f2f8',
                  fontSize:13, fontWeight: isCurrent ? 700 : 400,
                  cursor: isCurrent ? 'default' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  transition:'all 0.15s',
                }}>
                  {fase}
                  {isCurrent ? <span style={{ fontSize:11, opacity:0.7 }}>● atual</span> : <span style={{ fontSize:11, color:'var(--muted)' }}>→</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div style={{ position:'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:70, right:16, zIndex:999,
          padding:'12px 20px', borderRadius:12, fontSize:13, fontWeight:600,
          background: toast.ok ? 'rgba(0,212,170,0.15)' : 'rgba(255,77,109,0.15)',
          border:`1px solid ${toast.ok ? 'rgba(0,212,170,0.4)' : 'rgba(255,77,109,0.4)'}`,
          color: toast.ok ? '#00d4aa' : '#ff4d6d',
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
        }}>{toast.msg}</div>
      )}

      <CardModal />

      {/* Header */}
      <div style={{ padding:'20px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Kanban Board</h1>
          <p style={{ color:'var(--muted)', fontSize:12, marginTop:4 }}>
            {leads.length} lead{leads.length!==1?'s':''} · {FASES.length} fases
          </p>
        </div>
        <button onClick={refresh} style={{ padding:'8px 14px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--muted)', fontSize:13, cursor:'pointer', flexShrink:0 }}>
          🔄
        </button>
      </div>

      {/* ══════════════════════════════════
          MOBILE — scroll horizontal com snap
      ══════════════════════════════════ */}
      <div className="kanban-mobile-wrap" style={{ overflow:'hidden' }}>
        <div
          ref={mobileRef}
          onScroll={onMobileScroll}
          style={{
            display:'flex', overflowX:'scroll', overflowY:'visible',
            scrollSnapType:'x mandatory',
            WebkitOverflowScrolling:'touch' as never,
            gap:12, padding:'16px 16px 12px',
            width:'100%', boxSizing:'border-box',
            scrollbarWidth:'none' as never,
          } as React.CSSProperties}
        >
          {FASES.map((fase, idx) => {
            const cor      = COR[fase]
            const colLeads = leads.filter(l => l.fase === fase)
            const isActive = activeColIdx === idx
            return (
              <div key={fase} style={{
                flexShrink:0, width:'calc(100vw - 48px)', scrollSnapAlign:'start',
                borderRadius:16,
                background: isActive ? 'var(--surface)' : 'rgba(17,19,24,0.85)',
                border:`1px solid ${isActive ? cor.border : 'var(--border)'}`,
                borderTop:`3px solid ${cor.text}`,
                transition:'all 0.25s', minHeight:200,
                display:'flex', flexDirection:'column',
              }}>
                <div style={{ padding:'14px 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:cor.text }} />
                    <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:cor.text }}>{fase}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, padding:'2px 10px', borderRadius:20, background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{colLeads.length}</span>
                </div>
                <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:8, flex:1, overflowY:'auto', maxHeight:'calc(100vh - 260px)' }}>
                  {colLeads.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 0', gap:8 }}>
                      <div style={{ fontSize:28, opacity:0.3 }}>📋</div>
                      <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', margin:0 }}>Sem leads nesta fase</p>
                    </div>
                  ) : colLeads.map(lead => renderCard(lead, fase, true))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicadores de posição */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, padding:'0 0 12px' }}>
          {FASES.map((fase, idx) => {
            const isActive = activeColIdx === idx
            return (
              <button key={fase} onClick={() => goToCol(idx)} style={{
                width: isActive ? 24 : 7, height:7, borderRadius:4, padding:0, border:'none', cursor:'pointer',
                background: isActive ? COR[fase].text : 'rgba(255,255,255,0.2)',
                transition:'all 0.25s',
              }} />
            )
          })}
        </div>
        <p style={{ textAlign:'center', fontSize:11, color:'var(--muted)', margin:'0 0 8px', letterSpacing:'0.5px' }}>
          {activeColIdx + 1} / {FASES.length} · {FASES[activeColIdx]}
        </p>
      </div>

      {/* ══════════════════════════════════
          DESKTOP — drag-and-drop grid
      ══════════════════════════════════ */}
      <div className="kanban-desktop-wrap" style={{ padding:'16px 32px 32px' }}>
        {/* Drop zones ao arrastar */}
        {dragging && (
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {FASES.map(fase => {
              const cor = COR[fase]; const isOver = over === fase
              const isCurrent = leads.find(l=>l.id===dragging)?.fase === fase
              return (
                <div key={fase}
                  onDragOver={e=>{e.preventDefault();setOver(fase)}}
                  onDrop={()=>handleDrop(fase)}
                  onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOver(null)}}
                  style={{
                    flex:1, padding:'10px 8px', borderRadius:12, textAlign:'center',
                    fontSize:11, fontWeight:700, cursor:'copy', transition:'all 0.15s',
                    background: isOver ? cor.bg : isCurrent ? 'rgba(255,255,255,0.05)' : 'var(--surface)',
                    border:`2px solid ${isOver?cor.text:isCurrent?cor.border:'var(--border)'}`,
                    color: isOver?cor.text:isCurrent?cor.text:'var(--muted)',
                    transform: isOver?'scale(1.03)':'scale(1)',
                  }}
                >{isCurrent?'📍 ':''}{fase}</div>
              )
            })}
          </div>
        )}

        <div
          ref={boardRef}
          style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(220px, 1fr))', gap:14, alignItems:'start', overflowX:'auto', paddingBottom:16 }}
        >
          {FASES.map(fase => {
            const cor = COR[fase]; const colLeads = leads.filter(l=>l.fase===fase); const isOver = over===fase
            return (
              <div key={fase}
                onDragOver={e=>handleDragOver(e,fase)}
                onDrop={()=>handleDrop(fase)}
                onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){setOver(null);stopScroll()}}}
                style={{
                  borderRadius:16, transition:'background 0.15s, border-color 0.15s',
                  background: isOver ? cor.bg : 'var(--surface)',
                  border:`1px solid ${isOver?cor.border:'var(--border)'}`,
                  borderTop:`3px solid ${cor.text}`,
                  display:'flex', flexDirection:'column',
                  height:'calc(100vh - 140px)',
                }}
              >
                {/* Header fixo da coluna */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:cor.text }}>{fase}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, background:cor.bg, color:cor.text }}>{colLeads.length}</span>
                </div>
                {/* Cards com scroll interno */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, padding:12, overflowY:'auto', flex:1 }}>
                  {colLeads.length===0&&(
                    <div style={{ textAlign:'center', padding:'40px 0', fontSize:11, color:'var(--muted)', border:'1px dashed var(--border)', borderRadius:10 }}>
                      Solte aqui
                    </div>
                  )}
                  {colLeads.map(lead => renderCard(lead, fase, false))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .kanban-mobile-wrap  { display: block; }
        .kanban-desktop-wrap { display: none;  }
        @media (min-width: 768px) {
          .kanban-mobile-wrap  { display: none;  }
          .kanban-desktop-wrap { display: block; }
        }
      `}</style>
    </div>
  )
}
