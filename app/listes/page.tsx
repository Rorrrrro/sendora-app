"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLayout } from "@/components/dashboard-layout"
import { useUser } from "@/contexts/user-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { CreateListSidebar } from "@/components/create-list-sidebar"
import { TableSkeleton } from "@/components/TableSkeleton"

interface Liste {
  id: string
  nom: string
  description: string
  nb_contacts: number
  created_at: string
  user_id: string
}

export default function ListesPage() {
  const { user } = useUser()
  const [listes, setListes] = useState<Liste[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [createSidebarOpen, setCreateSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchListes()
    }
  }, [user])

  const fetchListes = async () => {
    try {
      const { data, error } = await createBrowserClient()
        .from("Listes")
        .select("id, nom, description, nb_contacts, created_at, user_id")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur lors du chargement des listes:", error)
      } else {
        setListes(data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredListes = listes.filter(
    (liste) =>
      liste.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liste.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Listes</h1>
              <p className="text-muted-foreground">Gérez vos listes d'abonnés et newsletters.</p>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Toutes les listes</CardTitle>
            </CardHeader>
            <CardContent>
              <TableSkeleton columns={5} rows={6} />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Listes</h1>
            <p className="text-muted-foreground">Gérez vos listes d'abonnés et newsletters.</p>
          </div>
          <Button onClick={() => setCreateSidebarOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une liste
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Toutes les listes</CardTitle>
            <CardDescription>
              Vous avez {listes.length} liste{listes.length > 1 ? "s" : ""} dans votre base de données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher des listes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {filteredListes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Aucune liste trouvée pour cette recherche."
                    : "Aucune liste trouvée. Créez votre première liste !"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 transition-colors">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contacts</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Date de création
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListes.map((liste) => (
                        <tr key={liste.id} className="border-b transition-colors hover:bg-muted">
                          <td className="p-4 align-middle font-medium">{liste.nom || "-"}</td>
                          <td className="p-4 align-middle">
                            <div className="max-w-[200px] truncate" title={liste.description}>
                              {liste.description || "-"}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {liste.nb_contacts || 0}
                            </div>
                          </td>
                          <td className="p-4 align-middle">{formatDate(liste.created_at)}</td>
                          <td className="p-4 align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Ouvrir le menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                                <DropdownMenuItem>Modifier la liste</DropdownMenuItem>
                                <DropdownMenuItem>Gérer les contacts</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-white" style={{ backgroundColor: '#d21c3c', borderColor: '#d21c3c' }}>
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateListSidebar
          isOpen={createSidebarOpen}
          onClose={() => setCreateSidebarOpen(false)}
          onListCreated={fetchListes}
        />
      </div>
    </AppLayout>
  )
} 