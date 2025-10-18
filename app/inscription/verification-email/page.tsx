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
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")

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
        // Utilise le type reçu dans l'URL (email OU signup)
        if ((type === 'email' || type === 'signup') && email) {
          const { error } = await supabase.auth.verifyOtp({ token, type, email })
          setValidating(false)
          if (!error) {
            setValidated(true)
            setTimeout(() => router.replace("/inscription/completer-profil"), 1500)
          } else {
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

  const handleOtpVerify = async () => {
    setOtpLoading(true)
    setOtpError("")
    if (!email || otpCode.length !== 6) {
      setOtpError("Veuillez entrer le code à 6 chiffres.")
      setOtpLoading(false)
      return
    }
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.verifyOtp({ token: otpCode, type: "signup", email })
      if (!error) {
        setValidated(true)
        // Création de la ligne utilisateur dans la table Utilisateurs
        try {
          let tries = 0
          let user = null
          while (!user && tries < 20) {
            const { data } = await supabase.auth.getUser()
            user = data?.user
            if (!user) {
              await new Promise(r => setTimeout(r, 100))
              tries++
            }
          }
          if (user) {
            await supabase
              .from("Utilisateurs")
              .insert([{ email: user.email }])
          }
        } catch (err) {
          console.error("Erreur création ligne Utilisateurs après OTP :", err)
        }
        // NE PAS remettre otpLoading à false ici
        setTimeout(() => {
          window.location.href = "/inscription/completer-profil"
        }, 1500)
      } else {
        setOtpLoading(false)
        setOtpError("Code invalide ou expiré.")
      }
    } catch {
      setOtpLoading(false)
      setOtpError("Erreur lors de la vérification.")
    }
  }

  // Cas 1 : validation via token
  if (token && type) {
    // Ne rien retourner ici, on laisse la logique de redirection gérer la suite
    return null
  }

  // Cas 2 : attente de validation
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Vérifiez votre email</h1>
        <p className="mb-4">
          Un email de confirmation a été envoyé à <span className="font-semibold">{email}</span>.<br />
          Veuillez saisir le code à 6 chiffres reçu par email.
        </p>
        <div className="flex flex-col items-center">
          {/* Champ OTP + bouton valider */}
          <div className="mt-2 w-full">
            <input
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full mb-2 px-4 py-2 border border-gray-300 rounded text-center bg-white transition-colors focus:border-[#6c43e0] hover:border-[#6c43e0] focus:outline-none"
              placeholder="Code à 6 chiffres"
              maxLength={6}
              inputMode="numeric"
            />
            <button
              type="button"
              disabled={otpLoading || otpCode.length !== 6}
              className={`flex w-full justify-center rounded-xl border border-[#6c43e0] bg-[#6c43e0] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-[#4f32a7] hover:border-[#4f32a7] transition-colors focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleOtpVerify}
            >
              {otpLoading ? "Vérification..." : "Valider le code"}
            </button>
            {otpError && <div className="mt-2 text-red-600">{otpError}</div>}
          </div>
          {/* Espace entre les boutons */}
          <div style={{ height: 20 }} />
          {/* Texte cliquable pour renvoyer l'email */}
          {resent && cooldown > 0 && !resentError ? (
            <div className="font-semibold underline text-[#6c43e0] text-base text-center select-none">
              Email envoyé !
            </div>
          ) : (
            <div
              className="font-semibold underline text-[#6c43e0] text-base text-center cursor-pointer hover:text-[#4f32a7]"
              style={{ userSelect: "none" }}
              onClick={handleResend}
              tabIndex={0}
              role="button"
            >
              Renvoyer l'email
            </div>
          )}
          {resent && cooldown > 0 && !resentError && (
            <div className="mt-2 text-gray-700 text-sm">
              Vous pourrez renvoyer un email dans {cooldown} seconde{cooldown > 1 ? 's' : ''}.
            </div>
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