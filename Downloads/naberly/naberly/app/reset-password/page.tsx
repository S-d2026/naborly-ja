'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Extract token from URL hash and establish session
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) setError('Invalid or expired reset link. Please request a new one.')
            else setSessionReady(true)
          })
      } else {
        setError('Invalid reset link. Please request a new one.')
      }
    } else {
      // Check if session already exists (user already authenticated)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setSessionReady(true)
        else setError('Invalid or expired reset link. Please request a new one.')
      })
    }
  }, [])

  async function handleReset() {
    if (!password || !confirmPassword) { setError('Please fill in both fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message)
    else setSuccess(true)
  }

  if (success) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Password updated</p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6, marginBottom: 20 }}>
            Your password has been changed successfully.
          </p>
          <button onClick={() => router.push('/login')} className="btn-primary">Sign in</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div style={{ background: '#1B3A1D', padding: '20px 17px 15px', flexShrink: 0 }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>New password</p>
        <p style={{ color: '#fff', fontSize: 19 }}>Reset your password</p>
      </div>
      <div className="scroll-area" style={{ padding: '20px 18px' }}>
        {!sessionReady && !error && (
          <div className="loading">Verifying reset link...</div>
        )}
        {sessionReady && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 18 }}>
            <div>
              <label className="field-label">New password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-field" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 36 }} />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A50', fontSize: 14, padding: '4px 6px' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="field-label">Confirm new password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-field" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ paddingRight: 36 }} />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
          </div>
        )}
        {sessionReady && (
          <button className="btn-primary" onClick={handleReset} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating...' : 'Set new password'}
          </button>
        )}
      </div>
    </div>
  )
}
