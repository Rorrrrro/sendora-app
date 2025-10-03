"use client"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthConfirmRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Récupère tous les paramètres de l'URL
    const params = new URLSearchParams()
    for (const [key, value] of searchParams.entries()) {
      params.append(key, value)
    }
    // Redirige vers la vraie page de vérification email
    router.replace(`/inscription/verification-email?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Redirection...</h1>
        <p className="mb-4">Merci de patienter, nous vérifions votre email.</p>
      </div>
    </div>
  )
}
