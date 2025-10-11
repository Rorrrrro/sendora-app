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
        
        // Bloquer tous les appels documents
        if (url && (url.includes("/api/v1/documents/") || url.includes("/documents/page?"))) {
          console.log("Blocked fetch:", url);
          return Promise.resolve(new Response(
            JSON.stringify({ items: [], page: 0, total: 0 }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          ));
        }
        return origFetch.call(window, input, init);
      };

      // Intercepte XMLHttpRequest de manière plus agressive
      const OrigXHR = window.XMLHttpRequest;
      
      function GuardedXHR(this: XMLHttpRequest) {
        const xhr = new OrigXHR();
        let intercepted = false;
        const origOpen = xhr.open;
        
        xhr.open = function(method: string, url: string, async: boolean = true, username?: string | null, password?: string | null): void {
          if (typeof url === "string" && (url.includes("/api/v1/documents/") || url.includes("/documents/page?"))) {
            console.log("Blocked XHR:", url);
            intercepted = true;
            setTimeout(() => {
              try { Object.defineProperty(xhr, "readyState", { value: 4, configurable: true }); } catch {}
              try { Object.defineProperty(xhr, "status", { value: 200, configurable: true }); } catch {}
              try { Object.defineProperty(xhr, "responseText", { value: JSON.stringify({ items: [], page: 0, total: 0 }), configurable: true }); } catch {}
              try { Object.defineProperty(xhr, "response", { value: JSON.stringify({ items: [], page: 0, total: 0 }), configurable: true }); } catch {}
              try { Object.defineProperty(xhr, "responseType", { value: "json", configurable: true }); } catch {}
              if (typeof xhr.onreadystatechange === "function") xhr.onreadystatechange.call(xhr, new Event("readystatechange") as any);
              if (typeof xhr.onload === "function") xhr.onload.call(xhr, new Event("load") as any);
              if (typeof xhr.dispatchEvent === "function") {
                try { xhr.dispatchEvent(new Event("load")); } catch {}
              }
            }, 10);
            return;
          }
          
          return origOpen.call(xhr, method, url, async, username ?? null, password ?? null);
        };
        
        const origSend = xhr.send;
        
        xhr.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
          if (intercepted) return;
          return origSend.call(xhr, body ?? null);
        };
        
        return xhr;
      };

      window.XMLHttpRequest = GuardedXHR as any;
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
        loadEmptyTemplate();
      }
    }

    // Template vide - conserver le template existant
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
            emailId: templateId ? templateId : `tmp_${Date.now()}`
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
          .then(res => {
            if (!res.ok) {
              throw new Error(`Erreur d'authentification (${res.status})`);
            }
            return res.json();
          })
          .then(data => {
            if (data.token) {
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

      // emailId selon édition ou création
      const emailId = templateId ? templateId : `tmp_${Date.now()}`;
      console.log("Initialisation avec emailId:", emailId);
      
      // Obtenir un token d'authentification avant de charger l'éditeur
      // Utiliser UNIQUEMENT la route API locale pour éviter les problèmes CORS
      fetch('/api/stripo-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: familleId || user?.id,
          role: 'USER'
        })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erreur d'authentification (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.token) {
          setError("Erreur : pas de token dans la réponse du serveur.");
          return;
        }
        
        console.log("Token d'authentification Stripo obtenu");
        
        // Charger le script Stripo avec le token déjà disponible
        const script = document.createElement('script');
        script.id = 'UiEditorScript';
        script.src = 'https://plugins.stripo.email/resources/uieditor/latest/UIEditor.js';
        
        script.onload = function() {
          if (!window.UIEditor || !containerRef.current) {
            setError("Erreur: API Stripo non disponible");
            return;
          }

          // Gestionnaire d'images externe qui remplace la galerie native de Stripo
          const customImageLibrary = {
            openDialog: function(callback: (imageInfo: {url: string, alt?: string, title?: string}) => void) {
              // Ouvrir une modale simple pour sélectionner une image
              const userId = familleId || user?.id;
              
              // Créer une modal d'image simple
              const modal = document.createElement('div');
              modal.style.position = 'fixed';
              modal.style.top = '0';
              modal.style.left = '0';
              modal.style.right = '0';
              modal.style.bottom = '0';
              modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
              modal.style.zIndex = '10000';
              modal.style.display = 'flex';
              modal.style.alignItems = 'center';
              modal.style.justifyContent = 'center';
              
              const content = document.createElement('div');
              content.style.backgroundColor = 'white';
              content.style.borderRadius = '8px';
              content.style.padding = '20px';
              content.style.width = '80%';
              content.style.maxWidth = '900px';
              content.style.maxHeight = '80vh';
              content.style.overflow = 'auto';
              
              const header = document.createElement('div');
              header.style.display = 'flex';
              header.style.justifyContent = 'space-between';
              header.style.marginBottom = '20px';
              
              const title = document.createElement('h2');
              title.textContent = 'Bibliothèque d\'images';
              title.style.margin = '0';
              
              const closeBtn = document.createElement('button');
              closeBtn.textContent = '✕';
              closeBtn.style.border = 'none';
              closeBtn.style.background = 'none';
              closeBtn.style.fontSize = '20px';
              closeBtn.style.cursor = 'pointer';
              closeBtn.onclick = function() {
                document.body.removeChild(modal);
              };
              
              header.appendChild(title);
              header.appendChild(closeBtn);
              
              const uploader = document.createElement('div');
              uploader.style.marginBottom = '20px';
              uploader.style.padding = '15px';
              uploader.style.border = '2px dashed #ccc';
              uploader.style.borderRadius = '5px';
              uploader.style.textAlign = 'center';
              
              const uploaderText = document.createElement('p');
              uploaderText.textContent = 'Déposer une image ou cliquer pour sélectionner';
              uploaderText.style.margin = '0';
              
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/*';
              fileInput.style.display = 'none';
              
              uploader.appendChild(uploaderText);
              uploader.appendChild(fileInput);
              
              uploader.onclick = function() {
                fileInput.click();
              };
              
              fileInput.onchange = function() {
                if (fileInput.files && fileInput.files[0]) {
                  const formData = new FormData();
                  formData.append('file', fileInput.files[0]);
                  formData.append('userId', userId || '');
                  
                  // Message de téléchargement
                  const imgGrid = document.getElementById('image-grid');
                  if (imgGrid) {
                    const loadingMsg = document.createElement('div');
                    loadingMsg.id = 'upload-loading';
                    loadingMsg.textContent = 'Téléchargement en cours...';
                    loadingMsg.style.padding = '10px';
                    loadingMsg.style.backgroundColor = '#f3f3f3';
                    loadingMsg.style.marginBottom = '10px';
                    loadingMsg.style.borderRadius = '5px';
                    imgGrid.prepend(loadingMsg);
                  }
                  
                  // Upload via votre API
                  fetch('https://media.sendora.fr/api/stripo/upload.php', {
                    method: 'POST',
                    body: formData,
                    headers: {
                      'X-Family-Id': userId || ''
                    }
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.url) {
                      // Actualiser la liste des images
                      loadImages();
                    } else {
                      alert('Erreur lors du téléchargement: ' + (data.error || 'Erreur inconnue'));
                    }
                  })
                  .catch(err => {
                    alert('Erreur de téléchargement: ' + err.message);
                  })
                  .finally(() => {
                    const loadingEl = document.getElementById('upload-loading');
                    if (loadingEl) loadingEl.remove();
                  });
                }
              };
              
              const imageGrid = document.createElement('div');
              imageGrid.id = 'image-grid';
              imageGrid.style.display = 'grid';
              imageGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
              imageGrid.style.gap = '10px';
              
              content.appendChild(header);
              content.appendChild(uploader);
              content.appendChild(imageGrid);
              modal.appendChild(content);
              
              document.body.appendChild(modal);
              
              // Fonction pour charger les images de l'utilisateur
              function loadImages() {
                const imgGrid = document.getElementById('image-grid');
                if (!imgGrid) return;
                
                imgGrid.innerHTML = '<div style="text-align:center;padding:20px;">Chargement des images...</div>';
                
                fetch(`https://media.sendora.fr/api/stripo/list.php?keys=${userId}`)
                  .then(response => response.json())
                  .then(data => {
                    imgGrid.innerHTML = '';
                    
                    if (data && Array.isArray(data.items) && data.items.length > 0) {
                      data.items.forEach((item: {url: string, name: string}) => {
                        const imgContainer = document.createElement('div');
                        imgContainer.style.position = 'relative';
                        imgContainer.style.border = '1px solid #eee';
                        imgContainer.style.borderRadius = '4px';
                        imgContainer.style.overflow = 'hidden';
                        imgContainer.style.cursor = 'pointer';
                        
                        const img = document.createElement('img');
                        img.src = item.url;
                        img.alt = item.name || 'Image';
                        img.style.width = '100%';
                        img.style.height = '120px';
                        img.style.objectFit = 'cover';
                        
                        const imgName = document.createElement('div');
                        imgName.textContent = item.name || 'Image';
                        imgName.style.padding = '5px';
                        imgName.style.fontSize = '12px';
                        imgName.style.whiteSpace = 'nowrap';
                        imgName.style.overflow = 'hidden';
                        imgName.style.textOverflow = 'ellipsis';
                        
                        imgContainer.appendChild(img);
                        imgContainer.appendChild(imgName);
                        
                        imgContainer.onclick = function() {
                          document.body.removeChild(modal);
                          callback({
                            url: item.url,
                            alt: item.name || 'Image',
                            title: item.name
                          });
                        };
                        
                        imgGrid.appendChild(imgContainer);
                      });
                    } else {
                      imgGrid.innerHTML = '<div style="text-align:center;padding:20px;">Aucune image disponible. Ajoutez-en une en utilisant le bouton ci-dessus.</div>';
                    }
                  })
                  .catch(err => {
                    imgGrid.innerHTML = `<div style="text-align:center;padding:20px;color:#c62828;">Erreur lors du chargement des images: ${err.message}</div>`;
                  });
              }
              
              // Charger les images immédiatement
              loadImages();
            }
          };
          
          // Configuration simplifiée avec externalImagesLibrary
          const editorConfig = {
            // Garder le token préchargé comme config initiale
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
            
            // IMPORTANT: Ajouter également la méthode de rafraîchissement du token
            onTokenRefreshRequest: function(callback: (token: string) => void) {
              fetch('/api/stripo-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: familleId || user?.id,
                  role: 'USER'
                })
              })
              .then(res => {
                if (!res.ok) {
                  throw new Error(`Erreur d'authentification (${res.status})`);
                }
                return res.json();
              })
              .then(data => {
                if (data.token) {
                  callback(data.token);
                } else {
                  setError("Erreur : pas de token dans la réponse du serveur.");
                }
              })
              .catch(err => {
                setError("Erreur d'authentification Stripo : " + err.message);
                console.error("Erreur d'authentification:", err);
              });
            },
            
            // Remplacer la galerie d'images native par notre implémentation
            externalImagesLibrary: customImageLibrary,
            
            // Masquer les onglets inutiles par CSS
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
            // IMPORTANT: Structure correcte pour apiRequestData
            apiRequestData: {
              userId: familleId || user?.id,
              role: 'USER',
              metadata: {
                emailId: emailId
              }
            },
            onReady: function() {
              setIsEditorReady(true);
              setError(null);
              console.log("Stripo Editor prêt");
            },
            onError: function(error: any) {
              setError("Erreur Stripo : " + (error?.message || JSON.stringify(error)));
            }
          };

          console.log("Initialisation de l'éditeur Stripo avec:", editorConfig);
          
          try {
            window.UIEditor.initEditor(
              containerRef.current,
              editorConfig
            );
            
            // Observer pour masquer les onglets non désirés
            const observer = new MutationObserver(() => {
              document.querySelectorAll('[data-test="DOCUMENTS"], [data-test="TEMPLATES"], .es-plugin-ui-tabs__tab[data-test="DOCUMENTS"], .es-plugin-ui-tabs__tab[data-test="TEMPLATES"], .es-plugin-ui-tabs__tab:nth-child(2)').forEach(el => {
                (el as HTMLElement).style.display = "none";
              });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            window.__stripoObserver = observer;
          } catch (err) {
            console.error("Erreur lors de l'initialisation de l'éditeur:", err);
            setError(`Erreur d'initialisation: ${(err as Error).message}`);
          }
        };

        script.onerror = function() {
          setError("Impossible de charger le script Stripo");
        };

        document.body.appendChild(script);
      })
      .catch(err => {
        setError("Erreur d'authentification: " + err.message);
        console.error("Erreur d'authentification:", err);
      });
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