"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { refreshUserData } = useUser()
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [tempSignupData, setTempSignupData] = useState<{
    userId: string
    email: string
    password: string
  } | null>(null)

  useEffect(() => {
    // Récupérer les données temporaires du sessionStorage
    const tempData = sessionStorage.getItem("tempSignupData")
    if (!tempData) {
      router.replace("/signup")
      return
    }
    try {
      setTempSignupData(JSON.parse(tempData))
    } catch (error) {
      console.error("Erreur lors de la lecture des données temporaires:", error)
      router.replace("/signup")
    }
  }, [router])

  // Basic validation
  const validateForm = () => {
    if (formData.prenom.trim() === "") {
      setErrorMessage("Le prénom est requis")
      return false
    }
    if (formData.nom.trim() === "") {
      setErrorMessage("Le nom est requis")
      return false
    }
    if (formData.entreprise.trim() === "") {
      setErrorMessage("Le nom de l'entreprise est requis")
      return false
    }
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrorMessage("") // Effacer les messages d'erreur quand l'utilisateur modifie les champs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!validateForm() || !tempSignupData) {
      return
    }

    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      // Mettre à jour l'entrée existante dans la table Utilisateurs
      const { error: userError } = await supabase
        .from("Utilisateurs")
        .update({
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          entreprise: formData.entreprise.trim(),
        })
        .eq('id', tempSignupData.userId)

      if (userError) {
        console.error("Erreur lors de la mise à jour du profil:", userError)
        setErrorMessage("Erreur lors de l'enregistrement des informations")
        return
      }

      // Se connecter explicitement avec les identifiants stockés
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: tempSignupData.email,
        password: tempSignupData.password
      })

      if (signInError) {
        console.error("Erreur lors de la connexion:", signInError)
        setErrorMessage("Profil créé mais erreur lors de la connexion automatique")
        return
      }

      // Rafraîchir les données utilisateur dans le contexte
      await refreshUserData()

      // Nettoyer les données temporaires
      sessionStorage.removeItem("tempSignupData")

      // Redirection vers le tableau de bord
      router.replace("/accueil")
    } catch (err) {
      console.error("Erreur inattendue :", err)
      setErrorMessage("Une erreur est survenue lors de la mise à jour du profil")
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
            Plus qu&apos;une étape pour commencer à utiliser Sendora
          </p>
        </div>
      </div>

      {/* Right side - Complete profile form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-md">
            <img src="/Sendora.png" alt="Sendora Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sendora</h1>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Complétez votre profil</h2>
            <p className="mt-2 text-gray-600">Ajoutez vos informations pour personnaliser votre expérience</p>
          </div>

          <div className="rounded-xl bg-[#FFFEFF] p-8 shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                  Prénom <span className="text-red-600">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  />
                  {errorMessage === "Le prénom est requis" && (
                    <p className="absolute left-0 -bottom-5 text-xs text-red-600">Le prénom est requis</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom <span className="text-red-600">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formData.nom}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  />
                  {errorMessage === "Le nom est requis" && (
                    <p className="absolute left-0 -bottom-5 text-xs text-red-600">Le nom est requis</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="entreprise" className="block text-sm font-medium text-gray-700">
                  Entreprise <span className="text-red-600">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="entreprise"
                    name="entreprise"
                    type="text"
                    value={formData.entreprise}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  />
                  {errorMessage === "Le nom de l'entreprise est requis" && (
                    <p className="absolute left-0 -bottom-5 text-xs text-red-600">Le nom de l'entreprise est requis</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || formData.prenom.trim() === '' || formData.nom.trim() === '' || formData.entreprise.trim() === ''}
                  className="flex w-full justify-center rounded-xl border border-[#6c43e0] bg-[#6c43e0] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-[#4f32a7] hover:border-[#4f32a7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c43e0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Enregistrement..." : "Terminer l'inscription"}
                </button>
              </div>
            </form>

            {errorMessage && (
              <div className="mt-4 text-center text-sm text-red-600">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
