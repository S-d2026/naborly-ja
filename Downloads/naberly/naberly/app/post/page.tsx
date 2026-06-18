'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, createListing } from '@/lib/supabase'

const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine','Other (outside Jamaica)']

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍲', bg: '#D0E8BC' },
  { key: 'urgent', label: 'Urgent', emoji: '⚠️', bg: '#F0CABA' },
  { key: 'work', label: 'Work', emoji: '💼', bg: '#BCD0E8' },
  { key: 'ride', label: 'Ride', emoji: '🚗', bg: '#E0D8F0' },
  { key: 'service', label: 'Service', emoji: '🛠️', bg: '#F0E8BC' },
  { key: 'buy-sell', label: 'Buy/Sell', emoji: '🛍️', bg: '#EDE7D9' },
]

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
  return ''
}

function PostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialAnon = searchParams.get('anonymous') === 'true'
  const [isAnonymous, setIsAnonymous] = useState(initialAnon)
  const [listingType, setListingType] = useState<'need' | 'offer'>('need')
  const [category, setCategory] = useState('food')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [parish, setParish] = useState('Kingston')
  const [otherLocation, setOtherLocation] = useState('')
  const [district, setDistrict] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationSet, setLocationSet] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [gpsLat, setGpsLat] = useState<number | null>(null)
  const [gpsLng, setGpsLng] = useState<number | null>(null)

  const isOther = parish === 'Other (outside Jamaica)'

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/signup?message=Please+sign+up+to+post+a+listing')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('parish, whatsapp')
        .eq('id', data.user.id)
        .single()
      if (profile?.parish) {
        if (PARISHES.includes(profile.parish)) {
          setParish(profile.parish)
        } else {
          setParish('Other (outside Jamaica)')
          setOtherLocation(profile.parish)
        }
      }
      if (profile?.whatsapp) setWhatsapp(profile.whatsapp)
      setAuthChecked(true)
    })
  }, [router])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileName = Date.now() + '-' + file.name.replace(/\s/g, '-')
      const { data, error: uploadError } = await supabase.storage
        .from('Listings')
        .upload(fileName, file, { upsert: true })
      if (uploadError) {
        alert('Photo upload failed: ' + uploadError.message)
      } else if (data) {
        const { data: urlData } = supabase.storage.from('Listings').getPublicUrl(fileName)
        setPhotoUrl(urlData.publicUrl)
      }
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  function handleUseLocation() {
    if (!navigator.geolocation) { setLocationError('Location not supported.'); return }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsLat(latitude)
        setGpsLng(longitude)
        const inJamaica = latitude >= 17.70 && latitude <= 18.55 && longitude >= -78.40 && longitude <= -76.18
        try {
          const res = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude + '&format=json')
          const data = await res.json()
          if (inJamaica) {
            const detectedParish = getParishFromCoords(latitude, longitude)
            if (detectedParish) setParish(detectedParish)
            const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.village || data.address?.town || ''
            if (suburb) setDistrict(suburb)
          } else {
            const neighborhood = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.town || data.address?.city || ''
            const city = data.address?.city || data.address?.town || data.address?.county || ''
            setParish('Other (outside Jamaica)')
            setOtherLocation(neighborhood + (city ? ', ' + city : ''))
            const dist = data.address?.suburb || data.address?.neighbourhood || ''
            if (dist) setDistrict(dist)
          }
        } catch (e) { console.error(e) }
        setLocationSet(true)
        setLocating(false)
      },
      () => { setLocationError('Could not get your location. Please select manually.'); setLocating(false) },
      { timeout: 10000 }
    )
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Please add a title.'); return }
    if (!parish) { setError('Please choose your parish.'); return }
    if (isOther && !otherLocation.trim()) { setError('Please tell us your city or area.'); return }
    if (!isAnonymous && !whatsapp.trim()) { setError('Please add your WhatsApp number.'); return }
    setSubmitting(true)
    setError('')
    const finalParish = isOther ? otherLocation.trim() : parish
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await createListing({
      user_id: user?.id || null,
      title: title.trim(),
      description: description.trim() || null,
      category: category as any,
      listing_type: listingType,
      price_jmd: price.trim() || null,
      is_free: !price.trim(),
      parish: finalParish,
      district: district.trim() || null,
      whatsapp: isAnonymous ? null : whatsapp.trim(),
      is_anonymous: isAnonymous,
      photo_url: photoUrl || null,
      lat: gpsLat,
      lng: gpsLng,
      status: 'approved',
    })
    setSubmitting(false)
    if (err) {
      setError('Something went wrong. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (!authChecked) return <div className="app-shell"><div className="loading">Loading...</div></div>

  if (success) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Posted successfully</p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6 }}>Your post is now live in your Naberhood.</p>
          <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 16 }}>Redirecting to home...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className={isAnonymous ? 'header-urgent' : 'header-sm'}>
        <Link href="/" className="back-btn">←</Link>
        <div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.42)' }}>{isAnonymous ? 'Identity protected' : 'Share with your Naberhood'}</p>
          <p style={{ color: '#fff', fontSize: 14 }}>{isAnonymous ? 'Anonymous post' : 'Post something'}</p>
        </div>
      </div>

      <div className="scroll-area" style={{ padding: 13 }}>
        <div className="bar-119">
          <div>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#fff' }}>Life-threatening? Call 119 now</p>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>Police · Fire · Ambulance — Jamaica</p>
          </div>
          <a href="tel:119" className="btn-119">Call 119</a>
        </div>

        {isAnonymous && (
          <div className="anon-box" style={{ marginBottom: 13 }}>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#4A1A80', marginBottom: 4 }}>Your identity is fully protected</p>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#6B2A9A', lineHeight: 1.65 }}>Your name and number never appear publicly. Messages are relayed privately.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: '#EDE7D9', borderRadius: 8, padding: 3, marginBottom: 13, border: '1px solid #D8D0BC' }}>
          {(['need', 'offer'] as const).map(t => (
            <button key={t} onClick={() => setListingType(t)} style={{ borderRadius: 6, padding: 9, border: 'none', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', background: listingType === t ? '#1B3A1D' : 'transparent', color: listingType === t ? '#fff' : '#5A5A50' }}>
              {t === 'need' ? 'I Need Help' : 'I Can Offer'}
            </button>
          ))}
        </div>

        <p className="eyebrow" style={{ marginBottom: 8 }}>What is it?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 13 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setCategory(cat.key)} style={{ background: category === cat.key ? '#EDE7D9' : cat.bg, border: category === cat.key ? '2px solid #1B3A1D' : '1.5px solid #D8D0BC', borderRadius: 9, padding: 10, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{cat.emoji}</span>
              <span style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: category === cat.key ? 700 : 600, color: category === cat.key ? '#1B3A1D' : '#5A5A50' }}>{cat.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 13 }}>
          <div>
            <label className="field-label">Title *</label>
            <input className="form-field" placeholder="e.g. Free ackee plates, 3 children need food..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Details</label>
            <textarea className="form-field-box" rows={3} placeholder="Time, quantity, pickup or delivery..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ background: locationSet ? '#E8F5EE' : '#EDE7D9', borderRadius: 9, padding: 11, border: locationSet ? '1px solid #2D5A2E' : '1px solid #D8D0BC' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                  {locationSet ? '📍 Location saved' : 'Use my location'}
                </p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 1 }}>
                  {locationSet ? (isOther ? otherLocation : parish) + (district ? ', ' + district : '') + ' · GPS saved' : 'Auto-fills parish, district and saves your GPS coordinates'}
                </p>
              </div>
              <button onClick={handleUseLocation} disabled={locating} style={{ background: locationSet ? '#2D5A2E' : '#1B3A1D', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 11px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', opacity: locating ? 0.7 : 1 }}>
                {locating ? 'Locating...' : locationSet ? 'Update' : 'Detect'}
              </button>
            </div>
            {locationSet && (
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', marginTop: 6 }}>
                GPS saved — users will see distance to your listing
              </p>
            )}
            {locationError && (
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#A84B2A', marginTop: 7, lineHeight: 1.5 }}>{locationError}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div>
              <label className="field-label">Price (JMD)</label>
              <input className="form-field" placeholder="e.g. Free, $500/hr, By quote..." value={price} onChange={e => setPrice(e.target.value)} type="text" />
            </div>
            <div>
              <label className="field-label">Parish</label>
              <select className="form-field" style={{ appearance: 'none' }} value={parish} onChange={e => setParish(e.target.value)}>
                {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {isOther && (
            <div>
              <label className="field-label">Your city, borough or area</label>
              <input className="form-field" placeholder="e.g. Bronx, NY or Brooklyn, NY" value={otherLocation} onChange={e => setOtherLocation(e.target.value)} />
            </div>
          )}
          <div>
            <label className="field-label">District / Community <span style={{ color: '#C8821A', fontWeight: 700 }}>— how neighbours find you</span></label>
            <input className="form-field" placeholder="e.g. Cross Roads, Maxfield Ave, Dunrobin..." value={district} onChange={e => setDistrict(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{isAnonymous ? 'Your WhatsApp (private — relay only, never shown)' : 'Your WhatsApp *'}</label>
            <input className="form-field" placeholder="+1 876 XXX XXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} type="tel" />
          </div>

          <div style={{ border: '1.5px dashed #D8D0BC', borderRadius: 10, padding: 13, background: '#EDE7D9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{uploading ? '⏳' : photoUrl ? '✅' : '📷'}</span>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                {uploading ? 'Uploading...' : photoUrl ? 'Photo added!' : 'Add a photo or flyer'}
              </p>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 4 }}>
                {photoUrl ? 'Tap to change' : 'Take a new photo or choose from your gallery'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <label htmlFor="camera-input" style={{ background: '#1B3A1D', color: '#fff', borderRadius: 7, padding: '7px 14px', fontSize: 11, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', display: 'inline-block' }}>Take photo</label>
                <label htmlFor="gallery-input" style={{ background: '#fff', color: '#1B3A1D', border: '1.5px solid #1B3A1D', borderRadius: 7, padding: '7px 14px', fontSize: 11, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', display: 'inline-block' }}>Choose file</label>
              </div>
              <input type="file" accept="image/*" capture="environment" id="camera-input" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              <input type="file" accept="image/*" id="gallery-input" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </div>
          </div>
        </div>

        <div style={{ background: isAnonymous ? '#EDE0F5' : '#EDE7D9', borderRadius: 9, padding: 11, marginBottom: 10, border: isAnonymous ? '1px solid #CEB8E8' : '1px solid #D8D0BC' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: isAnonymous ? '#4A1A80' : '#18180F' }}>
                {isAnonymous ? 'Posting anonymously' : 'Post anonymously instead?'}
              </p>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: isAnonymous ? '#6B2A9A' : '#5A5A50', marginTop: 1 }}>
                {isAnonymous ? 'Your name and number are fully hidden' : 'Hides your name and number from everyone'}
              </p>
            </div>
            <button onClick={() => setIsAnonymous(!isAnonymous)} style={{ background: isAnonymous ? '#6B2A9A' : '#1B3A1D', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {isAnonymous ? 'Switch to named' : 'Switch to anon'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 6, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Posting...' : 'Post to my Naberhood'}
        </button>

        <Link href="/boost" className="btn-gold" style={{ marginBottom: 14, textAlign: 'center' }}>
          Boost as featured listing
        </Link>
      </div>
    </div>
  )
}

export default function PostPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <PostContent />
    </Suspense>
  )
}
