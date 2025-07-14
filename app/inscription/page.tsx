"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { signIn, signOut } from "next-auth/react";

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
            {/* Affiche une erreur NextAuth si présente (ex: email déjà existant) */}
            {errorParam === 'AccessDenied' && (
              <div className="mb-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">Un compte existe déjà avec cet email Google. Veuillez vous connecter.</p>
              </div>
            )}
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
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#FFFEFF] px-2 text-gray-500">Ou continuer avec</span>
                </div>
              </div>
              <button
                type="button"
                id="google-signup"
                className="flex w-full justify-center rounded-md border border-gray-300 bg-[#FFFEFF] px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 mb-4"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await signOut({ redirect: false });
                    await signIn('google', { callbackUrl: '/inscription/completer-profil' });
                  } catch (err) {
                    setErrorMessage("Erreur lors de l'inscription avec Google");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2" height="18" viewBox="0 0 24 24" width="18">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                S'inscrire avec Google
              </button>
              <p className="text-sm text-gray-600">
                Déjà un compte ?{" "}
                <Link href="/connexion" className="font-medium text-[#6c43e0] hover:text-[#4f32a7]">
                  Se connecter
                </Link>
              </p>
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
