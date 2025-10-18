"use client";
export const dynamic = "force-dynamic";

import { CheckCircle2 } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ValiderExpediteurSuccesInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const famille_id = searchParams.get("famille_id");
  const [consumed, setConsumed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConsume = () => {
    setLoading(true);
    fetch("/api/expediteur/consume-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, famille_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setConsumed(true);
        setLoading(false);
        console.log("API consume-token response:", data);
      })
      .catch((err) => {
        setLoading(false);
        console.error("API consume-token error:", err);
      });
  };

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
        {!consumed ? (
          <button
            className="mt-6 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
            onClick={handleConsume}
            disabled={loading}
          >
            {loading ? "Validation..." : "Valider définitivement"}
          </button>
        ) : (
          <span className="mt-6 text-green-600 font-semibold">Token consommé !</span>
        )}
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