'use client'
// app/page.tsx — Naberly JA Home Screen

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, getApprovedListings, getImpactStories, type Listing, type ImpactStory } from '@/lib/supabase'

const TICKERS = [
  'Miss Marva fed 12 families in Cross Roads this week',
  'An anonymous urgent need in Maxfield Ave was resolved in 2 hours',
  'Deacon Brown gave a free market ride to 3 neighbors in Dunrobin',
  'Brother Roy shared vegetables with August Town families',
  '7 free food listings active in Kingston right now',
]

const CATEGORY_TILES = [
  { key: 'food', label: 'Need Food', sub: 'Free or low cost nearby', emoji: '🍲', bg: '#D0E8BC', textColor: '#1B3A1D', subColor: '#2D5A2E', href: '/browse?category=food' },
  { key: 'offer', label: 'Offer Help', sub: 'Food, skills, rides', emoji: '🤲', bg: '#EDE7D9', textColor: '#18180F', subColor: '#5A5A50', href: '/post', dashed: true },
  { key: 'work', label: 'Work & Jobs', sub: 'Find or post work', emoji: '💼', bg: '#BCD0E8', textColor: '#10286A', subColor: '#1A3A8A', href: '/browse?category=work' },
  { key: 'urgent', label: 'Urgent Need', sub: 'Post or respond today', emoji: '⚠️', bg: '#F0CABA', textColor: '#6B1E10', subColor: '#8B2A18', href: '/browse?category=urgent' },
  { key: 'ride', label: 'Rides', sub: 'Get or give a lift', emoji: '🚗', bg: '#E0D8F0', textColor: '#38205A', subColor: '#4B2A80', href: '/browse?category=ride' },
  { key: 'buy-sell', label: 'Buy & Sell', sub: 'Local marketplace', emoji: '🛍️', bg: '#F0E8BC', textColor: '#6A4010', subColor: '#8B5218', href: '/browse?category=buy-sell' },
]

