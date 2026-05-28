'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getUserListings, type Listing } from '@/lib/supabase'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const PLANS = [
  {
    key: 'weekly',
    label: 'Weekly Boost',
    price: 500,
    days: 7,
    usd: 3.25,
    perks: ['Top of browse results in your parish', 'Featured chip on your listing', '7 days visibility boost'],
    color: '#EDE7D9',
    border: '#D8D0BC',
  },
  {
    key: 'monthly',
    label: 'Monthly Boost',
    price: 1500,
    days: 30,
    usd: 9.75,
    perks: ['Everything in Weekly', '30 days visibility', 'Featured row on home page', 'Best value'],
    color: '#1B3A1D',
    border: '#1B3A1D',
    featured: true,
  },
  {
    key: 'vendor',
    label: 'Vendor Standard',
    price: 4000,
    days: 30,
    usd: 26.00,
    perks: ['Everything in Monthly', 'Multiple listings boosted', 'Priority in all parish feeds', 'Vendor badge'],
    color: '#F5F0E6',
    border: '#C8821A',
  },
  {
    key: 'vendor_premium',
    label: 'Vendor Premium',
    price: 8000,
    days: 30,
    usd: 52.00,
    perks: ['Everything in Vendor Standard', 'Top placement across all parishes', 'Featured on home screen', 'WhatsApp notification push'],
    color: '#F5F0E6',
    border: '#1B3A1D',
  },
]

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE || ''

function BoostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('listing')

  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<string>(preselectedId || '')
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<string>('paypal')
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string>('')

  const plan = PLANS.find(p => p.key === selectedPlan)!

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
      setIsAdmin(profile?.is_admin || false)
      const { data: lsts } = await getUserListings(data.user.id)
      const active = (lsts as Listing[] || []).filter(l => l.status === 'approved')
      setListings(active)
      if (!preselectedId && active.length > 0) setSelectedListing(active[0].id)
      setLoading(false)
    })
  }, [router, preselectedId])

  async function activateBoost(listingId: string, planData: typeof PLANS[0], payMethod: string, note?: string) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + planData.days * 24 * 60 * 60 * 1000)
    await supabase.from('boosts').insert([{
      listing_id: listingId,
      user_id: userId,
      plan: planData.label,
      price_jmd: planData.price,
      duration_days: planData.days,
      payment_method: payMethod,
      payment_note: note || null,
      payment_status: 'paid',
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }])
    const { error: featErr } = await supabase.from('listings').update({
      is_featured: true,
      featured_until: expiresAt.toISOString(),
    }).eq('id', listingId)
    if (featErr) console.error('Featured update failed:', featErr.message)
  }

  async function handleCashSubmit() {
    if (!selectedListing) { setError('Please select a listing to boost.'); return }
    setSubmitting(true)
    setError('')
    const listing = listings.find(l => l.id === selectedListing)
    const { error: err } = await supabase.from('boosts').insert([{
      listing_id: selectedListing,
      user_id: userId,
      plan: plan.label,
      price_jmd: plan.price,
      duration_days: plan.days,
      payment_method: paymentMethod,
      payment_note: paymentNote.trim() || null,
      payment_status: paymentMethod === 'free' ? 'paid' : 'pending',
      activated_at: paymentMethod === 'free' ? new Date().toISOString() : null,
      expires_at: paymentMethod === 'free' ? new Date(Date.now() + plan.days * 86400000).toISOString() : null,
    }])
    if (paymentMethod === 'free') {
      await supabase.from('listings').update({
        is_featured: true,
        featured_until: new Date(Date.now() + plan.days * 86400000).toISOString(),
      }).eq('id', selectedListing)
    }
    setSubmitting(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    if (paymentMethod !== 'free') {
      const num = '19174432797'
      const msg = encodeURIComponent(
        'NaberlyJA — Boost request (cash)\n\nListing: ' + (listing?.title || selectedListing) +
        '\nPlan: ' + plan.label + ' — $' + plan.price.toLocaleString() + ' JMD / $' + plan.usd + ' USD' +
        '\nPayment: cash' +
        (paymentNote ? '\nNote: ' + paymentNote : '') +
        '\n\nPlease activate when payment confirmed.'
      )
      window.open('https://wa.me/' + num + '?text=' + msg, '_blank')
    }
    setSuccess(true)
  }

  if (loading) return <div className="app-shell"><div className="loading">Loading...</div></div>

  if (success) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⭐</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>
            {paymentMethod === 'paypal' ? 'Boost activated!' : paymentMethod === 'free' ? 'Boost applied!' : 'Boost request submitted'}
          </p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6, marginBottom: 20 }}>
            {paymentMethod === 'paypal'
              ? 'Payment confirmed. Your listing is now featured — active for ' + plan.days + ' days.'
              : paymentMethod === 'free'
              ? 'Free boost applied. Your listing is now featured for ' + plan.days + ' days.'
              : 'Your request has been submitted. Once payment is confirmed your listing will go live as featured.'}
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
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)' }}>Get more visibility</p>
            <p style={{ color: '#fff', fontSize: 14 }}>Boost a listing</p>
          </div>
        </div>

        <div className="scroll-area" style={{ padding: 13 }}>

          <p className="eyebrow" style={{ marginBottom: 8 }}>1. Choose your listing</p>
          {listings.length === 0 ? (
            <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 13, marginBottom: 16, border: '1px solid #D8D0BC' }}>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>You have no active listings. Post something first.</p>
              <Link href="/post" style={{ color: '#1B3A1D', fontFamily: '-apple-system, sans-serif', fontSize: 12, fontWeight: 700 }}>Post a listing</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {listings.map(l => (
                <button key={l.id} onClick={() => setSelectedListing(l.id)}
                  style={{ background: selectedListing === l.id ? '#1B3A1D' : '#EDE7D9', border: '1.5px solid ' + (selectedListing === l.id ? '#1B3A1D' : '#D8D0BC'), borderRadius: 9, padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: selectedListing === l.id ? '#fff' : '#18180F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</p>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: selectedListing === l.id ? 'rgba(255,255,255,0.6)' : '#5A5A50' }}>{l.district || l.parish} · {l.category}</p>
                </button>
              ))}
            </div>
          )}

          <p className="eyebrow" style={{ marginBottom: 8 }}>2. Choose a plan</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {PLANS.map(p => (
              <button key={p.key} onClick={() => setSelectedPlan(p.key)}
                style={{ background: selectedPlan === p.key ? p.featured ? '#1B3A1D' : '#EDE7D9' : p.color, border: '2px solid ' + (selectedPlan === p.key ? '#C8821A' : p.border), borderRadius: 12, padding: 13, textAlign: 'left', cursor: 'pointer', position: 'relative' }}>
                {p.featured && (
                  <span style={{ position: 'absolute', top: -9, right: 12, background: '#C8821A', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>Most popular</span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 7 }}>
                  <div>
                    <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: p.featured ? '#fff' : '#18180F' }}>{p.label}</p>
                    <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: p.featured ? 'rgba(255,255,255,0.5)' : '#5A5A50', marginTop: 1 }}>{p.days} days</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 17, color: '#C8821A', fontFamily: 'Georgia, serif' }}>${p.price.toLocaleString()} JMD</p>
                    <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: p.featured ? 'rgba(255,255,255,0.4)' : '#5A5A50' }}>~${p.usd.toFixed(2)} USD</p>
                  </div>
                </div>
                {p.perks.map((perk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: '#C8821A', fontSize: 10, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: p.featured ? 'rgba(255,255,255,0.75)' : '#5A5A50', lineHeight: 1.5 }}>{perk}</p>
                  </div>
                ))}
              </button>
            ))}
          </div>

          <p className="eyebrow" style={{ marginBottom: 8 }}>3. Pay to activate</p>
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
                  <span>Free boost <span style={{ fontSize: 9, fontWeight: 400 }}>Admin only</span></span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: paymentMethod === 'free' ? 'rgba(255,255,255,0.7)' : '#854F0B' }}>Complimentary — no payment required</span>
                </button>
              </>
            )}
          </div>

          {paymentMethod === 'cash' && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Payment note (optional)</label>
              <input className="form-field" placeholder="e.g. Cash received from vendor name..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
            </div>
          )}

          <div className="info-box" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.65 }}>
              {paymentMethod === 'paypal'
                ? 'Pay securely via PayPal. Your listing is activated automatically the moment payment is confirmed — no waiting.'
                : paymentMethod === 'free'
                ? 'Apply a complimentary boost. Listing will be activated immediately.'
                : 'Cash payment received in person. Submit to activate the boost.'}
            </p>
          </div>

          {error && (
            <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
            </div>
          )}

          {paymentMethod === 'paypal' && selectedListing && (
            <div style={{ marginBottom: 14 }}>
              <PayPalButtons
                style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                createOrder={(_data: any, actions: any) => {
                  return actions.order.create({
                    purchase_units: [{
                      amount: { value: plan.usd.toFixed(2), currency_code: 'USD' },
                      description: 'NaberlyJA — ' + plan.label,
                    }]
                  })
                }}
                onApprove={async (_data: any, actions: any) => {
                  const order = await actions.order.capture()
                  if (order.status === 'COMPLETED') {
                    await activateBoost(selectedListing, plan, 'paypal')
                    setSuccess(true)
                  }
                }}
                onError={() => setError('Payment failed. Please try again or choose another payment method.')}
              />
            </div>
          )}

          {(paymentMethod === 'cash' || paymentMethod === 'free') && (
            <button className="btn-primary" onClick={handleCashSubmit} disabled={submitting || !selectedListing}
              style={{ marginBottom: 14, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : paymentMethod === 'free' ? 'Apply free boost' : 'Submit boost request'}
            </button>
          )}

        </div>
      </div>
    </PayPalScriptProvider>
  )
}

export default function BoostPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <BoostContent />
    </Suspense>
  )
}
