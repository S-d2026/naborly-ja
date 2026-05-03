'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getUserListings, type Listing } from '@/lib/supabase'

const PLANS = [
  {
    key: 'weekly',
    label: 'Weekly Boost',
    price: 500,
    days: 7,
    usd: '~$3 USD',
    perks: ['Top of browse results in your parish', 'Featured chip on your listing', '7 days visibility boost'],
    color: '#EDE7D9',
    border: '#D8D0BC',
  },
  {
    key: 'monthly',
    label: 'Monthly Boost',
    price: 1500,
    days: 30,
    usd: '~$10 USD',
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
    usd: '~$26 USD',
    perks: ['Everything in Monthly', 'Multiple listings boosted', 'Priority in all parish feeds', 'Vendor badge'],
    color: '#F5F0E6',
    border: '#C8821A',
  },
  {
    key: 'vendor_premium',
    label: 'Vendor Premium',
    price: 8000,
    days: 30,
    usd: '~$52 USD',
    perks: ['Everything in Vendor Standard', 'Top placement across all parishes', 'Featured on home screen', 'WhatsApp notification push'],
    color: '#F5F0E6',
    border: '#1B3A1D',
  },
]

function BoostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('listing')

  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<string>(preselectedId || '')
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: lsts } = await getUserListings(data.user.id)
      const active = (lsts as Listing[] || []).filter(l => l.status === 'approved')
      setListings(active)
      if (!preselectedId && active.length > 0) setSelectedListing(active[0].id)
      setLoading(false)
    })
  }, [router, preselectedId])

  async function handleSubmit() {
    if (!selectedListing) { setError('Please select a listing to boost.'); return }
    setSubmitting(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const plan = PLANS.find(p => p.key === selectedPlan)!
    const { error: err } = await supabase.from('boosts').insert([{
      listing_id: selectedListing,
      user_id: user?.id,
      plan: plan.label,
      price_jmd: plan.price,
      duration_days: plan.days,
      payment_method: paymentMethod,
      payment_note: paymentNote.trim() || null,
      payment_status: 'pending',
    }])
    setSubmitting(false)
    if (err) { setError('Something went wrong. Please try again.'); return }
    const listing = listings.find(l => l.id === selectedListing)
    const num = '19174432797'
    const msg = encodeURIComponent(
      'Hi Naberly, I submitted a boost request.\n\nListing: ' + (listing?.title || selectedListing) +
      '\nPlan: ' + plan.label + ' — $' + plan.price.toLocaleString() + ' JMD' +
      '\nPayment: ' + paymentMethod +
      (paymentNote ? '\nNote: ' + paymentNote : '') +
      '\n\nPlease activate when payment confirmed.'
    )
    window.open('https://wa.me/' + num + '?text=' + msg, '_blank')
    setSuccess(true)
  }

  if (loading) return <div className="app-shell"><div className="loading">Loading...</div></div>

  if (success) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⭐</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Boost request submitted</p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6, marginBottom: 20 }}>
            We opened WhatsApp with your request. Once payment is confirmed, we activate your boost — usually within a few hours.
          </p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/" className="back-btn">←</Link>
        <div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)' }}>Get more visibility</p>
          <p style={{ color: '#fff', fontSize: 14 }}>Boost a listing</p>
        </div>
      </div>

      <div className="scroll-area" style={{ padding: 13 }}>

        {/* Step 1 — Pick listing */}
        <p className="eyebrow" style={{ marginBottom: 8 }}>1. Choose your listing</p>
        {listings.length === 0 ? (
          <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 13, marginBottom: 16, border: '1px solid #D8D0BC' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>You have no active listings. Post something first.</p>
            <Link href="/post" style={{ color: '#1B3A1D', fontFamily: '-apple-system, sans-serif', fontSize: 12, fontWeight: 700 }}>Post a listing</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {listings.map(l => (
              <button
                key={l.id}
                onClick={() => setSelectedListing(l.id)}
                style={{ background: selectedListing === l.id ? '#1B3A1D' : '#EDE7D9', border: '1.5px solid ' + (selectedListing === l.id ? '#1B3A1D' : '#D8D0BC'), borderRadius: 9, padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }}
              >
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: selectedListing === l.id ? '#fff' : '#18180F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: selectedListing === l.id ? 'rgba(255,255,255,0.6)' : '#5A5A50' }}>{l.district || l.parish} · {l.category}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Pick plan */}
        <p className="eyebrow" style={{ marginBottom: 8 }}>2. Choose a plan</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {PLANS.map(plan => (
            <button
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              style={{ background: selectedPlan === plan.key ? plan.featured ? '#1B3A1D' : '#EDE7D9' : plan.color, border: '2px solid ' + (selectedPlan === plan.key ? '#C8821A' : plan.border), borderRadius: 12, padding: 13, textAlign: 'left', cursor: 'pointer', position: 'relative' }}
            >
              {plan.featured && (
                <span style={{ position: 'absolute', top: -9, right: 12, background: '#C8821A', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>Most popular</span>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 7 }}>
                <div>
                  <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: plan.featured ? '#fff' : '#18180F' }}>{plan.label}</p>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#5A5A50', marginTop: 1 }}>{plan.days} days</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 17, color: '#C8821A', fontFamily: 'Georgia, serif' }}>${plan.price.toLocaleString()} JMD</p>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: plan.featured ? 'rgba(255,255,255,0.4)' : '#5A5A50' }}>{plan.usd}</p>
                </div>
              </div>
              {plan.perks.map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 6, marginBottom: 4 }}>
                  <span style={{ color: '#C8821A', fontSize: 10, flexShrink: 0 }}>✓</span>
                  <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: plan.featured ? 'rgba(255,255,255,0.75)' : '#5A5A50', lineHeight: 1.5 }}>{perk}</p>
                </div>
              ))}
            </button>
          ))}
        </div>

        {/* Step 3 — Payment method */}
        <p className="eyebrow" style={{ marginBottom: 8 }}>3. How will you pay?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'Cash', sub: 'Pay in person or on delivery', active: true },
            { label: 'Bank transfer', sub: 'Wire to Naberly account — we confirm on receipt', active: true },
            { label: 'Lynk', sub: 'Coming soon', active: false },
            { label: 'WiPay', sub: 'Coming soon', active: false },
          ].map(method => (
            <button
              key={method.label}
              onClick={() => method.active && setPaymentMethod(method.label.toLowerCase())}
              style={{ background: paymentMethod === method.label.toLowerCase() ? '#1B3A1D' : method.active ? '#EDE7D9' : '#F5F0E6', border: '1.5px solid ' + (paymentMethod === method.label.toLowerCase() ? '#1B3A1D' : '#D8D0BC'), borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: paymentMethod === method.label.toLowerCase() ? '#fff' : method.active ? '#18180F' : '#B0A898', cursor: method.active ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{method.label}</span>
              <span style={{ fontSize: 10, fontWeight: 400, color: paymentMethod === method.label.toLowerCase() ? 'rgba(255,255,255,0.7)' : method.active ? '#5A5A50' : '#B0A898' }}>{method.sub}</span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Payment note (optional)</label>
          <input className="form-field" placeholder="e.g. Sending via Lynk to +1876..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
        </div>

        <div className="info-box" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.65 }}>
            Submit your request and we will open WhatsApp. Once we confirm your payment, your listing goes live as featured — usually within a few hours.
          </p>
        </div>

        {error && (
          <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={submitting || listings.length === 0} style={{ marginBottom: 14, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Submitting...' : 'Submit boost request via WhatsApp'}
        </button>

      </div>
    </div>
  )
}

export default function BoostPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <BoostContent />
    </Suspense>
  )
}
