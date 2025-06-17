"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Upload } from "lucide-react"
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
import { CreateContactSidebar } from "@/components/create-contact-sidebar"

interface Contact {
  id: string
  prenom: string
  nom: string
  email: string
  entreprise: string
  telephone: string
  created_at: string
  userID: string
}

export default function ContactsPage() {
  const { user } = useUser()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [createSidebarOpen, setCreateSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchContacts()
    }
  }, [user])

  const fetchContacts = async () => {
    try {
      const { data, error } = await createBrowserClient()
        .from("Contacts")
        .select("*")
        .eq("userID", user?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur lors du chargement des contacts:", error)
      } else {
        setContacts(data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
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
              <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
              <p className="text-muted-foreground">Gérez vos contacts et abonnés.</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Chargement des contacts...</div>
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
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Gérez vos contacts et abonnés.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCreateSidebarOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un contact
            </Button>
            <Link href="/import-contacts" passHref>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Importer des contacts
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Tous les contacts</CardTitle>
            <CardDescription>
              Vous avez {contacts.length} contact{contacts.length > 1 ? "s" : ""} dans votre base de données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher des contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filtrer
              </Button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Aucun contact trouvé pour cette recherche."
                    : "Aucun contact trouvé. Créez votre premier contact !"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 transition-colors">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Prénom</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Date de création
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{contact.prenom || "-"}</td>
                          <td className="p-4 align-middle font-medium">{contact.nom || "-"}</td>
                          <td className="p-4 align-middle">{contact.email || "-"}</td>
                          <td className="p-4 align-middle">{formatDate(contact.created_at)}</td>
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
                                <DropdownMenuItem>Modifier le contact</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
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

        <CreateContactSidebar
          isOpen={createSidebarOpen}
          onClose={() => setCreateSidebarOpen(false)}
          onContactCreated={fetchContacts}
        />
      </div>
    </AppLayout>
  )
}
