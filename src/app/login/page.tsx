"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Store,
  User,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"CUSTOMER" | "SME">("CUSTOMER");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.role === "ADMIN") window.location.href = "/admin/dashboard";
      else if (res.role === "SME") window.location.href = "/sme/dashboard";
      else if (res.role === "DELIVERY") window.location.href = "/delivery/dashboard";
      else window.location.href = "/customer/dashboard";
    } else {
      setError(res.error || "Failed to sign in. Please verify your credentials.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mb-2 shadow-xs">
            {activeTab === "CUSTOMER" ? <User className="w-6 h-6" /> : <Store className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === "CUSTOMER" ? "Customer Sign In" : "SME Merchant Portal"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {activeTab === "CUSTOMER"
              ? "Access your purchases, tracking codes, and order history"
              : "Manage store listings, inventory levels, and order fulfillment"}
          </p>
        </div>

        {/* Account Type Selector */}
        <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("CUSTOMER");
              setError("");
            }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "CUSTOMER"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            Shopper / Customer
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("SME");
              setError("");
            }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "SME"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4 text-emerald-600" />
            SME Business Owner
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@company.co.ke"
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 transition outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Link href="/help#password-reset" className="text-[11px] text-emerald-700 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 transition outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Remember this session</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">7-day secure token</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to {activeTab === "CUSTOMER" ? "Customer Account" : "Seller Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Don&apos;t have an account yet?</span>
            <Link
              href={activeTab === "SME" ? "/register?role=sme" : "/register?role=customer"}
              className="text-emerald-700 font-bold hover:underline"
            >
              Register as {activeTab === "SME" ? "Merchant" : "Customer"} &rarr;
            </Link>
          </div>
        </form>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SokoLink Enterprise Security &bull; 256-Bit SSL Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
