'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  supabase, getAllListingsAdmin, adminUpdateListing, type Listing,
  getAmbassadorSummaries, getAmbassadorKPIs, getAmbassadorReferrals,
  markReferralQualified, markMilestonePaid,
  type AmbassadorSummary, type AmbassadorKPIs, type AmbassadorReferral,
} from '@/lib/supabase'

type AdminFilter = 'all' | 'pending' | 'approved' | 'hidden' | 'archived' | 'rejected'
type AdminTab = 'listings' | 'boosts' | 'sponsors' | 'users' | 'ambassadors' | 'activity'

const SPONSOR_PACKAGES = [
  { key: 'weekly', label: 'Weekly Spot', price: 2500, days: 7 },
  { key: 'monthly', label: 'Monthly Spot', price: 8000, days: 30 },
  { key: 'featured', label: 'Featured + Sponsor', price: 15000, days: 30 },
]

const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine','Other (outside Jamaica)']

function AddListingForUser({ users, onClose, onSaved }: { users: any[], onClose: () => void, onSaved: () => void }) {
  const [selectedUser, setSelectedUser] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('food')
  const [listingType, setListingType] = useState('offer')
  const [parish, setParish] = useState('Kingston')
  const [otherLocation, setOtherLocation] = useState('')
  const [district, setDistrict] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isOther = parish === 'Other (outside Jamaica)'

  async function handleSave() {
    if (!selectedUser) { setError('Please select a user.'); return }
    if (!title.trim()) { setError('Please add a title.'); return }
    if (isOther && !otherLocation.trim()) { setError('Please enter the city or area.'); return }
    setSaving(true)
    const user = users.find(u => u.id === selectedUser)
    const finalParish = isOther ? otherLocation.trim() : parish
    const { error: err } = await supabase.from('listings').insert([{
      user_id: selectedUser,
      title: title.trim(),
      description: description.trim() || null,
      category,
      listing_type: listingType,
      price_jmd: price.trim() || null,
      is_free: !price.trim(),
      parish: finalParish,
      district: district.trim() || null,
      whatsapp: whatsapp.trim() || user?.whatsapp || null,
      is_anonymous: false,
      status: 'approved',
      is_featured: false,
    }])
    setSaving(false)
    if (err) { setError('Something went wrong: ' + err.message); return }
    onSaved()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: '#F5F0E6', borderRadius: '16px 16px 0 0', padding: 16, width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>Post listing for a user</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#5A5A50' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div>
            <label className="field-label">Select user *</label>
            <select className="form-field" style={{ appearance: 'none' }} value={selectedUser} onChange={e => {
              setSelectedUser(e.target.value)
              const u = users.find(u => u.id === e.target.value)
              if (u?.parish) {
                if (PARISHES.includes(u.parish)) {
                  setParish(u.parish)
                } else {
                  setParish('Other (outside Jamaica)')
                  setOtherLocation(u.parish)
                }
              }
              if (u?.whatsapp) setWhatsapp(u.whatsapp)
            }}>
              <option value="">Choose a user...</option>
              {users.filter(u => !u.is_admin).map(u => (
                <option key={u.id} value={u.id}>{u.full_name || 'Unnamed'} — {u.parish || 'No parish'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Title *</label>
            <input className="form-field" placeholder="Listing title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea className="form-field-box" rows={2} placeholder="Details..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="field-label">Category</label>
              <select className="form-field" style={{ appearance: 'none' }} value={category} onChange={e => setCategory(e.target.value)}>
                {['food','work','ride','service','buy-sell','urgent'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Type</label>
              <select className="form-field" style={{ appearance: 'none' }} value={listingType} onChange={e => setListingType(e.target.value)}>
                <option value="offer">I Can Offer</option>
                <option value="need">I Need Help</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="field-label">Price (JMD)</label>
              <input className="form-field" placeholder="Free if blank" value={price} onChange={e => setPrice(e.target.value)} />
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
              <label className="field-label">City, borough or area</label>
              <input className="form-field" placeholder="e.g. Bronx, NY" value={otherLocation} onChange={e => setOtherLocation(e.target.value)} />
            </div>
          )}
          <div>
            <label className="field-label">District</label>
            <input className="form-field" placeholder="e.g. Cross Roads" value={district} onChange={e => setDistrict(e.target.value)} />
          </div>
          <div>
            <label className="field-label">WhatsApp (auto-fills from user profile)</label>
            <input className="form-field" placeholder="+1 876 XXX XXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>
          {error && <p style={{ fontSize: 11, color: '#A84B2A', fontFamily: '-apple-system, sans-serif' }}>{error}</p>}
          <button onClick={handleSave} disabled={saving} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Post listing for this user'}
          </button>
        </div>
      </div>
    </div>
  )
}

const MILESTONES: { value: 10 | 25 | 50 | 100; amount: string }[] = [
  { value: 10, amount: 'J$1,000' },
  { value: 25, amount: 'J$5,000' },
  { value: 50, amount: 'J$7,500' },
  { value: 100, amount: 'J$15,000' },
]

function AmbassadorReferralsPanel({ ambassador, onMilestoneUpdated }: { ambassador: AmbassadorSummary, onMilestoneUpdated: () => void }) {
  const [referrals, setReferrals] = useState<AmbassadorReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingMilestone, setUpdatingMilestone] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [ambassador.id])

  async function load() {
    setLoading(true)
    const { data } = await getAmbassadorReferrals(ambassador.id)
    if (data) setReferrals(data as AmbassadorReferral[])
    setLoading(false)
  }

  async function handleMarkQualified(referralId: string) {
    setUpdatingId(referralId)
    await markReferralQualified(referralId)
    await load()
    onMilestoneUpdated()
    setUpdatingId(null)
  }

  async function handleMarkMilestonePaid(milestone: 10 | 25 | 50 | 100) {
    setUpdatingMilestone(milestone)
    await markMilestonePaid(ambassador.id, milestone)
    onMilestoneUpdated()
    setUpdatingMilestone(null)
  }

  const milestonePaidField = (m: number) => {
    if (m === 10) return ambassador.milestone_10_paid
    if (m === 25) return ambassador.milestone_25_paid
    if (m === 50) return ambassador.milestone_50_paid
    return ambassador.milestone_100_paid
  }

  return (
    <div style={{ background: '#EDE7D9', padding: 11, borderTop: '1px solid #D8D0BC' }}>
      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>
        Milestone Bonuses
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 13 }}>
        {MILESTONES.map(m => {
          const reached = ambassador.qualifying_count >= m.value
          const paid = milestonePaidField(m.value)
          return (
            <button
              key={m.value}
              disabled={!reached || !!paid || updatingMilestone === m.value}
              onClick={() => handleMarkMilestonePaid(m.value)}
              style={{
                background: paid ? '#D0E8BC' : reached ? '#C8821A' : '#F5F0E6',
                color: paid ? '#1B3A1D' : reached ? '#fff' : '#5A5A50',
                border: '1px solid ' + (paid ? '#2D5A2E' : reached ? '#C8821A' : '#D8D0BC'),
                borderRadius: 6, padding: '6px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif',
                fontWeight: 700, cursor: reached && !paid ? 'pointer' : 'default',
                opacity: updatingMilestone === m.value ? 0.6 : 1,
              }}
            >
              {paid ? '✓ ' : ''}{m.value} vendors · {m.amount}{!reached ? ' (locked)' : paid ? ' (paid)' : ''}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#5A5A50', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.4 }}>
        Referrals
      </p>
      {loading ? (
        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>Loading...</p>
      ) : referrals.length === 0 ? (
        <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No vendor referrals yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {referrals.map(r => (
            <div key={r.id} style={{ background: '#F5F0E6', borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{r.vendor_phone}</p>
                <p style={{ fontSize: 9, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  Referred {new Date(r.referred_at).toLocaleDateString('en-JM')} · {r.listing_count} listing{r.listing_count === 1 ? '' : 's'}
                </p>
              </div>
              <span className={'chip ' + (r.qualifying_status === 'qualified' || r.qualifying_status === 'paid' ? 'chip-approved' : 'chip-pending')}>
                {r.qualifying_status}
              </span>
              {r.qualifying_status === 'pending' && (
                <button
                  onClick={() => handleMarkQualified(r.id)}
                  disabled={updatingId === r.id}
                  style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 9px', fontSize: 9, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', opacity: updatingId === r.id ? 0.6 : 1, whiteSpace: 'nowrap' }}
                >
                  {updatingId === r.id ? '...' : 'Mark Qualified'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filter, setFilter] = useState<AdminFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, urgent: 0 })
  const [sponsors, setSponsors] = useState<any[]>([])
  const [boosts, setBoosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [showAddListing, setShowAddListing] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('listings')
  const [activatingBoost, setActivatingBoost] = useState<string | null>(null)
  const [ambassadors, setAmbassadors] = useState<AmbassadorSummary[]>([])
  const [ambassadorKPIs, setAmbassadorKPIs] = useState<AmbassadorKPIs | null>(null)
  const [expandedAmbassadorId, setExpandedAmbassadorId] = useState<string | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [newSponsor, setNewSponsor] = useState({
    business_name: '',
    tagline: '',
    parish: '',
    whatsapp: '',
    package: 'monthly',
    payment_method: 'paypal',
    payment_status: 'paid',
    featured_listing_id: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      loadAll()
      loadSponsors()
      loadBoosts()
      loadUsers()
      loadAmbassadors()
      loadActivity()
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

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
  }

  async function loadAmbassadors() {
    const { data } = await getAmbassadorSummaries()
    if (data) setAmbassadors(data as AmbassadorSummary[])
    const { data: kpiData } = await getAmbassadorKPIs()
    if (kpiData) setAmbassadorKPIs(kpiData as AmbassadorKPIs)
  }

  async function loadActivity() {
    setActivityLoading(true)
    const { data } = await supabase
      .from('vendor_call_survey_summary')
      .select('*')
      .order('total_contacts', { ascending: false })
    if (data) setActivity(data)
    setActivityLoading(false)
  }

  function vendorDisplayName(vendorId: string) {
    const u = users.find(u => u.id === vendorId)
    return u?.full_name || 'Unnamed user'
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
    await supabase.from('boosts').update({
      payment_status: 'paid',
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq('id', boost.id)
    await supabase.from('listings').update({
      is_featured: true,
      featured_until: expiresAt.toISOString(),
    }).eq('id', boost.listing_id)
    setBoosts(prev => prev.map(b => b.id === boost.id ? {
      ...b, payment_status: 'paid',
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
    const pkg = SPONSOR_PACKAGES.find(p => p.key === newSponsor.package)!
    const now = new Date()
    const expiresAt = new Date(now.getTime() + pkg.days * 24 * 60 * 60 * 1000)
    const { data } = await supabase.from('sponsors').insert([{
      business_name: newSponsor.business_name,
      tagline: newSponsor.tagline,
      parish: newSponsor.parish || null,
      whatsapp: newSponsor.whatsapp || null,
      package: pkg.label,
      payment_method: newSponsor.payment_method,
      payment_status: newSponsor.payment_status,
      starts_at: newSponsor.payment_status === 'paid' ? now.toISOString() : null,
      expires_at: newSponsor.payment_status === 'paid' ? expiresAt.toISOString() : null,
      is_active: newSponsor.payment_status === 'paid',
      featured_listing_id: newSponsor.package === 'featured' && newSponsor.featured_listing_id ? newSponsor.featured_listing_id : null,
    }]).select().single()
    if (data) {
      if (newSponsor.package === 'featured' && newSponsor.featured_listing_id && newSponsor.payment_status === 'paid') {
        await supabase.from('listings').update({
          is_featured: true,
          featured_until: expiresAt.toISOString(),
        }).eq('id', newSponsor.featured_listing_id)
      }
      setSponsors(prev => [data, ...prev])
      setNewSponsor({ business_name: '', tagline: '', parish: '', whatsapp: '', package: 'monthly', payment_method: 'paypal', payment_status: 'paid', featured_listing_id: '' })
      setShowSponsorForm(false)
    }
  }

  const filtered = listings.filter(l => filter === 'all' || l.status === filter)
  const pendingBoosts = boosts.filter(b => b.payment_status === 'pending')

  const activityTotals = activity.reduce((acc, row) => {
    acc.totalContacts += row.total_contacts || 0
    acc.totalResponses += row.total_survey_responses || 0
    acc.totalPurchases += row.purchases_reported || 0
    return acc
  }, { totalContacts: 0, totalResponses: 0, totalPurchases: 0 })
  const overallConversionRate = activityTotals.totalResponses > 0
    ? Math.round((activityTotals.totalPurchases / activityTotals.totalResponses) * 1000) / 10
    : 0

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

      <div style={{ display: 'flex', background: '#EDE7D9', borderBottom: '1px solid #D8D0BC', flexShrink: 0, overflowX: 'auto' }}>
        {(['listings', 'boosts', 'sponsors', 'users', 'ambassadors', 'activity'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, minWidth: 74, padding: '10px 0', border: 'none', background: activeTab === tab ? '#1B3A1D' : 'transparent', color: activeTab === tab ? '#fff' : '#5A5A50', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', position: 'relative' }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'boosts' && pendingBoosts.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, background: '#C8821A', color: '#fff', fontSize: 8, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
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
          <div style={{ padding: '6px 13px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Archive = resolved. Auto-creates impact story. All reversible.
            </p>
            <button
              onClick={() => setShowAddListing(true)}
              style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 10, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 8 }}
            >
              + Post for user
            </button>
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
                    {listing.is_anonymous ? 'Anonymous' : 'Community member'} · {listing.parish}{listing.district ? ' · ' + listing.district : ''} · {listing.category} · {new Date(listing.created_at).toLocaleDateString('en-JM')}
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
          {showAddListing && (
            <AddListingForUser
              users={users}
              onClose={() => setShowAddListing(false)}
              onSaved={() => { setShowAddListing(false); loadAll() }}
            />
          )}
        </>
      )}

      {/* BOOSTS TAB */}
      {activeTab === 'boosts' && (
        <div className="scroll-area">
          <div style={{ padding: '9px 13px 3px' }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Activate a boost once payment is confirmed. Listing becomes featured automatically for the paid duration.
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
                  {boost.listings?.parish}{boost.listings?.district ? ' · ' + boost.listings.district : ''} · {new Date(boost.created_at).toLocaleDateString('en-JM')}
                  {boost.payment_note ? ' · ' + boost.payment_note : ''}
                </p>
                {boost.payment_status === 'paid' && (
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#2D5A2E', marginTop: 3 }}>
                    Active · Expires {new Date(boost.expires_at).toLocaleDateString('en-JM')}
                  </p>
                )}
                {boost.payment_status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => activateBoost(boost)} disabled={activatingBoost === boost.id} style={{ background: '#C8821A', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 11, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', opacity: activatingBoost === boost.id ? 0.7 : 1 }}>
                      {activatingBoost === boost.id ? 'Activating...' : 'Activate boost ⭐'}
                    </button>
                    <button onClick={() => rejectBoost(boost.id)} style={{ background: 'transparent', color: '#A84B2A', border: '1px solid #A84B2A', borderRadius: 6, padding: '7px 10px', fontSize: 11, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>
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
              Active sponsors rotate in the feed. Featured + Sponsor also pins their listing to the top.
            </p>
            <button onClick={() => setShowSponsorForm(!showSponsorForm)} style={{ background: '#1B3A1D', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
              {showSponsorForm ? 'Cancel' : '+ Add sponsor'}
            </button>
          </div>

          {showSponsorForm && (
            <div style={{ padding: 13, borderBottom: '1px solid #D8D0BC', background: '#F5F0E6' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><label className="field-label">Business name *</label><input className="form-field" placeholder="e.g. Rose Hall Pharmacy" value={newSponsor.business_name} onChange={e => setNewSponsor(p => ({ ...p, business_name: e.target.value }))} /></div>
                <div><label className="field-label">Tagline *</label><input className="form-field" placeholder="e.g. Serving Montego Bay — delivery available" value={newSponsor.tagline} onChange={e => setNewSponsor(p => ({ ...p, tagline: e.target.value }))} /></div>
                <div><label className="field-label">Parish</label><input className="form-field" placeholder="e.g. St. James" value={newSponsor.parish} onChange={e => setNewSponsor(p => ({ ...p, parish: e.target.value }))} /></div>
                <div><label className="field-label">WhatsApp</label><input className="form-field" placeholder="+1 876 XXX XXXX" value={newSponsor.whatsapp} onChange={e => setNewSponsor(p => ({ ...p, whatsapp: e.target.value }))} /></div>
                <div>
                  <label className="field-label">Package</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {SPONSOR_PACKAGES.map(pkg => (
                      <button key={pkg.key} onClick={() => setNewSponsor(p => ({ ...p, package: pkg.key, featured_listing_id: '' }))}
                        style={{ background: newSponsor.package === pkg.key ? '#1B3A1D' : '#EDE7D9', color: newSponsor.package === pkg.key ? '#fff' : '#18180F', border: '1.5px solid ' + (newSponsor.package === pkg.key ? '#1B3A1D' : '#D8D0BC'), borderRadius: 8, padding: '9px 12px', fontSize: 12, fontFamily: '-apple-system, sans-serif', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{pkg.label}</span>
                        <span style={{ fontSize: 11, color: newSponsor.package === pkg.key ? '#C8821A' : '#5A5A50' }}>${pkg.price.toLocaleString()} JMD · {pkg.days} days</span>
                      </button>
                    ))}
                  </div>
                </div>
                {newSponsor.package === 'featured' && (
                  <div>
                    <label className="field-label">Which listing to feature? *</label>
                    <select className="form-field" style={{ appearance: 'none' }} value={newSponsor.featured_listing_id} onChange={e => setNewSponsor(p => ({ ...p, featured_listing_id: e.target.value }))}>
                      <option value="">Select a listing...</option>
                      {listings.filter(l => l.status === 'approved').map(l => (
                        <option key={l.id} value={l.id}>{l.title} — {l.parish}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="field-label">Payment method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {['Cash', 'PayPal', 'Free'].map(m => (
  <button key={m} onClick={() => setNewSponsor(p => ({ ...p, payment_method: m.toLowerCase() }))}
    style={{ background: newSponsor.payment_method === m.toLowerCase() ? '#1B3A1D' : '#EDE7D9', color: newSponsor.payment_method === m.toLowerCase() ? '#fff' : '#18180F', border: '1.5px solid ' + (newSponsor.payment_method === m.toLowerCase() ? '#1B3A1D' : '#D8D0BC'), borderRadius: 8, padding: '9px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
    {m}
  </button>
))}
                  </div>
                </div>
                <div>
                  <label className="field-label">Payment status</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {['paid', 'pending'].map(s => (
                      <button key={s} onClick={() => setNewSponsor(p => ({ ...p, payment_status: s }))}
                        style={{ background: newSponsor.payment_status === s ? (s === 'paid' ? '#2D5A2E' : '#C8821A') : '#EDE7D9', color: newSponsor.payment_status === s ? '#fff' : '#18180F', border: '1.5px solid ' + (newSponsor.payment_status === s ? 'transparent' : '#D8D0BC'), borderRadius: 8, padding: '9px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={addSponsor} style={{ background: '#C8821A', color: '#fff', border: 'none', borderRadius: 7, padding: '11px 0', fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                  Save sponsor
                </button>
              </div>
            </div>
          )}

          {sponsors.length === 0 ? (
            <div className="empty-state"><p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No sponsors yet.</p></div>
          ) : (
            sponsors.map(sponsor => (
              <div key={sponsor.id} style={{ padding: '11px 13px', borderBottom: '1px solid #D8D0BC', opacity: sponsor.is_active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{sponsor.business_name}</p>
                  <span className={'chip ' + (sponsor.is_active ? 'chip-approved' : 'chip-neutral')}>{sponsor.is_active ? 'Active' : 'Paused'}</span>
                </div>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 3 }}>
                  {sponsor.tagline}{sponsor.parish ? ' · ' + sponsor.parish : ''}
                </p>
                {sponsor.package && (
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#C8821A', marginBottom: 3 }}>
                    {sponsor.package} · {sponsor.payment_method} · {sponsor.payment_status}
                  </p>
                )}
                {sponsor.expires_at && (
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: new Date(sponsor.expires_at) < new Date() ? '#A84B2A' : '#2D5A2E', marginBottom: 7 }}>
                    {new Date(sponsor.expires_at) < new Date() ? 'Expired ' : 'Expires '}{new Date(sponsor.expires_at).toLocaleDateString('en-JM')}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => toggleSponsor(sponsor.id, sponsor.is_active)} style={{ background: sponsor.is_active ? '#EDE7D9' : '#1B3A1D', color: sponsor.is_active ? '#5A5A50' : '#fff', border: '1px solid #D8D0BC', borderRadius: 5, padding: '5px 9px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>
                    {sponsor.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => deleteSponsor(sponsor.id)} style={{ background: 'transparent', color: '#A84B2A', border: '1px solid #A84B2A', borderRadius: 5, padding: '5px 9px', fontSize: 10, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="scroll-area">
          <div style={{ padding: '9px 13px 3px' }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              To remove a user permanently, go to Supabase → Authentication → Users.
            </p>
          </div>
          {users.length === 0 ? (
            <div className="empty-state"><p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No users yet.</p></div>
          ) : (
            users.map(u => (
              <div key={u.id} style={{ padding: '11px 13px', borderBottom: '1px solid #D8D0BC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{u.full_name || 'Unnamed user'}</p>
                  {u.is_admin && <span className="chip chip-featured">Admin</span>}
                </div>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                  {u.parish || 'No parish'} · {u.whatsapp || 'No WhatsApp'} · Joined {new Date(u.created_at).toLocaleDateString('en-JM')}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* AMBASSADORS TAB */}
      {activeTab === 'ambassadors' && (
        <div className="scroll-area">
          {ambassadorKPIs && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#D8D0BC', borderBottom: '1px solid #D8D0BC' }}>
              {[
                { label: 'Total ambassadors', value: ambassadorKPIs.total_ambassadors, color: '#1B3A1D' },
                { label: 'Active', value: ambassadorKPIs.active_ambassadors, color: '#1B3A1D' },
                { label: 'Qualifying vendors', value: ambassadorKPIs.total_qualifying_vendors, color: '#C8821A' },
                { label: 'Qualifying rate', value: (ambassadorKPIs.qualifying_rate_percent ?? 0) + '%', color: '#5A5A50' },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#F5F0E6', padding: '11px 13px' }}>
                  <p style={{ fontSize: 18, color: stat.color }}>{stat.value}</p>
                  <p className="eyebrow" style={{ marginTop: 1 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '9px 13px 3px' }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Tap an ambassador to view their referrals and mark milestone bonuses as paid.
            </p>
          </div>

          {ambassadors.length === 0 ? (
            <div className="empty-state"><p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No ambassadors yet.</p></div>
          ) : (
            ambassadors.map(amb => (
              <div key={amb.id} style={{ borderBottom: '1px solid #D8D0BC' }}>
                <div
                  onClick={() => setExpandedAmbassadorId(expandedAmbassadorId === amb.id ? null : amb.id)}
                  style={{ padding: '11px 13px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                    <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F' }}>{amb.name}</p>
                    <span className={'chip ' + (amb.status === 'active' ? 'chip-approved' : 'chip-neutral')}>{amb.status}</span>
                  </div>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#C8821A', marginBottom: 3 }}>
                    {amb.referral_code}{amb.school_name ? ' · ' + amb.school_name : ''}
                  </p>
                  <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
                    {amb.qualifying_count} qualifying · {amb.pending_count} pending · {amb.total_referrals} total referred
                    {amb.milestone_reached > 0 ? ' · milestone: ' + amb.milestone_reached : ''}
                  </p>
                </div>
                {expandedAmbassadorId === amb.id && (
                  <AmbassadorReferralsPanel ambassador={amb} onMilestoneUpdated={loadAmbassadors} />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className="scroll-area">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#D8D0BC', borderBottom: '1px solid #D8D0BC' }}>
            {[
              { label: 'Total contacts', value: activityTotals.totalContacts, color: '#1B3A1D' },
              { label: 'Survey responses', value: activityTotals.totalResponses, color: '#1B3A1D' },
              { label: 'Purchases reported', value: activityTotals.totalPurchases, color: '#C8821A' },
              { label: 'Conversion rate', value: overallConversionRate + '%', color: '#5A5A50' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#F5F0E6', padding: '11px 13px' }}>
                <p style={{ fontSize: 18, color: stat.color }}>{stat.value}</p>
                <p className="eyebrow" style={{ marginTop: 1 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: '9px 13px 3px' }}>
            <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>
              Contacts logged from every Call and WhatsApp tap on a listing, whether or not the person was logged in. Self-reported via the post-contact survey.
            </p>
          </div>

          {activityLoading ? (
            <div className="loading">Loading...</div>
          ) : activity.length === 0 ? (
            <div className="empty-state"><p style={{ fontSize: 13, fontFamily: '-apple-system, sans-serif', color: '#5A5A50' }}>No contact activity yet.</p></div>
          ) : (
            activity.map((row, i) => (
              <div key={row.vendor_id + '-' + row.channel + '-' + i} style={{ padding: '11px 13px', borderBottom: '1px solid #D8D0BC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 3 }}>
                  <p style={{ fontSize: 12, fontFamily: '-apple-system, sans-serif', fontWeight: 700, color: '#18180F', flex: 1, marginRight: 7 }}>
                    {vendorDisplayName(row.vendor_id)}
                  </p>
                  <span className="chip chip-neutral">
                    {row.channel === 'whatsapp' ? '💬 WhatsApp' : '📞 Call'}
                  </span>
                </div>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#5A5A50', marginBottom: 3 }}>
                  {row.total_contacts} contact{row.total_contacts === 1 ? '' : 's'} · {row.total_survey_responses} response{row.total_survey_responses === 1 ? '' : 's'} · {row.purchases_reported} purchase{row.purchases_reported === 1 ? '' : 's'} reported
                </p>
                <p style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', color: '#C8821A' }}>
                  {row.conversion_rate_pct != null ? row.conversion_rate_pct + '% conversion' : 'No responses yet'}
                  {row.avg_amount_spent != null ? ' · avg $' + row.avg_amount_spent + ' JMD' : ''}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
