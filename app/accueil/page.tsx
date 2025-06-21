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

        {/* Getting Started Steps */}
        <Card className="border-l-4 border-l-[#9D5CFF] border-y-0 border-r-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#9D5CFF]/10 text-[#9D5CFF]">
                👣
              </span>
              Étapes pour démarrer
            </CardTitle>
            <CardDescription>Suivez ces étapes pour commencer à utiliser la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9D5CFF] text-white">
                    1
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Importez vos contacts
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Glissez un fichier .csv ou ajoutez-les manuellement.
                    </p>
                    <Button className="bg-[#9D5CFF] hover:bg-[#8A4AE8]" size="sm">
                      Importer mes contacts
                    </Button>
                  </div>
                </div>
                <div
                  className="absolute right-0 top-1/2 hidden h-3 w-3 rotate-45 border-b border-r border-dashed border-[#9D5CFF]/50 md:block"
                  style={{ width: "50px", height: "2px", transform: "translateY(-50%)" }}
                ></div>
              </div>

              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9D5CFF] text-white">
                    2
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                      <ListChecks className="h-4 w-4" /> Créez une liste
                    </h3>
                    <p className="text-sm text-muted-foreground">Classez vos contacts selon vos besoins.</p>
                    <Button className="bg-[#9D5CFF] hover:bg-[#8A4AE8]" size="sm">
                      Créer une liste
                    </Button>
                  </div>
                </div>
                <div
                  className="absolute right-0 top-1/2 hidden h-3 w-3 rotate-45 border-b border-r border-dashed border-[#9D5CFF]/50 md:block"
                  style={{ width: "50px", height: "2px", transform: "translateY(-50%)" }}
                ></div>
              </div>

              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9D5CFF] text-white">
                    3
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                      <Send className="h-4 w-4" /> Lancez une campagne
                    </h3>
                    <p className="text-sm text-muted-foreground">Rédigez, ciblez et envoyez !</p>
                    <Button className="bg-[#9D5CFF] hover:bg-[#8A4AE8]" size="sm">
                      Créer une campagne
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <Link href="/campaigns" className="text-sm text-[#9D5CFF] hover:underline">
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
