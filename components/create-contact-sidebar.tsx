"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import { Skeleton } from "@/components/ui/skeleton"
import { callSendyEdgeFunction } from "@/lib/sendyEdge";

interface Liste {
  id: string
  nom: string
  user_id: string
  nb_contacts: number
  sendy_list_id?: string // Ajouté pour la synchro Sendy
}

interface CreateContactSidebarProps {
  isOpen: boolean
  onClose: () => void
  onContactCreated?: () => void
}

export function CreateContactSidebar({ isOpen, onClose, onContactCreated }: CreateContactSidebarProps) {
  const { user } = useUser()
  const [listes, setListes] = useState<Liste[]>([])
  const [isCreatingListe, setIsCreatingListe] = useState(false)
  const [newListeName, setNewListeName] = useState("")
  const [newListeNameError, setNewListeNameError] = useState<string>("");
  const [selectedListeId, setSelectedListeId] = useState<string>("")
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
    email: "",
    telephone: "",
    liste_id: "", // ID de la liste sélectionnée
  })
  const [emailError, setEmailError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listesError, setListesError] = useState<string | null>(null)
  const [listesLoading, setListesLoading] = useState(true)

  useEffect(() => {
    if (isOpen && user) {
      // Réinitialiser les erreurs
      setListesError(null)
      setEmailError("")
      fetchListes()
    }
  }, [isOpen, user])

  const fetchListes = async () => {
    if (!user?.id) {
      console.error("Utilisateur non connecté")
      setListesError("Vous devez être connecté pour accéder à vos listes")
      setListes([])
      setListesLoading(false)
      return
    }

    try {
      setListesLoading(true)
      const { data, error } = await createBrowserClient()
        .from("Listes")
        .select("*")
        .eq("user_id", user.id)
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

    // Effacer l'erreur d'email si l'utilisateur commence à taper
    if (name === "email" && emailError) {
      setEmailError("")
    }
  }

  const handleSelectChange = (value: string) => {
    if (value === "create-new") {
      setIsCreatingListe(true)
      setSelectedListeId("")
      setFormData((prev) => ({ ...prev, liste_id: "" }))
    } else {
      setFormData((prev) => ({ ...prev, liste_id: value }))
      setSelectedListeId(String(value))
    }
  }

  const handleCreateListe = async () => {
    if (!newListeName.trim()) {
      setNewListeNameError("Le nom de la liste ne peut pas être vide");
      return;
    }
    setNewListeNameError("");
    if (!user?.id) {
      console.error("Utilisateur non connecté")
      alert("Vous devez être connecté pour créer une liste")
      return
    }

    try {
      const { data, error } = await createBrowserClient()
        .from("Listes")
        .insert([
          {
            nom: newListeName.trim(),
            user_id: user.id,
            nb_contacts: 0,
          },
        ])
        .select()

      if (error) {
        if (error.code === '23505') {
          setNewListeNameError("Vous avez déjà une liste avec ce nom.");
          return;
        }
        console.error("Erreur lors de la création de la liste:", error)
        alert(`Erreur: ${error.message}`)
      } else if (data && data.length > 0) {
        setListes((prev) => [...prev, data[0]])
        setFormData((prev) => ({ ...prev, liste_id: data[0].id }))
        setSelectedListeId(data[0].id)
        setIsCreatingListe(false)
        setNewListeName("")

        // === Récupère le sendy_brand_id de l'utilisateur (comme dans create-list-sidebar) ===
        let sendy_brand_id = null;
        if (user.id) {
          const { data: userData, error: userError } = await createBrowserClient()
            .from("Utilisateurs")
            .select("sendy_brand_id")
            .eq("id", user.id)
            .single();
          if (userData && userData.sendy_brand_id) {
            sendy_brand_id = userData.sendy_brand_id;
          }
        }
        // === Appel Edge Function pour créer la liste dans Sendy (factorisé) ===
        if (sendy_brand_id) {
          try {
            await callSendyEdgeFunction("sync-sendy-lists", {
              id: data[0].id,
              nom: data[0].nom,
              sendy_brand_id
            });
          } catch (err) {
            console.error("Erreur lors de la synchro Sendy :", err);
          }
        }
        // === FIN AJOUT ===
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue lors de la création de la liste")
    }
  }

  const validateForm = () => {
    let isValid = true

    // Validation de l'email
    if (!formData.email.trim()) {
      setEmailError("L'adresse email est requise")
      isValid = false
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setEmailError("Veuillez entrer une adresse email valide")
      isValid = false
    } else {
      setEmailError("")
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Ajouter explicitement la date de création
      const now = new Date().toISOString()

      // Créer le contact avec created_at explicite
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
            created_at: now,
          },
        ])
        .select()

      if (contactError) {
        console.error("Erreur lors de la création du contact:", contactError)
        alert(`Erreur: ${contactError.message}`)
        return
      }

      // Si une liste est sélectionnée, créer la liaison dans Listes_Contacts
      let sendyListHash = null;
      if (formData.liste_id && contactData && contactData.length > 0) {
        // Ajoute user_id et loggue la requête
        const liaisonPayload = {
          liste_id: formData.liste_id,
          contact_id: contactData[0].id,
          user_id: user?.id
        };
        console.log('Insertion Listes_Contacts', liaisonPayload);
        const { error: liaisonError } = await createBrowserClient()
          .from("Listes_Contacts")
          .insert([liaisonPayload]);

        if (liaisonError) {
          alert("Erreur lors de la liaison du contact à la liste : " + JSON.stringify(liaisonError));
          console.error("Erreur lors de la liaison contact-liste:", liaisonError)
          return;
        } else {
          // Mettre à jour le nombre de contacts dans la liste
          const selectedListe = listes.find((liste) => String(liste.id) === String(formData.liste_id))
          if (selectedListe) {
            const { error: updateError } = await createBrowserClient()
              .from("Listes")
              .update({ nb_contacts: (selectedListe.nb_contacts || 0) + 1 })
              .eq("id", formData.liste_id)

            if (updateError) {
              console.error("Erreur lors de la mise à jour du nombre de contacts:", updateError)
            }
            // Récupère le sendy_list_id pour l'appel à l'Edge Function
            sendyListHash = selectedListe.sendy_list_id;
          }
        }
      }

      // Appel Edge Function pour synchroniser le contact avec Sendy
      try {
        await callSendyEdgeFunction("sync-sendy-contacts", {
          record: {
            contact_id: contactData[0].id,
            sendy_list_hash: sendyListHash
          }
        });
      } catch (err) {
        console.error("Erreur lors de la synchro Sendy:", err);
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
      setSelectedListeId("")
      setEmailError("")

      // Fermer le panneau et notifier le parent
      if (typeof onClose === "function") {
        onClose()
      }
      if (onContactCreated) {
        onContactCreated()
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fonction pour obtenir le texte à afficher dans le select
  const getSelectedListeText = () => {
    if (!selectedListeId) return "Sélectionner une liste"
    const selectedListe = listes.find((liste) => liste.id === selectedListeId)
    return selectedListe
      ? `${selectedListe.nom} (${selectedListe.nb_contacts || 0} contacts)`
      : "Sélectionner une liste"
  }

  const selectedListeLabel = selectedListeId
    ? (listes.find((liste) => liste.id === selectedListeId)
        ? `${listes.find((liste) => liste.id === selectedListeId)!.nom} (${listes.find((liste) => liste.id === selectedListeId)!.nb_contacts || 0} contacts)`
        : "")
    : "";

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 top-0 left-0 right-0 bottom-0">
      {/* Overlay moins foncé */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar avec bordures très arrondies à gauche */}
      <div className="fixed right-0 top-0 h-screen w-96 bg-[#FFFEFF] shadow-xl overflow-hidden rounded-l-[2rem] flex flex-col h-full">
        {/* Header - Avec fond complet pour éviter la transparence */}
        <div className="bg-[#6c43e0] py-6 text-center relative z-10">
          <h2 className="text-xl font-bold text-white">Créer un contact</h2>
        </div>

        {/* Form - Avec espacement augmenté */}
        <form
          id="contact-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col px-8 py-4 space-y-7 overflow-y-auto bg-[#FFFEFF]"
        >
          <div className="space-y-7">
            <div>
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                placeholder="Entrez un prénom"
                value={formData.prenom}
                onChange={handleInputChange}
                className="mt-1"
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
                className="mt-1"
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
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center">
                Adresse email <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="Entrez une adresse email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 ${emailError ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            <div>
              <Label htmlFor="telephone">Numéro de téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                placeholder="Entrez un numéro de téléphone"
                value={formData.telephone}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="liste">Liste</Label>
              {isCreatingListe ? (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <Input
                      id="newListe"
                      placeholder="Nouvelle liste"
                      value={newListeName}
                      onChange={e => {
                        setNewListeName(e.target.value);
                        if (newListeNameError) setNewListeNameError("");
                      }}
                      className={newListeNameError ? "border-red-500 focus:ring-red-500" : ""}
                    />
                    <Button type="button" onClick={handleCreateListe} size="sm" className="bg-[#6c43e0] text-white hover:bg-[#4f32a7] font-bold">
                      Créer
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingListe(false)}>
                      Annuler
                    </Button>
                  </div>
                  {newListeNameError && <p className="text-red-500 text-sm mt-1">{newListeNameError}</p>}
                </div>
              ) : (
                <div className="mt-1">
                  <Select value={selectedListeId} onValueChange={handleSelectChange}>
                    <SelectTrigger
                      className="w-full h-10 text-sm border border-[#e5e7eb] rounded-lg bg-[#F9F9FB] text-[#737373] hover:border-[#6c43e0] data-[state=open]:border-[#6c43e0] data-[state=open]:text-[#3C2578]"
                    >
                      <SelectValue placeholder="Sélectionner une liste" />
                    </SelectTrigger>
                    <SelectContent>
                      {listesLoading ? (
                        <div className="p-2 space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        listes.map((liste) => (
                          <SelectItem key={liste.id} value={String(liste.id)}>
                            {liste.nom} ({liste.nb_contacts || 0} contacts)
                          </SelectItem>
                        ))
                      )}
                      <SelectSeparator />
                      <SelectItem value="create-new" className="text-primary">
                        <div className="flex items-center">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Créer une nouvelle liste
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {listesError && <p className="text-xs text-red-500 mt-1">{listesError}</p>}
            </div>
          </div>
        </form>

        <div className="flex justify-center gap-14 px-8 py-6 border-t bg-[#FFFEFF]">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#FFFEFF] border border-[#e0e0e0] text-[#23272f] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc] hover:border-[#bdbdbd] hover:text-[#23272f] transition"
          >
            Retour
          </Button>
          <Button
            type="submit"
            form="contact-form"
            disabled={isSubmitting || !formData.email.trim()}
            className="bg-[#6c43e0] text-white hover:bg-[#4f32a7]"
          >
            {isSubmitting ? "Création en cours..." : "Valider"}
          </Button>
        </div>
      </div>
    </div>
  )
}