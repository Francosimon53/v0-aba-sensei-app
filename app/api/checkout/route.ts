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

    // If priceId is already a Stripe price ID, use it directly
    let stripePriceId: string | null = null
    
    if (priceId.startsWith("price_")) {
      stripePriceId = priceId
    } else {
      // Find the actual Stripe price ID from PLANS
      for (const plan of Object.values(PLANS)) {
        if (plan.priceId === priceId || plan.name.toLowerCase().replace(" ", "_") === priceId) {
          stripePriceId = plan.priceId
          break
        }
      }
    }

    if (!stripePriceId) {
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

    // Get the app URL from env or request origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

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
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
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
