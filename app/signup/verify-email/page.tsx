"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { createBrowserClient } from "@/lib/supabase"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const token = searchParams.get("token")
  const type = searchParams.get("type")
  const router = useRouter()
  const [resent, setResent] = useState(false)
  const [resentError, setResentError] = useState("")
  const [validated, setValidated] = useState(false)
  const [validating, setValidating] = useState(false)

  // Si token présent, on tente de valider l'email
  useEffect(() => {
    const validateToken = async () => {
      if (token && type) {
        setValidating(true)
        const supabase = createBrowserClient()
        if (type === 'email' && email) {
          const { error } = await supabase.auth.verifyOtp({ token, type: type as any, email })
          setValidating(false)
          if (!error) {
            setValidated(true)
            setTimeout(() => router.replace("/signup/complete-profile"), 1500)
          }
        } else {
          setValidating(false)
        }
      }
    }
    validateToken()
  }, [token, type, router])

  const handleResend = async () => {
    setResent(false)
    setResentError("")
    if (!email) return
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) {
        setResentError("Erreur lors de l'envoi du mail : " + error.message)
      } else {
        setResent(true)
      }
    } catch (err) {
      setResentError("Erreur lors de l'envoi du mail.")
    }
  }

  // Cas 1 : validation via token
  if (token && type) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          {validating ? (
            <>
              <h1 className="text-2xl font-bold mb-4">Validation en cours...</h1>
              <p className="mb-4">Merci de patienter.</p>
            </>
          ) : validated ? (
            <>
              <h1 className="text-2xl font-bold mb-4 text-green-700">Email validé !</h1>
              <p className="mb-4">Votre email a bien été confirmé.<br />Redirection vers la complétion du profil...</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4 text-red-700">Erreur de validation</h1>
              <p className="mb-4">Le lien de validation est invalide ou a expiré.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  // Cas 2 : attente de validation
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Vérifiez votre email</h1>
        <p className="mb-4">
          Un email de confirmation a été envoyé à <span className="font-semibold">{email}</span>.<br />
          Cliquez sur le lien reçu pour activer votre compte.
        </p>
        <button
          className="mt-2 px-4 py-2 bg-[#6c43e0] text-white rounded hover:bg-[#4f32a7] font-semibold"
          onClick={handleResend}
          disabled={resent}
        >
          {resent ? "Email renvoyé !" : "Renvoyer l'email"}
        </button>
        {resentError && <div className="mt-2 text-red-600 text-sm">{resentError}</div>}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-10 w-32 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 