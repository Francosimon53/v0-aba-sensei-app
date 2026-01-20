// Forever free users who have unlimited access regardless of subscription tier
export const FOREVER_FREE_EMAILS = [
  "francosimon@hotmail.com",
  "jeanfrancosimon@hotmail.com",
]

// Check if an email has forever free access
export function isForeverFreeUser(email: string | undefined): boolean {
  if (!email) return false
  return FOREVER_FREE_EMAILS.includes(email.toLowerCase())
}
