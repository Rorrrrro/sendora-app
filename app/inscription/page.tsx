"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { signIn } from "next-auth/react"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams?.get("token") ?? null;
  const errorParam = searchParams?.get("error")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [inviter, setInviter] = useState<{ prenom: string; nom: string } | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string>("")

  // Basic validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordStrong = (password: string) => password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)

  const validateForm = () => {
    const newErrors = {
      email: !isValidEmail(formData.email) ? "Veuillez entrer une adresse email valide" : "",
      password: !isPasswordStrong(formData.password) ? "" : "",
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "") && isPasswordStrong(formData.password)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "email") {
      if (value.includes("@")) {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsSubmitted(true)

    if (!validateForm()) {
      // Les erreurs sont déjà affichées en temps réel
      return
    }

    setIsLoading(true)

    try {
      // --- Vérification email déjà utilisé via edge function ---
      try {
        const res = await fetch("https://fvcizjojzlteryioqmwb.supabase.co/functions/v1/check_email_exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        if (!res.ok) {
          throw new Error("Erreur réseau ou serveur Supabase");
        }
        const { exists } = await res.json();
        if (exists) {
          setErrorMessage("Cet email est déjà utilisé.");
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setErrorMessage("Impossible de vérifier l'email (problème réseau ou serveur).");
        setIsLoading(false);
        return;
      }
      // --- Fin vérification ---

      // Créer l'utilisateur dans Supabase Auth
      const { data, error: signUpError } = await createBrowserClient().auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: "https://www.sendora.fr/inscription/completer-profil"
        }
      })

      const msg = signUpError?.message?.toLowerCase() || "";
      if (signUpError) {
        if (
          msg.includes("already") ||
          msg.includes("existe") ||
          msg.includes("in use") ||
          msg.includes("registered")
        ) {
          setErrorMessage("Cet email est déjà utilisé.");
        } else {
          setErrorMessage(signUpError.message || "Erreur lors de la création du compte");
        }
        return;
      }

      if (!data.user) {
        setErrorMessage("Erreur lors de la création du compte")
        return
      }

      // Stocker l'ID de l'utilisateur pour le formulaire suivant
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("tempSignupData", JSON.stringify({
          userId: data.user.id,
          email: formData.email,
          password: formData.password
        }))
      }

      // Redirection vers la page de vérification d'email
      await router.replace(`/inscription/verification-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      console.error("Erreur inattendue :", err)
      setErrorMessage("Une erreur est survenue lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationToken) return
      const supabase = createBrowserClient()
      // Cherche l'invitation par token
      const { data: invitation } = await supabase
        .from("Invitations")
        .select("email_invite, compte_parent_id")
        .eq("token", invitationToken)
        .single()
      if (invitation) {
        setInvitedEmail(invitation.email_invite)
        // Cherche le compte parent pour prénom/nom
        const { data: parent } = await supabase
          .from("Utilisateurs")
          .select("prenom, nom")
          .eq("id", invitation.compte_parent_id)
          .single()
        if (parent) {
          setInviter({ prenom: parent.prenom, nom: parent.nom })
        }
      }
    }
    fetchInvitation()
  }, [invitationToken])

  // SUPPRIMER tout le code du bouton Google et la logique associée (signOut, signInWithOAuth, useEffect post-Google, etc.)

  // Ajout d'une variable pour savoir si le bouton doit être désactivé
  const isFormEmpty = !formData.email || !formData.password;
  const showPasswordError = isSubmitted && !isPasswordStrong(formData.password);

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
            Rejoignez des milliers d&apos;utilisateurs et lancez vos campagnes email dès aujourd&apos;hui
          </p>
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-md">
            <img src="/Sendora.png" alt="Sendora Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sendora</h1>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Message d'invitation */}
          {inviter && (
            <div className="mb-6 rounded-lg bg-[#f4f2fd] border border-[#a89af6] p-4 text-center text-[#6c43e0] font-medium">
              Vous avez été invité par {inviter.prenom} {inviter.nom}
            </div>
          )}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
            <p className="mt-2 text-gray-600">Commencez à utiliser Sendora gratuitement</p>
          </div>

          <div className="rounded-xl bg-[#FFFEFF] p-8 shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit} id="signup-form">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email <span className="text-red-600">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="email"
                    required
                    value={invitedEmail || formData.email}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                    readOnly={!!invitedEmail}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  {errorMessage === "Cet email est déjà utilisé." && (
                    <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe <span className="text-red-600">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                    placeholder=""
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                    id="toggle-password"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 text-xs">
                  <div className={`flex items-center ${showPasswordError ? "text-red-600" : isPasswordStrong(formData.password) ? "text-green-600" : "text-gray-500"}`}>
                    <span className={`mr-1 ${showPasswordError ? "text-red-600" : isPasswordStrong(formData.password) ? "text-green-600" : "text-gray-400"}`}>{isPasswordStrong(formData.password) ? "✓" : "○"}</span>
                    Au moins 8 caractères, 1 majuscule et 1 chiffre.
                  </div>
                </div>
              </div>

              {errorMessage && errorMessage !== "Cet email est déjà utilisé." && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-xl border border-[#6c43e0] bg-[#6c43e0] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-[#4f32a7] hover:border-[#4f32a7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c43e0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Création du compte..." : "Créer un compte"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#FFFEFF] px-2 text-gray-500">Ou continuer avec</span>
                </div>
              </div>
              <div className="mt-6 text-center text-sm text-gray-500">
                🚀 La connexion Google sera bientôt disponible !
              </div>
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Déjà un compte ?</span>{" "}
                <Link href="/connexion" className="underline text-[#6c43e0] hover:text-[#4f32a7] font-semibold text-sm">
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden w-1/2 bg-primary/10 lg:block">
          <div className="flex h-full flex-col items-center justify-center p-12">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#FFFEFF] shadow-md">
              <img src="/Sendora.png" alt="Sendora Logo" className="h-24 w-auto" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Sendora</h1>
            <p className="mt-2 text-center text-lg text-gray-600">
              Rejoignez des milliers d&apos;utilisateurs et lancez vos campagnes email dès aujourd&apos;hui
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-md">
              <img src="/Sendora.png" alt="Sendora Logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Sendora</h1>
          </div>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
              <p className="mt-2 text-gray-600">Commencez à utiliser Sendora gratuitement</p>
            </div>
            <div className="rounded-xl bg-[#FFFEFF] p-8 shadow-lg">
              <div className="space-y-6">
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                  <div className="h-10 w-full bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                  <div className="h-10 w-full bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
