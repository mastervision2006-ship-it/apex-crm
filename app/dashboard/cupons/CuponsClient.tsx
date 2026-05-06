'use client'
import { useState, useEffect, useCallback } from 'react'

interface Coupon {
  id: string
  code: string
  discount: number
  used: boolean
  used_at: string | null
  created_at: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CuponsClient() {
  const [coupons, setCoupons]           = useState<Coupon[]>([])
  const [discount, setDiscount]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [loadingList, setLoadingList]   = useState(true)
  const [lastGenerated, setLastGenerated] = useState<{ code: string; discount: number } | null>(null)
  const [copied, setCopied]             = useState(false)
  const [error, setError]               = useState('')

  const fetchCoupons = useCallback(async () => {
    const res = await fetch('/api/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoadingList(false)
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const handleGenerate = async () => {
    const val = Number(discount)
    if (!val || val <= 0) { setError('Informe um valor válido'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/coupons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: val }),
      })
      const data = await res.json()
      if (res.ok) {
        setLastGenerated(data)
        setDiscount('')
        fetchCoupons()
      } else {
        setError(data.error || 'Erro ao gerar código')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Códigos de Desconto</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
        Gere códigos de uso único para seus consultores compartilharem com leads.
      </p>

      {/* Gerador */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24, marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Gerar novo código</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{
              fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              display: 'block', marginBottom: 6,
            }}>
              Valor do desconto (R$)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 250"
              value={discount}
              onChange={e => { setDiscount(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
                background: 'var(--bg)', color: 'var(--fg)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
              }}
            />
            {error && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                {error}
              </span>
            )}
          </div>
          <div style={{ paddingTop: 24 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: loading ? 'var(--border)' : 'linear-gradient(135deg,#6c63ff,#00d4aa)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const,
              }}
            >
              {loading ? 'Gerando...' : '+ Gerar Código'}
            </button>
          </div>
        </div>

        {lastGenerated && (
          <div style={{
            marginTop: 20, padding: '16px 20px', borderRadius: 12,
            background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap' as const, gap: 12,
          }}>
            <div>
              <div style={{
                fontSize: 11, color: '#00d4aa', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4,
              }}>
                Código gerado — R$ {formatBRL(lastGenerated.discount)} de desconto
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, letterSpacing: '0.15em', color: '#f0f2f8' }}>
                {lastGenerated.code}
              </div>
            </div>
            <button
              onClick={() => copyCode(lastGenerated.code)}
              style={{
                padding: '8px 20px', borderRadius: 8,
                border: '1px solid rgba(0,212,170,0.4)',
                background: copied ? 'rgba(0,212,170,0.15)' : 'transparent',
                color: '#00d4aa', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Todos os códigos</h2>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {coupons.length} código{coupons.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingList ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Carregando...</div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Nenhum código gerado ainda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Código', 'Desconto', 'Status', 'Criado em'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontWeight: 600,
                      fontSize: 11, color: 'var(--muted)',
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em', fontSize: 14 }}>
                      {c.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      R$ {formatBRL(c.discount)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: c.used ? 'rgba(239,68,68,0.12)' : 'rgba(0,212,170,0.12)',
                        color: c.used ? '#ef4444' : '#00d4aa',
                        border: `1px solid ${c.used ? 'rgba(239,68,68,0.3)' : 'rgba(0,212,170,0.3)'}`,
                      }}>
                        {c.used ? 'Utilizado' : 'Disponível'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' as const }}>
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
