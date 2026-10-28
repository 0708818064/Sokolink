"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "sme" ? "SME" : "CUSTOMER";

  const [role, setRole] = useState<"CUSTOMER" | "SME">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // SME Onboarding Specific
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [category, setCategory] = useState("Electronics & Gadgets");
  const [location, setLocation] = useState("Nairobi");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          phone,
          password,
          businessName: role === "SME" ? businessName : undefined,
          businessDescription: role === "SME" ? businessDescription : undefined,
          category: role === "SME" ? category : undefined,
          location: role === "SME" ? location : undefined,
          address: role === "SME" ? address : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account");
      }

      setSuccessMsg(data.message);
      setTimeout(() => {
        if (role === "SME") {
          window.location.href = "/sme/dashboard";
        } else {
          window.location.href = "/customer/dashboard";
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Create Your SokoLink Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Join Kenya&apos;s growing multi-vendor e-commerce marketplace
        </p>
      </div>

      {/* Role Picker */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setRole("CUSTOMER")}
          className={`p-4 rounded-xl border-2 flex items-center gap-3 transition cursor-pointer text-left ${
            role === "CUSTOMER"
              ? "border-emerald-600 bg-emerald-50/50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">I Want to Buy</span>
            <span className="text-[11px] text-slate-500">Customer account</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRole("SME")}
          className={`p-4 rounded-xl border-2 flex items-center gap-3 transition cursor-pointer text-left ${
            role === "SME"
              ? "border-emerald-600 bg-emerald-50/50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">I Want to Sell</span>
            <span className="text-[11px] text-slate-500">Kenyan SME Merchant</span>
          </div>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg} Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          {role === "SME" ? "SME Business Onboarding" : "Personal Details"}
        </h2>

        {/* Basic credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {role === "SME" ? "Owner Full Name *" : "Full Name *"}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. David Mwangi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="name@example.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Kenyan Phone (M-Pesa) *
            </label>
            <input
              type="tel"
              required
              placeholder="+254712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Account Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* SME Specific fields */}
        {role === "SME" && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Kenyan Business Information
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Registered Business / Trading Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nairobi Electronics Hub Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Business Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
              >
                <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
                <option value="Handmade Crafts & Gifts">Handmade Crafts &amp; Gifts</option>
                <option value="Fresh Groceries & Produce">Fresh Groceries &amp; Produce</option>
                <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                <option value="Home & Kitchenware">Home &amp; Kitchenware</option>
                <option value="Beauty & Personal Care">Beauty &amp; Personal Care</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Location (Town / County) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westlands, Nairobi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Physical Pickup Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarit Centre Maasai Market, Booth 14"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Short Business Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe your goods, artisan craftsmanship, or specialty..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer"
        >
          {loading ? "Creating Account..." : role === "SME" ? "Submit SME Registration" : "Register as Customer"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="pt-2 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-700 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading form...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
