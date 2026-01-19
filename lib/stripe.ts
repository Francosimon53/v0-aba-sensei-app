import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    price: 0,
    features: [
      "5 practice questions per day",
      "Basic progress tracking",
      "Access to study mode",
    ],
  },
  pro_monthly: {
    name: "Pro Monthly",
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    price: 19,
    features: [
      "Unlimited practice questions",
      "AI Sensei tutor access",
      "Detailed analytics",
      "All exam categories",
      "Priority support",
    ],
  },
  pro_annual: {
    name: "Pro Annual",
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL!,
    price: 149,
    features: [
      "Everything in Pro Monthly",
      "2 months free (save 35%)",
      "Exam simulation mode",
      "Performance reports",
    ],
  },
  team: {
    name: "Team",
    priceId: process.env.STRIPE_PRICE_TEAM!,
    price: 99,
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Admin dashboard",
      "Team analytics",
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
