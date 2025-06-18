"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Upload, Trash2, Users, Download, ChevronDown, ChevronUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { AppLayout } from "@/components/dashboard-layout"
import { useUser } from "@/contexts/user-context"
import { useEffect, useState, useRef, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { CreateContactSidebar } from "@/components/create-contact-sidebar"
import { MultiListFilter } from "@/components/MultiListFilter"
import { TableSkeleton } from "@/components/TableSkeleton"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"

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
  selectedContacts,
  onSelectionChange,
  onBulkDelete,
  onBulkAddToList,
  onBulkRemoveFromList,
}: {
  contacts: Contact[];
  showSpinner: boolean;
  searchTerm: string;
  formatDate: (dateString: string) => string;
  selectedContacts: Set<string>;
  onSelectionChange: (contactId: string, selected: boolean) => void;
  onBulkDelete: () => void;
  onBulkAddToList: () => void;
  onBulkRemoveFromList: () => void;
}) {
  const filteredContacts = contacts.filter(
    (contact: Contact) =>
      contact.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const allFilteredSelected = filteredContacts.every(contact => selectedContacts.has(contact.id))
  const someFilteredSelected = filteredContacts.some(contact => selectedContacts.has(contact.id))

  const handleSelectAll = (checked: boolean) => {
    filteredContacts.forEach(contact => {
      onSelectionChange(contact.id, checked)
    })
  }

  const selectedCount = selectedContacts.size

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
        <>
          {/* Barre d'actions en lot */}
          {selectedCount > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedCount} contact{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkAddToList}
                  className="h-8"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Ajouter à une liste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkRemoveFromList}
                  className="h-8"
                >
                  Enlever de la liste
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBulkDelete}
                  className="h-8 text-white hover:opacity-90"
                  style={{ backgroundColor: '#d21c3c', borderColor: '#d21c3c' }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 transition-colors">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[60px]">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Sélectionner tous les contacts"
                      />
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Prénom</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date de création</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`border-b transition-colors ${selectedContacts.has(contact.id) 
                        ? 'bg-sidebar-selected-bg-light hover:bg-[#dddcf6] rounded-xl transition-colors' 
                        : 'hover:bg-muted'}`}
                    >
                      <td className="p-4 align-middle">
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={(checked) => onSelectionChange(contact.id, checked as boolean)}
                          aria-label={`Sélectionner ${contact.prenom} ${contact.nom}`}
                        />
                      </td>
                      <td className="p-4 align-middle font-medium">{contact.prenom || "-"}</td>
                      <td className="p-4 align-middle font-medium">{contact.nom || "-"}</td>
                      <td className="p-4 align-middle">{contact.email || "-"}</td>
                      <td className="p-4 align-middle">{formatDate(contact.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const spinnerTimeout = useRef<NodeJS.Timeout | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRemoveFromListDialog, setShowRemoveFromListDialog] = useState(false)
  const [removableLists, setRemovableLists] = useState<{ id: number; nom: string }[]>([])
  const [selectedListsToRemove, setSelectedListsToRemove] = useState<number[]>([])
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [selectedListsToAdd, setSelectedListsToAdd] = useState<number[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (user) {
      createBrowserClient()
        .from("Listes")
        .select("id, nom")
        .eq("user_id", user.id)
        .then(({ data }) => setListes(data || []))
    }
  }, [user])

  useEffect(() => {
    setSelectedContacts(new Set())
  }, [contacts])

  useEffect(() => {
    if (showRemoveFromListDialog && selectedContacts.size > 0 && user) {
      const supabase = createBrowserClient()
      supabase
        .from("Listes_Contacts")
        .select("liste_id, Listes(nom)")
        .in("contact_id", Array.from(selectedContacts))
        .then(({ data }) => {
          const uniqueLists: { id: number; nom: string }[] = []
          const seen = new Set()
          for (const row of data as any[] || []) {
            const listes = row.Listes;
            let nom = undefined;
            if (Array.isArray(listes)) {
              nom = listes[0]?.nom;
            } else if (listes && typeof listes === 'object') {
              nom = listes.nom;
            }
            if (row.liste_id && nom && !seen.has(row.liste_id)) {
              uniqueLists.push({ id: row.liste_id, nom });
              seen.add(row.liste_id);
            }
          }
          setRemovableLists(uniqueLists)
          setSelectedListsToRemove(uniqueLists.map(l => l.id))
        })
    } else if (!showRemoveFromListDialog) {
      setRemovableLists([])
      setSelectedListsToRemove([])
    }
  }, [showRemoveFromListDialog, selectedContacts, user])

  const handleBulkDelete = async () => {
    if (!user || selectedContacts.size === 0) return
    setShowDeleteDialog(false)
    setLoading(true)
    const supabase = createBrowserClient()
    try {
      await supabase
        .from("Listes_Contacts")
        .delete()
        .in("contact_id", Array.from(selectedContacts))
      const { error } = await supabase
        .from("Contacts")
        .delete()
        .in("id", Array.from(selectedContacts))
        .eq("userID", user.id)
      if (error) {
        console.error("Erreur lors de la suppression:", error)
        alert("Erreur lors de la suppression des contacts")
      } else {
        setSelectedContacts(new Set())
        fetchContacts()
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      alert("Erreur lors de la suppression des contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAddToList = () => {
    if (selectedContacts.size === 0) return
    setShowAddToListDialog(true)
  }

  const handleToggleList = (id: number) => {
    setSelectedListsToRemove(prev =>
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    )
  }
  const handleToggleAllLists = () => {
    if (selectedListsToRemove.length === removableLists.length) {
      setSelectedListsToRemove([])
    } else {
      setSelectedListsToRemove(removableLists.map(l => l.id))
    }
  }

  const handleRemoveFromLists = async () => {
    if (!user || selectedContacts.size === 0 || selectedListsToRemove.length === 0) return;
    setShowRemoveFromListDialog(false);
    setLoading(true);
    const supabase = createBrowserClient();
    try {
      await Promise.all(
        selectedListsToRemove.map(listeId =>
          supabase
            .from("Listes_Contacts")
            .delete()
            .eq("liste_id", listeId)
            .in("contact_id", Array.from(selectedContacts))
        )
      );
      fetchContacts();
      setSelectedContacts(new Set());
    } catch (error) {
      alert("Erreur lors du retrait des contacts de la ou des listes.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleListToAdd = (id: number) => {
    setSelectedListsToAdd(prev =>
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    )
  }
  const handleAddToLists = async () => {
    if (!user || selectedContacts.size === 0 || selectedListsToAdd.length === 0) {
      setShowAddToListDialog(false)
      setSelectedListsToAdd([])
      return
    }
    const supabase = createBrowserClient();
    try {
      await Promise.all(
        selectedListsToAdd.flatMap(listeId =>
          Array.from(selectedContacts).map(contactId =>
            supabase.from("Listes_Contacts").insert([
              { liste_id: Number(listeId), contact_id: Number(contactId), user_id: user.id }
            ])
          )
        )
      );
      setShowAddToListDialog(false)
      setSelectedListsToAdd([])
      setSelectedContacts(new Set())
      fetchContacts()
    } catch (error) {
      alert("Erreur lors de l'ajout aux listes.")
    }
  }

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
              <Button
                className="bg-[#6c43e0] border-[#6c43e0] text-white font-semibold hover:bg-[#4f32a7] hover:border-[#4f32a7] transition"
              >
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
                    className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-[#6c43e0]"
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
              selectedContacts={selectedContacts}
              onSelectionChange={(contactId, selected) => {
                if (selected) {
                  setSelectedContacts(prev => new Set(prev).add(contactId))
                } else {
                  setSelectedContacts(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(contactId)
                    return newSet
                  })
                }
              }}
              onBulkDelete={() => setShowDeleteDialog(true)}
              onBulkAddToList={handleBulkAddToList}
              onBulkRemoveFromList={() => setShowRemoveFromListDialog(true)}
            />
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
                <div className="flex flex-col items-center text-center gap-4">
                  <AlertDialogHeader className="mb-2">
                    <AlertDialogTitle className="mb-4 text-2xl font-bold">
                      Supprimer définitivement
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px]">
                      Vous êtes sur le point de supprimer {selectedContacts.size} contact{selectedContacts.size > 1 ? "s" : ""} sélectionné{selectedContacts.size > 1 ? "s" : ""}.
                      <span className="block mt-3">La suppression est permanente et ne peut pas être annulée.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} style={{ backgroundColor: '#d21c3c', borderColor: '#d21c3c' }} className="text-white hover:opacity-90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={showRemoveFromListDialog} onOpenChange={setShowRemoveFromListDialog}>
              <AlertDialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
                <div className="flex flex-col items-center text-center gap-4 w-full">
                  <AlertDialogHeader className="mb-2 w-full">
                    <AlertDialogTitle className="mb-4 text-2xl font-bold">
                      Retirer de liste(s)
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px] mb-4">
                      Sélectionnez les listes dont vous souhaitez retirer {selectedContacts.size} contact{selectedContacts.size > 1 ? "s" : ""}.
                    </AlertDialogDescription>
                    {removableLists.length === 0 ? (
                      <div className="text-muted-foreground text-sm">Aucune liste à retirer pour ces contacts.</div>
                    ) : (
                      <div className="w-full flex flex-col items-start gap-2">
                        <button
                          type="button"
                          className="mb-2 text-sm font-medium text-primary underline"
                          onClick={handleToggleAllLists}
                        >
                          {selectedListsToRemove.length === removableLists.length ? "Tout désélectionner" : "Tout sélectionner"}
                        </button>
                        {removableLists.map((list: { id: number; nom: string }) => (
                          <label key={list.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedListsToRemove.includes(list.id)}
                              onChange={() => handleToggleList(list.id)}
                              className="accent-primary"
                            />
                            <span>{list.nom}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveFromLists}
                    className="text-white transition bg-[#6c43e0] border-[#6c43e0] hover:bg-[#4f32a7] hover:border-[#4f32a7]"
                    disabled={selectedListsToRemove.length === 0}
                  >
                    Retirer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={showAddToListDialog} onOpenChange={setShowAddToListDialog}>
              <AlertDialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
                <div className="flex flex-col items-center text-center gap-4 w-full">
                  <AlertDialogHeader className="mb-2 w-full">
                    <AlertDialogTitle className="mb-4 text-2xl font-bold">
                      Ajouter à une liste(s)
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px] mb-4">
                      Sélectionnez les listes auxquelles vous souhaitez ajouter {selectedContacts.size} contact{selectedContacts.size > 1 ? "s" : ""}.
                    </AlertDialogDescription>
                    {listes.length === 0 ? (
                      <div className="text-muted-foreground text-sm">Aucune liste disponible.</div>
                    ) : (
                      <div className="w-full flex flex-col items-start gap-2 relative">
                        <button
                          ref={triggerRef}
                          type="button"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm font-medium shadow-sm flex items-center justify-between focus:outline-none focus:border-[#6c43e0]"
                          onClick={() => setPopoverOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={popoverOpen}
                        >
                          <span>
                            {selectedListsToAdd.length === 0
                              ? "Sélectionner une ou plusieurs listes"
                              : `${selectedListsToAdd.length} liste${selectedListsToAdd.length > 1 ? "s" : ""} sélectionnée${selectedListsToAdd.length > 1 ? "s" : ""}`}
                          </span>
                          {popoverOpen ? <ChevronUp className="ml-2 h-4 w-4 text-muted-foreground" /> : <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />}
                        </button>
                        {popoverOpen && (
                          <>
                            {/* Overlay pour fermer au clic extérieur */}
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setPopoverOpen(false)}
                              aria-hidden="true"
                            />
                            <div
                              className="absolute z-40 mt-10 w-full bg-white border rounded-lg shadow-lg p-0 max-h-60 overflow-auto left-0"
                              style={{ minWidth: triggerRef.current ? triggerRef.current.offsetWidth : undefined }}
                            >
                              <div className="flex flex-col">
                                {listes.map((list) => {
                                  const isSelected = selectedListsToAdd.includes(list.id);
                                  return (
                                    <label
                                      key={list.id}
                                      className={`flex items-center gap-2 cursor-pointer transition-colors py-3 px-3
                                        ${isSelected ? 'bg-[#f4f4fd] hover:bg-[#dddcf6]' : 'hover:bg-muted'}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          setSelectedListsToAdd((prev) =>
                                            prev.includes(list.id)
                                              ? prev.filter((id) => id !== list.id)
                                              : [...prev, list.id]
                                          );
                                        }}
                                        className="accent-primary w-4 h-4"
                                      />
                                      <span>{list.nom}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAddToLists}
                    className="text-white transition bg-[#6c43e0] border-[#6c43e0] hover:bg-[#4f32a7] hover:border-[#4f32a7]"
                    disabled={selectedListsToAdd.length === 0}
                  >
                    Ajouter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
