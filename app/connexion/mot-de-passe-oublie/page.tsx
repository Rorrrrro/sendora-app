  "use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Basic validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidEmail(email)) {
      setError("Veuillez entrer une adresse email valide")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await createBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/connexion/mise-a-jour-mot-de-passe` : undefined,
      })

      if (error) {
        if (error.message && error.message.includes('For security purposes, you can only request this after')) {
          const match = error.message.match(/after (\d+) seconds?\./)
          if (match) {
            const secondes = Number(match[1]);
            setError(`Pour des raisons de sécurité, vous ne pouvez demander un nouveau lien que dans ${secondes} seconde${secondes > 1 ? 's' : ''}.`)
          } else {
            setError("Pour des raisons de sécurité, vous ne pouvez demander un nouveau lien que dans quelques instants. Veuillez patienter avant de réessayer.")
          }
        } else {
          setError(error.message)
        }
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err)
      setError("Une erreur est survenue lors de l'envoi du lien de réinitialisation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Logo and branding */}
      <div className="hidden w-1/2 bg-primary/10 lg:block">
        <div className="flex h-full flex-col items-center justify-center p-12">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#FFFEFF] shadow-md">
            <img src="/Sendora.png" alt="Sendora Logo" className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Sendora</h1>
          <p className="mt-2 text-center text-lg text-gray-600">
            Récupérez l&apos;accès à votre compte en quelques instants
          </p>
        </div>
      </div>

      {/* Right side - Reset password form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-md">
            <img src="/Sendora.png" alt="Sendora Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sendora</h1>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Réinitialiser le mot de passe</h2>
            <p className="mt-2 text-gray-600">Entrez votre adresse email pour recevoir un lien de réinitialisation</p>
          </div>

          <div className="rounded-xl bg-[#FFFEFF] p-8 shadow-lg">
            {!submitted ? (
              <form className="space-y-6" onSubmit={handleSubmit} id="reset-password-form">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Adresse email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (e.target.value.includes("@")) {
                          setError("")
                        }
                      }}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                      placeholder="votre@email.com"
                    />
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    id="submit-reset"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-xl border border-[#6c43e0] bg-[#6c43e0] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-[#4f32a7] hover:border-[#4f32a7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c43e0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Email envoyé</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Si un compte existe avec l&apos;adresse {email}, vous recevrez un email avec les instructions pour
                  réinitialiser votre mot de passe.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("")
                      setSubmitted(false)
                    }}
                    className="text-sm font-medium text-[#6c43e0] hover:text-[#4f32a7] transition-colors"
                  >
                    Essayer une autre adresse email
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <Link href="/connexion" className="underline text-[#6c43e0] hover:text-[#4f32a7] font-semibold text-sm">
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
