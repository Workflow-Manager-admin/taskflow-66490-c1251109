import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
/**
 * Initialize and export a Supabase JS client for application-wide use.
 * Reads credentials from env vars: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY.
 * Throws a helpful error if these are missing, and logs clear diagnostics in development mode.
 * @returns {SupabaseClient}
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Provide a descriptive error and clear developer guidance
  let msg = `[Supabase] Missing Supabase configuration.\n`;
  msg += `REACT_APP_SUPABASE_URL: ${supabaseUrl ? 'OK' : 'NOT SET'}, `;
  msg += `REACT_APP_SUPABASE_KEY: ${supabaseKey ? 'OK' : 'NOT SET'}\n`;
  msg += 'Please check your ".env" file at the project root, and ensure the following lines are set:\n';
  msg += 'REACT_APP_SUPABASE_URL=your-supabase-url\nREACT_APP_SUPABASE_KEY=your-supabase-anon-key\n';
  msg += 'You can get these values from your Supabase project dashboard.\n';
  msg += 'If you just added or changed the .env, restart your server (`npm start`).\n';
  // eslint-disable-next-line no-console
  console.error(msg);
  throw new Error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
