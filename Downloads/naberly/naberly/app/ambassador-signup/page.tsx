'use client'

import { useState, CSSProperties } from 'react'
import { createAmbassador } from '@/lib/supabase'

const styles: { [key: string]: CSSProperties } = {
  page: { maxWidth: '600px', margin: '0 auto', padding: '40px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  h1: { fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#111' },
  subtitle: { color: '#444', marginBottom: '24px', fontSize: '16px' },
  infoBox: { background: '#f7f7f7', border: '1px solid #ddd', borderRadius: '10px', padding: '18px', marginBottom: '24px', fontSize: '14px', color: '#333', lineHeight: 1.6 },
  label: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', marginTop: '16px', color: '#222' },
  input: { width: '100%', border: '1px solid #ccc', borderRadius: '8px', padding: '10px 12px', fontSize: '15px', boxSizing: 'border-box' as const },
  checkboxRow: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '20px', fontSize: '14px', color: '#333' },
  button: { width: '100%', background: '#1B5FAA', color: '#fff', fontWeight: 600, padding: '12px', borderRadius: '8px', border: 'none', fontSize: '16px', marginTop: '20px', cursor: 'pointer' },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: { color: '#c0392b', fontSize: '14px', marginTop: '12px' },
  codeBox: { background: '#eaf2fb', border: '1px solid #b8d4ee', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
  codeLabel: { fontSize: '13px', color: '#555', marginBottom: '4px' },
  codeValue: { fontSize: '24px', fontWeight: 700, color: '#1B5FAA', fontFamily: 'monospace' },
  stepTitle: { fontWeight: 600, marginTop: '18px', marginBottom: '4px', color: '#111' },
  stepText: { color: '#333', fontSize: '15px', lineHeight: 1.5 },
}

export default function AmbassadorSignupPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    school_name: '',
    guardian_name: '',
    guardian_phone: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ referral_code: string; name: string } | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone number are required.')
      return
    }
    if (!agreed) {
      setError('Please confirm you agree to the terms before continuing.')
      return
    }

    setSubmitting(true)
    const { data, error } = await createAmbassador(form)
    setSubmitting(false)

    if (error || !data) {
      setError('Something went wrong. Please try again or contact us directly.')
      return
    }

    setResult({ referral_code: data.referral_code, name: data.name })
  }

  if (result) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Welcome, {result.name}! 🎉</h1>
        <p style={styles.subtitle}>You're officially a NaberlyJA Ambassador. Here's everything you need:</p>

        <div style={styles.codeBox}>
          <p style={styles.codeLabel}>Your Referral Code</p>
          <p style={styles.codeValue}>{result.referral_code}</p>
        </div>

        <div>
          <p style={styles.stepTitle}>1. How to sign up a vendor</p>
          <p style={styles.stepText}>Have them go to naberlyja.com and click Sign Up. They check the "I'm a vendor" box and agree to the Terms & Conditions, then continue to the vendor details page — enter your referral code: <strong>{result.referral_code}</strong> at the bottom of that form.</p>

          <p style={styles.stepTitle}>2. Let them type their own email and password</p>
          <p style={styles.stepText}>This is their account — always have the vendor type their own email and password themselves, even if you're guiding them through every other step. If they're unsure what password to use, suggest something memorable (like their WhatsApp number plus a word), but they should type it in.</p>

          <p style={styles.stepTitle}>3. Email confirmation</p>
          <p style={styles.stepText}>Everyone verifies their account by clicking the confirmation link sent to their email. Once confirmed, their vendor listing goes live automatically — no waiting on anyone.</p>

          <p style={styles.stepTitle}>4. Find their listing together</p>
          <p style={styles.stepText}>Once verified, search the app together to find their live listing. This is the perfect moment to show them how Boost and Featured placement move a listing to the top of the page, so more people see it.</p>

          <p style={styles.stepTitle}>5. Show them around</p>
          <p style={styles.stepText}>Keep going: how to appear in the people directory, and how sponsorship packages work. Helping them actually use these features is part of the job, not just getting them signed up.</p>

          <p style={styles.stepTitle}>6. What to say</p>
          <p style={{ ...styles.stepText, fontStyle: 'italic' }}>"Have you heard of NaberlyJA? It's a free app connecting people in our community to buy and sell — like a local marketplace. I can help you set up your own account right now, takes 5 minutes."</p>

          <p style={styles.stepTitle}>7. Remind vendors to share</p>
          <p style={styles.stepText}>After posting, remind them to tap the share button so more people see their listing.</p>

          <p style={styles.stepTitle}>8. Getting paid</p>
          <p style={styles.stepText}>Milestone bonuses at 10 (J$1,000), 25 (J$5,000), 50 (+J$7,500), and 100 (+J$15,000) qualifying vendors — paid to your school toward fees, or to your parent/guardian if the school can't apply it.</p>
        </div>

        <p style={{ marginTop: '32px', fontSize: '14px', color: '#444' }}>
          Questions? Message us on WhatsApp at{' '}
          <a href="https://wa.me/19174432797" style={{ color: '#1B5FAA', fontWeight: 600, textDecoration: 'none' }}>
            917-443-2797
          </a>
          {' '}or email{' '}
          <a href="mailto:naberlyja@gmail.com" style={{ color: '#1B5FAA', fontWeight: 600, textDecoration: 'none' }}>
            naberlyja@gmail.com
          </a>
        </p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Become a NaberlyJA Ambassador</h1>
      <p style={styles.subtitle}>Earn toward your school fees by helping vendors in your community join NaberlyJA.</p>

      <div style={styles.infoBox}>
        <p><strong>This is a referral partnership, not employment.</strong> You choose your own hours and are not required to work exclusively for NaberlyJA.</p>
        <p><strong>A vendor qualifies</strong> when they register with your referral code, post at least 1 listing, and stay active for 30 days.</p>
        <p><strong>Payment:</strong> milestone bonuses at 10, 25, 50, and 100 qualifying vendors (up to J$28,500 total), paid to your school toward fees, or to your parent/guardian if the school can't apply the payment.</p>
        <p style={{ marginBottom: 0 }}>No taxes, NIS, or NHT are withheld — you're responsible for any personal tax obligations on payments received.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={styles.label}>Full Name *</label>
        <input style={styles.input} name="name" value={form.name} onChange={handleChange} required />

        <label style={styles.label}>Phone Number *</label>
        <input style={styles.input} name="phone" value={form.phone} onChange={handleChange} required />

        <label style={styles.label}>School Name</label>
        <input style={styles.input} name="school_name" value={form.school_name} onChange={handleChange} />

        <label style={styles.label}>Parent/Guardian Name</label>
        <input style={styles.input} name="guardian_name" value={form.guardian_name} onChange={handleChange} />

        <label style={styles.label}>Parent/Guardian Phone</label>
        <input style={styles.input} name="guardian_phone" value={form.guardian_phone} onChange={handleChange} />

        <div style={styles.checkboxRow}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '3px' }} />
          <span>I agree to the terms above — this is a referral partnership, not employment.</span>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={submitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        >
          {submitting ? 'Signing you up...' : 'Become an Ambassador'}
        </button>
      </form>
    </div>
  )
}
