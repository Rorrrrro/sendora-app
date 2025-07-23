"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Users, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { EditListSidebar } from "@/components/EditListSidebar"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { callSendyEdgeFunction } from "@/lib/sendyEdge";

interface Liste {
  id: string
  nom: string
  description: string
  nb_contacts: number
  created_at: string
  user_id: string
  sendy_list_id?: string // Ajouté pour la synchro Sendy
}

export default function ListesPage() {
  const { user } = useUser()
  const router = useRouter();
  const [listes, setListes] = useState<Liste[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [createSidebarOpen, setCreateSidebarOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [listeToDelete, setListeToDelete] = useState<Liste | null>(null)
  const [editSidebarOpen, setEditSidebarOpen] = useState(false)
  const [listeToEdit, setListeToEdit] = useState<Liste | null>(null)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchListes()
    }
  }, [user])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && user) {
        fetchListes()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [user])

  const fetchListes = async () => {
    try {
      const { data, error } = await createBrowserClient()
        .from("Listes")
        .select("id, nom, description, nb_contacts, created_at, user_id, sendy_list_id")
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

  const totalListes = filteredListes.length
  const totalPages = Math.max(1, Math.ceil(totalListes / rowsPerPage))
  const paginatedListes = filteredListes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, rowsPerPage])

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Listes</h1>
            <p className="text-muted-foreground mt-3">Créez, modifiez et organisez facilement vos listes pour des interactions ciblées et une gestion optimale.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setCreateSidebarOpen(true)} className="bg-[#6c43e0] border-[#6c43e0] text-white font-semibold hover:bg-[#4f32a7] hover:border-[#4f32a7] transition">
              <Plus className="mr-2 h-4 w-4" />
              Créer une liste
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>
              <span className="text-lg font-bold text-foreground">
                {loading ? (
                  <span className="inline-block h-6 w-48 animate-pulse rounded bg-muted"></span>
                ) : (
                  `Vous avez ${listes.length} liste${listes.length > 1 ? "s" : ""}`
                )}
              </span>
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
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-[#6c43e0]"
                />
              </div>
            </div>

            {loading ? (
              <TableSkeleton columns={5} rows={6} />
            ) : (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 transition-colors">
                        <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Nom</th>
                        <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Description</th>
                        <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Nombre de contacts</th>
                        <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground text-left">Date de création</th>
                        <th className="h-12 px-4 align-middle text-xs uppercase text-muted-foreground w-16 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-muted-foreground">
                            {searchTerm
                              ? "Aucune liste trouvée pour cette recherche."
                              : "Aucune liste trouvée. Créez votre première liste !"}
                          </td>
                        </tr>
                      ) : (
                        paginatedListes.map((liste) => (
                          <tr key={liste.id} className="border-b transition-colors hover:bg-muted h-14">
                            <td className="p-4 align-middle text-left font-medium">{liste.nom || "-"}</td>
                            <td className="p-4 align-middle text-left">
                              <div className="max-w-[200px] truncate" title={liste.description}>
                                {liste.description || "-"}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-left">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {liste.nb_contacts || 0}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-left">{formatDate(liste.created_at)}</td>
                            <td className="p-4 align-middle text-center">
                              <DropdownMenu
                                onOpenChange={(open) => setOpenMenuId(open ? liste.id : null)}
                              >
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full w-8 h-8 text-muted-foreground hover:bg-[#e5e4fa] hover:text-[#3d247a] focus-visible:ring-0 focus-visible:ring-offset-0 ${openMenuId === liste.id ? 'bg-[#efeffb] text-[#3d247a]' : ''}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Ouvrir le menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                                    onClick={() => {
                                      setListeToEdit(liste);
                                      setEditSidebarOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Modifier la liste
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                                    onClick={() => {
                                      router.push(`/contacts?list=${liste.id}`);
                                    }}
                                  >
                                    <Users className="h-4 w-4" />
                                    Gérer les contacts
                                  </DropdownMenuItem>
                                  <style jsx global>{`
                                    .menu-action-item:hover {
                                      background-color: #efeffb !important;
                                      color: #3d247a !important;
                                    }
                                    .menu-action-item:hover svg {
                                      color: #3d247a !important;
                                    }
                                  `}</style>
                                  <DropdownMenuSeparator />
                                  <div className="w-full py-1">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="w-full flex items-center justify-center gap-2 h-8 font-semibold rounded-lg bg-[#d21c3c] border-[#d21c3c] hover:bg-[#b81a34] hover:border-[#b81a34] hover:opacity-90 text-[16px] transition focus:outline-none focus:ring-0"
                                      style={{ minWidth: 0 }}
                                      onClick={() => { setListeToDelete(liste); setShowDeleteDialog(true); }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination et sélecteur de lignes par page dans la carte */}
            {filteredListes.length > 0 && (
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
                    {totalListes === 0
                      ? "0"
                      : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalListes)} sur ${totalListes}`}
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
            )}
          </CardContent>
        </Card>

        <CreateListSidebar
          isOpen={createSidebarOpen}
          onClose={() => setCreateSidebarOpen(false)}
          onListCreated={fetchListes}
        />

        <EditListSidebar
          isOpen={editSidebarOpen}
          onClose={() => {
            setEditSidebarOpen(false);
            setListeToEdit(null);
          }}
          list={listeToEdit}
          onSave={async (data) => {
            if (!listeToEdit) return;
            // Met à jour la liste dans la base de données
            const supabase = createBrowserClient();
            await supabase.from("Listes").update({ nom: data.nom, description: data.description }).eq("id", listeToEdit.id);
            // Appel Edge Function pour Sendy
            if (listeToEdit.sendy_list_id) {
              try {
                await callSendyEdgeFunction("sync-sendy-lists-update", {
                  id: listeToEdit.id,
                  nom: data.nom,
                  sendy_list_id: listeToEdit.sendy_list_id
                });
              } catch (err) {
                console.error("Erreur synchro Sendy:", err);
              }
            }
            setEditSidebarOpen(false);
            setListeToEdit(null);
            await fetchListes();
          }}
          onShowContacts={() => {
            if (listeToEdit) {
              router.push(`/contacts?list=${listeToEdit.id}`);
            }
          }}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertDialogHeader className="mb-2">
                <AlertDialogTitle className="mb-4 text-2xl font-bold">
                  Supprimer la liste
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[15px] flex flex-col gap-3">
                  {listeToDelete ? (
                    <>
                      <span>Vous êtes sur le point de supprimer la liste <b>{listeToDelete.nom}</b>.</span>
                      <span>Les contacts ne seront pas supprimés, mais ils n'appartiendront plus à cette liste.</span>
                    </>
                  ) : null}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!listeToDelete) return;
                  const supabase = createBrowserClient();
                  // Supprimer les associations Listes_Contacts
                  await supabase.from("Listes_Contacts").delete().eq("liste_id", listeToDelete.id);
                  // Supprimer la liste
                  await supabase.from("Listes").delete().eq("id", listeToDelete.id).eq("user_id", user?.id);
                  setShowDeleteDialog(false);
                  setListeToDelete(null);
                  fetchListes();
                }}
                style={{ backgroundColor: '#d21c3c', borderColor: '#d21c3c' }}
                className="text-white hover:opacity-90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
} 