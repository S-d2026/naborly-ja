'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine','Other (outside Jamaica)']

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [parish, setParish] = useState('Kingston')
  const [otherLocation, setOtherLocation] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVendor, setIsVendor] = useState(false)
  const [services, setServices] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTerms, setShowTerms] = useState(false)

  const isOther = parish === 'Other (outside Jamaica)'

  async function handleSignup() {
    if (!fullName || !email || !password || !whatsapp) { setError('Please fill in all fields.'); return }
    if (isOther && !otherLocation.trim()) { setError('Please tell us your city or area.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!agreedToTerms) { setError('Please agree to the Terms & Conditions to continue.'); return }
    setLoading(true)
    setError('')
    const finalParish = isOther ? otherLocation.trim() : parish
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, whatsapp, parish: finalParish, is_vendor: isVendor, services }
      }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    if (isVendor) {
      const params = new URLSearchParams({ name: fullName, whatsapp, parish: finalParish })
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
            <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>How neighbours reach you</p>
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
          {isOther && (
            <div>
              <label className="field-label">Your city, borough or area</label>
              <input className="form-field" placeholder="e.g. Bronx, NY or Brooklyn, NY" value={otherLocation} onChange={e => setOtherLocation(e.target.value)} />
              <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>Tell us where you are so neighbours nearby can find you</p>
            </div>
          )}
          <div>
            <label className="field-label">What work do you do or can do?</label>
            <input
              className="form-field"
              placeholder="e.g. Cook, carpenter, seamstress"
              value={services}
              onChange={e => setServices(e.target.value)}
            />
            <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>
              Optional — helps your neighbours find you
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

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px', border: `1.5px solid ${isVendor ? '#1B3A1D' : '#D8D0BC'}`, borderRadius: 10, cursor: 'pointer', background: isVendor ? '#D0E8BC' : '#FAFAF8', transition: 'all 0.15s' }}>
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

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px', border: `1.5px solid ${agreedToTerms ? '#1B3A1D' : '#D8D0BC'}`, borderRadius: 10, cursor: 'pointer', background: agreedToTerms ? '#D0E8BC' : '#FAFAF8', transition: 'all 0.15s' }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              style={{ accentColor: '#1B3A1D', marginTop: 1, width: 16, height: 16, flexShrink: 0 }}
            />
            <div>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.6 }}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTerms(true) }}
                  style={{ color: '#1B3A1D', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontFamily: '-apple-system, sans-serif' }}
                >
                  Terms & Conditions
                </button>
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

      {showTerms && (
        <div onClick={() => setShowTerms(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#FAFAF8', borderRadius: '12px', padding: '24px', maxWidth: '560px', width: '100%', maxHeight: '82vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowTerms(false)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#5A5A50', lineHeight: 1 }}>×</button>

            <p style={{ fontSize: 18, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 4 }}>Terms & Conditions</p>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 18 }}>
              Last updated: June 2026. By using NaberlyJA you agree to these terms.
            </p>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>1. About NaberlyJA</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                NaberlyJA (naberlyja.com) is a community marketplace platform. It connects neighbours in Jamaica and beyond to share resources, find work, offer services, and support one another. NaberlyJA is a platform only — we do not sell goods or services directly and we are not a party to any transaction between users.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>2. Vendor and Buyer Disputes</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                NaberlyJA is not responsible for disputes between vendors and buyers or between any users of the platform. All transactions, arrangements, payments and agreements made between users are solely between those users. NaberlyJA does not guarantee the quality, safety, legality, or accuracy of any listing, product, or service offered on the platform. Users engage with one another at their own risk. If you have a dispute with another user, NaberlyJA encourages you to resolve it directly. NaberlyJA may, at its sole discretion, assist in mediation but is under no obligation to do so.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>3. Donations</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                Donations made through NaberlyJA are received and managed via the NaberlyJA community fund. Donations do not go directly to individual listing posters. NaberlyJA makes no guarantee that donations will be passed on to any specific individual or family. Donation amounts are at the sole discretion of the donor. All donations are voluntary and non-refundable unless required by applicable law.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>4. Anonymous Listings</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                NaberlyJA offers an anonymous posting option that hides the poster's name and contact number. When a user contacts an anonymous listing, their message is relayed through NaberlyJA's relay number. NaberlyJA does not verify the identity of anonymous posters and is not responsible for the accuracy, truthfulness, or legitimacy of anonymous listings. Users who respond to anonymous listings do so at their own risk.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>5. No Guarantee of Listing Accuracy</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                Listings on NaberlyJA are posted by community members and are not verified by NaberlyJA unless specifically stated. NaberlyJA does not guarantee the accuracy, completeness, or reliability of any listing. NaberlyJA reserves the right to remove any listing at any time without notice for any reason including but not limited to suspected fraud, spam, inappropriate content, or violation of these terms. Users are encouraged to exercise their own judgement before responding to or acting on any listing.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>6. Privacy and Data</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                NaberlyJA collects the following information when you create an account: your name, email address, WhatsApp number, parish, and any services you choose to list. This information is used solely to operate the platform and connect you with your community. NaberlyJA does not sell your personal information to third parties. Your WhatsApp number is shared with other users only when you respond to or post a non-anonymous listing. You may request deletion of your account and associated data at any time by contacting naberlyja@gmail.com.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>7. Age Requirement</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                NaberlyJA is intended for users who are 18 years of age or older. By creating an account you confirm that you are at least 18 years old. If we become aware that a user is under 18 we reserve the right to suspend or delete their account. The NaberlyJA Ambassador Program operates separately from platform accounts and does not require account creation, and is therefore not subject to this age requirement.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>8. Payments</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                Payments for boosts, sponsorships, and donations are processed securely via PayPal and Zelle. NaberlyJA does not store your payment information. All payments are subject to the terms of the relevant payment provider. Boost and sponsorship fees are non-refundable once activated. NaberlyJA reserves the right to change pricing at any time with reasonable notice.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>9. Prohibited Conduct</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                Users must not post fraudulent, misleading, offensive, or illegal listings. Users must not use the platform to harass, scam, or harm other users. Users must not post content that violates the rights of any third party. Violation of these prohibitions may result in immediate account suspension and removal of all listings without notice.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>10. Limitation of Liability</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                To the fullest extent permitted by law, NaberlyJA shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform, including but not limited to damages arising from transactions between users, reliance on listing content, or donations made through the platform.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>11. Changes to These Terms</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                NaberlyJA reserves the right to update these terms at any time. Updated terms will be posted at naberlyja.com/terms with the date of the last update. Continued use of the platform after any update constitutes acceptance of the new terms.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 6 }}>12. Contact</p>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.7 }}>
                For questions about these terms or to request account deletion, contact us at naberlyja@gmail.com or via WhatsApp at +19174432797.
              </p>
            </div>

            <button onClick={() => setShowTerms(false)} style={{ width: '100%', background: '#1B3A1D', color: '#fff', fontWeight: 700, padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
