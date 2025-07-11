"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, Shield, AlertTriangle, MoreHorizontal, Plus, Trash2, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/dashboard-layout";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function DomainesPage() {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [domaines, setDomaines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = createBrowserClient();
  const router = useRouter();
  const [openDetail, setOpenDetail] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("Domaines")
      .select("*")
      .eq("created_by", user.id)
      .then(({ data, error }) => {
        if (!error && data) setDomaines(data);
        setLoading(false);
      });
  }, [user]);

  const filtered = domaines.filter(d => d.nom?.toLowerCase().includes(search.toLowerCase()));

  // Helper pour statut global
  function isAuthentifie(d: any) {
    return d.statut_spf === "Vérifié" && d.statut_dkim === "Vérifié" && d.statut_dmarc === "Vérifié";
  }

  // Helper pour badge
  function StatutBadge({ label, statut }: { label: string, statut: string }) {
    const ok = statut === "Vérifié";
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${ok ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
        {ok ? <CheckCircle className="w-4 h-4 mr-1" /> : <Shield className="w-4 h-4 mr-1" />} {label}
      </span>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Domaines</h1>
            <p className="text-muted-foreground mt-3">Le domaine d'email, c'est ce qui suit le @ dans votre adresse. Son authentification est essentielle pour une bonne délivrabilité.</p>
          </div>
          <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold shadow-md flex items-center gap-2" onClick={() => alert('Ajouter un domaine (à implémenter)')}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un domaine
          </Button>
        </div>
        <div className="inline-flex items-center">
          <div className="group flex gap-0 bg-[#f4f4fd] rounded-full p-1 border border-[#e0e0e0] relative z-0 transition-colors hover:bg-[#efeffb]">
            <button
              type="button"
              onClick={() => router.push('/expediteurs')}
              className="rounded-full px-5 pr-20 py-2 text-base font-semibold transition-colors duration-200 text-[#3D2478] bg-transparent focus:outline-none z-0"
            >
              Expéditeurs
            </button>
          </div>
          <button
            type="button"
            disabled
            className="rounded-full px-8 py-3 text-base font-semibold transition-colors duration-200 bg-[#6c43e0] text-white shadow-[0_4px_24px_0_rgba(108,67,224,0.18)] relative z-10 -ml-[68px] focus:outline-none"
          >
            Domaines
          </button>
        </div>
        <Card className="border-none shadow-sm bg-[#FFFEFF] mt-6">
          <CardHeader className="pb-3" />
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="relative w-full max-w-sm mb-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher un domaine..."
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
                    <div className="flex flex-col gap-2.5 w-[140px]">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center w-8">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Aucun domaine trouvé.</div>
              ) : filtered.map(d => (
                <div
                  key={d.id}
                  className="flex flex-col md:flex-row items-center justify-between rounded-2xl border px-6 py-4 transition-all group bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0] shadow-sm hover:shadow-md min-h-[80px]"
                >
                  <div className="flex flex-col md:flex-row items-center flex-1 min-w-0 gap-8 w-full">
                    <div className="flex flex-col gap-2.5 w-[220px] justify-center">
                      <span className="text-xs text-muted-foreground font-medium">NOM DE DOMAINE</span>
                      <div className="font-normal text-base text-[#23272f]">{d.nom}</div>
                    </div>
                    <div className="flex flex-col gap-2.5 w-[180px] justify-center">
                      <span className="text-xs font-medium tracking-wide text-muted-foreground">STATUT DU DOMAINE</span>
                      <div className="flex items-center">
                        {isAuthentifie(d) ? (
                          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-green-100 text-green-800">Authentifié</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-red-100 text-red-700">Non authentifié</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 w-[120px] justify-center items-center">
                      <span className="text-xs font-medium tracking-wide text-transparent select-none">-</span>
                      <Popover open={openDetail === d.id} onOpenChange={open => setOpenDetail(open ? d.id : null)}>
                        <PopoverTrigger asChild>
                          <button
                            className="text-sm underline text-[#6c43e0] hover:text-[#4f32a7] font-semibold transition-all focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 px-2 py-1"
                            style={{ outline: 'none', boxShadow: 'none', border: 'none', letterSpacing: '0.01em' }}
                            type="button"
                          >
                            Voir le détail
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-4 rounded-xl shadow-lg border bg-white">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full`} style={{backgroundColor: d.statut_spf === 'Vérifié' ? '#039855' : '#dc2626'}}></span>
                              <span className="font-medium">SPF</span>
                              <span className="ml-auto text-xs text-muted-foreground">{d.statut_spf}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full`} style={{backgroundColor: d.statut_dkim === 'Vérifié' ? '#039855' : '#dc2626'}}></span>
                              <span className="font-medium">DKIM</span>
                              <span className="ml-auto text-xs text-muted-foreground">{d.statut_dkim}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full`} style={{backgroundColor: d.statut_dmarc === 'Vérifié' ? '#039855' : '#dc2626'}}></span>
                              <span className="font-medium">DMARC</span>
                              <span className="ml-auto text-xs text-muted-foreground">{d.statut_dmarc}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 text-left">
                            <a
                              href="https://www.mailinblack.com/blog/spf-dkim-dmarc/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-[#6c43e0] mt-3 underline text-left hover:text-[#4f32a7] transition-colors"
                            >
                              <Info className="w-4 h-4" />
                              SPF/DKIM/DMARC
                            </a>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex items-center mt-4 md:mt-0 justify-center gap-2">
                    {!isAuthentifie(d) && (
                      <Button
                        className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold px-4 py-2 rounded-md text-sm"
                        // TODO: Ajoute ici la logique d'authentification
                      >
                        Authentifier
                      </Button>
                    )}
                    <div className="relative">
                      <button
                        className="rounded-full p-2 transition hover:bg-red-100"
                        aria-label="Supprimer"
                        // TODO: Ajoute ici la logique de suppression
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 