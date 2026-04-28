'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase, toggleSaved, type Listing } from '@/lib/supabase'

const RELAY_NUMBER = '+19174432797'

// Jamaica district coordinates for map display
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  'Cross Roads': { lat: 17.9934, lng: -76.7857 },
  'Maxfield Ave': { lat: 17.9923, lng: -76.8012 },
  'Half Way Tree': { lat: 18.0106, lng: -76.7956 },
  'Dunrobin': { lat: 17.9756, lng: -76.8234 },
  'August Town': { lat: 18.0234, lng: -76.7612 },
  'Duhaney Park': { lat: 17.9812, lng: -76.7534 },
  'Arnett Gardens': { lat: 17.9889, lng: -76.8134 },
  'Trench Town': { lat: 17.9912, lng: -76.8089 },
  'New Kingston': { lat: 18.0067, lng: -76.7823 },
  'Barbican': { lat: 18.0234, lng: -76.7712 },
  'Constant Spring': { lat: 18.0445, lng: -76.7978 },
  'Papine': { lat: 18.0312, lng: -76.7456 },
  'Montego Bay': { lat: 18.4762, lng: -77.8939 },
  'Mandeville': { lat: 18.0415, lng: -77.5042 },
  'May Pen': { lat: 17.9643, lng: -77.2434 },
}

const PARISH_COORDS: Record<string, { lat: number; lng: number }> = {
  'Kingston': { lat: 17.9971, lng: -76.7936 },
  'St. Andrew': { lat: 18.0425, lng: -76.7457 },
  'St. Thomas': { lat: 17.9234, lng: -76.3456 },
  'Portland': { lat: 18.1756, lng: -76.4567 },
  'St. Mary': { lat: 18.3123, lng: -76.9234 },
  'St. Ann': { lat: 18.4234, lng: -77.2345 },
  'Trelawny': { lat: 18.4567, lng: -77.6234 },
  'St. James': { lat: 18.4762, lng: -77.8939 },
  'Hanover': { lat: 18.4123, lng: -78.1234 },
  'Westmoreland': { lat: 18.2234, lng: -78.1345 },
  'St. Elizabeth': { lat: 17.9934, lng: -77.7234 },
  'Manchester': { lat: 18.0415, lng: -77.5042 },
  'Clarendon': { lat: 17.9634, lng: -77.2345 },
  'St. Catherine': { lat: 17.9923, lng: -77.0234 },
}

