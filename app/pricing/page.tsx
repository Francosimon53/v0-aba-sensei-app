"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Check } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic features",
    features: [
      "5 practice questions per day",
      "Basic progress tracking",
      "Access to study mode",
      "Community support",
    ],
    priceId: null,
    popular: false,
  },
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    price: "$19",
    period: "/month",
    description: "Unlimited practice for serious learners",
    features: [
      "Unlimited practice questions",
      "AI Sensei tutor access",
      "Detailed analytics & insights",
      "All exam categories",
      "Priority support",
      "Cancel anytime",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_1SrN6K8qlKShXAKkjXYjMSl3",
    popular: true,
  },
  {
    id: "pro_annual",
    name: "Pro Annual",
    price: "$149",
    period: "/year",
    description: "Best value - save 35%",
    features: [
      "Everything in Pro Monthly",
      "2 months free",
      "Exam simulation mode",
      "Performance reports",
      "Early access to new features",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "price_1SrN7b8qlKShXAKkckjmKs4e",
    popular: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [userTier, setUserTier] = useState<string>("free")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        // Fetch user's current subscription tier
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single()
        
        if (profile?.subscription_tier) {
          setUserTier(profile.subscription_tier)
        }
      }
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [])

  const handlePlanClick = async (plan: typeof PLANS[0]) => {
    // Free plan - no Stripe needed
    if (!plan.priceId) {
      if (!user) {
        router.push("/auth/sign-up")
      }
      // If logged in and on free plan, button is disabled anyway
      return
    }

    // Paid plans
    if (!user) {
      // Not logged in - redirect to signup with plan info
      const planParam = plan.id === "pro_monthly" ? "pro" : "annual"
      router.push(`/auth/sign-up?plan=${planParam}`)
      return
    }

    // User is logged in - start checkout
    setLoading(plan.id)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, userId: user.id }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(null)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setLoading(null)
    }
  }

  const getButtonText = (plan: typeof PLANS[0]) => {
    if (loading === plan.id) return "Loading..."
    
    // Check if this is the user's current plan
    const isCurrentPlan = 
      (plan.id === "free" && userTier === "free") ||
      (plan.id === "pro_monthly" && userTier === "pro") ||
      (plan.id === "pro_annual" && userTier === "annual")
    
    if (isCurrentPlan) return "Current Plan"
    
    // Not current plan - show action text
    if (plan.id === "free") {
      return user ? "Downgrade" : "Get Started"
    }
    if (plan.id === "pro_monthly") {
      return "Start Pro Trial"
    }
    return "Get Annual"
  }

  const isButtonDisabled = (plan: typeof PLANS[0]) => {
    // Disabled while loading
    if (loading === plan.id) return true
    
    // Current plan is disabled
    const isCurrentPlan = 
      (plan.id === "free" && userTier === "free") ||
      (plan.id === "pro_monthly" && userTier === "pro") ||
      (plan.id === "pro_annual" && userTier === "annual")
    
    if (isCurrentPlan) return true
    
    // Free "Downgrade" is disabled for logged in users (they need to cancel in Stripe)
    if (plan.id === "free" && user && userTier !== "free") return true
    
    return false
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-900">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="text-2xl">🥋</span>
          <span className="font-semibold text-white">ABA Sensei</span>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your study needs. Upgrade anytime to unlock unlimited practice.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-b from-amber-500/10 to-transparent border-2 border-amber-500/50"
                  : "bg-zinc-900/50 border border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-400 ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan)}
                disabled={isButtonDisabled(plan)}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isButtonDisabled(plan)
                    ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                    : plan.popular
                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                } ${loading === plan.id ? "opacity-50" : ""}`}
              >
                {isCheckingAuth ? "..." : getButtonText(plan)}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or Trust */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-sm">
            All plans include a 7-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  )
}
