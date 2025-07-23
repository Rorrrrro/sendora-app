"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createBrowserClientInstance } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type UserInfo = {
  id: string
  email: string
  prenom: string
  nom: string
  entreprise: string
  sendy_brand_id?: string // Ajouté pour accès dans le profil
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
  const supabase = createBrowserClientInstance()
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
        setUser(null)
        return
      }
      const userId = sessionData.session.user.id
      const userEmail = sessionData.session.user.email || ""
      // --- AJOUT : S'assurer que la ligne existe toujours avant le SELECT ---
      const { error: upsertError } = await supabase
        .from("Utilisateurs")
        .upsert([{ id: userId, email: userEmail }], { onConflict: 'id' });
      if (upsertError) {
        console.error("Erreur lors de l'upsert Utilisateur:", upsertError)
        // On continue quand même, le SELECT renverra null si la ligne n'existe pas
      } else {
        // Attendre un peu pour être sûr que la ligne est bien dispo
        await new Promise(r => setTimeout(r, 200));
      }
      // --- FIN AJOUT ---
      // Récupérer les données utilisateur de Supabase
      const { data: userData, error: userError } = await supabase
        .from("Utilisateurs")
        .select("prenom, nom, entreprise, sendy_brand_id") // Ajout sendy_brand_id
        .eq("id", userId)
        .single()
      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Erreur lors de la récupération des données utilisateur:", userError)
        setUser(null)
        return
      }
      if (!userData) {
        // Pas d'entrée dans la table Utilisateurs, mais session valide : on retourne un user minimal
        setUser({
          id: userId,
          email: userEmail,
          prenom: "",
          nom: "",
          entreprise: ""
        })
        return
      }
      // Mettre à jour le state avec les données utilisateur
      setUser({
        id: userId,
        email: userEmail,
        prenom: userData.prenom,
        nom: userData.nom,
        entreprise: userData.entreprise,
        sendy_brand_id: userData.sendy_brand_id // Ajouté
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
      // Suppression manuelle des cookies côté client (NextAuth, Supabase, etc.)
      if (typeof window !== 'undefined') {
        // Supprime tous les cookies du domaine courant
        document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });
        // Vide le localStorage et le sessionStorage
        localStorage.clear();
        sessionStorage.clear();
      }
      setUser(null)
      if (typeof window !== 'undefined') {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      // SUPPRIMER router.replace("/")
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
