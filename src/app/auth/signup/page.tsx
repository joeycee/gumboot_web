"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";

type SignupIntent = "poster" | "tasker";

export default function SignupPage() {
  const router = useRouter();

  const [intent, setIntent] = useState<SignupIntent>("poster");
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    country_code: "+64",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await signup(form);

      router.push(
        `/auth/verify-otp?phone=${encodeURIComponent(form.phone)}&country_code=${encodeURIComponent(
          form.country_code
        )}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const intentCopy =
    intent === "poster"
      ? "You're setting up a hirer account to post jobs and compare offers."
      : "You're setting up a tasker account to receive nearby job opportunities.";

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Gumboot</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Book trusted local help in minutes.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-neutral-300">
            Post a task, review quotes, and pick the right person for the job with secure payment and verified
            profiles.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-xs text-neutral-400">Tasks completed</p>
              <p className="mt-1 text-lg font-semibold">12k+</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-xs text-neutral-400">Avg. response</p>
              <p className="mt-1 text-lg font-semibold">8 min</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-xs text-neutral-400">Verified members</p>
              <p className="mt-1 text-lg font-semibold">98%</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="mt-1 text-sm text-neutral-400">Start with your phone number and verify with a one-time code.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              type="button"
              onClick={() => setIntent("poster")}
              className={`rounded-md px-3 py-2 text-sm transition ${
                intent === "poster"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              I need help
            </button>
            <button
              type="button"
              onClick={() => setIntent("tasker")}
              className={`rounded-md px-3 py-2 text-sm transition ${
                intent === "tasker"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              I want work
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-400">{intentCopy}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {error && <div className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div>}

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="First name"
                className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2"
                value={form.firstname}
                onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                required
              />
              <input
                placeholder="Last name"
                className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2"
                value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                required
              />
            </div>

            <input
              placeholder="Email"
              type="email"
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="flex gap-2">
              <input
                className="w-20 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2"
                value={form.country_code}
                onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                inputMode="tel"
              />
              <input
                placeholder="Phone number"
                className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="tel"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>

          <p className="mt-4 text-xs text-neutral-500">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
          <p className="mt-3 text-sm text-neutral-300">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-white underline underline-offset-2">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
