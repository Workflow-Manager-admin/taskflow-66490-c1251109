import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
/**
 * Initialize and export a Supabase JS client for application-wide use.
 * Reads credentials from env vars: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY.
 * @returns {SupabaseClient}
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
