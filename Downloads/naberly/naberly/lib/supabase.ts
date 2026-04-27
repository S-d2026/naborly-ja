// lib/supabase.ts
// Supabase client — used throughout the app

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---- Types ----

export type ListingCategory = 'food' | 'urgent' | 'work' | 'ride' | 'service' | 'buy-sell'
export type ListingType = 'need' | 'offer'
export type ListingStatus = 'pending' | 'approved' | 'hidden' | 'archived' | 'rejected'

export interface Listing {
  id: string
  user_id: string | null
  title: string
  description: string | null
  category: ListingCategory
  listing_type: ListingType
  price_jmd: number | null
  is_free: boolean
  parish: string
  district: string | null
  whatsapp: string | null
  is_anonymous: boolean
  status: ListingStatus
  is_featured: boolean
  featured_until: string | null
  photo_url: string | null
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

// ---- Helper functions ----

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
    query = query.ilike('district', `%${filters.district}%`)
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
      status: 'pending',
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
  // Check if already saved
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

// Admin functions
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
    .insert([{
      ...boostData,
      payment_status: 'pending',
    }])
    .select()
    .single()
  return { data, error }
}
