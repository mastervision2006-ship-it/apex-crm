'use client'
import { useState } from 'react'
import { Lead } from '@/lib/sheets'

function parseParam(val: string, part: 'name' | 'id'): string {
  if (!val) return '—'
  const [name, id] = val.split('|')
  return part === 'name' ? (name || '—') : (id || '—')
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item) || 'Sem dados'
    acc[k] = acc[k] ? [...acc[k], item] : [item]
    return acc
  }, {} as Record<string, T[]>)
}

// dataCad format: "DD/MM/YYYY HH:MM"
function parseDateBR(dataCad: string | undefined): Date | null {
  if (!dataCad) return null
  const [datePart] = dataCad.split(' ')
  const [d, m, y] = datePart.split('/')
  if (!d || !m || !y) return null
  return new Date(Number(y), Number(m) - 1, Number(d))
}

// Convert YYYY-MM-DD input value to local midnight Date
function parseInputDate(val: string): Date | null {
  if (!val) return null
  const [y, m, d] = val.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function RastreamentoClient({ leads }: { leads: Lead[] }) {
  const [filtro, setFiltro] = useState<'criativo' | 'conjunto' | 'campanha'>('criativo')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fromDate = parseInputDate(dateFrom)
  const toDate = parseInputDate(dateTo)

  const filtered = leads.filter(l => {
    const d = parseDateBR(l.dataCad)
    if (!d) return true
    if (fromDate && d < fromDate) return false
    if (toDate && d > toDate) return false
    return true
  })

  const comUtm = filtered.filter(l => l.utm_content || l.utm_campaign || l.utm_medium)
  const semUtm = filtered.filter(l => !l.utm_content && !l.utm_campaign && !l.utm_medium)

  const keyFn = (l: Lead) => {
    if (filtro === 'criativo')  return parseParam(l.utm_content,  'name')
    if (filtro === 'conjunto')  return parseParam(l.utm_medium,   'name')
    return parseParam(l.utm_campaign, 'name')
  }

  const grupos = groupBy(comUtm, keyFn)
  const sorted = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length)

  const leadsTable = [...filtered]
    .reverse()
    .filter(l => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        l.nome?.toLowerCase().includes(q) ||
        l.utm_campaign?.toLowerCase().includes(q) ||
        l.utm_medium?.toLowerCase().includes(q) ||
        l.utm_content?.toLowerCase().includes(q) ||
        l.utm_term?.toLowerCase().includes(q)
      )
    })

  const total = comUtm.length

  return (
    <div className="page-pad">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>Rastreamento</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Origem dos leads por UTM</p>
      </div>

      {/* Date filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Filtrar por data:</span>
        <input
          type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: '#f0f2f8', fontSize: 12 }}
        />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>até</span>
        <input
          type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: '#f0f2f8', fontSize: 12 }}
        />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)',
            color: 'var(--muted)', fontSize: 12, cursor: 'pointer'
          }}>
            Limpar
          </button>
        )}
        {(dateFrom || dateTo) && (
          <span style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600 }}>{filtered.length} leads no período</span>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total rastreados', value: comUtm.length, color: '#6c63ff' },
          { label: 'Sem UTM',          value: semUtm.length, color: '#f5a623' },
          { label: 'Criativos únicos', value: Object.keys(groupBy(comUtm, l => parseParam(l.utm_content, 'name'))).length, color: '#00d4aa' },
          { label: 'Campanhas',        value: Object.keys(groupBy(comUtm, l => parseParam(l.utm_campaign, 'name'))).length, color: '#4a90d9' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: k.color }} />
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', margin: '0 0 8px' }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: k.color, margin: 0, lineHeight: 1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Agrupamento */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Leads por origem</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['criativo', 'conjunto', 'campanha'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: filtro === f ? 'rgba(108,99,255,0.2)' : 'transparent',
                color: filtro === f ? '#6c63ff' : 'var(--muted)',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Nenhum lead com UTM ainda</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map(([nome, ls]) => {
              const pct = total ? Math.round((ls.length / total) * 100) : 0
              const ganhos = ls.filter(l => l.fase === 'Fechado/Ganho').length
              return (
                <div key={nome} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f2f8' }}>{nome}</span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {ganhos > 0 && <span style={{ fontSize: 11, color: '#00d4aa', fontWeight: 700 }}>🏆 {ganhos} fechados</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff' }}>{ls.length} leads</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#6c63ff,#00d4aa)', width: `${pct}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabela detalhada */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Todos os leads</p>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lead, campanha, criativo..."
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: '#f0f2f8', fontSize: 12, width: 260 }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Lead', 'Campanha', 'Conjunto', 'Criativo', 'Placement', 'Data'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leadsTable.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f0f2f8', whiteSpace: 'nowrap' }}>{l.nome}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parseParam(l.utm_campaign, 'name')}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parseParam(l.utm_medium,   'name')}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parseParam(l.utm_content,  'name')}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{l.utm_term || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{l.dataCad?.split(' ')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
