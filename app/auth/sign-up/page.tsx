"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(
        savedLanguage === "Español"
          ? "Las contraseñas no coinciden"
          : savedLanguage === "Português"
            ? "As senhas não coincidem"
            : savedLanguage === "Français"
              ? "Les mots de passe ne correspondent pas"
              : "Passwords do not match",
      )
      setIsLoading(false)
      return
    }

    const langCode: Record<string, string> = {
      English: "en",
      Español: "es",
      Português: "pt",
      Français: "fr",
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/study`,
          data: {
            full_name: fullName,
            preferred_language: langCode[savedLanguage || "English"] || "en",
          },
        },
      })
      if (error) throw error

      // Clear saved language after signup
      localStorage.removeItem("aba_sensei_language")
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
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
        fullName: string
        email: string
        password: string
        repeatPassword: string
        signUp: string
        hasAccount: string
        login: string
        back: string
      }
    > = {
      English: {
        title: "ABA Sensei",
        subtitle: "Create your account",
        fullName: "Full Name",
        email: "Email",
        password: "Password",
        repeatPassword: "Repeat Password",
        signUp: "Sign up",
        hasAccount: "Already have an account?",
        login: "Login",
        back: "← Back to home",
      },
      Español: {
        title: "ABA Sensei",
        subtitle: "Crea tu cuenta",
        fullName: "Nombre completo",
        email: "Correo electrónico",
        password: "Contraseña",
        repeatPassword: "Repetir contraseña",
        signUp: "Registrarse",
        hasAccount: "¿Ya tienes cuenta?",
        login: "Iniciar sesión",
        back: "← Volver al inicio",
      },
      Português: {
        title: "ABA Sensei",
        subtitle: "Crie sua conta",
        fullName: "Nome completo",
        email: "Email",
        password: "Senha",
        repeatPassword: "Repetir senha",
        signUp: "Cadastrar",
        hasAccount: "Já tem conta?",
        login: "Entrar",
        back: "← Voltar ao início",
      },
      Français: {
        title: "ABA Sensei",
        subtitle: "Créez votre compte",
        fullName: "Nom complet",
        email: "Email",
        password: "Mot de passe",
        repeatPassword: "Répéter le mot de passe",
        signUp: "S'inscrire",
        hasAccount: "Vous avez déjà un compte?",
        login: "Connexion",
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
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-white/80">
                  {t.fullName}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={
                    savedLanguage === "Español"
                      ? "Tu nombre"
                      : savedLanguage === "Português"
                        ? "Seu nome"
                        : savedLanguage === "Français"
                          ? "Votre nom"
                          : "Your name"
                  }
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#0a0a0f] border-white/20 text-white placeholder:text-white/40"
                />
              </div>
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
              <div className="grid gap-2">
                <Label htmlFor="repeat-password" className="text-white/80">
                  {t.repeatPassword}
                </Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="bg-[#0a0a0f] border-white/20 text-white"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "..." : t.signUp}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm text-white/60">
              {t.hasAccount}{" "}
              <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 underline underline-offset-4">
                {t.login}
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
