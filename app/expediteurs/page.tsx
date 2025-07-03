"use client"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/dashboard-layout";
import { Plus, Search, CheckCircle, Shield, AlertTriangle, Pencil } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const expediteurs = [
  {
    id: 1,
    nom: "romiko",
    email: "romain.vernay@edu.em-lyon.com",
    verifie: true,
    dkim: "Par défaut",
    dkim_warning: true,
    dmarc: true,
    ip: "IP mutualisée"
  },
  {
    id: 2,
    nom: "test",
    email: "test@notverified.com",
    verifie: false,
    dkim: "Par défaut",
    dkim_warning: true,
    dmarc: false,
    ip: "IP mutualisée"
  }
];

export default function ExpediteursPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const filtered = expediteurs.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );
  const hasNonConforme = expediteurs.some(e => !e.verifie || e.dkim_warning || !e.dmarc);

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expéditeurs</h1>
              <p className="text-muted-foreground mt-3">Gérez vos adresses d'expédition et leur conformité pour une meilleure délivrabilité.</p>
            </div>
            <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold shadow-md" onClick={() => router.push('/expediteurs/ajouter')}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un expéditeur
            </Button>
          </div>
          {hasNonConforme && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>
                Un ou plusieurs de vos expéditeurs ne sont pas conformes aux exigences de Google, Yahoo et Microsoft. Vérifiez la signature DKIM et le statut DMARC pour chaque expéditeur.
              </span>
            </div>
          )}
          <Card className="border-none shadow-sm bg-[#FFFEFF]">
            <CardHeader className="pb-3">
              <CardDescription>
                <span className="text-lg font-bold text-foreground">
                  {filtered.length === 0
                    ? "Aucun expéditeur pour le moment"
                    : `${filtered.length} expéditeur${filtered.length > 1 ? "s" : ""}`}
                </span>
              </CardDescription>
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
                {filtered.map(e => (
                  <div
                    key={e.id}
                    className="flex flex-col md:flex-row items-center justify-between rounded-2xl border px-6 py-4 transition-all group bg-[#FAFAFD] border-[#E0E1E1] hover:bg-[#f4f4fd] hover:border-[#6C43E0] shadow-sm hover:shadow-md min-h-[80px]"
                  >
                    <div className="flex flex-col md:flex-row items-center flex-1 min-w-0 gap-8 w-full">
                      <div className="flex flex-col gap-2.5 w-[220px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">NOM</span>
                        <div className="font-semibold text-base text-[#23272f]">{e.nom}</div>
                      </div>
                      <div className="flex flex-col gap-2.5 w-[280px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">EMAIL</span>
                        <div className="text-base text-[#23272f]">{e.email}</div>
                      </div>
                      <div className="flex flex-col gap-2.5 w-[120px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">STATUT</span>
                        {e.verifie ? (
                          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" /> Vérifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                            <Shield className="w-4 h-4 mr-1" /> Non vérifié
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2.5 w-[120px] justify-center">
                        <span className="text-xs text-muted-foreground font-medium">AUTHENTIFIÉ</span>
                        {e.verifie && !e.dkim_warning && e.dmarc ? (
                          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-green-100 text-green-800">Oui</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                            Non
                            <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0 justify-center gap-2">
                      {!e.verifie || e.dkim_warning || !e.dmarc ? (
                        <>
                          <Button className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold px-4 py-2 rounded-md text-sm mr-2">Authentifier</Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="rounded-full p-2 transition group text-muted-foreground hover:bg-[#e5e4fa] focus:bg-[#e5e4fa] hover:text-[#3d247a] focus:text-[#3d247a] hover:scale-105 duration-150"
                                aria-label="Modifier"
                                onClick={() => {/* action de modification ici */}}
                              >
                                <Pencil className="w-5 h-5 group-hover:text-[#3d247a] group-focus:text-[#3d247a]" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Modifier</TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="rounded-full p-2 transition group text-muted-foreground hover:bg-[#e5e4fa] focus:bg-[#e5e4fa] hover:text-[#3d247a] focus:text-[#3d247a] hover:scale-105 duration-150"
                              aria-label="Modifier"
                              onClick={() => {/* action de modification ici */}}
                            >
                              <Pencil className="w-5 h-5 group-hover:text-[#3d247a] group-focus:text-[#3d247a]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
} 