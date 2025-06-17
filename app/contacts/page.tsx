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
import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { CreateContactSidebar } from "@/components/create-contact-sidebar"
import { MultiListFilter } from "@/components/MultiListFilter"
import { TableSkeleton } from "@/components/TableSkeleton"

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

function ContactsTable({
  contacts,
  showSpinner,
  searchTerm,
  formatDate,
}: {
  contacts: Contact[];
  showSpinner: boolean;
  searchTerm: string;
  formatDate: (dateString: string) => string;
}) {
  const filteredContacts = contacts.filter(
    (contact: Contact) =>
      contact.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="relative">
      {showSpinner ? (
        <TableSkeleton columns={5} rows={6} />
      ) : filteredContacts.length === 0 ? (
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date de création</th>
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
    </div>
  )
}

export default function ContactsPage() {
  const { user } = useUser()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [createSidebarOpen, setCreateSidebarOpen] = useState(false)
  const [listes, setListes] = useState<{ id: number; nom: string }[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])
  const [showSpinner, setShowSpinner] = useState(false)
  const spinnerTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (user) {
      createBrowserClient()
        .from("Listes")
        .select("id, nom")
        .eq("user_id", user.id)
        .then(({ data }) => setListes(data || []))
    }
  }, [user])

  const fetchContacts = () => {
    if (!user) return
    setLoading(true)
    const supabase = createBrowserClient()
    const hasNone = selectedListIds.includes('none')
    const selectedListIdsFiltered = selectedListIds.filter(id => id !== 'none')

    if (hasNone && selectedListIdsFiltered.length > 0) {
      Promise.all([
        supabase.from('Contacts').select('*').eq('userID', user.id),
        supabase.from('Listes_Contacts').select('contact_id, liste_id'),
      ]).then(([contactsRes, jointureRes]) => {
        const allContacts = contactsRes.data || []
        const jointures = jointureRes.data || []
        const contactIdsWithList = new Set(
          jointures
            .filter(j => selectedListIdsFiltered.includes(String(j.liste_id)))
            .map(j => j.contact_id)
        )
        const contactIdsWithAnyList = new Set(jointures.map(j => j.contact_id))
        const contactsNoList = allContacts.filter(contact => !contactIdsWithAnyList.has(contact.id))
        const contactsInSelectedLists = allContacts.filter(contact => contactIdsWithList.has(contact.id))
        const result = [
          ...contactsNoList,
          ...contactsInSelectedLists.filter(c => !contactsNoList.some(nc => nc.id === c.id))
        ]
        setContacts(result)
        setLoading(false)
      })
    } else if (hasNone) {
      Promise.all([
        supabase.from('Contacts').select('*').eq('userID', user.id),
        supabase.from('Listes_Contacts').select('contact_id'),
      ]).then(([contactsRes, jointureRes]) => {
        const allContacts = contactsRes.data || []
        const contactsWithList = new Set((jointureRes.data || []).map(row => row.contact_id))
        const contactsNoList = allContacts.filter(contact => !contactsWithList.has(contact.id))
        setContacts(contactsNoList)
        setLoading(false)
      })
    } else if (selectedListIdsFiltered.length === 0) {
      supabase
        .from("Contacts")
        .select("*")
        .eq("userID", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setContacts(data || [])
          setLoading(false)
        })
    } else {
      const listIds = selectedListIdsFiltered.map(Number)
      supabase
        .from("Listes_Contacts")
        .select("contact_id")
        .in("liste_id", listIds)
        .then(async ({ data }) => {
          const contactIds = (data || []).map((row) => row.contact_id)
          if (contactIds.length === 0) {
            setContacts([])
            setLoading(false)
          } else {
            const { data: contactsData } = await supabase
              .from("Contacts")
              .select("*")
              .in("id", contactIds)
              .order("created_at", { ascending: false })
            setContacts(contactsData || [])
            setLoading(false)
          }
        })
    }
  }

  useEffect(() => {
    fetchContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedListIds])

  useEffect(() => {
    if (loading) {
      spinnerTimeout.current = setTimeout(() => setShowSpinner(true), 500)
    } else {
      setShowSpinner(false)
      if (spinnerTimeout.current) clearTimeout(spinnerTimeout.current)
    }
    return () => {
      if (spinnerTimeout.current) clearTimeout(spinnerTimeout.current)
    }
  }, [loading])

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const filteredContacts = contacts.filter(
    (contact: Contact) =>
      contact.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              {(selectedListIds.length === 0 && !searchTerm) ? (
                <>Vous avez {contacts.length} contact{contacts.length > 1 ? "s" : ""} dans votre base de données.</>
              ) : (
                filteredContacts.length === 0 ? (
                  <>Aucun contact ne correspond à vos filtres.</>
                ) : filteredContacts.length === 1 ? (
                  <>1 contact correspond à vos filtres.</>
                ) : (
                  <>{filteredContacts.length} contacts correspondent à vos filtres.</>
                )
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Rechercher des contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                <MultiListFilter
                  lists={listes}
                  selectedListIds={selectedListIds}
                  onChange={(ids) => setSelectedListIds(ids.map(String))}
                />
              </div>
            </div>
            <ContactsTable
              contacts={filteredContacts}
              showSpinner={showSpinner}
              searchTerm={searchTerm}
              formatDate={formatDate}
            />
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
