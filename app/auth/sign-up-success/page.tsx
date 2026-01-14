"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function SignUpSuccessPage() {
  const [language, setLanguage] = useState<string>("English")

  useEffect(() => {
    const savedLang = localStorage.getItem("aba_sensei_language")
    if (savedLang) {
      setLanguage(savedLang)
    }
  }, [])

  const getLocalizedText = () => {
    const texts: Record<string, { title: string; message: string; button: string }> = {
      English: {
        title: "Check your email",
        message: "We sent you a confirmation link. Please check your email to complete your registration.",
        button: "Back to Login",
      },
      Español: {
        title: "Revisa tu correo",
        message: "Te enviamos un enlace de confirmación. Por favor revisa tu correo para completar tu registro.",
        button: "Volver a iniciar sesión",
      },
      Português: {
        title: "Verifique seu email",
        message: "Enviamos um link de confirmação. Por favor, verifique seu email para completar seu cadastro.",
        button: "Voltar ao login",
      },
      Français: {
        title: "Vérifiez votre email",
        message:
          "Nous vous avons envoyé un lien de confirmation. Veuillez vérifier votre email pour terminer votre inscription.",
        button: "Retour à la connexion",
      },
    }
    return texts[language] || texts.English
  }

  const t = getLocalizedText()

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-6">📧</div>
        <h1 className="text-2xl font-bold text-white mb-4">{t.title}</h1>
        <p className="text-white/60 mb-8">{t.message}</p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all"
        >
          {t.button}
        </Link>
      </div>
    </div>
  )
}
