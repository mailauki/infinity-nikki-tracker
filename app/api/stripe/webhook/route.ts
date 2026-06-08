import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-05-27.dahlia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_purchased_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update premium status:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
