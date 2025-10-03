// lib/sendyEdge.ts
import { createBrowserClient } from "@/lib/supabase";

// URL de base des fonctions Edge Supabase
const FUNCTIONS_URL = 'https://fvcizjojzlteryioqmwb.functions.supabase.co';

export async function callSendyEdgeFunction(functionName: string, record: any) {
  try {
    // Récupérer le token d'authentification
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    // URL complète de la fonction
    const url = `${FUNCTIONS_URL}/${functionName}`;
    console.log(`Appel Edge Function ${functionName}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(record)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur Edge Function ${functionName}:`, response.status, errorText);
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }

    return result;
  } catch (err) {
    // Log de l'erreur mais ne pas bloquer le flux
    console.warn(`Erreur lors de l'appel à ${functionName}:`, err);
    return null;
  }
};