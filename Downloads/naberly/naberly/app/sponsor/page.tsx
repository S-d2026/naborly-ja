'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const RELAY = '+19174432797'
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE || ''

const PACKAGES = [
  {
    name: 'Weekly Spot',
    price: '$2,500 JMD',
    usd: 16.25,
    days: 7,
    duration: '7 days',
    features: ['Sponsor card in home feed', 'Sponsor card in browse feed', 'WhatsApp button to your business', 'Seen by your parish neighbours'],
    color: '#EDE7D9',
    border: '#D8D0BC',
    textColor: '#18180F',
  },
  {
    name: 'Monthly Spot',
    price: '$8,000 JMD',
    usd: 52.00,
    days: 30,
    duration: '30 days',
    features: ['Everything in Weekly', '30 days of visibility', 'Best value for regular businesses', 'Cancel anytime'],
    color: '#1B3A1D',
    border: '#1B3A1D',
    textColor: '#fff',
    featured: true,
  },
  {
    name: 'Featured + Sponsor',
    price: '$15,000 JMD',
    usd: 97.00,
    days: 30,
    duration: '30 days',
    features: ['Everything in Monthly', 'Your listing pinned to top of feed', 'Maximum visibility', 'Priority WhatsApp support'],
    color: '#F5F0E6',
    border: '#C8821A',
    textColor: '#18180F',
  },
]

