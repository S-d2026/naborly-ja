'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase, getApprovedListings, getDistanceKm, formatDistance, type Listing } from '@/lib/supabase'

const PARISHES = ['All Parishes','Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

const DISTRICTS: Record<string, string[]> = {
  'Kingston': ['All areas','Cross Roads','Maxfield Ave','Half Way Tree','Dunrobin','August Town','Duhaney Park','Arnett Gardens','Trench Town','New Kingston','Barbican','Constant Spring'],
  'St. Andrew': ['All areas','Papine','Gordon Town','Havendale','Stony Hill','Lawrence Tavern','Cherry Gardens'],
  'St. James': ['All areas','Montego Bay','Ironshore','Rose Hall','Granville'],
  'Manchester': ['All areas','Mandeville','Christiana','Porus'],
  'Clarendon': ['All areas','May Pen','Lionel Town','Chapelton'],
  'St. Elizabeth': ['All areas','Santa Cruz','Black River','Junction','Malvern','Southfield','Treasure Beach'],
  'St. Ann': ['All areas','Ocho Rios','Brown\'s Town','St. Ann\'s Bay'],
  'Westmoreland': ['All areas','Savanna-la-Mar','Negril','Petersfield'],
  'St. Catherine': ['All areas','Portmore','Spanish Town','Old Harbour'],
  'default': ['All areas'],
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'work', label: 'Work' },
  { key: 'ride', label: 'Rides' },
  { key: 'buy-sell', label: 'Buy/Sell' },
  { key: 'service', label: 'Services' },
  { key: 'vendor', label: 'Vendors' },
]

const JAMAICA_BOUNDS = { minLat: 17.70, maxLat: 18.55, minLng: -78.40, maxLng: -76.18 }

function getParishFromCoords(lat: number, lng: number): string {
  if (lat >= 17.85 && lat <= 18.05 && lng >= -76.95 && lng <= -76.65) return 'Kingston'
  if (lat >= 17.85 && lat <= 18.15 && lng >= -77.05 && lng <= -76.65) return 'St. Andrew'
  if (lat >= 17.70 && lat <= 17.95 && lng >= -77.05 && lng <= -76.70) return 'St. Catherine'
  if (lat >= 17.80 && lat <= 18.10 && lng >= -77.35 && lng <= -77.05) return 'St. Thomas'
  if (lat >= 18.00 && lat <= 18.25 && lng >= -76.85 && lng <= -76.50) return 'Portland'
  if (lat >= 18.15 && lat <= 18.45 && lng >= -77.15 && lng <= -76.75) return 'St. Mary'
  if (lat >= 18.20 && lat <= 18.55 && lng >= -77.55 && lng <= -77.10) return 'St. Ann'
  if (lat >= 18.30 && lat <= 18.55 && lng >= -77.85 && lng <= -77.50) return 'Trelawny'
  if (lat >= 18.30 && lat <= 18.55 && lng >= -78.05 && lng <= -77.75) return 'St. James'
  if (lat >= 18.35 && lat <= 18.55 && lng >= -78.20 && lng <= -78.00) return 'Hanover'
  if (lat >= 18.10 && lat <= 18.40 && lng >= -78.25 && lng <= -77.90) return 'Westmoreland'
  if (lat >= 17.85 && lat <= 18.20 && lng >= -77.95 && lng <= -77.55) return 'St. Elizabeth'
  if (lat >= 17.95 && lat <= 18.25 && lng >= -77.60 && lng <= -77.25) return 'Manchester'
  if (lat >= 17.80 && lat <= 18.10 && lng >= -77.35 && lng <= -76.95) return 'Clarendon'
  return 'Kingston'
}

function BrowseContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [activeTab, setActiveTab] = useState<'listings' | 'people'>('listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [parish, setParish] = useState('Kingston')
  const [category, setCategory] = useState(initialCategory)
  const [district, setDistrict] = useState('all')
  const [showParishModal, setShowParishModal] = useState(false)
  const [sponsor, setSponsor] = useState<any>(null)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  // People tab state
  const [people, setPeople] = useState<any[]>([])
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState('')
  const [peopleParish, setPeopleParish] = useState('All Parishes')

  const districts = DISTRICTS[parish] || DISTRICTS['default']

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setUserLat(latitude)
          setUserLng(longitude)
          const inJamaica = latitude >= JAMAICA_BOUNDS.minLat && latitude <= JAMAICA_BOUNDS.maxLat &&
            longitude >= JAMAICA_BOUNDS.minLng && longitude <= JAMAICA_BOUNDS.maxLng
          if (inJamaica) {
            setParish(getParishFromCoords(latitude, longitude))
          } else {
            try {
              const res = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude + '&format=json')
              const data = await res.json()
              const neighborhood = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.town || data.address?.city || ''
              const city = data.address?.city || data.address?.town || data.address?.county || ''
              if (neighborhood) setParish(neighborhood + (city ? ', ' + city : ''))
            } catch (e) {}
          }
        },
        () => {}
      )
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('parish')
          .eq('id', data.user.id)
          .single()
        if (profile?.parish) setParish(profile.parish)
      }
    })

    supabase.from('sponsors').select('*').eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const pick = data[Math.floor(Math.random() * data.length)]
          setSponsor(pick)
        }
      })
  }, [])

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

  const loadPeople = useCallback(async () => {
    setPeopleLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, full_name, parish, services, is_verified, helper_count')
      .not('services', 'is', null)
      .neq('services', '')
      .order('helper_count', { ascending: false })
    if (peopleParish !== 'All Parishes') {
      query = query.eq('parish', peopleParish)
    }
    const { data } = await query
    setPeople(data || [])
    setPeopleLoading(false)
  }, [peopleParish])

  useEffect(() => {
    if (activeTab === 'people') loadPeople()
  }, [activeTab, loadPeople])

  const filteredPeople = people.filter(p =>
    !peopleSearch ||
    (p.full_name || '').toLowerCase().includes(peopleSearch.toLowerCase()) ||
    (p.services || '').toLowerCase().includes(peopleSearch.toLowerCase())
  )

  const filtered = listings.filter(l =>
    !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.district || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  function openSponsorWhatsApp() {
    if (!sponsor?.whatsapp) return
    window.open('https://wa.me/' + sponsor.whatsapp.replace(/\D/g, ''), '_blank')
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/" className="back-btn">←</Link>
        <input
          className="search-input"
          placeholder={
            activeTab === 'people'
              ? 'Search people or skills...'
              : parish === 'All Parishes' ? 'Search all listings...' : 'Search in ' + parish + '...'
          }
          value={activeTab === 'people' ? peopleSearch : searchQuery}
          onChange={e => activeTab === 'people' ? setPeopleSearch(e.target.value) : setSearchQuery(e.target.value)}
        />
        <button
          onClick={() => setShowParishModal(true)}
          style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: 6, padding: '6px 8px', color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {(activeTab === 'people' ? peopleParish : parish) === 'All Parishes' ? 'All' : (activeTab === 'people' ? peopleParish : parish).replace('St. ', '')} ⌄
        </button>
      </div>

      {/* Listings | People tab switcher */}
      <div style={{ display: 'flex', background: '#1B3A1D', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: activeTab === 'listings' ? 700 : 400, color: activeTab === 'listings' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: activeTab === 'listings' ? '2px solid #C8821A' : '2px solid transparent' }}
        >
          Listings
        </button>
        <button
          onClick={() => setActiveTab('people')}
          style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: activeTab === 'people' ? 700 : 400, color: activeTab === 'people' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: activeTab === 'people' ? '2px solid #C8821A' : '2px solid transparent' }}
        >
          People
        </button>
      </div>

      {/* Listings tab filters */}
      {activeTab === 'listings' && (
        <>
          <div className="pill-row">
            {CATEGORIES.map(cat => (
              <button key={cat.key} className={'pill ' + (category === cat.key ? 'active' : '')} onClick={() => setCategory(cat.key)}>
                {cat.label}
              </button>
            ))}
          </div>
          {category === 'food' && (
            <div className="pill-row" style={{ background: '#D0E8BC' }}>
              <button className={'pill ' + (!searchQuery ? 'active' : '')} onClick={() => setSearchQuery('')}>All food</button>
              <button className="pill" onClick={() => setSearchQuery('free')}>Free only</button>
              <button className="pill" onClick={() => setSearchQuery('hot')}>Hot meals</button>
              <button className="pill" onClick={() => setSearchQuery('produce')}>Produce</button>
            </div>
          )}
          <div className="district-row">
            {districts.map(d => (
              <button
                key={d}
                className={'district-pill ' + ((d === 'All areas' && district === 'all') || district === d ? 'active' : '')}
                onClick={() => setDistrict(d === 'All areas' ? 'all' : d)}
              >
                {d}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="scroll-area">

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <>
            <div style={{ padding: '8px 14px 3px' }}>
              <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                {loading ? 'Loading...' : filtered.length + ' listing' + (filtered.length !== 1 ? 's' : '') + ' · ' + (parish === 'All Parishes' ? 'All parishes' : parish) + (district !== 'all' ? ', ' + district : ', All areas')}
              </span>
            </div>
            {loading ? (
              <div className="loading">Loading listings...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
                <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>Nothing in this area yet</p>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  Try "All areas" or <Link href="/post" style={{ color: '#1B3A1D' }}>post something yourself</Link>
                </p>
              </div>
            ) : (
              filtered.map((listing, index) => (
                <div key={listing.id}>
                  <Link href={'/listing/' + listing.id} className="listing-row">
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
                        {listing.price_jmd ? ' · ' + listing.price_jmd : listing.is_free ? ' · Free' : ''}
                        {listing.lat && userLat && userLng ? ' · 📍 ' + formatDistance(getDistanceKm(userLat, userLng, listing.lat, listing.lng!)) : ''}
                      </p>
                    </div>
                  </Link>
                  {index === 2 && sponsor && (
                    <div onClick={openSponsorWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: '#F5F0E6', borderBottom: '1px solid #D8D0BC', cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1B3A1D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏪</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#C8821A', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Community sponsor</span>
                        <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sponsor.business_name}</p>
                        <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sponsor.tagline}</p>
                      </div>
                      <span style={{ fontSize: 11, background: '#1B3A1D', color: '#fff', borderRadius: 6, padding: '5px 8px', fontFamily: '-apple-system, sans-serif', whiteSpace: 'nowrap' }}>WhatsApp</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* PEOPLE TAB */}
        {activeTab === 'people' && (
          <>
            <div style={{ padding: '8px 14px 3px' }}>
              <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                {peopleLoading ? 'Loading...' : filteredPeople.length + ' people' + (peopleParish !== 'All Parishes' ? ' · ' + peopleParish : ' · All parishes')}
              </span>
            </div>
            {peopleLoading ? (
              <div className="loading">Loading people...</div>
            ) : filteredPeople.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: 28, marginBottom: 8 }}>👤</p>
                <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>No one found yet</p>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Try a different parish or search term</p>
              </div>
            ) : (
              filteredPeople.map((person: any) => {
                const initials = (person.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                const tags = person.services ? person.services.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                return (
                  <Link key={person.id} href={'/profile/' + person.id} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid #E8E4DC', background: '#fff' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2D5A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#A8D5A2', flexShrink: 0, fontFamily: '-apple-system, sans-serif' }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', margin: 0 }}>{person.full_name}</p>
                          {person.is_verified && <span style={{ fontSize: 9, background: '#D0E8BC', color: '#1B3A1D', borderRadius: 3, padding: '1px 5px', fontFamily: '-apple-system, sans-serif', fontWeight: 700 }}>✓</span>}
                        </div>
                        <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', margin: '0 0 5px' }}>{person.parish}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {tags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} style={{ fontSize: 10, background: '#D0E8BC', color: '#1B3A1D', borderRadius: 20, padding: '2px 8px', fontFamily: '-apple-system, sans-serif' }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 3L9 6.5L4 10" stroke="#D8D0BC" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                  </Link>
                )
              })
            )}
          </>
        )}
      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Home</span></Link>
        <Link href="/browse" className="nav-item active"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="M15 15L19 19" strokeLinecap="round"/></svg><span className="nav-label">Browse</span></Link>
        <div className="fab-wrapper"><Link href="/post" className="fab"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 2V15M2 8.5H15" strokeLinecap="round"/></svg></Link><span className="nav-label" style={{ color: '#5A5A50' }}>Post</span></div>
        <Link href="/favorites" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 18.5C11 18.5 3 13.5 3 7.5C3 5.3 4.8 3.5 7 3.5C8.8 3.5 10.3 4.5 11 5C11.7 4.5 13.2 3.5 15 3.5C17.2 3.5 19 5.3 19 7.5C19 13.5 11 18.5 11 18.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Saved</span></Link>
        <Link href="/account" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg><span className="nav-label">Me</span></Link>
      </nav>

      {showParishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,58,29,0.6)', zIndex: 400, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowParishModal(false)}>
          <div style={{ background: '#F5F0E6', borderRadius: '18px 18px 0 0', padding: '16px 14px 30px', width: '100%', maxWidth: 480, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 14, color: '#18180F', marginBottom: 12 }}>Choose your parish</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PARISHES.map(p => (
                <button key={p}
                  className={'district-pill ' + ((activeTab === 'people' ? peopleParish : parish) === p ? 'active' : '')}
                  onClick={() => {
                    if (activeTab === 'people') { setPeopleParish(p) } else { setParish(p); setDistrict('all') }
                    setShowParishModal(false)
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setShowParishModal(false)} style={{ marginTop: 13, width: '100%', background: '#EDE7D9', border: '1px solid #D8D0BC', borderRadius: 9, padding: 11, fontSize: 13, cursor: 'pointer', color: '#18180F' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <BrowseContent />
    </Suspense>
  )
}
