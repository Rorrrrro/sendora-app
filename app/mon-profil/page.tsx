"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppLayout } from "@/components/dashboard-layout"
import { useUser } from "@/contexts/user-context"
import { createBrowserClient } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { callSendyEdgeFunction } from "@/lib/sendyEdge";

// Palette de couleurs pastel claires pour les avatars
const avatarColors = [
  '#BFD7FF', // bleu pastel
  '#C8F7DC', // vert pastel
  '#FFD6E0', // rose pastel
  '#FDF6B2', // jaune pastel
  '#E2D6FF', // violet pastel
  '#FFE5B4', // pêche pastel
  '#D1F2EB', // turquoise pastel
  '#F9D5FF', // lilas pastel
  '#FFF2CC', // crème pastel
  '#D6F5D6'  // vert menthe pastel
];

const avatarColorNames = [
  'Bleu',
  'Vert',
  'Rose',
  'Jaune',
  'Violet',
  'Pêche',
  'Turquoise',
  'Lilas',
  'Crème',
  'Menthe'
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function MonProfilPage() {
  const { user, refreshUserData, isLoading, customAvatarColor, setCustomAvatarColor } = useUser()
  const supabase = createBrowserClient()
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    entreprise: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState({ type: "", text: "" })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" })

  // Update form data when user data is loaded
  useEffect(() => {
    if (user && !isLoading) {
      setFormData({
        prenom: user.prenom || "",
        nom: user.nom || "",
        email: user.email || "",
        entreprise: user.entreprise || "",
      })
    }
  }, [user, isLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return

    setIsUpdating(true)
    setUpdateMessage({ type: "", text: "" })

    try {
      // Update user profile in Supabase
      const { error } = await supabase
        .from("Utilisateurs")
        .update({
          prenom: formData.prenom,
          nom: formData.nom,
          entreprise: formData.entreprise,
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      // Refresh user data in context
      await refreshUserData()

      // === Appel Edge Function pour synchro Sendy (utilitaire factorisé) ===
      try {
        await callSendyEdgeFunction("sync-sendy-brand-update", {
          id: user.id,
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          entreprise: formData.entreprise.trim()
        });
      } catch (err) {
        console.error("Erreur dans callSendyEdgeFunction :", err);
      }
      // === FIN AJOUT ===

      setUpdateMessage({
        type: "success",
        text: "Profil mis à jour avec succès",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setUpdateMessage({
        type: "error",
        text: "Une erreur est survenue lors de la mise à jour du profil",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswords((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage({ type: "", text: "" })
    if (!passwords.new || passwords.new !== passwords.confirm) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" })
      return
    }
    // Vérification du mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: passwords.current
    })
    if (signInError) {
      setPasswordMessage({ type: "error", text: "Le mot de passe actuel est incorrect" })
      return
    }
    // Mise à jour du mot de passe
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) {
      setPasswordMessage({ type: "error", text: "Le nouveau mot de passe doit être différent de l'ancien" })
    } else {
      setPasswordMessage({ type: "success", text: "Mot de passe mis à jour avec succès" })
      setPasswords({ current: "", new: "", confirm: "" })
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres du compte</h1>
          <p className="text-muted-foreground">Gérez vos paramètres et préférences.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="password">Mot de passe</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations du profil</CardTitle>
                <CardDescription>Mettez à jour les informations de votre profil.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback style={user ? { background: customAvatarColor || getAvatarColor(`${user.prenom || ''}${user.nom || ''}`), color: 'white', fontWeight: 700, fontSize: 36 } : {}}>
                        {!isLoading && user ? `${user.prenom?.charAt(0).toUpperCase() || ''}${user.nom?.charAt(0).toUpperCase() || ''}` : "..."}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" type="button">
                            Changer l'avatar
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="right" align="center" sideOffset={0} className="w-[800px] p-4">
                          <div className="font-semibold mb-2">Choisissez une couleur :</div>
                          <div className="grid grid-cols-5 gap-4">
                            {avatarColors.map((color, idx) => (
                              <button
                                key={color}
                                type="button"
                                className="flex items-center gap-2 px-2 py-1 rounded transition hover:bg-[#f4f4fd]"
                                onClick={() => setCustomAvatarColor(color)}
                              >
                                <span className="inline-block w-6 h-6 rounded-full border border-gray-200" style={{ background: color }}></span>
                                <span className="text-sm">{avatarColorNames[idx]}</span>
                                {customAvatarColor === color && (
                                  <span className="ml-auto text-xs text-[#6c43e0] font-bold">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="mt-3 text-sm font-semibold underline text-[#6c43e0] hover:text-[#4f32a7]"
                            onClick={() => {
                              let availableColors = avatarColors;
                              if (customAvatarColor) {
                                availableColors = avatarColors.filter(c => c !== customAvatarColor);
                              }
                              const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                              setCustomAvatarColor(randomColor);
                            }}
                          >
                            Couleur aléatoire
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          name="prenom"
                          value={isLoading ? "Chargement..." : formData.prenom}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          name="nom"
                          value={isLoading ? "Chargement..." : formData.nom}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={isLoading ? "Chargement..." : formData.email}
                        onChange={handleChange}
                        disabled={true} // Email cannot be changed
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entreprise">Entreprise</Label>
                      <Input
                        id="entreprise"
                        name="entreprise"
                        value={isLoading ? "Chargement..." : formData.entreprise}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {updateMessage.text && (
                    <div className={`text-sm ${updateMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                      {updateMessage.text}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading || isUpdating} className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white">
                    {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="password" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Mot de passe</CardTitle>
                <CardDescription>Changez votre mot de passe.</CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input id="current-password" name="current" type={showCurrentPassword ? "text" : "password"} value={passwords.current} onChange={handlePasswordChange} />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input id="new-password" name="new" type={showNewPassword ? "text" : "password"} value={passwords.new} onChange={handlePasswordChange} />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input id="confirm-password" name="confirm" type={showConfirmPassword ? "text" : "password"} value={passwords.confirm} onChange={handlePasswordChange} />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {passwordMessage.text && (
                    <div className={`text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>{passwordMessage.text}</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white" type="submit">Mettre à jour le mot de passe</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notification</CardTitle>
                <CardDescription>Gérez la façon dont vous recevez les notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications par email</p>
                      <p className="text-sm text-muted-foreground">Recevez des notifications par email.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" defaultChecked className="peer sr-only" />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-[#FFFEFF] after:transition-all after:content-[''] peer-checked:bg-[#6c43e0] peer-checked:after:translate-x-full peer-checked:after:border-[#FFFEFF] peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications push</p>
                      <p className="text-sm text-muted-foreground">
                        Recevez des notifications push sur votre appareil.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-[#FFFEFF] after:transition-all after:content-[''] peer-checked:bg-[#6c43e0] peer-checked:after:translate-x-full peer-checked:after:border-[#FFFEFF] peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Emails marketing</p>
                      <p className="text-sm text-muted-foreground">
                        Recevez des emails sur les nouveaux produits et fonctionnalités.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" defaultChecked className="peer sr-only" />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-[#FFFEFF] after:transition-all after:content-[''] peer-checked:bg-[#6c43e0] peer-checked:after:translate-x-full peer-checked:after:border-[#FFFEFF] peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white">Enregistrer les préférences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
