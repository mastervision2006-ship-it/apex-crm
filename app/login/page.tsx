'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/dashboard')
      } else {
        setError('Usuário ou senha incorretos')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      {/* Orbs */}
      <div style={{ position:'absolute', top:'10%', left:'5%', width:'min(400px, 60vw)', height:'min(400px, 60vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:'min(300px, 50vw)', height:'min(300px, 50vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400, padding:'0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <img src="/logo.png" alt="Apex Quantum" style={{ width:88, height:88, borderRadius:22, objectFit:'cover', marginBottom:18, boxShadow:'0 8px 32px rgba(108,99,255,0.35)' }} />
          <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:-1, margin:0 }}>Apex Quantum</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>CRM Premium · Gestão de Leads</p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:32 }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8, textAlign:'center' }}>Entrar no sistema</h2>
          <p style={{ color:'var(--muted)', fontSize:13, textAlign:'center', marginBottom:28 }}>Digite suas credenciais de acesso</p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--muted)', display:'block', marginBottom:6, fontWeight:600, letterSpacing:'0.8px' }}>USUÁRIO</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
                style={{ width:'100%', padding:'12px 14px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)', color:'#f0f2f8', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--muted)', display:'block', marginBottom:6, fontWeight:600, letterSpacing:'0.8px' }}>SENHA</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                style={{ width:'100%', padding:'12px 14px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)', color:'#f0f2f8', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background:'rgba(255,77,109,0.1)', border:'1px solid rgba(255,77,109,0.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#ff4d6d', textAlign:'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop:8, padding:'13px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#6c63ff,#5a52e0)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            >
              {loading ? (
                <>
                  <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  Entrando...
                </>
              ) : 'Acessar CRM'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:20 }}>
          Apex Quantum · {new Date().getFullYear()}
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
