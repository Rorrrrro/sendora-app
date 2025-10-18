import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/erreur-lien', req.url));
  }

  const { data, error } = await supabase
    .from('Expediteurs')
    .select('*')
    .eq('token', token)
    .single();

  if (
    error ||
    !data ||
    !data.expires_at ||
    new Date(data.expires_at) < new Date()
  ) {
    return NextResponse.redirect(new URL('/erreur-lien', req.url));
  }

  // Ne consomme PAS le token ici, ne change que le statut si besoin (optionnel)
  if (data.statut !== 'Vérifié') {
    await supabase
      .from('Expediteurs')
      .update({ statut: 'Vérifié' })
      .eq('id', data.id);
  }

  // Redirige toujours vers la page succès avec le token, l'email et la famille_id dans l'URL
  return NextResponse.redirect(new URL(`/expediteurs/valider/succes?token=${token}&email=${encodeURIComponent(data.email)}&famille_id=${encodeURIComponent(data.famille_id)}`, req.url));
}
