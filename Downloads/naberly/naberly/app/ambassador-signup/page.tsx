'use client'

import { useState } from 'react'
import { createAmbassador } from '@/lib/supabase'

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
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">Welcome, {result.name}! 🎉</h1>
        <p className="mb-6 text-gray-700">You're officially a NaberlyJA Ambassador. Here's everything you need:</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
          <p className="text-2xl font-mono font-bold text-blue-700">{result.referral_code}</p>
        </div>

        <div className="space-y-4 text-gray-800">
          <div>
            <h2 className="font-semibold">1. How to sign up a vendor</h2>
            <p>Have them download NaberlyJA or go to naberlyja.com, register with their phone number, and enter your referral code: <strong>{result.referral_code}</strong>. Help them post at least 1 listing.</p>
          </div>
          <div>
            <h2 className="font-semibold">2. What to say</h2>
            <p className="italic">"Have you heard of NaberlyJA? It's a free app connecting people in our community to buy and sell — like a local marketplace. I can help you set up your page right now, takes 5 minutes."</p>
          </div>
          <div>
            <h2 className="font-semibold">3. Remind vendors to share</h2>
            <p>After posting, remind them to tap the share button so more people see their listing.</p>
          </div>
          <div>
            <h2 className="font-semibold">4. Getting paid</h2>
            <p>Milestone bonuses at 10 (J$1,000), 25 (J$5,000), 50 (+J$7,500), and 100 (+J$15,000) qualifying vendors — paid to your school toward fees, or to your parent/guardian if the school can't apply it.</p>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">Questions? Message us directly on WhatsApp anytime.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Become a NaberlyJA Ambassador</h1>
      <p className="text-gray-700 mb-6">Earn toward your school fees by helping vendors in your community join NaberlyJA.</p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm text-gray-700 space-y-2">
        <p><strong>This is a referral partnership, not employment.</strong> You choose your own hours and are not required to work exclusively for NaberlyJA.</p>
        <p><strong>A vendor qualifies</strong> when they register with your referral code, post at least 1 listing, and stay active for 30 days.</p>
        <p><strong>Payment:</strong> milestone bonuses at 10, 25, 50, and 100 qualifying vendors (up to J$28,500 total), paid to your school toward fees, or to your parent/guardian if the school can't apply the payment.</p>
        <p>No taxes, NIS, or NHT are withheld — you're responsible for any personal tax obligations on payments received.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number *</label>
          <input name="phone" value={form.phone} onChange={handleChange} required
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">School Name</label>
          <input name="school_name" value={form.school_name} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Parent/Guardian Name</label>
          <input name="guardian_name" value={form.guardian_name} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Parent/Guardian Phone</label>
          <input name="guardian_phone" value={form.guardian_phone} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
          <span>I agree to the terms above — this is a referral partnership, not employment.</span>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Signing you up...' : 'Become an Ambassador'}
        </button>
      </form>
    </div>
  )
}
