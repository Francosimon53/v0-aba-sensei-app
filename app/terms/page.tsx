import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service | ABA Sensei",
  description: "Terms of Service for ABA Sensei - AI-powered BCBA and RBT exam preparation platform.",
}

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-zinc-400">Last updated: January 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-zinc-300 leading-relaxed">
              Welcome to ABA Sensei. These Terms of Service ("Terms") govern your use of the ABA Sensei 
              website and application (collectively, the "Service"), operated by ABA Sensei ("we," "us," or "our"). 
              ABA Sensei is an AI-powered exam preparation tool designed to help users prepare for the 
              Board Certified Behavior Analyst (BCBA) and Registered Behavior Technician (RBT) certification exams.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Acceptance of Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              By accessing or using ABA Sensei, you agree to be bound by these Terms. If you do not agree 
              to these Terms, please do not use the Service. We reserve the right to modify these Terms at 
              any time, and your continued use of the Service constitutes acceptance of any modifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Description of Service</h2>
            <p className="text-zinc-300 leading-relaxed">
              ABA Sensei provides AI-powered practice questions, study materials, and personalized tutoring 
              to help users prepare for BCBA and RBT certification exams. Our Service includes:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li>AI-generated practice questions based on exam content areas</li>
              <li>Personalized AI tutor ("Sensei") for guided study sessions</li>
              <li>Performance tracking and analytics</li>
              <li>Study progress monitoring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. User Accounts</h2>
            <p className="text-zinc-300 leading-relaxed">
              To access certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li>Providing accurate and complete registration information</li>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">5. Important Disclaimer</h2>
            <p className="text-zinc-300 leading-relaxed">
              <strong className="text-white">ABA Sensei is a study aid and does not guarantee exam success.</strong> This 
              Service is not a substitute for formal education, supervised fieldwork, or official materials 
              provided by the Behavior Analyst Certification Board (BACB). Users should use ABA Sensei as 
              a supplementary study tool alongside their official preparation materials and coursework.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-zinc-300 leading-relaxed">
              All content, features, and functionality of ABA Sensei, including but not limited to text, 
              graphics, logos, questions, explanations, and software, are the exclusive property of ABA Sensei 
              and are protected by copyright, trademark, and other intellectual property laws. You may not 
              reproduce, distribute, modify, or create derivative works of any content without our express 
              written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. User Conduct</h2>
            <p className="text-zinc-300 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li>Share your account credentials with others</li>
              <li>Use automated tools to scrape, copy, or extract content from the Service</li>
              <li>Attempt to reverse engineer or decompile any part of the Service</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Share or distribute exam questions or content outside the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Payment Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              Certain features of ABA Sensei require a paid subscription. By subscribing to a paid plan:
            </p>
            <ul className="list-disc list-inside text-zinc-300 mt-3 space-y-2">
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Refunds are handled on a case-by-case basis; contact support for assistance</li>
              <li>Prices are subject to change with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-zinc-300 leading-relaxed">
              To the maximum extent permitted by law, ABA Sensei shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including but not limited to loss 
              of profits, data, or other intangible losses, resulting from your use or inability to use 
              the Service, exam results, or any other matter relating to the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>
            <p className="text-zinc-300 leading-relaxed">
              We reserve the right to suspend or terminate your account and access to the Service at our 
              sole discretion, without notice, for conduct that we believe violates these Terms or is 
              harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Changes to Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              We may update these Terms from time to time. We will notify you of any changes by posting 
              the new Terms on this page and updating the "Last updated" date. Your continued use of the 
              Service after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Contact Information</h2>
            <p className="text-zinc-300 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
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
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
