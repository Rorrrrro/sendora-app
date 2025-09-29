// components/GrapesJSEditor.tsx
"use client";

import { useRef } from "react";
import GjsEditor from "@grapesjs/react";
import grapesjs from "grapesjs";                    // ✅ obligatoire
import type { Editor } from "grapesjs";
import pluginNewsletter from "grapesjs-preset-newsletter";

// CSS - suppression de l'import CSS problématique
import "grapesjs/dist/css/grapes.min.css";
// Suppression de: import "grapesjs-preset-newsletter/dist/grapesjs-preset-newsletter.css";

export default function GrapesJSEditor() {
  const editorRef = useRef<Editor | null>(null);

  const handleExport = () => {
    const ed = editorRef.current;
    if (!ed) return;
    const html = ed.getHtml();
    const css = ed.getCss();
    console.log({ html, css });
    alert("HTML/CSS exportés dans la console ✅");
  };

  return (
    <div style={{ height: "92vh", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleExport}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
        >
          Exporter HTML
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <GjsEditor
          grapesjs={grapesjs}                       
          options={{
            height: "100%",
            storageManager: false,
            plugins: [pluginNewsletter],
            pluginsOpts: {
              "grapesjs-preset-newsletter": { inlineCss: true },
            },
          }}
          onEditor={(ed) => {                       
            editorRef.current = ed;
          }}
        />
      </div>
    </div>
  );
}
