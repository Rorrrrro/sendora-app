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
    // Attendre que familleId soit défini
    if (!familleId) return;

    // Nettoyage préalable
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    const existingScript = document.getElementById('UiEditorScript');
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }

    // --- Guard réseau plus robuste ---
    if (!window.__stripoFetchGuard) {
      window.__stripoFetchGuard = true;
      const origFetch = window.fetch;

      window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let url: string | undefined;
        if (typeof input === "string" || input instanceof URL) {
          url = input.toString();
        } else if (input instanceof Request) {
          url = input.url;
        }

        if (url) {
          // Blocage documents
          if (
            url.includes("/api/v1/documents/") ||
            url.includes("/documents/page?")
          ) {
            console.log("Blocked fetch:", url);
            return Promise.resolve(new Response(
              JSON.stringify({ items: [], page: 0, total: 0 }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            ));
          }
          // Blocage customblocks categories (array)
          if (url.includes("/api/v1/customblocks/v1/categories?")) {
            console.log("Blocked fetch:", url);
            return Promise.resolve(new Response(
              JSON.stringify([]),
              { status: 200, headers: { "Content-Type": "application/json" } }
            ));
          }
          // Blocage customblocks translations (object)
          if (url.includes("/api/v1/customblocks/v1/categories/translations?")) {
            console.log("Blocked fetch:", url);
            return Promise.resolve(new Response(
              JSON.stringify({}),
              { status: 200, headers: { "Content-Type": "application/json" } }
            ));
          }
          // Blocage customblocks complet (autres endpoints)
          if (url.includes("/api/v1/customblocks/")) {
            console.log("Blocked fetch:", url);
            return Promise.resolve(new Response(
              JSON.stringify({}),
              { status: 200, headers: { "Content-Type": "application/json" } }
            ));
          }
        }
        return origFetch.call(window, input, init);
      };
    }
    // --- Fin guard réseau ---

    // Fonction pour charger le template existant ou vide
    async function loadTemplate() {
      if (mode === "edit" && templateId && familleId) {
        try {
          const { data: template, error } = await supabase
            .from('Templates')
            .select('html_code, design_json')
            .eq('id', templateId)
            .eq('famille_id', familleId)
            .single();
          
          if (error) {
            console.error("Erreur de chargement du template:", error);
            loadEmptyTemplate();
            return;
          }
          
          if (template) {
            let htmlCode = template.html_code || '';
            let cssCode = '';
            
            // Extraire CSS si présent
            if (template.design_json && template.design_json.css) {
              cssCode = template.design_json.css;
            }
            
            initPlugin({ html: htmlCode, css: cssCode });
          } else {
            loadEmptyTemplate();
          }
        } catch (error) {
          console.error("Erreur lors du chargement du template:", error);
          loadEmptyTemplate();
        }
      } else {
        // En mode création, charger un template vide
        loadEmptyTemplate();
      }
    }

    // Fonction pour charger un template Stripo minimal mais fonctionnel
    function loadEmptyTemplate() {
      // Blank template officiel Stripo
      const emptyTemplate = {
        html: `
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title></title>
    <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
    <!--[if gte mso 9]>
<noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
<![endif]-->
    <!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  </head>
  <body class="body">
    <div dir="ltr" class="es-wrapper-color">
      <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#f6f6f6"></v:fill>
			</v:background>
		<![endif]-->
      <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper">
        <tbody>
          <tr>
            <td valign="top" class="esd-email-paddings">
              <table cellspacing="0" cellpadding="0" align="center" class="esd-header-popover es-header">
                <tbody>
                  <tr>
                    <td align="center" class="esd-stripe">
                      <table width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-header-body">
                        <tbody>
                          <tr>
                            <td align="left" class="es-p20t es-p20r es-p20l esd-structure">
                              <!--[if mso]><table width="560" cellpadding="0"
                            cellspacing="0"><tr><td width="180" valign="top"><![endif]-->
                              <table cellspacing="0" cellpadding="0" align="left" class="es-left">
                                <tbody>
                                  <tr>
                                    <td width="180" valign="top" align="center" class="es-m-p20b esd-container-frame">
                                      <table width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-empty-container" style="display:none"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if mso]></td><td width="20"></td><td width="360" valign="top"><![endif]-->
                              <table cellspacing="0" cellpadding="0" align="right" class="es-right">
                                <tbody>
                                  <tr>
                                    <td width="360" align="left" class="esd-container-frame">
                                      <table width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-empty-container" style="display:none"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table cellspacing="0" cellpadding="0" align="center" class="es-content">
                <tbody>
                  <tr>
                    <td align="center" class="esd-stripe">
                      <table width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-content-body">
                        <tbody>
                          <tr>
                            <td align="left" class="es-p20t es-p20r es-p20l esd-structure">
                              <table width="100%" cellspacing="0" cellpadding="0">
                                <tbody>
                                  <tr>
                                    <td width="560" valign="top" align="center" class="esd-container-frame">
                                      <table width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-empty-container" style="display:none"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table cellspacing="0" cellpadding="0" align="center" class="esd-footer-popover es-footer">
                <tbody>
                  <tr>
                    <td align="center" class="esd-stripe">
                      <table width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-footer-body">
                        <tbody>
                          <tr>
                            <td align="left" class="esd-structure es-p20t es-p20b es-p20r es-p20l">
                              <!--[if mso]><table width="560" cellpadding="0" 
                        cellspacing="0"><tr><td width="270" valign="top"><![endif]-->
                              <table cellspacing="0" cellpadding="0" align="left" class="es-left">
                                <tbody>
                                  <tr>
                                    <td width="270" align="left" class="es-m-p20b esd-container-frame">
                                      <table width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-empty-container" style="display:none"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if mso]></td><td width="20"></td><td width="270" valign="top"><![endif]-->
                              <table cellspacing="0" cellpadding="0" align="right" class="es-right">
                                <tbody>
                                  <tr>
                                    <td width="270" align="left" class="esd-container-frame">
                                      <table width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-empty-container" style="display:none"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
`,
        css: ''
      };

      // Configuration optimisée pour Stripo avec options d'adaptation
      const initOptions = {
        html: emptyTemplate.html,
        css: emptyTemplate.css,
        locale: 'fr',
        displayMode: 'email',
        // Options importantes pour l'adaptation
        adaptToScreenSize: true, 
        responsiveEmail: true,
        ampEmail: false,
        // Largeur du contenu
        absoluteContentWidth: 600,
        customCSS: '',
        forceRecreate: true,
        userFullName: user?.email || 'Utilisateur',
        // Identifiants uniques
        apiRequestData: {
          userId: key,
          role: 'USER',
          metadata: {
            emailId // <-- Toujours l'id du template Supabase
          }
        },
        // Configuration des boutons et panels
        undoRedoButtonsSelector: '.undo-redo-buttons',
        codeEditorButtonSelector: '#codeEditor',
        // Configuration de l'apparence
        appearance: {
          theme: 'light',
          panels: {
            tools: { 
              dock: 'left',
              width: '280px' 
            },
            // Maximiser la zone de contenu
            content: {
              expanded: true,
              width: '70%'
            },
            // Désactiver le panneau de droite
            settings: { 
              dock: 'right', 
              collapsed: false 
            }
          }
        },
        // Authentification via UNIQUEMENT notre route API locale
        onTokenRefreshRequest: function(callback: (token: string) => void) {
          fetch('/api/stripo-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: key,
              role: 'USER'
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.token) {
              // Toujours passer metadata avec emailId lors du refresh
              callback(data.token);
              setIsEditorReady(true);
              setError(null);
            } else {
              setError("Erreur : pas de token dans la réponse du serveur.");
            }
          })
          .catch(err => {
            setError("Erreur d'authentification Stripo : " + err.message);
          });
        },
        errorHandler: function(error: any) {
          setError("Erreur Stripo : " + (error?.message || JSON.stringify(error)));
        },
        notifications: {
          info: (text: string) => console.info(text),
          error: (text: string) => setError(text),
          warn: (text: string) => console.warn(text),
          loader: (text: string) => console.log("Loading:", text),
          hide: (id: string) => console.log("Hide notification:", id),
          success: (text: string) => console.log("Success:", text)
        }
      };

      initPlugin(emptyTemplate);
    }

    // Initialisation unique de l'éditeur Stripo avec configurations simplifiées
    function initPlugin(template: { html: string; css: string }) {
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

        const script = document.createElement('script');
        script.id = 'UiEditorScript';
        script.src = 'https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js';

        script.onload = function() {
          console.log("Stripo script loaded, initializing editor...");
          if (!window.UIEditor) {
            setError("Erreur: API Stripo non disponible (UIEditor manquant)");
            console.error("Erreur: window.UIEditor manquant");
            return;
          }
          if (!containerRef.current) {
            setError("Erreur: containerRef manquant");
            console.error("Erreur: containerRef.current manquant");
            return;
          }

          window.UIEditor.initEditor(
            containerRef.current,
            {
              token: data.token,
              html: template.html,
              css: template.css,
              locale: 'fr',
              displayMode: 'email',
              adaptToScreenSize: true,
              responsiveEmail: true,
              ampEmail: false,
              absoluteContentWidth: 600,
              userFullName: user?.email || 'Utilisateur',
              metadata: { emailId }, // <-- AJOUT ICI AU NIVEAU RACINE
              apiRequestData: {
                userId: familleId || user?.id,
                role: 'USER',
                metadata: { emailId }
              },
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
                  if (data.token) {
                    // Toujours passer metadata avec emailId lors du refresh
                    callback(data.token);
                  }
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
            }
          );
        };

        script.onerror = function() {
          setError("Impossible de charger le script Stripo");
        };

        document.body.appendChild(script);
      })
      .catch(err => setError("Erreur d'authentification: " + err.message));
    }

    // Initialiser uniquement quand familleId est défini
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
  }, [templateId, familleId, mode, user]);

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
      window.StripoEditorApi.actionsApi.getTemplateData(async (template: { html: string, css: string }) => {
        window.StripoEditorApi.actionsApi.compileEmail({
          callback: async (error: any, htmlContent: string) => {
            if (error) {
              // alert("Erreur lors de la compilation de l'email: " + error);
              setIsSaving(false);
              return;
            }

            // Prépare le payload
            const now = new Date().toISOString();
            const payload: any = {
              nom: templateName,
              html_code: htmlContent,
              design_json: { html: template.html, css: template.css },
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
            disabled={!isEditorReady || isSaving}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#f3f3f3",
              color: "#222",
              fontWeight: 600,
              cursor: isEditorReady && !isSaving ? "pointer" : "not-allowed",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background 0.2s",
              opacity: isEditorReady && !isSaving ? 1 : 0.7,
            }}
          >
            Aperçu
          </button>
          
          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSaveAndExit}
            disabled={!isEditorReady || isSaving}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#6c43e0",
              color: "white",
              fontWeight: 600,
              cursor: isEditorReady && !isSaving ? "pointer" : "not-allowed",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background 0.2s",
              opacity: isEditorReady && !isSaving ? 1 : 0.7,
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