"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
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
    cta: "Current Plan",
    priceId: null,
    popular: false,
  },
  {
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
    cta: "Start Pro Trial",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_1SrN6K8qlKShXAKkjXYjMSl3",
    popular: true,
  },
  {
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
    cta: "Get Annual",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "price_1SrN7b8qlKShXAKkckjmKs4e",
    popular: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return

    setLoading(priceId)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?redirect=/pricing")
        return
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId: user.id }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoading(null)
    }
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
          {plans.map((plan) => (
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
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={!plan.priceId || loading === plan.priceId}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                    : plan.priceId
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white"
                    : "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                } ${loading === plan.priceId ? "opacity-50" : ""}`}
              >
                {loading === plan.priceId ? "Loading..." : plan.cta}
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
