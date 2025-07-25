// lib/sendyEdge.ts

export async function callSendyEdgeFunction(functionName: string, record: any) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`;
  console.log("Appel Edge Function URL:", url);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ record })
    });

    // Lis le body une seule fois
    const text = await response.text();
    let result = null;
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }

    if (!response.ok) {
      throw new Error(result?.error || "Erreur lors de l'appel à Sendy");
    }
    return result;
  } catch (err) {
    console.error("Erreur réseau/fetch Edge Function:", err);
    throw err;
  }
} 