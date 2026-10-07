'use client'
import { useState, useEffect, ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, getListingById, vendorUpdateListing, type Listing } from '@/lib/supabase'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Deal fields (optional). Dates are handled in Jamaica time (UTC-5, no DST)
  // and a deal can run for at most 60 days, so old deals can't linger.
  const [isDeal, setIsDeal] = useState(false)
  const [dealText, setDealText] = useState('')
  const [dealCode, setDealCode] = useState('')
  const [dealEnd, setDealEnd] = useState('')
  const jmDate = (ms: number) => new Date(ms - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const todayJm = jmDate(Date.now())
  const maxJm = jmDate(Date.now() + 60 * 24 * 60 * 60 * 1000)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await getListingById(listingId)
      if (error || !data || (data as Listing).user_id !== user.id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const listing = data as Listing
      setTitle(listing.title)
      setDescription(listing.description || '')
      setPhotoUrl(listing.photo_url)
      setIsDeal(!!listing.is_deal)
      setDealText(listing.deal_text || '')
      setDealCode(listing.deal_code || '')
      setDealEnd(listing.deal_ends_at ? jmDate(new Date(listing.deal_ends_at).getTime()) : '')
      setLoading(false)
    }
    load()
  }, [listingId, router])

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const fileExt = file.name.split('.').pop()
    const filePath = user.id + '/' + listingId + '-' + Date.now() + '.' + fileExt
    const { error: uploadError } = await supabase.storage.from('Listings').upload(filePath, file)
    if (uploadError) {
      alert('Could not upload photo. Please try again.')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('Listings').getPublicUrl(filePath)
    setPhotoUrl(urlData.publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    if (!title.trim()) {
      alert('Please enter a title.')
      return
    }
    if (isDeal) {
      if (!dealText.trim()) { alert('Please describe your deal, for example "10% off any order".'); return }
      if (!dealEnd) { alert('Please choose the date your deal ends.'); return }
      if (dealEnd < todayJm) { alert('The deal end date has already passed. Please choose today or a later date.'); return }
      if (dealEnd > maxJm) { alert('A deal can run for at most 60 days. Please choose an earlier end date.'); return }
    }
    setSaving(true)
    const { error } = await vendorUpdateListing(listingId, {
      title: title.trim(),
      description: description.trim(),
      photo_url: photoUrl,
      is_deal: isDeal,
      deal_text: isDeal ? dealText.trim() : null,
      deal_code: isDeal && dealCode.trim() ? dealCode.trim() : null,
      deal_ends_at: isDeal ? dealEnd + 'T23:59:59-05:00' : null,
    })
    setSaving(false)
    if (error) {
      alert('Could not save changes. Please try again.')
      return
    }
    router.push('/my-listings')
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="header-sm">
          <Link href="/my-listings" className="back-btn">←</Link>
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>Edit listing</span>
        </div>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="app-shell">
        <div className="header-sm">
          <Link href="/my-listings" className="back-btn">←</Link>
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>Edit listing</span>
        </div>
        <div className="empty-state">
          <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F' }}>
            This listing couldn't be found, or it isn't yours to edit.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/my-listings" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>Edit listing</span>
      </div>

      <div className="scroll-area">
        <div style={{ padding: 13 }}>
          <label style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', display: 'block', marginBottom: 5 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 11px',
              borderRadius: 8,
              border: '1px solid #D8D0BC',
              fontSize: 13,
              fontFamily: '-apple-system, sans-serif',
              color: '#18180F',
              marginBottom: 14,
              boxSizing: 'border-box',
            }}
          />

          <label style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', display: 'block', marginBottom: 5 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '9px 11px',
              borderRadius: 8,
              border: '1px solid #D8D0BC',
              fontSize: 13,
              fontFamily: '-apple-system, sans-serif',
              color: '#18180F',
              marginBottom: 14,
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />

          <label style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', display: 'block', marginBottom: 7 }}>
            Photo
          </label>

          {photoUrl && (
            <img
              src={photoUrl}
              alt="Listing photo"
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 9, border: '1px solid #D8D0BC' }}
            />
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <label style={{
              flex: 1, textAlign: 'center', background: '#EDE7D9', color: '#18180F', border: '1px solid #D8D0BC',
              borderRadius: 8, padding: '9px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer',
            }}>
              {uploading ? 'Uploading...' : (photoUrl ? 'Retake photo' : 'Take photo')}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            <label style={{
              flex: 1, textAlign: 'center', background: '#EDE7D9', color: '#18180F', border: '1px solid #D8D0BC',
              borderRadius: 8, padding: '9px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer',
            }}>
              {uploading ? 'Uploading...' : (photoUrl ? 'Choose different file' : 'Choose file')}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          <div style={{ background: '#FBF1D6', border: '1px solid #E8C877', borderRadius: 10, padding: 13, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', cursor: 'pointer' }}>
              <input type="checkbox" checked={isDeal} onChange={e => setIsDeal(e.target.checked)} />
              🏷️ Run a deal on this listing
            </label>
            <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', margin: '6px 0 0', lineHeight: 1.5 }}>
              Shoppers can find it under the Deals filter. It switches off by itself on the end date.
            </p>
            {isDeal && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', display: 'block', marginBottom: 5 }}>
                  What is the deal?
                </label>
                <input
                  type="text"
                  value={dealText}
                  maxLength={60}
                  placeholder="e.g. 10% off any order"
                  onChange={e => setDealText(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #D8D0BC', fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 12, boxSizing: 'border-box' }}
                />
                <label style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', display: 'block', marginBottom: 5 }}>
                  Code word (optional)
                </label>
                <input
                  type="text"
                  value={dealCode}
                  maxLength={20}
                  placeholder="e.g. NABERLY10"
                  onChange={e => setDealCode(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #D8D0BC', fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4, boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#8A8272', margin: '0 0 12px' }}>
                  Customers say this word when they contact or visit you, so you know they found you here.
                </p>
                <label style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', display: 'block', marginBottom: 5 }}>
                  Deal ends on (up to 60 days)
                </label>
                <input
                  type="date"
                  value={dealEnd}
                  min={todayJm}
                  max={maxJm}
                  onChange={e => setDealEnd(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #D8D0BC', fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#8A8272', margin: '10px 0 0', lineHeight: 1.5 }}>
                  You are responsible for honouring the deal you post. NaberlyJA only displays it.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="btn-primary"
            style={{ width: '100%', opacity: saving || uploading ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
