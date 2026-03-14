import { supabase } from '@/lib/supabase'

export interface Lead {
  id:           string
  nome:         string
  email:        string
  tel:          string
  dataCad:      string
  atend:        string
  fase:         Fase
  resp:         string
  feedback:     string
  ultimaAt:     string
  dias:         number
  utm_source:   string
  utm_campaign: string
  utm_medium:   string
  utm_content:  string
  utm_term:     string
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
  const { data, error } = await supabase.from('leads').select('*').order('dataCad', { ascending: true })
  if (error) { console.error('Supabase fetchLeads:', error.message); return [] }
  return (data || []) as Lead[]
}
