'use client'
// app/favorites/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getSavedListings } from '@/lib/supabase'

export default function FavoritesPage() {
  const router = useRouter()
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await getSavedListings(user.id)
      setSaved(data || [])
      setLoading(false)
    })
  }, [router])

  const EMOJI: Record<string, string> = { food: '🍲', urgent: '⚠️', work: '💼', ride: '🚗', service: '🛠️', 'buy-sell': '🛍️' }
  const BG: Record<string, string> = { food: '#D0E8BC', urgent: '#F0CABA', work: '#BCD0E8', ride: '#E0D8F0', service: '#F0E8BC', 'buy-sell': '#EDE7D9' }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14 }}>Saved</span>
      </div>

      <div className="scroll-area">
        <div style={{ padding: '9px 13px 3px' }}>
          <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Listings you want to come back to</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : saved.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 28, marginBottom: 8 }}>♡</p>
            <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>Nothing saved yet</p>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Tap ♡ on any listing to save it here
            </p>
          </div>
        ) : (
          saved.map((item: any) => {
            const listing = item.listings
            if (!listing) return null
            return (
              <Link key={item.listing_id} href={`/listing/${item.listing_id}`} className="listing-row">
                <div className="listing-icon" style={{ background: BG[listing.category] || '#EDE7D9' }}>
                  {EMOJI[listing.category] || '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</p>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                    {listing.parish}{listing.district ? ` · ${listing.district}` : ''} · {listing.is_free ? 'Free' : listing.price_jmd ? `$${listing.price_jmd.toLocaleString()} JMD` : 'By quote'}
                  </p>
                </div>
                <span style={{ color: '#C0392B', fontSize: 16 }}>♥</span>
              </Link>
            )
          })
        )}
      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Home</span></Link>
        <Link href="/browse" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="M15 15L19 19" strokeLinecap="round"/></svg><span className="nav-label">Browse</span></Link>
        <div className="fab-wrapper"><Link href="/post" className="fab"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 2V15M2 8.5H15" strokeLinecap="round"/></svg></Link><span className="nav-label" style={{ color: '#5A5A50' }}>Post</span></div>
        <Link href="/favorites" className="nav-item active"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 18.5C11 18.5 3 13.5 3 7.5C3 5.3 4.8 3.5 7 3.5C8.8 3.5 10.3 4.5 11 5C11.7 4.5 13.2 3.5 15 3.5C17.2 3.5 19 5.3 19 7.5C19 13.5 11 18.5 11 18.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Saved</span></Link>
        <Link href="/account" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg><span class="nav-label">Me</span></Link>
      </nav>
    </div>
  )
}
