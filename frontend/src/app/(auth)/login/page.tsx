"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"admin" | "student" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    const rawUser = localStorage.getItem("ganesha_user");

    if (token && rawUser) {
      try {
        const storedUser = JSON.parse(rawUser) as { role?: string };
        if (storedUser.role === "admin") {
          router.replace("/dashboard");
        } else if (storedUser.role === "student") {
          router.replace("/repository");
        }
      } catch {
        // Ignore malformed session data and keep the login chooser visible.
      }
    }
  }, [router]);

  const handleLogin = (role: "admin" | "student") => {
    setLoading(role);
    if (role === "admin") {
      router.push("/admin-login");
    } else {
      router.push("/student-login");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
            <GraduationCap className="text-zinc-900" size={28} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-zinc-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Ganesha Repository • Institut Teknologi Bandung
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 sm:rounded-2xl sm:px-10">
          <div className="space-y-4">
            {/* Student Option */}
            <button
              onClick={() => handleLogin("student")}
              disabled={loading !== null}
              className="w-full relative flex items-center p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all group text-left"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-zinc-900">Student</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Access repository and join webinars</p>
              </div>
              {loading === "student" ? (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
              ) : (
                <ArrowRight size={18} className="text-zinc-300 group-hover:text-zinc-600 transition-colors group-hover:translate-x-0.5" />
              )}
            </button>

            {/* Admin Option */}
            <button
              onClick={() => handleLogin("admin")}
              disabled={loading !== null}
              className="w-full relative flex items-center p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all group text-left"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 group-hover:bg-zinc-200 transition-colors">
                <ShieldCheck size={20} className="text-zinc-700" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-zinc-900">Admin (Pengurus Angkatan)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Manage documents and rooms</p>
              </div>
              {loading === "admin" ? (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
              ) : (
                <ArrowRight size={18} className="text-zinc-300 group-hover:text-zinc-600 transition-colors group-hover:translate-x-0.5" />
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              &larr; Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
