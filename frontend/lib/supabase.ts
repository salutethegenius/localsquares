import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton client instance for browser usage
let browserClient: SupabaseClient | null = null

// Client-side Supabase client for browser usage (singleton pattern)
export const createBrowserClient = (): SupabaseClient => {
  // Reuse existing client if available
  if (browserClient) {
    return browserClient
  }

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return browserClient
}

// Legacy export for backwards compatibility
export const supabase = createBrowserClient()

// Server-side Supabase client (for API routes, server components)
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

