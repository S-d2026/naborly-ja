import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ListingCategory = 'food' | 'urgent' | 'work' | 'ride' | 'service' | 'buy-sell' | 'vendor'
export type ListingType = 'need' | 'offer'
export type ListingStatus = 'pending' | 'approved' | 'hidden' | 'archived' | 'rejected'

export interface Listing {
  id: string
  user_id: string | null
  title: string
  description: string | null
  category: ListingCategory
  listing_type: ListingType
  price_jmd: string | null
  is_free: boolean
  parish: string
  district: string | null
  whatsapp: string | null
  is_anonymous: boolean
  status: ListingStatus
  is_featured: boolean
  featured_until: string | null
  photo_url: string | null
  lat: number | null
  lng: number | null
  view_count: number
  response_count: number
  families_helped: number
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string | null
    whatsapp: string | null
    is_verified: boolean
  }
}

export interface Profile {
  id: string
  full_name: string | null
  whatsapp: string | null
  parish: string | null
  district: string | null
  is_admin: boolean
  is_verified: boolean
  helper_count: number
  response_count: number
  services: string | null
  show_in_directory: boolean
  created_at: string
}

export interface ImpactStory {
  id: string
  story_text: string
  parish: string | null
  district: string | null
  people_helped: number
  created_at: string
}

export interface VendorLocation {
  id: string
  listing_id: string
  user_id: string
  lat: number
  lng: number
  is_live: boolean
  updated_at: string
}

// Distance calculation (haversine formula) — returns km
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  const miles = km * 0.621371
  if (km < 1) return Math.round(km * 1000) + ' m away'
  if (km < 10) return km.toFixed(1) + ' km (' + miles.toFixed(1) + ' mi) away'
  return Math.round(km) + ' km (' + Math.round(miles) + ' mi) away'
}

export async function getApprovedListings(filters?: {
  parish?: string
  district?: string
  category?: string
  is_free?: boolean
}) {
  let query = supabase
    .from('listings')
    .select('*, profiles(full_name, whatsapp, is_verified)')
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.parish && filters.parish !== 'All Parishes') {
    query = query.eq('parish', filters.parish)
  }
  if (filters?.district && filters.district !== 'all') {
    query = query.ilike('district', '%' + filters.district + '%')
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.is_free) {
    query = query.eq('is_free', true)
  }

  const { data, error } = await query
  return { data, error }
}