export default function ListingPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    supabase
      .from('listings')
      .select('*, profiles(full_name, whatsapp, is_verified)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push('/browse'); return }
        setListing(data as Listing)
        setLoading(false)
        supabase.from('listings').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
      })
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('saved_listings').select('id').eq('user_id', user.id).eq('listing_id', id).single()
        .then(({ data }) => { if (data) setSaved(true) })
    })
  }, [id, router])

  async function handleSave() {
    if (!user) { router.push('/login'); return }
    const { saved: newSaved } = await toggleSaved(user.id, id as string)
    setSaved(newSaved)
  }

  if (loading) return <div className="app-shell"><div className="loading">Loading...</div></div>
  if (!listing) return null

  const BG_MAP: Record<string, string> = {
    food: '#D0E8BC', urgent: '#F0CABA', work: '#BCD0E8',
    ride: '#E0D8F0', service: '#F0E8BC', 'buy-sell': '#EDE7D9'
  }
  const EMOJI_MAP: Record<string, string> = {
    food: '🍲', urgent: '⚠️', work: '💼', ride: '🚗', service: '🛠️', 'buy-sell': '🛍️'
  }

  const whatsappContact = listing.is_anonymous ? RELAY_NUMBER : listing.whatsapp
  const whatsappMessage = listing.is_anonymous
    ? encodeURIComponent('Hi Naberly, I want to help the anonymous listing "' + listing.title + '" in ' + (listing.district || listing.parish) + '. Please relay my message.')
    : encodeURIComponent('Hi, I saw your Naberly listing for "' + listing.title + '". I am interested.')

  const isUrgent = listing.category === 'urgent'
  const headerBg = isUrgent ? '#3D1010' : '#1B3A1D'

  // Get coordinates for map
  const coords = listing.district
    ? (DISTRICT_COORDS[listing.district] || PARISH_COORDS[listing.parish] || PARISH_COORDS['Kingston'])
    : (PARISH_COORDS[listing.parish] || PARISH_COORDS['Kingston'])

  const mapUrl = 'https://maps.googleapis.com/maps/api/staticmap?center=' + coords.lat + ',' + coords.lng + '&zoom=14&size=600x200&maptype=roadmap&markers=color:0x1B3A1D%7C' + coords.lat + ',' + coords.lng + '&key=AIzaSyD-placeholder'

  const directionsUrl = 'https://www.google.com/maps/search/' + encodeURIComponent((listing.district || listing.parish) + ', Jamaica')

  return (
    <div className="app-shell">
      <div style={{ background: headerBg, padding: '12px 15px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/browse" className="back-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>←</Link>
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{isUrgent ? 'Urgent Need' : 'Listing'}</span>
        {listing.is_anonymous && <span className="chip chip-anon" style={{ fontSize: 9 }}>Anonymous</span>}
        <button onClick={handleSave} style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: '50%', width: 29, height: 29, cursor: 'pointer', color: saved ? '#C0392B' : 'rgba(255,255,255,0.7)', fontSize: 14 }}>
          {saved ? '♥' : '♡'}
        </button>
      </div>

      <div className="scroll-area">
        {/* Hero image or emoji */}
        {listing.photo_url ? (
          <img src={listing.photo_url} alt={listing.title} style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }} />
        ) : (
          <div style={{ background: BG_MAP[listing.category] || '#EDE7D9', height: 155, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58 }}>
            {EMOJI_MAP[listing.category] || '📋'}
          </div>
        )}

        <div style={{ padding: 14 }}>
          {isUrgent && (
            <div className="bar-119">
              <div>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#fff' }}>Life-threatening? Call 119 now</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>Police · Fire · Ambulance</p>
              </div>
              <a href="tel:119" className="btn-119">Call 119</a>
            </div>
          )}

          <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
            {listing.is_free && <span className="chip chip-free">Free</span>}
            {listing.category === 'urgent' && <span className="chip chip-urgent">Urgent</span>}
            {listing.is_anonymous && <span className="chip chip-anon">Anonymous</span>}
            {listing.is_featured && <span className="chip chip-featured">Featured</span>}
            <span className="chip chip-neutral">{listing.parish}</span>
            {listing.district && <span className="chip chip-neutral">{listing.district}</span>}
          </div>

          <p style={{ fontSize: 17, color: '#18180F', lineHeight: 1.3, marginBottom: 5 }}>{listing.title}</p>
          <p style={{ fontSize: 18, color: '#1B3A1D', marginBottom: 10 }}>
            {listing.is_free ? 'Free' : listing.price_jmd ? '$' + listing.price_jmd.toLocaleString() + ' JMD' : 'By quote'}
          </p>

          <div className="divider" />

          {listing.description && (
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75, marginBottom: 10 }}>
              {listing.description}
            </p>
          )}

          {listing.is_free && (
            <div className="info-box" style={{ marginBottom: 11 }}>
              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.6 }}>If you can afford to pay, donate what you can — it helps the next family.</p>
            </div>
          )}

          {listing.families_helped > 0 && (
            <div style={{ background: '#1B3A1D', borderRadius: 8, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                <p style={{ fontSize: 17, color: '#fff' }}>{listing.families_helped}</p>
                <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.45)' }}>Helped</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid rgba(255,255,255,0.12)', paddingRight: 10 }}>
                <p style={{ fontSize: 17, color: '#fff' }}>{listing.response_count}</p>
                <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.45)' }}>Responses</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: 17, color: '#fff' }}>{listing.view_count}</p>
                <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.45)' }}>Views</p>
              </div>
            </div>
          )}

          {listing.is_anonymous && (
            <div className="anon-box" style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#4A1A80', marginBottom: 4 }}>🔒 This post is anonymous</p>
              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#6B2A9A', lineHeight: 1.65 }}>The poster's name and number are hidden. Your message goes through Naberly's relay — neither contact is shared unless you both agree.</p>
            </div>
          )}

          <div className="divider" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: listing.is_anonymous ? '#D8D0BC' : '#EDE7D9', border: '1px solid #D8D0BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: listing.is_anonymous ? 14 : 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', flexShrink: 0 }}>
              {listing.is_anonymous ? '🔒' : ((listing.profiles as any)?.full_name?.slice(0, 2)?.toUpperCase() || '??')}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                {listing.is_anonymous ? 'Anonymous neighbor' : (listing.profiles as any)?.full_name || 'Community member'}
              </p>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>{listing.district || listing.parish}</p>
            </div>
            {(listing.profiles as any)?.is_verified && !listing.is_anonymous && (
              <span className="chip chip-approved" style={{ fontSize: 9 }}>Trusted</span>
            )}
          </div>

          {/* Contact buttons */}
          {whatsappContact && (
            <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
              <a href={'https://wa.me/' + whatsappContact.replace(/\D/g, '') + '?text=' + whatsappMessage} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ flex: 1 }}>
                💬 {listing.is_anonymous ? 'Send help via Naberly' : 'WhatsApp'}
              </a>
              {!listing.is_anonymous && listing.whatsapp && (
                <a href={'tel:' + listing.whatsapp} className="btn-call" style={{ flex: 0.55, fontSize: 12 }}>
                  📞 Call
                </a>
              )}
            </div>
          )}

          {listing.is_anonymous && (
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', marginBottom: 12 }}>
              Message relayed privately through naberlyja.com
            </p>
          )}

          {/* MAP SECTION */}
          <div className="divider" />
          <div style={{ marginBottom: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                📍 {listing.district || listing.parish}
              </p>
              <button
                onClick={() => setShowMap(!showMap)}
                style={{ background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', cursor: 'pointer', fontWeight: 700 }}
              >
                {showMap ? 'Hide map' : 'Show map'}
              </button>
            </div>

            {showMap && (
              <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: '1px solid #D8D0BC' }}>
                <iframe
                  width="100%"
                  height="180"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  src={'https://www.openstreetmap.org/export/embed.html?bbox=' + (coords.lng - 0.02) + ',' + (coords.lat - 0.02) + ',' + (coords.lng + 0.02) + ',' + (coords.lat + 0.02) + '&layer=mapnik&marker=' + coords.lat + ',' + coords.lng}
                />
              </div>
            )}

            
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EDE7D9', border: '1.5px solid #1B3A1D', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', textDecoration: 'none' }}
            >
              🗺️ Get directions in Google Maps
            </a>
          </div>

          <Link href="/boost" className="btn-ghost" style={{ fontSize: 12, marginBottom: 14 }}>
            Boost this listing ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
