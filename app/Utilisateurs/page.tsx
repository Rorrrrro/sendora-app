"use client"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, MoreHorizontal, Shield, Mail, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLayout } from "@/components/dashboard-layout"
import React, { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { createBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  status: "En attente" | "Acceptée" | "Expirée" | "actif" | "Actif" | string
  marketing_platform: "Propriétaire" | "Éditeur" | "Lecture" | "Aucun accès"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useUser();
  const supabase = createBrowserClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      // 1. Récupérer tous les utilisateurs de la table Utilisateurs
      const { data: utilisateurs, error: usersError } = await supabase
        .from("Utilisateurs")
        .select("*");

      if (usersError) {
        console.error("Erreur lors de la récupération des utilisateurs:", usersError);
        return;
      }

      // 2. Récupérer toutes les invitations liées au compte parent
      const { data: invitations, error: invitationsError } = await supabase
        .from("Invitations")
        .select("*");

      if (invitationsError) {
        console.error("Erreur lors de la récupération des invitations:", invitationsError);
        return;
      }

      // Récupère tous les emails déjà utilisateurs
      const utilisateursEmails = utilisateurs.map((u: any) => u.email);

      // Invitations (affiche uniquement si l'utilisateur n'existe pas encore)
      const invitationUsers = invitations
        .filter((inv: any) => !utilisateursEmails.includes(inv.email_invite))
        .map((inv: any) => ({
          id: inv.id,
          email: inv.email_invite,
          status: inv.statut || "En attente",
          marketing_platform: inv.role_marketing
        }));

      // Utilisateurs existants (affichés comme 'Actif')
      const formattedUsers = utilisateurs.map((u: any): User => ({
        id: u.id,
        email: u.email,
        status: "actif",
        marketing_platform: u.role_marketing
      }));

      setUsers([
        ...formattedUsers,
        ...invitationUsers
      ]);
      setLoading(false);
    };

    fetchUsers();
  }, [user]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ajoute la fonction de suppression
  const handleDelete = async (user: User) => {
    if (user.status === "actif") {
      // Utilisateur enfant : confirmation
      if (typeof window !== 'undefined' && !window.confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.email} ? Cette action est irréversible.`)) {
        return;
      }
      const { error } = await supabase.from("Utilisateurs").delete().eq("id", user.id);
      if (error) {
        toast.error("Erreur lors de la suppression de l'utilisateur.");
      } else {
        toast.success("Utilisateur supprimé.");
        // Rafraîchir la liste
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } else {
      // Invitation : suppression directe
      const { error } = await supabase.from("Invitations").delete().eq("id", user.id);
      if (error) {
        toast.error("Erreur lors de la suppression de l'invitation.");
      } else {
        toast.success("Invitation supprimée.");
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-muted-foreground mt-3">Gérez ici les membres de votre équipe et leurs accès.</p>
          </div>
          <Link href="/Utilisateurs/inviter">
            <Button
              className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" /> Inviter un utilisateur
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-sm bg-[#FFFEFF]">
          <CardHeader className="pb-3" />
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher un utilisateur..."
                  className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:border-[#6c43e0] hover:border-[#bdbdbd] transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div
                  className="flex items-center justify-between rounded-2xl border px-6 py-4 bg-[#FAFAFD] border-[#E0E1E1] shadow-sm mb-2"
                >
                  <div className="flex items-center flex-1 min-w-0 mr-4 gap-8">
                    <div className="flex flex-col gap-2.5 w-[280px]">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="flex flex-col gap-2.5 w-[120px]">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex flex-col gap-2.5 w-[160px]">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center w-8">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between rounded-2xl border px-6 py-4 transition-all group
                      bg-[#FAFAFD] border-[#E0E1E1]
                      hover:bg-[#f4f4fd] hover:border-[#6C43E0] shadow-sm hover:shadow-md`}
                  >
                    <div className="flex items-center justify-start flex-1 min-w-0 mr-4 gap-8">
                      <div className="flex flex-col gap-2.5 w-[280px]">
                        <span className="text-xs text-muted-foreground font-medium">EMAIL</span>
                        <div className="font-semibold text-base text-[#23272f]">{user.email}</div>
                      </div>

                      <div className="flex flex-col gap-2.5 w-[120px]">
                        <span className="text-xs text-muted-foreground font-medium">STATUT</span>
                        {/* Affichage robuste du badge de statut */}
                        {(() => {
                          let color = 'bg-gray-100 text-gray-800';
                          let label = user.status;
                          if (user.status === 'actif') {
                            color = 'bg-green-100 text-green-800';
                            label = 'Actif';
                          } else if (user.status === 'En attente') {
                            color = 'bg-yellow-100 text-yellow-800';
                            label = 'En attente';
                          } else if (user.status === 'Acceptée') {
                            color = 'bg-blue-100 text-blue-800';
                            label = 'Acceptée';
                          } else if (user.status === 'Expirée') {
                            color = 'bg-red-100 text-red-800';
                            label = 'Expirée';
                          }
                          return (
                            <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium w-fit ${color}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col gap-2.5 w-[160px]">
                        <span className="text-xs text-muted-foreground font-medium">PLATEFORME MARKETING</span>
                        <span className="text-sm text-[#23272f]">
                          {user.marketing_platform}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center w-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-muted-foreground hover:bg-[#e5e4fa] hover:text-[#3d247a] focus-visible:ring-0 focus-visible:ring-offset-0">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="menu-action-item w-full flex items-center gap-2 h-8 font-semibold rounded-lg text-[16px] text-[#3d247a] transition"
                            asChild
                          >
                            <Link href={`/Utilisateurs/gerer-acces?id=${user.id}`} prefetch={false}>
                              <Shield className="h-4 w-4" />
                              Gérer les accès
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="w-full py-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2 h-8 font-semibold rounded-lg bg-[#d21c3c] border-[#d21c3c] hover:bg-[#b81a34] hover:border-[#b81a34] text-[16px] transition focus:outline-none focus:ring-0"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        .menu-action-item:hover {
          background-color: #efeffb !important;
          color: #3d247a !important;
        }
        .menu-action-item:hover svg {
          color: #3d247a !important;
        }
      `}</style>
    </AppLayout>
  )
} 