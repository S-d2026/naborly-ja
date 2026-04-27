'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, createListing } from '@/lib/supabase'

const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍲', bg: '#D0E8BC' },
  { key: 'urgent', label: 'Urgent', emoji: '⚠️', bg: '#F0CABA' },
  { key: 'work', label: 'Work', emoji: '💼', bg: '#BCD0E8' },
  { key: 'ride', label: 'Ride', emoji: '🚗', bg: '#E0D8F0' },
  { key: 'service', label: 'Service', emoji: '🛠️', bg: '#F0E8BC' },
  { key: 'buy-sell', label: 'Buy/Sell', emoji: '🛍️', bg: '#EDE7D9' },
]

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
  const [district, setDistrict] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
        const { data: urlData } = supabase.storage
          .from('Listings')
          .getPublicUrl(fileName)
        setPhotoUrl(urlData.publicUrl)
      }
    } catch (err) {
      console.error(err)
    }
    setUploading(false)
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Please add a title.'); return }
    if (!parish) { setError('Please choose your parish.'); return }
    if (!isAnonymous && !whatsapp.trim()) { setError('Please add your WhatsApp number.'); return }
    setSubmitting(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await createListing({
      user_id: user?.id || null,
      title: title.trim(),
      description: description.trim() || null,
      category: category as any,
      listing_type: listingType,
      price_jmd: price ? parseInt(price) : null,
      is_free: !price,
      parish,
      district: district.trim() || null,
      whatsapp: isAnonymous ? null : whatsapp.trim(),
      is_anonymous: isAnonymous,
      photo_url: photoUrl || null,
      status: 'pending',
    })
    setSubmitting(false)
    if (err) {
      setError('Something went wrong. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (success) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Posted successfully</p>
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', lineHeight: 1.6 }}>Your post is under review. We will WhatsApp you when it goes live.</p>
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
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#4A1A80', marginBottom: 4 }}>🔒 Your identity is fully protected</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div>
              <label className="field-label">Price (JMD)</label>
              <input className="form-field" placeholder="Free if blank" value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" />
            </div>
            <div>
              <label className="field-label">Parish</label>
              <select className="form-field" style={{ appearance: 'none' }} value={parish} onChange={e => setParish(e.target.value)}>
                {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">District / Community <span style={{ color: '#C8821A', fontWeight: 700 }}>— how neighbors find you</span></label>
            <input className="form-field" placeholder="e.g. Cross Roads, Maxfield Ave, Dunrobin..." value={district} onChange={e => setDistrict(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{isAnonymous ? 'Your WhatsApp (private — relay only, never shown)' : 'Your WhatsApp *'}</label>
            <input className="form-field" placeholder="+1 876 XXX XXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} type="tel" />
          </div>

          {/* Photo upload — camera and gallery options */}
          <div style={{ border: '1.5px dashed #D8D0BC', borderRadius: 10, padding: 13, background: '#EDE7D9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{uploading ? '⏳' : photoUrl ? '✅' : '📷'}</span>
              <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>
                {uploading ? 'Uploading...' : photoUrl ? 'Photo added!' : 'Add a photo or flyer'}
              </p>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 4 }}>
                {photoUrl ? 'Tap a button to change' : 'Take a new photo or choose from your gallery'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <label htmlFor="camera-input" style={{ background: '#1B3A1D', color: '#fff', borderRadius: 7, padding: '7px 14px', fontSize: 11, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', display: 'inline-block' }}>
                  📷 Take photo
                </label>
                <label htmlFor="gallery-input" style={{ background: '#fff', color: '#1B3A1D', border: '1.5px solid #1B3A1D', borderRadius: 7, padding: '7px 14px', fontSize: 11, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', display: 'inline-block' }}>
                  🖼️ Choose file
                </label>
              </div>
              <input type="file" accept="image/*" capture="environment" id="camera-input" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              <input type="file" accept="image/*" id="gallery-input" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </div>
          </div>
        </div>

        <div style={{ background: '#EDE7D9', borderRadius: 9, padding: 11, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #D8D0BC' }}>
          <div>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{isAnonymous ? 'Posting anonymously' : 'Post anonymously instead'}</p>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 1 }}>{isAnonymous ? 'Your name and number are hidden' : 'Hides your name and number'}</p>
          </div>
          <button onClick={() => setIsAnonymous(!isAnonymous)} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>
            {isAnonymous ? 'Switch to named' : 'Switch'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#F0CABA', borderRadius: 8, padding: '9px 11px', marginBottom: 10, borderLeft: '3px solid #A84B2A' }}>
            <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#6B1E10' }}>{error}</p>
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 6, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Posting...' : 'Post to my Naberhood'}
        </button>

        <div className="info-box" style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', lineHeight: 1.6 }}>Posts go live after a quick review. We will WhatsApp you when it is live.</p>
        </div>

        <Link href="/boost" className="btn-gold" style={{ marginBottom: 14, textAlign: 'center' }}>
          Boost as featured listing ↗
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
