"use client";

import { useEffect, useState } from "react";

// Shows a friendly message after a failed or cancelled Google sign-in.
// The /auth/callback route redirects home with ?auth=cancelled or ?auth=error.
export default function AuthMessage() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get("auth");

    const text =
      auth === "cancelled"
        ? "Google sign-in was cancelled. You can keep shopping as a guest."
        : auth === "error"
        ? "Sorry, we could not sign you in. Please try again."
        : null;

    if (text) {
      // The query string can only be read in the browser, after mount.
      // This runs once, so setting state here is safe.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(text);

      // Tidy the address bar so the message does not come back on refresh.
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800"
    >
      {message}
    </div>
  );
}
