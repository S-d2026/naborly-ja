// This file goes to: app/api/paypal-webhook/route.ts
//
// What this does: PayPal calls this URL automatically whenever something
// happens to a Premium subscription — cancelled, suspended, expired, a
// renewal payment failed, or a renewal payment succeeded. Up to now, our
// Supabase premium_subscriptions table only ever got updated once, at
// sign-up — so if someone cancelled through PayPal directly, or a card
// declined on renewal, our table would keep saying "active" forever,
// even though PayPal had stopped billing them. This route closes that gap.
//
// It does two things for every incoming request:
//   1. Verifies with PayPal that the request genuinely came from PayPal
//      (not someone pretending to), using PayPal's own verification API.
//   2. Updates the matching row in premium_subscriptions based on what
//      happened.
//
// Required environment variables (all server-side only — do NOT prefix
// any of these with NEXT_PUBLIC_, since that would expose them in the
// public browser bundle):
//   PAYPAL_CLIENT_ID_LIVE        - Live app Client ID (same value as the
//                                  existing NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE)
//   PAYPAL_SECRET_LIVE           - Live app Secret (from PayPal dashboard)
//   PAYPAL_WEBHOOK_ID            - created when you add the webhook in the
//                                  PayPal dashboard (step-by-step below)
//   SUPABASE_SERVICE_ROLE_KEY    - Supabase's service_role key (Settings ->
//                                  API in the Supabase dashboard). This is
//                                  different from the anon key the rest of
//                                  the app uses — it's allowed to write to
//                                  any user's row, which this route needs
//                                  since it isn't acting as a logged-in user.
//   NEXT_PUBLIC_SUPABASE_URL     - already set; reused here.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PAYPAL_API_BASE = 'https://api-m.paypal.com' // Live. Use https://api-m.sandbox.paypal.com for testing.

// Server-side Supabase client using the service role key — bypasses row
// level security so this route can update any subscriber's row. This
// client is only ever created here, never exposed to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID_LIVE || ''
  const secret = process.env.PAYPAL_SECRET_LIVE || ''
  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64')

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token as string
}

// Asks PayPal to confirm this webhook call is genuinely theirs, using the
// signature headers PayPal attaches to every webhook request plus the
// Webhook ID we got when setting up the webhook in the dashboard.
async function verifyWebhookSignature(req: NextRequest, eventBody: any): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || ''
  if (!webhookId) return false

  const accessToken = await getPayPalAccessToken()
  if (!accessToken) return false

  const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: req.headers.get('paypal-auth-algo'),
      cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: eventBody,
    }),
  })
  const verifyData = await verifyRes.json()
  return verifyData.verification_status === 'SUCCESS'
}

// Event types that mean "this person should lose Premium access."
const CANCEL_LIKE_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'PAYMENT.SALE.REFUNDED',
])

// A failed renewal charge — flagged as past_due rather than immediately
// cancelled, since PayPal itself will retry a missed payment before
// finally cancelling (we already configured "1 missed cycle" pause
// threshold when the Plan was created).
const PAYMENT_FAILED_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
])

// Events that mean "this person's subscription is in good standing" —
// covers the initial activation and each successful renewal charge.
const ACTIVE_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.RE-ACTIVATED',
  'PAYMENT.SALE.COMPLETED',
])

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  let verified = false
  try {
    verified = await verifyWebhookSignature(req, event)
  } catch (err) {
    console.error('PayPal webhook signature check failed', err)
  }
  if (!verified) {
    // Don't process anything from a request we can't confirm is really
    // from PayPal — this is the step that stops someone else from being
    // able to fake a "subscription activated" call.
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
  }

  const eventType: string = event.event_type || ''
  const resource = event.resource || {}
  // For subscription events the id is the subscription id itself; for a
  // sale/payment event it's nested under billing_agreement_id.
  const subscriptionId: string | undefined = resource.id || resource.billing_agreement_id

  if (!subscriptionId) {
    // Nothing we can match to a row — acknowledge receipt so PayPal
    // doesn't keep retrying, but there's nothing to update.
    return NextResponse.json({ received: true })
  }

  let newStatus: string | null = null
  if (CANCEL_LIKE_EVENTS.has(eventType)) newStatus = 'cancelled'
  else if (PAYMENT_FAILED_EVENTS.has(eventType)) newStatus = 'past_due'
  else if (ACTIVE_EVENTS.has(eventType)) newStatus = 'active'

  if (newStatus) {
    const { error } = await supabaseAdmin
      .from('premium_subscriptions')
      .update({ status: newStatus })
      .eq('paypal_subscription_id', subscriptionId)
    if (error) {
      console.error('Failed to update premium_subscriptions from webhook', error)
    }
  }

  return NextResponse.json({ received: true })
}
