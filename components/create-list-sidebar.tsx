"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import { X } from "lucide-react"
import { callSendyEdgeFunction } from "@/lib/sendyEdge";

interface CreateListSidebarProps {
  isOpen: boolean
  onClose: () => void
  onListCreated: () => void
}

export function CreateListSidebar({ isOpen, onClose, onListCreated }: CreateListSidebarProps) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  })
  const [nameError, setNameError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setNameError("");
    setLoading(true)
    try {
      // 1. Crée la liste dans Supabase (sans sendy_brand_id)
      const { data: insertedList, error } = await createBrowserClient().from("Listes").insert({
        nom: formData.nom,
        description: formData.description,
        user_id: user.id,
        nb_contacts: 0
      }).select().single();

      if (error) {
        if (error.code === '23505') {
          toast.error("Vous avez déjà une liste avec ce nom.");
          setNameError("Vous avez déjà une liste avec ce nom.");
          setLoading(false);
          return;
        }
        throw error;
      }

      // 2. Récupère le sendy_brand_id de l'utilisateur depuis la table Utilisateurs
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

      // 3. Appelle la Edge Function pour créer la liste dans Sendy
      if (insertedList && sendy_brand_id) {
        await callSendyEdgeFunction("sync-sendy-lists", {
          record: {
            id: insertedList.id,
            nom: insertedList.nom ?? formData.nom,
            sendy_brand_id
          }
        });
      }

      toast.success("Liste créée avec succès")
      onListCreated()
      onClose()
      setFormData({ nom: "", description: "" })
    } catch (error) {
      console.error("Erreur lors de la création de la liste:", error)
      toast.error("Une erreur est survenue lors de la création de la liste")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 top-0 left-0 right-0 bottom-0">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-96 bg-[#FFFEFF] shadow-xl overflow-hidden rounded-l-[2rem] flex flex-col">
        <div className="bg-[#6c43e0] py-6 text-center relative z-10 flex justify-center items-center">
          <h2 className="text-xl font-bold text-white">Créer une liste</h2>
        </div>

        <form
          id="list-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col px-8 py-4 space-y-7 overflow-y-auto bg-[#FFFEFF]"
        >
          <div className="space-y-7">
            <div>
              <Label htmlFor="nom" className="flex items-center">
                Nom de la liste <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="nom"
                name="nom"
                placeholder="Ex: Newsletter mensuelle"
                value={formData.nom}
                onChange={e => {
                  setFormData(f => ({ ...f, nom: e.target.value }));
                  if (nameError) setNameError("");
                }}
                className={nameError ? "border-red-500 focus:ring-red-500" : ""}
                required
              />
              {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décrivez le but de cette liste..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-center gap-14 px-8 py-6 border-t bg-[#FFFEFF]">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#FFFEFF] border border-[#e0e0e0] text-[#23272f] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc] hover:border-[#bdbdbd] hover:text-[#23272f] transition"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="list-form"
            disabled={loading || !formData.nom.trim()}
            className="bg-[#6c43e0] text-white hover:bg-[#4f32a7]"
          >
            {loading ? "Création en cours..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  )
}