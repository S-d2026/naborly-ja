'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, linkVendorToAmbassador } from '@/lib/supabase'

const PARISHES = [
  'Kingston','St. Andrew','St. Thomas','Portland','St. Mary',
  'St. Ann','Trelawny','St. James','Hanover','Westmoreland',
  'St. Elizabeth','Manchester','Clarendon','St. Catherine'
]

const WHAT_YOU_SELL = [
  'Fresh Produce','Cooked Food','Clothing & Fabric','Crafts & Souvenirs',
  'Seafood & Fish','Spices & Seasonings','Baked Goods','Beauty & Hair',
  'Electronics','Other'
]

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Daily']

function VendorSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [form, setForm] = useState({
    name: '', parish: '', district: '', whatsapp: '', phone: '',
    description: '', sells: [] as string[], days: [] as string[], referralCode: '',
  })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const fromSignup = !!(searchParams.get('name') || searchParams.get('whatsapp'))

  useEffect(() => {
    const nameParam   = searchParams.get('name')
    const waParam     = searchParams.get('whatsapp')
    const parishParam = searchParams.get('parish')
    const refParam    = searchParams.get('ref')
    if (nameParam || waParam || parishParam) {
      setForm(f => ({ ...f, name: nameParam || f.name, whatsapp: waParam || f.whatsapp, parish: parishParam || f.parish, referralCode: refParam || f.referralCode }))
      return
    }
    if (refParam) {
      setForm(f => ({ ...f, referralCode: refParam }))
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, whatsapp, parish, is_admin').eq('id', user.id).single()
      if (profile) {
        setForm(f => ({ ...f, name: profile.full_name || f.name, whatsapp: profile.whatsapp || f.whatsapp, parish: profile.parish || f.parish }))
        setIsAdmin(profile.is_admin || false)
      }
    })
  }, [searchParams])

  const toggle = (field: 'sells'|'days', value: string) => {
    setForm(f => ({ ...f, [field]: f[field].includes(value) ? f[field].filter(v => v !== value) : [...f[field], value] }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.parish || !form.whatsapp) { setErrorMsg('Please fill in Business Name, Parish, and WhatsApp number.'); return }
    setErrorMsg('')
    setStatus('loading')
    const sellsStr = form.sells.length ? 'Sells: ' + form.sells.join(', ') + '.' : ''
    const daysStr  = form.days.length  ? ' Trading days: ' + form.days.join(', ') + '.' : ''
    const fullDescription = [form.description, sellsStr, daysStr].filter(Boolean).join('\n')
    // Admin adds vendor → approved instantly. Vendor self-signup → pending until email verified.
    const listingStatus = isAdmin ? 'approved' : 'pending'

    const { error } = await supabase.from('listings').insert([{
      title: form.name, description: fullDescription, category: 'vendor' as any,
      listing_type: 'offer', parish: form.parish, district: form.district || null,
      whatsapp: form.whatsapp, is_free: false, is_anonymous: false,
      status: listingStatus, is_featured: false, user_id: null,
    }])
    if (error) { setErrorMsg('Something went wrong. Please try again.'); setStatus('error'); return }

    // If a referral code was entered, try to link this vendor to the ambassador.
    // Silently ignored if the code is invalid — never blocks the vendor's signup.
    if (form.referralCode.trim()) {
      await linkVendorToAmbassador(form.referralCode, form.whatsapp, form.name)
    }

    setStatus('success')
  }

  if (status === 'success') {
    const firstName = form.name.split(' ')[0]

    // Admin success screen — listing is live immediately
    if (isAdmin) {
      const waText = encodeURIComponent(`Hi ${firstName}! 🎉\n\nYou are now LIVE on NaberlyJA!\n\nCustomers near you can find your listing in the Browse section right now.\n\nShare with friends, family & neighbours so they can find you too! 💛💚\n\nWelcome to the NaberlyJA family! 🇯🇲`)
      return (
        <div className="app-shell">
          <div style={{ background: '#1B3A1D', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#fff', fontSize: 14 }}>Vendor added!</span>
          </div>
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontSize: 20, color: '#18180F', marginBottom: 8 }}>{form.name} is LIVE!</h1>
            <p style={{ fontSize: 13, color: '#5A5A50', marginBottom: '1.5rem', lineHeight: 1.6, fontFamily: '-apple-system, sans-serif' }}>
              Listing is approved and visible in Browse under Vendors.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={`https://wa.me/${form.whatsapp.replace(/[^0-9]/g, '')}?text=${waText}`} target="_blank" rel="noreferrer"
                style={{ background: '#25d366', color: '#fff', padding: '12px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
                Send WhatsApp Confirmation to Vendor
              </a>
              <Link href="/admin"
                style={{ background: '#1B3A1D', color: '#F5F0E6', padding: '12px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Vendor self-signup success screen — pending email verification
    return (
      <div className="app-shell">
        <div style={{ background: '#1B3A1D', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#fff', fontSize: 14 }}>Almost live!</span>
        </div>
        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: '1rem' }}>📧</div>
          <h1 style={{ fontSize: 20, color: '#18180F', marginBottom: 8 }}>One last step, {firstName}!</h1>
          <p style={{ fontSize: 13, color: '#5A5A50', marginBottom: '1.5rem', lineHeight: 1.6, fontFamily: '-apple-system, sans-serif' }}>
            Your listing is ready. <strong>Check your email and click the verification link</strong> to make your business go live on NaberlyJA.
          </p>
          <div style={{ background: '#D0E8BC', border: '1px solid #2D5A2E', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <p style={{ fontSize: 12, color: '#1B3A1D', lineHeight: 1.7, fontFamily: '-apple-system, sans-serif' }}>
              ✓ Business details saved{'\n'}
              ✓ Verification email sent{'\n'}
              ⏳ Listing goes live once you verify your email
            </p>
          </div>
          <Link href="/"
            style={{ color: '#5A5A50', fontSize: 13, padding: '8px', textAlign: 'center', textDecoration: 'none', fontFamily: '-apple-system, sans-serif' }}>
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div style={{ background: '#1B3A1D', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" className="back-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>←</Link>
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>List Your Business Free</span>
      </div>
      <div style={{ padding: '1rem 1rem 4rem' }}>
        {fromSignup && (
          <div style={{ background: '#D0E8BC', border: '1px solid #2D5A2E', borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D' }}>✓ Your name, parish and WhatsApp are filled in from your account. Just complete the selling details below.</p>
          </div>
        )}
        {errorMsg && (
          <div style={{ background: '#F0CABA', border: '1px solid #A84B2A', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#A84B2A', fontFamily: '-apple-system, sans-serif' }}>{errorMsg}</div>
        )}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#5A5A50', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>Your Business</p>
        <input placeholder="Business / Vendor Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, marginBottom: 10, background: '#FAFAF8', fontFamily: '-apple-system, sans-serif' }} />
        <select value={form.parish} onChange={e => setForm(f => ({ ...f, parish: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, marginBottom: 10, background: '#FAFAF8', fontFamily: '-apple-system, sans-serif' }}>
          <option value="">Select Parish *</option>
          {PARISHES.map(p => <option key={p}>{p}</option>)}
        </select>
        <input placeholder="Market / Area (e.g. Coronation Market)" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, marginBottom: 16, background: '#FAFAF8', fontFamily: '-apple-system, sans-serif' }} />
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#5A5A50', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>Contact</p>
        <input placeholder="WhatsApp Number * e.g. +1 876 XXX XXXX" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, marginBottom: 10, background: '#FAFAF8', fontFamily: '-apple-system, sans-serif' }} />
        <input placeholder="Phone Number (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, marginBottom: 16, background: '#FAFAF8', fontFamily: '-apple-system, sans-serif' }} />
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#5A5A50', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>What Do You Sell?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          {WHAT_YOU_SELL.map(c => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', border: `1.5px solid ${form.sells.includes(c) ? '#1B3A1D' : '#D8D0BC'}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, background: form.sells.includes(c) ? '#D0E8BC' : '#FAFAF8', fontFamily: '-apple-system, sans-serif' }}>
              <input type="checkbox" checked={form.sells.includes(c)} onChange={() => toggle('sells', c)} style={{ accentColor: '#1B3A1D' }} />{c}
            </label>
          ))}
        </div>
        <textarea placeholder="Describe your goods — what makes them special..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, minHeight: 80, marginBottom: 16, resize: 'vertical', background: '#FAFAF8', fontFamily: '-apple-system, sans-serif' }} />
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#5A5A50', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>Trading Days</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
          {DAYS.map(d => (
            <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', border: `1.5px solid ${form.days.includes(d) ? '#1B3A1D' : '#D8D0BC'}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, background: form.days.includes(d) ? '#D0E8BC' : '#FAFAF8', fontFamily: '-apple-system, sans-serif' }}>
              <input type="checkbox" checked={form.days.includes(d)} onChange={() => toggle('days', d)} style={{ accentColor: '#1B3A1D' }} />{d}
            </label>
          ))}
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#5A5A50', marginBottom: 8, fontFamily: '-apple-system, sans-serif' }}>Referred By an Ambassador?</p>
        <input placeholder="Referral Code (optional)" value={form.referralCode} onChange={e => setForm(f => ({ ...f, referralCode: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8D0BC', borderRadius: 8, fontSize: 14, marginBottom: 24, background: '#FAFAF8', fontFamily: '-apple-system, sans-serif', textTransform: 'uppercase' }} />
        <button onClick={handleSubmit} disabled={status === 'loading'}
          style={{ width: '100%', padding: '14px', background: '#1B3A1D', color: '#F5F0E6', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: '-apple-system, sans-serif', opacity: status === 'loading' ? 0.7 : 1 }}>
          {status === 'loading' ? 'Listing your business...' : 'List My Business on NaberlyJA →'}
        </button>
      </div>
    </div>
  )
}

export default function VendorSignupPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <VendorSignupContent />
    </Suspense>
  )
}
