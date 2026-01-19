import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json()

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 })
    }

    // Map price IDs to actual Stripe price IDs from environment
    const priceMap: Record<string, string | undefined> = {
      pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
      team: process.env.STRIPE_PRICE_TEAM,
    }

    const stripePriceId = priceMap[priceId]

    if (!stripePriceId) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId,
        priceId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
