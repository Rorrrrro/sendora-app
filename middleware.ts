import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste des routes protégées (nécessitent une connexion)
const protectedRoutes = ['/accueil', '/contacts', '/campagnes', '/statistiques', '/mon-profil', '/listes'] as const

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            // @ts-ignore: Next.js types n'acceptent que 2 arguments
            req.cookies.set(name, value)
          })
        },
      },
    }
  )

  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession()
    const path = req.nextUrl.pathname

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    if (!session && protectedRoutes.some(route => path.startsWith(route))) {
      // Rediriger vers la page de connexion
      const redirectUrl = new URL('/connexion', req.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware - Erreur:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
