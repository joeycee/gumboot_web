"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { me, otpVerify, sendLoginOtp } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";

export default function VerifyOtpPage() {
  const params = useSearchParams();
  const router = useRouter();

  const phone = params.get("phone") ?? "";
  const countryCode = params.get("country_code") ?? "+64";
  const serviceSid =
    params.get("service_sid") ??
    process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID ??
    "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await otpVerify({
        phone,
        country_code: countryCode,
        otp,
        serviceSid: serviceSid || undefined,
        service_sid: serviceSid || undefined,
        service_id: serviceSid || undefined,
      });
      console.log("[auth] otpVerify response:", res);
      const token = res?.body?.userDetail?.token ?? res?.body?.token;
      if (token) {
        setAuthToken(token);
      }

      try {
        const profileRes = await me();
        console.log("[auth] profile response after verify:", profileRes);
      } catch (profileError) {
        console.warn("[auth] profile fetch after verify failed:", profileError);
      }

      router.push("/");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Invalid code";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      setError(null);
      await sendLoginOtp({ phone, country_code: countryCode });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to resend code";
      setError(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Security check</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Verify your phone number.</h1>
          <p className="mt-4 max-w-lg text-sm text-neutral-300">
            Enter the one-time code sent to your mobile to complete sign in and secure your account.
          </p>

          <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-xs text-neutral-400">Code sent to</p>
            <p className="mt-1 text-lg font-semibold">
              {countryCode} {phone}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold">Enter code</h2>
          <p className="mt-1 text-sm text-neutral-400">Use the 6-digit code from your SMS.</p>

          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <input
              placeholder="6-digit code"
              className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-center tracking-[0.35em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              required
            />

            <button
              disabled={loading}
              className="w-full rounded-md bg-white py-2 font-medium text-black disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify and continue"}
            </button>

            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="w-full rounded-md border border-neutral-800 py-2 text-sm hover:bg-neutral-900 disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend code"}
            </button>
          </form>

          <p className="mt-4 text-sm text-neutral-300">
            Wrong number?{" "}
            <Link href="/auth/login" className="text-white underline underline-offset-2">
              Go back
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
