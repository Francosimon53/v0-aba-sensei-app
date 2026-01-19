import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid" && session.metadata?.userId) {
      // Update user profile with subscription status
      const { error } = await supabase
        .from("user_profiles")
        .update({
          subscription_status: "active",
          subscription_plan: session.metadata.priceId,
          stripe_customer_id: session.customer as string,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.metadata.userId)

      if (error) {
        console.error("Failed to update user subscription:", error)
        // Still return success - webhook will handle it
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, status: session.payment_status })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
