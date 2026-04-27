'use client'
// app/login/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError(err.message)
    else router.push('/')
  }

  return (
    <div className="app-shell">
      <div style={{ background: '#1B3A1D', padding: '20px 17px 15px', flexShrink: 0 }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>Welcome back</p>
        <p style={{ color: '#fff', fontSize: 19 }}>Sign in to Naberly</p>
      </div>
      <div className="scroll-area" style={{ padding: '20px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 18 }}>
          <div>
            <label className="field-label">Email</label>
            <input className="form-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <label className="field-label">Password</label>
              <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', cursor: 'pointer' }}>Forgot?</span>
            </div>
            <input className="form-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
        </div>
        {error && <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}><p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p></div>}
        <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{ marginBottom: 9, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <Link href="/signup" className="btn-ghost">Create account — it's free</Link>
        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', marginTop: 14 }}>
          <Link href="/" style={{ color: '#1B3A1D' }}>← Back to Naberly</Link>
        </p>
      </div>
    </div>
  )
}
