"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"

interface ImportContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactsImported: () => void
}

export function ImportContactsDialog({ open, onOpenChange, onContactsImported }: ImportContactsDialogProps) {
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()

  if (!open) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setError(null)
    } else {
      setFile(null)
      setError("Veuillez sélectionner un fichier CSV valide")
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("Veuillez déposer un fichier CSV valide")
    }
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

      // Map the contacts to match your database schema
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

      onContactsImported()
      onOpenChange(false)
    } catch (err) {
      console.error("Error importing contacts:", err)
      setError("Une erreur est survenue lors de l'importation des contacts")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importer des contacts depuis un fichier</h2>
            <p className="text-gray-600 mt-2">
              Téléversez un fichier contenant tous vos contacts et leurs informations. Cette méthode est
              particulièrement utile si vous avez un grand nombre de contacts à importer.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-medium mr-3">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Importez votre fichier</h3>
            </div>
            <p className="text-gray-600 mb-6 ml-9">Sélectionnez un fichier contenant vos contacts à importer.</p>

            <div className="ml-9">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  error ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 relative">
                    <Cloud className="w-8 h-8 text-gray-400" />
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-lg text-gray-700 mb-2">Sélectionnez votre fichier ou déposez-le ici</p>
                  <p className="text-sm text-gray-500">.csv</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className={error ? "opacity-50" : ""}>
            <div className="flex items-center mb-4">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium mr-3 ${
                  error ? "bg-red-600 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Mapper les données</h3>
            </div>

            {file && (
              <div className="ml-9">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Fichier sélectionné :</p>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                    }}
                  >
                    Changer de fichier
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {isLoading ? "Importation..." : "Importer les contacts"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
