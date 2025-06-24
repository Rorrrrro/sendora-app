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
  const [userLists, setUserLists] = useState<{ id: string; nom: string; nb_contacts: number }[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [createListSidebarOpen, setCreateListSidebarOpen] = useState(false);
  const [optInConfirmed, setOptInConfirmed] = useState(false);

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

  const mappedAttributes = Object.values(columnMapping);
  const mappedCount = mappedAttributes.filter(attr => attr !== 'ignore').length;
  const ignoredCount = mappedAttributes.length - mappedCount;

  const contactAttributes = [
    { value: 'ignore', label: 'Ne pas importer' },
    { value: 'prenom', label: 'Prénom' },
    { value: 'nom', label: 'Nom' },
    { value: 'email', label: 'Email' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'telephone', label: 'Téléphone' },
    // Ajoute ici d'autres attributs si besoin
  ]

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
      .select("id, nom, nb_contacts")
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
    setSelectedListIds(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
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

      const contactsToInsert = dataRows
        .map((row: string[]) => {
          const contact: { [key: string]: any } = {
            created_at: new Date().toISOString(),
          };
          headers.forEach((header: string, index: number) => {
            const attribute = columnMapping[header];
            if (attribute && attribute !== 'ignore') {
              contact[attribute] = row[index] ? row[index].toString().trim() : null;
            }
          });
          return contact;
        })
        .filter((contact: { [key: string]: any }) => contact.email); // S'assurer que chaque contact à importer a un email

      if (contactsToInsert.length === 0) {
        setError("Aucun contact valide à importer. Vérifiez que la colonne 'Email' est bien mappée et que les données sont présentes.");
        setIsLoading(false);
        return;
      }

      // Étape 1: Insérer les contacts
      const { data: insertedContacts, error: insertError } = await supabase
        .from("Contacts")
        .insert(contactsToInsert)
        .select("id");

      if (insertError) {
        // Gère les erreurs de duplications d'email etc.
        if (insertError.code === '23505') {
            throw new Error("Certains contacts existent déjà ou des emails sont dupliqués dans votre fichier.");
        }
        throw new Error(`Erreur lors de l'ajout des contacts: ${insertError.message}`);
      }

      if (!insertedContacts || insertedContacts.length === 0) {
        throw new Error("Aucun contact n'a été inséré. Il est possible que tous les contacts de ce fichier existent déjà dans votre base.");
      }
      
      // Étape 2: Lier les contacts aux listes sélectionnées
      const contactListLinks = insertedContacts.flatMap((contact) =>
        selectedListIds.map((listId) => ({
          contact_id: contact.id,
          liste_id: listId,
          user_id: user.id, // Important pour la sécurité au niveau des lignes (RLS)
        }))
      );

      const { error: linkError } = await supabase
        .from("Listes_Contacts")
        .insert(contactListLinks);

      if (linkError) {
        // Idéalement, il faudrait annuler l'insertion des contacts ici (rollback)
        // Pour l'instant, on affiche une erreur claire
        throw new Error(`Les contacts ont été créés, mais une erreur est survenue lors de leur ajout aux listes: ${linkError.message}`);
      }

      router.push("/contacts?import_success=true");

    } catch (err: any) {
      console.error("Error importing contacts:", err);
      setError(`Une erreur est survenue : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
                               <Select
                                value={columnMapping[header]}
                                onValueChange={(value) => {
                                  setColumnMapping({ ...columnMapping, [header]: value })
                                }}
                              >
                                <SelectTrigger className="w-[220px] bg-[#FFFEFF]">
                                  <SelectValue placeholder="Sélectionner une valeur" />
                                </SelectTrigger>
                                <SelectContent>
                                  {contactAttributes.map((attr) => (
                                    <SelectItem key={attr.value} value={attr.value}>{attr.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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