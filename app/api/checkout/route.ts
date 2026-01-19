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
    console.log("[v0] Checkout API received - priceId:", priceId, "userId:", userId)

    if (!priceId || !userId) {
      console.log("[v0] Missing priceId or userId")
      return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 })
    }

    // Get user email from Supabase
    console.log("[v0] Fetching profile for userId:", userId)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single()

    console.log("[v0] Profile result:", profile, "error:", profileError)

    if (!profile?.email) {
      console.log("[v0] User not found or no email")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If priceId is already a Stripe price ID, use it directly
    let stripePriceId: string | null = null
    
    if (priceId.startsWith("price_")) {
      stripePriceId = priceId
      console.log("[v0] Using direct priceId:", stripePriceId)
    } else {
      // Find the actual Stripe price ID from PLANS
      for (const plan of Object.values(PLANS)) {
        if (plan.priceId === priceId || plan.name.toLowerCase().replace(" ", "_") === priceId) {
          stripePriceId = plan.priceId
          break
        }
      }
    }

    console.log("[v0] Final stripePriceId:", stripePriceId)

    if (!stripePriceId) {
      console.log("[v0] Invalid plan - no stripePriceId found")
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
    console.log("[v0] App URL:", appUrl)
    console.log("[v0] Creating Stripe checkout session with customerId:", customerId, "priceId:", stripePriceId)

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

    console.log("[v0] Checkout session created:", session.id, "url:", session.url)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    )
  }
}
