"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsSubmitted(true)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data, error: signUpError } = await createBrowserClient().auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          setErrorMessage("Cet email est déjà utilisé.")
        } else {
          setErrorMessage(signUpError.message || "Erreur lors de la création du compte")
        }
        return
      }

      if (!data.user) {
        setErrorMessage("Erreur lors de la création du compte")
        return
      }

      // Stocker l'ID de l'utilisateur pour le formulaire suivant
      sessionStorage.setItem("tempSignupData", JSON.stringify({
        userId: data.user.id,
        email: formData.email,
        password: formData.password
      }))

      // Redirection vers la page de complétion du profil
      await router.replace("/complete-profile")
    } catch (err) {
      console.error("Erreur inattendue :", err)
      setErrorMessage("Une erreur est survenue lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Logo and branding */}
      <div className="hidden w-1/2 bg-primary/10 lg:block">
        <div className="flex h-full flex-col items-center justify-center p-12">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-md">
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
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
            <p className="mt-2 text-gray-600">Commencez à utiliser Sendora gratuitement</p>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit} id="signup-form">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full appearance-none rounded-md border ${
                      !isPasswordStrong(formData.password) && formData.password.length > 0 && isSubmitted
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-primary focus:ring-primary"
                    } px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                    id="toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div 
                  id="password-info" 
                  className={`mt-1 text-xs ${
                    !isPasswordStrong(formData.password) && formData.password.length > 0 && isSubmitted
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  id="submit-signup"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Inscription en cours..." : "S'inscrire"}
                </button>
              </div>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Ou continuer avec</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  id="google-signup"
                  className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
                      fill="#4285F4"
                    />
                  </svg>
                  S&apos;inscrire avec Google
                </button>
              </div>
            </form>

            {errorMessage && (
              <div id="error-msg" className="mt-4 text-center text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Vous avez déjà un compte?</span>{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
