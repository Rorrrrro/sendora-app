"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlusCircle, FileCode, Copy as CloneIcon, History } from "lucide-react";
import { AppLayout } from "@/components/dashboard-layout";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";

const CreateTemplatePage: React.FC = () => {
  const router = useRouter();
  const [templateName, setTemplateName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();
  const { user } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    if (nameFromUrl) {
      setTemplateName(nameFromUrl);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCreateFromScratch = async () => {
    if (!validateTemplateName()) return;
    setIsSubmitting(true);
    try {
      // Récupération du user et famille_id
      let familleId = user?.compte_parent_id;
      if (!familleId) familleId = user?.id ?? "";

      const createdBy = user?.id ?? "";
      const now = new Date().toISOString();

      // 1. Récupérer le HTML du template catalog
      const { data: catalog, error: catalogError } = await supabase
        .from("Template_catalog")
        .select("html_code, design_json")
        .eq("id", "4a7fd5e8-85c4-45ee-967d-72b299f9aa07")
        .single();

      if (catalogError || !catalog) {
        toast({
          title: "Erreur",
          description: "Impossible de charger le template de base.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Créer le template dans Supabase avec ce HTML
      const { data, error } = await supabase
        .from("Templates")
        .insert({
          nom: templateName,
          html_code: catalog.html_code ?? "",
          design_json: catalog.design_json ?? {},
          created_by: createdBy,
          famille_id: familleId,
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le template.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Rediriger vers l'éditeur avec l'id du nouveau template (mode=edit)
      router.push(`/templates/editeur?id=${data.id}&name=${encodeURIComponent(templateName)}&mode=edit`);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleCreateFromTemplate = () => {
    if (!validateTemplateName()) return;
    // Redirige vers la nouvelle page de sélection de template catalog
    router.push(`/templates/catalog-selection?name=${encodeURIComponent(templateName)}`);
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
      setInputError(true);
      toast({
        title: "Erreur",
        description: "Veuillez nommer votre template",
        variant: "destructive",
      });
      if (inputRef.current) inputRef.current.focus();
      return false;
    }
    setInputError(false);
    return true;
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <Input
            ref={inputRef}
            id="template-name"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value);
              if (inputError && e.target.value.trim()) setInputError(false);
            }}
            placeholder="Nom du template"
            className={`max-w-md text-lg ${
              inputError
                ? "border-red-500 focus-visible:ring-red-500 focus:border-red-500"
                : ""
            }`}
            style={inputError ? { borderColor: "#dc2626", color: "#dc2626" } : {}}
          />
        </div>
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