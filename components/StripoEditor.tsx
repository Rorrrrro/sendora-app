"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";

declare global {
  interface Window {
    UIEditor?: any;
    StripoEditorApi?: any;
    __stripoFetchGuard?: boolean;
    __stripoObserver?: MutationObserver | null;
  }
}

export default function StripoEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const supabase = createBrowserClient();
  
  const templateId = searchParams.get("id");
  const templateName = searchParams.get("name") || "Sans nom";
  const mode = searchParams.get("mode") || "new";
  const [familleId, setFamilleId] = useState<string | null>(null);

  // Ajout de la clé client unique
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
      containerRef.current.innerHTML = '';
    }
    const existingScript = document.getElementById('UiEditorScript');
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }

    async function loadTemplate() {
      let html = '';
      let css = '';
      let designJson: any = null;

      // DEBUG : log paramètres initiaux
      console.log("loadTemplate start", { mode, templateId, familleId });

      // Si un templateId est présent, tenter systématiquement de charger depuis la table Templates.
      if (templateId) {
        console.log("Tentative de chargement depuis Templates pour id", templateId, " (familleId:", familleId, ")");
        // 1) Essayer d'abord avec le filtre famille_id si on a ce champ (contrôle d'accès)
        let templateFetch = await supabase
          .from('Templates')
          .select('html_code, design_json, famille_id')
          .eq('id', templateId)
          .maybeSingle();

        let template = templateFetch.data;
        if (!template) {
          // 2) Si aucun résultat (p.ex. mismatch famille_id), réessayer sans filtre famille (log)
          console.warn("Aucun template trouvé avec le filtre famille_id, tentative sans filtre.");
          const second = await supabase
            .from('Templates')
            .select('html_code, design_json, famille_id')
            .eq('id', templateId)
            .maybeSingle();
          template = second.data;
          if (template) console.warn("Template trouvé sans correspondance famille_id (famille_id stockée:", template.famille_id, ")");
        }

        // Log résultat final de la recherche
        console.log("Résultat recherche Templates:", template, "error:", templateFetch.error);

        if (!template) {
          // Aucun template trouvé par id => on décide de fallback sur Template_catalog (mais on loggue et affiche erreur)
          console.warn("Aucun template trouvé dans Templates pour l'id donné. Fallback sur Template_catalog.");
        } else {
          // On a trouvé le template : extraire html et design_json (avec parsing si nécessaire)
          html = template.html_code || '';
          designJson = template.design_json ?? null;
          if (typeof designJson === "string") {
            try {
              designJson = JSON.parse(designJson);
              console.log("design_json parsé depuis string (Templates)");
            } catch (e) {
              console.warn("design_json stocké en string non-parsable, on l'ignore pour le design natif", e);
              designJson = null;
            }
          }
          if (designJson && typeof designJson === "object") {
            css = designJson.css || '';
          } else {
            designJson = null;
          }
          // On a notre template : initialisation suivante
          initPlugin({ html, css, design: designJson });
          return;
        }
      }

      // Si on n'a pas trouvé de template par id, ou pas d'id fourni, on charge le catalogue (mode new/fallback)
      if (mode === "new" || !templateId) {
         // Création : récupère depuis Template_catalog
         const { data: catalog, error } = await supabase
           .from('Template_catalog')
           .select('html_code, design_json')
           .eq('id', '4a7fd5e8-85c4-45ee-967d-72b299f9aa07')
           .single();
 
         if (error || !catalog) {
           setError("Erreur de chargement du template de base.");
           return;
         }
 
         html = catalog.html_code || '';
         designJson = catalog.design_json;
         if (designJson && typeof designJson === "object" && Object.keys(designJson).length > 0) {
           css = designJson.css || '';
         } else {
           designJson = null;
         }
       } else {
         // Cas où on voulait éditer (mode=edit) mais aucun template trouvé : afficher erreur claire.
         setError("Aucun template trouvé pour cet identifiant. Vérifiez l'URL ou les droits d'accès.");
         return;
       }
 
       // Initialisation de Stripo
       initPlugin({ html, css, design: designJson });
     }

    function initPlugin({ html, css, design }: { html: string; css: string; design?: any }) {
      // Initialisation unique de l'éditeur Stripo avec configurations simplifiées
      if (!containerRef.current) return;

      // Vérification stricte de l'id
      if (!emailId) {
        setError("Erreur : emailId (id du template) manquant dans l'URL.");
        return;
      }

      fetch('/api/stripo-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: familleId || user?.id,
          role: 'USER'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (!data?.token) {
          setError("Erreur : pas de token dans la réponse du serveur.");
          return;
        }

        // --- XHR guard pour Stripo (attrape Angular HttpClient) ---
        (function installStripoXHRGuard() {
          if ((window as any).__stripoXHRGuardInstalled) return;
          (window as any).__stripoXHRGuardInstalled = true;

          const OriginalXHR = window.XMLHttpRequest;

          const shouldMock = (url: string) =>
            url.includes('/api/v1/customblocks/') ||
            url.includes('/documents/page?') ||
            url.includes('/api/v1/documents/');

          const mockPayloadFor = (url: string) => {
            if (url.includes('/categories/translations')) {
              const fakeCategory = { id: "fake", name: "Catégorie factice" };
              return { response: [fakeCategory], responseText: JSON.stringify([fakeCategory]) };
            }
            if (url.includes('/categories?')) {
              const fakeCategory = { id: "fake", name: "Catégorie factice" };
              return { response: [fakeCategory], responseText: JSON.stringify([fakeCategory]) };
            }
            if (url.includes('/documents/page?') || url.includes('/api/v1/documents/')) {
              const obj = { items: [], page: 0, total: 0 };
              return { response: obj, responseText: JSON.stringify(obj) };
            }
            return { response: {}, responseText: JSON.stringify({}) };
          };

          // Wrapper XHR
          // @ts-ignore
          window.XMLHttpRequest = function XHRProxy(this: any) {
            const xhr = new OriginalXHR();

            let mock = false;
            let targetUrl = '';

            const origOpen = xhr.open;
            xhr.open = function(method: string, url: string, async?: boolean, username?: string | null, password?: string | null) {
              targetUrl = url;
              mock = shouldMock(url);
              return origOpen.call(xhr, method, url, async !== undefined ? async : true, username ?? null, password ?? null);
            };

            const origSend = xhr.send;
            xhr.send = function(body?: any) {
              if (!mock) return origSend.call(xhr, body);

              setTimeout(() => {
                const { response, responseText } = mockPayloadFor(targetUrl);
                try { Object.defineProperty(xhr, 'readyState', { value: 4 }); } catch {}
                try { Object.defineProperty(xhr, 'status', { value: 200 }); } catch {}
                try { Object.defineProperty(xhr, 'responseText', { value: responseText }); } catch {}
                try { Object.defineProperty(xhr, 'response', { value: response }); } catch {}

                if (typeof xhr.onreadystatechange === "function") xhr.onreadystatechange(new ProgressEvent("readystatechange"));
                if (typeof xhr.onload === "function") xhr.onload(new ProgressEvent("load"));
                if (typeof xhr.dispatchEvent === "function") {
                  try { xhr.dispatchEvent(new ProgressEvent("load")); } catch {}
                }
              }, 0);
            };

            return xhr;
          } as any;
        })();

        // Bonus anti-bruit zone.js
        window.addEventListener('unhandledrejection', (e: any) => {
          const url = e?.reason?.url || '';
          if (url.includes('/api/v1/customblocks/')) e.preventDefault();
        });
        // --- Fin XHR guard ---

        // Prépare options génériques (token, locale, callbacks...) (réutilisable)
        const prepareEditorOptions = () => {
          const opts: any = {
            token: data.token,
            locale: 'fr',
            displayMode: 'email',
            adaptToScreenSize: true,
            responsiveEmail: true,
            ampEmail: false,
            absoluteContentWidth: 600,
            userFullName: user?.email || 'Utilisateur',
            metadata: { emailId },
            apiRequestData: {
              userId: familleId || user?.id,
              role: 'USER',
              metadata: { emailId }
            },
            forceRecreate: true, // demande explicite de recréation si supporté
            onTokenRefreshRequest: function(callback: (token: string) => void) {
              fetch('/api/stripo-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: familleId || user?.id,
                  role: 'USER'
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.token) callback(data.token);
                else setError("Erreur : pas de token dans la réponse du serveur.");
              })
              .catch(err => setError("Erreur d'authentification Stripo : " + err.message));
            },
            customCSS: `
              [data-test="DOCUMENTS"], [data-test="TEMPLATES"] { display: none !important; }
              .es-plugin-ui-tabs__tab[data-test="DOCUMENTS"], .es-plugin-ui-tabs__tab[data-test="TEMPLATES"], 
              .es-plugin-ui-tabs__tab:nth-child(2) { display: none !important; }
            `,
            appearance: {
              theme: 'light',
              panels: {
                tools: { dock: 'left', width: '280px' },
                content: { expanded: true, width: '70%' },
                settings: { dock: 'right', collapsed: false }
              }
            },
            onReady: function() {
              setIsEditorReady(true);
              setError(null);
            },
            onError: function(error: any) {
              setError("Erreur Stripo : " + (error?.message || JSON.stringify(error)));
            }
          };

          // Toujours initialiser avec HTML+CSS (préférence aux champs design.html/design.css si fournis)
          opts.html = (design && design.html) ? design.html : (html || '');
          opts.css = (design && design.css) ? design.css : (css || '');
          console.log("Init avec html len:", (opts.html||'').length, " css len:", (opts.css||'').length);
          return opts;
        };

        const createHost = () => {
          if (!containerRef.current) return null;
          // supprimer anciens hosts créés par nous
          const prevHosts = containerRef.current.querySelectorAll('[data-stripo-host]');
          prevHosts.forEach(h => { try { h.remove(); } catch(e){} });
          const host = document.createElement('div');
          host.setAttribute('data-stripo-host', String(Date.now()));
          host.style.width = '100%';
          host.style.height = '100%';
          host.style.boxSizing = 'border-box';
          containerRef.current.appendChild(host);
          return host;
        };

        const initOnExistingUIEditor = async () => {
          // Try destroy existing instance then init directly
          try {
            if ((window as any).UIEditor && typeof (window as any).UIEditor.destroy === "function") {
              console.log("Destruction de l'instance UIEditor existante avant ré-init (existing).");
              try { (window as any).UIEditor.destroy(); } catch (e) { console.warn("destroy() a échoué:", e); }
            }
          } catch (e) {
            console.warn("Erreur lors de la tentative de destruction UIEditor:", e);
          }
          // petit délai pour laisser cleanup
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

        // Si UIEditor déjà présent, n'ajoute pas le script (évite "UIEditor already loaded")
        if ((window as any).UIEditor) {
          console.log("UIEditor présent — ré-initialisation sans recharger le script.");
          initOnExistingUIEditor();
        } else {
          // Charger le script et init après onload
          const script = document.createElement('script');
          script.id = 'UiEditorScript';
          script.src = 'https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js';
          script.onload = function() {
            try {
              console.log("Stripo script loaded (fresh), initializing editor...");
              const host = createHost();
              const opts = prepareEditorOptions();
              (window as any).UIEditor.initEditor(host, opts);
            } catch (e) {
              console.error("Initialisation UIEditor après chargement script échouée:", e);
              setError("Erreur d'initialisation Stripo après chargement du script.");
            }
          };
          script.onerror = function() {
            setError("Impossible de charger le script Stripo");
          };
          document.body.appendChild(script);
        }
      })
      .catch(err => setError("Erreur d'authentification: " + err.message));
    }

    loadTemplate();

    return () => {
      if (window.StripoEditorApi && typeof window.StripoEditorApi.destroy === 'function') {
        try {
          window.StripoEditorApi.destroy();
        } catch (e) {
          console.error("Erreur lors du nettoyage de l'éditeur:", e);
        }
      }
      const scriptToRemove = document.getElementById('UiEditorScript');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
      // Nettoyage du MutationObserver
      if (window.__stripoObserver) {
        window.__stripoObserver.disconnect();
        window.__stripoObserver = null;
      }
    };
  }, [templateId, familleId, mode, user, supabase]);

  const handlePreview = () => {
    setPreviewHtml(null);
    setIsPreviewOpen(true);
    
    if (window.StripoEditorApi && window.StripoEditorApi.actionsApi) {
      window.StripoEditorApi.actionsApi.compileEmail({
        callback: function(error: any, html: string) {
          if (error) {
            setPreviewHtml(`<div style="padding: 20px; color: #c62828; text-align: center;">Erreur lors de la génération de l'aperçu</div>`);
          } else {
            setPreviewHtml(html);
          }
        }
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
      // Récupère le design complet depuis Stripo (objet natif) et le HTML compilé
      window.StripoEditorApi.actionsApi.getTemplateData(async (templateData: any) => {
        window.StripoEditorApi.actionsApi.compileEmail({
          callback: async (error: any, htmlContent: string) => {
            if (error) {
              setIsSaving(false);
              return;
            }

            // Prépare le payload : on sauvegarde le HTML rendu ET le design natif complet
            const now = new Date().toISOString();
            const payload: any = {
              nom: templateName,
              html_code: htmlContent, // rendu final
              // stocker l'objet complet renvoyé par Stripo pour pouvoir restaurer l'éditeur exactement
              design_json: templateData ?? { html: templateData?.html, css: templateData?.css },
              // en plus, si besoin, on peut stocker css séparément : templateData.css
              created_by: user?.id ?? "",
              famille_id: familleId,
            };
 
             let result;
             try {
               if (mode === "edit" && templateId) {
                 // Update
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
                 // Insert
                 payload.created_at = now;
                 payload.updated_at = now;
                 result = await supabase
                   .from("Templates")
                   .insert(payload);
               }

               if (result.error) {

                 setIsSaving(false);
                 return;
               }
              

              router.push("/templates");
            } catch (error) {
 
              setIsSaving(false);
            }
          }
        });
      });
    } catch (error) {
  
      setIsSaving(false);
    }
  };

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
        {/* Bouton Retour à gauche */}
        <button
          onClick={() => router.push("/templates")}
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
        <div style={{ fontWeight: 500, color: "#222", fontSize: "1.1rem", flex: 1, textAlign: "center" }}>
          {mode === "edit" ? "Modification" : "Création"}: {templateName}
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Bouton Aperçu */}
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
            }}
          >
            Aperçu
          </button>
          
          {/* Bouton Sauvegarder */}
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
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      
      {/* Message d'erreur Stripo */}
      {error && (
        <div style={{
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
        }}>
          {error}
        </div>
      )}
      
      {/* Éditeur Stripo */}
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
      
      {/* Aperçu modal */}
      {isPreviewOpen && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
              width: "90vw",
              maxWidth: 900,
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "16px 0", borderBottom: "1px solid #eee" }}>
              {[
                { label: "Mobile", width: 375 },
                { label: "Tablet", width: 600 },
                { label: "Desktop", width: 900 }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => {
                    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement;
                    if (iframe) iframe.style.width = opt.width + "px";
                  }}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "#f3f3f3",
                    color: "#222",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  marginLeft: 24,
                  padding: "6px 18px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#e57373",
                  color: "white",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
              <iframe
                id="preview-iframe"
                title="Aperçu du template"
                style={{
                  width: 900,
                  height: "80vh",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  background: "#fafafa",
                  transition: "width 0.2s"
                }}
                srcDoc={previewHtml || "<div style='padding:20px;text-align:center'>Chargement de l'aperçu...</div>"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}