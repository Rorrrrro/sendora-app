'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Send, Pencil, Archive, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, CheckCircle, Eye, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLayout } from "@/components/dashboard-layout"
import React, { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from 'next/navigation'

const statusConfig = {
  Brouillon: {
    label: "Brouillon",
    color: "bg-yellow-100 text-yellow-800",
    icon: Pencil,
  },
  Prêt: {
    label: "Prêt",
    color: "bg-green-100 text-green-800",
    icon: Send,
  },
  Envoyé: {
    label: "Envoyé",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  Planifié: {
    label: "Planifié",
    color: "bg-[#e6dbfa] text-[#6c43e0]",
    icon: Archive,
  },
  Erreur: {
    label: "Erreur",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
};

type CampaignStatus = keyof typeof statusConfig;

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  recipients: number
  openRate: number
  clickRate: number
  sentDate: string
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Welcome Series",
    status: "Prêt",
    recipients: 1254,
    openRate: 32.5,
    clickRate: 12.3,
    sentDate: "2023-05-15",
  },
  {
    id: "2",
    name: "Monthly Newsletter - June",
    status: "Envoyé",
    recipients: 5431,
    openRate: 28.7,
    clickRate: 9.2,
    sentDate: "2023-06-01",
  },
  {
    id: "3",
    name: "Product Launch - New Feature",
    status: "Brouillon",
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: "",
  },
  {
    id: "4",
    name: "Feedback Survey",
    status: "Envoyé",
    recipients: 2100,
    openRate: 45.2,
    clickRate: 22.8,
    sentDate: "2023-05-20",
  },
  {
    id: "5",
    name: "Summer Sale Promotion",
    status: "Planifié",
    recipients: 8750,
    openRate: 0,
    clickRate: 0,
    sentDate: "2023-07-01",
  },
  {
    id: "6",
    name: "Re-engagement Campaign",
    status: "Brouillon",
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: "",
  },
    {
    id: "7",
    name: "Failed Campaign",
    status: "Erreur",
    recipients: 100,
    openRate: 0,
    clickRate: 0,
    sentDate: "2023-07-10",
  }
]

export default function CampaignsPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const rowsPerPage = 10;
  const totalCampaigns = campaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / rowsPerPage));
  const paginatedCampaigns = campaigns
    .filter(c => statusFilter.length === 0 || statusFilter.includes(c.status))
    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campagnes</h1>
            <p className="text-muted-foreground mt-3">Créez et gérez vos campagnes email.</p>
          </div>
          <Button
            className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold shadow-md"
            onClick={() => router.push('/campagnes/creer')}
          >
            <Plus className="mr-2 h-4 w-4" /> Créer une campagne
          </Button>
        </div>

        <Card className="border-none shadow-sm bg-[#FFFEFF]">
          <CardHeader className="pb-3">
            <CardDescription>
              <span className="text-lg font-bold text-foreground">
                {totalCampaigns === 0 && "Aucune campagne pour le moment"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher une campagne..."
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-[#6c43e0] hover:border-[#bdbdbd] transition"
                />
              </div>
              <div className="flex-1" />
              <div className="relative inline-block">
                <Button
                  variant="outline"
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-2 min-w-[180px] border transition-colors ${filterOpen ? 'border-[#6c43e0]' : 'border-[#e0e0e0]'} focus:outline-none focus:ring-0 ring-0 hover:border-[#6c43e0] font-semibold rounded-md h-10 px-4 py-2 shadow-none hover:bg-[#fafbfc]`}
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                >
                  {statusFilter.length === 0 ? 'Filtrer par statut' : `${statusFilter.length} filtre${statusFilter.length > 1 ? 's' : ''} actif${statusFilter.length > 1 ? 's' : ''}`}
                  <ChevronDown className="w-4 h-4 ml-2 transition-transform duration-0" style={{ transform: filterOpen ? 'rotate(180deg)' : 'none' }} />
                </Button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} aria-hidden="true" />
                    <div className="absolute z-20 mt-2 w-64 bg-[#FFFEFF] border rounded-lg shadow-lg p-2 max-h-72 overflow-auto left-1/2 -translate-x-1/2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm pl-2">Statuts</span>
                        <Button variant="ghost" size="sm" onClick={() => setStatusFilter([])} className="text-[#3d247a] hover:bg-[#efeffb] hover:text-[#3d247a] text-xs px-2 py-0 font-normal">Tout désélectionner</Button>
                      </div>
                      <ul className="space-y-1">
                        {Object.keys(statusConfig).map(statusKey => {
                          const status = statusKey as CampaignStatus;
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          return (
                            <li
                              key={status}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f4f4fd] cursor-pointer"
                              onClick={() => setStatusFilter(f => f.includes(status) ? f.filter(s => s !== status) : [...f, status])}
                              role="option"
                              aria-selected={statusFilter.includes(status)}
                            >
                              <Checkbox
                                checked={statusFilter.includes(status)}
                              />
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold gap-1.5 ${config.color}`}>
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-6">
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destinataires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ouvertures</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Clics</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dernier envoi</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucune campagne à afficher.
                        </td>
                      </tr>
                    ) : (
                      paginatedCampaigns.map((campaign) => {
                        const config = statusConfig[campaign.status];
                        const Icon = config.icon;
                        return (
                          <tr key={campaign.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#3d247a]">{campaign.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold gap-1.5 ${config.color}`}>
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{campaign.recipients > 0 ? campaign.recipients.toLocaleString() : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{campaign.openRate > 0 ? campaign.openRate + '%' : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{campaign.clickRate > 0 ? campaign.clickRate + '%' : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString('fr-FR') : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-muted-foreground hover:bg-[#e5e4fa] hover:text-[#3d247a]">
                                    <MoreHorizontal className="w-5 h-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Aperçu & Test
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="flex items-center gap-2">
                                    <Pencil className="h-4 w-4" /> Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                    <Trash2 className="h-4 w-4" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center gap-4 justify-end text-sm mt-6">
                <span>
                  {paginatedCampaigns.length === 0
                    ? "0"
                    : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalCampaigns)} sur ${totalCampaigns}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#f4f4fd]"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold">{currentPage}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[#f4f4fd]"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}