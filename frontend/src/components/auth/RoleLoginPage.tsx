"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Loader2, Mail, ArrowRight } from "lucide-react";

export type LoginRole = "student" | "admin";

type RoleLoginPageProps = {
  role: LoginRole;
  title: string;
  description: string;
  heroIcon: ReactNode;
  successRedirect: string;
  mismatchMessage: string;
};

export default function RoleLoginPage({
  role,
  title,
  description,
  heroIcon,
  successRedirect,
  mismatchMessage,
}: RoleLoginPageProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    const rawUser = localStorage.getItem("ganesha_user");

    if (token && rawUser) {
      try {
        const storedUser = JSON.parse(rawUser) as { role?: string };
        if (storedUser.role === "admin") {
          router.replace("/dashboard");
          return;
        }
        if (storedUser.role === "student") {
          router.replace("/repository");
          return;
        }
      } catch {
        // Fall through to the login form if the stored session is malformed.
      }
    }

    const params = new URLSearchParams(window.location.search);
    const loginError = params.get("error");
    if (!loginError) return;

    if (loginError === "forbidden") {
      setError(role === "admin" ? "Forbidden access. Please sign in with an admin account." : "Forbidden access. Please sign in with a student account.");
    } else if (loginError === "unauthorized") {
      setError("Please sign in to continue.");
    } else if (loginError === "invalid_token") {
      setError("Your session is invalid. Please sign in again.");
    }
  }, [role]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");

      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to verify OTP");

      // Redirect admin to dashboard, otherwise check for role mismatch
      let targetRedirect = successRedirect;
      if (data.user.role === "admin") {
        targetRedirect = "/dashboard";
      } else if (data.user.role !== role) {
        throw new Error(mismatchMessage);
      }

      localStorage.setItem("ganesha_token", data.access_token);
      localStorage.setItem("ganesha_user", JSON.stringify(data.user));
      document.cookie = `ganesha_token=${data.access_token}; path=/; max-age=604800; samesite=lax`;

      router.push(targetRedirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`w-12 h-12 rounded-xl ${role === "admin" ? "bg-zinc-900" : "bg-white border border-zinc-200"} flex items-center justify-center ${role === "admin" ? "shadow-lg" : "shadow-sm"}`}>
            {heroIcon}
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-zinc-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-zinc-600">{description}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 sm:rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 rounded-lg p-3 text-sm bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  ITB Email Address
                </label>
                <div className="mt-2 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail size={16} className="text-zinc-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@std.stei.itb.ac.id"
                    className="block w-full rounded-lg border-zinc-300 pl-10 py-2.5 text-zinc-900 shadow-sm focus:border-zinc-900 focus:ring-zinc-900 sm:text-sm border outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-lg bg-zinc-900 py-2.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-70"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-zinc-700">
                  Verification Code
                </label>
                <p className="text-xs text-zinc-500 mb-2 mt-1">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <div className="mt-1">
                  <input
                    id="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="block w-full rounded-lg border-zinc-300 py-2.5 px-3 text-zinc-900 shadow-sm focus:border-zinc-900 focus:ring-zinc-900 sm:text-lg text-center tracking-widest font-mono border outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="flex w-full justify-center items-center gap-2 rounded-lg bg-zinc-900 py-2.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-70"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Sign In"}
                {!loading && <ArrowRight size={16} />}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(null); }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