export async function createListing(listing: Partial<Listing>) {
  const isFreeFood = listing.category === 'food' && listing.is_free === true
  const isUrgent = listing.category === 'urgent'
  const autoBoostHours = isFreeFood ? 48 : isUrgent ? 24 : 0
  const now = new Date()
  const featuredUntil = autoBoostHours > 0
    ? new Date(now.getTime() + autoBoostHours * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('listings')
    .insert([{
      ...listing,
      is_featured: autoBoostHours > 0,
      featured_until: featuredUntil,
    }])
    .select()
    .single()
  return { data, error }
}

export async function getImpactStories() {
  const { data, error } = await supabase
    .from('impact_stories')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  return { data, error }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function getUserListings(userId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function toggleSaved(userId: string, listingId: string) {
  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId)
    return { saved: false, error }
  } else {
    const { error } = await supabase
      .from('saved_listings')
      .insert([{ user_id: userId, listing_id: listingId }])
    return { saved: true, error }
  }
}

export async function getSavedListings(userId: string) {
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id, listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function adminUpdateListing(listingId: string, updates: Partial<Listing>) {
  const { data, error } = await supabase
    .from('listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select()
    .single()
  return { data, error }
}

export async function getAllListingsAdmin() {
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles(full_name, whatsapp)')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function requestBoost(boostData: {
  listing_id: string
  user_id: string
  plan: string
  price_jmd: number
  payment_method: string
  payment_note?: string
  duration_days: number
}) {
  const { data, error } = await supabase
    .from('boosts')
    .insert([{ ...boostData, payment_status: 'pending' }])
    .select()
    .single()
  return { data, error }
}

// Vendor live location
export async function goLive(listingId: string, userId: string, lat: number, lng: number) {
  // Upsert — create or update
  const { data, error } = await supabase
    .from('vendor_locations')
    .upsert([{ listing_id: listingId, user_id: userId, lat, lng, is_live: true, updated_at: new Date().toISOString() }], { onConflict: 'listing_id' })
    .select()
    .single()
  return { data, error }
}

export async function updateLiveLocation(listingId: string, lat: number, lng: number) {
  const { error } = await supabase
    .from('vendor_locations')
    .update({ lat, lng, updated_at: new Date().toISOString() })
    .eq('listing_id', listingId)
  return { error }
}

export async function stopLive(listingId: string) {
  const { error } = await supabase
    .from('vendor_locations')
    .update({ is_live: false })
    .eq('listing_id', listingId)
  return { error }
}

export async function getLiveLocation(listingId: string) {
  const { data, error } = await supabase
    .from('vendor_locations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('is_live', true)
    .single()
  return { data, error }
}
export async function getProfileById(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()
  return { data, error }
}

// ============================================
// Ambassador Program
// ============================================

export interface Ambassador {
  id: string
  name: string
  phone: string | null
  email: string | null
  referral_code: string
  status: 'active' | 'inactive'
  school_name: string | null
  school_payment_contact: string | null
  guardian_name: string | null
  guardian_phone: string | null
  agreement_signed: boolean
  agreement_signed_at: string | null
  created_at: string
}

export interface AmbassadorReferral {
  id: string
  ambassador_id: string
  vendor_phone: string
  vendor_name: string | null
  referred_at: string
  listing_count: number
  first_listing_at: string | null
  qualifying_status: 'pending' | 'qualified' | 'paid'
  qualified_at: string | null
  paid_at: string | null
  payout_amount: number | null
}

export interface AmbassadorSummary {
  id: string
  name: string
  referral_code: string
  status: string
  school_name: string | null
  agreement_signed: boolean
  milestone_10_paid: boolean
  milestone_25_paid: boolean
  milestone_50_paid: boolean
  milestone_100_paid: boolean
  qualifying_count: number
  pending_count: number
  total_referrals: number
  milestone_reached: number
}

export interface AmbassadorKPIs {
  total_ambassadors: number
  active_ambassadors: number
  total_referrals: number
  total_qualifying_vendors: number
  qualifying_rate_percent: number | null
  total_paid_out: number
}

function generateReferralCode(name: string): string {
  const cleanName = name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'AMB'
  const randomDigits = Math.floor(1000 + Math.random() * 9000)
  return `AMB-${cleanName}${randomDigits}`
}

export async function createAmbassador(ambassador: {
  name: string
  phone?: string
  email?: string
  school_name?: string
  school_payment_contact?: string
  guardian_name?: string
  guardian_phone?: string
}) {
  let referral_code = generateReferralCode(ambassador.name)
  let attempts = 0
  let data: Ambassador | null = null
  let error: any = null

  // Retry a few times in the unlikely event of a referral code collision
  while (attempts < 5) {
    const result = await supabase
      .from('ambassadors')
      .insert([{
        ...ambassador,
        referral_code,
        agreement_signed: true,
        agreement_signed_at: new Date().toISOString(),
      }])
      .select()
      .single()

    data = result.data as Ambassador | null
    error = result.error

    if (!error) break
    if (error.code !== '23505') break // not a unique-violation, stop retrying
    referral_code = generateReferralCode(ambassador.name)
    attempts++
  }

  return { data, error }
}

export async function getAmbassadorByCode(code: string) {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('referral_code', code)
    .single()
  return { data, error }
}

export async function getAmbassadorSummaries() {
  const { data, error } = await supabase
    .from('ambassador_summary')
    .select('*')
    .order('qualifying_count', { ascending: false })
  return { data, error }
}

export async function getAmbassadorKPIs() {
  const { data, error } = await supabase
    .from('naberlyja_ambassador_kpis')
    .select('*')
    .single()
  return { data, error }
}

export async function getAmbassadorReferrals(ambassadorId: string) {
  const { data, error } = await supabase
    .from('ambassador_referrals')
    .select('*')
    .eq('ambassador_id', ambassadorId)
    .order('referred_at', { ascending: false })
  return { data, error }
}

export async function markReferralQualified(referralId: string) {
  const { data, error } = await supabase
    .from('ambassador_referrals')
    .update({ qualifying_status: 'qualified', qualified_at: new Date().toISOString() })
    .eq('id', referralId)
    .select()
    .single()
  return { data, error }
}

export async function markMilestonePaid(ambassadorId: string, milestone: 10 | 25 | 50 | 100) {
  const field = `milestone_${milestone}_paid`
  const fieldAt = `milestone_${milestone}_paid_at`
  const { data, error } = await supabase
    .from('ambassadors')
    .update({ [field]: true, [fieldAt]: new Date().toISOString() })
    .eq('id', ambassadorId)
    .select()
    .single()
  return { data, error }
}

export async function linkVendorToAmbassador(referralCode: string, vendorPhone: string, vendorName?: string) {
  const code = referralCode.trim().toUpperCase()
  if (!code) return { linked: false }

  const { data: ambassador } = await getAmbassadorByCode(code)
  if (!ambassador || ambassador.status !== 'active') return { linked: false }

  const { error } = await supabase.from('ambassador_referrals').insert([{
    ambassador_id: ambassador.id,
    vendor_phone: vendorPhone,
    vendor_name: vendorName || null,
    listing_count: 1,
    first_listing_at: new Date().toISOString(),
  }])

  return { linked: !error }
}
