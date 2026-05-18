'use client'
import Link from 'next/link'

const RELAY = '+19174432797'

const PACKAGES = [
  {
    name: 'Weekly Spot',
    price: '$2,500 JMD',
    usd: '~$16 USD',
    duration: '7 days',
    features: ['Sponsor card in home feed', 'Sponsor card in browse feed', 'WhatsApp button to your business', 'Seen by your parish neighbors'],
    color: '#EDE7D9',
    border: '#D8D0BC',
    textColor: '#18180F',
  },
  {
    name: 'Monthly Spot',
    price: '$8,000 JMD',
    usd: '~$52 USD',
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
    usd: '~$97 USD',
    duration: '30 days',
    features: ['Everything in Monthly', 'Your listing pinned to top of feed', 'Maximum visibility', 'Priority WhatsApp support'],
    color: '#F5F0E6',
    border: '#C8821A',
    textColor: '#18180F',
  },
]

export default function SponsorPage() {
  function contactNaberly(packageName: string) {
    const num = RELAY.replace(/\D/g, '')
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent('Hi Naberly, I am interested in the ' + packageName + ' sponsorship package for my business.'), '_blank')
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/" className="back-btn">←</Link>
        <div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)' }}>Reach your Naberhood</p>
          <p style={{ color: '#fff', fontSize: 14 }}>Sponsor Naberly JA</p>
        </div>
      </div>

      <div className="scroll-area" style={{ padding: 13 }}>

        <div style={{ background: '#1B3A1D', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 6 }}>Why sponsor Naberly?</p>
          <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
            Your business appears in front of real neighbours — people actively looking for food, services, rides and help in your parish.
          </p>
          {[
            'Hyper-local — your parish, your neighbours',
            'WhatsApp contact built in — they message you directly',
            'Cash payment — simple, no contracts',
            'Cancel anytime — weekly or monthly',
          ].map((point, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 8, marginBottom: 7 }}>
              <span style={{ color: '#C8821A', fontSize: 12, flexShrink: 0 }}>✓</span>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{point}</p>
            </div>
          ))}
        </div>

        <p className="eyebrow" style={{ marginBottom: 10 }}>Choose a package</p>

        {PACKAGES.map(pkg => (
          <div
            key={pkg.name}
            style={{ background: pkg.color, border: '2px solid ' + pkg.border, borderRadius: 12, padding: 14, marginBottom: 12, position: 'relative' }}
          >
            {pkg.featured && (
              <div style={{ position: 'absolute', top: -10, right: 12, background: '#C8821A', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Most popular
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 14, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: pkg.textColor, marginBottom: 2 }}>{pkg.name}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: pkg.featured ? 'rgba(255,255,255,0.5)' : '#5A5A50' }}>{pkg.duration}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 18, color: pkg.featured ? '#C8821A' : '#1B3A1D', fontFamily: 'Georgia, serif' }}>{pkg.price}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: pkg.featured ? 'rgba(255,255,255,0.4)' : '#5A5A50' }}>{pkg.usd}</p>
              </div>
            </div>
            {pkg.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 7, marginBottom: 5 }}>
                <span style={{ color: pkg.featured ? '#C8821A' : '#2D5A2E', fontSize: 11, flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: pkg.featured ? 'rgba(255,255,255,0.75)' : '#5A5A50', lineHeight: 1.5 }}>{f}</p>
              </div>
            ))}
            <button
              onClick={() => contactNaberly(pkg.name)}
              style={{ marginTop: 10, width: '100%', background: pkg.featured ? '#C8821A' : '#1B3A1D', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}
            >
              WhatsApp to get started
            </button>
          </div>
        ))}

        <div style={{ background: '#F5F0E6', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC', marginBottom: 13 }}>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 5 }}>Early adopter offer</p>
          <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.65 }}>
            First 3 sponsors get their first month free. Show us your business, we show your Naberhood. WhatsApp us to claim your free spot.
          </p>
          <button
            onClick={() => contactNaberly('free early adopter')}
            style={{ marginTop: 10, width: '100%', background: '#2D5A2E', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}
          >
            Claim free first month
          </button>
        </div>

        <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.65, textAlign: 'center' }}>
            Payment by cash, Lynk or WiPay. No contracts. Cancel anytime. Questions? WhatsApp us at {RELAY}
          </p>
        </div>

      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Home</span></Link>
        <Link href="/browse" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="M15 15L19 19" strokeLinecap="round"/></svg><span className="nav-label">Browse</span></Link>
        <div className="fab-wrapper"><Link href="/post" className="fab"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 2V15M2 8.5H15" strokeLinecap="round"/></svg></Link><span className="nav-label" style={{ color: '#5A5A50' }}>Post</span></div>
        <Link href="/favorites" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 18.5C11 18.5 3 13.5 3 7.5C3 5.3 4.8 3.5 7 3.5C8.8 3.5 10.3 4.5 11 5C11.7 4.5 13.2 3.5 15 3.5C17.2 3.5 19 5.3 19 7.5C19 13.5 11 18.5 11 18.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Saved</span></Link>
        <Link href="/account" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg><span className="nav-label">Me</span></Link>
      </nav>
    </div>
  )
}
