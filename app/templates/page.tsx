'use client'

import React, { useEffect, useState } from "react"
import { AppLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, Eye, Pencil, Copy, Trash2, FileText, Smartphone, Tablet, Monitor, X, Check } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Template {
  id: string
  nom: string
  html_code?: string
  design_json?: any
  created_at: string
  created_by?: string
  famille_id?: string // Ajout du champ famille_id
}

function useDevicePreview() {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop")
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      if (w < 640) setDevice("mobile")
      else if (w < 1024) setDevice("tablet")
      else setDevice("desktop")
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  return device
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
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("desktop")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>("")
  const [editingLoading, setEditingLoading] = useState(false)
  const rowsPerPage = 10
  const device = useDevicePreview()
  
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

  const handleDuplicateTemplate = async (template: Template) => {
    if (!user) return
    setDuplicatingId(template.id)
    
    try {
      // Vérifier si le nom contient déjà "copy"
      const copyRegex = /^(.+?)(?: copy(?: (\d+))?)?$/
      const match = template.nom.match(copyRegex)
      
      if (!match) return // Protection contre les erreurs
      
      const baseName = match[1] // Nom de base sans "copy"
      const copyNum = match[2] ? parseInt(match[2]) : null // Numéro actuel s'il existe
      
      let newName
      
      // Déterminer le nouveau nom
      if (copyNum) {
        // Si c'est déjà une copie numérotée (ex: "xxx copy 2"), incrémenter le numéro
        newName = `${baseName} copy ${copyNum + 1}`
      } else if (template.nom.includes(' copy')) {
        // Si c'est une première copie (ex: "xxx copy"), ajouter le numéro 2
        newName = `${baseName} copy 2`
      } else {
        // Si ce n'est pas une copie, ajouter "copy"
        newName = `${template.nom} copy`
      }
      
      // Vérifier si le nom existe déjà et ajuster si nécessaire
      const existingNames = templates.map(t => t.nom)
      let counter = copyNum ? copyNum + 1 : 2
      while (existingNames.includes(newName)) {
        newName = `${baseName} copy ${counter}`
        counter++
      }
      
      // Créer une copie du template avec tous les champs nécessaires
      const { data, error } = await createBrowserClient()
        .from("Templates")
        .insert({
          nom: newName,
          html_code: template.html_code,
          design_json: template.design_json,
          created_by: user.id,
          famille_id: template.famille_id
        })
        .select()
      
      if (error) {
        // Échec silencieux, pas d'alerte
      } else if (data) {
        // Ajouter le nouveau template à la liste et rafraîchir
        setTemplates(prev => [data[0], ...prev])
      }
    } catch (err) {
      // Échec silencieux, pas d'alerte
    } finally {
      setDuplicatingId(null)
      setOpenMenuId(null)
    }
  }
  
  const startInlineRename = (template: Template) => {
    setEditingId(template.id)
    setEditingName(template.nom)
  }

  const cancelInlineRename = () => {
    setEditingId(null)
    setEditingName("")
  }

  const confirmInlineRename = async () => {
    if (!editingId || !editingName.trim()) return
    setEditingLoading(true)
    try {
      const { error } = await createBrowserClient()
        .from("Templates")
        .update({ nom: editingName.trim() })
        .eq("id", editingId)
      if (!error) {
        setTemplates(templates.map(t =>
          t.id === editingId ? { ...t, nom: editingName.trim() } : t
        ))
      }
    } catch (err) {
      // Erreur silencieuse
    } finally {
      setEditingLoading(false)
      setEditingId(null)
      setEditingName("")
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

  // Fonction pour ouvrir l'aperçu du template
  const handlePreview = (template: Template) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
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

        {/* Modal d'aperçu du template */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col">
            {/* Style pour masquer complètement la croix par défaut */}
            <style jsx global>{`
              button[data-radix-collection-item] {
                display: none !important;
              }
              
              [role="dialog"] > button {
                display: none !important;
              }
            `}</style>
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold">{selectedTemplate?.nom || "Aperçu du template"}</DialogTitle>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-8 w-8 ${previewDevice === "mobile" ? 'bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]' : ''}`}
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-8 w-8 ${previewDevice === "tablet" ? 'bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]' : ''}`}
                    onClick={() => setPreviewDevice("tablet")}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-8 w-8 ${previewDevice === "desktop" ? 'bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]' : ''}`}
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setPreviewOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
              <div 
                className={`bg-white border rounded-lg overflow-hidden mx-auto transition-all duration-300 ${
                  previewDevice === "mobile" ? "w-[375px] max-h-[90%] overflow-y-auto" :
                  previewDevice === "tablet" ? "w-[768px] h-[900px] max-h-full" :
                  "w-[1200px] h-full max-h-[90%]"
                }`}
              >
                {selectedTemplate?.html_code ? (
                  <iframe
                    srcDoc={selectedTemplate.html_code}
                    style={{
                      width: "100%",
                      height: previewDevice === "mobile" ? "auto" : "100%",
                      minHeight: previewDevice === "mobile" ? "667px" : "auto",
                      border: "none",
                      background: "#fff",
                    }}
                    title={`Aperçu ${selectedTemplate.nom}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Pas de contenu HTML à afficher
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
          <CardContent className="pt-10">
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
              <TableSkeleton columns={2} rows={2} />
            ) : (
              <div className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedTemplates.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "Aucun template trouvé pour cette recherche."
                        : "Aucun template trouvé. Créez votre premier template !"}
                    </div>
                  ) : (
                    paginatedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="relative flex flex-col rounded-2xl border bg-[#FAFAFD] border-[#E0E1E1] shadow-sm hover:shadow-md transition-all p-4
                          h-[260px] min-h-[260px] sm:h-[300px] sm:min-h-[300px] lg:h-[340px] lg:min-h-[340px]"
                      >
                        {/* Nom du template + menu actions */}
                        <div
                          className="flex items-center justify-between"
                          style={{ minHeight: "2.5rem", display: "flex", alignItems: "center" }}
                        >
                          <div
                            className="flex items-center flex-nowrap w-full justify-between"
                            style={{ minWidth: 0 }}
                          >
                            <div
                              className="overflow-x-auto flex items-center"
                              style={{
                                maxWidth: "70%",
                                flex: "1 1 70%",
                                minWidth: 0,
                                whiteSpace: "nowrap",
                                height: "2.5rem"
                              }}
                            >
                              {editingId === template.id ? (
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={e => setEditingName(e.target.value)}
                                  className="font-bold text-lg lg:text-xl text-[#23272f] px-0 py-0 outline-none bg-transparent border-none shadow-none"
                                  style={{
                                    minHeight: "2.5rem",
                                    lineHeight: "2.5rem",
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    display: "inline-block",
                                    width: "100%",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    border: "none",
                                    background: "transparent"
                                  }}
                                  disabled={editingLoading}
                                  autoFocus
                                  onBlur={() => {
                                    if (editingName.trim() && editingName !== template.nom) {
                                      confirmInlineRename()
                                    } else {
                                      cancelInlineRename()
                                    }
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      if (editingName.trim() && editingName !== template.nom) {
                                        confirmInlineRename()
                                      } else {
                                        cancelInlineRename()
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <span
                                  className="font-bold text-lg lg:text-xl text-[#23272f]"
                                  style={{
                                    minHeight: "2.5rem",
                                    lineHeight: "2.5rem",
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    display: "inline-block",
                                    width: "100%",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    border: "none",
                                    background: "transparent"
                                  }}
                                  title={template.nom}
                                >
                                  {template.nom}
                                </span>
                              )}
                            </div>
                            {/* Bouton renommer et menu ... alignés à droite avec plus d'espace */}
                            <div className="flex items-center gap-2 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex items-center justify-center rounded-full w-8 h-8 text-muted-foreground hover:text-[#6c43e0] hover:bg-[#f4f4fd]"
                                onClick={() => startInlineRename(template)}
                                style={{
                                  display: "inline-flex",
                                  flex: "0 0 auto"
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <DropdownMenu
                                onOpenChange={(open) => setOpenMenuId(open ? template.id : null)}
                              >
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`rounded-full w-8 h-8 text-muted-foreground hover:bg-[#f4f4fd] hover:text-[#3d247a] focus-visible:ring-0 focus-visible:ring-offset-0 ${openMenuId === template.id ? 'bg-[#efeffb] text-[#3d247a]' : ''}`}
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                    <span className="sr-only">Menu actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                                    onClick={() => handlePreview(template)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Aperçu
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                                    onClick={() => {
                                      router.push(`/templates/editeur?id=${template.id}&name=${encodeURIComponent(template.nom)}&mode=edit`)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                                    onClick={() => handleDuplicateTemplate(template)}
                                    disabled={duplicatingId === template.id}
                                  >
                                    <Copy className="h-4 w-4" />
                                    {duplicatingId === template.id ? "Duplication..." : "Dupliquer"}
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
                        </div>
                        {/* Corps avec aperçu - augmenté à 80% de hauteur */}
                        <div className="flex-grow flex items-center justify-center" style={{ height: "80%" }}>
                          <div
                            className="rounded-lg border border-[#e0e0e0] bg-white overflow-hidden flex items-center justify-center box-border"
                            style={{
                              boxShadow: "0 1px 4px #e0e0e0",
                              pointerEvents: "none",
                              height: "100%",
                              aspectRatio: "375/667"
                            }}
                          >
                            {template.html_code ? (
                              <iframe
                                srcDoc={template.html_code}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "none",
                                  zoom: 0.40,
                                  pointerEvents: "none",
                                  background: "#fff",
                                  display: "block"
                                }}
                                sandbox="allow-same-origin"
                                title={`Aperçu ${template.nom}`}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
                                Pas d'aperçu
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Pied de page avec date - réduit à 10% de hauteur */}
                        <div className="mt-0.5 flex-shrink-0 pb-1 flex items-end" style={{ height: "10%" }}>
                          <div className="text-xs text-muted-foreground text-left truncate whitespace-nowrap">
                            Dernière modification : {formatDate(template.created_at)}
                          </div>
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
