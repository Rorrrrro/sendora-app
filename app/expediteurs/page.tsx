"use client"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/dashboard-layout";
import { Plus, Search, CheckCircle, XCircle, AlertTriangle, Shield, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";

// Liste des domaines génériques à ne pas authentifier
const domainesGeneriques = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.fr", "ymail.com",
  "outlook.com", "hotmail.com", "hotmail.fr", "live.com", "msn.com",
  "aol.com", "protonmail.com", "icloud.com", "me.com", "mac.com",
  "gmx.com", "gmx.fr", "orange.fr", "wanadoo.fr", "sfr.fr", "free.fr",
  "laposte.net"
];
function isDomaineGenerique(email: string) {
  const domaine = email.split("@")[1]?.toLowerCase();
  return domaine && domainesGeneriques.includes(domaine);
}

export default function ExpediteursPage() {
  const [search, setSearch] = useState("");
  const [expediteurs, setExpediteurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<number | undefined>(undefined);
  const [openInfoId, setOpenInfoId] = useState<number | null>(null);
  const { user } = useUser();
  const supabase = createBrowserClient();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ email: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("Expediteurs")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) setExpediteurs(data);
        setLoading(false);
      });
  }, [user]);

  const filtered = expediteurs.filter(e =>
    e.nom?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );
  const hasNonAuthentifie = expediteurs.some(e => !(e.verifie && !e.dkim_warning && e.dmarc));

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expéditeurs</h1>
              <p className="text-muted-foreground mt-3">L'expéditeur, c'est le nom et l'adresse email vus par vos destinataires. Celui-ci doit être vérifié afin de pouvoir envoyer des emails.</p>
            </div>
            <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold shadow-md" onClick={() => router.push('/expediteurs/ajouter')}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un expéditeur
            </Button>
          </div>

          <div className="inline-flex items-center">
            <button
              type="button"
              disabled
              className="rounded-full px-8 py-3 text-base font-semibold transition-colors duration-200 bg-[#6c43e0] text-white shadow-[0_4px_24px_0_rgba(108,67,224,0.18)] relative z-10 -mr-[68px] focus:outline-none"
            >
              Expéditeurs
            </button>
            <div className="group flex gap-0 bg-[#f4f4fd] rounded-full p-1 border border-[#e0e0e0] relative z-0 transition-colors hover:bg-[#efeffb]">
              <button
                type="button"
                onClick={() => router.push('/expediteurs/domaines')}
                className="rounded-full px-5 pl-20 py-2 text-base font-semibold transition-colors duration-200 text-[#3D2478] bg-transparent focus:outline-none z-0"
              >
                Domaines
              </button>
            </div>
          </div>

          {expediteurs.some(e => e.statut_domaine !== "Authentifié") && (
            <div className="rounded-md border-l-4 border-[#FDB022] bg-[#FFFAEB] p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-7 h-7 text-[#FDB022] mr-3 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-[#B54708]">
                  Certains domaines ne sont pas authentifiés (
                    <a href="#" className="underline cursor-pointer">SPF/DKIM/DMARC</a>
                  ). Sans authentification, les emails seront envoyés depuis campagnes@sendora.fr au lieu de leur adresse, ce qui peut affecter la délivrabilité. 
                  <Link href="/expediteurs/domaines" className="underline font-semibold text-[#B54708] ml-1">
                    Cliquez ici pour authentifier vos domaines
                  </Link>
                </p>
              </div>
            </div>
          )}
          <Card className="border-none shadow-sm bg-[#FFFEFF] mt-6">
            <CardHeader className="pb-3">
              <CardDescription />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="relative w-full max-w-sm mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Rechercher un expéditeur..."
                    className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-[#6c43e0] hover:border-[#bdbdbd] transition"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {loading ? (
                  <div className="flex items-center justify-between rounded-2xl border px-6 py-4 bg-[#FAFAFD] border-[#E0E1E1] shadow-sm mb-2">
                    <div className="flex items-center flex-1 min-w-0 mr-4 gap-8">
                      <div className="flex flex-col gap-2.5 w-[220px]">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                      <div className="flex flex-col gap-2.5 w-[280px]">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-40" />
                      </div>
                      <div className="flex flex-col gap-2.5 w-[120px]">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex flex-col gap-2.5 w-[120px]">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                    <div className="flex items-center w-8">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Aucun expéditeur trouvé.</div>
                ) : filtered.map(e => (
                  <div
                    key={e.id}
                    className="flex flex-col md:flex-row items-center justify-between rounded-2xl border px-6 py-4 transition-all group bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0] shadow-sm hover:shadow-md min-h-[80px]"
                  >
                    <div className="flex flex-col md:flex-row items-center flex-1 min-w-0 gap-6 w-full">
                      <div className="flex flex-col gap-2.5 w-[220px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">NOM</span>
                        <div className="font-normal text-base text-[#23272f]">{e.nom}</div>
                      </div>
                      <div className="flex flex-col gap-2.5 w-[280px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">EMAIL</span>
                        <div className="text-base text-[#23272f]">{e.email}</div>
                      </div>
                      <div className="flex flex-col gap-2.5 w-[110px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">STATUT</span>
                        {e.statut === "Vérifié" ? (
                          <span className="inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium bg-[#D1FADF] text-[#039855]">
                            <CheckCircle className="w-4 h-4 mr-1 text-[#039855]" /> Vérifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium bg-[#FEE4E2] text-[#B42318]">
                            <XCircle className="w-4 h-4 mr-1 text-[#B42318]" /> Non vérifié
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2.5 w-[120px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">AUTHENTIFIÉ</span>
                        <div className="flex items-center gap-2 min-h-[28px]">
                          {e.statut_domaine === "Authentifié" ? (
                            <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-[#D1FADF] text-[#039855]">
                              <CheckCircle className="w-4 h-4 mr-1 text-[#039855]" /> Oui
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-[#FEE4E2] text-[#B42318]">
                              <XCircle className="w-4 h-4 mr-1 text-[#B42318]" /> Non
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0 justify-center gap-2">
                      {e.statut !== "Vérifié" && (
                        <>
                          <Button
                            className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold px-4 py-2 rounded-md text-sm mr-2"
                            disabled={sendingId === e.id}
                            onClick={async () => {
                              setSendingId(e.id);
                              try {
                                const res = await fetch("/api/expediteur/send-mail", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ email: e.email, nom: e.nom, renvoi: true, id: e.id }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  setShowSuccess({ email: e.email });
                                  setTimeout(() => setShowSuccess(null), 4000);
                                } else {
                                  toast({ title: "Erreur", description: data.error || "Impossible d'envoyer l'email" });
                                }
                              } catch (err) {
                                toast({ title: "Erreur", description: "Erreur réseau ou serveur" });
                              } finally {
                                setSendingId(null);
                              }
                            }}
                          >
                            Vérifier
                          </Button>
                          {showSuccess && showSuccess.email === e.email && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
                              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
                                <h2 className="text-2xl font-bold text-[#6c43e0] mb-3">Email envoyé !</h2>
                                <p className="text-gray-700 text-center mb-2">Un email de confirmation a bien été envoyé à <b>{e.email}</b>.<br />Vérifie ta boîte de réception (et les spams).</p>
                                <p className="text-gray-500 text-sm text-center">Le lien de confirmation est valable 24h.</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {e.statut === "Vérifié" && isDomaineGenerique(e.email) && (
                        <Popover open={openInfoId === e.id} onOpenChange={open => setOpenInfoId(open ? e.id : null)}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-sm text-[#B54708] underline font-normal hover:text-[#934100] whitespace-nowrap transition-colors focus:outline-none"
                            >
                              Impossible d’authentifier ce domaine
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-80 p-6 rounded-xl shadow-lg border bg-white">
                            <div className="font-bold mb-2 text-[#6c43e0] text-base">Domaine générique détecté</div>
                            <div className="text-black text-sm">Il n'est pas possible d'authentifier ce type de domaine (Gmail, Yahoo, etc.) pour l'envoi d'emails personnalisés.<br/>Utilisez un domaine professionnel pour bénéficier de toutes les fonctionnalités et améliorer la délivrabilité.</div>
                          </PopoverContent>
                        </Popover>
                      )}
                      <DropdownMenu
                        open={openMenuId === e.id}
                        onOpenChange={(open) => setOpenMenuId(open ? e.id : undefined)}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`rounded-full p-2 transition group text-muted-foreground duration-150 ${openMenuId === e.id ? 'bg-[#efeffb] text-[#3d247a]' : ''} ${confirmDeleteId ? 'pointer-events-none opacity-60' : 'hover:bg-[#e5e4fa] hover:text-[#3d247a] focus:bg-[#e5e4fa] focus:text-[#3d247a] hover:scale-105'}`}
                            aria-label="Actions"
                            disabled={!!confirmDeleteId}
                          >
                            <MoreHorizontal className="w-5 h-5 group-hover:text-[#3d247a] group-focus:text-[#3d247a]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition cursor-pointer"
                            onClick={() => router.push(`/expediteurs/modifier?id=${e.id}`)}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Modifier
                          </DropdownMenuItem>
                          <div className="w-full py-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2 h-8 font-semibold rounded-lg bg-[#d21c3c] border-[#d21c3c] hover:bg-[#b81a34] hover:border-[#b81a34] text-[16px] transition focus:outline-none focus:ring-0"
                              onClick={() => {
                                setOpenMenuId(undefined); // Ferme le DropdownMenu
                                setConfirmDeleteId(e.id);
                                setConfirmDeleteEmail(e.email);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold text-[#d21c3c] mb-3">Supprimer l'expéditeur ?</h2>
            <p className="text-gray-700 text-center mb-4">Cette action est irréversible.<br />Voulez-vous vraiment supprimer <b>{confirmDeleteEmail}</b> comme expéditeur&nbsp;?</p>
            <div className="flex gap-4 mt-2">
              <Button
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === confirmDeleteId}
              >
                Annuler
              </Button>
              <Button
                className="rounded-xl bg-[#d21c3c] hover:bg-[#b81a34] text-white font-semibold px-6"
                onClick={async () => {
                  setDeletingId(confirmDeleteId);
                  const { error } = await supabase
                    .from('Expediteurs')
                    .delete()
                    .eq('id', confirmDeleteId);
                  if (error) {
                    toast({ title: 'Erreur', description: error.message || 'Erreur lors de la suppression.' });
                  } else {
                    setExpediteurs(expediteurs.filter(ex => ex.id !== confirmDeleteId));
                  }
                  setDeletingId(null);
                  setConfirmDeleteId(null);
                  setConfirmDeleteEmail(null);
                }}
                disabled={deletingId === confirmDeleteId}
              >
                {deletingId === confirmDeleteId ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .menu-action-item:hover {
          background-color: #efeffb !important;
          color: #3d247a !important;
        }
        .menu-action-item:hover svg {
          color: #3d247a !important;
        }
      `}</style>
    </AppLayout>
  );
}