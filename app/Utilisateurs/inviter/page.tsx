"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useUser } from "@/contexts/user-context"
import { createBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"
import { ArrowLeft, X } from "lucide-react"

type Role = "Lecture" | "Éditeur" | "Aucun accès"

export default function InviteUserPage() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("Éditeur")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [triedSubmit, setTriedSubmit] = useState(false)
  const { user } = useUser()
  const supabase = createBrowserClient()
  const router = useRouter()
  const [mailStatus, setMailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validateEmailField(value: string) {
    if (!value) return "L'adresse e-mail est requise"
    if (!isValidEmail(value)) return "Veuillez entrer une adresse e-mail valide"
    return ""
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setTriedSubmit(true)
    const error = validateEmailField(email)
    setEmailError(error)
    if (error || !role || !user) {
      return
    }
    setIsLoading(true)
    setMailStatus("idle")
    setMailStatus("sending")
    try {
      // Récupère le token de session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      // Appel à la nouvelle edge function (send_invitation ou creerInvitation)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            role_marketing: role,
          }),
        }
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setMailStatus("error")
        setEmailError(errorData?.error || "Erreur lors de l'envoi de l'invitation")
        toast.error(errorData?.error || "Erreur lors de l'envoi de l'invitation")
        return
      }
      setMailStatus("sent")
      setEmail("")
      setEmailError("")
      toast.success("Invitation envoyée avec succès !")
      setTimeout(() => {
        setMailStatus("idle")
        router.push("/Utilisateurs")
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setEmailError(validateEmailField(e.target.value))
    setTriedSubmit(false)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto mb-8 flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Inviter un utilisateur</h1>
            <p className="text-muted-foreground mt-3">Saisissez l'adresse e-mail et choisissez les droits d'accès pour inviter un nouveau membre dans votre espace.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="ml-4 mt-1 rounded-full transition-colors hover:bg-[#f4f4f5] hover:text-black focus:outline-none"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Détails de l'invitation</CardTitle>
            <CardDescription>
              L'utilisateur recevra un lien valable 3 jours pour rejoindre votre espace de travail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Adresse e-mail <span className="text-red-600">*</span>
                </Label>
                <div className="max-w-md w-full">
                  <Input
                    id="email"
                    type="text"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className="mt-1 w-full"
                    autoComplete="off"
                    onInvalid={e => e.preventDefault()}
                  />
                  {triedSubmit && emailError && (
                    <div className="text-red-500 text-sm mt-1">{emailError}</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Plateforme Marketing - Rôle</Label>
                <RadioGroup value={role} onValueChange={(value: Role) => setRole(value)} className="gap-4 pt-2">
                  <label
                    htmlFor="editeur"
                    className={`flex p-5 rounded-2xl border transition-all cursor-pointer w-full items-center ${role === "Éditeur" ? "bg-[#f4f2fd] border-[#a89af6]" : "bg-[#f9f9fb] border-[#e0e1e1] hover:border-[#bdbdbd]"}`}
                    style={{ minHeight: 72 }}
                  >
                    <RadioGroupItem value="Éditeur" id="editeur" className="mr-4 mt-1" />
                    <div className="font-normal w-full">
                      <p className="font-semibold">Éditeur</p>
                      <p className="text-sm text-muted-foreground">
                        L'utilisateur peut créer et gérer des campagnes, des contacts et des listes.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="lecture"
                    className={`flex p-5 rounded-2xl border transition-all cursor-pointer w-full items-center ${role === "Lecture" ? "bg-[#f4f2fd] border-[#a89af6]" : "bg-[#f9f9fb] border-[#e0e1e1] hover:border-[#bdbdbd]"}`}
                    style={{ minHeight: 72 }}
                  >
                    <RadioGroupItem value="Lecture" id="lecture" className="mr-4 mt-1" />
                    <div className="font-normal w-full">
                      <p className="font-semibold">Lecture</p>
                      <p className="text-sm text-muted-foreground">
                        L'utilisateur peut consulter toutes les campagnes, listes, contacts et statistiques, sans pouvoir les modifier.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="aucun"
                    className={`flex p-5 rounded-2xl border transition-all cursor-pointer w-full items-center ${role === "Aucun accès" ? "bg-[#f4f2fd] border-[#a89af6]" : "bg-[#f9f9fb] border-[#e0e1e1] hover:border-[#bdbdbd]"}`}
                    style={{ minHeight: 72 }}
                  >
                    <RadioGroupItem value="Aucun accès" id="aucun" className="mr-4 mt-1" />
                    <div className="font-normal w-full">
                      <p className="font-semibold">Aucun accès</p>
                      <p className="text-sm text-muted-foreground">
                        L'utilisateur n'aura pas accès à la plateforme marketing.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="flex justify-center">
                <Button type="submit" disabled={isLoading || mailStatus === 'sending'} className="bg-[#6c43e0] hover:bg-[#4f32a7] text-base py-3 max-w-md w-full">
                  {isLoading || mailStatus === 'sending' ? "Envoi en cours..." : mailStatus === 'sent' ? "Mail envoyé !" : "Envoyer l'invitation"}
                </Button>
              </div>
              {mailStatus === 'error' && emailError && (
                <div className="text-red-600 text-center mt-2 font-semibold">{emailError}</div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 