"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface CreateListSidebarProps {
  isOpen: boolean
  onClose: () => void
  onListCreated?: () => void
}

export function CreateListSidebar({ isOpen, onClose, onListCreated }: CreateListSidebarProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      // Get current user from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("Listes").insert([
        {
          nom: name.trim(),
          user_id: user.id,
          nb_contacts: 0,
        },
      ])

      if (error) throw error

      // Reset form
      setName("")
      onClose()
      onListCreated?.()
      router.refresh()
    } catch (error) {
      console.error("Error creating list:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 top-0 left-0 right-0 bottom-0">
      {/* Overlay moins foncé */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar avec bordures très arrondies à gauche */}
      <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-xl overflow-hidden rounded-l-[2rem]">
        {/* Header - Avec fond complet pour éviter la transparence */}
        <div className="bg-purple-400 py-6 text-center relative z-10">
          <h2 className="text-xl font-bold text-white">Créer une liste</h2>
        </div>

        {/* Form - Avec espacement augmenté */}
        <form
          id="list-form"
          onSubmit={handleSubmit}
          className="px-8 py-4 space-y-7 h-[calc(100%-140px)] overflow-y-auto bg-white"
        >
          <div className="space-y-7">
            <div>
              <Label htmlFor="name">Nom de la liste</Label>
              <Input
                id="name"
                name="name"
                placeholder="Entrez un nom de liste"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </form>

        {/* Buttons - Plus centrés avec espacement légèrement augmenté */}
        <div className="absolute bottom-0 left-0 right-0 px-8 py-6 bg-white border-t flex justify-center gap-8">
          <Button type="button" variant="outline" onClick={onClose}>
            Retour
          </Button>
          <Button
            type="submit"
            form="list-form"
            disabled={isLoading || !name.trim()}
            className="bg-black text-white hover:bg-black/90"
          >
            {isLoading ? "Création en cours..." : "Valider"}
          </Button>
        </div>
      </div>
    </div>
  )
}
