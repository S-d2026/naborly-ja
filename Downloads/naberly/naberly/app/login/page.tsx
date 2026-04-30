'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
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

  async function handleReset() {
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://naberlyja.com/reset-password',
    })
    setLoading(false)
    if (err) setError(err.message)
    else setResetSent(true)
  }

  if (resetSent) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📧</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Check your email</p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6, marginBottom: 20 }}>
            We sent a password reset link to {email}. Click it to set a new password.
          </p>
          <button onClick={() => { setResetMode(false); setResetSent(false) }} className="btn-ghost">
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div style={{ background: '#1B3A1D', padding: '20px 17px 15px', flexShrink: 0 }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>
          {resetMode ? 'Password reset' : 'Welcome back'}
        </p>
        <p style={{ color: '#fff', fontSize: 19 }}>
          {resetMode ? 'Reset your password' : 'Sign in to Naberly'}
        </p>
      </div>
      <div className="scroll-area" style={{ padding: '20px 18px' }}>
        {resetMode ? (
          <>
            <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6, marginBottom: 18 }}>
              Enter your email and we will send you a reset link.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Email</label>
              <input className="form-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            {error && <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}><p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p></div>}
            <button className="btn-primary" onClick={handleReset} disabled={loading} style={{ marginBottom: 9, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <button className="btn-ghost" onClick={() => { setResetMode(false); setError('') }}>
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 18 }}>
              <div>
                <label className="field-label">Email</label>
                <input className="form-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <label className="field-label">Password</label>
                  <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', cursor: 'pointer' }} onClick={() => { setResetMode(true); setError('') }}>Forgot?</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input className="form-field" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ paddingRight: 36 }} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A50', fontSize: 14, padding: '4px 6px' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
            {error && <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}><p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p></div>}
            <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{ marginBottom: 9, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <Link href="/signup" className="btn-ghost">Create account — it is free</Link>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', marginTop: 14 }}>
              <Link href="/" style={{ color: '#1B3A1D' }}>Back to Naberly</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
