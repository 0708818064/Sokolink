"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Navigation,
  ShieldCheck,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react";

export default function RiderLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.role === "DELIVERY" || res.role === "ADMIN") {
        window.location.href = "/delivery/dashboard";
      } else {
        setError("Account not registered as an authorized delivery courier. Please sign in with courier credentials.");
      }
    } else {
      setError(res.error || "Invalid courier credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-md w-full space-y-6">
        {/* Navigation / Header badge */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3 text-blue-600" />
            COURIER_DISPATCH_PORTAL
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-slate-900 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-600/20 border border-blue-500/30">
            <Truck className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Courier Dispatch Login
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Sign in to accept assigned deliveries, access GPS pickup coordinates, and complete buyer OTP handovers.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleRiderLogin}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Registered Courier Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@sokolink.co.ke"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Courier Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            {loading ? "Authenticating Courier..." : "Sign In to Dispatch Board"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              OTP Verification Enforced
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Headphones className="w-3 h-3 text-slate-400" />
              Dispatch: 0700 000 000
            </span>
          </div>
        </form>

        <div className="text-center text-xs text-slate-400">
          Not yet onboarding as a SokoLink courier?{" "}
          <Link href="/register?role=DELIVERY" className="text-blue-600 hover:underline font-semibold">
            Apply to Join Fleet
          </Link>
        </div>
      </div>
    </div>
  );
}
