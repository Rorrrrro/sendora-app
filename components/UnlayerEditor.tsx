"use client";

import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const EmailEditor = dynamic(() => import("react-email-editor"), { ssr: false });

type ExportData = { design: object; html: string };

export default function UnlayerEditor() {
  const editorRef = useRef<any>(null);

  const handleExportHtml = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.exportHtml((data: ExportData) => {
      console.log(data); // { design, html }
      alert("HTML exporté (voir console) ✅");
    });
  }, []);

  const handleSaveDesign = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.saveDesign((design: object) => {
      console.log("Design JSON:", design);
      alert("Design JSON exporté (voir console) ✅");
    });
  }, []);

  const handleLoadDesign = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const myDesign = {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<p style='font-size:20px;margin:0'>🚀 Nouveau template Unlayer</p>",
                      fontSize: "20px",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    ed.loadDesign(myDesign);
  }, []);

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
          gap: 8,
          padding: "4px 8px",
          background: "white",
          zIndex: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={handleExportHtml}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          Exporter HTML
        </button>
        <button
          onClick={handleSaveDesign}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          Exporter Design JSON
        </button>
        <button
          onClick={handleLoadDesign}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          Charger un Design
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
              panels: { tools: { dock: "left" } },
            },
            tools: {
              // Ajoutez des outils personnalisés si nécessaire
            },
            projectId: 1, // Remplacez par votre ID de projet si vous en avez un
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
          onReady={() => {
            // Optionnel: charger un design par défaut ici
            // editorRef.current?.loadDesign({ body: { rows: [] } });
          }}
        />
      </div>
    </div>
  );
}
