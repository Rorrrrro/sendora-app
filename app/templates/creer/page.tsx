"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/dashboard-layout";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";
import { Eye, Smartphone, Tablet, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// --- Pour l'aperçu ---
const PREVIEW_MAX_WIDTH = 320;
const PREVIEW_CLOSED_HEIGHT = 180;
const CARD_CLOSED_HEIGHT = 260;
const CARD_CHROME_HEIGHT = CARD_CLOSED_HEIGHT - PREVIEW_CLOSED_HEIGHT;

function wrapIfNeeded(html: string, extraCss: string = "") {
  const trimmed = (html || "").trim();
  const looksLikeFullDoc =
    /<!doctype/i.test(trimmed) || /<html[\s>]/i.test(trimmed) || /<head[\s>]/i.test(trimmed);

  if (looksLikeFullDoc) {
    if (/<head[\s>]/i.test(trimmed)) {
      return trimmed.replace(
        /<head([^>]*)>/i,
        `<head$1>${extraCss ? `<style>${extraCss}</style>` : ""}`
      );
    }
    return `${extraCss ? `<style>${extraCss}</style>` : ""}${trimmed}`;
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
</html>`;
}

function buildPreviewHtml(catalog: any) {
  if (catalog.design_json && typeof catalog.design_json === "object") {
    const html = catalog.design_json.html || catalog.html_code || "";
    const css = catalog.design_json.css || "";
    return wrapIfNeeded(html, css);
  }
  return wrapIfNeeded(catalog.html_code || "");
}

const CreateTemplatePage: React.FC = () => {
  const router = useRouter();
  const [templateName, setTemplateName] = useState('');
  const [inputError, setInputError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();
  const { user } = useUser();

  // Pour la liste des templates catalog
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Aperçu
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Pour le scale de l'aperçu
  const [templateMeta, setTemplateMeta] = useState<Record<string, any>>({});
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      setTemplateName(nameFromUrl);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Récupère les templates catalog
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
        // Met le "Template Vide" en premier
        const vide = (data || []).find((c) => c.nom === "Template Vide");
        const autres = (data || []).filter((c) => c.nom !== "Template Vide");
        setCatalogs(vide ? [vide, ...autres] : autres);
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
      setTemplateMeta((prev) => ({ ...prev }));
    });

    catalogs.forEach((c) => {
      const pr = previewRefs.current[c.id];
      if (pr) roRef.current?.observe(pr);
    });

    return () => roRef.current?.disconnect();
  }, [catalogs]);

  // Quand l'iframe charge, on mesure son contenu
  const handleIframeLoad = (catalogId: string) => {
    const iframe = iframeRefs.current[catalogId];
    const previewEl = previewRefs.current[catalogId];
    if (!iframe || !previewEl) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

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

  // Recalcule scale quand la largeur change
  useEffect(() => {
    if (loading) return;

    catalogs.forEach((catalog) => {
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
  }, [catalogs, loading, templateMeta]);

  const validateTemplateName = (): boolean => {
    if (!templateName.trim()) {
      setInputError(true);
      toast({
        title: "Erreur",
        description: "Veuillez nommer votre template",
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.focus();
      return false;
    }
    setInputError(false);
    return true;
  };

  const handleSelectCatalog = async (catalog: any) => {
    if (!validateTemplateName()) return;

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

  // Aperçu modal
  const handlePreview = (catalog: any) => {
    setPreviewHtml(buildPreviewHtml(catalog));
    setPreviewTitle(catalog.nom || "");
    setPreviewDevice("desktop");
    setPreviewOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <Input
            ref={inputRef}
            id="template-name"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value);
              if (inputError && e.target.value.trim()) setInputError(false);
            }}
            placeholder="Nom du template"
            className={`max-w-md text-lg ${
              inputError
                ? "border-red-500 focus-visible:ring-red-500 focus:border-red-500"
                : ""
            }`}
            style={inputError ? { borderColor: "#dc2626", color: "#dc2626" } : {}}
          />
        </div>
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <>
            {/* Aperçu modal */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col">
                {/* Ajoute ce style pour cacher la croix Radix */}
                <style jsx global>{`
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

            {/* Grille des templates catalog */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              style={{ overflow: "visible" }}
            >
              {catalogs.map((catalog) => {
                const meta = templateMeta[catalog.id];
                const scale = meta?.scale ?? 1;
                const naturalHeight = meta?.naturalHeight ?? 700;
                const previewHeight = Math.ceil(naturalHeight * scale);
                const cardHeight = previewHeight + CARD_CHROME_HEIGHT;
                const srcDoc = buildPreviewHtml(catalog);

                return (
                  <div key={catalog.id} className="relative">
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
                      .group:hover.template-card {
                        height: var(--cardHeight) !important;
                        z-index: 50;
                        transform: translateY(-6px);
                        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
                      }
                      .group:hover .template-preview {
                        height: var(--previewHeight) !important;
                        max-width: none !important;
                        width: 100% !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
                      }
                      .template-card {
                        transition: height 300ms ease, transform 200ms ease, box-shadow 200ms ease;
                      }
                      .template-preview {
                        transition: height 300ms ease, max-width 200ms ease, box-shadow 200ms ease;
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

export default CreateTemplatePage;