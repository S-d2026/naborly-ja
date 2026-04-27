'use client'
// app/post/page.tsx — Post a listing (named or anonymous)

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, createListing } from '@/lib/supabase'

const PARISHES = ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine']

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍲', bg: '#D0E8BC' },
  { key: 'urgent', label: 'Urgent', emoji: '⚠️', bg: '#F0CABA' },
  { key: 'work', label: 'Work', emoji: '💼', bg: '#BCD0E8' },
  { key: 'ride', label: 'Ride', emoji: '🚗', bg: '#E0D8F0' },
  { key: 'service', label: 'Service', emoji: '🛠️', bg: '#F0E8BC' },
  { key: 'buy-sell', label: 'Buy/Sell', emoji: '🛍️', bg: '#EDE7D9' },
]

function PostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialAnon = searchParams.get('anonymous') === 'true'

  const [isAnonymous, setIsAnonymous] = useState(initialAnon)
  const [listingType, setListingType] = useState<'need' | 'offer'>('need')
  const [category, setCategory] = useState('food')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [parish, setParish] = useState('Kingston')
  const [district, setDistrict] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
      const { data, error: uploadError } = await supabase.storage
        .from('listings')
        .upload(fileName, file, { upsert: true })
      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Photo upload failed: ' + uploadError.message)
      } else if (data) {
        const { data: urlData } = supabase.storage
          .from('listings')
          .getPublicUrl(fileName)
        setPhotoUrl(urlData.publicUrl)
      }
    } catch (err) {
      console.error('Upload exception:', err)
    }
    setUploading(false)
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Please add a title.'); return }
    if (!parish) { setError('Please choose your parish.'); return }
    if (!isAnonymous && !whatsapp.trim()) { setError('Please add your WhatsApp number so neighbors can reach you.'); return }

    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await createListing({
      user_id: user?.id || null,
      title: title.trim(),
      description: description.trim() || null,
      category: category as any,
      listing_type: listingType,
      price_jmd: price ? parseInt(price) : null,
      is_free: !price,
      parish,
      district: district.trim() || null,
      whatsapp: isAnonymous ? null : whatsapp.trim(),
      is_anonymous: isAnonymous,
      photo_url: photoUrl || null,
      status: 'pending',
    })

    setSubmitting(false)

    if (err) {
      setError('Something went wrong. Please try again.')
    } else {
      setSuccess(true)
      const message = encodeURIComponent(
        `New Naberly post submitted!\n\nTitle: ${title}\nCategory: ${category}\nParish: ${parish}${district ? `\nDistrict: ${district}` : ''}\nAnonymous: ${isAnonymous ? 'Yes' : 'No'}\n\nPlease review at naberlyja.com/admin`
      )
      window.open('https://wa.me/19174432797?text=' + message, '_blank')
