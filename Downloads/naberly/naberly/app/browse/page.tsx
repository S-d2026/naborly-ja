'use client'
// app/browse/page.tsx — Browse with parish + district filtering

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getApprovedListings, type Listing } from '@/lib/supabase'

const PARISHES = ['All Parishes','Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

const DISTRICTS: Record<string, string[]> = {
  'Kingston': ['All areas','Cross Roads','Maxfield Ave','Half Way Tree','Dunrobin','August Town','Duhaney Park','Arnett Gardens','Trench Town','New Kingston','Barbican','Constant Spring'],
  'St. Andrew': ['All areas','Papine','Gordon Town','Havendale','Stony Hill','Lawrence Tavern','Cherry Gardens'],
  'St. James': ['All areas','Montego Bay','Ironshore','Rose Hall','Granville'],
  'Manchester': ['All areas','Mandeville','Christiana','Porus'],
  'Clarendon': ['All areas','May Pen','Lionel Town','Chapelton'],
  'default': ['All areas'],
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'food', label: '🍲 Food', screen: '/browse?category=food' },
  { key: 'urgent', label: '⚠️ Urgent', screen: '/browse?category=urgent' },
  { key: 'work', label: '💼 Work', screen: '/browse?category=work' },
  { key: 'ride', label: '🚗 Rides' },
  { key: 'buy-sell', label: '🛍️ Buy/Sell' },
  { key: 'service', label: '🛠️ Services' },
]

const CATEGORY_SCREENS: Record<string, string> = {
  food: '/browse?category=food',
  urgent: '/browse?category=urgent',
  work: '/browse?category=work',
}

export default function BrowsePage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const initialDistrict = searchParams.get('district') || 'all'

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [parish, setParish] = useState('Kingston')
  const [category, setCategory] = useState(initialCategory)
  const [district, setDistrict] = useState(initialDistrict)
  const [showParishModal, setShowParishModal] = useState(false)

  const districts = DISTRICTS[parish] || DISTRICTS['default']

  const loadListings = useCallback(async () => {
    setLoading(true)
    const { data } = await getApprovedListings({
      parish: parish !== 'All Parishes' ? parish : undefined,
      category: category !== 'all' ? category : undefined,
      district: district !== 'all' ? district : undefined,
    })
    setListings((data as Listing[]) || [])
    setLoading(false)
  }, [parish, category, district])

  useEffect(() => { loadListings() }, [loadListings])

  const filtered = listings.filter(l =>
    !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.district || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="app-shell">
      {/* Header with search */}
      <div className="header-sm">
        <Link href="/" className="back-btn">←</Link>
        <input
          className="search-input"
          placeholder={`Search in ${parish}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button
          onClick={() => setShowParishModal(true)}
          style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: 6, padding: '6px 8px', color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {parish === 'All Parishes' ? 'All' : parish.split('.')[1]?.trim() || parish.split(' ')[0]} ⌄
        </button>
      </div>

      {/* Category pills */}
      <div className="pill-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`pill ${category === cat.key ? 'active' : ''}`}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* District filter — the key UX goal */}
      <div className="district-row">
        {districts.map(d => (
          <button
            key={d}
            className={`district-pill ${(d === 'All areas' && district === 'all') || district === d ? 'active' : ''}`}
            onClick={() => setDistrict(d === 'All areas' ? 'all' : d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="scroll-area">
        <div style={{ padding: '8px 14px 3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
            {loading ? 'Loading...' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} · ${parish}${district !== 'all' ? `, ${district}` : ', All areas'}`}
          </span>
        </div>

        {loading ? (
          <div className="loading">Loading listings...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>Nothing in this area yet</p>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Try "All areas" or{' '}
              <Link href="/post" style={{ color: '#1B3A1D' }}>post something yourself</Link>
            </p>
          </div>
        ) : (
          filtered.map(listing => (
            <Link key={listing.id} href={`/listing/${listing.id}`} className="listing-row">
              <div className="listing-icon" style={{ background: listing.category === 'food' ? '#D0E8BC' : listing.category === 'urgent' ? '#F0CABA' : listing.category === 'work' ? '#BCD0E8' : listing.category === 'ride' ? '#E0D8F0' : '#F0E8BC' }}>
                {listing.category === 'food' ? '🍲' : listing.category === 'urgent' ? '⚠️' : listing.category === 'work' ? '💼' : listing.category === 'ride' ? '🚗' : listing.category === 'service' ? '🛠️' : '🛍️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 3, flexWrap: 'wrap' }}>
                  {listing.is_free && <span className="chip chip-free">Free</span>}
                  {listing.is_anonymous && <span className="chip chip-anon">Anon</span>}
                  {listing.is_featured && <span className="chip chip-featured">Featured</span>}
                  {listing.category === 'urgent' && <span className="chip chip-urgent">Urgent</span>}
                </div>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="nav-label">Home</span>
        </Link>
        <Link href="/browse" className="nav-item active">
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
        <Link href="/account" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg>
          <span className="nav-label">Me</span>
        </Link>
      </nav>

      {/* Parish Modal */}
      {showParishModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(27,58,29,0.6)', zIndex: 400, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowParishModal(false)}
        >
          <div style={{ background: '#F5F0E6', borderRadius: '18px 18px 0 0', padding: '16px 14px 30px', width: '100%', maxWidth: 480, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 14, color: '#18180F', marginBottom: 12 }}>Choose your parish</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PARISHES.map(p => (
                <button
                  key={p}
                  className={`district-pill ${parish === p ? 'active' : ''}`}
                  onClick={() => { setParish(p); setDistrict('all'); setShowParishModal(false) }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowParishModal(false)}
              style={{ marginTop: 13, width: '100%', background: '#EDE7D9', border: '1px solid #D8D0BC', borderRadius: 9, padding: 11, fontSize: 13, cursor: 'pointer', color: '#18180F' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