const CHIP_COLORS: Record<string, string> = {
  food: 'chip-free',
  urgent: 'chip-urgent',
  work: 'chip-work',
  ride: 'chip-anon',
  service: 'chip-featured',
  'buy-sell': 'chip-neutral',
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [stories, setStories] = useState<ImpactStory[]>([])
  const [tickerIndex, setTickerIndex] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Load listings
    getApprovedListings().then(({ data }) => {
      if (data) setListings(data as Listing[])
      setLoading(false)
    })

    // Load impact stories
    getImpactStories().then(({ data }) => {
      if (data) setStories(data as ImpactStory[])
    })

    // Rotate ticker
    const interval = setInterval(() => {
      setTickerIndex(i => (i + 1) % TICKERS.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app-shell">
      {/* ── HEADER ── */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="2" fill="#C8821A"/>
              <circle cx="5" cy="5" r="4.2" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            </svg>
            <span style={{ color: '#fff', fontSize: 13 }}>Kingston</span>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <Link href="/favorites" style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: '50%', width: 29, height: 29, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 11C6.5 11 1.5 8 1.5 4.5C1.5 2.8 2.8 1.5 4.5 1.5C5.6 1.5 6.4 2.1 6.5 2.3C6.6 2.1 7.4 1.5 8.5 1.5C10.2 1.5 11.5 2.8 11.5 4.5C11.5 8 6.5 11 6.5 11Z" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3"/></svg>
            </Link>
            <Link href={user ? '/account' : '/login'} style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: '50%', width: 29, height: 29, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4.5" r="2.3" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3"/><path d="M1.5 12c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </Link>
          </div>
        </div>
        <Link href="/browse" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3"/><path d="M8 8L11 11" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, fontFamily: '-apple-system, sans-serif' }}>Search in Kingston...</span>
        </Link>
      </div>

      {/* ── IMPACT TICKER ── */}
      <div style={{ background: '#1B3A1D', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flexShrink: 0 }}>
        <div className="ticker-dot" />
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: '-apple-system, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {TICKERS[tickerIndex]}
        </p>
      </div>

      <div className="scroll-area">
        {/* ── MISSION HERO ── */}
        <div style={{ background: '#1B3A1D', padding: '18px 15px 16px' }}>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 6 }}>Community mission</p>
          <p style={{ color: '#fff', fontSize: 19, lineHeight: 1.3, marginBottom: 12 }}>
            Food in your Naberhood —<br />free or low cost
          </p>
          <div style={{ display: 'flex', gap: 7 }}>
            <Link href="/browse?category=food" style={{ background: '#C8821A', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 13px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
              Find food near me
            </Link>
            <Link href="/post" style={{ background: 'rgba(255,255,255,0.09)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 7, padding: '8px 10px', fontSize: 11, textDecoration: 'none', fontFamily: '-apple-system, sans-serif' }}>
              I have food to share
            </Link>
          </div>
        </div>

        {/* ── URGENT STRIP ── */}
        <Link href="/browse?category=urgent" style={{ background: '#3D1010', padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', borderBottom: '1px solid #5A1010' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A84B2A' }} />
            <div>
              <p style={{ color: '#fff', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700 }}>Urgent needs nearby</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: '-apple-system, sans-serif', marginTop: 1 }}>Neighbors who need help today</p>
            </div>
          </div>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 3L9 6.5L4 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </Link>

        {/* ── IMPACT STORIES ── */}
        {stories.length > 0 && (
          <div style={{ padding: '14px 13px 6px' }}>
            <p className="eyebrow" style={{ marginBottom: 9 }}>This week in your Naberhood</p>
            {stories.slice(0, 2).map(story => (
              <div key={story.id} className="impact-card">
                <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>🍲 Community impact</p>
                <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.4, marginBottom: 8 }}>{story.story_text}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    {story.parish}{story.district ? ` · ${story.district}` : ''}
                  </p>
                  {story.people_helped > 0 && (
                    <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>
                      {story.people_helped} helped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CATEGORIES ── */}
        <div style={{ padding: '0 13px 4px' }}>
          <p className="eyebrow" style={{ marginBottom: 9 }}>How can we help?</p>
          <div className="category-grid" style={{ marginBottom: 13 }}>
            {CATEGORY_TILES.map(tile => (
              <Link
                key={tile.key}
                href={tile.href}
                className="category-tile"
                style={{
                  background: tile.bg,
                  border: tile.dashed ? `1.5px dashed #D8D0BC` : 'none',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{tile.emoji}</div>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: tile.textColor, marginBottom: 1 }}>{tile.label}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: tile.subColor }}>{tile.sub}</p>
              </Link>
            ))}
          </div>

          {/* ── HOW IT WORKS ── */}
          <div style={{ background: '#EDE7D9', borderRadius: 12, padding: 13, marginBottom: 13, border: '1px solid #D8D0BC' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 11 }}>How Naberly works</p>
            {[
              'Post what you need or can offer — food, work, rides. Free to post, always.',
              'Neighbors in your district see it and respond by WhatsApp or call — no extra apps needed.',
              'Real community, real help. Parish by parish — Jamaica first, worldwide next.',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 9, marginBottom: i < 2 ? 10 : 0 }}>
                <div className="step-circle">{i + 1}</div>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.6, paddingTop: 3 }}>{text}</p>
              </div>
            ))}
          </div>

          <p className="eyebrow" style={{ marginBottom: 8 }}>Active in Kingston</p>
        </div>

        {/* ── LIVE FEED ── */}
        <div style={{ borderTop: '1px solid #D8D0BC' }}>
          {loading ? (
            <div className="loading">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 28, marginBottom: 8 }}>🏘️</p>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>Be the first to post</p>
              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Share food, offer help, or post a need</p>
            </div>
          ) : (
            listings.map(listing => (
              <Link key={listing.id} href={`/listing/${listing.id}`} className="listing-row">
                <div className="listing-icon" style={{ background: listing.category === 'food' ? '#D0E8BC' : listing.category === 'urgent' ? '#F0CABA' : listing.category === 'work' ? '#BCD0E8' : listing.category === 'ride' ? '#E0D8F0' : listing.category === 'service' ? '#F0E8BC' : '#EDE7D9' }}>
                  {listing.category === 'food' ? '🍲' : listing.category === 'urgent' ? '⚠️' : listing.category === 'work' ? '💼' : listing.category === 'ride' ? '🚗' : listing.category === 'service' ? '🛠️' : '🛍️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                    {listing.is_free && <span className={`chip chip-free`}>Free</span>}
                    {listing.category === 'urgent' && <span className="chip chip-urgent">Urgent</span>}
                    {listing.is_anonymous && <span className="chip chip-anon">Anon</span>}
                    {listing.is_featured && <span className="chip chip-featured">Featured</span>}
                    {!listing.is_free && listing.category !== 'urgent' && !listing.is_featured && (
                      <span className={`chip ${CHIP_COLORS[listing.category] || 'chip-neutral'}`}>{listing.category}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {listing.title}
                  </p>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                    {listing.district || listing.parish}
                    {listing.price_jmd ? ` · $${listing.price_jmd.toLocaleString()} JMD` : listing.is_free ? ' · Free' : ''}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* ── GLOBAL VISION FOOTER ── */}
        <div style={{ padding: 13 }}>
          <div style={{ borderRadius: 10, padding: 13, background: '#1B3A1D' }}>
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 5 }}>The mission</p>
            <p style={{ color: '#fff', fontSize: 13, fontFamily: '-apple-system, sans-serif', lineHeight: 1.65 }}>
              Born in Jamaica. Every plate shared, every job found, every urgent need answered — brings us closer to a world where no Naberhood is left behind.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10, fontFamily: '-apple-system, sans-serif', marginTop: 7 }}>naberlyja.com</p>
          </div>
        </div>
        <div style={{ height: 10 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item active">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="nav-label">Home</span>
        </Link>
        <Link href="/browse" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="M15 15L19 19" strokeLinecap="round"/></svg>
          <span className="nav-label">Browse</span>
        </Link>
        <div className="fab-wrapper">
          <Link href="/post" className="fab">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 2V15M2 8.5H15" strokeLinecap="round"/></svg>
          </Link>
          <span className="nav-label" style={{ color: '#5A5A50' }}>Post</span>
        </div>
        <Link href="/favorites" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 18.5C11 18.5 3 13.5 3 7.5C3 5.3 4.8 3.5 7 3.5C8.8 3.5 10.3 4.5 11 5C11.7 4.5 13.2 3.5 15 3.5C17.2 3.5 19 5.3 19 7.5C19 13.5 11 18.5 11 18.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="nav-label">Saved</span>
        </Link>
        <Link href={user ? '/account' : '/login'} className="nav-item">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg>
          <span className="nav-label">Me</span>
        </Link>
      </nav>
    </div>
  )
}
