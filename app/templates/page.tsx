'use client'

import React, { useEffect, useState } from "react"
import { AppLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, Eye, Pencil, Copy, Trash2, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { createBrowserClient } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableSkeleton } from "@/components/TableSkeleton"

interface Template {
  id: string
  nom: string
  html_code?: string
  created_at: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const { user } = useUser()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const rowsPerPage = 10
  
  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])
  
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await createBrowserClient()
        .from("Templates")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false })
      
      if (error) {
        console.error("Erreur lors du chargement des templates:", error)
      } else {
        setTemplates(data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteTemplate = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await createBrowserClient()
        .from("Templates")
        .delete()
        .eq("id", id)
      if (error) {
        alert("Erreur lors de la suppression du template.")
      } else {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (err) {
      alert("Erreur lors de la suppression.")
    } finally {
      setDeletingId(null)
      setOpenMenuId(null)
    }
  }

  const filteredTemplates = templates.filter(
    (template) => template.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const totalTemplates = filteredTemplates.length
  const totalPages = Math.max(1, Math.ceil(totalTemplates / rowsPerPage))
  const paginatedTemplates = filteredTemplates.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  
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
            <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground mt-3">Créez et gérez vos templates d'emails pour optimiser vos campagnes et maintenir une communication cohérente.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              className="bg-[#6c43e0] border-[#6c43e0] text-white font-semibold hover:bg-[#4f32a7] hover:border-[#4f32a7] transition"
              onClick={() => router.push('/templates/creer')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un template
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-[#FFFEFF]">
          <CardHeader className="pb-3">
            <CardDescription>
              <span className="text-lg font-bold text-foreground">
                {loading ? (
                  <span className="inline-block h-6 w-48 animate-pulse rounded bg-muted"></span>
                ) : (
                  totalTemplates === 0 ? "Aucun template pour le moment" : `Vous avez ${totalTemplates} template${totalTemplates > 1 ? "s" : ""}`
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
                  placeholder="Rechercher des templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-[#6c43e0] hover:border-[#bdbdbd] transition"
                />
              </div>
            </div>

            {loading ? (
              <TableSkeleton columns={3} rows={4} />
            ) : (
              <div className="mt-6">
                <div className="space-y-4">
                  {paginatedTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "Aucun template trouvé pour cette recherche."
                        : "Aucun template trouvé. Créez votre premier template !"}
                    </div>
                  ) : (
                    paginatedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between rounded-2xl border px-6 py-4 transition-all group
                          bg-[#FAFAFD] border-[#E0E1E1]
                          hover:bg-[#f4f4fd] hover:border-[#6C43E0] shadow-sm hover:shadow-md`}
                      >
                        <div className="flex items-center justify-start flex-1 min-w-0 mr-4 gap-8">
                          {/* Aperçu miniature HTML */}
                          <div className="flex flex-col gap-2.5 w-[90px]">
                            <span className="text-xs text-muted-foreground font-medium">APERÇU</span>
                            <div
                              className="rounded-lg border border-[#e0e0e0] bg-white overflow-hidden flex items-center justify-center"
                              style={{ width: 90, height: 180, boxShadow: "0 1px 4px #e0e0e0", pointerEvents: "none" }}
                            >
                              {template.html_code ? (
                                <iframe
                                  srcDoc={template.html_code}
                                  style={{
                                    width: "375px", // largeur mobile
                                    height: "667px", // hauteur mobile
                                    border: "none",
                                    zoom: 0.24, // 90/375 ≈ 0.24
                                    pointerEvents: "none",
                                    background: "#fff",
                                    display: "block"
                                  }}
                                  sandbox="allow-same-origin"
                                  title={`Aperçu ${template.nom}`}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                  Pas d’aperçu
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2.5 w-[250px]">
                            <span className="text-xs text-muted-foreground font-medium">NOM</span>
                            <div className="font-semibold text-base text-[#23272f] truncate" title={template.nom}>{template.nom}</div>
                          </div>
                          
                          <div className="flex flex-col gap-2.5 w-[120px]">
                            <span className="text-xs text-muted-foreground font-medium">DATE DE CRÉATION</span>
                            <span className="text-base text-[#23272f]">{formatDate(template.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DropdownMenu
                            onOpenChange={(open) => setOpenMenuId(open ? template.id : null)}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`rounded-full w-8 h-8 text-muted-foreground hover:bg-[#e5e4fa] hover:text-[#3d247a] focus-visible:ring-0 focus-visible:ring-offset-0 ${openMenuId === template.id ? 'bg-[#efeffb] text-[#3d247a]' : ''}`}
                              >
                                <MoreHorizontal className="w-5 h-5" />
                                <span className="sr-only">Menu actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                              >
                                <Eye className="h-4 w-4" />
                                Aperçu
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                              >
                                <Pencil className="h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                              >
                                <Copy className="h-4 w-4" />
                                Dupliquer
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
                                  disabled={deletingId === template.id}
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {deletingId === template.id ? "Suppression..." : "Supprimer"}
                                </Button>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Affichage de {Math.min((currentPage - 1) * rowsPerPage + 1, totalTemplates)} à {Math.min(currentPage * rowsPerPage, totalTemplates)} sur {totalTemplates} templates
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[#f4f4fd]"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Page précédente"
                  >
                    <span className="sr-only">Page précédente</span>
                    <FileText className="h-4 w-4" />
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
                    <span className="sr-only">Page suivante</span>
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
