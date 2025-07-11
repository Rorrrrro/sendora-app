import { NextRequest, NextResponse } from 'next/server';
import { sendExpediteurConfirmationEmail } from '@/lib/sendExpediteurConfirmationEmail';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const { email, nom, token, renvoi, id } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  }

  let finalToken = token;
  if (renvoi) {
    if (!id) {
      return NextResponse.json({ error: 'ID requis pour le renvoi' }, { status: 400 });
    }
    // Renvoi : on génère un nouveau token et met à jour la BDD
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    finalToken = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
    const { data, error } = await supabase
      .from('Expediteurs')
      .update({ token: finalToken, created_at: now.toISOString(), expires_at: expiresAt.toISOString() })
      .eq('id', id)
      .eq('email', email)
      .select();
    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: "Impossible de mettre à jour le token pour cet expéditeur (id/email non trouvé ou RLS)" }, { status: 400 });
    }
  } else if (!token) {
    return NextResponse.json({ error: 'Token requis pour un envoi initial' }, { status: 400 });
  }

  try {
    await sendExpediteurConfirmationEmail({ email, nom, token: finalToken });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erreur lors de l'envoi de l'email :", e);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
} 