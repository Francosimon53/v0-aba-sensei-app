import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-6">📧</div>
        <h1 className="text-2xl font-bold text-white mb-4">Check your email</h1>
        <p className="text-white/60 mb-8">
          We sent you a confirmation link. Please check your email to complete your registration.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
