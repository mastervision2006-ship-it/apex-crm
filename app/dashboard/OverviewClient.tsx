'use client'
import { Lead, FASES, COR } from '@/lib/sheets'
import { NotificationBell } from '@/components/NotificationBell'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const KPI_COLORS = ['#6c63ff','#4a90d9','#9b59b6','#00d4aa','#f5a623']

export function OverviewClient({ leads }: { leads: Lead[] }) {
  const total  = leads.length
  const ganhos = leads.filter(l => l.fase === 'Fechado/Ganho').length
  const taxa   = total ? ((ganhos/total)*100).toFixed(1) : '0.0'

  const kpis = [
    { label:'Total de Leads',    value: total,                                              icon:'👥', sub:'captados'            },
    { label:'Novos Leads',       value: leads.filter(l=>l.fase==='Novo Lead').length,       icon:'✨', sub:'aguardando contato'  },
    { label:'Em Negociação',     value: leads.filter(l=>l.fase==='Negociação').length,      icon:'🔥', sub:'oportunidades ativas' },
    { label:'Fechados/Ganhos',   value: ganhos,                                             icon:'🏆', sub:'conversões'          },
    { label:'Taxa de Conversão', value: taxa+'%',                                           icon:'📈', sub:'do total captado'    },
  ]

  const pieData = FASES.map(f => ({ name:f, value: leads.filter(l=>l.fase===f).length }))

  // Bug fix: handle "DD/MM/YYYY HH:MM" format correctly
  const barData = Array.from({length:6},(_,i)=>{
    const d = new Date(); d.setMonth(d.getMonth()-(5-i))
    const label = d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
    const m = d.getMonth(), y = d.getFullYear()
    const cnt = leads.filter(l=>{
      if(!l.dataCad) return false
      const parts = l.dataCad.split(' ')[0].split('/')
      if(parts.length < 3) return false
      const month = parseInt(parts[1]) - 1
      const year  = parseInt(parts[2])
      return !isNaN(month) && !isNaN(year) && month === m && year === y
    }).length
    return { name:label, leads:cnt }
  })

  const ultimos = leads.slice(-5).reverse()

  return (
    <div className="page-pad">
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Visão Geral</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>
            {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* KPIs */}
      <div className="grid-kpis">
        {kpis.map((k,i) => (
          <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:KPI_COLORS[i] }} />
            <div style={{ position:'absolute', right:16, top:16, fontSize:22, opacity:0.2 }}>{k.icon}</div>
            <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', marginBottom:10 }}>{k.label}</p>
            <p style={{ fontSize:28, fontWeight:800, color:KPI_COLORS[i], lineHeight:1 }}>{k.value}</p>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-charts">
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>🎯 Leads por Fase</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_,i) => <Cell key={i} fill={Object.values(COR)[i].text} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>📅 Leads por Mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="leads" fill="#6c63ff" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funil + Últimos */}
      <div className="grid-half">
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>🔻 Funil de Conversão</p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {FASES.map(fase => {
              const cnt = leads.filter(l=>l.fase===fase).length
              const pct = total ? Math.round((cnt/total)*100) : 0
              const cor = COR[fase].text
              return (
                <div key={fase}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:cor }}>{fase}</span>
                    <span style={{ fontSize:12, color:cor }}>{cnt} <span style={{ color:'var(--muted)', fontWeight:400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.05)' }}>
                    <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, background:cor, transition:'width 0.7s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>🕐 Últimos Leads</p>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {ultimos.map(l => {
              const cor = COR[l.fase]?.text || '#6b7280'
              return (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, transition:'background 0.15s' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(108,99,255,0.15)', color:'#6c63ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                    {(l.nome||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{l.nome}</p>
                    <p style={{ fontSize:11, color:'var(--muted)', margin:0 }}>{l.dataCad}</p>
                  </div>
                  <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600, background:COR[l.fase]?.bg, color:cor, border:`1px solid ${COR[l.fase]?.border}`, flexShrink:0, whiteSpace:'nowrap' }}>{l.fase}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
