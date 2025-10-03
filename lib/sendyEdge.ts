import { createBrowserClient } from '@/lib/supabase';

/**
 * Appelle une Edge Function Supabase avec authentification et gestion d'erreur.
 * 
 * @param functionName Nom de la fonction edge à appeler
 * @param payload Données à envoyer à la fonction
 * @returns Réponse de la fonction, ou null en cas d'erreur
 */
export async function callSendyEdgeFunction(functionName: string, payload: any) {
  try {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`https://fvcizjojzlteryioqmwb.functions.supabase.co/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`Erreur lors de l'appel à ${functionName}:`, err);
    return null;
  }
}