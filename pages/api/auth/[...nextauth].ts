import NextAuth, { NextAuthOptions, User, Account, Profile, Session } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { JWT } from "next-auth/jwt"
import { AdapterUser } from "next-auth/adapters"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn(params: { user: User | AdapterUser; account: Account | null; profile?: Profile; email?: { verificationRequest?: boolean }; credentials?: Record<string, unknown> }) {
      const email = params.user.email as string
      const isSignup = params.account?.providerAccountId && params.account?.type === 'oauth' && params.account?.provider === 'google' && params.account?.refresh_token
      // Vérifie si l'utilisateur existe déjà dans Supabase Auth
      const { data: existingUser } = await supabaseAdmin
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()
      if (existingUser) {
        // Connexion : OK, l'utilisateur existe
        return true
      } else {
        // Si on est sur la page d'inscription (à affiner si besoin)
        if (isSignup) {
          // Crée l'utilisateur dans Supabase Auth
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              name: params.user.name || '',
            },
          })
          if (createError) {
            // Erreur à la création
            return "/inscription?error=creation"
          }
          // Crée la ligne dans la table métier Utilisateurs si besoin
          await supabaseAdmin.from('Utilisateurs').upsert({ email, prenom: params.user.name || '' }, { onConflict: 'email' })
          // Redirige vers compléter profil
          return "/inscription/completer-profil"
        } else {
          // Connexion : utilisateur non trouvé
          return "/connexion?error=notfound"
        }
      }
    },
    async jwt({ token, user }: { token: JWT, user?: User | AdapterUser }) {
      if (user) {
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (session.user) {
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  pages: {
    signIn: '/connexion',
    error: '/connexion',
    newUser: '/inscription/completer-profil',
  },
}

export default NextAuth(authOptions) 