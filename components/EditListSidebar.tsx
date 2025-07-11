import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface List {
  id: string | number;
  nom: string;
  description?: string;
  nb_contacts: number;
}

interface EditListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  list: List | null;
  onSave: (data: { nom: string; description: string }) => void;
  onShowContacts: () => void;
}

export function EditListSidebar({ isOpen, onClose, list, onSave, onShowContacts }: EditListSidebarProps) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [isReadyToFetch, setIsReadyToFetch] = useState(false);

  useEffect(() => {
    if (list) {
      setNom(list.nom || "");
      setDescription(list.description || "");
      setIsReadyToFetch(true);
    }
  }, [list]);

  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 z-50 top-0 left-0 right-0 bottom-0">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-96 bg-[#FFFEFF] shadow-xl overflow-hidden rounded-l-[2rem] flex flex-col">
        <div className="bg-[#6c43e0] py-6 text-center relative z-10">
          <h2 className="text-xl font-bold text-white">Modifier la liste</h2>
        </div>
        <form
          id="edit-list-form"
          onSubmit={e => {
            e.preventDefault();
            onSave({ nom, description });
          }}
          className="flex-1 flex flex-col px-8 py-6 space-y-6"
        >
          <div>
            <Label htmlFor="nom">Nom de la liste</Label>
            <Input
              id="nom"
              name="nom"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom de la liste"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez le but de cette liste..."
              rows={6}
              className="mt-1 max-h-60 overflow-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{list.nb_contacts <= 1 ? 'Contact' : 'Contacts'} :</span>
            <span>{list.nb_contacts}</span>
          </div>
          <Button
            type="button"
            className="mt-2 w-full bg-[#FFFEFF] border border-[#e0e0e0] text-[#23272f] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc] hover:border-[#bdbdbd] hover:text-[#23272f] transition"
            onClick={onShowContacts}
            disabled={list.nb_contacts === 0}
          >
            {list.nb_contacts === 0
              ? 'Aucun contact'
              : list.nb_contacts === 1
                ? 'Voir le contact'
                : 'Voir les contacts'}
          </Button>
        </form>
        <div className="flex justify-center gap-14 px-8 py-6 border-t bg-[#FFFEFF]">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#FFFEFF] border border-[#e0e0e0] text-[#23272f] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc] hover:border-[#bdbdbd] hover:text-[#23272f] transition"
          >
            Annuler
          </Button>
          <Button type="submit" form="edit-list-form" className="bg-[#6c43e0] text-white hover:bg-[#4f32a7]">
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
} 