// Browser Supabase client — used by client components (the header and the
// checkout prefill). It stores the login session in cookies so the server
// can read it too.
//
// This is NOT the service-role client. lib/supabaseServer.js stays
// server-only and is untouched. The two NEXT_PUBLIC_ variables below are
// safe to expose — they are the same public keys the product pages use.
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Make sure .env.local contains " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

let client;

// One shared client for the whole browser session.
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("lib/supabaseBrowser.js must only run in the browser.");
  }
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
