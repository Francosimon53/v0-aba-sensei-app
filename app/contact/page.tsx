'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Mail, MapPin, ArrowLeft } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Technical Support',
    message: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', subject: 'Technical Support', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <span className="text-2xl">🥋</span>
            <span className="font-semibold">ABA Sensei</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-zinc-400">Have questions? We're here to help.</p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Email Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-amber-500/30 transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold">Email Us</h3>
            </div>
            <a 
              href="mailto:support@abasensei.app"
              className="text-amber-400 hover:text-amber-300 text-lg font-medium mb-2 block"
            >
              support@abasensei.app
            </a>
            <p className="text-sm text-zinc-500">We respond within 24 hours</p>
          </div>

          {/* Location Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-amber-500/30 transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold">Location</h3>
            </div>
            <p className="text-lg font-medium mb-2">Ave Maria, Florida</p>
            <p className="text-sm text-zinc-500">Serving BCBAs & RBTs across the US</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10">
          <h2 className="text-2xl font-semibold mb-8">Send us a message</h2>

          {submitted && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-400">Thanks for your message! We'll get back to you soon.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white/80">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="bg-[#0a0a0f] border-white/20 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white/80">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="bg-[#0a0a0f] border-white/20 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Subject Dropdown */}
            <div className="grid gap-2">
              <Label htmlFor="subject" className="text-white/80">
                Subject
              </Label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="bg-[#0a0a0f] border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Technical Support">Technical Support</option>
                <option value="Billing Question">Billing Question</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Exam Prep Question">Exam Prep Question</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Message Field */}
            <div className="grid gap-2">
              <Label htmlFor="message" className="text-white/80">
                Message
              </Label>
              <textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help..."
                rows={5}
                className="bg-[#0a0a0f] border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold h-11 transition-all"
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-zinc-900 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥋</span>
              <span className="font-semibold text-white">ABA Sensei</span>
            </div>
            <span className="text-[10px] text-zinc-500 tracking-wide ml-7">by Simon Franco</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
          <p className="text-zinc-600 text-sm">© 2026 ABA Sensei. All rights reserved.</p>
        </div>

        {/* BACB Disclaimer */}
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-zinc-900">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            ABA Sensei is not affiliated with, endorsed by, or associated with the Behavior Analyst Certification Board (BACB). BCBA® and RBT® are registered trademarks of the BACB. This is an independent study tool and does not guarantee exam success.
          </p>
        </div>
      </footer>
    </div>
  )
}
