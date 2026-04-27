'use client'
// app/my-listings/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getUserListings, adminUpdateListing, type Listing } from '@/lib/supabase'

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await getUserListings(user.id)
      setListings((data as Listing[]) || [])
      setLoading(false)
    })
  }, [router])

  const STATUS_DOT: Record<string, string> = {
    approved: '#4CAF50',
    pending: '#C8821A',
    archived: '#D8D0BC',
    hidden: '#D8D0BC',
    rejected: '#A84B2A',
  }

  const STATUS_LABEL: Record<string, string> = {
    approved: 'Live',
    pending: 'Pending review',
    archived: 'Archived',
    hidden: 'Hidden',
    rejected: 'Rejected',
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/account" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>My listings</span>
        <Link href="/post" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '5px 9px', color: '#fff', fontSize: 10, fontFamily: '-apple-system, sans-serif', textDecoration: 'none' }}>+ New</Link>
      </div>

      <div className="scroll-area">
        <div style={{ padding: '9px 13px 3px' }}>
          <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Manage, renew, share and update your posts</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
            <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#18180F', marginBottom: 4 }}>No listings yet</p>
            <Link href="/post" style={{ color: '#1B3A1D', fontFamily: '-apple-system, sans-serif', fontSize: 13 }}>Post your first listing →</Link>
          </div>
        ) : (
          listings.map(listing => (
            <div key={listing.id} className="account-row" style={{ alignItems: 'start', gap: 9, padding: '12px 13px', opacity: listing.status === 'archived' || listing.status === 'rejected' ? 0.55 : 1 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[listing.status] || '#D8D0BC', marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  {STATUS_LABEL[listing.status]} · {listing.district || listing.parish}
                  {listing.status === 'approved' ? ` · ${listing.response_count || 0} responses` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {listing.status === 'approved' && (
                  <Link href="/boost" style={{ background: '#C8821A', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 7px', fontSize: 9, fontFamily: '-apple-system, sans-serif', textDecoration: 'none' }}>Boost</Link>
                )}
                {listing.status === 'archived' && (
                  <button
                    onClick={async () => {
                      await adminUpdateListing(listing.id, { status: 'pending' })
                      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'pending' } : l))
                    }}
                    style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 8px', fontSize: 9, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}
                  >
                    Renew
                  </button>
                )}
                <Link href={`/listing/${listing.id}`} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '4px 7px', fontSize: 9, fontFamily: '-apple-system, sans-serif', textDecoration: 'none' }}>View</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
