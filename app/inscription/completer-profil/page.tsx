"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import ClientOnly from "@/components/ClientOnly"
import { callSendyEdgeFunction } from "@/lib/sendyEdge";

// Initialiser le client Supabase tout en haut du module
const supabase = createBrowserClient();

// Composant séparé pour gérer useSearchParams
function CompleteProfileForm() {
  const router = useRouter()
  const { user, refreshUserData } = useUser()
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(true)
  const [showCreating, setShowCreating] = useState(false)
  const [successCountdown, setSuccessCountdown] = useState(4)
  const searchParams = useSearchParams();

  useEffect(() => {
    setShowSuccess(true)
    setSuccessCountdown(4)
    const timer = setTimeout(() => setShowSuccess(false), 4000)
    let countdownInterval: NodeJS.Timeout | null = null
    countdownInterval = setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev > 1) return prev - 1
        if (countdownInterval) clearInterval(countdownInterval)
        return prev
      })
    }, 1000)
    return () => {
      clearTimeout(timer)
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [])

  // Log l'URL d'arrivée pour debug
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("URL d'arrivée", window.location.href);
    }
  }, []);

  // Consommer le code PKCE de Supabase et créer la ligne Utilisateur
  useEffect(() => {
    let cancelled = false;
    async function waitForSessionAndCreateUser() {
      let tries = 0;
      let user = null;
      // Attendre que la session soit bien active (max 2s)
      while (!user && tries < 20 && !cancelled) {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
        if (!user) {
          await new Promise(r => setTimeout(r, 100));
          tries++;
        }
      }
      
      if (user && !cancelled) {
        // Insérer seulement l'email, l'ID sera associé automatiquement
        try {
          const { error } = await supabase
            .from("Utilisateurs")
            .insert([{ email: user.email }]);
            
          if (error && error.code !== '23505') { // Ignore unique constraint violations
            console.error("Erreur création utilisateur:", error);
          }
          
          // On vérifie que la ligne existe bien maintenant
          const { data, error: checkError } = await supabase
            .from("Utilisateurs")
            .select("*")
            .eq("email", user.email);
            
          if (checkError || !data?.length) {
            console.error("Vérification création utilisateur échouée:", checkError);
          }
        } catch (err) {
          console.error("Exception lors de la création utilisateur:", err);
        }
      } else if (!user) {
        console.log("Impossible de récupérer l'utilisateur (non connecté) après attente");
      }
    }
    
    const code = searchParams.get("code");
    if (code) {
      waitForSessionAndCreateUser();
    }
    return () => { cancelled = true; };
  }, [searchParams]);

  // Basic validation
  const validateForm = () => {
    if (formData.prenom.trim() === "") {
      setErrorMessage("Le prénom est requis")
      return false
    }
    if (formData.nom.trim() === "") {
      setErrorMessage("Le nom est requis")
      return false
    }
    if (formData.entreprise.trim() === "") {
      setErrorMessage("Le nom de l'entreprise est requis")
      return false
    }
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrorMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!validateForm() || !user) {
      return
    }

    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      // Mettre à jour la ligne Utilisateur avec les infos du formulaire
      const { error: updateError } = await supabase
        .from("Utilisateurs")
        .update({
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          entreprise: formData.entreprise.trim(),
        })
        .eq("id", user.id);

      if (updateError) {
        setErrorMessage("Erreur lors de la mise à jour du profil : " + updateError.message);
        return;
      }

      // Rafraîchir les données utilisateur dans le contexte
      await refreshUserData();

      // Petit délai pour laisser le temps à Supabase de traiter les triggers
      await new Promise(resolve => setTimeout(resolve, 300));

      // Vérifier si l'utilisateur a un compte_parent_id
      const { data: userData, error: userDataError } = await supabase
        .from("Utilisateurs")
        .select("compte_parent_id")
        .eq("id", user.id)
        .single();
        
      if (userDataError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userDataError);
      }
      
      // Récupérer la session pour obtenir le token d'accès
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Si compte_parent_id est null, alors on appelle l'edge function create-family-folder
      const compte_parent_id = userData?.compte_parent_id ?? null;
      
      if (compte_parent_id === null) {
        try {
          console.log("Création du dossier famille pour l'utilisateur principal");
          
          // Format correct du payload selon le message d'erreur dans les logs
          const response = await fetch('https://fvcizjojzlteryioqmwb.functions.supabase.co/create-family-folder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: user.id,
              compte_parent_id: null
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Erreur lors de la création du dossier famille:", response.status, errorText);
          } else {
            console.log("Dossier famille créé avec succès");
          }
        } catch (folderErr) {
          console.error("Erreur non bloquante lors de la création du dossier famille:", folderErr);
        }
      } else {
        console.log("Compte enfant détecté, pas de création de dossier famille");
      }

      // Appel Edge Function Sendy factorisé avec les données à jour de l'utilisateur
      try {
        const result = await callSendyEdgeFunction("sync-sendy-brand", {
          id: user.id,
          prenom: formData.prenom.trim(),
          nom: formData.nom.trim(),
          entreprise: formData.entreprise.trim(),
          email: user.email
        });
        
        console.log("Synchro Sendy Brand réussie:", result);
      } catch (sendyErr) {
        // On ignore les erreurs côté Sendy pour ne pas bloquer l'utilisateur
        console.error("Erreur non bloquante lors de la synchro Sendy:", sendyErr);
      }

      // Récupère la ligne "Aucune liste" créée automatiquement par le trigger
      const { data: aucuneListe, error: listError } = await supabase
        .from("Listes")
        .select("id, nom")
        .eq("user_id", user.id)
        .eq("nom", "Aucune liste")
        .single();
      if (listError || !aucuneListe) throw listError || new Error("Aucune liste non trouvée");

      // Récupère le sendy_brand_id de l'utilisateur
      let sendy_brand_id = null;
      if (user.id) {
        const { data: userData, error: userError } = await supabase
          .from("Utilisateurs")
          .select("sendy_brand_id")
          .eq("id", user.id)
          .single();
        if (userData && userData.sendy_brand_id) {
          sendy_brand_id = userData.sendy_brand_id;
        }
      }

      // Appelle la Edge Function pour créer la liste dans Sendy
      if (aucuneListe && sendy_brand_id) {
        try {
          await callSendyEdgeFunction("sync-sendy-lists", {
            id: aucuneListe.id,
            nom: aucuneListe.nom,
            sendy_brand_id
          });
        } catch (sendyErr) {
          // Ignorer les erreurs pour ne pas bloquer l'expérience utilisateur
          console.error("Erreur non bloquante lors de la synchro liste:", sendyErr);
        }
      }

      window.location.href = "/accueil";
    } catch (err) {
      console.error("Erreur inattendue :", err);
      setErrorMessage("Une erreur est survenue lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {showSuccess && (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-green-700 mb-2">Compte activé !</h2>
            <p className="text-gray-700">Votre compte a été créé avec succès.<br />Complétez maintenant votre profil pour commencer.</p>
            {successCountdown <= 3 && successCountdown > 0 && (
              <div className="mt-4 text-gray-500 text-sm">Redirection dans {successCountdown}…</div>
            )}
          </div>
        </div>
      )}
      {!showSuccess && (
        <div className="flex min-h-screen bg-gray-50">
          {/* Left side - Logo and branding */}
          <div className="hidden w-1/2 bg-primary/10 lg:block">
            <div className="flex h-full flex-col items-center justify-center p-12">
              <img src="/Sendora.png" alt="Sendora Logo" className="mb-8 h-24 w-auto" />
              <p className="mt-2 text-center text-lg text-gray-600">
                Plus qu'une étape pour commencer à utiliser Sendora et profiter de toutes ses fonctionnalités.
              </p>
            </div>
          </div>

          {/* Right side - Complete profile form */}
          <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
            {/* Mobile logo */}
            <div className="mb-10 flex flex-col items-center lg:hidden">
              <img src="/Sendora.png" alt="Sendora Logo" className="mb-4 h-20 w-auto" />
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900">Complétez votre profil</h2>
                <p className="mt-2 text-gray-600">Ajoutez vos informations pour personnaliser votre expérience</p>
              </div>

              <div className="rounded-xl bg-[#FFFEFF] p-8 shadow-lg">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                      Prénom <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        value={formData.prenom}
                        onChange={handleChange}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
                      />
                      <div style={{ minHeight: 20 }}>
                        {errorMessage === "Le prénom est requis" && (
                          <p className="text-xs text-red-600">Le prénom est requis</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                      Nom <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        value={formData.nom}
                        onChange={handleChange}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
                      />
                      <div style={{ minHeight: 20 }}>
                        {errorMessage === "Le nom est requis" && (
                          <p className="text-xs text-red-600">Le nom est requis</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="entreprise" className="block text-sm font-medium text-gray-700">
                      Nom de l&apos;entreprise <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        id="entreprise"
                        name="entreprise"
                        type="text"
                        value={formData.entreprise}
                        onChange={handleChange}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-0 sm:text-sm"
                      />
                      <div style={{ minHeight: 20 }}>
                        {errorMessage === "Le nom de l'entreprise est requis" && (
                          <p className="text-xs text-red-600">Le nom de l'entreprise est requis</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {errorMessage && errorMessage !== "Le prénom est requis" && errorMessage !== "Le nom est requis" && errorMessage !== "Le nom de l'entreprise est requis" && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{errorMessage}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full justify-center rounded-xl border border-[#6c43e0] bg-[#6c43e0] px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-[#4f32a7] hover:border-[#4f32a7] transition-colors focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Mise à jour..." : "Mettre à jour mon profil"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreating && (
        <></>
      )}
    </>
  )
}

// Composant principal avec Suspense
export default function CompleteProfilePage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div>Chargement...</div>}>
        <CompleteProfileForm />
      </Suspense>
    </ClientOnly>
  )
}
