import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Liste des routes protégées (nécessitent une connexion)
const protectedRoutes = ['/accueil', '/contacts', '/campaigns', '/statistics', '/account']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: "https://fvcizjojzlteryioqmwb.supabase.co",
      supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2l6am9qemx0ZXJ5aW9xbXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MjQ1MzAsImV4cCI6MjA2MDIwMDUzMH0.2Ny5DgSrENynudI3v85TyBhpdswmEC0NYhiJmT6qYn0"
    }
  )

  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession()
    const path = req.nextUrl.pathname

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    if (!session && protectedRoutes.some(route => path.startsWith(route))) {
      // Rediriger vers la page de connexion
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Middleware - Erreur:", error)
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
