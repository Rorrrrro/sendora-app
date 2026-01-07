"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { AppLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  X,
} from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Template {
  id: string
  nom: string
  html_code?: string
  design_json?: any
  created_at: string
  created_by?: string
  famille_id?: string
}

/**
 * === Aligné EXACTEMENT sur Template Catalog ===
 * (tu voulais homogénéiser tailles + spacing)
 */
const PREVIEW_MAX_WIDTH = 320 // identique catalog
const PREVIEW_CLOSED_HEIGHT = 180 // identique catalog
const CARD_CLOSED_HEIGHT = 260 // identique catalog
const CARD_CHROME_HEIGHT = CARD_CLOSED_HEIGHT - PREVIEW_CLOSED_HEIGHT

type Meta = {
  scale: number
  naturalWidth: number
  naturalHeight: number
  previewWidth: number
}

function wrapIfNeeded(html: string, extraCss: string = "") {
  const trimmed = (html || "").trim()

  const looksLikeFullDoc =
    /<!doctype/i.test(trimmed) || /<html[\s>]/i.test(trimmed) || /<head[\s>]/i.test(trimmed)

  if (looksLikeFullDoc) {
    if (/<head[\s>]/i.test(trimmed)) {
      return trimmed.replace(
        /<head([^>]*)>/i,
        `<head$1>${extraCss ? `<style>${extraCss}</style>` : ""}`
      )
    }
    return `${extraCss ? `<style>${extraCss}</style>` : ""}${trimmed}`
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    ${extraCss ? `<style>${extraCss}</style>` : ""}
  </head>
  <body>
    ${trimmed || "<i>Aucun aperçu</i>"}
  </body>
</html>`
}

function buildPreviewHtml(template: Template) {
  if (template.design_json && typeof template.design_json === "object") {
    const html = template.design_json.html || template.html_code || ""
    const css = template.design_json.css || ""
    return wrapIfNeeded(html, css)
  }
  return wrapIfNeeded(template.html_code || "")
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

  const [templateMeta, setTemplateMeta] = useState<Record<string, Meta>>({})
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})
  const roRef = useRef<ResizeObserver | null>(null)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)

  const rowsPerPage = 10

  useEffect(() => {
    if (user) fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await createBrowserClient()
        .from("Templates")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false })

      if (!error) setTemplates(data || [])
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(
    () => templates.filter((t) => (t.nom || "").toLowerCase().includes(searchTerm.toLowerCase())),
    [templates, searchTerm]
  )

  const totalTemplates = filteredTemplates.length
  const totalPages = Math.max(1, Math.ceil(totalTemplates / rowsPerPage))
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  useEffect(() => {
    if (roRef.current) roRef.current.disconnect()

    roRef.current = new ResizeObserver(() => {
      setTemplateMeta((prev) => ({ ...prev }))
    })

    paginatedTemplates.forEach((t) => {
      const pr = previewRefs.current[t.id]
      if (pr) roRef.current?.observe(pr)
    })

    return () => roRef.current?.disconnect()
  }, [paginatedTemplates])

  const handleIframeLoad = (templateId: string) => {
    const iframe = iframeRefs.current[templateId]
    const previewEl = previewRefs.current[templateId]
    if (!iframe || !previewEl) return

    try {
      const doc = iframe.contentDocument
      if (!doc) return

      const naturalWidth = doc.documentElement.scrollWidth || doc.body?.scrollWidth || 600
      const naturalHeight = doc.documentElement.scrollHeight || doc.body?.scrollHeight || 800

      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH
      const scale = naturalWidth > 0 ? previewWidth / naturalWidth : 1

      setTemplateMeta((p) => ({
        ...p,
        [templateId]: { scale, naturalWidth, naturalHeight, previewWidth },
      }))
    } catch {
      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH
      const naturalWidth = 600
      const naturalHeight = 800
      const scale = previewWidth / naturalWidth

      setTemplateMeta((p) => ({
        ...p,
        [templateId]: { scale, naturalWidth, naturalHeight, previewWidth },
      }))
    }
  }

  useEffect(() => {
    if (loading) return

    paginatedTemplates.forEach((t) => {
      const meta = templateMeta[t.id]
      const previewEl = previewRefs.current[t.id]
      if (!previewEl || !meta) return

      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH
      const scale = meta.naturalWidth > 0 ? previewWidth / meta.naturalWidth : 1

      if (previewWidth !== meta.previewWidth || scale !== meta.scale) {
        setTemplateMeta((p) => ({
          ...p,
          [t.id]: { ...meta, previewWidth, scale },
        }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedTemplates, loading, templateMeta])

  const handleDeleteTemplate = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await createBrowserClient().from("Templates").delete().eq("id", id)
      if (!error) setTemplates((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setDeletingId(null)
      setOpenMenuId(null)
      setShowDeleteDialog(false)
      setTemplateToDelete(null)
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    if (!user) return
    setDuplicatingId(template.id)

    try {
      const copyRegex = /^(.+?)(?: copy(?: (\d+))?)?$/
      const match = template.nom.match(copyRegex)
      if (!match) return

      const baseName = match[1]
      const copyNum = match[2] ? parseInt(match[2]) : null

      let newName: string
      if (copyNum) newName = `${baseName} copy ${copyNum + 1}`
      else if (template.nom.includes(" copy")) newName = `${baseName} copy 2`
      else newName = `${template.nom} copy`

      const existingNames = templates.map((t) => t.nom)
      let counter = copyNum ? copyNum + 1 : 2
      while (existingNames.includes(newName)) {
        newName = `${baseName} copy ${counter}`
        counter++
      }

      const { data, error } = await createBrowserClient()
        .from("Templates")
        .insert({
          nom: newName,
          html_code: template.html_code,
          design_json: template.design_json,
          created_by: user.id,
          famille_id: template.famille_id,
        })
        .select()

      if (!error && data?.[0]) setTemplates((prev) => [data[0], ...prev])
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
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, nom: editingName.trim() } : t))
        )
      }
    } finally {
      setEditingLoading(false)
      setEditingId(null)
      setEditingName("")
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template)
    setPreviewDevice("desktop")
    setPreviewOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground mt-3">
              Créez et gérez vos templates d&apos;emails pour optimiser vos campagnes et maintenir une communication cohérente.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-[#6c43e0] border-[#6c43e0] text-white font-semibold hover:bg-[#4f32a7] hover:border-[#4f32a7] transition"
              onClick={() => router.push("/templates/creer")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un template
            </Button>
          </div>
        </div>

        {/* Modal preview - inchangé (boutons identiques) */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col [&>button]:hidden">
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold">
                  {selectedTemplate?.nom || "Aperçu du template"}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${
                      previewDevice === "mobile" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""
                    }`}
                    onClick={() => setPreviewDevice("mobile")}
                    aria-label="Mobile"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${
                      previewDevice === "tablet" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""
                    }`}
                    onClick={() => setPreviewDevice("tablet")}
                    aria-label="Tablet"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${
                      previewDevice === "desktop" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""
                    }`}
                    onClick={() => setPreviewDevice("desktop")}
                    aria-label="Desktop"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewOpen(false)}
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
              <div
                className={`bg-white border rounded-lg overflow-hidden mx-auto transition-all duration-300 ${
                  previewDevice === "mobile"
                    ? "w-[375px] max-h-[90%] overflow-y-auto"
                    : previewDevice === "tablet"
                    ? "w-[768px] h-[900px] max-h-full"
                    : "w-[1200px] h-full max-h-[90%]"
                }`}
                style={{
                  width: previewDevice === "mobile" ? 375 : previewDevice === "tablet" ? 768 : 1200,
                  height: previewDevice === "mobile" ? "auto" : previewDevice === "tablet" ? 900 : "90%",
                  minHeight: previewDevice === "mobile" ? "667px" : "auto",
                  border: "none",
                  background: "#fff",
                  boxShadow: "0 1px 4px #e0e0e0",
                  display: "block",
                }}
              >
                {selectedTemplate ? (
                  <iframe
                    srcDoc={buildPreviewHtml(selectedTemplate)}
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

        {/* Place directement la grille ici */}
        <div className="mt-6">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            style={{ overflow: "visible" }}
          >
            {paginatedTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchTerm ? "Aucun template trouvé pour cette recherche." : "Aucun template trouvé. Créez votre premier template !"}
              </div>
            ) : (
              paginatedTemplates.map((template) => {
                const meta = templateMeta[template.id]
                const scale = meta?.scale ?? 1
                const naturalHeight = meta?.naturalHeight ?? 800

                const previewHeight = Math.ceil(naturalHeight * scale)
                const cardHeight = previewHeight + CARD_CHROME_HEIGHT

                const isInteractiveOpen = editingId === template.id || openMenuId === template.id
                const srcDoc = buildPreviewHtml(template)

                return (
                  <div key={template.id} className="relative" style={{ overflow: "visible" }}>
                    {/* wrapper fixe : identique catalog */}
                    <div style={{ height: CARD_CLOSED_HEIGHT, position: "relative" }}>
                      <div
                        className={[
                          "group template-card absolute inset-0",
                          // === card style comme catalog ===
                          "bg-white border border-[#E0E1E1] rounded-2xl shadow-sm",
                          "cursor-pointer flex flex-col items-center px-0 pt-4 pb-6",
                          "overflow-visible",
                          "transition-[height,transform,box-shadow] duration-300",
                          "h-[var(--closedCardHeight)]",
                          !isInteractiveOpen
                            ? "hover:h-[var(--cardHeight)] hover:z-50 hover:-translate-y-[6px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                            : "",
                        ].join(" ")}
                        style={
                          {
                            ["--closedCardHeight" as any]: `${CARD_CLOSED_HEIGHT}px`,
                            ["--previewClosedHeight" as any]: `${PREVIEW_CLOSED_HEIGHT}px`,
                            ["--previewHeight" as any]: `${previewHeight}px`,
                            ["--cardHeight" as any]: `${cardHeight}px`,
                          } as React.CSSProperties
                        }
                        // IMPORTANT: clic carte => éditer (comme tu veux)
                        onClick={() =>
                          router.push(
                            `/templates/editeur?id=${template.id}&name=${encodeURIComponent(template.nom)}&mode=edit`
                          )
                        }
                      >
                        {/* === HEADER EXACT CATALOG (padding 4, mb-2, justify-between) === */}
                        <div className="w-full px-4 mb-2 flex items-center justify-between">
                          <div className="font-semibold text-base truncate" style={{ maxWidth: "70%" }}>
                            {editingId === template.id ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="font-semibold text-base px-0 py-0 outline-none bg-transparent border-none shadow-none w-full"
                                disabled={editingLoading}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => {
                                  if (editingName.trim() && editingName !== template.nom) confirmInlineRename()
                                  else cancelInlineRename()
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (editingName.trim() && editingName !== template.nom) confirmInlineRename()
                                    else cancelInlineRename()
                                  }
                                }}
                              />
                            ) : (
                              template.nom
                            )}
                          </div>

                          {/* === BOUTONS: tu as dit "ne change pas" => on garde ton style actuel === */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex items-center justify-center rounded-full w-8 h-8 text-muted-foreground hover:text-[#6c43e0] hover:bg-[#f4f4fd]"
                              onClick={(e) => {
                                e.stopPropagation()
                                startInlineRename(template)
                              }}
                              style={{ display: "inline-flex", flex: "0 0 auto" }}
                              aria-label="Renommer"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <DropdownMenu onOpenChange={(open) => setOpenMenuId(open ? template.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`rounded-full w-8 h-8 text-muted-foreground hover:bg-[#f4f4fd] hover:text-[#3d247a] focus-visible:ring-0 focus-visible:ring-offset-0 ${
                                    openMenuId === template.id ? "bg-[#efeffb] text-[#3d247a]" : ""
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Menu"
                                >
                                  <MoreHorizontal className="w-5 h-5" />
                                  <span className="sr-only">Menu actions</span>
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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

                                <DropdownMenuSeparator />

                                <div className="w-full py-1">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full flex items-center justify-center gap-2 h-8 font-semibold rounded-lg bg-[#d21c3c] border-[#d21c3c] hover:bg-[#b81a34] hover:border-[#b81a34] hover:opacity-90 text-[16px] transition focus:outline-none focus:ring-0"
                                    style={{ minWidth: 0 }}
                                    disabled={deletingId === template.id}
                                    onClick={() => {
                                      setTemplateToDelete(template)
                                      setShowDeleteDialog(true)
                                      setOpenMenuId(null)
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {deletingId === template.id ? "Suppression..." : "Supprimer"}
                                  </Button>
                                </div>
                                {/* Ajout du style global pour le hover */}
                                <style jsx global>{`
                                  .menu-action-item:hover {
                                    background-color: #efeffb !important;
                                    color: #3d247a !important;
                                  }
                                  .menu-action-item:hover svg {
                                    color: #3d247a !important;
                                  }
                                `}</style>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* === PREVIEW WRAPPER EXACT CATALOG (px-4, justify-center, items-start) === */}
                        <div className="w-full flex justify-center items-start px-4">
                          <div
                            ref={(el) => {
                              previewRefs.current[template.id] = el
                            }}
                            className={[
                              "template-preview bg-white rounded-xl border border-[#ececf6] shadow overflow-hidden",
                              "w-full",
                              "max-w-[320px]",
                              "h-[var(--previewClosedHeight)]",
                              "transition-[height,max-width,box-shadow] duration-300",
                              !isInteractiveOpen
                                ? "group-hover:h-[var(--previewHeight)] group-hover:max-w-none group-hover:w-full group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
                                : "",
                            ].join(" ")}
                          >
                            <div
                              className="template-preview-inner"
                              style={{
                                width: meta?.naturalWidth ? `${meta.naturalWidth}px` : "600px",
                                height: meta?.naturalHeight ? `${meta.naturalHeight}px` : "800px",
                                transform: `scale(${scale})`,
                                transformOrigin: "top left",
                              }}
                            >
                              <iframe
                                ref={(el) => {
                                  iframeRefs.current[template.id] = el
                                }}
                                title={`preview-${template.id}`}
                                srcDoc={srcDoc}
                                onLoad={() => handleIframeLoad(template.id)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "0",
                                  display: "block",
                                  background: "white",
                                  pointerEvents: "none",
                                }}
                                sandbox="allow-same-origin"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pagination (inchangée) */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Affichage de {Math.min((currentPage - 1) * rowsPerPage + 1, totalTemplates)} à{" "}
              {Math.min(currentPage * rowsPerPage, totalTemplates)} sur {totalTemplates} templates
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#f4f4fd]"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Page suivante"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Ajout du Dialog de confirmation suppression */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
            <div className="flex flex-col items-center text-center gap-4">
              <DialogHeader className="mb-2">
                <DialogTitle className="mb-4 text-2xl font-bold">
                  Êtes-vous sûr de vouloir supprimer ?
                </DialogTitle>
                <div className="text-[15px] text-muted-foreground mb-4">
                  Cette action est irréversible. Le template sera définitivement supprimé.
                </div>
              </DialogHeader>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setTemplateToDelete(null)
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="bg-[#d21c3c] border-[#d21c3c] text-white hover:bg-[#b81a34] hover:border-[#b81a34] hover:opacity-90 font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
                onClick={() => {
                  if (templateToDelete) handleDeleteTemplate(templateToDelete.id)
                }}
                disabled={deletingId === templateToDelete?.id}
              >
                Supprimer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
