// GET /auth/callback
// Google sends the user back here with a one-time code. We swap that code
// for a real session (saved in a cookie by the server client), then send
// the user to the home page.
import { NextResponse } from "next/server";
import { getSupabaseServerAuth } from "@/lib/supabaseServerAuth";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Google reports a problem here (for example the user pressed "Cancel").
  const oauthError = searchParams.get("error");

  if (oauthError || !code) {
    // Friendly message is shown by components/AuthMessage.js
    return NextResponse.redirect(`${origin}/?auth=cancelled`);
  }

  const supabase = await getSupabaseServerAuth();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  return NextResponse.redirect(`${origin}/`);
}
