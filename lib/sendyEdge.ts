// lib/sendyEdge.ts

export async function callSendyEdgeFunction(functionName: string, record: any) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`;
  console.log("Appel Edge Function URL:", url);
  try {
    // Ajout du catch pour les erreurs CORS - si l'appel échoue en prod, on continue silencieusement
    const response = await fetch(
      `https://{YOUR_PROJECT_REF}.supabase.co/functions/v1/${functionName}`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ajout du header Authorization si nécessaire
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(record)
      }
    );
    
    if (!response.ok) {
      console.warn(`Erreur Edge Function ${functionName}:`, response.status);
      // Ne pas bloquer la suite du processus
      return null;
    }
    
    // Lis le body une seule fois
    const text = await response.text();
    let result = null;
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