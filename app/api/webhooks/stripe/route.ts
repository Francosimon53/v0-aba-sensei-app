import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  // For now, skip signature verification if no webhook secret is set
  // In production, you should set STRIPE_WEBHOOK_SECRET
  let event: Stripe.Event

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } else {
      // Parse without verification (for development)
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0]?.price.id

          // Determine plan tier based on price ID
          let tier = "pro"
          if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
            tier = "pro_annual"
          } else if (priceId === process.env.STRIPE_PRICE_TEAM) {
            tier = "team"
          }

          // Update user profile
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: tier,
              stripe_subscription_id: subscriptionId,
              subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", userId)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          const priceId = subscription.items.data[0]?.price.id
          let tier = "pro"
          if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
            tier = "pro_annual"
          } else if (priceId === process.env.STRIPE_PRICE_TEAM) {
            tier = "team"
          }

          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: subscription.status === "active" ? tier : "free",
              subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", userId)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: "free",
              stripe_subscription_id: null,
              subscription_expires_at: null,
            })
            .eq("id", userId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
