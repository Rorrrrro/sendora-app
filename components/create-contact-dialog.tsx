"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

interface Liste {
  id: string
  nom: string
  user_id: string
  nb_contacts: number
}

interface CreateContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactCreated?: () => void
}

export function CreateContactDialog({ open, onOpenChange, onContactCreated }: CreateContactDialogProps) {
  const { user } = useUser()
  const [listes, setListes] = useState<Liste[]>([])
  const [isCreatingListe, setIsCreatingListe] = useState(false)
  const [newListeName, setNewListeName] = useState("")
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
    email: "",
    telephone: "",
    liste_id: "", // ID de la liste sélectionnée
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listesError, setListesError] = useState<string | null>(null)
  const [listesLoading, setListesLoading] = useState(true)

  useEffect(() => {
    if (open && user) {
      // Réinitialiser les erreurs
      setListesError(null)
      fetchListes()
    }
  }, [open, user])

  const fetchListes = async () => {
    try {
      setListesLoading(true)
      const { data, error } = await createBrowserClient()
        .from("Listes")
        .select("*")
        .eq("user_id", user?.id)
        .order("nom", { ascending: true })

      if (error) {
        console.error("Erreur lors du chargement des listes:", error)
        setListesError(`Erreur: ${error.message}`)
        setListes([])
      } else {
        setListes(data || [])
        setListesError(null)
      }
    } catch (error) {
      console.error("Erreur:", error)
      setListesError("Une erreur est survenue lors du chargement des listes.")
    } finally {
      setListesLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    if (value === "create-new") {
      setIsCreatingListe(true)
    } else if (value === "none") {
      setFormData((prev) => ({ ...prev, liste_id: "" }))
    } else {
      setFormData((prev) => ({ ...prev, liste_id: value }))
    }
  }

  const handleCreateListe = async () => {
    if (!newListeName.trim()) return

    try {
      const { data, error } = await createBrowserClient()
        .from("Listes")
        .insert([
          {
            name: newListeName,
            user_id: user?.id,
            nb_contacts: 0, // Nouvelle liste, donc 0 contacts
          },
        ])
        .select()

      if (error) {
        console.error("Erreur lors de la création de la liste:", error)
        alert(`Erreur: ${error.message}`)
      } else if (data && data.length > 0) {
        setListes((prev) => [...prev, data[0]])
        setFormData((prev) => ({ ...prev, liste_id: data[0].id }))
        setIsCreatingListe(false)
        setNewListeName("")
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email) {
      alert("L'adresse email est requise")
      return
    }

    setIsSubmitting(true)

    try {
      // Créer le contact
      const { data: contactData, error: contactError } = await createBrowserClient()
        .from("Contacts")
        .insert([
          {
            prenom: formData.prenom,
            nom: formData.nom,
            entreprise: formData.entreprise,
            email: formData.email,
            telephone: formData.telephone,
            userID: user?.id,
            liste_id: formData.liste_id || null,
          },
        ])
        .select()

      if (contactError) {
        console.error("Erreur lors de la création du contact:", contactError)
        alert(`Erreur: ${contactError.message}`)
        return
      }

      // Si une liste est sélectionnée, mettre à jour le nombre de contacts
      if (formData.liste_id) {
        const selectedListe = listes.find((liste) => liste.id === formData.liste_id)

        if (selectedListe) {
          const { error: updateError } = await createBrowserClient()
            .from("Listes")
            .update({ nb_contacts: (selectedListe.nb_contacts || 0) + 1 })
            .eq("id", formData.liste_id)

          if (updateError) {
            console.error("Erreur lors de la mise à jour du nombre de contacts:", updateError)
          }
        }
      }

      // Réinitialiser le formulaire
      setFormData({
        prenom: "",
        nom: "",
        entreprise: "",
        email: "",
        telephone: "",
        liste_id: "",
      })

      // Fermer le modal et notifier le parent
      onOpenChange(false)
      if (onContactCreated) {
        onContactCreated()
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="w-full bg-purple-300 -mt-6 -mx-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold text-center">Créer un contact</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                placeholder="Entrez un prénom"
                value={formData.prenom}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                name="nom"
                placeholder="Entrez un nom"
                value={formData.nom}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="entreprise">Nom de l'entreprise</Label>
              <Input
                id="entreprise"
                name="entreprise"
                placeholder="Entrez le nom de l'entreprise"
                value={formData.entreprise}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center">
                Adresse email <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Entrez une adresse email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="telephone">Numéro de téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                placeholder="Entrez un numéro de téléphone"
                value={formData.telephone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="liste">Liste</Label>
              {isCreatingListe ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="newListe"
                    placeholder="Nom de la nouvelle liste"
                    value={newListeName}
                    onChange={(e) => setNewListeName(e.target.value)}
                  />
                  <Button type="button" onClick={handleCreateListe} size="sm">
                    Créer
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingListe(false)}>
                    Annuler
                  </Button>
                </div>
              ) : listesLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-full h-10 bg-muted animate-pulse rounded-md"></div>
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
              ) : (
                <Select onValueChange={handleSelectChange}>
                  <SelectTrigger className="border-input focus:border-[#6c43e0] hover:border-[#6c43e0]">
                    <SelectValue placeholder="Sélectionner une liste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune liste</SelectItem>
                    {listes.map((liste) => (
                      <SelectItem key={liste.id} value={liste.id}>
                        {liste.nom} ({liste.nb_contacts || 0} contacts)
                      </SelectItem>
                    ))}
                    <SelectItem value="create-new" className="text-primary flex items-center">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Créer une nouvelle liste
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              {listesError && <p className="text-xs text-red-500 mt-1">{listesError}</p>}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Retour
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-black text-white hover:bg-black/90">
              {isSubmitting ? "Création en cours..." : "Valider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
