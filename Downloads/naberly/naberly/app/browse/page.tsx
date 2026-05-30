'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase, getApprovedListings, getDistanceKm, formatDistance, toggleSaved, goLive, updateLiveLocation, stopLive, getLiveLocation, type Listing, type VendorLocation } from '@/lib/supabase'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const PARISHES = ['All Parishes','Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']
const DISTRICTS: Record<string, string[]> = {
  'Kingston': ['All areas','Cross Roads','Maxfield Ave','Half Way Tree','Dunrobin','August Town','Duhaney Park','Arnett Gardens','Trench Town','New Kingston','Barbican','Constant Spring'],
  'St. Andrew': ['All areas','Papine','Gordon Town','Havendale','Stony Hill','Lawrence Tavern','Cherry Gardens'],
  'St. James': ['All areas','Montego Bay','Ironshore','Rose Hall','Granville'],
  'Manchester': ['All areas','Mandeville','Christiana','Porus'],
  'Clarendon': ['All areas','May Pen','Lionel Town','Chapelton'],
  'St. Elizabeth': ['All areas','Santa Cruz','Black River','Junction','Malvern','Southfield','Treasure Beach'],
  'St. Ann': ["All areas","Ocho Rios","Brown's Town","St. Ann's Bay"],
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
const RELAY_NUMBER = '+19174432797'
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE || ''
const STATE_KEY = 'browse_state'

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

const REPORT_REASONS = ['Spam or fake listing','Offensive or inappropriate content','Scam or fraud','Wrong category','Already fulfilled','Other']
const DONATION_AMOUNTS = [{ label: '$5', value: '5.00' },{ label: '$10', value: '10.00' },{ label: '$20', value: '20.00' },{ label: '$50', value: '50.00' }]

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

// ===================== LISTING PANEL =====================
function ListingPanel({ listingId, onClose, userLat, userLng }: { listingId: string, onClose: () => void, userLat: number | null, userLng: number | null }) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMap, setShowMap] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [distance, setDistance] = useState<string | null>(null)
  const [vendorLocation, setVendorLocation] = useState<VendorLocation | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [goingLive, setGoingLive] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [donationAmount, setDonationAmount] = useState('10.00')
  const [customAmount, setCustomAmount] = useState('')
  const [donationSuccess, setDonationSuccess] = useState(false)
  const [donationMethod, setDonationMethod] = useState<'paypal' | 'zelle'>('paypal')
  const [visible, setVisible] = useState(false)
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 10)
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    supabase.from('listings').select('*, profiles(full_name, whatsapp, is_verified)').eq('id', listingId).single()
      .then(({ data }) => {
        if (data) {
          setListing(data as Listing)
          supabase.from('listings').update({ view_count: (data.view_count || 0) + 1 }).eq('id', listingId)
        }
        setLoading(false)
      })
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('saved_listings').select('id').eq('user_id', user.id).eq('listing_id', listingId).single()
        .then(({ data }) => { if (data) setSaved(true) })
    })
    getLiveLocation(listingId).then(({ data }) => {
      if (data) { setVendorLocation(data); setIsLive(true) }
    })
    const channel = supabase.channel('vendor-location-' + listingId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_locations', filter: 'listing_id=eq.' + listingId }, (payload) => {
        const loc = payload.new as VendorLocation
        if (loc.is_live) { setVendorLocation(loc); setIsLive(true) }
        else { setVendorLocation(null); setIsLive(false) }
      }).subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    }
  }, [listingId])

  useEffect(() => {
    if (listing && userLat && userLng && listing.lat && listing.lng) {
      setDistance(formatDistance(getDistanceKm(userLat, userLng, listing.lat, listing.lng)))
    }
  }, [listing, userLat, userLng])

  useEffect(() => {
    if (listing && user) setIsOwner(listing.user_id === user.id)
  }, [listing, user])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  async function handleSave() {
    if (!user) return
    const { saved: newSaved } = await toggleSaved(user.id, listingId)
    setSaved(newSaved)
  }

  async function handleGoLive() {
    if (!user || !listing) return
    setGoingLive(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await goLive(listingId, user.id, pos.coords.latitude, pos.coords.longitude)
      setIsLive(true); setGoingLive(false)
      liveIntervalRef.current = setInterval(async () => {
        navigator.geolocation.getCurrentPosition(async (p) => { await updateLiveLocation(listingId, p.coords.latitude, p.coords.longitude) }, () => {})
      }, 30000)
    }, () => { setGoingLive(false) })
  }

  async function handleStopLive() {
    await stopLive(listingId)
    setIsLive(false); setVendorLocation(null)
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
  }

  async function handleReport() {
    if (!reportReason) return
    setReporting(true)
    await supabase.from('listing_reports').insert([{ listing_id: listingId, reason: reportReason, reporter_whatsapp: user?.user_metadata?.whatsapp || null }])
    setReporting(false); setReportSubmitted(true); setShowReport(false)
  }

  const effectiveDonationAmount = customAmount && parseFloat(customAmount) > 0 ? parseFloat(customAmount).toFixed(2) : donationAmount

  const BG_MAP: Record<string, string> = { food: '#D0E8BC', urgent: '#F0CABA', work: '#BCD0E8', ride: '#E0D8F0', service: '#F0E8BC', 'buy-sell': '#EDE7D9' }
  const EMOJI_MAP: Record<string, string> = { food: '🍲', urgent: '⚠️', work: '💼', ride: '🚗', service: '🛠️', 'buy-sell': '🛍️' }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', disableFunding: 'paylater,credit' }}>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, transition: 'opacity 0.28s', opacity: visible ? 1 : 0 }} />
      {/* Panel */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, height: '92vh', background: '#F5F0E6', borderRadius: '16px 16px 0 0', zIndex: 201, display: 'flex', flexDirection: 'column', transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)', willChange: 'transform', overflowY: 'hidden', ...(visible ? { transform: 'translateX(-50%) translateY(0)' } : { transform: 'translateX(-50%) translateY(100%)' }) }}>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : !listing ? (
          <div className="empty-state"><p>Listing not found.</p></div>
        ) : (() => {
          const isUrgent = listing.category === 'urgent'
          const showDonateButton = listing.is_free || isUrgent
          const headerBg = isUrgent ? '#3D1010' : '#1B3A1D'
          const whatsappContact = listing.is_anonymous ? RELAY_NUMBER : listing.whatsapp
          const whatsappMessage = listing.is_anonymous
            ? encodeURIComponent('Hi Naberly, I want to help the anonymous listing "' + listing.title + '" in ' + (listing.district || listing.parish) + '. Please relay my message.\n\nnaberlyja.com\n\n')
            : encodeURIComponent('Hi, I saw your Naberly listing for "' + listing.title + '". I am interested.\n\nnaberlyja.com\n\n')
          const mapLat = vendorLocation?.lat ?? listing.lat ?? PARISH_COORDS[listing.parish]?.lat ?? 17.9971
          const mapLng = vendorLocation?.lng ?? listing.lng ?? PARISH_COORDS[listing.parish]?.lng ?? -76.7936
          const directionsUrl = 'https://www.google.com/maps/search/' + encodeURIComponent((listing.district || listing.parish) + ', Jamaica')

          return (
            <>
              {/* Panel header */}
              <div style={{ background: headerBg, padding: '12px 15px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, borderRadius: '16px 16px 0 0' }}>
                <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
                <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{isUrgent ? 'Urgent Need' : 'Listing'}</span>
                {isLive && <span style={{ background: '#A84B2A', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '3px 7px', borderRadius: 20, letterSpacing: 0.5 }}>🔴 LIVE</span>}
                {listing.is_anonymous && <span className="chip chip-anon" style={{ fontSize: 9 }}>Anonymous</span>}
                <button onClick={handleSave} style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: '50%', width: 29, height: 29, cursor: 'pointer', color: saved ? '#C0392B' : 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  {saved ? '♥' : '♡'}
                </button>
              </div>

              {/* Panel scroll area */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
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
                    {isLive && <span style={{ background: '#F0CABA', color: '#6B1E10', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: 0.5, textTransform: 'uppercase' }}>Live location</span>}
                    <span className="chip chip-neutral">{listing.parish}</span>
                    {listing.district && <span className="chip chip-neutral">{listing.district}</span>}
                    {distance && <span className="chip chip-neutral">📍 {distance}</span>}
                  </div>

                  <p style={{ fontSize: 17, color: '#18180F', lineHeight: 1.3, marginBottom: 5 }}>{listing.title}</p>
                  <p style={{ fontSize: 18, color: '#1B3A1D', marginBottom: 10 }}>
                    {listing.price_jmd ? listing.price_jmd : listing.is_free ? 'Free' : 'By quote'}
                  </p>
                  <div className="divider" />
                  {listing.description && <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75, marginBottom: 10 }}>{listing.description}</p>}

                  {/* Donation */}
                  {showDonateButton && (
                    <div style={{ background: '#F5F0E6', borderRadius: 10, padding: 13, marginBottom: 12, border: '1px solid #D8D0BC' }}>
                      {donationSuccess ? (
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                          <p style={{ fontSize: 22, marginBottom: 6 }}>🙏</p>
                          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D' }}>Thank you for your donation!</p>
                          <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 4 }}>Your generosity helps this family and the next.</p>
                        </div>
                      ) : !showDonate ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 3 }}>{isUrgent ? 'Help with this urgent need' : 'Support this free listing'}</p>
                            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.5 }}>{isUrgent ? 'Your donation supports this family through the NaberlyJA community fund.' : 'Your donation supports this listing and the NaberlyJA community fund.'}</p>
                          </div>
                          <button onClick={() => setShowDonate(true)} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Donate ❤️</button>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 12 }}>Choose an amount (USD)</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                            {DONATION_AMOUNTS.map(a => (
                              <button key={a.value} onClick={() => { setDonationAmount(a.value); setCustomAmount('') }}
                                style={{ background: donationAmount === a.value && !customAmount ? '#1B3A1D' : '#EDE7D9', color: donationAmount === a.value && !customAmount ? '#fff' : '#18180F', border: '1px solid ' + (donationAmount === a.value && !customAmount ? '#1B3A1D' : '#D8D0BC'), borderRadius: 6, padding: '8px 0', fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>{a.label}</button>
                            ))}
                          </div>
                          <input className="form-field" type="number" placeholder="Or enter custom amount (USD)" value={customAmount} onChange={e => setCustomAmount(e.target.value)} style={{ marginBottom: 12 }} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            <button onClick={() => setDonationMethod('paypal')} style={{ background: donationMethod === 'paypal' ? '#1B3A1D' : '#EDE7D9', color: donationMethod === 'paypal' ? '#fff' : '#18180F', border: '1px solid ' + (donationMethod === 'paypal' ? '#1B3A1D' : '#D8D0BC'), borderRadius: 6, padding: '8px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>PayPal / Card</button>
                            <button onClick={() => setDonationMethod('zelle')} style={{ background: donationMethod === 'zelle' ? '#1B3A1D' : '#EDE7D9', color: donationMethod === 'zelle' ? '#fff' : '#18180F', border: '1px solid ' + (donationMethod === 'zelle' ? '#1B3A1D' : '#D8D0BC'), borderRadius: 6, padding: '8px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Zelle (US)</button>
                          </div>
                          {donationMethod === 'zelle' && (
                            <div style={{ background: '#EDE7D9', borderRadius: 7, padding: '10px 12px', marginBottom: 12 }}>
                              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#18180F', fontWeight: 700, marginBottom: 4 }}>Zelle instructions</p>
                              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6 }}>Send ${effectiveDonationAmount} USD to <strong>naberlyja@gmail.com</strong> via Zelle. Add the listing title in the memo. Zero fees — 100% goes to supporting this community.</p>
                              <button onClick={() => setDonationSuccess(true)} style={{ marginTop: 10, width: '100%', background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: 10, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>I've sent my Zelle donation ✓</button>
                            </div>
                          )}
                          {donationMethod === 'paypal' && (
                            <PayPalButtons style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate' }}
                              createOrder={(_data: any, actions: any) => actions.order.create({ purchase_units: [{ amount: { value: effectiveDonationAmount, currency_code: 'USD' }, description: 'NaberlyJA — Community donation: ' + listing.title }] })}
                              onApprove={async (_data: any, actions: any) => { await actions.order.capture(); setDonationSuccess(true) }}
                              onError={() => alert('Payment failed. Please try again.')} />
                          )}
                          <button onClick={() => setShowDonate(false)} style={{ width: '100%', background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live vendor */}
                  {isLive && vendorLocation && (
                    <div style={{ background: '#3D1010', borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #7A2020' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A84B2A' }} />
                        <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#fff' }}>Vendor is live now</p>
                      </div>
                      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Location updates every 30 seconds · Last updated {new Date(vendorLocation.updated_at).toLocaleTimeString()}</p>
                      {userLat && userLng && <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.8)' }}>📍 {formatDistance(getDistanceKm(userLat, userLng, vendorLocation.lat, vendorLocation.lng))} from you right now</p>}
                    </div>
                  )}

                  {/* Owner live controls */}
                  {isOwner && (
                    <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #D8D0BC' }}>
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 4 }}>Live location</p>
                      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 9, lineHeight: 1.6 }}>{isLive ? 'Your live location is broadcasting. Customers can see where you are in real time.' : 'Go live to let customers see your exact location as you move — perfect for food trucks, mobile services and taxis.'}</p>
                      {isLive ? (
                        <button onClick={handleStopLive} style={{ background: '#A84B2A', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Stop broadcasting</button>
                      ) : (
                        <button onClick={handleGoLive} disabled={goingLive} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', opacity: goingLive ? 0.7 : 1 }}>{goingLive ? 'Starting...' : '🔴 Go Live'}</button>
                      )}
                    </div>
                  )}

                  {listing.is_anonymous && (
                    <div className="anon-box" style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#4A1A80', marginBottom: 4 }}>This post is anonymous</p>
                      <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#6B2A9A', lineHeight: 1.65 }}>The poster's name and number are hidden. Your message goes through Naberly's relay.</p>
                    </div>
                  )}

                  <div className="divider" />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: listing.is_anonymous ? '#D8D0BC' : '#EDE7D9', border: '1px solid #D8D0BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: listing.is_anonymous ? 14 : 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', flexShrink: 0 }}>
                      {listing.is_anonymous ? '🔒' : ((listing.profiles as any)?.full_name?.slice(0, 2)?.toUpperCase() || '??')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{listing.is_anonymous ? 'Anonymous neighbour' : 'Community member'}</p>
                      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>{listing.district || listing.parish}</p>
                    </div>
                    {(listing.profiles as any)?.is_verified && !listing.is_anonymous && <span className="chip chip-approved" style={{ fontSize: 9 }}>Trusted</span>}
                  </div>

                  {whatsappContact && (
                    <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                      <div onClick={() => { const num = whatsappContact.replace(/\D/g, ''); window.open('https://wa.me/' + num + '?text=' + whatsappMessage, '_blank') }} className="btn-wa" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        💬 {listing.is_anonymous ? 'Send help via Naberly' : 'WhatsApp'}
                      </div>
                      {!listing.is_anonymous && listing.whatsapp && <a href={'tel:' + listing.whatsapp} className="btn-call" style={{ flex: 0.55, fontSize: 12 }}>📞 Call</a>}
                    </div>
                  )}

                  {listing.is_anonymous && <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', marginBottom: 12 }}>Message relayed privately through naberlyja.com</p>}

                  <div className="divider" />

                  <div style={{ marginBottom: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{isLive ? '🔴 Live location' : listing.district || listing.parish}</p>
                      <button onClick={() => setShowMap(!showMap)} style={{ background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', cursor: 'pointer', fontWeight: 700 }}>{showMap ? 'Hide map' : 'Show map'}</button>
                    </div>
                    {showMap && (
                      <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: isLive ? '2px solid #A84B2A' : '1px solid #D8D0BC' }}>
                        <iframe width="100%" height="200" style={{ border: 0, display: 'block' }} loading="lazy"
                          src={'https://www.openstreetmap.org/export/embed.html?bbox=' + (mapLng - 0.01) + ',' + (mapLat - 0.01) + ',' + (mapLng + 0.01) + ',' + (mapLat + 0.01) + '&layer=mapnik&marker=' + mapLat + ',' + mapLng} />
                        {isLive && <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#A84B2A', textAlign: 'center', padding: '6px 0', background: '#F5F0E6', fontWeight: 700 }}>🔴 Live — updates every 30 seconds</p>}
                      </div>
                    )}
                    <div onClick={() => window.open(directionsUrl, '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EDE7D9', border: '1.5px solid #1B3A1D', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', cursor: 'pointer' }}>Get directions in Google Maps</div>
                  </div>

                  <div className="divider" />

                  {reportSubmitted ? (
                    <div style={{ background: '#D0E8BC', borderRadius: 8, padding: '10px 12px', marginBottom: 12, border: '1px solid #2D5A2E' }}>
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', fontWeight: 700 }}>Report submitted</p>
                      <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', marginTop: 3 }}>Thank you. Our team will review this listing.</p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12 }}>
                      {!showReport ? (
                        <button onClick={() => setShowReport(true)} style={{ background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Report this listing</button>
                      ) : (
                        <div style={{ background: '#F5F0E6', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC' }}>
                          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 10 }}>Why are you reporting this?</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                            {REPORT_REASONS.map(reason => (
                              <button key={reason} onClick={() => setReportReason(reason)} style={{ background: reportReason === reason ? '#1B3A1D' : '#EDE7D9', color: reportReason === reason ? '#fff' : '#18180F', border: '1px solid ' + (reportReason === reason ? '#1B3A1D' : '#D8D0BC'), borderRadius: 7, padding: '8px 11px', fontSize: 12, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', textAlign: 'left' }}>{reason}</button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            <button onClick={handleReport} disabled={!reportReason || reporting} style={{ flex: 1, background: reportReason ? '#A84B2A' : '#D8D0BC', color: '#fff', border: 'none', borderRadius: 7, padding: 10, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: reportReason ? 'pointer' : 'default', opacity: reporting ? 0.7 : 1 }}>{reporting ? 'Submitting...' : 'Submit report'}</button>
                            <button onClick={() => { setShowReport(false); setReportReason('') }} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 7, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={() => { const url = 'https://naberlyja.com/listing/' + listing.id; const text = encodeURIComponent(listing.title + ' — ' + (listing.district || listing.parish) + '\n\n' + url); if (navigator.share) { navigator.share({ title: listing.title, url }) } else { window.open('https://wa.me/?text=' + text, '_blank') } }} style={{ width: '100%', background: '#EDE7D9', border: '1.5px solid #1B3A1D', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', cursor: 'pointer', marginBottom: 8 }}>Share this listing</button>
                  <Link href="/boost" className="btn-ghost" style={{ fontSize: 12, marginBottom: 14 }}>Boost this listing</Link>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    </PayPalScriptProvider>
  )
}

// ===================== BROWSE PAGE =====================
function BrowseContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const getSavedState = () => {
    try { const s = sessionStorage.getItem(STATE_KEY); return s ? JSON.parse(s) : null } catch { return null }
  }
  const saved = getSavedState()

  const [activeTab, setActiveTab] = useState<'listings' | 'people'>(saved?.activeTab || 'listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(saved?.searchQuery || '')
  const [parish, setParish] = useState(saved?.parish || 'Kingston')
  const [category, setCategory] = useState(saved?.category || initialCategory)
  const [district, setDistrict] = useState(saved?.district || 'all')
  const [showParishModal, setShowParishModal] = useState(false)
  const [sponsor, setSponsor] = useState<any>(null)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [people, setPeople] = useState<any[]>([])
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState(saved?.peopleSearch || '')
  const [peopleParish, setPeopleParish] = useState(saved?.peopleParish || 'All Parishes')
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)

  const districts = DISTRICTS[parish] || DISTRICTS['default']

  useEffect(() => {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ activeTab, searchQuery, parish, category, district, peopleSearch, peopleParish })) } catch {}
  }, [activeTab, searchQuery, parish, category, district, peopleSearch, peopleParish])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLat(latitude); setUserLng(longitude)
        if (!saved?.parish) {
          const inJamaica = latitude >= JAMAICA_BOUNDS.minLat && latitude <= JAMAICA_BOUNDS.maxLat && longitude >= JAMAICA_BOUNDS.minLng && longitude <= JAMAICA_BOUNDS.maxLng
          if (inJamaica) { setParish(getParishFromCoords(latitude, longitude)) }
          else {
            try {
              const res = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude + '&format=json')
              const data = await res.json()
              const neighborhood = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.town || data.address?.city || ''
              const city = data.address?.city || data.address?.town || data.address?.county || ''
              if (neighborhood) setParish(neighborhood + (city ? ', ' + city : ''))
            } catch (e) {}
          }
        }
      }, () => {})
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user && !saved?.parish) {
        const { data: profile } = await supabase.from('profiles').select('parish').eq('id', data.user.id).single()
        if (profile?.parish) setParish(profile.parish)
      }
    })
    supabase.from('sponsors').select('*').eq('is_active', true).then(({ data }) => {
      if (data && data.length > 0) setSponsor(data[Math.floor(Math.random() * data.length)])
    })
  }, [])

  const loadListings = useCallback(async () => {
    setLoading(true)
    const { data } = await getApprovedListings({ parish: parish !== 'All Parishes' ? parish : undefined, category: category !== 'all' ? category : undefined, district: district !== 'all' ? district : undefined })
    setListings((data as Listing[]) || [])
    setLoading(false)
  }, [parish, category, district])

  useEffect(() => { loadListings() }, [loadListings])

  const loadPeople = useCallback(async () => {
    setPeopleLoading(true)
    let query = supabase.from('profiles').select('id, full_name, parish, services, is_verified, helper_count').not('services', 'is', null).neq('services', '').eq('show_in_directory', true).order('helper_count', { ascending: false })
    if (peopleParish !== 'All Parishes') query = query.eq('parish', peopleParish)
    const { data } = await query
    setPeople(data || []); setPeopleLoading(false)
  }, [peopleParish])

  useEffect(() => { if (activeTab === 'people') loadPeople() }, [activeTab, loadPeople])

  const filteredPeople = people.filter(p => !peopleSearch || (p.full_name || '').toLowerCase().includes(peopleSearch.toLowerCase()) || (p.services || '').toLowerCase().includes(peopleSearch.toLowerCase()))
  const filtered = listings.filter(l => !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || (l.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || (l.district || '').toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <div className="app-shell">
        <div className="header-sm">
          <Link href="/" className="back-btn">←</Link>
          <input className="search-input" placeholder={activeTab === 'people' ? 'Search people or skills...' : parish === 'All Parishes' ? 'Search all listings...' : 'Search in ' + parish + '...'} value={activeTab === 'people' ? peopleSearch : searchQuery} onChange={e => activeTab === 'people' ? setPeopleSearch(e.target.value) : setSearchQuery(e.target.value)} />
          <button onClick={() => setShowParishModal(true)} style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: 6, padding: '6px 8px', color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {(activeTab === 'people' ? peopleParish : parish) === 'All Parishes' ? 'All' : (activeTab === 'people' ? peopleParish : parish).replace('St. ', '')} ⌄
          </button>
        </div>

        <div style={{ display: 'flex', background: '#1B3A1D', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <button onClick={() => setActiveTab('listings')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: activeTab === 'listings' ? 700 : 400, color: activeTab === 'listings' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: activeTab === 'listings' ? '2px solid #C8821A' : '2px solid transparent' }}>Listings</button>
          <button onClick={() => setActiveTab('people')} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: activeTab === 'people' ? 700 : 400, color: activeTab === 'people' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: activeTab === 'people' ? '2px solid #C8821A' : '2px solid transparent' }}>People</button>
        </div>

        {activeTab === 'listings' && (
          <>
            <div className="pill-row">
              {CATEGORIES.map(cat => <button key={cat.key} className={'pill ' + (category === cat.key ? 'active' : '')} onClick={() => setCategory(cat.key)}>{cat.label}</button>)}
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
              {districts.map(d => <button key={d} className={'district-pill ' + ((d === 'All areas' && district === 'all') || district === d ? 'active' : '')} onClick={() => setDistrict(d === 'All areas' ? 'all' : d)}>{d}</button>)}
            </div>
          </>
        )}

        <div className="scroll-area">
          {activeTab === 'listings' && (
            <>
              <div style={{ padding: '8px 14px 3px' }}>
                <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  {loading ? 'Loading...' : filtered.length + ' listing' + (filtered.length !== 1 ? 's' : '') + ' · ' + (parish === 'All Parishes' ? 'All parishes' : parish) + (district !== 'all' ? ', ' + district : ', All areas')}
                </span>
              </div>
              {loading ? <div className="loading">Loading listings...</div> : filtered.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
                  <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>Nothing in this area yet</p>
                  <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Try "All areas" or <Link href="/post" style={{ color: '#1B3A1D' }}>post something yourself</Link></p>
                </div>
              ) : filtered.map((listing, index) => (
                <div key={listing.id}>
                  <div onClick={() => setSelectedListingId(listing.id)} className="listing-row" style={{ cursor: 'pointer' }}>
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
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</p>
                      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                        {listing.district || listing.parish}
                        {listing.price_jmd ? ' · ' + listing.price_jmd : listing.is_free ? ' · Free' : ''}
                        {listing.lat && userLat && userLng ? ' · 📍 ' + formatDistance(getDistanceKm(userLat, userLng, listing.lat, listing.lng!)) : ''}
                      </p>
                    </div>
                  </div>
                  {index === 2 && sponsor && (
                    <div onClick={() => { if (sponsor?.whatsapp) window.open('https://wa.me/' + sponsor.whatsapp.replace(/\D/g, ''), '_blank') }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: '#F5F0E6', borderBottom: '1px solid #D8D0BC', cursor: 'pointer' }}>
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
              ))}
            </>
          )}

          {activeTab === 'people' && (
            <>
              <div style={{ padding: '8px 14px 3px' }}>
                <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  {peopleLoading ? 'Loading...' : filteredPeople.length + ' people' + (peopleParish !== 'All Parishes' ? ' · ' + peopleParish : ' · All parishes')}
                </span>
              </div>
              {peopleLoading ? <div className="loading">Loading people...</div> : filteredPeople.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontSize: 28, marginBottom: 8 }}>👤</p>
                  <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>No one found yet</p>
                  <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Try a different parish or search term</p>
                </div>
              ) : filteredPeople.map((person: any) => {
                const initials = (person.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                const tags = person.services ? person.services.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                return (
                  <Link key={person.id} href={'/profile/' + person.id} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid #E8E4DC', background: '#fff' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2D5A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#A8D5A2', flexShrink: 0, fontFamily: '-apple-system, sans-serif' }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', margin: 0 }}>
                            {(() => { const p = (person.full_name || '').trim().split(' '); return p.length > 1 ? p[0] + ' ' + p[p.length-1][0] + '.' : person.full_name })()}
                          </p>
                          {person.is_verified && <span style={{ fontSize: 9, background: '#D0E8BC', color: '#1B3A1D', borderRadius: 3, padding: '1px 5px', fontFamily: '-apple-system, sans-serif', fontWeight: 700 }}>✓</span>}
                        </div>
                        <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', margin: '0 0 5px' }}>{person.parish}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {tags.slice(0, 3).map((tag: string, i: number) => <span key={i} style={{ fontSize: 10, background: '#D0E8BC', color: '#1B3A1D', borderRadius: 20, padding: '2px 8px', fontFamily: '-apple-system, sans-serif' }}>{tag}</span>)}
                        </div>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 3L9 6.5L4 10" stroke="#D8D0BC" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                  </Link>
                )
              })}
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
                  <button key={p} className={'district-pill ' + ((activeTab === 'people' ? peopleParish : parish) === p ? 'active' : '')} onClick={() => { if (activeTab === 'people') { setPeopleParish(p) } else { setParish(p); setDistrict('all') } setShowParishModal(false) }}>{p}</button>
                ))}
              </div>
              <button onClick={() => setShowParishModal(false)} style={{ marginTop: 13, width: '100%', background: '#EDE7D9', border: '1px solid #D8D0BC', borderRadius: 9, padding: 11, fontSize: 13, cursor: 'pointer', color: '#18180F' }}>Done</button>
            </div>
          </div>
        )}
      </div>

      {/* Listing panel */}
      {selectedListingId && (
        <ListingPanel
          listingId={selectedListingId}
          onClose={() => setSelectedListingId(null)}
          userLat={userLat}
          userLng={userLng}
        />
      )}
    </>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <BrowseContent />
    </Suspense>
  )
}
