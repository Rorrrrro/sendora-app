"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Smartphone, Tablet, Monitor, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    UIEditor?: any;
    StripoEditorApi?: any;
    __stripoObserver?: MutationObserver | null;
    __SENDY_MERGE_TAGS_CACHE?: any;
  }
}

type MergeTagEntry = {
  label: string;
  value: string;
  previewValue?: string;
};

type MergeTagCategory = {
  category: string;
  entries: MergeTagEntry[];
};

export default function StripoEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  // --- External merge tags dialog state ---
  const [isMergeTagsOpen, setIsMergeTagsOpen] = useState(false);
  const [mergeTagsCatalog, setMergeTagsCatalog] = useState<MergeTagCategory[]>([]);
  const [mergeTagsQuery, setMergeTagsQuery] = useState("");
  const mergeTagsCallbackRef = useRef<((tag: string) => void) | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const supabase = createBrowserClient();

  const templateId = searchParams.get("id");
  const templateName = searchParams.get("name") || "Sans nom";
  const mode = searchParams.get("mode") || "new";
  const type = searchParams.get("type");
  const [familleId, setFamilleId] = useState<string | null>(null);

  // clé client unique
  const key = familleId ?? user?.id ?? "1";
  const emailId = templateId;

  useEffect(() => {
    if (!user) {
      router.push("/connexion");
      return;
    }
    async function getFamilleId() {
      try {
        if (!user) return;
        const { data } = await supabase
          .from("Utilisateurs")
          .select("compte_parent_id")
          .eq("id", user.id)
          .single();
        setFamilleId(data?.compte_parent_id ?? user.id);
      } catch {
        if (user) setFamilleId(user.id);
      }
    }
    getFamilleId();
  }, [user, supabase, router]);

  useEffect(() => {
    if (familleId === null) return;

    // Nettoyage préalable
    if (containerRef.current) containerRef.current.innerHTML = "";
    const existingScript = document.getElementById("UiEditorScript");
    if (existingScript?.parentNode) existingScript.parentNode.removeChild(existingScript);

    async function loadTemplate() {
      let html = "";
      let css = "";
      let designJson: any = null;

      if (templateId) {
        let templateFetch = await supabase
          .from("Templates")
          .select("html_code, design_json, famille_id")
          .eq("id", templateId)
          .maybeSingle();

        let template = templateFetch.data;

        if (!template) {
          const second = await supabase
            .from("Templates")
            .select("html_code, design_json, famille_id")
            .eq("id", templateId)
            .maybeSingle();
          template = second.data;
        }

        if (template) {
          html = template.html_code || "";
          designJson = template.design_json ?? null;

          if (typeof designJson === "string") {
            try {
              designJson = JSON.parse(designJson);
            } catch {
              designJson = null;
            }
          }

          if (designJson && typeof designJson === "object") {
            css = designJson.css || "";
          } else {
            designJson = null;
          }

          initPlugin({ html, css, design: designJson });
          return;
        }
      }

      if (mode === "new" || !templateId) {
        const { data: catalog, error } = await supabase
          .from("Template_catalog")
          .select("html_code, design_json")
          .eq("id", "4a7fd5e8-85c4-45ee-967d-72b299f9aa07")
          .single();

        if (error || !catalog) {
          setError("Erreur de chargement du template de base.");
          return;
        }

        html = catalog.html_code || "";
        designJson = catalog.design_json;

        if (designJson && typeof designJson === "object" && Object.keys(designJson).length > 0) {
          css = designJson.css || "";
        } else {
          designJson = null;
        }

        initPlugin({ html, css, design: designJson });
        return;
      }

      setError("Aucun template trouvé pour cet identifiant.");
    }

    function initPlugin({
      html,
      css,
      design,
    }: {
      html: string;
      css: string;
      design?: any;
    }) {
      if (!containerRef.current) return;

      if (!emailId) {
        setError("Erreur : emailId manquant dans l'URL.");
        return;
      }

      fetch("/api/stripo-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: familleId || user?.id,
          role: "USER",
        }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (!data?.token) {
            setError("Erreur : pas de token Stripo.");
            return;
          }

          // --- Fetch merge tags from your Supabase Edge Function ---
          const fetchMergeTags = async (): Promise<MergeTagCategory[]> => {
            const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            if (sessionErr || !accessToken) {
              throw new Error("Session Supabase invalide (access_token manquant).");
            }

            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!baseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant.");

            const res = await fetch(`${baseUrl}/functions/v1/stripo-merge-tags`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (!res.ok) {
              const txt = await res.text().catch(() => "");
              throw new Error(`stripo-merge-tags failed: ${res.status} ${txt}`);
            }

            return res.json();
          };

          const getCachedMergeTags = async () => {
            if (window.__SENDY_MERGE_TAGS_CACHE) return window.__SENDY_MERGE_TAGS_CACHE;
            const tags = await fetchMergeTags();
            console.log("merge tags reçus:", tags); // <-- Ajoute ce log
            window.__SENDY_MERGE_TAGS_CACHE = tags;
            return tags;
          };

          const prepareEditorOptions = async () => {
            const settingsId = "7d640cece238429fa6697bedfb03f9ec";
            const uiData = { userId: key, emailId };

            // Prefetch tags once (so externalMergeTags opens instantly)
            let tags: MergeTagCategory[] = [];
            try {
              tags = await getCachedMergeTags();
              setMergeTagsCatalog(tags);
            } catch (e) {
              console.warn("[mergeTags] prefetch failed:", e);
            }

            const opts: any = {
              token: data.token,
              locale: "fr",
              displayMode: "email",
              adaptToScreenSize: true,
              responsiveEmail: true,
              ampEmail: false,
              absoluteContentWidth: 600,
              userFullName: user?.email || "Utilisateur",
              metadata: uiData,
              apiRequestData: {
                ...uiData,
                role: "USER",
              },
              forceRecreate: true,
              ...(settingsId ? { settingsId } : {}),
              messageSettingsEnabled: false,
              customCSS: `
                [data-test="DOCUMENTS"], [data-test="TEMPLATES"] { display: none !important; }
                .es-plugin-ui-tabs__tab[data-test="DOCUMENTS"], .es-plugin-ui-tabs__tab[data-test="TEMPLATES"], 
                .es-plugin-ui-tabs__tab:nth-child(2) { display: none !important; }
              `,
              appearance: {
                theme: "light",
                panels: {
                  tools: { dock: "left", width: "280px" },
                  content: { expanded: true, width: "70%" },
                  settings: { dock: "right", collapsed: false },
                },
              },
              onTokenRefreshRequest: function (callback: (token: string) => void) {
                fetch("/api/stripo-auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: familleId || user?.id,
                    role: "USER",
                  }),
                })
                  .then((res) => res.json())
                  .then((d) => {
                    if (d.token) callback(d.token);
                    else setError("Erreur : pas de token dans la réponse du serveur.");
                  })
                  .catch((err) => setError("Erreur d'authentification Stripo : " + err.message));
              },

              // ✅ Ajoute tes tags ici pour le bouton natif
              mergeTags: tags,

              onReady: function () {
                setIsEditorReady(true);
                setError(null);
              },
              onError: function (err: any) {
                setError("Erreur Stripo : " + (err?.message || JSON.stringify(err)));
              },
            };

            opts.html = design && design.html ? design.html : html || "";
            opts.css = design && design.css ? design.css : css || "";

            return opts;
          };

          const createHost = () => {
            if (!containerRef.current) return null;

            const prevHosts = containerRef.current.querySelectorAll("[data-stripo-host]");
            prevHosts.forEach((h) => {
              try {
                h.remove();
              } catch {}
            });

            const host = document.createElement("div");
            host.setAttribute("data-stripo-host", String(Date.now()));
            host.style.width = "100%";
            host.style.height = "100%";
            host.style.boxSizing = "border-box";
            containerRef.current.appendChild(host);
            return host;
          };

          const initOnExistingUIEditor = async () => {
            try {
              if (window.UIEditor && typeof window.UIEditor.destroy === "function") {
                try {
                  window.UIEditor.destroy();
                } catch {}
              }
            } catch {}

            setTimeout(() => {
              (async () => {
                const host = createHost();
                try {
                  const opts = await prepareEditorOptions();
                  window.UIEditor.initEditor(host, opts);
                } catch (e) {
                  console.error("Échec initEditor:", e);
                  setError("Erreur d'initialisation Stripo (voir console).");
                }
              })();
            }, 250);
          };

          if (window.UIEditor) {
            initOnExistingUIEditor();
          } else {
            const script = document.createElement("script");
            script.id = "UiEditorScript";
            script.src = "https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js";
            script.onload = function () {
              (async () => {
                try {
                  const host = createHost();
                  const opts = await prepareEditorOptions();
                  window.UIEditor.initEditor(host, opts);
                } catch (e) {
                  console.error("Initialisation UIEditor échouée:", e);
                  setError("Erreur d'initialisation Stripo après chargement du script.");
                }
              })();
            };
            script.onerror = function () {
              setError("Impossible de charger le script Stripo");
            };
            document.body.appendChild(script);
          }
        })
        .catch((err) => setError("Erreur d'authentification: " + err.message));
    }

    loadTemplate();

    return () => {
      if (window.StripoEditorApi && typeof window.StripoEditorApi.destroy === "function") {
        try {
          window.StripoEditorApi.destroy();
        } catch {}
      }
      const scriptToRemove = document.getElementById("UiEditorScript");
      if (scriptToRemove?.parentNode) scriptToRemove.parentNode.removeChild(scriptToRemove);

      if (window.__stripoObserver) {
        window.__stripoObserver.disconnect();
        window.__stripoObserver = null;
      }
    };
  }, [templateId, familleId, mode, user, supabase, key, emailId, router, templateName]);

  const handlePreview = () => {
    setPreviewHtml(null);
    setIsPreviewOpen(true);

    if (window.StripoEditorApi?.actionsApi) {
      window.StripoEditorApi.actionsApi.compileEmail({
        callback: function (error: any, html: string) {
          if (error) {
            setPreviewHtml(
              `<div style="padding: 20px; color: #c62828; text-align: center;">Erreur lors de la génération de l'aperçu</div>`
            );
          } else {
            setPreviewHtml(html);
          }
        },
      });
    } else {
      setPreviewHtml(`<div style="padding: 20px; text-align: center;">
        <p style="color: #6c43e0; font-weight: bold;">API Stripo non disponible</p>
        <p>L'aperçu ne peut pas être généré pour le moment.</p>
      </div>`);
    }
  };

  const handleSaveAndExit = async () => {
    if (!window.StripoEditorApi?.actionsApi) return;

    setIsSaving(true);

    try {
      window.StripoEditorApi.actionsApi.getTemplateData(async (templateData: any) => {
        window.StripoEditorApi.actionsApi.compileEmail({
          callback: async (error: any, htmlContent: string) => {
            if (error) {
              setIsSaving(false);
              return;
            }

            const now = new Date().toISOString();
            const payload: any = {
              nom: templateName,
              html_code: htmlContent,
              design_json: templateData ?? { html: templateData?.html, css: templateData?.css },
              created_by: user?.id ?? "",
              famille_id: familleId,
            };

            try {
              let result;
              if (mode === "edit" && templateId) {
                payload.updated_at = now;
                result = await supabase
                  .from("Templates")
                  .update({
                    html_code: payload.html_code,
                    design_json: payload.design_json,
                    nom: payload.nom,
                    updated_at: payload.updated_at,
                  })
                  .eq("id", templateId)
                  .eq("famille_id", familleId);
              } else {
                payload.created_at = now;
                payload.updated_at = now;
                result = await supabase.from("Templates").insert(payload);
              }

              if (result.error) {
                setIsSaving(false);
                return;
              }

              router.push("/templates");
            } catch {
              setIsSaving(false);
            }
          },
        });
      });
    } catch {
      setIsSaving(false);
    }
  };

  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Ajoute un state pour savoir si on est en mode suppression (new) ou juste quitter (edit)
  const [backConfirmType, setBackConfirmType] = useState<"new" | "edit">("new");

  const handleBack = async () => {
    console.log("handleBack mode:", mode, "templateId:", templateId);
    if (mode === "new" && templateId) {
      setBackConfirmType("new");
      setShowBackConfirm(true);
    } else if (mode === "edit") {
      setBackConfirmType("edit");
      setShowBackConfirm(true);
    } else {
      // Juste retour sans confirmation
      if (type === "fromScratch") {
        router.push(`/templates/creer?name=${encodeURIComponent(templateName)}&mode=new`);
      } else if (type === "catalog") {
        router.push(`/templates/catalog-selection?name=${encodeURIComponent(templateName)}&mode=new`);
      } else {
        router.push(`/templates/creer?name=${encodeURIComponent(templateName)}&mode=new`);
      }
    }
  };

  // Fonction appelée si l'utilisateur confirme la suppression ou le retour
  const confirmBackAndDelete = async () => {
    if (backConfirmType === "new" && templateId) {
      await supabase.from("Templates").delete().eq("id", templateId);
    }
    setShowBackConfirm(false);
    // Redirige selon le type et le mode
    if (backConfirmType === "edit") {
      router.push("/templates");
    } else {
      if (type === "fromScratch") {
        router.push(`/templates/creer?name=${encodeURIComponent(templateName)}`);
      } else if (type === "catalog") {
        router.push(`/templates/catalog-selection?name=${encodeURIComponent(templateName)}`);
      } else {
        router.push(`/templates/creer?name=${encodeURIComponent(templateName)}`);
      }
    }
  };

  // --- Merge tags UI helpers ---
  const filteredCatalog = mergeTagsCatalog.map((cat) => {
    const q = mergeTagsQuery.trim().toLowerCase();
    if (!q) return cat;
    return {
      ...cat,
      entries: cat.entries.filter((e) => {
        const hay = `${e.label} ${e.value}`.toLowerCase();
        return hay.includes(q);
      }),
    };
  }).filter((c) => c.entries.length > 0);

  const onSelectMergeTag = (tagValue: string) => {
    const cb = mergeTagsCallbackRef.current;
    mergeTagsCallbackRef.current = null;
    setIsMergeTagsOpen(false);
    if (cb) cb(tagValue);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Optionnel : tu peux afficher un loader ou rien
    return null;
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#f5f5f7", position: "relative" }}>
      {/* Barre du haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          zIndex: 1000,
        }}
      >
        {/* Bouton Retour */}
        <button
          onClick={handleBack}
          disabled={isSaving}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#f3f3f3",
            color: "#222",
            fontWeight: 600,
            cursor: isSaving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Retour
        </button>

        <div style={{ fontWeight: 500, color: "#222", fontSize: "1.1rem", flex: 1, textAlign: "center" }}>
          {mode === "edit" ? "Modification" : "Création"}: {templateName}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handlePreview}
            disabled={isSaving}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#f3f3f3",
              color: "#222",
              fontWeight: 600,
              cursor: !isSaving ? "pointer" : "not-allowed",
              opacity: !isSaving ? 1 : 0.7,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Eye style={{ width: 18, height: 18 }} />
            Aperçu
          </button>

          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#6c43e0",
              color: "white",
              fontWeight: 600,
              cursor: !isSaving ? "pointer" : "not-allowed",
              opacity: !isSaving ? 1 : 0.7,
              display: "flex",
              alignItems: "center",
            }}
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder et quitter"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            background: "#ffe0e0",
            color: "#c62828",
            padding: "12px 32px",
            zIndex: 1001,
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#f5f5f7", paddingTop: 56 }} />

      {/* External Merge Tags Dialog */}
      <Dialog open={isMergeTagsOpen} onOpenChange={setIsMergeTagsOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-lg font-semibold">Balises Sendy</DialogTitle>
          </DialogHeader>

          <div className="p-4 border-b flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={mergeTagsQuery}
              onChange={(e) => setMergeTagsQuery(e.target.value)}
              placeholder="Rechercher (ex: prenom, entreprise...)"
              className="w-full outline-none text-sm"
            />
          </div>

          <div className="p-4 overflow-auto flex-1">
            {filteredCatalog.length === 0 ? (
              <div className="text-sm text-gray-500">Aucune balise.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredCatalog.map((cat) => (
                  <div key={cat.category}>
                    <div className="text-sm font-semibold mb-2">{cat.category}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.entries.map((e) => (
                        <button
                          key={`${cat.category}:${e.value}`}
                          onClick={() => onSelectMergeTag(e.value)}
                          className="text-left border rounded-md p-3 hover:bg-gray-50"
                        >
                          <div className="text-sm font-medium">{e.label}</div>
                          <div className="text-xs text-gray-600">{e.value}</div>
                          {e.previewValue ? (
                            <div className="text-xs text-gray-400 mt-1">
                              Ex: {e.previewValue}
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setIsMergeTagsOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog (inchangé) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col [&>button]:hidden">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">Aperçu du template</DialogTitle>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${previewDevice === "mobile" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""}`}
                  onClick={() => setPreviewDevice("mobile")}
                  aria-label="Mobile"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${previewDevice === "tablet" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""}`}
                  onClick={() => setPreviewDevice("tablet")}
                  aria-label="Tablet"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 ${previewDevice === "desktop" ? "bg-[#f0eafc] text-[#6c43e0] border-[#6c43e0]" : ""}`}
                  onClick={() => setPreviewDevice("desktop")}
                  aria-label="Desktop"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsPreviewOpen(false)}
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
                  title="Aperçu du template"
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

      {/* Confirmation retour/suppression */}
      <Dialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <DialogContent className="rounded-xl shadow-2xl px-8 py-8 max-w-xl">
          <div className="flex flex-col items-center text-center gap-4">
            <DialogHeader className="mb-2">
              <DialogTitle className="mb-4 text-2xl font-bold">
                Êtes-vous sûr de vouloir quitter ?
              </DialogTitle>
              <div className="text-[15px] text-muted-foreground mb-4">
                {backConfirmType === "new"
                  ? "Cette action est irréversible. Le template sera définitivement supprimé."
                  : "Les modifications non sauvegardées seront perdues."}
              </div>
            </DialogHeader>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
              onClick={() => setShowBackConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              variant={backConfirmType === "new" ? "destructive" : "default"}
              className={backConfirmType === "new"
                ? "bg-[#d21c3c] border-[#d21c3c] text-white hover:bg-[#b81a34] hover:border-[#b81a34] hover:opacity-90 font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"
                : "bg-[#6c43e0] text-white hover:bg-[#4f32a7] font-semibold rounded-md h-10 px-4 py-2 shadow-none transition"}
              onClick={confirmBackAndDelete}
            >
              {backConfirmType === "new"
                ? "Supprimer et quitter"
                : "Quitter sans sauvegarder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
