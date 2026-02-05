import { createHash } from "crypto"

const PIXEL_ID = process.env.META_PIXEL_ID!
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN!

export function hashSHA256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

interface MetaEventPayload {
  event_name: string
  event_id: string
  event_time: number
  event_source_url?: string
  action_source: "website"
  user_data: {
    em?: string[]
    fbc?: string
    fbp?: string
  }
  custom_data?: {
    value?: number
    currency?: string
  }
}

export async function sendMetaConversionEvent(payload: MetaEventPayload) {
  try {
    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [payload],
        access_token: ACCESS_TOKEN,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Meta CAPI error:", response.status, errorBody)
    }
  } catch (error) {
    console.error("Meta CAPI request failed:", error)
  }
}
