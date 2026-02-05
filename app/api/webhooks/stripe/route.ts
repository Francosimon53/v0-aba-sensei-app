import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { hashSHA256, sendMetaConversionEvent } from "@/lib/meta"
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
              subscription_expires_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            })
            .eq("id", userId)

          // Send Meta Conversions API Purchase event
          const metaEventId = session.metadata?.metaEventId
          if (metaEventId) {
            const customerEmail = session.customer_details?.email
            const amountTotal = session.amount_total
              ? session.amount_total / 100
              : 0
            const currency = (session.currency || "usd").toUpperCase()
            const fbc = session.metadata?.fbc
            const fbp = session.metadata?.fbp

            await sendMetaConversionEvent({
              event_name: "Purchase",
              event_id: metaEventId,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              user_data: {
                ...(customerEmail && { em: [hashSHA256(customerEmail)] }),
                ...(fbc && { fbc }),
                ...(fbp && { fbp }),
              },
              custom_data: {
                value: amountTotal,
                currency,
              },
            }).catch((err) => {
              console.error("Meta CAPI Purchase event failed:", err)
            })
          }
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
              subscription_expires_at: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
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
