'use client'
// app/boost/page.tsx — Boost pricing, cash-first

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, requestBoost } from '@/lib/supabase'

const PLANS = [
  { key: 'weekly', label: 'Weekly Boost', sub: '7 days · Top results + home screen + badge', price: 500, days: 7, tag: 'Most popular' },
  { key: 'monthly', label: 'Monthly Boost', sub: '30 days · Everything in weekly + priority sort', price: 1500, days: 30, tag: 'Best value' },
]

const VENDOR_PLANS = [
  { key: 'standard_vendor', label: 'Standard Vendor', sub: 'Up to 5 listings · Badge · 30 days', price: 4000, days: 30 },
  { key: 'premium_vendor', label: 'Premium Vendor', sub: 'Unlimited · WhatsApp push · Vendor page', price: 8000, days: 30 },
]

export default function BoostPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('weekly')
  const [submitting, setSubmitting] = useState(false)

  const selectedPlan = PLANS.find(p => p.key === plan) || PLANS[0]

  async function handleCashRequest() {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    // Create boost request
    await requestBoost({
      listing_id: '', // user picks listing
      user_id: user.id,
      plan,
      price_jmd: selectedPlan.price,
      payment_method: 'cash',
      payment_note: 'Cash payment — pending admin confirmation',
      duration_days: selectedPlan.days,
    })

    // Open WhatsApp to Naberly
    const msg = encodeURIComponent(
      `Hi Naberly JA, I want to boost my listing.\n\nPlan: ${selectedPlan.label}\nPrice: $${selectedPlan.price.toLocaleString()} JMD\nPayment: Cash\n\nPlease confirm and activate my boost. Thank you.`
    )
    window.open(`https://wa.me/19174432797?text=${msg}`, '_blank')

    setSubmitting(false)
    alert('Request sent! Naberly will activate your boost after cash payment is confirmed.')
    router.push('/')
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/post" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14 }}>Boost your listing</span>
      </div>

      <div className="scroll-area" style={{ padding: 13 }}>
        {/* Free tier */}
        <div style={{ background: '#1B3A1D', borderRadius: 11, padding: 14, marginBottom: 13 }}>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 4 }}>Early adopter</p>
          <p style={{ color: '#fff', fontSize: 15, marginBottom: 5 }}>First boost is free</p>
          <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11, fontFamily: '-apple-system, sans-serif', lineHeight: 1.65, marginBottom: 10 }}>
            One free featured boost for new vendors. Message Naberly via WhatsApp to activate.
          </p>
          <a
            href={`https://wa.me/19174432797?text=${encodeURIComponent('Hi Naberly JA, I want to claim my free first boost for my listing. Please help me activate it.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, padding: '9px 14px', fontSize: 11, fontFamily: '-apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
          >
            💬 Claim free boost via WhatsApp
          </a>
        </div>

        {/* Paid plans */}
        <p className="eyebrow" style={{ marginBottom: 8 }}>Paid plans — Jamaica market rates</p>

        {PLANS.map(p => (
          <div key={p.key} className={`plan-card ${plan === p.key ? 'selected' : ''}`} onClick={() => setPlan(p.key)}>
            <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: plan === p.key ? '#1B3A1D' : '#C8821A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{p.tag}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{p.label}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 1 }}>{p.sub}</p>
              </div>
              <p style={{ fontSize: 16, color: '#1B3A1D' }}>${p.price.toLocaleString()} JMD</p>
            </div>
          </div>
        ))}

        {/* Cash payment — primary method */}
        <p className="eyebrow" style={{ margin: '12px 0 7px' }}>Pay via — cash first</p>

        <div style={{ background: '#EDE7D9', border: '2px solid #1B3A1D', borderRadius: 9, padding: '11px 13px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>💵</span>
            <div>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>Cash payment</p>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Pay in person — Naberly activates your boost after confirmation</p>
            </div>
            <span style={{ marginLeft: 'auto', background: '#D0E8BC', color: '#1B3A1D', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>RECOMMENDED</span>
          </div>
          <div className="info-box">
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.6 }}>
              How it works: Message Naberly on WhatsApp → arrange cash meetup → Naberly confirms payment → your listing goes featured within 2 hours.
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/19174432797?text=${encodeURIComponent(`Hi Naberly JA, I want to pay cash for a ${selectedPlan.label} ($${selectedPlan.price.toLocaleString()} JMD). Please arrange payment and activate my boost.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa"
          style={{ marginBottom: 8 }}
        >
          💬 Request boost via WhatsApp — ${selectedPlan.price.toLocaleString()} JMD cash
        </a>

        <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', marginBottom: 14 }}>
          Lynk and card payments coming soon
        </p>

        {/* Divider */}
        <div className="divider" />

        {/* Vendor plans */}
        <p className="eyebrow" style={{ marginBottom: 8 }}>Premium vendor accounts</p>
        {VENDOR_PLANS.map(p => (
          <div key={p.key} className="plan-card" style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{p.label}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 1 }}>{p.sub}</p>
              </div>
              <p style={{ fontSize: 16, color: '#1B3A1D' }}>${p.price.toLocaleString()} JMD/mo</p>
            </div>
          </div>
        ))}

        <a
          href={`https://wa.me/19174432797?text=${encodeURIComponent('Hi Naberly JA, I am interested in a Premium Vendor account. Can you tell me more?')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa"
          style={{ marginBottom: 14 }}
        >
          💬 WhatsApp Naberly for vendor pricing
        </a>
      </div>
    </div>
  )
}
