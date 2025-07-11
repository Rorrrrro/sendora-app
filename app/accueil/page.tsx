"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, ListChecks, Send } from "lucide-react"
import { AppLayout } from "@/components/dashboard-layout"
import { useUser } from "@/contexts/user-context"

export default function AccueilPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">
            Bienvenue, {user.prenom || "Utilisateur"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Voici ce qui vous attend aujourd'hui</p>
        </div>

        {/* Getting Started Steps - version premium */}
        <div className="relative py-12 px-2 md:px-0">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#f4f4fd] via-[#f8e8ff] to-[#f4f4fd] opacity-90 blur-sm" />
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3d247a] mb-2 tracking-tight">Étapes pour démarrer</h2>
              <p className="text-lg text-[#6c43e0] font-medium">Suivez ces étapes pour profiter pleinement de Sendora</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-stretch justify-between relative">
              {/* Ligne stepper */}
              <div className="hidden md:block absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-[#e6dbfa] via-[#9D5CFF] to-[#e6dbfa] opacity-60 z-0" style={{top:'56%'}} />
              {/* Étape 1 */}
              <div className="flex-1 bg-[#FFFEFF] rounded-2xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#e6dbfa] flex flex-col items-center text-center relative z-10 group">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#9D5CFF] to-[#6c43e0] shadow-lg group-hover:shadow-[#e6dbfa] transition-all duration-300 mb-4 border-4 border-white">
                  <Upload className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                <div className="text-2xl font-bold mb-2 text-[#3d247a]">Importez vos contacts</div>
                <div className="text-gray-500 mb-4">Glissez un fichier <span className='font-semibold text-[#6c43e0]'>.csv, .xlsx</span> ou ajoutez-les manuellement.</div>
                <Button className="bg-gradient-to-r from-[#9D5CFF] to-[#6c43e0] hover:from-[#8A4AE8] hover:to-[#6c43e0] text-white font-semibold w-full max-w-xs shadow-md">Importer mes contacts</Button>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFFEFF] px-3 py-1 rounded-full text-xs font-bold text-[#9D5CFF] shadow border border-[#e6dbfa]">Nouveau</span>
              </div>
              {/* Étape 2 */}
              <div className="flex-1 bg-[#FFFEFF] rounded-2xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#e6dbfa] flex flex-col items-center text-center relative z-10 group">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#9D5CFF] to-[#6c43e0] shadow-lg group-hover:shadow-[#e6dbfa] transition-all duration-300 mb-4 border-4 border-white">
                  <ListChecks className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                <div className="text-2xl font-bold mb-2 text-[#3d247a]">Créez une liste</div>
                <div className="text-gray-500 mb-4">Classez vos contacts selon vos besoins.</div>
                <Button className="bg-gradient-to-r from-[#9D5CFF] to-[#6c43e0] hover:from-[#8A4AE8] hover:to-[#6c43e0] text-white font-semibold w-full max-w-xs shadow-md">Créer une liste</Button>
              </div>
              {/* Étape 3 */}
              <div className="flex-1 bg-[#FFFEFF] rounded-2xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#e6dbfa] flex flex-col items-center text-center relative z-10 group">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#9D5CFF] to-[#6c43e0] shadow-lg group-hover:shadow-[#e6dbfa] transition-all duration-300 mb-4 border-4 border-white">
                  <Send className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                <div className="text-2xl font-bold mb-2 text-[#3d247a]">Lancez une campagne</div>
                <div className="text-gray-500 mb-4">Rédigez, ciblez et envoyez !</div>
                <Button className="bg-gradient-to-r from-[#9D5CFF] to-[#6c43e0] hover:from-[#8A4AE8] hover:to-[#6c43e0] text-white font-semibold w-full max-w-xs shadow-md">Créer une campagne</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Campagnes Récentes</CardTitle>
              <CardDescription>Vos dernières campagnes email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Newsletter Mensuelle", status: "Envoyée", sent: 1254, opens: "32%" },
                  { name: "Promotion d'Été", status: "Active", sent: 5431, opens: "28%" },
                  { name: "Lancement de Produit", status: "Brouillon", sent: 0, opens: "0%" },
                ].map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.sent > 0
                          ? `${campaign.sent.toLocaleString()} envois • ${campaign.opens} ouvertures`
                          : "Non envoyée"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          campaign.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "Brouillon"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-[#9D5CFF]/10 text-[#9D5CFF]"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/campagnes" className="text-sm text-[#9D5CFF] hover:underline">
                  Voir toutes les campagnes
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Contacts Récents</CardTitle>
              <CardDescription>Les derniers contacts ajoutés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Marie Dupont", email: "marie.dupont@example.com", date: "Il y a 2 jours" },
                  { name: "Jean Martin", email: "jean.martin@example.com", date: "Il y a 3 jours" },
                  { name: "Sophie Bernard", email: "sophie.bernard@example.com", date: "Il y a 5 jours" },
                ].map((contact, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9D5CFF]/10 text-[#9D5CFF]">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{contact.date}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/contacts" className="text-sm text-[#9D5CFF] hover:underline">
                  Voir tous les contacts
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
