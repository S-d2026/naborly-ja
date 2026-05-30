'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase, toggleSaved, goLive, updateLiveLocation, stopLive, getLiveLocation, getDistanceKm, formatDistance, type Listing, type VendorLocation } from '@/lib/supabase'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const RELAY_NUMBER = '+19174432797'
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE || ''

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

const REPORT_REASONS = [
  'Spam or fake listing',
  'Offensive or inappropriate content',
  'Scam or fraud',
  'Wrong category',
  'Already fulfilled',
  'Other',
]

const DONATION_AMOUNTS = [
  { label: '$5', value: '5.00' },
  { label: '$10', value: '10.00' },
  { label: '$20', value: '20.00' },
  { label: '$50', value: '50.00' },
]

export default function ListingPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMap, setShowMap] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
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
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
        () => {}
      )
    }

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

    getLiveLocation(id as string).then(({ data }) => {
      if (data) { setVendorLocation(data); setIsLive(true) }
    })

    const channel = supabase
      .channel('vendor-location-' + id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vendor_locations',
        filter: 'listing_id=eq.' + id,
      }, (payload) => {
        const loc = payload.new as VendorLocation
        if (loc.is_live) {
          setVendorLocation(loc)
          setIsLive(true)
        } else {
          setVendorLocation(null)
          setIsLive(false)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    }
  }, [id, router])

  useEffect(() => {
    if (listing && userLat && userLng && listing.lat && listing.lng) {
      const km = getDistanceKm(userLat, userLng, listing.lat, listing.lng)
      setDistance(formatDistance(km))
    }
  }, [listing, userLat, userLng])

  useEffect(() => {
    if (listing && user) {
      setIsOwner(listing.user_id === user.id)
    }
  }, [listing, user])

  async function handleSave() {
    if (!user) { router.push('/login'); return }
    const { saved: newSaved } = await toggleSaved(user.id, id as string)
    setSaved(newSaved)
  }

  async function handleGoLive() {
    if (!user || !listing) return
    setGoingLive(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await goLive(id as string, user.id, latitude, longitude)
        setIsLive(true)
        setGoingLive(false)
        liveIntervalRef.current = setInterval(async () => {
          navigator.geolocation.getCurrentPosition(
            async (p) => { await updateLiveLocation(id as string, p.coords.latitude, p.coords.longitude) },
            () => {}
          )
        }, 30000)
      },
      () => { setGoingLive(false); alert('Could not get your location.') }
    )
  }

  async function handleStopLive() {
    await stopLive(id as string)
    setIsLive(false)
    setVendorLocation(null)
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
  }

  async function handleReport() {
    if (!reportReason) return
    setReporting(true)
    await supabase.from('listing_reports').insert([{
      listing_id: id,
      reason: reportReason,
      reporter_whatsapp: user?.user_metadata?.whatsapp || null,
    }])
    setReporting(false)
    setReportSubmitted(true)
    setShowReport(false)
  }

  const effectiveDonationAmount = customAmount && parseFloat(customAmount) > 0
    ? parseFloat(customAmount).toFixed(2)
    : donationAmount

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
    ? encodeURIComponent('Hi Naberly, I want to help the anonymous listing "' + listing.title + '" in ' + (listing.district || listing.parish) + '. Please relay my message.\n\nnaberlyja.com\n\n')
    : encodeURIComponent('Hi, I saw your Naberly listing for "' + listing.title + '". I am interested.\n\nnaberlyja.com\n\n')

  const isUrgent = listing.category === 'urgent'
  const showDonateButton = listing.is_free || isUrgent
  const headerBg = isUrgent ? '#3D1010' : '#1B3A1D'

  const mapLat = vendorLocation?.lat ?? listing.lat ?? PARISH_COORDS[listing.parish]?.lat ?? 17.9971
  const mapLng = vendorLocation?.lng ?? listing.lng ?? PARISH_COORDS[listing.parish]?.lng ?? -76.7936
  const directionsUrl = 'https://www.google.com/maps/search/' + encodeURIComponent((listing.district || listing.parish) + ', Jamaica')

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', disableFunding: 'paylater,credit' }}>
      <div className="app-shell">
        <div style={{ background: headerBg, padding: '12px 15px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
          <Link href="/browse" className="back-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>←</Link>
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>{isUrgent ? 'Urgent Need' : 'Listing'}</span>
          {isLive && <span style={{ background: '#A84B2A', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, padding: '3px 7px', borderRadius: 20, letterSpacing: 0.5 }}>🔴 LIVE</span>}
          {listing.is_anonymous && <span className="chip chip-anon" style={{ fontSize: 9 }}>Anonymous</span>}
          <button onClick={handleSave} style={{ background: 'rgba(255,255,255,0.09)', border: 'none', borderRadius: '50%', width: 29, height: 29, cursor: 'pointer', color: saved ? '#C0392B' : 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {saved ? '♥' : '♡'}
          </button>
        </div>

        <div className="scroll-area">
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

            {listing.description && (
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F', lineHeight: 1.75, marginBottom: 10 }}>
                {listing.description}
              </p>
            )}

            {/* Donation section — free food and urgent listings */}
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
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 3 }}>
                        {isUrgent ? 'Help with this urgent need' : 'Support this free listing'}
                      </p>
                      <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.5 }}>
                        {isUrgent ? 'Your donation supports this family through the NaberlyJA community fund.' : 'Your donation supports this listing and the NaberlyJA community fund.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDonate(true)}
                      style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >
                      Donate ❤️
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 12 }}>Choose an amount (USD)</p>

                    {/* Amount selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                      {DONATION_AMOUNTS.map(a => (
                        <button key={a.value}
                          onClick={() => { setDonationAmount(a.value); setCustomAmount('') }}
                          style={{ background: donationAmount === a.value && !customAmount ? '#1B3A1D' : '#EDE7D9', color: donationAmount === a.value && !customAmount ? '#fff' : '#18180F', border: '1px solid ' + (donationAmount === a.value && !customAmount ? '#1B3A1D' : '#D8D0BC'), borderRadius: 6, padding: '8px 0', fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                          {a.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom amount */}
                    <input
                      className="form-field"
                      type="number"
                      placeholder="Or enter custom amount (USD)"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />

                    {/* Payment method toggle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                      <button onClick={() => setDonationMethod('paypal')}
                        style={{ background: donationMethod === 'paypal' ? '#1B3A1D' : '#EDE7D9', color: donationMethod === 'paypal' ? '#fff' : '#18180F', border: '1px solid ' + (donationMethod === 'paypal' ? '#1B3A1D' : '#D8D0BC'), borderRadius: 6, padding: '8px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                        PayPal / Card
                      </button>
                      <button onClick={() => setDonationMethod('zelle')}
                        style={{ background: donationMethod === 'zelle' ? '#1B3A1D' : '#EDE7D9', color: donationMethod === 'zelle' ? '#fff' : '#18180F', border: '1px solid ' + (donationMethod === 'zelle' ? '#1B3A1D' : '#D8D0BC'), borderRadius: 6, padding: '8px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                        Zelle (US)
                      </button>
                    </div>

                    {/* Zelle instructions */}
                    {donationMethod === 'zelle' && (
                      <div style={{ background: '#EDE7D9', borderRadius: 7, padding: '10px 12px', marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#18180F', fontWeight: 700, marginBottom: 4 }}>Zelle instructions</p>
                        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6 }}>
                          Send ${effectiveDonationAmount} USD to <strong>+1 917 443 2797</strong> via Zelle. Add the listing title in the memo. Zero fees — 100% goes to supporting this community.
                        </p>
                        <button
                          onClick={() => setDonationSuccess(true)}
                          style={{ marginTop: 10, width: '100%', background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: 10, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                          I've sent my Zelle donation ✓
                        </button>
                      </div>
                    )}

                    {/* PayPal button */}
                    {donationMethod === 'paypal' && (
                      <PayPalButtons
                        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate' }}
                        createOrder={(_data: any, actions: any) => {
                          return actions.order.create({
                            purchase_units: [{
                              amount: { value: effectiveDonationAmount, currency_code: 'USD' },
                              description: 'NaberlyJA — Community donation: ' + listing.title,
                            }]
                          })
                        }}
                        onApprove={async (_data: any, actions: any) => {
                          await actions.order.capture()
                          setDonationSuccess(true)
                        }}
                        onError={() => alert('Payment failed. Please try again.')}
                      />
                    )}

                    <button
                      onClick={() => setShowDonate(false)}
                      style={{ width: '100%', background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Live vendor tracking panel */}
            {isLive && vendorLocation && (
              <div style={{ background: '#3D1010', borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #7A2020' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A84B2A' }} />
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#fff' }}>Vendor is live now</p>
                </div>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Location updates every 30 seconds · Last updated {new Date(vendorLocation.updated_at).toLocaleTimeString()}
                </p>
                {userLat && userLng && (
                  <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.8)' }}>
                    📍 {formatDistance(getDistanceKm(userLat, userLng, vendorLocation.lat, vendorLocation.lng))} from you right now
                  </p>
                )}
              </div>
            )}

            {/* Owner Go Live / Stop Live controls */}
            {isOwner && (
              <div style={{ background: '#EDE7D9', borderRadius: 10, padding: 12, marginBottom: 12, border: '1px solid #D8D0BC' }}>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 4 }}>Live location</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 9, lineHeight: 1.6 }}>
                  {isLive ? 'Your live location is broadcasting. Customers can see where you are in real time.' : 'Go live to let customers see your exact location as you move — perfect for food trucks, mobile services and taxis.'}
                </p>
                {isLive ? (
                  <button onClick={handleStopLive} style={{ background: '#A84B2A', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                    Stop broadcasting
                  </button>
                ) : (
                  <button onClick={handleGoLive} disabled={goingLive} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', opacity: goingLive ? 0.7 : 1 }}>
                    {goingLive ? 'Starting...' : '🔴 Go Live'}
                  </button>
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
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                  {listing.is_anonymous ? 'Anonymous neighbour' : 'Community member'}
                </p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>{listing.district || listing.parish}</p>
              </div>
              {(listing.profiles as any)?.is_verified && !listing.is_anonymous && (
                <span className="chip chip-approved" style={{ fontSize: 9 }}>Trusted</span>
              )}
            </div>

            {whatsappContact && (
              <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                <div
                  onClick={() => {
                    const num = whatsappContact.replace(/\D/g, '')
                    window.open('https://wa.me/' + num + '?text=' + whatsappMessage, '_blank')
                  }}
                  className="btn-wa"
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  💬 {listing.is_anonymous ? 'Send help via Naberly' : 'WhatsApp'}
                </div>
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

            <div className="divider" />

            <div style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                  {isLive ? '🔴 Live location' : listing.district || listing.parish}
                </p>
                <button onClick={() => setShowMap(!showMap)} style={{ background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', cursor: 'pointer', fontWeight: 700 }}>
                  {showMap ? 'Hide map' : 'Show map'}
                </button>
              </div>

              {showMap && (
                <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: isLive ? '2px solid #A84B2A' : '1px solid #D8D0BC' }}>
                  <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    src={'https://www.openstreetmap.org/export/embed.html?bbox=' + (mapLng - 0.01) + ',' + (mapLat - 0.01) + ',' + (mapLng + 0.01) + ',' + (mapLat + 0.01) + '&layer=mapnik&marker=' + mapLat + ',' + mapLng}
                  />
                  {isLive && (
                    <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#A84B2A', textAlign: 'center', padding: '6px 0', background: '#F5F0E6', fontWeight: 700 }}>
                      🔴 Live — updates every 30 seconds
                    </p>
                  )}
                </div>
              )}

              <div
                onClick={() => window.open(directionsUrl, '_blank')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EDE7D9', border: '1.5px solid #1B3A1D', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', cursor: 'pointer' }}
              >
                Get directions in Google Maps
              </div>
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
                  <button
                    onClick={() => setShowReport(true)}
                    style={{ background: 'none', border: 'none', fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Report this listing
                  </button>
                ) : (
                  <div style={{ background: '#F5F0E6', borderRadius: 10, padding: 13, border: '1px solid #D8D0BC' }}>
                    <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 10 }}>Why are you reporting this?</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                      {REPORT_REASONS.map(reason => (
                        <button
                          key={reason}
                          onClick={() => setReportReason(reason)}
                          style={{ background: reportReason === reason ? '#1B3A1D' : '#EDE7D9', color: reportReason === reason ? '#fff' : '#18180F', border: '1px solid ' + (reportReason === reason ? '#1B3A1D' : '#D8D0BC'), borderRadius: 7, padding: '8px 11px', fontSize: 12, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', textAlign: 'left' }}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button
                        onClick={handleReport}
                        disabled={!reportReason || reporting}
                        style={{ flex: 1, background: reportReason ? '#A84B2A' : '#D8D0BC', color: '#fff', border: 'none', borderRadius: 7, padding: 10, fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: reportReason ? 'pointer' : 'default', opacity: reporting ? 0.7 : 1 }}
                      >
                        {reporting ? 'Submitting...' : 'Submit report'}
                      </button>
                      <button
                        onClick={() => { setShowReport(false); setReportReason('') }}
                        style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 7, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const url = 'https://naberlyja.com/listing/' + listing.id
                const text = encodeURIComponent(listing.title + ' — ' + (listing.district || listing.parish) + '\n\n' + url)
                if (navigator.share) {
                  navigator.share({ title: listing.title, url })
                } else {
                  window.open('https://wa.me/?text=' + text, '_blank')
                }
              }}
              style={{ width: '100%', background: '#EDE7D9', border: '1.5px solid #1B3A1D', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', cursor: 'pointer', marginBottom: 8 }}
            >
              Share this listing
            </button>

            <Link href="/boost" className="btn-ghost" style={{ fontSize: 12, marginBottom: 14 }}>
              Boost this listing
            </Link>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  )
}
