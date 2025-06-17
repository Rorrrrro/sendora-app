import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Identifiants de votre projet Supabase existant
const supabaseUrl = "https://fvcizjojzlteryioqmwb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Y2l6am9qemx0ZXJ5aW9xbXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MjQ1MzAsImV4cCI6MjA2MDIwMDUzMH0.2Ny5DgSrENynudI3v85TyBhpdswmEC0NYhiJmT6qYn0"

// Client unique pour toute l'application
export const createBrowserClient = () => {
  return createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey
  })
}
