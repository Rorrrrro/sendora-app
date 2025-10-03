"use client"
import React, { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// Composant qui gère la redirection
function ConfirmRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    // Conversion token_hash -> token pour la compatibilité
    const token_hash = searchParams.get("token_hash")
    if (token_hash) params.append("token", token_hash)
    
    // Copie tous les autres paramètres (type, email, etc.)
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (key !== "token_hash") params.append(key, value)
    }
    
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

// Page avec Suspense pour Next.js App Router
export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
        </div>
      </div>
    }>
      <ConfirmRedirect />
    </Suspense>
  )
}
