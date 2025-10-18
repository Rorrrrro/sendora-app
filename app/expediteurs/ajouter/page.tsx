"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/dashboard-layout";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/components/ui/use-toast";

export default function AjouterExpediteurPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Nouvel état
  const router = useRouter();
  const [now, setNow] = useState("");
  const { user } = useUser();
  const supabase = createBrowserClient();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const d = new Date();
    const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setNow(`${date}, ${heure}`);
  }, []);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true); // Désactive le bouton
    if (!name.trim()) {
      setError("Le nom d'expéditeur est requis.");
      setIsSubmitting(false);
      return;
    }
    if (!isValidEmail(email)) {
      setError("Veuillez entrer une adresse email valide.");
      setIsSubmitting(false);
      return;
    }
    if (!user) {
      setError("Vous devez être connecté pour ajouter un expéditeur.");
      setIsSubmitting(false);
      return;
    }
    // Récupérer le compte_parent_id de l'utilisateur
    const { data: userRow, error: userRowError } = await supabase
      .from("Utilisateurs")
      .select("id, compte_parent_id")
      .eq("id", user.id)
      .single();
    if (userRowError || !userRow) {
      setError("Impossible de vérifier la famille de l'utilisateur.");
      setIsSubmitting(false);
      return;
    }
    const familleId = userRow.compte_parent_id || user.id;
    // Récupérer tous les utilisateurs de la famille (parent + enfants)
    const { data: usersFamille, error: usersFamilleError } = await supabase
      .from("Utilisateurs")
      .select("id")
      .or(`id.eq.${familleId},compte_parent_id.eq.${familleId}`);
    if (usersFamilleError || !usersFamille) {
      setError("Impossible de vérifier la famille de l'utilisateur.");
      setIsSubmitting(false);
      return;
    }
    const familleIds = usersFamille.map(u => u.id);
    // Vérifier si un expéditeur de la famille a déjà cet email
    const { data: expediteursMemeFamille, error: errorExp } = await supabase
      .from("Expediteurs")
      .select("id, email, created_by")
      .in("created_by", familleIds)
      .eq("email", email);
    if (errorExp) {
      setError("Erreur lors de la vérification de l'email dans la famille.");
      setIsSubmitting(false);
      return;
    }
    if (expediteursMemeFamille && expediteursMemeFamille.length > 0) {
      setError("Cet email d'expéditeur est déjà utilisé");
      setIsSubmitting(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("Expediteurs")
        .insert({
          email,
          nom: name,
          created_by: user.id
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          setError("Cet expéditeur existe déjà");
        } else {
          setError(error.message || "Erreur lors de l'ajout de l'expéditeur.");
        }
        setIsSubmitting(false);
        return;
      }
      const response = await fetch("/api/expediteur/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nom: name,
          token: data?.token
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur lors de l\'envoi de l\'email' }));
        setIsSubmitting(false);
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email');
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/expediteurs");
      }, 5000); // 5 secondes
      setIsSubmitting(false);
    } catch (e: any) {
      setError(e.message || "Erreur inattendue.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold text-[#6c43e0] mb-3">Email envoyé !</h2>
            <p className="text-gray-700 text-center mb-2">Un email de confirmation a bien été envoyé à <b>{email}</b>.<br />Vérifie ta boîte de réception (et les spams).</p>
            <p className="text-gray-500 text-sm text-center">Le lien de confirmation est valable 24h.</p>
          </div>
        </div>
      )}
      <div className="flex justify-center min-h-screen bg-gray-50 p-8">
        <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row w-full max-w-4xl p-0 overflow-hidden">
          <form onSubmit={handleSubmit} noValidate className="flex-1 w-full md:max-w-lg space-y-8 p-10">
            <h1 className="text-3xl font-bold mb-2">Ajouter un expéditeur</h1>
            <p className="text-gray-600 mb-6">Spécifiez ce que vos destinataires verront lorsqu'ils recevront des emails de la part de cet expéditeur.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'expéditeur <span className="text-red-600">*</span></label>
                <Input
                  type="text"
                  placeholder="Marie Dupont"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (error === "Le nom d'expéditeur est requis.") setError("");
                  }}
                  className="rounded-xl text-base"
                />
                {error === "Le nom d'expéditeur est requis." && (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email <span className="text-red-600">*</span></label>
                <Input
                  type="email"
                  placeholder="marie.dupont@email.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (
                      error === "Veuillez entrer une adresse email valide."
                      || error === "Cet expéditeur existe déjà"
                      || error === "Cet expéditeur existe déjà"
                      || error === "Cet email d'expéditeur est déjà utilisé"
                    ) setError("");
                  }}
                  className="rounded-xl text-base"
                />
                {error === "Veuillez entrer une adresse email valide."
                  || error === "Cet expéditeur existe déjà"
                  || error === "Cet expéditeur existe déjà"
                  || error === "Cet email d'expéditeur est déjà utilisé"
                  ? (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                ) : null}
              </div>
            </div>
            <div className="flex gap-4 mt-8 justify-center">
              <Button
                type="button"
                variant="outline"
                className="border-[#e0e0e0] bg-[#fffeff] text-[#23272f] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-xl px-6"
                onClick={() => router.push('/expediteurs')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold px-6"
                disabled={isSubmitting}
              >
                Enregistrer
              </Button>
            </div>
          </form>
          <div className="hidden md:flex flex-1 items-center justify-center p-10 bg-white">
            <div className="flex flex-col items-center gap-6" style={{minWidth: 320}}>
              <div className="relative flex items-center justify-center" style={{width: 320, height: 600}}>
                {/* Contour iPhone */}
                <div className="absolute inset-0 rounded-[2.5rem] border-[10px] border-[#e0e0e0] shadow-xl bg-gradient-to-br from-[#f7f7f9] to-[#eeeef0] z-0"></div>
                {/* Boutons latéraux */}
                <div className="absolute left-[-2px] top-[120px] w-2 h-8 bg-[#d1d5db] rounded-full z-20"></div>
                <div className="absolute left-[-2px] top-[160px] w-2 h-8 bg-[#d1d5db] rounded-full z-20"></div>
                <div className="absolute left-[-1px] top-[90px] w-1.5 h-5 bg-[#b5b8ba] rounded-full z-20"></div>
                <div className="absolute right-[-2px] top-[110px] w-2 h-16 bg-[#d1d5db] rounded-full z-20"></div>
                {/* Encoche */}
                <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[160px] h-9 bg-gradient-to-br from-[#f7f7f9] to-[#eeeef0] z-30 rounded-b-3xl flex items-center justify-center">
                  <div className="flex flex-row items-center justify-center gap-1.5 mx-auto">
                    <div className="w-10 h-2 bg-[#cfd2d6] rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-[#cfd2d6] rounded-full"></div>
                  </div>
                </div>
                {/* Ecran */}
                <div className="relative w-[276px] h-[560px] bg-white rounded-[2rem] overflow-hidden z-10 flex flex-col shadow-lg">
                  {/* Barre de statut */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-1 text-[13px] text-gray-400 font-medium">
                    <span>09:38</span>
                    <div className="flex items-center justify-end w-full gap-1 -mr-1">
                      <svg width="20" height="12" viewBox="0 0 16 10" fill="none">
                        <path d="M8 8.5c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm-2-2c1.1-1.1 2.9-1.1 4 0 .2.2.5.2.7 0 .2-.2.2-.5 0-.7-1.5-1.5-3.9-1.5-5.4 0-.2.2-.2.5 0 .7.2.2.5.2.7 0zm-2-2c2.2-2.2 5.8-2.2 8 0 .2.2.5.2.7 0 .2-.2.2-.5 0-.7-2.6-2.6-6.8-2.6-9.4 0-.2.2-.2.5 0 .7.2.2.5.2.7 0z" fill="#a3a6ab"/>
                      </svg>
                      <svg width="20" height="10" viewBox="0 0 16 8" fill="none">
                        <rect x="1" y="1" width="11" height="6" rx="1.2" fill="none" stroke="#a3a6ab" strokeWidth="1"/>
                        <rect x="13" y="3" width="1.5" height="2" rx="0.75" fill="#a3a6ab"/>
                      </svg>
                    </div>
                  </div>
                  {/* Titre boîte de réception, puis date et bulle expéditeur façon Brevo */}
                  <div className="px-4 py-2 border-b border-gray-200 text-center font-bold text-gray-800 text-lg">Détails des expéditeurs</div>
                  <div className="px-4 pt-2 pb-1">
                    <div className="text-xs text-gray-400 mb-2">{now}</div>
                    <div className="flex justify-center">
                      <div className="flex items-center bg-gray-100 rounded-3xl px-6 py-3 opacity-70" style={{ width: 260, minWidth: 260, maxWidth: 260 }}>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-2 ml-[-8px]">
                          {/* Initiale ou icône */}
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 leading-tight truncate">{name || 'Marie Dupont'}</span>
                          <span className="text-sm text-gray-500 truncate">{email || 'marie.dupont@email.com'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Skeletons de contacts */}
                    <div className="flex flex-col gap-3 mt-3 items-center">
                      <div className="flex items-center bg-gray-100 rounded-3xl px-6 py-3 opacity-70" style={{ width: 260, minWidth: 260, maxWidth: 260 }}>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4 ml-[-8px]">
                          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" fill="currentColor"/></svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-400 leading-tight truncate">Exemple</span>
                          <span className="text-sm text-gray-300 truncate">exemple@email.com</span>
                        </div>
                      </div>
                      <div className="flex items-center bg-gray-100 rounded-3xl px-6 py-3 opacity-70" style={{ width: 260, minWidth: 260, maxWidth: 260 }}>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4 ml-[-8px]">
                          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" fill="currentColor"/></svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-400 leading-tight truncate">Contact</span>
                          <span className="text-sm text-gray-300 truncate">contact@email.com</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Sujet et contenu du mail (exemple) */}
                  <div className="px-4 pt-2">
                    {/* Ici tu peux ajouter le contenu du mail si besoin */}
                  </div>
                  {/* Plus de liste d'emails */}
                  <div className="flex-1"></div>
                  <div className="text-center text-sm text-gray-400 pb-4 pt-2">Aperçu du rendu sur mobile</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}