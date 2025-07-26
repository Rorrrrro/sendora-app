"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/dashboard-layout";
import { createBrowserClient } from "@/lib/supabase";
import { useUser } from "@/contexts/user-context";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface RecordDKIM {
  name: string;
  value: string;
}

interface Records {
  txt: { name: string; value: string };
  cname: RecordDKIM[];
}

export default function AuthentifierDomainePage() {
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("domain") || "";
  const [records, setRecords] = useState<Records | null>(null);
  const [domain, setDomain] = useState<string>(initialDomain);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingDNS, setCheckingDNS] = useState(false);
  const [dnsResults, setDnsResults] = useState<any>(null);
  const { user } = useUser();
  const supabase = createBrowserClient();

  useEffect(() => {
    if (initialDomain) {
      fetchRecords(initialDomain);
    }
    // eslint-disable-next-line
  }, [initialDomain]);

  async function fetchRecords(d: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://sendy.sendora.fr/api/aws-ses-domain.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_SENDY_DOMAIN_SECRET || "",
          domain: d.trim()
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erreur API SES");
      setRecords(data.records);
      setDomain(d.trim());
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
      setRecords(null);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const checkDomainDNS = async () => {
    if (!domain || !user) return;
    
    setCheckingDNS(true);
    setDnsResults(null);
    
    try {
      // Récupérer l'ID du domaine depuis la base
      const { data: domainData, error: domainError } = await supabase
        .from('Domaines')
        .select('id')
        .eq('nom', domain)
        .eq('created_by', user.id)
        .single();

      if (domainError || !domainData) {
        throw new Error('Domaine non trouvé dans la base de données');
      }

      // Appeler l'edge function
      const response = await fetch('https://fvcizjojzlteryioqmwb.supabase.co/functions/v1/check-domain-dns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          domain: domain,
          domainId: domainData.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setDnsResults(data.results);
        // Ne pas recharger la page, garder les résultats affichés
      } else {
        throw new Error(data.error || 'Erreur lors de la vérification DNS');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setCheckingDNS(false);
    }
  };

  // Valeurs à afficher (même si records est null)
  const txtName = records?.txt?.name || "";
  const txtValue = records?.txt?.value || "";
  const dkim = [0, 1, 2].map(idx => records?.cname?.[idx] || { name: "", value: "" });
  const dmarcName = `_dmarc.${domain}`;
  const dmarcValue = domain ? `v=DMARC1; p=none; rua=mailto:postmaster@${domain}` : "";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authentifier un domaine</h1>
          <p className="text-muted-foreground mt-3">
            Pour authentifier un domaine, ajoutez les enregistrements DNS suivants chez votre hébergeur. L'authentification peut prendre jusqu'à 48h.
          </p>
        </div>

        {/* Bouton Vérifier les DNS */}
        <div className="flex justify-center">
          <Button 
            onClick={checkDomainDNS}
            disabled={checkingDNS || !domain}
            className="bg-[#6c43e0] hover:bg-[#4f32a7] text-white font-semibold px-6 py-3 rounded-lg shadow-md"
          >
            {checkingDNS ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Vérifier les DNS
              </>
            )}
          </Button>
        </div>

        {/* Résultats DNS */}
        {dnsResults && (
          <Card className="border-none shadow-sm bg-[#FFFEFF]">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Résultats de la vérification DNS</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`text-center p-3 rounded-lg ${dnsResults.spf ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-semibold">SPF</div>
                  <div className="text-sm">{dnsResults.spf ? 'Vérifié' : 'Non vérifié'}</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${dnsResults.txt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-semibold">TXT SES</div>
                  <div className="text-sm">{dnsResults.txt ? 'Vérifié' : 'Non vérifié'}</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${dnsResults.dkim ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-semibold">DKIM</div>
                  <div className="text-sm">{dnsResults.dkim ? 'Vérifié' : 'Non vérifié'}</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${dnsResults.dmarc ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-semibold">DMARC</div>
                  <div className="text-sm">{dnsResults.dmarc ? 'Vérifié' : 'Non vérifié'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-sm bg-[#FFFEFF] mt-6">
          <CardHeader className="pb-3" />
          <CardContent>
            {loading && <div className="mb-4 text-gray-500">Chargement...</div>}
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <div className="space-y-8">
              {/* Segment TXT */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="font-bold text-lg mb-2 text-[#6c43e0]">Enregistrement TXT (Amazon SES)</div>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Nom</span>
                    <div className="flex gap-2">
                      <input value={txtName} readOnly className="border rounded px-2 py-1 flex-1 font-mono" />
                      <button onClick={() => handleCopy(txtName, "txt-name")} className="text-xs bg-gray-200 px-2 py-1 rounded" disabled={!txtName}>
                        {copied === "txt-name" ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Valeur</span>
                    <div className="flex gap-2">
                      <input value={txtValue} readOnly className="border rounded px-2 py-1 flex-1 font-mono" />
                      <button onClick={() => handleCopy(txtValue, "txt-value")} className="text-xs bg-gray-200 px-2 py-1 rounded" disabled={!txtValue}>
                        {copied === "txt-value" ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segments DKIM */}
              {dkim.map((cname, idx) => (
                <div key={idx} className="bg-white rounded-xl border shadow-sm p-6">
                  <div className="font-bold text-lg mb-2 text-[#6c43e0]">Enregistrement DKIM {idx + 1} (CNAME)</div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Sous-domaine</span>
                      <div className="flex gap-2">
                        <input value={cname.name} readOnly className="border rounded px-2 py-1 flex-1 font-mono" />
                        <button onClick={() => handleCopy(cname.name, `cname-name-${idx}`)} className="text-xs bg-gray-200 px-2 py-1 rounded" disabled={!cname.name}>
                          {copied === `cname-name-${idx}` ? "Copié !" : "Copier"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Valeur</span>
                      <div className="flex gap-2">
                        <input value={cname.value} readOnly className="border rounded px-2 py-1 flex-1 font-mono" />
                        <button onClick={() => handleCopy(cname.value, `cname-value-${idx}`)} className="text-xs bg-gray-200 px-2 py-1 rounded" disabled={!cname.value}>
                          {copied === `cname-value-${idx}` ? "Copié !" : "Copier"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Segment DMARC */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="font-bold text-lg mb-2 text-[#6c43e0]">Enregistrement DMARC (optionnel)</div>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Nom</span>
                    <div className="flex gap-2">
                      <input value={dmarcName} readOnly className="border rounded px-2 py-1 flex-1 font-mono" />
                      <button onClick={() => handleCopy(dmarcName, "dmarc-name")} className="text-xs bg-gray-200 px-2 py-1 rounded" disabled={!dmarcName}>
                        {copied === "dmarc-name" ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Valeur</span>
                    <div className="flex gap-2">
                      <input value={dmarcValue} readOnly className="border rounded px-2 py-1 flex-1 font-mono" />
                      <button onClick={() => handleCopy(dmarcValue, "dmarc-value")} className="text-xs bg-gray-200 px-2 py-1 rounded" disabled={!dmarcValue}>
                        {copied === "dmarc-value" ? "Copié !" : "Copier"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 