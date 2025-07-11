import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, FileText, BarChart3, ArrowUpRight } from "lucide-react"
import { AppLayout } from "@/components/dashboard-layout"

export default function StatistiquesPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
          <p className="text-muted-foreground mt-1">Aperçu des performances de votre compte</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,543</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  +12% <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>{" "}
                depuis le mois dernier
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campagnes Actives</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  +1 <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>{" "}
                depuis la semaine dernière
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  +2 <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>{" "}
                depuis le mois dernier
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.8%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  +3.2% <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>{" "}
                depuis la dernière campagne
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for future statistics content */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Performance des Campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                Graphique de performance (à venir)
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Croissance des Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md">
                Graphique de croissance (à venir)
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Taux d'Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                Graphique d'engagement (à venir)
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Répartition Géographique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                Carte géographique (à venir)
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Appareils Utilisés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border rounded-md">
                Graphique des appareils (à venir)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
