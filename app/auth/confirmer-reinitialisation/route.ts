import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (!token_hash || type !== 'recovery') {
    return redirect('/connexion?error=missing_token')
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    const reason = error.message && error.message.toLowerCase().includes('expired') ? 'expired' : 'invalid'
    return redirect(`/erreur-lien?type=recovery&reason=${reason}`)
  }

  return redirect('/connexion/mise-a-jour-mot-de-passe?token_hash='+encodeURIComponent(token_hash)+'&type=recovery')
} 