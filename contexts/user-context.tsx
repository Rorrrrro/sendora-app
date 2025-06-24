"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type UserInfo = {
  id: string
  email: string
  prenom: string
  nom: string
  entreprise: string
}

type UserContextType = {
  user: UserInfo | null
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>
  isLoading: boolean
  refreshUserData: () => Promise<void>
  signOut: () => Promise<void>
  customAvatarColor: string | null
  setCustomAvatarColor: (color: string | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customAvatarColor, setCustomAvatarColorState] = useState<string | null>(null)
  const supabase = createBrowserClient()
  const router = useRouter()

  // Charge la couleur personnalisée depuis localStorage au login
  useEffect(() => {
    if (user) {
      const key = `avatarColor_${user.prenom || ''}_${user.nom || ''}`
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      setCustomAvatarColorState(stored)
    }
  }, [user])

  // Fonction pour changer la couleur et la stocker dans localStorage
  const setCustomAvatarColor = (color: string | null) => {
    if (user) {
      const key = `avatarColor_${user.prenom || ''}_${user.nom || ''}`
      if (color) {
        localStorage.setItem(key, color)
      } else {
        localStorage.removeItem(key)
      }
      setCustomAvatarColorState(color)
    }
  }

  const refreshUserData = async () => {
    try {
      setIsLoading(true)
      
      // Vérifier la session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Erreur lors de la récupération de la session:", sessionError)
        setUser(null)
        return
      }

      if (!sessionData.session) {
        console.log("Pas de session active")
        setUser(null)
        return
      }

      const userId = sessionData.session.user.id
      const userEmail = sessionData.session.user.email || ""

      // Récupérer les données utilisateur de Supabase
      const { data: userData, error: userError } = await supabase
        .from("Utilisateurs")
        .select("prenom, nom, entreprise")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userError)
        setUser(null)
        return
      }

      if (!userData) {
        console.log("Aucune donnée utilisateur trouvée pour l'ID:", userId)
        setUser(null)
        return
      }

      // Mettre à jour le state avec les données utilisateur
      setUser({
        id: userId,
        email: userEmail,
        prenom: userData.prenom,
        nom: userData.nom,
        entreprise: userData.entreprise
      })

    } catch (error) {
      console.error("Erreur dans refreshUserData:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Erreur lors de la déconnexion Supabase:", error)
        throw error
      }

      setUser(null)
      router.replace("/")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      router.replace("/")
    }
  }

  // Vérification initiale de la session au chargement
  useEffect(() => {
    refreshUserData()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, refreshUserData, signOut, customAvatarColor, setCustomAvatarColor }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
