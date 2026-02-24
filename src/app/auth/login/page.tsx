"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendLoginOtp } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState("+64");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await sendLoginOtp({ country_code: countryCode, phone });
      console.log("[login] sendLoginOtp response:", res);
      const serviceSid =
        res?.body?.serviceSid ??
        res?.body?.service_sid ??
        res?.body?.otp ??
        process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID;
      const serviceSidQuery = serviceSid
        ? `&service_sid=${encodeURIComponent(serviceSid)}`
        : "";

      router.push(
        `/auth/verify-otp?phone=${encodeURIComponent(phone)}&country_code=${encodeURIComponent(
          countryCode
        )}${serviceSidQuery}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Welcome back</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Continue where you left off.</h1>
          <p className="mt-4 max-w-lg text-sm text-neutral-300">
            Sign in with your phone number to access jobs, messages, payouts, and profile details.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-xs text-neutral-400">Active taskers</p>
              <p className="mt-1 text-lg font-semibold">4.2k+</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-xs text-neutral-400">Jobs posted</p>
              <p className="mt-1 text-lg font-semibold">12k+</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-xs text-neutral-400">Verified users</p>
              <p className="mt-1 text-lg font-semibold">98%</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold">Log in</h2>
          <p className="mt-1 text-sm text-neutral-400">Enter your phone number and we will send a one-time code.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <input
                className="w-20 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                inputMode="tel"
              />
              <input
                placeholder="Phone number"
                className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-md bg-white py-2 font-medium text-black disabled:opacity-50"
            >
              {loading ? "Sending code..." : "Send code"}
            </button>
          </form>

          <p className="mt-4 text-xs text-neutral-500">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>

          <p className="mt-3 text-sm text-neutral-300">
            New to Gumboot?{" "}
            <Link href="/auth/signup" className="text-white underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
