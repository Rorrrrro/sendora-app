"use client";

import { useState } from 'react';
// Importer le composant avec le bon nom de fichier
import GrapesJSEditor from "@/components/GrapesJSEditor";

export default function Page() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Éditeur de Newsletter</h1>
      {loading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <p>Chargement de l'éditeur...</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <GrapesJSEditor />
        </div>
      )}
    </div>
  );
}
