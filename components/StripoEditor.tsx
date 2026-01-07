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
import { Eye, Smartphone, Tablet, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    UIEditor?: any;
    StripoEditorApi?: any;
    __stripoFetchGuard?: boolean;
    __stripoObserver?: MutationObserver | null;
    __STRIPO_SETTINGS_ID?: string;
  }
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const supabase = createBrowserClient();

  const templateId = searchParams.get("id");
  const templateName = searchParams.get("name") || "Sans nom";
  const mode = searchParams.get("mode") || "new";
  const type = searchParams.get("type"); // récupère le type pour retour (fromScratch, catalog, etc.)
  const [familleId, setFamilleId] = useState<string | null>(null);

  // ✅ clé client unique pour le storage (familleId prioritaire)
  const key = familleId ?? user?.id ?? "1";

  // emailId = id du template Supabase
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
      } catch (error) {
        if (user) setFamilleId(user.id);
      }
    }
    getFamilleId();
  }, [user, supabase, router]);

  useEffect(() => {
    // Ne rien faire tant que familleId n'est pas défini (évite le fallback prématuré)
    if (familleId === null) return;

    // Nettoyage préalable
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
    const existingScript = document.getElementById("UiEditorScript");
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }

    async function loadTemplate() {
      let html = "";
      let css = "";
      let designJson: any = null;

      console.log("loadTemplate start", { mode, templateId, familleId });

      if (templateId) {
        console.log(
          "Tentative de chargement depuis Templates pour id",
          templateId,
          " (familleId:",
          familleId,
          ")"
        );

        let templateFetch = await supabase
          .from("Templates")
          .select("html_code, design_json, famille_id")
          .eq("id", templateId)
          .maybeSingle();

        let template = templateFetch.data;
        if (!template) {
          console.warn(
            "Aucun template trouvé avec le filtre famille_id, tentative sans filtre."
          );
          const second = await supabase
            .from("Templates")
            .select("html_code, design_json, famille_id")
            .eq("id", templateId)
            .maybeSingle();
          template = second.data;
          if (template)
            console.warn(
              "Template trouvé sans correspondance famille_id (famille_id stockée:",
              template.famille_id,
              ")"
            );
        }

        console.log(
          "Résultat recherche Templates:",
          template,
          "error:",
          templateFetch.error
        );

        if (!template) {
          console.warn(
            "Aucun template trouvé dans Templates pour l'id donné. Fallback sur Template_catalog."
          );
        } else {
          html = template.html_code || "";
          designJson = template.design_json ?? null;

          if (typeof designJson === "string") {
            try {
              designJson = JSON.parse(designJson);
              console.log("design_json parsé depuis string (Templates)");
            } catch (e) {
              console.warn(
                "design_json stocké en string non-parsable, on l'ignore pour le design natif",
                e
              );
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

        if (
          designJson &&
          typeof designJson === "object" &&
          Object.keys(designJson).length > 0
        ) {
          css = designJson.css || "";
        } else {
          designJson = null;
        }
      } else {
        setError(
          "Aucun template trouvé pour cet identifiant. Vérifiez l'URL ou les droits d'accès."
        );
        return;
      }

      initPlugin({ html, css, design: designJson });
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
        setError("Erreur : emailId (id du template) manquant dans l'URL.");
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
            setError("Erreur : pas de token dans la réponse du serveur.");
            return;
          }

          const workerBase = "https://stripo.romain-ver69.workers.dev";
          console.log(
            "[stripo-token] token received length=",
            data.token?.length ?? 0
          );

          // ping simple pour confirmer worker OK (GET)
          const pingWorker = async () => {
            const uiData = JSON.stringify({ userId: key, emailId });
            try {
              console.log("[pingWorker] calling", `${workerBase}/health`);
              const h = await fetch(`${workerBase}/health`, {
                method: "GET",
                headers: { "es-plugin-ui-data": uiData },
              });
              console.log(
                "[pingWorker] /health status",
                h.status,
                "body:",
                await h.text().catch(() => null)
              );

              console.log("[pingWorker] calling list /?keys=");
              const l = await fetch(`${workerBase}/?keys=`, {
                method: "GET",
                headers: { "es-plugin-ui-data": uiData },
              });
              const listJson = await l.json().catch(() => null);
              console.log(
                "[pingWorker] /?keys= status",
                l.status,
                "body sample:",
                JSON.stringify(listJson).slice(0, 1000)
              );
            } catch (e) {
              console.warn("[pingWorker] failed", e);
            }
          };

          pingWorker().catch(() => {});

          const prepareEditorOptions = () => {
            // settingsId doit être EXACTEMENT celui du profil Stripo configuré pour "Other storage"
            const settingsId = "7d640cece238429fa6697bedfb03f9ec"; // <-- remplace ici en dur pour tester

            const uiData = { userId: key, emailId };

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

              // ✅ Masquer tout le panneau paramètres message (objet, préheader, UTM, Gmail)
              messageSettingsEnabled: false,
              displayTitle: false,
              displayHiddenPreheader: false,
              displayUTM: false,
              displayGmailAnnotations: false,

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
                  .catch((err) =>
                    setError("Erreur d'authentification Stripo : " + err.message)
                  );
              },

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

              onReady: function () {
                setIsEditorReady(true);
                setError(null);
              },
              onError: function (err: any) {
                setError(
                  "Erreur Stripo : " + (err?.message || JSON.stringify(err))
                );
              },
            };

            opts.html = design && design.html ? design.html : html || "";
            opts.css = design && design.css ? design.css : css || "";

            console.log(
              "Init avec html len:",
              (opts.html || "").length,
              " css len:",
              (opts.css || "").length
            );
            try {
              console.log("[editorOptions]", {
                tokenPreview: String(opts.token).slice(0, 8) + "...",
                metadata: opts.metadata,
                apiRequestData: opts.apiRequestData,
                settingsId: (opts as any).settingsId || null,
              });
            } catch (e) {}

            return opts;
          };

          const createHost = () => {
            if (!containerRef.current) return null;

            const prevHosts =
              containerRef.current.querySelectorAll("[data-stripo-host]");
            prevHosts.forEach((h) => {
              try {
                h.remove();
              } catch (e) {}
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
              if (
                (window as any).UIEditor &&
                typeof (window as any).UIEditor.destroy === "function"
              ) {
                console.log(
                  "Destruction de l'instance UIEditor existante avant ré-init (existing)."
                );
                try {
                  (window as any).UIEditor.destroy();
                } catch (e) {
                  console.warn("destroy() a échoué:", e);
                }
              }
            } catch (e) {
              console.warn("Erreur lors de la tentative de destruction UIEditor:", e);
            }

            setTimeout(() => {
              const host = createHost();
              try {
                const opts = prepareEditorOptions();
                (window as any).UIEditor.initEditor(host, opts);
              } catch (e) {
                console.error("Échec initEditor sur instance existante:", e);
                setError("Erreur d'initialisation Stripo (voir console).");
              }
            }, 250);
          };

          if ((window as any).UIEditor) {
            console.log("UIEditor présent — ré-initialisation sans recharger le script.");
            initOnExistingUIEditor();
          } else {
            const script = document.createElement("script");
            script.id = "UiEditorScript";
            script.src =
              "https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js";
            script.onload = function () {
              try {
                console.log("Stripo script loaded (fresh), initializing editor...");
                const host = createHost();
                const opts = prepareEditorOptions();
                (window as any).UIEditor.initEditor(host, opts);
              } catch (e) {
                console.error(
                  "Initialisation UIEditor après chargement script échouée:",
                  e
                );
                setError("Erreur d'initialisation Stripo après chargement du script.");
              }
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
      if (
        window.StripoEditorApi &&
        typeof window.StripoEditorApi.destroy === "function"
      ) {
        try {
          window.StripoEditorApi.destroy();
        } catch (e) {
          console.error("Erreur lors du nettoyage de l'éditeur:", e);
        }
      }
      const scriptToRemove = document.getElementById("UiEditorScript");
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
      if (window.__stripoObserver) {
        window.__stripoObserver.disconnect();
        window.__stripoObserver = null;
      }
    };
  }, [templateId, familleId, mode, user, supabase, key, emailId, router, templateName]);

  const handlePreview = () => {
    setPreviewHtml(null);
    setIsPreviewOpen(true);

    if (window.StripoEditorApi && window.StripoEditorApi.actionsApi) {
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
    if (!window.StripoEditorApi || !window.StripoEditorApi.actionsApi) {
      return;
    }

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
              design_json:
                templateData ?? { html: templateData?.html, css: templateData?.css },
              created_by: user?.id ?? "",
              famille_id: familleId,
            };

            let result;
            try {
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
            } catch (error) {
              setIsSaving(false);
            }
          },
        });
      });
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    if (templateId) {
      await supabase.from("Templates").delete().eq("id", templateId);
    }
    // Redirige selon le type
    if (type === "fromScratch") {
      router.push(`/templates/creer?name=${encodeURIComponent(templateName)}`);
    } else if (type === "catalog") {
      router.push(
        `/templates/catalog-selection?name=${encodeURIComponent(templateName)}`
      );
    } else {
      // Par défaut, retourne à la page de création avec le nom pré-rempli
      router.push(`/templates/creer?name=${encodeURIComponent(templateName)}`);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#f5f5f7",
        position: "relative",
      }}
    >
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
        {/* Bouton Retour à gauche */}
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
            transition: "background 0.2s",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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
        </button>

        {/* Titre centré */}
        <div
          style={{
            fontWeight: 500,
            color: "#222",
            fontSize: "1.1rem",
            flex: 1,
            textAlign: "center",
          }}
        >
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background 0.2s",
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background 0.2s",
              opacity: !isSaving ? 1 : 0.7,
              display: "flex",
              alignItems: "center",
            }}
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sauvegarde...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: "4px" }}
                >
                  <path
                    d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 21V13H7V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 3V8H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sauvegarder et quitter
              </>
            )}
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

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#f5f5f7",
          paddingTop: 56,
          boxSizing: "border-box",
        }}
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col [&>button]:hidden">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                Aperçu du template
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
                width:
                  previewDevice === "mobile"
                    ? 375
                    : previewDevice === "tablet"
                    ? 768
                    : 1200,
                height:
                  previewDevice === "mobile"
                    ? "auto"
                    : previewDevice === "tablet"
                    ? 900
                    : "90%",
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
    </div>
  );
}
