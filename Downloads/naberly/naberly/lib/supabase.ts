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
  if (km < 1) return Math.round(km * 1000) + ' m away'
  if (km < 10) return km.toFixed(1) + ' km away'
  return Math.round(km) + ' km away'
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
  const { data, error } = await supabase
    .from('listings')
    .insert([{
      ...listing,
      is_featured: false,
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
