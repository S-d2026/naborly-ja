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
    setSaving(true)
    const { error } = await vendorUpdateListing(listingId, {
      title: title.trim(),
      description: description.trim(),
      photo_url: photoUrl,
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
