"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";

type AuthFormPageProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthFormPage({ mode }: AuthFormPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    mode === "sign-up" ? "Create your account to start tracking flights." : "Sign in to continue.",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseEnv) {
      setMessage("Add Supabase env vars before using authentication.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setPending(true);
    setMessage(mode === "sign-up" ? "Creating your account..." : "Signing you in...");

    const response =
      mode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setPending(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    if (mode === "sign-up") {
      setMessage("Account created. Check your email if confirmation is enabled.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-page__card">
        <div className="auth-page__header">
          <p className="eyebrow">account</p>
          <h1>{mode}</h1>
          <p className="auth-page__copy">
            {mode === "sign-up"
              ? "Create an account with email and password."
              : "Sign in with the account you already created."}
          </p>
        </div>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="auth-page__submit" disabled={pending}>
            {pending ? "working..." : mode}
          </button>
        </form>

        <p className="auth-page__message">{message}</p>

        <div className="auth-page__footer">
          <Link href="/">back home</Link>
          {mode === "sign-in" ? <Link href="/sign-up">need an account?</Link> : <Link href="/sign-in">already have one?</Link>}
        </div>
      </section>
    </main>
  );
}

