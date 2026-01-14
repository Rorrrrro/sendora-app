"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/dashboard-layout";
import { createBrowserClient } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/user-context";
import { Eye, Smartphone, Tablet, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PREVIEW_MAX_WIDTH = 320; // taille de base (tu ne la changes pas)
const PREVIEW_CLOSED_HEIGHT = 180;

// Hauteur "fermée" de la card (doit matcher le wrapper fixe)
const CARD_CLOSED_HEIGHT = 260;

// Espace hors preview (titre + padding etc.)
const CARD_CHROME_HEIGHT = CARD_CLOSED_HEIGHT - PREVIEW_CLOSED_HEIGHT;

// Pour éviter que certains templates géants explosent la carte au hover
const OPEN_PREVIEW_MAX_HEIGHT = 900;

type Meta = {
  scale: number;
  naturalWidth: number;
  naturalHeight: number;
  previewWidth: number;
};

function wrapIfNeeded(html: string, extraCss: string = "") {
  const trimmed = (html || "").trim();

  // Si c'est déjà un document complet, on retourne tel quel (en injectant le CSS éventuel)
  const looksLikeFullDoc =
    /<!doctype/i.test(trimmed) || /<html[\s>]/i.test(trimmed) || /<head[\s>]/i.test(trimmed);

  if (looksLikeFullDoc) {
    // Injecter le CSS éventuel juste après <head> si possible, sinon préfixer
    if (/<head[\s>]/i.test(trimmed)) {
      return trimmed.replace(
        /<head([^>]*)>/i,
        `<head$1>${extraCss ? `<style>${extraCss}</style>` : ""}`
      );
    }
    return `${extraCss ? `<style>${extraCss}</style>` : ""}${trimmed}`;
  }

  // Sinon, on wrap dans un doc
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    ${extraCss ? `<style>${extraCss}</style>` : ""}
  </head>
  <body>
    ${trimmed || "<i>Aucun aperçu</i>"}
  </body>
</html>`;
}

function buildPreviewHtml(catalog: any) {
  // Si design_json contient html et css, on assemble
  if (catalog.design_json && typeof catalog.design_json === "object") {
    const html = catalog.design_json.html || catalog.html_code || "";
    const css = catalog.design_json.css || "";
    return wrapIfNeeded(html, css);
  }
  // Fallback : html_code (souvent un doc complet)
  return wrapIfNeeded(catalog.html_code || "");
}

const CatalogSelectionPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateName = searchParams.get("name") || "";
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const { user } = useUser();

  const [templateMeta, setTemplateMeta] = useState<Record<string, Meta>>({});

  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const roRef = useRef<ResizeObserver | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const visibleCatalogs = useMemo(
    () => catalogs.filter((c) => c.nom !== "Template Vide"),
    [catalogs]
  );

  // Fetch catalogs
  useEffect(() => {
    const fetchCatalogs = async () => {
      const { data, error } = await supabase.from("Template_catalog").select("*");
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les templates catalog.",
          variant: "destructive",
        });
      } else {
        setCatalogs(data || []);
      }
      setLoading(false);
    };
    fetchCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ResizeObserver sur les containers de preview (pour recalculer le scale)
  useEffect(() => {
    if (roRef.current) roRef.current.disconnect();

    roRef.current = new ResizeObserver(() => {
      // Force recalcul: on remet le state identique => useEffect recalcul plus bas
      setTemplateMeta((prev) => ({ ...prev }));
    });

    visibleCatalogs.forEach((c) => {
      const pr = previewRefs.current[c.id];
      if (pr) roRef.current?.observe(pr);
    });

    return () => roRef.current?.disconnect();
  }, [visibleCatalogs]);

  // Quand l'iframe charge, on mesure son contenu (même-origin via srcDoc)
  const handleIframeLoad = (catalogId: string) => {
    const iframe = iframeRefs.current[catalogId];
    const previewEl = previewRefs.current[catalogId];
    if (!iframe || !previewEl) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Mesures fiables : documentElement
      const naturalWidth =
        doc.documentElement.scrollWidth || doc.body?.scrollWidth || 600;
      const naturalHeight =
        doc.documentElement.scrollHeight || doc.body?.scrollHeight || 400;

      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH;
      const scale = naturalWidth > 0 ? previewWidth / naturalWidth : 1;

      setTemplateMeta((p) => ({
        ...p,
        [catalogId]: { scale, naturalWidth, naturalHeight, previewWidth },
      }));
    } catch {
      // Si jamais ça pète, on fallback sur une base email classique
      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH;
      const naturalWidth = 600;
      const naturalHeight = 800;
      const scale = previewWidth / naturalWidth;

      setTemplateMeta((p) => ({
        ...p,
        [catalogId]: { scale, naturalWidth, naturalHeight, previewWidth },
      }));
    }
  };

  // Recalcule scale quand la largeur change (même sans reload iframe)
  useEffect(() => {
    if (loading) return;

    visibleCatalogs.forEach((catalog) => {
      const meta = templateMeta[catalog.id];
      const previewEl = previewRefs.current[catalog.id];
      if (!previewEl || !meta) return;

      const previewWidth = previewEl.clientWidth || PREVIEW_MAX_WIDTH;
      const scale = meta.naturalWidth > 0 ? previewWidth / meta.naturalWidth : 1;

      if (previewWidth !== meta.previewWidth || scale !== meta.scale) {
        setTemplateMeta((p) => ({
          ...p,
          [catalog.id]: {
            ...meta,
            previewWidth,
            scale,
          },
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCatalogs, loading, templateMeta]);

  const handleSelectCatalog = async (catalog: any) => {
    if (!templateName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez nommer votre template",
        variant: "destructive",
      });
      return;
    }

    try {
      let familleId = user?.compte_parent_id;
      if (!familleId) familleId = user?.id ?? "";
      const createdBy = user?.id ?? "";
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("Templates")
        .insert({
          nom: templateName,
          html_code: catalog.html_code ?? "",
          design_json: catalog.design_json ?? {},
          created_by: createdBy,
          famille_id: familleId,
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le template.",
          variant: "destructive",
        });
        return;
      }

      router.push(
        `/templates/editeur?id=${data.id}&name=${encodeURIComponent(
          templateName
        )}&mode=new&type=catalog`
      );
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  // Ouvre l'aperçu modal
  const handlePreview = (catalog: any) => {
    setPreviewHtml(buildPreviewHtml(catalog));
    setPreviewTitle(catalog.nom || "");
    setPreviewDevice("desktop");
    setPreviewOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ overflow: "visible" }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Choisissez un template de base</h2>
          <Button
            className="bg-[#FFFEFF] border border-[#e0e0e0] text-[#23272f] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc] hover:border-[#bdbdbd] hover:text-[#23272f] transition flex items-center gap-2"
            onClick={() => router.push(`/templates/creer?name=${encodeURIComponent(templateName)}`)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: "6px" }}
            >
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Retour
          </Button>
        </div>

        {loading ? (
          <div>Chargement...</div>
        ) : (
          <>
            {/* Modal preview */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col">
                <style jsx global>{`
                  /* cache le close button par défaut (radix/dialog) */
                  [role="dialog"] > button {
                    display: none !important;
                  }
                `}</style>

                <DialogHeader className="p-4 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold">
                      {previewTitle || "Aperçu du template"}
                    </DialogTitle>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 ${
                          previewDevice === "mobile"
                            ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]"
                            : ""
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
                          previewDevice === "tablet"
                            ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]"
                            : ""
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
                          previewDevice === "desktop"
                            ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]"
                            : ""
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
                    {previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        style={{
                          width: "100%",
                          height: previewDevice === "mobile" ? "auto" : "100%",
                          minHeight: previewDevice === "mobile" ? "667px" : "auto",
                          border: "none",
                          background: "#fff",
                        }}
                        title={`Aperçu ${previewTitle}`}
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

            {/* Correction ici : on retire overflow-auto et on ajoute overflow-visible */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              style={{ overflow: "visible" }}
            >
              {visibleCatalogs.map((catalog) => {
                const meta = templateMeta[catalog.id];
                const scale = meta?.scale ?? 1;

                const naturalHeight = meta?.naturalHeight ?? 700;
                // On enlève la limite de 900px ici :
                const previewHeight = Math.ceil(naturalHeight * scale);
                const cardHeight = previewHeight + CARD_CHROME_HEIGHT;

                const srcDoc = buildPreviewHtml(catalog);

                return (
                  <div key={catalog.id} className="relative">
                    {/* wrapper fixe : évite de push la grid */}
                    <div style={{ height: CARD_CLOSED_HEIGHT, position: "relative" }}>
                      <div
                        className="group template-card absolute inset-0 bg-white border border-[#E0E1E1] rounded-2xl shadow-sm cursor-pointer flex flex-col items-center px-0 pt-4 pb-6"
                        onClick={() => handleSelectCatalog(catalog)}
                        style={
                          {
                            height: CARD_CLOSED_HEIGHT,
                            ["--previewHeight" as any]: `${previewHeight}px`,
                            ["--cardHeight" as any]: `${cardHeight}px`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="w-full px-4 mb-2 flex items-center justify-between">
                          <div className="font-semibold text-base truncate">{catalog.nom}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex items-center justify-center rounded-full w-8 h-8 text-muted-foreground hover:text-[#6c43e0] hover:bg-[#f4f4fd]"
                            onClick={e => {
                              e.stopPropagation();
                              handlePreview(catalog);
                            }}
                            style={{ display: "inline-flex", flex: "0 0 auto" }}
                            title="Aperçu"
                            aria-label="Aperçu"
                          >
                            <Eye className="w-6 h-6" />
                          </Button>
                        </div>

                        <div className="w-full flex justify-center items-start px-4">
                          <div
                            ref={(el) => {
                              previewRefs.current[catalog.id] = el;
                            }}
                            className="template-preview bg-white rounded-xl border border-[#ececf6] shadow overflow-hidden"
                            style={{
                              width: "100%",
                              maxWidth: PREVIEW_MAX_WIDTH,
                              height: PREVIEW_CLOSED_HEIGHT,
                            }}
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
                                  iframeRefs.current[catalog.id] = el;
                                }}
                                title={`preview-${catalog.id}`}
                                srcDoc={srcDoc}
                                onLoad={() => handleIframeLoad(catalog.id)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "0",
                                  display: "block",
                                  background: "white",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <style jsx>{`
                      /* Hover = la CARD grandit à la taille exacte du template */
                      .group:hover.template-card {
                        height: var(--cardHeight) !important;
                        z-index: 50;
                        transform: translateY(-6px);
                        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
                      }

                      /* AU HOVER :
                         - la preview prend la hauteur exacte du template
                         - et toute la largeur dispo (plus de maxWidth 320)
                      */
                      .group:hover .template-preview {
                        height: var(--previewHeight) !important;
                        max-width: none !important;
                        width: 100% !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
                      }

                      /* transitions propres */
                      .template-card {
                        transition: height 300ms ease, transform 200ms ease, box-shadow 200ms ease;
                      }
                      .template-preview {
                        transition: height 300ms ease, max-width 200ms ease, box-shadow 200ms ease;
                      }

                      .preview-eye-btn {
                        cursor: pointer;
                        transition: background 0.2s, color 0.2s;
                      }
                      .preview-eye-btn:hover {
                        background: #f0eafc;
                        color: #4f32a7;
                      }
                      .preview-eye-btn:hover .w-5 {
                        color: #4f32a7 !important;
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default function CatalogSelectionPageWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CatalogSelectionPage />
    </Suspense>
  );
}
