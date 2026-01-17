import { createClient } from '@supabase/supabase-js'

// Récupère les variables depuis .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Crée le client Supabase (la connexion à ta BDD)
export const supabase = createClient(supabaseUrl, supabaseKey)