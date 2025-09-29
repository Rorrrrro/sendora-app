"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Card } from "@/components/ui/card";
import { PlusCircle, FileCode, Copy as CloneIcon, History } from "lucide-react";
import { AppLayout } from "@/components/dashboard-layout";

const CreateTemplatePage: React.FC = () => {
  const router = useRouter();
  const [templateName, setTemplateName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCreateFromScratch = () => {
    if (!validateTemplateName()) return;
    router.push(`/templates/editeur?name=${encodeURIComponent(templateName)}&mode=new`);
  };

  const handleCreateFromTemplate = () => {
    if (!validateTemplateName()) return;
    router.push(`/templates/utilisations?name=${encodeURIComponent(templateName)}`);
  };

  const handleCreateFromHtml = () => {
    if (!validateTemplateName()) return;
    router.push(`/templates/html?name=${encodeURIComponent(templateName)}`);
  };

  const handleUseHistory = () => {
    if (!validateTemplateName()) return;
    router.push(`/templates/history?name=${encodeURIComponent(templateName)}`);
  };

  const validateTemplateName = (): boolean => {
    if (!templateName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez nommer votre template",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <AppLayout>
      {/* Barre d'en-tête pour le nom du template */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b flex items-center px-6 py-4">
        <span className="text-lg font-semibold mr-4">Nom du template :</span>
        <input
          ref={inputRef}
          id="template-name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Ex : Newsletter Juin"
          className="w-full max-w-md rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-[#6c43e0] focus:ring-[#6c43e0]"
        />
      </div>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="p-6 hover:border-primary cursor-pointer transition-all"
            onClick={handleCreateFromScratch}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Commencer de zéro</h3>
                <p className="text-muted-foreground text-sm">
                  Créez un template en partant de zéro
                </p>
              </div>
            </div>
          </Card>
          <Card 
            className="p-6 hover:border-primary cursor-pointer transition-all"
            onClick={handleCreateFromTemplate}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CloneIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Utiliser un template</h3>
                <p className="text-muted-foreground text-sm">
                  Choisissez parmi nos templates prédéfinis
                </p>
              </div>
            </div>
          </Card>
          <Card 
            className="p-6 hover:border-primary cursor-pointer transition-all"
            onClick={handleCreateFromHtml}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Insérer du code HTML</h3>
                <p className="text-muted-foreground text-sm">
                  Importez votre propre code HTML
                </p>
              </div>
            </div>
          </Card>
          <Card 
            className="p-6 hover:border-primary cursor-pointer transition-all opacity-70"
            onClick={handleUseHistory}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Templates récents</h3>
                <p className="text-muted-foreground text-sm">
                  Reprendre un template récent (Bientôt disponible)
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateTemplatePage;




