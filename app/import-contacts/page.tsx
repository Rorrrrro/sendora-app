"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Upload, Cloud, CheckCircle2 } from "lucide-react"
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
import Papa, { ParseResult } from "papaparse"

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
  const contactAttributes = [
    { value: 'ignore', label: 'Ne pas importer' },
    { value: 'prenom', label: 'Prénom' },
    { value: 'nom', label: 'Nom' },
    { value: 'email', label: 'Email' },
    { value: 'entreprise', label: 'Entreprise' },
    { value: 'telephone', label: 'Téléphone' },
    // Ajoute ici d'autres attributs si besoin
  ]

  const handleFile = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === "text/csv") {
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
            const initialMapping = headers.reduce((acc, header) => {
              acc[header] = 'ignore'
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
    } else {
      setFile(null)
      setError("Veuillez sélectionner un fichier CSV valide")
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

  const handleImport = async () => {
    if (!file || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const content = await file.text()
      const contacts = parseCSV(content)

      const mappedContacts = contacts.map((contact) => ({
        prenom: contact.firstname || "",
        nom: contact.lastname || "",
        email: contact.email || "",
        telephone: contact.phone || "",
        entreprise: contact.company || "",
        userID: user.id,
      }))

      const { error } = await supabase.from("Contacts").insert(mappedContacts)

      if (error) {
        throw error
      }

      router.push("/contacts")
    } catch (err) {
      console.error("Error importing contacts:", err)
      setError("Une erreur est survenue lors de l'importation des contacts")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto mb-8 flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Importer des contacts depuis un fichier</h1>
            <p className="text-muted-foreground mt-3">Téléversez un fichier CSV contenant vos contacts et leurs informations. Idéal pour importer un grand nombre de contacts.</p>
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
                        setColumnMapping({});
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
                        className={`border-2 rounded-xl p-12 text-center transition-colors cursor-pointer bg-white flex flex-col items-center justify-center
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
                        <p className="text-lg font-bold text-[#23272f]">.csv</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
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
                          <table className="min-w-full bg-white text-sm">
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
                            className="bg-white text-[#23272f] border border-[#e0e0e0] hover:bg-[#fafbfc] hover:border-[#bdbdbd] font-semibold rounded-md h-10 px-6 shadow-none transition"
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
                        {csvHeaders.flatMap((header, idx) => [
                          <tr key={header} className="bg-[#fafbfc] border border-[#e0e0e0]">
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
                                <SelectTrigger className="w-[220px] bg-white">
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
                        ])}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      className="bg-[#6c43e0] text-white font-semibold rounded-md h-10 px-6 shadow-none transition hover:bg-[#4f32a7]"
                      onClick={() => setStep(3)}
                    >
                      Valider
                    </button>
                  </div>
                </>
              )}
            </div>
            <hr className="my-10 border-[#e0e0e0]" />
            {/* Étape 3 */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-[#bdbdbd]">③</span>
                <span className="text-xl font-semibold text-[#bdbdbd]">Sélectionner une liste</span>
              </div>
              {/* Description masquée pour l'étape 3 */}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 