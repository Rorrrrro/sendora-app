"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Upload, Cloud, CheckCircle2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Papa from "papaparse"
import { cn } from "@/lib/utils"
import { CreateListSidebar } from "@/components/create-list-sidebar"
import { Checkbox } from "@/components/ui/checkbox"
import * as XLSX from "xlsx"
import { callSendyEdgeFunction } from "@/lib/sendyEdge";

export default function ImportContactsPage() {
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()
  const router = useRouter()
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[] | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [csvRowCount, setCsvRowCount] = useState<number>(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const [step, setStep] = useState(1)
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({})
  const [mappingError, setMappingError] = useState<string | null>(null)
  const [userLists, setUserLists] = useState<{ id: string; nom: string; nb_contacts: number; sendy_list_id?: string }[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [createListSidebarOpen, setCreateListSidebarOpen] = useState(false);
  const [optInConfirmed, setOptInConfirmed] = useState(false);
  const [newCustomFields, setNewCustomFields] = useState<{ [header: string]: string }>({});
  const [showNewFieldInput, setShowNewFieldInput] = useState<{ [header: string]: boolean }>({});
  const [newCustomFieldType, setNewCustomFieldType] = useState<{ [header: string]: string }>({});
  const [contactAttributes, setContactAttributes] = useState<{ value: string, label: string }[]>([
    { value: 'ignore', label: 'Ne pas importer' },
    { value: 'prenom', label: 'Prénom' },
    { value: 'nom', label: 'Nom' },
    { value: 'email', label: 'Email' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'telephone', label: 'Téléphone' },
    { value: 'divider', label: 'divider' },
    { value: 'new', label: 'Ajouter un nouvel attribut' }
  ]);
  // Ajout d'un état pour l'erreur de sélection de liste
  const [listSelectionError, setListSelectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!mappingError) return;

    const currentMappedAttributes = Object.values(columnMapping);
    
    if (mappingError === "Vous devez attribuer une colonne au champ 'Email' pour continuer") {
      if (currentMappedAttributes.includes('email')) {
        setMappingError(null);
      }
    }
    
    if (mappingError === "Chaque attribut ne peut être assigné qu'une seule fois") {
      const assigned = currentMappedAttributes.filter(attr => attr !== 'ignore');
      if (assigned.length === new Set(assigned).size) {
        setMappingError(null);
      }
    }
  }, [columnMapping, mappingError]);

  useEffect(() => {
    if (step === 2 && user) {
      // Charger les custom fields existants
      supabase
        .from('Contact_custom_fields')
        .select('name')
        .eq('userID', user.id)
        .then(({ data, error }) => {
          if (!error && data) {
            setContactAttributes(prev => {
              // On évite les doublons
              const existing = new Set(prev.map(a => a.value));
              const customs = data
                .map((f: { name: string }) => ({ value: f.name, label: f.name }))
                .filter(f => !existing.has(f.value));
              // On garde la structure divider/new à la fin
              const base = prev.filter(a => !['divider', 'new'].includes(a.value));
              return [
                ...base,
                ...customs,
                { value: 'divider', label: 'divider' },
                { value: 'new', label: 'Ajouter un nouvel attribut' }
              ];
            });
          }
        });
    }
  }, [step, user, supabase]);

  const mappedAttributes = Object.values(columnMapping);
  const mappedCount = mappedAttributes.filter(attr => attr !== 'ignore').length;
  const ignoredCount = mappedAttributes.length - mappedCount;

  const handleValidateMapping = () => {
    setMappingError(null);

    const mappedAttributes = Object.values(columnMapping);

    if (!mappedAttributes.includes('email')) {
      setMappingError("Vous devez attribuer une colonne au champ 'Email' pour continuer");
      return;
    }

    const assignedAttributes = mappedAttributes.filter(attr => attr !== 'ignore');
    const uniqueAttributes = new Set(assignedAttributes);

    if (assignedAttributes.length !== uniqueAttributes.size) {
      setMappingError("Chaque attribut ne peut être assigné qu'une seule fois");
      return;
    }

    setStep(3);
  };

  const fetchUserLists = async (selectNewest?: boolean) => {
    if (!user) return;
    const { data } = await supabase
      .from("Listes")
      .select("id, nom, nb_contacts, sendy_list_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setUserLists(data);
      if (selectNewest && data.length > 0) {
        handleSelectList(data[0].id);
      }
    }
  };

  useEffect(() => {
    if (step === 3) {
      fetchUserLists();
    }
  }, [step]);
  
  const handleSelectList = (listId: string) => {
    setListSelectionError(null);
    const aucuneListe = userLists.find(l => l.nom === 'Aucune liste');
    if (!aucuneListe) {
      setSelectedListIds(prev =>
        prev.includes(listId)
          ? prev.filter(id => id !== listId)
          : [...prev, listId]
      );
      return;
    }
    // Si on sélectionne "Aucune liste" alors qu'une autre est déjà sélectionnée, on ne garde que "Aucune liste"
    if (listId === aucuneListe.id) {
      setSelectedListIds(prev => prev.includes(listId) ? [] : [listId]);
      return;
    }
    // Si "Aucune liste" est déjà sélectionnée, on la retire et on ajoute la nouvelle
    setSelectedListIds(prev => {
      if (prev.includes(aucuneListe.id)) {
        return [listId];
      }
      return prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId];
    });
  };

  // Fonction utilitaire pour détecter la colonne email
  function detectEmailColumn(headers: string[], previewRows: string[][]): string | null {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    for (let col = 0; col < headers.length; col++) {
      for (let row = 0; row < Math.min(previewRows.length, 10); row++) {
        const value = previewRows[row]?.[col]?.toString().trim();
        if (value && emailRegex.test(value)) {
          return headers[col];
        }
      }
    }
    return null;
  }

  const handleFile = (selectedFile: File) => {
    const isCSV = selectedFile && selectedFile.type === "text/csv";
    const isExcel = selectedFile && (
      selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selectedFile.type === "application/vnd.ms-excel" ||
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls")
    );
    if (isCSV) {
      setFile(selectedFile)
      setError(null)
      setCsvFileName(selectedFile.name)
      Papa.parse(selectedFile, {
        complete: (results: any) => {
          const data = results.data as string[][]
          if (data.length > 1) {
            const headers = data[0]
            setCsvHeaders(headers)
            setCsvPreview(data.slice(1, 11))
            setCsvRowCount(data.length - 1)
            // Détection automatique de la colonne email
            const emailCol = detectEmailColumn(headers, data.slice(1, 11))
            const initialMapping = headers.reduce((acc, header) => {
              acc[header] = (header === emailCol) ? 'email' : 'ignore'
              return acc
            }, {} as { [key: string]: string })
            setColumnMapping(initialMapping)
          } else {
            setCsvHeaders(null)
            setCsvPreview(null)
            setCsvRowCount(0)
          }
        },
        skipEmptyLines: true
      })
    } else if (isExcel) {
      setFile(selectedFile)
      setError(null)
      setCsvFileName(selectedFile.name)
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        if (json.length > 1) {
          const headers = json[0] as string[];
          setCsvHeaders(headers);
          setCsvPreview((json as string[][]).slice(1, 11));
          setCsvRowCount(json.length - 1);
          // Détection automatique de la colonne email
          const emailCol = detectEmailColumn(headers, (json as string[][]).slice(1, 11));
          const initialMapping = headers.reduce((acc, header) => {
            acc[header] = (header === emailCol) ? 'email' : 'ignore';
            return acc;
          }, {} as { [key: string]: string });
          setColumnMapping(initialMapping);
        } else {
          setCsvHeaders(null);
          setCsvPreview(null);
          setCsvRowCount(0);
        }
      };
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier Excel");
        setCsvHeaders(null);
        setCsvPreview(null);
        setCsvFileName(null);
        setCsvRowCount(0);
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setFile(null)
      setError("Veuillez sélectionner un fichier CSV ou Excel valide (.csv, .xlsx, .xls)")
      setCsvHeaders(null)
      setCsvPreview(null)
      setCsvFileName(null)
      setCsvRowCount(0)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const parseCSV = (content: string) => {
    const lines = content.split("\n")
    const headers = lines[0].split(",").map((header) => header.trim())
    const contacts = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((value) => value.trim())
      if (values.length === headers.length) {
        const contact: any = {}
        headers.forEach((header, index) => {
          contact[header] = values[index]
        })
        contacts.push(contact)
      }
    }

    return contacts
  }

  const parseFullCsv = (csvFile: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvFile, {
        complete: (results: any) => resolve(results),
        error: (error: any) => reject(error),
        skipEmptyLines: true,
      });
    });
  };

  // Ajout : fonction pour parser un fichier Excel en tableau de données (headers + rows)
  const parseFullExcel = (excelFile: File): Promise<{ data: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          resolve({ data: json });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(excelFile);
    });
  };

  const handleFinalImport = async () => {
    if (!user || !file || !columnMapping || selectedListIds.length === 0) {
      setError("Les informations nécessaires à l'importation sont manquantes.");
      return;
    }
    // Vérification : empêcher "Aucune liste" + une autre
    const aucuneListe = userLists.find(l => l.nom === 'Aucune liste');
    if (aucuneListe && selectedListIds.includes(aucuneListe.id) && selectedListIds.length > 1) {
      setListSelectionError("Vous ne pouvez pas sélectionner 'Aucune liste' en même temps qu'une autre liste.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Détection du type de fichier (CSV ou Excel)
      const isCSV = file.type === "text/csv";
      const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel" || file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      let results;
      if (isCSV) {
        results = await parseFullCsv(file);
      } else if (isExcel) {
        results = await parseFullExcel(file);
      } else {
        throw new Error("Format de fichier non supporté pour l'import.");
      }
      const headers = results.data[0];
      const dataRows = results.data.slice(1);

      // Construction des contacts à importer
      const contactsToImport = dataRows
        .map((row: string[]) => {
          const contact: { [key: string]: any } = {
            created_at: new Date().toISOString(),
          };
          headers.forEach((header: string, index: number) => {
            const attribute = columnMapping[header];
            if (
              attribute &&
              attribute !== 'ignore' &&
              realContactColumns.includes(attribute)
            ) {
              contact[attribute] = row[index] ? row[index].toString().trim() : null;
            }
          });
          return contact;
        })
        .filter((contact: { [key: string]: any }) => contact.email);

      if (contactsToImport.length === 0) {
        setError("Aucun contact valide à importer. Vérifiez que la colonne 'Email' est bien mappée et que les données sont présentes.");
        setIsLoading(false);
        return;
      }

      // 1. Récupérer les emails déjà existants pour la famille
      const famille_id = user.compte_parent_id || user.id;
      const importedEmails = contactsToImport.map((c: any) => c.email);
      const { data: existingContacts, error: existingError } = await supabase
        .from('Contacts')
        .select('id, email')
        .eq('famille_id', famille_id)
        .in('email', importedEmails);

      if (existingError) throw new Error("Erreur lors de la récupération des contacts existants");

      const existingEmails = new Set((existingContacts || []).map((c: any) => c.email));

      // 2. Séparer les contacts à créer et ceux déjà existants
      const contactsToCreate = contactsToImport.filter((c: any) => !existingEmails.has(c.email));
      const contactsAlreadyExist = (existingContacts || []).filter((c: any) => importedEmails.includes(c.email));

      // 3. Insérer les nouveaux contacts
      let insertedContacts = [];
      if (contactsToCreate.length > 0) {
        const { data, error } = await supabase
          .from('Contacts')
          .insert(contactsToCreate.map((c: any) => ({
            ...c,
            famille_id,
            userID: user.id,
          })))
          .select();
        if (error) throw new Error("Erreur lors de l'insertion des nouveaux contacts");
        insertedContacts = data || [];
      }

      // 4. Récupérer tous les contacts (nouveaux + existants) avec leur id
      const allContacts = [
        ...insertedContacts,
        ...contactsAlreadyExist
      ];

      // 5. Pour chaque liste sélectionnée, ajouter la liaison si elle n'existe pas déjà
      for (const listId of selectedListIds) {
        for (const contact of allContacts) {
          const { data: liaison } = await supabase
            .from('Listes_Contacts')
            .select('id')
            .eq('contact_id', contact.id)
            .eq('liste_id', listId)
            .maybeSingle();

          if (!liaison) {
            await supabase
              .from('Listes_Contacts')
              .insert({ contact_id: contact.id, liste_id: listId, user_id: user.id });
          }
        }
      }

      // 6. Insérer les valeurs des custom fields pour chaque contact
      const customFieldNames = Object.values(columnMapping)
        .filter(attr => attr && !['ignore', 'prenom', 'nom', 'email', 'entreprise', 'telephone'].includes(attr));

      if (customFieldNames.length > 0) {
        // Récupérer tous les custom fields pour la famille
        const { data: allCustomFields, error: customFieldsError } = await supabase
          .from('Contact_custom_fields')
          .select('id, name')
          .eq('famille_id', famille_id);

        if (customFieldsError) throw new Error("Erreur lors de la récupération des custom fields");

        for (let i = 0; i < allContacts.length; i++) {
          const contact = allContacts[i];
          // Retrouver la ligne d'origine dans dataRows
          const rowIdx = importedEmails.indexOf(contact.email);
          if (rowIdx === -1) continue;
          const row = dataRows[rowIdx];

          for (let col = 0; col < headers.length; col++) {
            const mapped = columnMapping[headers[col]];
            if (mapped && !['ignore', 'prenom', 'nom', 'email', 'entreprise', 'telephone'].includes(mapped)) {
              const customField = allCustomFields.find((f: any) => f.name === mapped);
              if (customField) {
                const value = row[col] ? row[col].toString().trim() : null;
                if (value) {
                  await supabase.from('Contact_custom_values').insert({
                    contact_id: contact.id,
                    custom_field_id: customField.id,
                    value
                  });
                }
              }
            }
          }
        }
      }

      // (Garde ici la logique custom fields et synchro Sendy)
      // 1. Synchronise les custom fields utilisés avec Sendy pour chaque liste sélectionnée
      const uniqueCustomFields = Array.from(new Set(customFieldNames));
      for (const listId of selectedListIds) {
        const list = userLists.find(l => String(l.id) === String(listId));
        if (list && list.sendy_list_id) {
          for (const fieldName of uniqueCustomFields) {
            try {
              console.log("Appel sync-sendy-custom-field", { list_hash: list.sendy_list_id, field_name: fieldName, field_type: "Text", supabase_list_id: list.id });
              await callSendyEdgeFunction("sync-sendy-custom-field", {
                list_hash: list.sendy_list_id,
                field_name: fieldName,
                field_type: "Text",
                supabase_list_id: list.id // <-- correction ici
              });
            } catch (err) {
              console.error("Erreur lors de la synchro du custom field Sendy:", fieldName, "liste:", list.sendy_list_id, err);
            }
          }
        }
      }
      // 2. Ensuite, synchronise chaque contact avec Sendy
      for (const contact of allContacts) {
        for (const listId of selectedListIds) {
          const list = userLists.find(l => String(l.id) === String(listId));
          if (list && list.sendy_list_id) {
            try {
              await callSendyEdgeFunction("sync-sendy-contacts", {
                contact_id: contact.id,
                sendy_list_hash: list.sendy_list_id
              });
            } catch (err) {
              console.error("Erreur lors de la synchro Sendy pour contact:", contact.id, "liste:", list.sendy_list_id, err);
            }
          }
        }
      }

      router.push("/contacts?import_success=true");

    } catch (err: any) {
      console.error("Error importing contacts:", err);
      setError(`Une erreur est survenue : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const realContactColumns = ['id', 'prenom', 'nom', 'email', 'entreprise', 'telephone', 'created_at', 'userID'];

  const baseAttributes = [
    { value: 'prenom', label: 'Prénom' },
    { value: 'nom', label: 'Nom' },
    { value: 'email', label: 'Email' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'telephone', label: 'Téléphone' }
  ];
  const baseKeys = baseAttributes.map(attr => attr.value.toLowerCase());
  const customAttributes = contactAttributes.filter(attr =>
    !baseKeys.includes(attr.value.toLowerCase()) &&
    !['ignore', 'divider', 'new'].includes(attr.value)
  );
  const safeContactAttributes = [
    { value: 'ignore', label: 'Ne pas importer' },
    ...baseAttributes,
    ...customAttributes,
    { value: 'divider', label: 'divider' },
    { value: 'new', label: 'Ajouter un nouvel attribut' }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto mb-8 flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Importer des contacts depuis un fichier</h1>
            <p className="text-muted-foreground mt-3">Téléversez un fichier CSV ou Excel contenant vos contacts et leurs informations. Idéal pour importer un grand nombre de contacts.</p>
          </div>
          <button
            onClick={() => router.push('/contacts')}
            className="text-gray-400 hover:text-gray-700 text-2xl focus:outline-none ml-4 mt-1 rounded-full transition-colors hover:bg-gray-100 p-1"
            title="Retour à la liste des contacts"
          >
            <X className="w-7 h-7" />
          </button>
        </div>
        <Card className="border-none shadow-sm max-w-4xl mx-auto relative">
          <CardContent className="pt-10 pb-10">
            {/* Étape 1 */}
            <div className="mb-12">
              {step > 1 ? (
                // Vue "validée" de l'étape 1
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold text-[#23272f]">Importer un fichier</span>
                    </div>
                    <button 
                      onClick={() => {
                        setStep(1);
                        const initialMapping = csvHeaders?.reduce((acc, header) => {
                          acc[header] = 'ignore'
                          return acc
                        }, {} as { [key: string]: string }) || {}
                        setColumnMapping(initialMapping);
                      }}
                      className="font-bold text-lg text-[#6B5DE6] hover:text-[#4f32a7] mr-8 underline"
                    >
                      Edit
                    </button>
                  </div>
                   {csvFileName && csvHeaders && (
                    <div className="ml-11 text-muted-foreground">
                      {csvFileName} : {csvRowCount} lignes et {csvHeaders.length} colonnes
                    </div>
                  )}
                </div>
              ) : (
                // Vue "active" de l'étape 1
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-[#23272f]">①</span>
                    <span className="text-xl font-semibold text-[#23272f]">Importez votre fichier</span>
                  </div>
                  <div className="text-muted-foreground text-base mb-6 ml-8">Sélectionnez un fichier contenant vos contacts à importer.</div>
                  <div className="ml-8">
                    {/* Drag & drop centré, large, icône visible */}
                    {!csvPreview && (
                      <div
                        className={`border-2 rounded-xl p-12 text-center transition-colors cursor-pointer bg-[#FFFEFF] flex flex-col items-center justify-center
                          ${isDragActive ? 'border-[#6c43e0] bg-[#f4f4fd]' : 'border-[#bdbdbd]'}
                          hover:border-[#6c43e0] hover:bg-[#fafbfc]`
                        }
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Cloud className="w-24 h-24 text-gray-300 mb-6" />
                        <p className="text-2xl text-[#23272f] font-light mb-2 tracking-wide">Sélectionnez votre fichier ou déposez-le ici</p>
                        <p className="text-lg font-bold text-[#23272f]">.csv, .xlsx, .xls</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {step === 1 && csvPreview && csvHeaders && (
                      <div className="mt-8">
                        <div className="rounded border border-green-400 bg-green-50 text-green-900 px-4 py-3 mb-4 text-lg">
                          <div className="font-semibold mb-1">Votre fichier a bien été importé !</div>
                          <div className="text-green-800 text-sm">{csvFileName}</div>
                        </div>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Aperçu de votre fichier ({csvPreview.length} ligne{csvPreview.length > 1 ? 's' : ''} affichée{csvPreview.length > 1 ? 's' : ''})
                        </div>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="min-w-full bg-[#FFFEFF] text-sm">
                            <thead>
                              <tr>
                                {csvHeaders.map((header, idx) => (
                                  <th key={idx} className="px-4 py-2 font-semibold border-b text-left whitespace-nowrap">{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.map((row, i) => (
                                <tr key={i} className="border-b last:border-b-0">
                                  {row.map((cell, j) => (
                                    <td key={j} className="px-4 py-2 whitespace-nowrap">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-center gap-10 mt-8">
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setCsvPreview(null);
                              setCsvHeaders(null);
                              setCsvFileName(null);
                              setCsvRowCount(0);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-6 shadow-none transition"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="bg-[#6c43e0] text-white font-semibold rounded-md h-10 px-6 shadow-none transition hover:bg-[#4f32a7]"
                            onClick={() => setStep(2)}
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <hr className="my-10 border-[#e0e0e0]" />
            {/* Étape 2 - Titre toujours visible, contenu seulement si step === 2 */}
            <div className="mb-12">
              {step > 2 ? (
                 <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold text-[#23272f]">Mapper les données</span>
                    </div>
                    <button 
                      onClick={() => setStep(2)}
                      className="font-bold text-lg text-[#6B5DE6] hover:text-[#4f32a7] mr-8 underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="ml-11 text-sm text-muted-foreground mt-1">
                    {mappedCount} attribut{mappedCount > 1 ? 's' : ''} sélectionné{mappedCount > 1 ? 's' : ''}, {ignoredCount} colonne{ignoredCount > 1 ? 's' : ''} ignorée{ignoredCount > 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl font-bold ${step === 2 ? 'text-[#23272f]' : 'text-[#bdbdbd]'}`}>②</span>
                  <span className={`text-xl font-semibold ${step === 2 ? 'text-[#23272f]' : 'text-[#bdbdbd]'}`}>Mapper les données</span>
                </div>
              {step === 2 && csvHeaders && csvPreview && (
                <>
                  <div className="ml-11 mb-6 text-base text-[#23272f]">Associez vos colonnes aux attributs proposés afin de garantir une importation correcte des données.</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-base">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-bold text-muted-foreground uppercase tracking-wider">Nom de la colonne</th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-muted-foreground uppercase tracking-wider">Données</th>
                          <th className="px-6 py-3 text-left text-sm font-bold text-muted-foreground uppercase tracking-wider">Attribut du contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvHeaders.flatMap((header, idx) => {
                          const isMapped = columnMapping[header] && columnMapping[header] !== 'ignore';
                          return [
                          <tr key={header} className={cn("border", isMapped ? "bg-[#f4f4fd] border-[#6C43E0]" : "bg-[#fafbfc] border-[#e0e0e0]")}>
                            <td className="px-6 py-4 font-semibold text-lg text-[#23272f]">{header}</td>
                            <td className="px-6 py-4">
                              {csvPreview.slice(0, 3).map((row, i) => (
                                <div key={i}>{row[idx]}</div>
                              ))}
                            </td>
                            <td className="px-6 py-4">
                              {showNewFieldInput[header] ? (
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      style={{ borderColor: '#e0e0e0', transition: 'border-color 0.2s', borderWidth: 1, borderStyle: 'solid', boxShadow: 'none', outline: 'none', border: '1px solid #e0e0e0 !important' }}
                                      className="border rounded px-2 h-9 py-1 text-sm w-[180px] focus:!border-[#6c43e0] hover:!border-[#6c43e0] !border-[#e0e0e0] outline-none"
                                      placeholder="Nom du nouvel attribut"
                                      value={newCustomFields[header] || ""}
                                      onChange={e => {
                                        setNewCustomFields({ ...newCustomFields, [header]: e.target.value });
                                      }}
                                    />
                                    <div className="mt-1">
                                      <Select
                                        value={newCustomFieldType[header] || "text"}
                                        onValueChange={value => setNewCustomFieldType({ ...newCustomFieldType, [header]: value })}
                                      >
                                        <SelectTrigger className="w-[180px] h-9 bg-[#FFFEFF] min-h-0 py-1 text-sm">
                                          <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text" className="!text-[#3C2479] hover:!text-[#3C2479] focus:!text-[#3C2479]">Texte</SelectItem>
                                          <SelectItem value="number" className="!text-[#3C2479] hover:!text-[#3C2479] focus:!text-[#3C2479]">Nombre</SelectItem>
                                          <SelectItem value="date" className="!text-[#3C2479] hover:!text-[#3C2479] focus:!text-[#3C2479]">Date</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 ml-2">
                                    <Button
                                      size="sm"
                                      style={{ backgroundColor: '#6c43e0', color: '#fff', border: 'none' }}
                                      className="hover:!bg-[#4f32a7] focus:!bg-[#4f32a7] !text-white"
                                      onClick={async () => {
                                        if (!user || !newCustomFields[header]) return;
                                        const typeToStore = (newCustomFieldType[header] === 'date') ? 'Date' : 'Text';
                                        // Ajout dans Supabase
                                        const { data, error } = await supabase
                                          .from('Contact_custom_fields')
                                          .insert([{
                                            name: newCustomFields[header],
                                            type: typeToStore,
                                            userID: user.id
                                          }])
                                          .select();
                                        if (error) {
                                          alert("Erreur lors de l'ajout du champ personnalisé : " + error.message);
                                          return;
                                        }
                                        // Recharge tous les attributs personnalisés de l'utilisateur
                                        const { data: customFields, error: fetchError } = await supabase
                                          .from('Contact_custom_fields')
                                          .select('name')
                                          .eq('userID', user.id);
                                        if (!fetchError && customFields) {
                                          setContactAttributes([
                                            { value: 'ignore', label: 'Ne pas importer' },
                                            { value: 'prenom', label: 'Prénom' },
                                            { value: 'nom', label: 'Nom' },
                                            { value: 'email', label: 'Email' },
                                            { value: 'entreprise', label: 'Entreprise' },
                                            { value: 'telephone', label: 'Téléphone' },
                                            ...customFields.map((f: { name: string }) => ({ value: f.name, label: f.name })),
                                            { value: 'divider', label: 'divider' },
                                            { value: 'new', label: 'Ajouter un nouvel attribut' }
                                          ]);
                                          setColumnMapping({ ...columnMapping, [header]: newCustomFields[header] });
                                          setShowNewFieldInput({ ...showNewFieldInput, [header]: false });
                                        }
                                      }}
                                      disabled={!newCustomFields[header]}
                                    >
                                      Ajouter
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      style={{ backgroundColor: '#fffeff', color: '#23272f', border: '1px solid #e0e0e0' }}
                                      className="hover:!bg-[#fafbfc] hover:!border-[#bdbdbd] focus:!bg-[#fafbfc] focus:!border-[#bdbdbd] !text-[#23272f]"
                                      onClick={() => {
                                        setShowNewFieldInput({ ...showNewFieldInput, [header]: false });
                                        setColumnMapping({ ...columnMapping, [header]: 'ignore' });
                                      }}
                                    >
                                      Retour
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Select
                                  value={columnMapping[header]}
                                  onValueChange={(value) => {
                                    setColumnMapping({ ...columnMapping, [header]: value });
                                    setShowNewFieldInput({ ...showNewFieldInput, [header]: value === "new" });
                                  }}
                                >
                                  <SelectTrigger className="w-[220px] bg-[#FFFEFF]">
                                    <SelectValue placeholder="Sélectionner une valeur" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {safeContactAttributes.map(attr =>
                                      attr.value === 'divider'
                                        ? <div key="divider" className="border-t my-1 border-gray-200" />
                                        : <SelectItem
                                            key={attr.value}
                                            value={attr.value}
                                            className="!text-[#3C2479] hover:!text-[#3C2479] focus:!text-[#3C2479]"
                                          >
                                            {attr.label}
                                          </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                          </tr>,
                          <tr key={`${header}-spacer`} className="h-6" />,
                        ]})}
                      </tbody>
                    </table>
                  </div>
                  {mappingError && (
                    <p className="text-center text-red-500 mt-4 text-sm">{mappingError}</p>
                  )}
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      className="bg-[#6c43e0] text-white font-semibold rounded-md h-10 px-6 shadow-none transition hover:bg-[#4f32a7]"
                      onClick={handleValidateMapping}
                    >
                      Valider
                    </button>
                  </div>
                </>
              )}
              </>
              )}
            </div>
            <hr className="my-10 border-[#e0e0e0]" />
            {/* Étape 3 */}
            <div>
              {step > 3 ? (
                 <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold text-[#23272f]">Sélectionner une liste</span>
                    </div>
                    <button 
                      onClick={() => setStep(3)}
                      className="font-bold text-lg text-[#6B5DE6] hover:text-[#4f32a7] mr-8 underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="ml-11 text-sm text-muted-foreground mt-1">
                    {selectedListIds.length} liste{selectedListIds.length > 1 ? 's' : ''} sélectionnée{selectedListIds.length > 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-2xl font-bold ${step === 3 ? 'text-[#23272f]' : 'text-[#bdbdbd]'}`}>③</span>
                    <span className={`text-xl font-semibold ${step === 3 ? 'text-[#23272f]' : 'text-[#bdbdbd]'}`}>Sélectionner une liste</span>
                  </div>
                  {step === 3 && (
                    <div className="ml-11">
                      <div className="mb-6 text-base text-muted-foreground">Sélectionnez une ou plusieurs listes auxquelles ajouter ces nouveaux contacts.</div>
                      
                      <div className="w-full border rounded-md max-h-64 overflow-y-auto">
                        <div className="p-1 space-y-1">
                          {userLists.length > 0 ? (
                            userLists.map((list) => {
                              const isSelected = selectedListIds.includes(list.id);
                              return (
                                <label
                                  key={list.id}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-[#f4f4fd] hover:bg-[#efeffb]"
                                      : "hover:bg-[#f5f5f5]"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleSelectList(list.id)}
                                    />
                                    <span className="font-semibold text-[#3C2479]">{list.nom}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">{list.nb_contacts || 0} contact{list.nb_contacts > 1 ? 's' : ''}</span>
                                </label>
                              )
                            })
                          ) : (
                            <p className="text-muted-foreground text-sm px-3 py-2.5">Vous n'avez pas encore de liste.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setCreateListSidebarOpen(true)}
                          className="bg-[#FFFEFF] text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-6 shadow-none transition flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Créer une liste
                        </button>
                      </div>
                
                      <div className="flex justify-center mt-12">
                        <button
                            type="button"
                            className="bg-[#6c43e0] text-white font-semibold rounded-md h-10 px-6 shadow-none transition hover:bg-[#4f32a7] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setStep(4)}
                            disabled={selectedListIds.length === 0}
                        >
                            Valider
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <hr className="my-10 border-[#e0e0e0]" />
            {/* Étape 4 */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className={`text-2xl font-bold ${step === 4 ? 'text-[#23272f]' : 'text-[#bdbdbd]'}`}>④</span>
                    <span className={`text-xl font-semibold ${step === 4 ? 'text-[#23272f]' : 'text-[#bdbdbd]'}`}>Finaliser l'importation</span>
                </div>
                {step === 4 && (
                    <div className="ml-11">
                        <p className="mb-6 text-base text-muted-foreground">Veuillez confirmer votre accord avec nos conditions avant de lancer l'importation.</p>
                        
                        <div className="bg-[#f4f4fd] p-6 rounded-lg border border-[#e6dbfa]">
                            <label className="flex items-start gap-4 cursor-pointer">
                                <Checkbox
                                    id="opt-in-confirm"
                                    checked={optInConfirmed}
                                    onCheckedChange={(checked) => setOptInConfirmed(Boolean(checked))}
                                    className="mt-1 flex-shrink-0"
                                />
                                <div className="grid gap-1.5 leading-relaxed">
                                    <span className="font-semibold text-base text-[#2d1863]">Je confirme que mon nouvel import respecte ces conditions :</span>
                                    <ul className="list-disc list-outside pl-5 text-sm text-[#3d247a] space-y-2 mt-2">
                                        <li>Mes contacts m'ont explicitement donné leur permission pour recevoir des communications par e-mail au cours des deux dernières années.</li>
                                        <li>La liste de contacts n'a été ni louée, ni achetée, ni empruntée.</li>
                                    </ul>
                                    <p className="text-xs text-slate-500 mt-4">
                                        Le non-respect de ces règles peut entraîner la suspension de votre compte et de vos campagnes.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-center mt-12">
                            <button
                                type="button"
                                className="bg-[#6c43e0] text-white font-semibold rounded-md h-10 px-6 shadow-none transition hover:bg-[#4f32a7] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
                                onClick={handleFinalImport}
                                disabled={!optInConfirmed || isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importation...
                                    </>
                                ) : (
                                    `Importer ${csvRowCount} contacts`
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
      <CreateListSidebar
        isOpen={createListSidebarOpen}
        onClose={() => setCreateListSidebarOpen(false)}
        onListCreated={() => fetchUserLists(true)}
      />
    </AppLayout>
  )
}