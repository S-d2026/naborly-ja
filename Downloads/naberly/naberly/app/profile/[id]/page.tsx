'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (!p) { setLoading(false); return }
      setProfile(p)

      const { data: l } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3)
      setListings(l || [])
      setLoading(false)
    }
    load()
  }, [id])

  function handleShare() {
    const url = `${window.location.origin}/profile/${id}`
    if (navigator.share) {
      navigator.share({ title: profile?.full_name || 'Naberly JA Profile', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(`Hi, I found your profile on NaberlyJA — naberlyja.com/profile/${id}`)
    window.open(`https://wa.me/${profile.whatsapp?.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  if (loading) return (
    <div className="app-shell">
      <div className="scroll-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
        <div className="loading" />
      </div>
    </div>
  )

  if (!profile) return (
    <div className="app-shell">
      <div className="scroll-area" style={{ padding: '40px 17px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Profile not found.</p>
        <Link href="/" style={{ color: '#1B3A1D', fontSize: 13, fontFamily: '-apple-system, sans-serif' }}>Go home</Link>
      </div>
    </div>
  )

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const nameParts = (profile?.full_name || '').trim().split(' ')
  const displayName = nameParts.length > 1 ? nameParts[0] + ' ' + nameParts[nameParts.length - 1][0] + '.' : profile?.full_name || ''
  const serviceTags = profile.services ? profile.services.split(',').map((s: string) => s.trim()).filter(Boolean) : []

  return (
    <div className="app-shell">
      {/* Header */}
      <div style={{ background: '#1B3A1D', padding: '17px 15px 13px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <p style={{ color: '#fff', fontSize: 18, flex: 1 }}>Profile</p>
        <button onClick={handleShare} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Share</button>
      </div>

      <div className="scroll-area" style={{ padding: '0 0 80px' }}>

        {/* Identity card */}
        <div style={{ background: '#1B3A1D', padding: '20px 17px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#2D5A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#A8D5A2', flexShrink: 0, fontFamily: '-apple-system, sans-serif' }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: 18, fontFamily: '-apple-system, sans-serif', fontWeight: 600, margin: 0 }}>{displayName}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: '-apple-system, sans-serif', margin: '3px 0 0' }}>
                {profile.parish}{profile.district ? `, ${profile.district}` : ''}
                {profile.is_verified ? ' · ✓ Verified' : ''}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 17px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Work & Services */}
          {serviceTags.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E4DC', padding: '14px 15px' }}>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Work & Services</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {serviceTags.map((tag: string, i: number) => (
                  <span key={i} style={{ fontSize: 12, background: '#D0E8BC', color: '#1B3A1D', borderRadius: 20, padding: '4px 11px', fontFamily: '-apple-system, sans-serif', fontWeight: 500 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {profile.whatsapp && (
            <button className="btn-wa" onClick={handleWhatsApp} style={{ width: '100%' }}>
              WhatsApp {profile.full_name?.split(' ')[0]}
            </button>
          )}

          {/* Share profile */}
          <button className="btn-ghost" onClick={handleShare} style={{ width: '100%' }}>
            Share this profile
          </button>

          {/* Their listings */}
          {listings.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E4DC', padding: '14px 15px' }}>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Their listings</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {listings.map((l: any) => (
                  <Link key={l.id} href={`/listing/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '10px 12px', background: '#FAFAF8', borderRadius: 8, border: '1px solid #E8E4DC' }}>
                      <p style={{ fontSize: 14, fontFamily: '-apple-system, sans-serif', fontWeight: 600, color: '#18180F', margin: '0 0 2px' }}>{l.title}</p>
                      <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', margin: 0 }}>{l.parish}{l.district ? ` · ${l.district}` : ''} {l.price_jmd ? `· ${l.price_jmd}` : l.is_free ? '· Free' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Community stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E4DC', padding: '12px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#1B3A1D', margin: 0, fontFamily: '-apple-system, sans-serif' }}>{profile.helper_count || 0}</p>
              <p style={{ fontSize: 11, color: '#5A5A50', margin: '2px 0 0', fontFamily: '-apple-system, sans-serif' }}>People helped</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E4DC', padding: '12px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#1B3A1D', margin: 0, fontFamily: '-apple-system, sans-serif' }}>{profile.response_count || 0}</p>
              <p style={{ fontSize: 11, color: '#5A5A50', margin: '2px 0 0', fontFamily: '-apple-system, sans-serif' }}>Responses</p>
            </div>
          </div>

          {/* Member since */}
          <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', textAlign: 'center', margin: 0 }}>
            Member since {new Date(profile.created_at).toLocaleDateString('en-JM', { month: 'long', year: 'numeric' })}
          </p>

        </div>
      </div>
    </div>
  )
}
