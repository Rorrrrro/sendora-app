import { NextRequest, NextResponse } from 'next/server';

// Gérer les requêtes OPTIONS (pré-vérification CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS'
    }
  });
}

// Gérer les requêtes POST
export async function POST(request: NextRequest) {
  try {
    // Extraire le corps de la requête
    const body = await request.json();
    
    // Relayer la requête vers le service d'authentification existant
    const response = await fetch('https://media.sendora.fr/api/stripo/auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Vérifier si la requête a réussi
    if (!response.ok) {
      console.error(`Erreur d'authentification Stripo: ${response.status}`);
      return NextResponse.json(
        { error: `Erreur de service: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Récupérer et retourner les données JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
