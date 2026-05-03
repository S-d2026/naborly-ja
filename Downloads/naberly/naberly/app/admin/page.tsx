'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getAllListingsAdmin, adminUpdateListing, type Listing } from '@/lib/supabase'

type AdminFilter = 'all' | 'pending' | 'approved' | 'hidden' | 'archived' | 'rejected'
type AdminTab = 'listings' | 'boosts' | 'sponsors'

export default function AdminPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filter, setFilter] = useState<AdminFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, urgent: 0 })
  const [sponsors, setSponsors] = useState<any[]>([])
  const [boosts, setBoosts] = useState<any[]>([])
  const [newSponsor, setNewSponsor] = useState({ business_name: '', tagline: '', parish: '', whatsapp: '' })
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('listings')
  const [activatingBoost, setActivatingBoost] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      loadAll()
      loadSponsors()
      loadBoosts()
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
      })
    }
    setLoading(false)
  }

  async function loadSponsors() {
    const { data } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false })
    if (data) setSponsors(data)
  }

  async function loadBoosts() {
    const { data } = await supabase
      .from('boosts')
      .select('*, listings(title, parish, district)')
      .order('created_at', { ascending: false })
    if (data) setBoosts(data)
  }

  async function updateStatus(listingId: string, status: string) {
    await adminUpdateListing(listingId, { status: status as any })
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: status as any } : l))
  }

  async function markResolved(listing: Listing) {
    await adminUpdateListing(listing.id, { status: 'archived' })
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'archived' as any } : l))
  }

  async function activateBoost(boost: any) {
    setActivatingBoost(boost.id)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + boost.duration_days * 24 * 60 * 60 * 1000)

    // Activate boost record
    await supabase.from('boosts').update({
      payment_status: 'paid',
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq('id', boost.id)

    // Set listing as featured with expiry
    await supabase.from('listings').update({
      is_featured: true,
      featured_until: expiresAt.toISOString(),
    }).eq('id', boost.listing_id)

    setBoosts(prev => prev.map(b => b.id === boost.id ? {
      ...b,
      payment_status: 'paid',
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    } : b))
    setActivatingBoost(null)
  }

  async function rejectBoost(boostId: string) {
    await supabase.from('boosts').update({ payment_status: 'rejected' }).eq('id', boostId)
    setBoosts(prev => prev.map(b => b.id === boostId ? { ...b, payment_status: 'rejected' } : b))
  }

  async function toggleSponsor(id: string, isActive: boolean) {
    await supabase.from('sponsors').update({ is_active: !isActive }).eq('id', id)
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, is_active: !isActive } : s))
  }

  async function deleteSponsor(id: string) {
    await supabase.from('sponsors').delete().eq('id', id)
    setSponsors(prev => prev.filter(s => s.id !== id))
  }

  async function addSponsor() {
    if (!newSponsor.business_name || !newSponsor.tagline) return
    const { data } = await supabase.from('sponsors').insert([{ ...newSponsor, is_active: true }]).select().single()
    if (data) {
      setSponsors(prev => [data, ...prev])
      setNewSponsor({ business_name: '', tagline: '', parish: '', whatsapp: '' })
      setShowSponsorForm(false)
    }
  }

  const filtered = listings.filter(l => filter === 'all' || l.status === filter)
  const pendingBoosts = boosts.filter(b => b.payment_status === 'pending')

  const STATUS_CHIPS: Record<string, string> = {
    pending: 'chip-pending', approved: 'chip-approved',
    hidden: 'chip-pending', archived: 'chip-archived', rejected: 'chip-urgent',
  }

  return (
    <div className="app-shell">
      <div className="header-sm">
        <Link href="/account" className="back-btn">←</Link>
        <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>Admin dashboard</span>
        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 9, fontFamily: '-apple-system, sans-serif', padding: '3px 8px', borderRadius: 20 }}>Admin only</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#D8D0BC', borderBottom: '1px solid #D8D0BC', flexShrink: 0 }}>
        {[
          { label: 'Total listings', value: stats.total, color: '#1B3A1D' },
          { label: 'Awaiting approval', value: stats.pending, color: '#C8821A' },
          { label: 'Urgent active', value: stats.urgent, color: '#A84B2A' },
          { label: 'Boost requests', value: pendingBoosts.length, color: pendingBoosts.length > 0 ? '#C8821A' : '#5A5A50' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#F5F0E6', padding: '11px 13px' }}>
            <p style={{ fontSize: 18, color: stat.color }}>{stat.value}</p>
            <p className="eyebrow" style={{ marginTop: 1 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: '#EDE7D9', borderBottom: '1px solid #D8D0BC', flexShrink: 0 }}>
        {(['listings', 'boosts', 'sponsors'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '10px 0', border: 'none', background: activeTab === tab ? '#1B3A1D' : 'transparent', color: activeTab === tab ? '#fff' : '#5A5A50', fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'boosts' && pendingBoosts.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 8, background: '#C8821A', color: '#fff', fontSize: 8, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {pendingBoosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* LISTINGS TAB */}
      {activeTab === 'listings' && (
        <>
          <div style={{ padding: '6px 11px', display: 'flex', gap: 5, overflow: 'auto', borderBottom: '1px solid #D8D0BC', background: '#EDE7D9', flexShrink: 0 }}>
            {(['all','pending','approved','hidden','archived','rejected'] as AdminFilter[]).map(f => (
              <button key={f} className={'district-pill ' + (filter === f ? 'active' : '')} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ padding: '6px 13px 2px', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Archive = resolved. Auto-creates community impact story. All actions reversible.
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
                    <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', flex: 1, marginRight: 7 }}>{listing.title}</p>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {listing.is_featured && <span className="chip chip-featured">Featured</span>}
                      <span className={'chip ' + (STATUS_CHIPS[listing.status] || 'chip-neutral')}>{listing.status}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 7 }}>
                    {listing.is_anonymous ? 'Anonymous' : (listing.profiles as any)?.full_name || 'Unknown'} · {listing.parish}{listing.district ? ' · ' + listing.district : ''} · {listing.category} · {new Date(listing.created_at).toLocaleDateString('en-JM')}
                    {listing.featured_until ? ' · Featured until ' + new Date(listing.featured_until).toLocaleDateString('en-JM') : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {listing.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(listing.id, 'approved')} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                        {listing.category === 'urgent' && (
                          <button onClick={() => markResolved(listing)} style={{ background: '#D0E8BC', color: '#1B3A1D', border: '1px solid #2D5A2E', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Mark resolved</button>
                        )}
                        <button onClick={() => updateStatus(listing.id, 'hidden')} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Hide</button>
                        <button onClick={() => updateStatus(listing.id, 'rejected')} style={{ background: 'transparent', color: '#A84B2A', border: '1px solid #A84B2A', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Reject</button>
                      </>
                    )}
                    {listing.status === 'approved' && (
                      <>
                        <button onClick={() => markResolved(listing)} style={{ background: '#D0E8BC', color: '#1B3A1D', border: '1px solid #2D5A2E', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Mark resolved</button>
                        <button onClick={() => updateStatus(listing.id, 'hidden')} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Hide</button>
                      </>
                    )}
                    {(listing.status === 'hidden' || listing.status === 'archived' || listing.status === 'rejected') && (
                      <button onClick={() => updateStatus(listing.id, 'pending')} style={{ background: '#EDE7D9', color: '#1B3A1D', border: '1.5px solid #1B3A1D', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Restore to pending</button>
                    )}
                    <Link href={'/listing/' + listing.id} style={{ background: '#EDE7D9', color: '#5A5A50', border: '1px solid #D8D0BC', borderRadius: 5, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', textDecoration: 'none' }}>View</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* BOOSTS TAB */}
      {activeTab === 'boosts' && (
        <div className="scroll-area">
          <div style={{ padding: '9px 13px 3px', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Activate a boost once payment is confirmed. The listing becomes featured automatically for the paid duration.
            </p>
          </div>
          {boosts.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No boost requests yet.</p>
            </div>
          ) : (
            boosts.map(boost => (
              <div key={boost.id} style={{ padding: '12px 13px', borderBottom: '1px solid #D8D0BC', opacity: boost.payment_status === 'rejected' ? 0.5 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', flex: 1, marginRight: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {boost.listings?.title || 'Unknown listing'}
                  </p>
                  <span className={'chip ' + (boost.payment_status === 'paid' ? 'chip-approved' : boost.payment_status === 'rejected' ? 'chip-urgent' : 'chip-pending')}>
                    {boost.payment_status}
                  </span>
                </div>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 3 }}>
                  {boost.plan} · ${boost.price_jmd?.toLocaleString()} JMD · {boost.duration_days} days · {boost.payment_method}
                </p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: boost.payment_status === 'paid' ? 0 : 8 }}>
                  {boost.listings?.parish}{boost.listings?.district ? ' · ' + boost.listings.district : ''} · Requested {new Date(boost.created_at).toLocaleDateString('en-JM')}
                  {boost.payment_note ? ' · Note: ' + boost.payment_note : ''}
                </p>
                {boost.payment_status === 'paid' && (
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', marginTop: 3 }}>
                    Active · Expires {new Date(boost.expires_at).toLocaleDateString('en-JM')}
                  </p>
                )}
                {boost.payment_status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => activateBoost(boost)}
                      disabled={activatingBoost === boost.id}
                      style={{ background: '#C8821A', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', opacity: activatingBoost === boost.id ? 0.7 : 1 }}
                    >
                      {activatingBoost === boost.id ? 'Activating...' : 'Activate boost ⭐'}
                    </button>
                    <button
                      onClick={() => rejectBoost(boost.id)}
                      style={{ background: 'transparent', color: '#A84B2A', border: '1px solid #A84B2A', borderRadius: 6, padding: '7px 10px', fontSize: 11, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* SPONSORS TAB */}
      {activeTab === 'sponsors' && (
        <div className="scroll-area">
          <div style={{ padding: '11px 13px', borderBottom: '1px solid #D8D0BC' }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 9 }}>
              Active sponsors appear as a community sponsor card after listing 3 in home and browse feeds.
            </p>
            <button onClick={() => setShowSponsorForm(!showSponsorForm)} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
              {showSponsorForm ? 'Cancel' : '+ Add sponsor'}
            </button>
          </div>

          {showSponsorForm && (
            <div style={{ padding: 13, borderBottom: '1px solid #D8D0BC', background: '#F5F0E6' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="field-label">Business name *</label>
                  <input className="form-field" placeholder="e.g. Rose Hall Pharmacy" value={newSponsor.business_name} onChange={e => setNewSponsor(p => ({ ...p, business_name: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Tagline *</label>
                  <input className="form-field" placeholder="e.g. Serving Montego Bay — delivery available" value={newSponsor.tagline} onChange={e => setNewSponsor(p => ({ ...p, tagline: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Parish</label>
                  <input className="form-field" placeholder="e.g. St. James" value={newSponsor.parish} onChange={e => setNewSponsor(p => ({ ...p, parish: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">WhatsApp</label>
                  <input className="form-field" placeholder="+1 876 XXX XXXX" value={newSponsor.whatsapp} onChange={e => setNewSponsor(p => ({ ...p, whatsapp: e.target.value }))} />
                </div>
                <button onClick={addSponsor} style={{ background: '#C8821A', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                  Save sponsor
                </button>
              </div>
            </div>
          )}

          {sponsors.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No sponsors yet.</p>
            </div>
          ) : (
            sponsors.map(sponsor => (
              <div key={sponsor.id} style={{ padding: '11px 13px', borderBottom: '1px solid #D8D0BC', opacity: sponsor.is_active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{sponsor.business_name}</p>
                  <span className={'chip ' + (sponsor.is_active ? 'chip-approved' : 'chip-neutral')}>{sponsor.is_active ? 'Active' : 'Paused'}</span>
                </div>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 7 }}>
                  {sponsor.tagline}{sponsor.parish ? ' · ' + sponsor.parish : ''}
                </p>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => toggleSponsor(sponsor.id, sponsor.is_active)} style={{ background: sponsor.is_active ? '#EDE7D9' : '#1B3A1D', color: sponsor.is_active ? '#5A5A50' : '#fff', border: '1px solid #D8D0BC', borderRadius: 5, padding: '5px 9px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>
                    {sponsor.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => deleteSponsor(sponsor.id)} style={{ background: 'transparent', color: '#A84B2A', border: '1px solid #A84B2A', borderRadius: 5, padding: '5px 9px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
