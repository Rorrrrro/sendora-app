"use client"
import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const emailRaw = searchParams.get("email")
  const email = emailRaw ? decodeURIComponent(emailRaw) : null
  // Ajout : support du paramètre token_hash (cas Outlook/Supabase)
  const token = searchParams.get("token") || searchParams.get("token_hash")
  const type = searchParams.get("type")
  const router = useRouter()
  const [resent, setResent] = useState(true)
  const [resentError, setResentError] = useState("")
  const [validated, setValidated] = useState(false)
  const [validating, setValidating] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [localBlock, setLocalBlock] = useState(false)

  // Gestion du cooldown (compte à rebours)
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Gestion du blocage local après clic (anti-spam)
  useEffect(() => {
    if (localBlock) {
      const timer = setTimeout(() => setLocalBlock(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [localBlock])

  // Si token présent, on tente de valider l'email
  useEffect(() => {
    const validateToken = async () => {
      if (token && type) {
        setValidating(true)
        const supabase = createBrowserClient()
        if ((type === 'email' || type === 'signup') && email) {
          const { error } = await supabase.auth.verifyOtp({ token, type: "signup", email })
          setValidating(false)
          if (!error) {
            setValidated(true)
            setTimeout(() => router.replace("/inscription/completer-profil"), 1500)
          } else {
            // Redirection vers la page erreur-lien en cas d'échec
            router.replace(`/erreur-lien?type=signup&reason=expired`)
          }
        } else {
          setValidating(false)
          router.replace(`/erreur-lien?type=signup&reason=invalid`)
        }
      }
    }
    validateToken()
  }, [token, type, router, email])

  const handleResend = async () => {
    // Appliquer le blocage local uniquement si on clique sur 'Renvoyer l'email'
    if (!(resent && cooldown > 0 && !resentError)) {
      setLocalBlock(true)
    }
    setResent(false)
    setResentError("")
    if (!email) return
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) {
        // Traduction du message d'attente Supabase
        const match = error.message.match(/can only request this after (\d+) seconds?\./)
        if (match) {
          setCooldown(Number(match[1]))
          setResentError(`Vous devez attendre ${match[1]} secondes avant de pouvoir renvoyer un email de confirmation.`)
        } else {
          setResentError("Erreur lors de l'envoi du mail : " + error.message)
        }
      } else {
        setResent(true)
        setCooldown(60) // Cooldown par défaut si pas d'erreur (ajuste si besoin)
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
        <div className="flex flex-col items-center">
          <button
            className={`mt-2 min-w-[180px] px-4 py-2 rounded font-semibold
              ${resent && cooldown > 0 && !resentError ? 'bg-green-600 text-white' : 'bg-[#6c43e0] text-white'}
              ${cooldown === 0 && !(resent && cooldown > 0 && !resentError) ? 'hover:bg-[#4f32a7] cursor-pointer' : ''}
            `}
            style={{ display: 'block', margin: '0 auto', opacity: (resent && cooldown > 0 && !resentError) ? 1 : undefined, cursor: (resent && cooldown > 0 && !resentError) ? 'default' : undefined }}
            onClick={handleResend}
            disabled={cooldown > 0 || localBlock}
            tabIndex={cooldown > 0 || localBlock ? -1 : 0}
          >
            {resent && cooldown > 0 && !resentError ? "Email envoyé !" : "Renvoyer l'email"}
          </button>
          {resent && cooldown > 0 && !resentError && (
            <div className="mt-2 text-gray-700 text-sm">Vous pourrez renvoyer un email dans {cooldown} seconde{cooldown > 1 ? 's' : ''}.</div>
          )}
          {resentError && <div className="mt-2 text-red-600 text-sm">{resentError}</div>}
        </div>
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