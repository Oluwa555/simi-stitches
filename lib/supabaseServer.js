// Server-only Supabase client — uses the SERVICE ROLE key.
//
// Security, three locks:
// 1. The key is read from SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_
//    prefix), so Next.js never copies it into browser JavaScript.
// 2. The guard below refuses to run if this file ever reaches a browser.
// 3. Only server code imports it: app/api/orders/route.js and the
//    order-confirmation server page.
//
// The client is created lazily (on first request, not at import time)
// so `npm run build` still works while the key is missing.
import { createClient } from "@supabase/supabase-js";

let client;

export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("lib/supabaseServer.js must never run in the browser.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing server env vars. .env.local needs NEXT_PUBLIC_SUPABASE_URL " +
        "and SUPABASE_SERVICE_ROLE_KEY (server-only, never NEXT_PUBLIC_)."
    );
  }

  if (!client) {
    // The service role key bypasses Row Level Security — server-side only.
    client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
