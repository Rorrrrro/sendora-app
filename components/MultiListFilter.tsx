import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check } from "lucide-react"

interface List {
  id: string | number
  nom: string
}

interface MultiListFilterProps {
  lists: List[]
  selectedListIds: (string | number)[]
  onChange: (ids: (string | number)[]) => void
}

export function MultiListFilter({ lists, selectedListIds, onChange }: MultiListFilterProps) {
  const [open, setOpen] = useState(false)

  const toggleList = (id: string | number) => {
    const idStr = String(id)
    if (selectedListIds.map(String).includes(idStr)) {
      onChange(selectedListIds.filter((lid) => String(lid) !== idStr))
    } else {
      onChange([...selectedListIds, idStr])
    }
  }

  const clearAll = () => onChange([])

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 min-w-[180px] border transition-colors ${open ? 'border-[#6c43e0]' : 'border-input'} focus:outline-none focus:ring-0 ring-0 hover:border-[#6c43e0]`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedListIds.length === 0
          ? 'Filtrer par liste'
          : `${selectedListIds.length} filtre${selectedListIds.length > 1 ? 's' : ''} actif${selectedListIds.length > 1 ? 's' : ''}`}
        <ChevronDown className="w-4 h-4 ml-2 transition-transform duration-0" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </Button>
      {open && (
        <>
          {/* Overlay pour fermer le menu au clic à l'extérieur */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-2 w-64 bg-[#FFFEFF] border rounded-lg shadow-lg p-2 max-h-72 overflow-auto left-1/2 -translate-x-1/2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm pl-2">Vos listes</span>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-[#3d247a] hover:bg-[#efeffb] hover:text-[#3d247a] text-xs px-2 py-0 font-normal">Tout désélectionner</Button>
            </div>
            <ul className="space-y-1">
              {lists.length === 0 && (
                <li className="text-muted-foreground text-sm px-2 py-1">Aucune liste</li>
              )}
              {lists.map((list) => (
                <li
                  key={list.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#efeffb] cursor-pointer text-[#3d247a] font-normal"
                  onClick={() => toggleList(list.id)}
                  role="option"
                  aria-selected={selectedListIds.map(String).includes(String(list.id))}
                >
                  <Checkbox 
                    checked={selectedListIds.map(String).includes(String(list.id))} 
                    className="h-4 w-4 border border-[#6B5DE6] rounded bg-[#FFFEFF]"
                    icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 10 18 4 12" /></svg>}
                  />
                  <span className="truncate flex-1">{list.nom}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
} 