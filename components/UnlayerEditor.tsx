"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";

// Ajout de la déclaration de la propriété personnalisée sur Window
declare global {
  interface Window {
    _lastSupabaseInsert?: any;
  }
}

const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

export default function UnlayerEditor() {
  const editorRef = useRef<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const supabase = createBrowserClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [familleId, setFamilleId] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const templateId = searchParams.get("id");
  const templateName = searchParams.get("name") || "Template sans nom";
  const mode = searchParams.get("mode") || "new";

  // Récupérer le famille_id comme dans contacts/listes
  useEffect(() => {
    if (!user) {
      router.push("/connexion");
      return;
    }
    async function getFamilleId() {
      try {
        // Vérification explicite pour TypeScript
        if (!user) return;
        const { data } = await supabase
          .from("Utilisateurs")
          .select("compte_parent_id")
          .eq("id", user.id)
          .single();
        setFamilleId(data?.compte_parent_id ?? user.id);
      } catch (error) {
        if (user) setFamilleId(user.id);
      } finally {
        setIsLoading(false);
      }
    }
    getFamilleId();
  }, [user, supabase, router]);

  // Charger un template existant si on est en mode édition et que l'éditeur est prêt
  const loadExistingTemplate = useCallback(async () => {
    if (!templateId || !editorRef.current || !familleId) return;
    setIsLoading(true);
    try {
      const { data: template, error } = await supabase
        .from('Templates') // <-- corrige ici si la table est Templates
        .select('design_json')
        .eq('id', templateId)
        .eq('famille_id', familleId)
        .single();
      if (error) {
        console.error("Erreur de chargement du template:", error);
        return;
      }
      if (template?.design_json) {
        try {
          const designJson = typeof template.design_json === 'string'
            ? JSON.parse(template.design_json)
            : template.design_json;
          if (editorRef.current && typeof editorRef.current.loadDesign === "function") {
            editorRef.current.loadDesign(designJson);
          }
        } catch (parseError) {
          console.error("Erreur lors du parsing du design:", parseError);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du template:", error);
    } finally {
      setIsLoading(false);
    }
  }, [templateId, supabase, familleId]);

  const handleEditorReady = useCallback(() => {
    setEditorReady(true);
    setTimeout(() => {
      if (mode === "edit" && templateId) {
        loadExistingTemplate();
      }
    }, 500);
  }, [mode, templateId, loadExistingTemplate]);

  const handleSaveAndExit = useCallback(() => {
    if (!editorRef.current) {
      alert("Erreur: Éditeur non initialisé");
      return;
    }
    setIsSaving(true);
    const editorInstance = editorRef.current.editor || editorRef.current;
    if (typeof editorInstance.saveDesign === "function") {
      editorInstance.saveDesign((design: any) => {
        if (typeof editorInstance.exportHtml === "function") {
          editorInstance.exportHtml(async (data: any) => {
            if (data && typeof data.html === "string") {
              // Validation stricte
              if (
                data.html.length < 10 ||
                !design ||
                Object.keys(design).length === 0
              ) {
                alert("Erreur: HTML ou JSON trop court ou mal formé !");
                setIsSaving(false);
                return;
              }

              // Prépare le payload
              const now = new Date().toISOString();
              const payload: any = {
                nom: templateName,
                html_code: data.html,
                design_json: design, // jsonb attend un objet JS
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
                  alert("Erreur Supabase : " + JSON.stringify(result.error));
                  setIsSaving(false);
                  return;
                }
                alert("Template sauvegardé avec succès ✅");
                router.push("/templates");
              } catch (error) {
                alert("Erreur JS: " + (error instanceof Error ? error.message : String(error)));
                setIsSaving(false);
              } finally {
                setIsSaving(false);
              }
            } else {
              alert("Erreur: exportHtml ne retourne pas le HTML attendu !");
              setIsSaving(false);
            }
          });
        } else {
          alert("Erreur: Impossible d'accéder à exportHtml.");
          setIsSaving(false);
        }
      });
    } else {
      alert("Erreur: Impossible d'accéder à saveDesign.");
      setIsSaving(false);
    }
  }, [editorRef, templateName, user, familleId, mode, templateId, supabase, router]);

  if (isLoading) {
    return (
      <div style={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#3d247a"
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 12px",
          background: "white",
          zIndex: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontWeight: 500, color: "#3d247a" }}>
          {mode === "edit" ? "Modification" : "Création"}: {templateName}
        </div>
        <button
          onClick={handleSaveAndExit}
          disabled={isSaving || isLoading || !editorReady}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: isSaving ? "#9378e0" : "#6c43e0",
            color: "white",
            fontWeight: 600,
            cursor: isSaving || isLoading || !editorReady ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: isSaving || isLoading || !editorReady ? 0.7 : 1
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

      <div
        style={{
          flex: 1,
          position: "relative",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <EmailEditor
          ref={editorRef}
          options={{
            displayMode: "email",
            locale: "fr",
            appearance: {
              theme: "light",
              panels: { tools: { dock: "left" } }
            }
          }}
          style={{
            height: "100%",
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onReady={handleEditorReady}
        />
      </div>
    </div>
  );
}