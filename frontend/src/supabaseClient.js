import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
