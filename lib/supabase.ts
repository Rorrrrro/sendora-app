import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClientInstance() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: true,
      }
    }
  )
}

// Compatibilité avec l'ancien code :
export const createBrowserClient = createBrowserClientInstance;
