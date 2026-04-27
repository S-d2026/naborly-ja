'use client'
// app/admin/page.tsx — Admin dashboard

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getAllListingsAdmin, adminUpdateListing, type Listing } from '@/lib/supabase'

type AdminFilter = 'all' | 'pending' | 'approved' | 'hidden' | 'archived' | 'rejected'

export default function AdminPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filter, setFilter] = useState<AdminFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, urgent: 0, members: 0 })

  useEffect(() => {
    // Auth check — must be admin
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      loadAll()
    })
  }, [router])

  async function loadAll() {
    setLoading(true)
    const { data } = await getAllListingsAdmin()
    if (data) {
      setListings(data as Listing[])
      setStats({
        total: data.length,
        pending: data.filter((l: any) => l.status === 'pending').length,
        urgent: data.filter((l: any) => l.category === 'urgent' && l.status === 'approved').length,
        members: 0, // would need separate query
      })
    }
    setLoading(false)
  }

  async function updateStatus(listingId: string, status: string) {
    await adminUpdateListing(listingId, { status: status as any })
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: status as any } : l))
    setStats(prev => ({
      ...prev,
      pending: prev.pending + (status === 'pending' ? 1 : -1),
    }))
  }

  async function markResolved(listingId: string) {
    await adminUpdateListing(listingId, { status: 'archived' })
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'archived' } : l))
  }

  const filtered = listings.filter(l => filter === 'all' || l.status === filter)

  const STATUS_CHIPS: Record<string, string> = {
    pending: 'chip-pending', approved: 'chip-approved', hidden: 'chip-pending',
    archived: 'chip-archived', rejected: 'chip-urgent',
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/account" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>Admin dashboard</span>
        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', padding: '3px 8px', borderRadius: 20 }}>Admin only</span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#D8D0BC', borderBottom: '1px solid #D8D0BC', flexShrink: 0 }}>
        {[
          { label: 'Total listings', value: stats.total, color: '#1B3A1D' },
          { label: 'Awaiting approval', value: stats.pending, color: '#C8821A' },
          { label: 'Urgent — active', value: stats.urgent, color: '#A84B2A' },
          { label: 'Members', value: stats.members, color: '#1B3A1D' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#F5F0E6', padding: '11px 13px' }}>
            <p style={{ fontSize: 18, color: stat.color }}>{stat.value}</p>
            <p className="eyebrow" style={{ marginTop: 1 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="district-row">
        {(['all','pending','approved','hidden','archived','rejected'] as AdminFilter[]).map(f => (
          <button key={f} className={`district-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '6px 13px 2px', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
          Archive = resolved/done. Hidden = temp invisible. All actions reversible.
        </p>
      </div>

      <div className="scroll-area">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No listings in this status.</p>
          </div>
        ) : (
          filtered.map(listing => (
            <div key={listing.id} style={{ padding: '11px 13px', borderBottom: '1px solid #D8D0BC', opacity: listing.status === 'archived' || listing.status === 'rejected' ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', flex: 1, marginRight: 7 }}>
                  {listing.title}
                </p>
                <span className={`chip ${STATUS_CHIPS[listing.status] || 'chip-neutral'}`}>
                  {listing.status}
                </span>
              </div>
              <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 7 }}>
                {listing.is_anonymous ? 'Anonymous' : (listing.profiles as any)?.full_name || 'Unknown'} · {listing.parish}{listing.district ? ` · ${listing.district}` : ''} · {listing.category}
                {' · '}{new Date(listing.created_at).toLocaleDateString('en-JM')}
              </p>

              {/* Action buttons based on status */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {listing.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(listing.id, 'approved')} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                    {listing.category === 'urgent' && (
                      <button onClick={() => markResolved(listing.id)} style={{ background: '#D0E8BC', color: '#1B3A1D', border: '1px solid #2D5A2E', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Mark resolved ✓</button>
                    )}
                    <button onClick={() => updateStatus(listing.id, 'archived')} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Archive</button>
                    <button onClick={() => updateStatus(listing.id, 'hidden')} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Hide</button>
                    <button onClick={() => updateStatus(listing.id, 'rejected')} style={{ background: 'transparent', color: '#A84B2A', border: '1px solid #A84B2A', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Reject</button>
                  </>
                )}
                {listing.status === 'approved' && (
                  <>
                    <button onClick={() => updateStatus(listing.id, 'hidden')} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Hide</button>
                    <button onClick={() => updateStatus(listing.id, 'archived')} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Archive</button>
                  </>
                )}
                {(listing.status === 'hidden' || listing.status === 'archived' || listing.status === 'rejected') && (
                  <button onClick={() => updateStatus(listing.id, 'pending')} style={{ background: '#EDE7D9', color: '#1B3A1D', border: '1.5px solid #1B3A1D', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                    Restore to pending ↑
                  </button>
                )}
                <Link href={`/listing/${listing.id}`} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', textDecoration: 'none' }}>View</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