export default function SponsorPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('paypal')
  const [businessName, setBusinessName] = useState('')
  const [businessWhatsApp, setBusinessWhatsApp] = useState('')
  const [parish, setParish] = useState('')
  const [tagline, setTagline] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [success, setSuccess] = useState(false)
  const [successPkg, setSuccessPkg] = useState<typeof PACKAGES[0] | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'packages' | 'details' | 'pay'>('packages')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        const { data: profile } = await supabase.from('profiles').select('is_admin, full_name, whatsapp, parish').eq('id', data.user.id).single()
        setIsAdmin(profile?.is_admin || false)
        if (profile?.whatsapp) setBusinessWhatsApp(profile.whatsapp)
        if (profile?.parish) setParish(profile.parish)
      }
    })
  }, [])

  const pkg = PACKAGES.find(p => p.name === selectedPackage)

  async function activateSponsor(payMethod: string, note?: string) {
    if (!pkg) return
    const now = new Date()
    const expiresAt = new Date(now.getTime() + pkg.days * 24 * 60 * 60 * 1000)
    await supabase.from('sponsors').insert([{
      business_name: businessName.trim(),
      tagline: tagline.trim() || null,
      parish: parish.trim() || null,
      whatsapp: businessWhatsApp.trim() || null,
      package: pkg.name,
      payment_method: payMethod,
      payment_note: note || null,
      payment_status: 'paid',
      is_active: true,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }])
    setSuccessPkg(pkg)
    setSuccess(true)
  }

  async function handleCashSubmit() {
    if (!businessName.trim()) { setError('Please enter your business name.'); return }
    if (!businessWhatsApp.trim()) { setError('Please enter your WhatsApp number.'); return }
    if (!pkg) return
    if (paymentMethod !== 'free') {
      const num = RELAY.replace(/\D/g, '')
      const msg = encodeURIComponent(
        'NaberlyJA — Sponsor request (cash)\n\nBusiness: ' + businessName +
        '\nPackage: ' + pkg.name + ' — ' + pkg.price + ' / $' + pkg.usd + ' USD' +
        '\nParish: ' + parish +
        (paymentNote ? '\nNote: ' + paymentNote : '') +
        '\n\nPlease activate when payment confirmed.'
      )
      window.open('https://wa.me/' + num + '?text=' + msg, '_blank')
      await supabase.from('sponsors').insert([{
        business_name: businessName.trim(),
        tagline: tagline.trim() || null,
        parish: parish.trim() || null,
        whatsapp: businessWhatsApp.trim() || null,
        package: pkg.name,
        payment_method: paymentMethod,
        payment_note: paymentNote || null,
        payment_status: 'pending',
        is_active: false,
      }])
    } else {
      await activateSponsor('free')
    }
    setSuccessPkg(pkg)
    setSuccess(true)
  }

  if (success && successPkg) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏪</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>
            {paymentMethod === 'paypal' || paymentMethod === 'free' ? 'Sponsorship activated!' : 'Request submitted!'}
          </p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6, marginBottom: 20 }}>
            {paymentMethod === 'paypal'
              ? 'Payment confirmed. Your business is now live in the Naberly feed — active for ' + successPkg.days + ' days.'
              : paymentMethod === 'free'
              ? 'Complimentary sponsorship applied. Your business is now live for ' + successPkg.days + ' days.'
              : 'Your request has been submitted. Once payment is confirmed your business will go live in the feed.'}
          </p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', disableFunding: 'paylater,credit' }}>
      <div className="app-shell">
        <div className="header-sm">
          <Link href="/" className="back-btn">←</Link>
          <div>
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)' }}>Reach your Naberhood</p>
            <p style={{ color: '#fff', fontSize: 14 }}>
              {step === 'packages' ? 'Sponsor Naberly JA' : step === 'details' ? 'Your business details' : 'Complete your sponsorship'}
            </p>
          </div>
        </div>

        <div className="scroll-area" style={{ padding: 13 }}>

          {/* STEP 1 — Packages */}
          {step === 'packages' && (
            <>
              <div style={{ background: '#1B3A1D', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 6 }}>Why sponsor Naberly?</p>
                <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
                  Your business appears in front of real neighbours — people actively looking for food, services, rides and help in your parish.
                </p>
                {[
                  'Hyper-local — your parish, your neighbours',
                  'WhatsApp contact built in — they message you directly',
                  'Pay securely via PayPal — instant activation',
                  'Cancel anytime — weekly or monthly',
                ].map((point, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 8, marginBottom: 7 }}>
                    <span style={{ color: '#C8821A', fontSize: 12, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{point}</p>
                  </div>
                ))}
              </div>

              <p className="eyebrow" style={{ marginBottom: 10 }}>Choose a package</p>

              {PACKAGES.map(p => (
                <div key={p.name} style={{ background: p.color, border: '2px solid ' + (selectedPackage === p.name ? '#C8821A' : p.border), borderRadius: 12, padding: 14, marginBottom: 12, position: 'relative', cursor: 'pointer' }}
                  onClick={() => setSelectedPackage(p.name)}>
                  {p.featured && (
                    <div style={{ position: 'absolute', top: -10, right: 12, background: '#C8821A', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Most popular
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: p.textColor, marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: p.featured ? 'rgba(255,255,255,0.5)' : '#5A5A50' }}>{p.duration}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 18, color: p.featured ? '#C8821A' : '#1B3A1D', fontFamily: 'Georgia, serif' }}>{p.price}</p>
                      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: p.featured ? 'rgba(255,255,255,0.4)' : '#5A5A50' }}>~${p.usd.toFixed(2)} USD</p>
                    </div>
                  </div>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 7, marginBottom: 5 }}>
                      <span style={{ color: p.featured ? '#C8821A' : '#2D5A2E', fontSize: 11, flexShrink: 0 }}>✓</span>
                      <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: p.featured ? 'rgba(255,255,255,0.75)' : '#5A5A50', lineHeight: 1.5 }}>{f}</p>
                    </div>
                  ))}
                  {selectedPackage === p.name && (
                    <div style={{ marginTop: 10, background: '#C8821A', color: '#fff', borderRadius: 6, padding: '6px 0', textAlign: 'center', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700 }}>
                      ✓ Selected
                    </div>
                  )}
                </div>
              ))}

              <div style={{ background: '#F5F0E6', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC', marginBottom: 13 }}>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 5 }}>Early adopter offer</p>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.65 }}>
                  First 3 sponsors get their first month free. Show us your business, we show your Naberhood. WhatsApp us to claim your free spot.
                </p>
                <button
                  onClick={() => {
                    const num = RELAY.replace(/\D/g, '')
                    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent('Hi Naberly, I would like to claim the free early adopter sponsorship for my business.'), '_blank')
                  }}
                  style={{ marginTop: 10, width: '100%', background: '#2D5A2E', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}
                >
                  Claim free first month
                </button>
              </div>

              <button
                onClick={() => { if (selectedPackage) setStep('details') else setError('Please select a package first.') }}
                className="btn-primary"
                style={{ marginBottom: 8 }}
              >
                Continue →
              </button>

              {error && <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#A84B2A', textAlign: 'center' }}>{error}</p>}

              <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.65, textAlign: 'center' }}>
                  Pay securely via PayPal. No contracts. Cancel anytime. Questions? WhatsApp us at {RELAY}
                </p>
              </div>
            </>
          )}

          {/* STEP 2 — Business details */}
          {step === 'details' && (
            <>
              <div style={{ background: '#EDE7D9', borderRadius: 8, padding: '10px 12px', marginBottom: 16, border: '1px solid #D8D0BC' }}>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  Selected: <strong style={{ color: '#1B3A1D' }}>{selectedPackage}</strong> — ~${pkg?.usd.toFixed(2)} USD · {pkg?.days} days
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 16 }}>
                <div>
                  <label className="field-label">Business name *</label>
                  <input className="form-field" placeholder="e.g. Rose Hall Pharmacy" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">WhatsApp number *</label>
                  <input className="form-field" placeholder="+1 876 XXX XXXX" value={businessWhatsApp} onChange={e => setBusinessWhatsApp(e.target.value)} type="tel" />
                  <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>Customers will WhatsApp you directly</p>
                </div>
                <div>
                  <label className="field-label">Parish</label>
                  <input className="form-field" placeholder="e.g. St. James" value={parish} onChange={e => setParish(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Tagline (optional)</label>
                  <input className="form-field" placeholder="e.g. Best prices in Montego Bay" value={tagline} onChange={e => setTagline(e.target.value)} />
                  <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>One line shown under your business name in the feed</p>
                </div>
              </div>

              {error && (
                <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
                </div>
              )}

              <button className="btn-primary" onClick={() => {
                if (!businessName.trim()) { setError('Please enter your business name.'); return }
                if (!businessWhatsApp.trim()) { setError('Please enter your WhatsApp number.'); return }
                setError('')
                setStep('pay')
              }} style={{ marginBottom: 8 }}>
                Continue to payment →
              </button>

              <button onClick={() => setStep('packages')} className="btn-ghost" style={{ marginBottom: 14 }}>
                ← Back
              </button>
            </>
          )}

          {/* STEP 3 — Payment */}
          {step === 'pay' && pkg && (
            <>
              <div style={{ background: '#EDE7D9', borderRadius: 8, padding: '10px 12px', marginBottom: 16, border: '1px solid #D8D0BC' }}>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  <strong style={{ color: '#1B3A1D' }}>{businessName}</strong> · {selectedPackage} · ~${pkg.usd.toFixed(2)} USD · {pkg.days} days
                </p>
              </div>

              <p className="eyebrow" style={{ marginBottom: 8 }}>Payment method</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <button onClick={() => setPaymentMethod('paypal')}
                  style={{ background: paymentMethod === 'paypal' ? '#1B3A1D' : '#EDE7D9', border: '1.5px solid ' + (paymentMethod === 'paypal' ? '#1B3A1D' : '#D8D0BC'), borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: paymentMethod === 'paypal' ? '#fff' : '#18180F', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>PayPal</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: paymentMethod === 'paypal' ? 'rgba(255,255,255,0.7)' : '#5A5A50' }}>Card · Apple Pay · Google Pay — instant activation</span>
                </button>
                <button disabled style={{ background: '#F5F0E6', border: '1.5px solid #D8D0BC', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#B0A898', cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Lynk</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#B0A898' }}>Coming soon</span>
                </button>
                {isAdmin && (
                  <>
                    <button onClick={() => setPaymentMethod('cash')}
                      style={{ background: paymentMethod === 'cash' ? '#633806' : '#F5EDD8', border: '1.5px solid ' + (paymentMethod === 'cash' ? '#633806' : '#C8821A'), borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: paymentMethod === 'cash' ? '#fff' : '#633806', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Cash <span style={{ fontSize: 9, fontWeight: 400 }}>Admin only</span></span>
                      <span style={{ fontSize: 10, fontWeight: 400, color: paymentMethod === 'cash' ? 'rgba(255,255,255,0.7)' : '#854F0B' }}>In-person payment received</span>
                    </button>
                    <button onClick={() => setPaymentMethod('free')}
                      style={{ background: paymentMethod === 'free' ? '#633806' : '#F5EDD8', border: '1.5px solid ' + (paymentMethod === 'free' ? '#633806' : '#C8821A'), borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: paymentMethod === 'free' ? '#fff' : '#633806', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Free sponsorship <span style={{ fontSize: 9, fontWeight: 400 }}>Admin only</span></span>
                      <span style={{ fontSize: 10, fontWeight: 400, color: paymentMethod === 'free' ? 'rgba(255,255,255,0.7)' : '#854F0B' }}>Complimentary — no payment required</span>
                    </button>
                  </>
                )}
              </div>

              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Payment note (optional)</label>
                  <input className="form-field" placeholder="e.g. Cash received from business name..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                </div>
              )}

              <div className="info-box" style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.65 }}>
                  {paymentMethod === 'paypal'
                    ? 'Pay securely via PayPal. Your sponsorship activates automatically the moment payment is confirmed — no waiting.'
                    : paymentMethod === 'free'
                    ? 'Apply a complimentary sponsorship. Business will go live immediately.'
                    : 'Cash payment received in person. Submit to activate the sponsorship.'}
                </p>
              </div>

              {error && (
                <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div style={{ marginBottom: 14 }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                    createOrder={(_data: any, actions: any) => {
                      return actions.order.create({
                        purchase_units: [{
                          amount: { value: pkg.usd.toFixed(2), currency_code: 'USD' },
                          description: 'NaberlyJA — ' + pkg.name + ' Sponsorship',
                        }]
                      })
                    }}
                    onApprove={async (_data: any, actions: any) => {
                      const order = await actions.order.capture()
                      if (order.status === 'COMPLETED') {
                        await activateSponsor('paypal')
                      }
                    }}
                    onError={() => setError('Payment failed. Please try again.')}
                  />
                </div>
              )}

              {(paymentMethod === 'cash' || paymentMethod === 'free') && (
                <button className="btn-primary" onClick={handleCashSubmit} style={{ marginBottom: 14 }}>
                  {paymentMethod === 'free' ? 'Apply free sponsorship' : 'Submit sponsorship request'}
                </button>
              )}

              <button onClick={() => setStep('details')} className="btn-ghost" style={{ marginBottom: 14 }}>
                ← Back
              </button>
            </>
          )}

        </div>

        <nav className="bottom-nav">
          <Link href="/" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Home</span></Link>
          <Link href="/browse" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="M15 15L19 19" strokeLinecap="round"/></svg><span className="nav-label">Browse</span></Link>
          <div className="fab-wrapper"><Link href="/post" className="fab"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 2V15M2 8.5H15" strokeLinecap="round"/></svg></Link><span className="nav-label" style={{ color: '#5A5A50' }}>Post</span></div>
          <Link href="/favorites" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 18.5C11 18.5 3 13.5 3 7.5C3 5.3 4.8 3.5 7 3.5C8.8 3.5 10.3 4.5 11 5C11.7 4.5 13.2 3.5 15 3.5C17.2 3.5 19 5.3 19 7.5C19 13.5 11 18.5 11 18.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Saved</span></Link>
          <Link href="/account" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg><span className="nav-label">Me</span></Link>
        </nav>
      </div>
    </PayPalScriptProvider>
  )
}
