'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getUserProfile, getUserListings, type Profile, type Listing } from '@/lib/supabase'

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [directoryOn, setDirectoryOn] = useState(false)
  const [savingDirectory, setSavingDirectory] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: prof } = await getUserProfile(user.id)
      const { data: lsts } = await getUserListings(user.id)
      setProfile(prof as Profile)
      setDirectoryOn((prof as Profile)?.show_in_directory || false)
      setListings((lsts as Listing[]) || [])
      setLoading(false)
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function toggleDirectory(val: boolean) {
    if (!profile) return
    setDirectoryOn(val)
    setSavingDirectory(true)
    await supabase.from('profiles').update({ show_in_directory: val }).eq('id', profile.id)
    setSavingDirectory(false)
  }

  const nameParts = profile?.full_name?.trim().split(' ') || []
  const displayName = nameParts.length > 1
    ? nameParts[0] + ' ' + nameParts[nameParts.length - 1][0] + '.'
    : profile?.full_name || 'Naberly member'
  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const liveCount = listings.filter(l => l.status === 'approved').length
  const totalResponses = listings.reduce((sum, l) => sum + (l.response_count || 0), 0)

  if (loading) return <div className="app-shell"><div className="loading">Loading...</div></div>

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14 }}>My profile</span>
      </div>
      <div className="scroll-area">

        {/* Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 13px 13px', borderBottom: '1px solid #D8D0BC' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EDE7D9', border: '1.5px solid #D8D0BC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#1B3A1D', marginBottom: 8 }}>
            {initials}
          </div>
          <p style={{ fontSize: 15 }}>{displayName}</p>
          <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginTop: 2 }}>
            {profile?.parish || 'Jamaica'}
          </p>
          <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
            {profile?.is_verified && <span className="chip chip-approved">Verified</span>}
            {(profile?.helper_count ?? 0) > 0 && <span className="chip chip-featured">Community helper</span>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #D8D0BC' }}>
          {[{ label: 'Listings', value: liveCount }, { label: 'Responses', value: totalResponses }, { label: 'Helped', value: profile?.helper_count || 0 }].map(stat => (
            <div key={stat.label} style={{ padding: 11, textAlign: 'center', borderRight: stat.label !== 'Helped' ? '1px solid #D8D0BC' : 'none' }}>
              <p style={{ fontSize: 17, color: '#1B3A1D' }}>{stat.value}</p>
              <p className="eyebrow" style={{ marginTop: 1 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Directory toggle */}
        <div style={{ padding: '13px 14px', borderBottom: '1px solid #D8D0BC', background: directoryOn ? '#F0F8EA' : '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', margin: '0 0 2px' }}>Show me in People directory</p>
              <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', margin: 0, lineHeight: 1.5 }}>
                {directoryOn ? 'Your skills are visible to the community' : 'Off — only you can see your profile'}
              </p>
              {profile?.services ? (
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#1B3A1D', marginTop: 4 }}>{profile.services}</p>
              ) : (
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#C8821A', marginTop: 4 }}>Add your skills at signup to appear in searches</p>
              )}
            </div>
            <button
              onClick={() => toggleDirectory(!directoryOn)}
              disabled={savingDirectory}
              style={{
                width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: directoryOn ? '#1B3A1D' : '#D8D0BC',
                position: 'relative', transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: directoryOn ? 21 : 3,
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
        </div>

        {/* Menu rows */}
        <div>
          <Link href="/my-listings" className="account-row"><span style={{ fontSize: 14 }}>📋</span><span style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F' }}>My listings</span><span style={{ marginLeft: 'auto', color: '#5A5A50' }}>›</span></Link>
          <Link href="/boost" className="account-row"><span style={{ fontSize: 14 }}>⭐</span><span style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F' }}>Boost a listing</span><span style={{ marginLeft: 'auto', color: '#5A5A50' }}>›</span></Link>
          <Link href="/post?anonymous=true" className="account-row"><span style={{ fontSize: 14 }}>🔒</span><span style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#18180F' }}>Post anonymously</span><span style={{ marginLeft: 'auto', color: '#5A5A50' }}>›</span></Link>
        </div>

        {profile?.is_admin && (
          <div style={{ background: '#F5EDD8', borderTop: '1px solid #D8D0BC' }}>
            <Link href="/admin" className="account-row">
              <span style={{ fontSize: 14 }}>🛡️</span>
              <div><p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#633806' }}>Admin dashboard</p><p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#854F0B', marginTop: 1 }}>Approve posts · Manage all parishes</p></div>
              <span style={{ marginLeft: 'auto', color: '#C8821A' }}>›</span>
            </Link>
          </div>
        )}

        <div style={{ borderTop: '1px solid #D8D0BC' }}>
          <button onClick={handleLogout} className="account-row" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <span style={{ fontSize: 14 }}>🔓</span>
            <span style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', color: '#A32D2D' }}>Log out</span>
          </button>
        </div>
      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9.5L11 3L19 9.5V19H14V14H8V19H3V9.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Home</span></Link>
        <Link href="/browse" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="M15 15L19 19" strokeLinecap="round"/></svg><span className="nav-label">Browse</span></Link>
        <div className="fab-wrapper"><Link href="/post" className="fab"><svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#fff" strokeWidth="2"><path d="M8.5 2V15M2 8.5H15" strokeLinecap="round"/></svg></Link><span className="nav-label" style={{ color: '#5A5A50' }}>Post</span></div>
        <Link href="/favorites" className="nav-item"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 18.5C11 18.5 3 13.5 3 7.5C3 5.3 4.8 3.5 7 3.5C8.8 3.5 10.3 4.5 11 5C11.7 4.5 13.2 3.5 15 3.5C17.2 3.5 19 5.3 19 7.5C19 13.5 11 18.5 11 18.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="nav-label">Saved</span></Link>
        <Link href="/account" className="nav-item active"><svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="8" r="3.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round"/></svg><span className="nav-label">Me</span></Link>
      </nav>
    </div>
  )
}
