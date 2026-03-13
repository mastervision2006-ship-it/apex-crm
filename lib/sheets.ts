export interface Lead {
  id:       string
  nome:     string
  email:    string
  tel:      string
  dataCad:  string
  atend:    string
  fase:     Fase
  resp:     string
  feedback: string
  ultimaAt: string
  dias:     number
}

export type Fase = 'Novo Lead' | 'Contato Feito' | 'Negociação' | 'Fechado/Ganho' | 'Perdido'

export const FASES: Fase[] = ['Novo Lead','Contato Feito','Negociação','Fechado/Ganho','Perdido']

export const COR: Record<Fase, { bg: string; text: string; border: string }> = {
  'Novo Lead':     { bg:'rgba(74,144,217,0.15)',  text:'#4a90d9', border:'rgba(74,144,217,0.3)'  },
  'Contato Feito': { bg:'rgba(245,166,35,0.15)',  text:'#f5a623', border:'rgba(245,166,35,0.3)'  },
  'Negociação':    { bg:'rgba(155,89,182,0.15)',  text:'#9b59b6', border:'rgba(155,89,182,0.3)'  },
  'Fechado/Ganho': { bg:'rgba(0,212,170,0.15)',   text:'#00d4aa', border:'rgba(0,212,170,0.3)'   },
  'Perdido':       { bg:'rgba(255,77,109,0.15)',   text:'#ff4d6d', border:'rgba(255,77,109,0.3)'  },
}

export async function fetchLeads(): Promise<Lead[]> {
  const url = process.env.APPS_SCRIPT_URL
  if (!url || url.includes('SEU_ID')) return mockLeads()
  try {
    const res = await fetch(url + '?action=getLeads', { next: { revalidate: 30 } })
    const data = await res.json()
    return data.leads || []
  } catch {
    return []
  }
}

// Dados de exemplo para quando não há URL configurada
function mockLeads(): Lead[] {
  return [
    { id:'L0001', nome:'João Silva',    email:'joao@gmail.com',   tel:'(11) 99999-0001', dataCad:'12/03/2026 08:00', atend:'qui., 12 de mar. 10:00', fase:'Novo Lead',     resp:'', feedback:'',                       ultimaAt:'', dias:1 },
    { id:'L0002', nome:'Maria Souza',   email:'maria@gmail.com',  tel:'(21) 98888-0002', dataCad:'12/03/2026 09:00', atend:'qui., 12 de mar. 14:00', fase:'Contato Feito', resp:'', feedback:'Interessada, retornar.',  ultimaAt:'', dias:1 },
    { id:'L0003', nome:'Carlos Lima',   email:'carlos@gmail.com', tel:'(31) 97777-0003', dataCad:'11/03/2026 10:00', atend:'qua., 11 de mar. 15:00', fase:'Negociação',    resp:'', feedback:'Pediu proposta.',          ultimaAt:'', dias:2 },
    { id:'L0004', nome:'Ana Pereira',   email:'ana@gmail.com',    tel:'(41) 96666-0004', dataCad:'10/03/2026 11:00', atend:'ter., 10 de mar. 09:00', fase:'Fechado/Ganho', resp:'', feedback:'Fechou o pacote gold.',   ultimaAt:'', dias:3 },
    { id:'L0005', nome:'Pedro Alves',   email:'pedro@gmail.com',  tel:'(51) 95555-0005', dataCad:'09/03/2026 12:00', atend:'seg., 09 de mar. 11:00', fase:'Perdido',       resp:'', feedback:'Desligou na abordagem.',  ultimaAt:'', dias:4 },
    { id:'L0006', nome:'Lucia Martins', email:'lucia@gmail.com',  tel:'(61) 94444-0006', dataCad:'08/03/2026 13:00', atend:'sex., 08 de mar. 16:00', fase:'Novo Lead',     resp:'', feedback:'',                       ultimaAt:'', dias:5 },
  ]
}
