'use client'
import { useState, useRef, useEffect } from 'react'
import { Lead, FASES, COR, Fase } from '@/lib/sheets'

export function KanbanClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads]       = useState<Lead[]>(initialLeads)
  const [dragging, setDragging] = useState<string|null>(null)
  const [over, setOver]         = useState<Fase|null>(null)
  const [saving, setSaving]     = useState<string|null>(null)
  const [toast, setToast]       = useState<{msg:string, ok:boolean}|null>(null)
  const boardRef   = useRef<HTMLDivElement>(null)
  const scrollRef  = useRef<any>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const stopScroll = () => {
    if (scrollRef.current) { clearInterval(scrollRef.current); scrollRef.current = null }
  }

  useEffect(() => () => stopScroll(), [])

  // Scroll horizontal e vertical enquanto arrasta
  const handleDragOver = (e: React.DragEvent, fase: Fase) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOver(fase)

    const board = boardRef.current
    if (!board) return

    stopScroll()

    const x = e.clientX
    const y = e.clientY
    const threshold = 100

    // Scroll horizontal do board
    const rectBoard = board.getBoundingClientRect()
    const scrollH = x < rectBoard.left + threshold ? -10
                  : x > rectBoard.right - threshold ? 10
                  : 0

    // Scroll vertical da página
    const scrollV = y < threshold ? -10
                  : y > window.innerHeight - threshold ? 10
                  : 0

    if (scrollH !== 0 || scrollV !== 0) {
      scrollRef.current = setInterval(() => {
        if (scrollH !== 0) board.scrollLeft += scrollH
        if (scrollV !== 0) window.scrollBy(0, scrollV)
      }, 16)
    }
  }

  const handleDrop = async (fase: Fase) => {
    stopScroll()
    if (!dragging) return
    const lead = leads.find(l => l.id === dragging)
    if (!lead || lead.fase === fase) { setDragging(null); setOver(null); return }

    setLeads(prev => prev.map(l => l.id === dragging ? { ...l, fase } : l))
    setDragging(null)
    setOver(null)
    setSaving(lead.id)

    try {
      const res = await fetch('/api/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id, fase }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ Movido para ' + fase, true)
      } else {
        throw new Error('falhou')
      }
    } catch {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, fase: lead.fase } : l))
      showToast('❌ Erro ao salvar, tente novamente', false)
    } finally {
      setSaving(null)
    }
  }

  const refresh = async () => {
    const res = await fetch('/api/leads')
    const data = await res.json()
    if (data.leads) setLeads(data.leads)
  }

  return (
    <div style={{ padding: 32, position: 'relative' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: toast.ok ? 'rgba(0,212,170,0.15)' : 'rgba(255,77,109,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(0,212,170,0.4)' : 'rgba(255,77,109,0.4)'}`,
          color: toast.ok ? '#00d4aa' : '#ff4d6d',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>Kanban Board</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Arraste o card para o lado para mudar de fase</p>
        </div>
        <button onClick={refresh} style={{ padding: '8px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
          🔄 Atualizar
        </button>
      </div>

      {/* Indicador de fases no topo — zona de drop sempre visível */}
      {dragging && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {FASES.map(fase => {
            const cor     = COR[fase]
            const isOver  = over === fase
            const lead    = leads.find(l => l.id === dragging)
            const isCurrent = lead?.fase === fase
            return (
              <div key={fase}
                onDragOver={e => { e.preventDefault(); setOver(fase) }}
                onDrop={() => handleDrop(fase)}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null) }}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 12, textAlign: 'center',
                  fontSize: 11, fontWeight: 700, cursor: 'copy', transition: 'all 0.15s',
                  background: isOver ? cor.bg : isCurrent ? 'rgba(255,255,255,0.05)' : 'var(--surface)',
                  border: `2px solid ${isOver ? cor.text : isCurrent ? cor.border : 'var(--border)'}`,
                  color: isOver ? cor.text : isCurrent ? cor.text : 'var(--muted)',
                  transform: isOver ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {isCurrent ? '📍 ' : ''}{fase}
              </div>
            )
          })}
        </div>
      )}

      {/* Board com scroll horizontal */}
      <div
        ref={boardRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))',
          gap: 14,
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: 16,
        }}
      >
        {FASES.map(fase => {
          const cor      = COR[fase]
          const colLeads = leads.filter(l => l.fase === fase)
          const isOver   = over === fase

          return (
            <div key={fase}
              onDragOver={e => handleDragOver(e, fase)}
              onDrop={() => handleDrop(fase)}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) { setOver(null); stopScroll() }
              }}
              style={{
                borderRadius: 16, padding: 12, minHeight: 400, transition: 'all 0.15s',
                background: isOver ? cor.bg : 'var(--surface)',
                border: `1px solid ${isOver ? cor.border : 'var(--border)'}`,
                borderTop: `3px solid ${cor.text}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: cor.text }}>{fase}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: cor.bg, color: cor.text }}>{colLeads.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colLeads.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 11, color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 10 }}>
                    Solte aqui
                  </div>
                )}
                {colLeads.map(lead => {
                  const isSaving = saving === lead.id
                  return (
                    <div key={lead.id}
                      draggable
                      onDragStart={e => { setDragging(lead.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragging(null); setOver(null); stopScroll() }}
                      style={{
                        background: 'var(--surface2)', borderRadius: 12, padding: 14,
                        border: `1px solid ${isSaving ? cor.border : 'var(--border)'}`,
                        cursor: isSaving ? 'wait' : 'grab',
                        opacity: dragging === lead.id ? 0.4 : 1,
                        transition: 'all 0.15s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        position: 'relative',
                      }}
                    >
                      {isSaving && (
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#f5a623', animation: 'pulse 1s infinite' }} />
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: cor.bg, color: cor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(lead.nome || '?')[0].toUpperCase()}
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{lead.nome}</p>
                      </div>

                      {lead.tel && <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>📱 {lead.tel}</p>}
                      {lead.atend && <p style={{ fontSize: 11, color: '#f5a623', marginBottom: 4 }}>📅 {lead.atend}</p>}
                      {lead.feedback && (
                        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                          💬 {lead.feedback.substring(0, 80)}{lead.feedback.length > 80 ? '…' : ''}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{lead.dataCad?.split(' ')[0]}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}>{lead.dias}d</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
