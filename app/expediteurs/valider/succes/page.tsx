"use client";
export const dynamic = "force-dynamic";

import { CheckCircle2 } from "lucide-react";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ValiderExpediteurSuccesInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const famille_id = searchParams.get("famille_id");

  useEffect(() => {
    console.log("Params:", { token, email, famille_id });
    if (!token || !email || !famille_id) return;
    // Timer en background de 10 secondes avant de consommer le token
    const timer = setTimeout(() => {
      fetch("/api/expediteur/consume-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, famille_id }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("API consume-token response:", data);
        })
        .catch((err) => {
          console.error("API consume-token error:", err);
        });
    }, 10000); // <-- 10 secondes

    return () => clearTimeout(timer);
  }, [token, email, famille_id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          Adresse validée !
        </h1>
        <p className="mb-2 text-gray-700 text-base text-center">
          Votre adresse d'expéditeur a bien été validée.
          <br />
          Vous pouvez maintenant envoyer des emails avec cette adresse.
        </p>
      </div>
    </div>
  );
}

export default function ValiderExpediteurSucces() {
  return (
    <Suspense>
      <ValiderExpediteurSuccesInner />
    </Suspense>
  );
}