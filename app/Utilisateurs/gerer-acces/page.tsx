"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = ["Éditeur", "Lecture", "Aucun accès"];

type UserOrInvitation = {
  id: string;
  email: string;
  role: string;
  type: "user" | "invitation";
};

function GererAccesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<UserOrInvitation | null>(null);
  const [role, setRole] = useState<string>(ROLES[0]);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      // Cherche d'abord dans Utilisateurs
      let { data: user } = await supabase
        .from("Utilisateurs")
        .select("id, email, role_marketing")
        .eq("id", id)
        .single();
      if (user) {
        setItem({
          id: user.id,
          email: user.email,
          role: user.role_marketing,
          type: "user",
        });
        setRole(user.role_marketing);
        setLoading(false);
        return;
      }
      // Sinon, cherche dans Invitations
      let { data: invitation } = await supabase
        .from("Invitations")
        .select("id, email_invite, role_marketing")
        .eq("id", id)
        .single();
      if (invitation) {
        setItem({
          id: invitation.id,
          email: invitation.email_invite,
          role: invitation.role_marketing,
          type: "invitation",
        });
        setRole(invitation.role_marketing);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    if (item.type === "user") {
      const { error } = await supabase
        .from("Utilisateurs")
        .update({ role_marketing: role })
        .eq("id", item.id);
      if (error) {
        toast.error("Erreur lors de la modification du rôle.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("Invitations")
        .update({ role_marketing: role })
        .eq("id", item.id);
      if (error) {
        toast.error("Erreur lors de la modification du rôle.");
        setLoading(false);
        return;
      }
    }
    toast.success("Rôle mis à jour !");
    router.push("/Utilisateurs");
  };

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto mb-8 flex flex-row items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Gérer les accès</h1>
          <p className="text-muted-foreground mt-3">Modifiez les droits d'accès d'un membre ou d'une invitation existante.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/Utilisateurs")}
          className="ml-4 mt-1 rounded-full transition-colors hover:bg-[#f4f4f5] hover:text-black focus:outline-none"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          {loading || !item ? (
            <Skeleton className="h-6 w-80 mb-4 rounded" />
          ) : (
            <CardDescription>
              Modifier le rôle pour&nbsp;
              <span className="font-semibold text-[#6c43e0]">{item.email}</span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {loading || !item ? (
              <div className="gap-4 flex flex-col">
                {[1,2,3].map(i => (
                  <div key={i} className="flex p-5 rounded-2xl border w-full items-center bg-[#f9f9fb] border-[#e0e1e1] hover:border-[#bdbdbd] hover:bg-[#f4f4fd]" style={{ minHeight: 72 }}>
                    <Skeleton className="h-6 w-6 rounded-full mr-4" />
                    <div className="w-full">
                      <Skeleton className="h-6 w-32 mb-2 rounded" />
                      <Skeleton className="h-4 w-64 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup value={role} onValueChange={setRole} className="gap-4 pt-2">
                {ROLES.map((r) => (
                  <label
                    key={r}
                    className={`flex p-5 rounded-2xl border transition-all cursor-pointer w-full items-center ${role === r ? "bg-[#f4f2fd] border-[#a89af6]" : "bg-[#f9f9fb] border-[#e0e1e1] hover:border-[#bdbdbd]"}`}
                    style={{ minHeight: 72 }}
                  >
                    <RadioGroupItem value={r} className="mr-4 mt-1" />
                    <div className="font-normal w-full">
                      <p className="font-semibold">{r}</p>
                      <p className="text-sm text-muted-foreground">
                        {r === "Éditeur"
                          ? "L'utilisateur peut créer et gérer des campagnes, des contacts et des listes."
                          : r === "Lecture"
                          ? "L'utilisateur peut consulter toutes les campagnes, listes, contacts et statistiques, sans pouvoir les modifier."
                          : "L'utilisateur n'aura pas accès à la plateforme marketing."}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            )}
            <div className="flex justify-center mt-6">
              <Button type="submit" className="bg-[#6c43e0] hover:bg-[#4f32a7] text-base py-3 max-w-md w-full rounded-xl shadow-md" disabled={loading || !item}>
                Valider
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GererAccesPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="space-y-6">
          <div className="max-w-4xl mx-auto mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-80 mb-4" />
            </CardHeader>
            <CardContent>
              <div className="gap-4 flex flex-col">
                {[1,2,3].map(i => (
                  <div key={i} className="flex p-5 rounded-2xl border w-full items-center bg-[#f9f9fb] border-[#e0e1e1]" style={{ minHeight: 72 }}>
                    <Skeleton className="h-6 w-6 rounded-full mr-4" />
                    <div className="w-full">
                      <Skeleton className="h-6 w-32 mb-2 rounded" />
                      <Skeleton className="h-4 w-64 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <GererAccesContent />
      </Suspense>
    </AppLayout>
  );
} 