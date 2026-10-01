/* eslint-disable @next/next/no-img-element */
// A plain <img> is used for the Google avatar: the photo URL comes from
// Google at runtime, and next/image would need every host allow-listed.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

// Prefer the full name Google gives us; fall back to the email's first part.
function displayNameFor(user) {
  const metadata = user.user_metadata || {};
  if (metadata.full_name) return metadata.full_name;
  if (metadata.name) return metadata.name;
  return user.email ? user.email.split("@")[0] : "Account";
}

export default function Header() {
  const { count } = useCart();
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);

  // Ask Supabase who is signed in, then stay in sync when the user signs
  // in or out (the callback page and the sign-out button fire events).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    // Reading the session is async, so the state is set after it arrives,
    // not during this effect run.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Sends the browser to Google. On success we leave the page; only an
  // error brings us back, and a friendly message shows on the home page.
  const handleSignIn = async () => {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Google returns the user here with a one-time code.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      // A full page load is wanted here so the message banner remounts.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/?auth=error";
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setBusy(false);
    // Reload home so every part of the app forgets the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const name = user ? displayNameFor(user) : "";

  return (
    <header className="sticky top-0 z-10 border-b border-rose-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-rose-600 transition hover:text-rose-700"
        >
          Simi Stitches
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-rose-100"
                />
              ) : null}
              <span className="hidden max-w-[9rem] truncate text-sm text-gray-700 sm:inline">
                {name}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="rounded-full border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={busy}
              className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              Sign in
            </button>
          )}

          <Link
            href="/cart"
            aria-label={`Cart with ${count} ${count === 1 ? "item" : "items"}`}
            className="relative rounded-full p-2 text-gray-700 transition hover:bg-rose-50 hover:text-rose-600"
          >
            {/* Inline SVG cart icon — no icon library needed. */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
