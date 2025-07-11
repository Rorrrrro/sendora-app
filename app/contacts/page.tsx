"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Upload, Trash2, Users, Download, ChevronDown, ChevronUp, UserMinus, UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
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
import { useEffect, useState, useRef, useCallback, Suspense } from "react"
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
import { useSearchParams, useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

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

  const handleSelectAll = (checked: boolean) => {
    filteredContacts.forEach(contact => {
      onSelectionChange(contact.id, checked)
    })
  }

  const allFilteredSelected = filteredContacts.length > 0 && filteredContacts.every(contact => selectedContacts.has(contact.id))
  const someFilteredSelected = filteredContacts.some(contact => selectedContacts.has(contact.id))
  const selectedCount = selectedContacts.size

  return (
    <div className="relative">
      {showSpinner ? (
        <TableSkeleton columns={5} rows={6} />
      ) : (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50 transition-colors">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[60px] text-center">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => {}}
                      aria-label="Sélectionner tous les contacts"
                      disabled
                    />
                  </th>
                  <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Prénom</th>
                  <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Nom</th>
                  <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Email</th>
                  <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Date de création</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "Aucun contact trouvé pour cette recherche."
                        : "Aucun contact trouvé. Créez votre premier contact !"}
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`border-b transition-colors ${selectedContacts.has(contact.id) 
                        ? 'bg-sidebar-selected-bg-light hover:bg-[#e5e4fa] rounded-xl transition-colors' 
                        : 'hover:bg-muted'}`}
                    >
                      <td className="p-4 align-middle text-center h-14">
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={(checked) => onSelectionChange(contact.id, checked as boolean)}
                          aria-label={`Sélectionner ${contact.prenom} ${contact.nom}`}
                        />
                      </td>
                      <td className="p-4 align-middle font-medium text-left h-14">{contact.prenom || "-"}</td>
                      <td className="p-4 align-middle font-medium text-left h-14">{contact.nom || "-"}</td>
                      <td className="p-4 align-middle text-left h-14">{contact.email || "-"}</td>
                      <td className="p-4 align-middle text-left h-14">{formatDate(contact.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ContactsContent() {
  const { user } = useUser()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [createSidebarOpen, setCreateSidebarOpen] = useState(false)
  const [listes, setListes] = useState<{ id: number; nom: string }[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])
  const [showSpinner, setShowSpinner] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const spinnerTimeout = useRef<NodeJS.Timeout | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRemoveFromListDialog, setShowRemoveFromListDialog] = useState(false)
  const [removableLists, setRemovableLists] = useState<{ id: number; nom: string }[]>([])
  const [selectedListsToRemove, setSelectedListsToRemove] = useState<number[]>([])
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [selectedListsToAdd, setSelectedListsToAdd] = useState<number[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchParams = useSearchParams()
  const listId = searchParams.get("list")
  const [isReadyToFetch, setIsReadyToFetch] = useState(false)
  const [isFirstFetchDone, setIsFirstFetchDone] = useState(false)
  const [hasAppliedInitialFilter, setHasAppliedInitialFilter] = useState(false)
  const router = useRouter()

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
        setIsFirstFetchDone(true);
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
        setIsFirstFetchDone(true);
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
          setIsFirstFetchDone(true);
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
            setIsFirstFetchDone(true);
          } else {
            const { data: contactsData } = await supabase
              .from("Contacts")
              .select("*")
              .in("id", contactIds)
              .order("created_at", { ascending: false })
            setContacts(contactsData || [])
            setLoading(false)
            setIsFirstFetchDone(true);
          }
        })
    }
  }

  useEffect(() => {
    const listId = searchParams.get("list");
    if (!hasAppliedInitialFilter && listId && selectedListIds.length === 0) {
      setSelectedListIds([listId]);
      setIsReadyToFetch(true);
      setHasAppliedInitialFilter(true);
    } else if (!listId && !hasAppliedInitialFilter) {
      setIsReadyToFetch(true);
      setHasAppliedInitialFilter(true);
    }
  }, [searchParams, selectedListIds.length, hasAppliedInitialFilter]);

  useEffect(() => {
    if (!user || !isReadyToFetch) return;
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedListIds, isReadyToFetch]);

  useEffect(() => {
    if (loading) {
      spinnerTimeout.current = setTimeout(() => setShowSpinner(true), 200)
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

  const totalContacts = filteredContacts.length
  const totalPages = Math.max(1, Math.ceil(totalContacts / rowsPerPage))
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, rowsPerPage, selectedListIds])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground mt-3">Gérez et organisez tous vos contacts en toute simplicité.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCreateSidebarOpen(true)}
              className="bg-[#FFFEFF] border border-[#e0e0e0] text-[#23272f] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc] hover:border-[#bdbdbd] hover:text-[#23272f] transition"
            >
              <Plus className="mr-2 h-4 w-4 text-[#23272f]" />
              Créer un contact
            </Button>
            <Button
              onClick={() => router.push('/contacts/importer')}
              className="bg-[#6c43e0] text-white hover:bg-[#4f32a7]"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer des contacts
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="mb-4">
              <span className="text-lg font-bold text-foreground">
                {!isFirstFetchDone ? (
                  <span className="inline-block h-6 w-48 animate-pulse rounded bg-muted"></span>
                ) : searchTerm || selectedListIds.length > 0 ? (
                  `${filteredContacts.length} contact${filteredContacts.length > 1 ? "s" : ""} trouvé${filteredContacts.length > 1 ? "s" : ""}`
                ) : (
                  `Vous avez ${contacts.length} contact${contacts.length > 1 ? "s" : ""}`
                )}
              </span>
            </div>
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
            {(showSpinner || (!isReadyToFetch || !isFirstFetchDone)) ? (
              <TableSkeleton columns={5} rows={6} />
            ) : (
              <ContactsTable
                contacts={paginatedContacts}
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
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2">
              <div className="flex items-center gap-2 pl-3">
                <span className="text-sm">Lignes par page</span>
                <Select value={rowsPerPage.toString()} onValueChange={v => setRowsPerPage(Number(v))}>
                  <SelectTrigger className="w-20 h-8 text-sm ml-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-[#3C2578] data-[state=checked]:text-[#3C2578] data-[state=checked]:font-bold data-[state=checked]:bg-[#efeffb] hover:bg-[#f4f4fd]">10</SelectItem>
                    <SelectItem value="25" className="text-[#3C2578] data-[state=checked]:text-[#3C2578] data-[state=checked]:font-bold data-[state=checked]:bg-[#efeffb] hover:bg-[#f4f4fd]">25</SelectItem>
                    <SelectItem value="50" className="text-[#3C2578] data-[state=checked]:text-[#3C2578] data-[state=checked]:font-bold data-[state=checked]:bg-[#efeffb] hover:bg-[#f4f4fd]">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 justify-end text-sm">
                <span>
                  {totalContacts === 0
                    ? "0"
                    : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalContacts)} sur ${totalContacts}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#f4f4fd]"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold">{currentPage}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#f4f4fd]"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
                <div className="flex flex-col items-center text-center gap-4">
                  <AlertDialogHeader className="mb-2">
                    <AlertDialogTitle className="mb-4 text-2xl font-bold">
                      Êtes-vous sûr de vouloir supprimer ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px]">
                      Cette action est irréversible. {selectedContacts.size > 1 ? `Les ${selectedContacts.size} contacts seront` : "Le contact sera"} définitivement supprimé{selectedContacts.size > 1 ? "s" : ""}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel
                    className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
                  >
                    Annuler
                  </AlertDialogCancel>
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
                      Enlever de la liste(s)
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px] mb-4">
                      {selectedContacts.size > 1
                        ? `Sélectionnez la ou les listes desquelles vous souhaitez retirer les ${selectedContacts.size} contacts sélectionnés.`
                        : "Sélectionnez la ou les listes desquelles vous souhaitez retirer ce contact."}
                    </AlertDialogDescription>
                    {removableLists.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        Aucune liste à retirer pour {selectedContacts.size > 1 ? "ces contacts" : "ce contact"}.
                      </p>
                    ) : (
                      <div className="w-full flex flex-col items-start gap-2">
                        <button
                          type="button"
                          className="mb-2 text-sm font-semibold underline text-[#6c43e0] hover:text-[#4f32a7]"
                          onClick={handleToggleAllLists}
                        >
                          {selectedListsToRemove.length === removableLists.length ? "Tout désélectionner" : "Tout sélectionner"}
                        </button>
                        {removableLists.map((list: { id: number; nom: string }) => (
                          <label key={list.id} className="flex items-center gap-2 cursor-pointer w-full py-2 px-2">
                            <Checkbox
                              checked={selectedListsToRemove.includes(list.id)}
                              onCheckedChange={() => handleToggleList(list.id)}
                              hollow={true}
                              className="border-[#6c43e0] data-[state=checked]:text-[#6c43e0] data-[state=checked]:!bg-transparent"
                              icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><circle cx="8" cy="8" r="4" /></svg>}
                              aria-label={list.nom}
                            />
                            <span className="text-[#3d247a]">{list.nom}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
                  >
                    Annuler
                  </AlertDialogCancel>
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
                      {selectedContacts.size > 1
                        ? `Sélectionnez la ou les listes auxquelles vous souhaitez ajouter les ${selectedContacts.size} contacts sélectionnés.`
                        : "Sélectionnez la ou les listes auxquelles vous souhaitez ajouter ce contact."}
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
                              className="absolute z-40 mt-10 w-full bg-[#FFFEFF] border rounded-lg shadow-lg p-0 max-h-60 overflow-auto left-0"
                              style={{ minWidth: triggerRef.current ? triggerRef.current.offsetWidth : undefined }}
                            >
                              <div className="flex flex-col">
                                {listes.map((list) => {
                                  const isSelected = selectedListsToAdd.includes(list.id);
                                  return (
                                    <label
                                      key={list.id}
                                      className={`flex items-center gap-2 cursor-pointer transition-colors py-3 px-3
                                        ${isSelected ? 'bg-[#f4f4fd] hover:bg-[#efeffb]' : 'hover:bg-muted'}`}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => {
                                          setSelectedListsToAdd((prev) =>
                                            prev.includes(list.id)
                                              ? prev.filter((id) => id !== list.id)
                                              : [...prev, list.id]
                                          );
                                        }}
                                        className="h-4 w-4 border-[#6c43e0]"
                                        icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 10 18 4 12" /></svg>}
                                        aria-label={list.nom}
                                      />
                                      <span className="text-[#3d247a]">{list.nom}</span>
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
                  <AlertDialogCancel
                    className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
                  >
                    Annuler
                  </AlertDialogCancel>
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
      <style jsx global>{`
        [data-state='open'] .chevron-down {
          transform: rotate(180deg);
        }
      `}</style>
    </AppLayout>
  )
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
              <p className="text-muted-foreground">Gérez vos contacts et listes</p>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
          <Card>
            <CardContent className="p-6">
              <TableSkeleton columns={5} rows={6} />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    }>
      <ContactsContent />
    </Suspense>
  )
}