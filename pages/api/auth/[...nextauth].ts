import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

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
    async signIn({ user, account }) {
      try {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/sync-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.name })
        });
        const data = await res.json();
        // On stocke le statut dans un cookie temporaire pour le callback redirect
        if (typeof window === "undefined") {
          // côté serveur (prod/vercel)
          const cookieStore = await cookies();
          cookieStore.set("sendora_signup_status", data.alreadyExists ? "exists" : "new", { path: "/", httpOnly: false });
        } else {
          // fallback côté client (dev)
          document.cookie = `sendora_signup_status=${data.alreadyExists ? "exists" : "new"}; path=/`;
        }
      } catch (e) {
        // ignore
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      let status = null;
      if (typeof window === "undefined") {
        // côté serveur (prod/vercel)
        const cookieStore = await cookies();
        status = cookieStore.get("sendora_signup_status")?.value;
      } else {
        // côté client (dev)
        status = document.cookie.split('; ').find(row => row.startsWith('sendora_signup_status='))?.split('=')[1];
      }
      // Efface le cookie après lecture
      if (typeof window === "undefined") {
        const cookieStore = await cookies();
        cookieStore.set("sendora_signup_status", "", { path: "/", maxAge: 0 });
      } else {
        document.cookie = "sendora_signup_status=; path=/; max-age=0";
      }
      if (status === "exists") {
        return `${baseUrl}/accueil`;
      }
      if (status === "new") {
        return `${baseUrl}/inscription/completer-profil`;
      }
      return baseUrl;
    }
  }
}); 