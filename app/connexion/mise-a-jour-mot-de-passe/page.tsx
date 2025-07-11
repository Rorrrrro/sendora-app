"use client"

import React, { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

function UpdatePasswordPageContent() {
  const searchParams = useSearchParams()
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

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
            Sécurisez votre compte avec un nouveau mot de passe
          </p>
        </div>
      </div>

      {/* Right side - Update password form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <img src="/Sendora.png" alt="Sendora Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sendora</h1>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Nouveau mot de passe</h2>
            <p className="mt-2 text-gray-600">Choisissez un nouveau mot de passe sécurisé</p>
          </div>

          <UpdatePasswordForm token_hash={token_hash!} />
        </div>
      </div>
    </div>
  )
}

function UpdatePasswordForm({ token_hash }: { token_hash: string }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const isPasswordStrong = password.length >= 8
  const showPasswordError = isSubmitted && !isPasswordStrong

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsSubmitted(true)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setMessage("Votre mot de passe a été mis à jour avec succès")
      setTimeout(() => {
        window.location.href = "/connexion"
      }, 2000)
    } catch (err) {
      let msg = "Une erreur est survenue lors de la mise à jour du mot de passe"
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        msg = err.message
        if (msg.includes("New password should be different from the old password")) {
          msg = "Le nouveau mot de passe doit être différent de l'ancien mot de passe."
        }
      }
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-[#FFFEFF] p-8 shadow-lg">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nouveau mot de passe <span className="text-red-600">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="mt-2 text-xs">
            <div className={`flex items-center ${showPasswordError ? "text-red-600" : isPasswordStrong ? "text-green-600" : "text-gray-500"}`}>
              <span className={`mr-1 ${showPasswordError ? "text-red-600" : isPasswordStrong ? "text-green-600" : "text-gray-400"}`}>{isPasswordStrong ? "✓" : "○"}</span>
              Le mot de passe doit contenir au moins 8 caractères
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmer le mot de passe <span className="text-red-600">*</span>
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-xl border border-[#6c43e0] bg-[#6c43e0] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-[#4f32a7] hover:border-[#4f32a7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c43e0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </div>
  )
}

export default function UpdatePasswordPageWrapper() {
  return (
    <Suspense fallback={null}>
      <UpdatePasswordPageContent />
    </Suspense>
  )
} 