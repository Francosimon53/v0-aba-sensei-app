import { NextResponse } from "next/server"
import { stripe, PLANS } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json()
    console.log("[v0] Checkout API - received priceId:", priceId, "userId:", userId)
    console.log("[v0] Checkout API - env STRIPE_PRICE_PRO_MONTHLY:", process.env.STRIPE_PRICE_PRO_MONTHLY)

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 })
    }

    // Get user email from Supabase
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the actual Stripe price ID
    let stripePriceId: string | null = null
    console.log("[v0] Checkout API - PLANS:", JSON.stringify(PLANS, null, 2))
    
    for (const [key, plan] of Object.entries(PLANS)) {
      console.log("[v0] Checking plan:", key, "priceId:", plan.priceId, "against:", priceId)
      if (plan.priceId === priceId || plan.name.toLowerCase().replace(" ", "_") === priceId) {
        stripePriceId = plan.priceId
        console.log("[v0] Matched plan:", key, "stripePriceId:", stripePriceId)
        break
      }
    }

    // If priceId is already a Stripe price ID, use it directly
    if (priceId.startsWith("price_")) {
      stripePriceId = priceId
      console.log("[v0] Using direct priceId:", stripePriceId)
    }

    console.log("[v0] Final stripePriceId:", stripePriceId)

    if (!stripePriceId) {
      console.error("[v0] No valid stripePriceId found for priceId:", priceId)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Create or retrieve Stripe customer
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "http://localhost:3000"}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "http://localhost:3000"}/pricing`,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    )
  }
}
