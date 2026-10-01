// Server-only Supabase client for AUTH.
// It reads the signed-in user from the login cookie using the PUBLIC anon
// key — it NEVER uses the service-role key.
// Only server code may import this: app/api/orders/route.js and
// app/auth/callback/route.js.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSupabaseServerAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. .env.local needs " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  // In Next.js 15+ cookies() is async.
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // This runs from a Server Component, where cookies are read-only.
          // The /auth/callback route handler is what actually saves them.
        }
      },
    },
  });
}

// Returns the signed-in user, or null for guests.
// getUser() verifies the session with Supabase Auth, so the browser cannot
// fake it by sending its own id.
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerAuth();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
