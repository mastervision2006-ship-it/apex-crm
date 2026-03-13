import { fetchLeads, FASES, COR } from '@/lib/sheets'

export default async function RelatorioPage() {
  const leads     = await fetchLeads()
  const total     = leads.length
  const ganhos    = leads.filter(l=>l.fase==='Fechado/Ganho').length
  const taxa      = total ? ((ganhos/total)*100).toFixed(1) : '0.0'
  const mediaDias = leads.length ? (leads.reduce((a,l)=>a+(Number(l.dias)||0),0)/leads.length).toFixed(1) : '0'
  const comAgend  = leads.filter(l=>l.atend&&l.atend!=='').length
  const semFeedback = leads.filter(l=>!l.feedback).length

  return (
    <div className="page-pad">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, letterSpacing:-0.5, margin:0 }}>Relatório</h1>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>Métricas detalhadas do seu funil</p>
      </div>

      {/* KPIs do relatório */}
      <div className="grid-4col">
        {[
          { label:'Taxa de Conversão',   value:taxa+'%',     color:'#00d4aa', desc:'leads → ganhos'      },
          { label:'Média Dias no Funil', value:mediaDias+'d',color:'#6c63ff', desc:'tempo médio'          },
          { label:'Com Agendamento',     value:comAgend,     color:'#f5a623', desc:'leads agendados'      },
          { label:'Sem Feedback',        value:semFeedback,  color:'#ff4d6d', desc:'precisam de atenção'  },
        ].map(m=>(
          <div key={m.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
            <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', marginBottom:10 }}>{m.label}</p>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, color:m.color, lineHeight:1 }}>{m.value}</p>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabela por fase */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
        <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, marginBottom:20 }}>Detalhamento por Fase</p>

        {/* Desktop: tabela */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Fase','Leads','% do Total','Dias Médio','Com Feedback'].map(h=>(
                  <th key={h} style={{ padding:'10px 0', textAlign:'left', fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted)', fontWeight:600, paddingRight:16 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FASES.map(fase=>{
                const fl  = leads.filter(l=>l.fase===fase)
                const cnt = fl.length
                const pct = total ? ((cnt/total)*100).toFixed(1) : '0.0'
                const med = cnt ? (fl.reduce((a,l)=>a+(Number(l.dias)||0),0)/cnt).toFixed(1) : '—'
                const cfb = fl.filter(l=>l.feedback).length
                const cor = COR[fase]
                return (
                  <tr key={fase} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding:'14px 0', paddingRight:16 }}>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, background:cor.bg, color:cor.text, border:`1px solid ${cor.border}` }}>{fase}</span>
                    </td>
                    <td style={{ padding:'14px 0', paddingRight:16, fontFamily:'Syne,sans-serif', fontWeight:700, color:cor.text, fontSize:18 }}>{cnt}</td>
                    <td style={{ padding:'14px 0', paddingRight:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ height:6, width:80, borderRadius:3, background:'rgba(255,255,255,0.05)', flexShrink:0 }}>
                          <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, background:cor.text }} />
                        </div>
                        <span style={{ fontSize:12, color:'var(--muted)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'14px 0', paddingRight:16, fontSize:13 }}>{med}{med!=='—'?'d':''}</td>
                    <td style={{ padding:'14px 0', fontSize:13 }}>{cnt>0?`${cfb}/${cnt}`:'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
