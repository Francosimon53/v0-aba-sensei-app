import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | ABA Sensei",
  description: "Privacy Policy for ABA Sensei - Learn how we collect, use, and protect your data.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🥋</span>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-zinc-400">Last updated: January 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-zinc-300 leading-relaxed">
              ABA Sensei ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              AI-powered exam preparation platform for BCBA and RBT certification exams.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="text-zinc-300 leading-relaxed">We collect the following types of information:</p>
            
            <h3 className="text-lg font-medium text-white mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-2">
              <li><strong className="text-white">Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong className="text-white">Profile Information:</strong> Exam type preference (BCBA/RBT), language preference</li>
              <li><strong className="text-white">Payment Information:</strong> Billing details processed securely through Stripe (we do not store full credit card numbers)</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">Usage Information</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-2">
              <li>Questions answered and performance data</li>
              <li>Study session duration and frequency</li>
              <li>Progress tracking and achievement data</li>
              <li>Device information and browser type</li>
              <li>IP address and approximate location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-zinc-300 leading-relaxed">We use your information to:</p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Personalize your study experience and AI tutor interactions</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important service updates and notifications</li>
              <li>Send promotional emails (with your consent, which you can withdraw at any time)</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <p className="text-zinc-300 leading-relaxed">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li><strong className="text-white">Database:</strong> Supabase (PostgreSQL) with encryption at rest and in transit</li>
              <li><strong className="text-white">Authentication:</strong> Secure token-based authentication with encrypted passwords</li>
              <li><strong className="text-white">Hosting:</strong> Vercel with enterprise-grade security</li>
              <li><strong className="text-white">Payments:</strong> Stripe PCI-DSS compliant payment processing</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              While we implement safeguards to protect your information, no method of transmission over the 
              Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="text-zinc-300 leading-relaxed">
              We use trusted third-party services to operate ABA Sensei:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li><strong className="text-white">Stripe:</strong> Payment processing and subscription management</li>
              <li><strong className="text-white">Supabase:</strong> Database and authentication services</li>
              <li><strong className="text-white">Vercel:</strong> Hosting and deployment</li>
              <li><strong className="text-white">OpenAI/Anthropic:</strong> AI models for question generation and tutoring</li>
              <li><strong className="text-white">Resend:</strong> Transactional email delivery</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-zinc-300 leading-relaxed">
              We use essential cookies to:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences (language, exam type)</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              We may use analytics tools to understand how users interact with our Service. You can 
              control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="text-zinc-300 leading-relaxed">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-white">Correction:</strong> Request correction of inaccurate data</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data</li>
              <li><strong className="text-white">Export:</strong> Request your data in a portable format</li>
              <li><strong className="text-white">Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:support@abasensei.app" className="text-amber-400 hover:underline">support@abasensei.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p className="text-zinc-300 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to 
              provide services. If you delete your account, we will delete or anonymize your personal 
              information within 30 days, except where we are required to retain it for legal or 
              legitimate business purposes.
            </p>
          </section>

          <section className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">9. Children's Privacy</h2>
            <p className="text-zinc-300 leading-relaxed">
              ABA Sensei is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If you are a parent or guardian and believe 
              your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-zinc-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your information in accordance 
              with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-zinc-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date. We 
              encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-zinc-300 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-amber-400 mt-3">
              <a href="mailto:support@abasensei.app" className="hover:underline">support@abasensei.app</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
            <p>&copy; 2025 ABA Sensei. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
