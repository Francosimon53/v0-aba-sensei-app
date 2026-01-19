"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { updateUserProfile } from "@/lib/supabase/progress"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [savedLanguage, setSavedLanguage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const lang = localStorage.getItem("aba_sensei_language")
    if (lang) {
      setSavedLanguage(lang)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login button clicked, starting login process")
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting to sign in with email:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.log("[v0] Login error:", error)
        throw error
      }

      console.log("[v0] Login successful, user:", data.user?.id)

      if (data.user && savedLanguage) {
        console.log("[v0] Updating user profile with language:", savedLanguage)
        const langCode: Record<string, string> = {
          English: "en",
          Español: "es",
          Português: "pt",
          Français: "fr",
        }
        await updateUserProfile(data.user.id, {
          preferred_language: langCode[savedLanguage] || "en",
        })
        // Clear saved language after use
        localStorage.removeItem("aba_sensei_language")
      }

      console.log("[v0] Redirecting to dashboard")
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.log("[v0] Login catch error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getLocalizedText = () => {
    const texts: Record<
      string,
      {
        title: string
        subtitle: string
        email: string
        password: string
        login: string
        noAccount: string
        signUp: string
        back: string
      }
    > = {
      English: {
        title: "ABA Sensei",
        subtitle: "Login to continue your training",
        email: "Email",
        password: "Password",
        login: "Login",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        back: "← Back to home",
      },
      Español: {
        title: "ABA Sensei",
        subtitle: "Inicia sesión para continuar tu entrenamiento",
        email: "Correo electrónico",
        password: "Contraseña",
        login: "Iniciar sesión",
        noAccount: "¿No tienes cuenta?",
        signUp: "Regístrate",
        back: "← Volver al inicio",
      },
      Português: {
        title: "ABA Sensei",
        subtitle: "Entre para continuar seu treinamento",
        email: "Email",
        password: "Senha",
        login: "Entrar",
        noAccount: "Não tem conta?",
        signUp: "Cadastre-se",
        back: "← Voltar ao início",
      },
      Français: {
        title: "ABA Sensei",
        subtitle: "Connectez-vous pour continuer votre formation",
        email: "Email",
        password: "Mot de passe",
        login: "Connexion",
        noAccount: "Pas de compte?",
        signUp: "S'inscrire",
        back: "← Retour à l'accueil",
      },
    }
    return texts[savedLanguage || "English"] || texts.English
  }

  const t = getLocalizedText()

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🥋</div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-white/60 mt-2">{t.subtitle}</p>
          {savedLanguage && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full">
              <span className="text-amber-400 text-sm">{savedLanguage}</span>
            </div>
          )}
        </div>

        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80">
                  {t.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0a0a0f] border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-white/80">
                  {t.password}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0a0a0f] border-white/20 text-white"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "..." : t.login}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-white/60">
              {t.noAccount}{" "}
              <Link href="/auth/sign-up" className="text-amber-400 hover:text-amber-300 underline underline-offset-4">
                {t.signUp}
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm">
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  )
}
