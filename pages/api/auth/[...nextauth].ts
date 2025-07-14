import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/connexion", // Redirige vers ta page de connexion custom
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/sync-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.name })
        });
        const data = await res.json();
        // Si on est côté navigateur, sur la page d'inscription, et que l'email existe déjà, on bloque la connexion
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/inscription") && data.alreadyExists) {
          return false;
        }
      } catch (e) {
        // Ignore l'erreur pour ne pas bloquer la connexion
      }
      return true;
    }
  }
}); 