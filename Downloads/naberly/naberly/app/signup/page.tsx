'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [parish, setParish] = useState('Kingston')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVendor, setIsVendor] = useState(false)
  const [services, setServices] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup() {
    if (!fullName || !email || !password || !whatsapp) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, whatsapp, parish, is_vendor: isVendor, services }
      }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    // Vendors go to vendor signup with details pre-filled via URL params
    if (isVendor) {
      const params = new URLSearchParams({ name: fullName, whatsapp, parish })
      router.push('/vendor-signup?' + params.toString())
    } else {
      router.push('/')
    }
  }

  return (
    <div className="app-shell">
      <div style={{ background: '#1B3A1D', padding: '17px 15px 13px', flexShrink: 0 }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>Join your community</p>
        <p style={{ color: '#fff', fontSize: 18 }}>Create your account</p>
      </div>
      <div className="scroll-area" style={{ padding: '15px 17px' }}>
        <div className="info-box" style={{ marginBottom: 13 }}>
          <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.6 }}>
            Free to join. Post needs, share help — starting in Jamaica, growing worldwide.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 16 }}>
          <div>
            <label className="field-label">Full name</label>
            <input className="form-field" placeholder="e.g. Marva Brown" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">WhatsApp number</label>
            <input className="form-field" placeholder="+1 876 XXX XXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} type="tel" />
            <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>How neighbors reach you</p>
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="form-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <label className="field-label">Your parish</label>
            <select className="form-field" style={{ appearance: 'none' }} value={parish} onChange={e => setParish(e.target.value)}>
              {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
  <label className="field-label">What work do you do or can do?</label>
  <input
    className="form-field"
    placeholder="e.g. Cook, carpenter, seamstress"
    value={services}
    onChange={e => setServices(e.target.value)}
  />
  <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>
    Optional — helps your neighbors find you
  </p>
</div>
          <div>
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-field" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 36 }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5A5A50', fontSize: 14, padding: '4px 6px' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Vendor checkbox */}
          <label
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px', border: `1.5px solid ${isVendor ? '#1B3A1D' : '#D8D0BC'}`, borderRadius: 10, cursor: 'pointer', background: isVendor ? '#D0E8BC' : '#FAFAF8', transition: 'all 0.15s' }}
          >
            <input
              type="checkbox"
              checked={isVendor}
              onChange={e => setIsVendor(e.target.checked)}
              style={{ accentColor: '#1B3A1D', marginTop: 1, width: 16, height: 16, flexShrink: 0 }}
            />
            <div>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 2 }}>
                I'm a vendor / I sell goods or services
              </p>
              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.5 }}>
                Tick this to list your business on NaberlyJA after signup — free, takes 1 minute.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
          </div>
        )}

        <button className="btn-primary" onClick={handleSignup} disabled={loading} style={{ marginBottom: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating account...' : isVendor ? 'Join & List My Business →' : 'Join the Naberhood'}
        </button>

        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', marginTop: 7 }}>
          Already a member? <Link href="/login" style={{ color: '#1B3A1D' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
