import { SITE_URL } from '@/lib/sitemap/site-url'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getIsPremium } from '@/hooks/data/user'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null

const PRICE_ID = process.env.STRIPE_PRICE_ID ?? ''

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (await getIsPremium(user.id)) {
    return NextResponse.json({ error: 'Already a supporter' }, { status: 400 })
  }

  if (!stripe || !PRICE_ID) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${SITE_URL}/profile?upgraded=1`,
    cancel_url: `${SITE_URL}/profile`,
    customer_email: user.email,
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
