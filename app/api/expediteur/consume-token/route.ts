import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { token, email, famille_id } = await req.json();

  console.log("API consume-token received:", { token, email, famille_id });

  if (!token || !email || !famille_id) {
    return NextResponse.json({ error: "Token, email ou famille_id manquant" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('Expediteurs')
    .update({ token: null })
    .eq('token', token)
    .eq('email', email)
    .eq('famille_id', famille_id)
    .eq('statut', 'Vérifié')
    .select();

  console.log("API consume-token update result:", { data, error });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Aucun expéditeur trouvé à consommer" }, { status: 404 });
  }

  return NextResponse.json({ success: true, count: data.length });
}
