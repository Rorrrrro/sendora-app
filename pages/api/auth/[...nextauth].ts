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
      const email = (params.user.email as string).toLowerCase();
      console.log('EMAIL GOOGLE:', email);
      const { data: existingUser, error } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .single();
      console.log('USER FOUND:', existingUser, 'ERROR:', error);
      if (existingUser) {
        return true;
      } else {
        return "/connexion?error=notfound";
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