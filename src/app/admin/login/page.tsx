"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Please enter a valid email and password.",
  invalid_credentials: "Incorrect email or password.",
};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <h1 className="font-display mb-1 text-2xl text-brand-900">Admin sign in</h1>
        <p className="mb-5 text-sm text-foreground/60">Bloom Nail Studio management</p>

        <label className="mb-1 block text-sm font-medium text-foreground/80">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2.5"
        />

        <label className="mb-1 block text-sm font-medium text-foreground/80">Password</label>
        <input
          type="password"
          name="password"
          required
          className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2.5"
        />

        {state?.error && (
          <p className="mb-4 text-sm text-red-600">
            {ERROR_MESSAGES[state.error] ?? "Something went wrong."}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
