"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

function ErreurLienContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type")
  const reason = searchParams.get("reason")

  let title = "Lien invalide ou expiré"
  let message = "Le lien d'authentification est invalide ou a expiré. Veuillez recommencer la procédure."

  if (type === "recovery") {
    if (reason === "expired") {
      title = "Lien de réinitialisation expiré"
      message = "Le lien de réinitialisation de mot de passe a expiré. Veuillez demander un nouveau lien depuis la page 'Mot de passe oublié'."
    } else if (reason === "invalid") {
      title = "Lien de réinitialisation invalide"
      message = "Le lien de réinitialisation de mot de passe est invalide. Veuillez recommencer la procédure depuis la page 'Mot de passe oublié'."
    } else {
      title = "Lien de réinitialisation invalide ou expiré"
      message = "Le lien de réinitialisation de mot de passe n'est plus valide. Veuillez recommencer la procédure."
    }
  } else if (type === "signup") {
    if (reason === "expired") {
      title = "Lien de confirmation expiré"
      message = "Le lien de confirmation d'email a expiré. Veuillez recommencer la procédure d'inscription."
    } else if (reason === "invalid") {
      title = "Lien de confirmation invalide"
      message = "Le lien de confirmation d'email est invalide. Veuillez recommencer la procédure d'inscription."
    } else {
      title = "Lien d'inscription invalide ou expiré"
      message = "Le lien d'inscription n'est plus valide. Veuillez recommencer la procédure."
    }
  } else if (type === "invite") {
    if (reason === "expired") {
      title = "Lien d'invitation expiré"
      message = "Le lien d'invitation a expiré. Demandez à votre administrateur de vous renvoyer une invitation."
    } else if (reason === "invalid") {
      title = "Lien d'invitation invalide"
      message = "Le lien d'invitation est invalide. Demandez à votre administrateur de vous renvoyer une invitation."
    } else {
      title = "Lien d'invitation invalide ou expiré"
      message = "Le lien d'invitation n'est plus valide. Demandez une nouvelle invitation."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-red-700">{title}</h1>
        <p className="mb-2 text-gray-700">{message}</p>
      </div>
    </div>
  )
}

export default function ErreurLienPage() {
  return (
    <Suspense fallback={null}>
      <ErreurLienContent />
    </Suspense>
  )
} 