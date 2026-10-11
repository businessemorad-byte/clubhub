"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#313338] border border-[#3f4147] rounded-lg p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#5865f2] text-white mb-3 shadow-lg shadow-[#5865f2]/30">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back!</h1>
        <p className="text-sm text-[#949ba4] mt-1">
          We&apos;re so excited to see you again!
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="member@club.org"
            className="w-full px-3 py-2.5 bg-[#1e1f22] border border-[#232428] rounded text-[#dbdee1] focus:outline-none focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-3 py-2.5 bg-[#1e1f22] border border-[#232428] rounded text-[#dbdee1] focus:outline-none focus:border-[#5865f2] focus:ring-1 focus:ring-[#5865f2] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      <div className="mt-6 text-sm text-[#949ba4] text-center">
        Need an account?{" "}
        <Link
          href="/signup"
          className="text-[#00a8fc] hover:underline font-medium"
        >
          Register with invite code
        </Link>
      </div>
    </div>
  );
}
