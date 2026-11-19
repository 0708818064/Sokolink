"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Lock,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Check,
  Sparkles,
} from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "sme" ? "SME" : "CUSTOMER";

  const [role, setRole] = useState<"CUSTOMER" | "SME">(initialRole);

  // Multi-step wizard state for SME onboarding
  const [smeStep, setSmeStep] = useState<1 | 2 | 3>(1);

  // Common account fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // SME Step 1 & 2: Business Profile
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [category, setCategory] = useState("Electronics & Gadgets");
  const [location, setLocation] = useState("Nairobi");
  const [address, setAddress] = useState("");

  // SME Step 3: KYC & Regulatory Compliance
  const [idType, setIdType] = useState<"NATIONAL_ID" | "PASSPORT" | "ALIEN_ID">("NATIONAL_ID");
  const [idNumber, setIdNumber] = useState("");
  const [taxPin, setTaxPin] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [mpesaPayoutNumber, setMpesaPayoutNumber] = useState("");
  const [idDocUrl, setIdDocUrl] = useState("");
  const [kraPinDocUrl, setKraPinDocUrl] = useState("");
  const [businessPermitUrl, setBusinessPermitUrl] = useState("");
  const [kycConsent, setKycConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (smeStep === 1) {
      if (!name || !email || !phone || !password) {
        setError("Please complete all personal and security details.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      setSmeStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (smeStep === 2) {
      if (!businessName || !category || !location) {
        setError("Please provide your business name, trade category, and operating location.");
        return;
      }
      setSmeStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "SME" && !kycConsent) {
      setError("Please confirm that all KYC documents and business information provided are authentic.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        name,
        email,
        phone,
        password,
        ...(role === "SME"
          ? {
              businessName,
              businessDescription,
              category,
              location,
              address: address || location,
              // KYC Compliance Payload
              idType,
              idNumber: idNumber || null,
              taxPin: taxPin ? taxPin.toUpperCase().trim() : null,
              registrationNumber: registrationNumber || null,
              mpesaPayoutNumber: mpesaPayoutNumber || phone,
              idDocUrl: idDocUrl || null,
              kraPinDocUrl: kraPinDocUrl || null,
              businessPermitUrl: businessPermitUrl || null,
            }
          : {}),
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account");
      }

      setSuccessMsg(
        role === "SME"
          ? "Merchant application submitted with KYC verification! Redirecting to seller portal..."
          : "Welcome to SokoLink! Setting up your shopper account..."
      );

      const redirectUrl = searchParams.get("redirect");
      setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (role === "SME") {
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
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Official Kenyan Digital Commerce Platform</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Join the <span className="text-emerald-700">SokoLink</span> Ecosystem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Connect directly with verified local Kenyan SMEs, pay securely via Safaricom M-Pesa escrow, or register your enterprise.
        </p>
      </div>

      {/* Role Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            setRole("CUSTOMER");
            setError("");
          }}
          className={`p-4 rounded-2xl border-2 transition text-left cursor-pointer flex items-start gap-4 ${
            role === "CUSTOMER"
              ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              role === "CUSTOMER" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Shopper / Customer</span>
              {role === "CUSTOMER" && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse products, pay via M-Pesa, and receive tracked deliveries.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole("SME");
            setError("");
          }}
          className={`p-4 rounded-2xl border-2 transition text-left cursor-pointer flex items-start gap-4 ${
            role === "SME"
              ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              role === "SME" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Store className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Kenyan SME Seller</span>
              {role === "SME" && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sell products across Kenya with automated M-Pesa payouts.
            </p>
          </div>
        </button>
      </div>

      {/* SME Multi-Step Indicator */}
      {role === "SME" && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  smeStep >= 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                1
              </div>
              <span className={`text-xs font-bold ${smeStep >= 1 ? "text-slate-900" : "text-slate-400"}`}>
                Account
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${smeStep >= 2 ? "bg-emerald-500" : "bg-slate-200"}`} />

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  smeStep >= 2 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                2
              </div>
              <span className={`text-xs font-bold ${smeStep >= 2 ? "text-slate-900" : "text-slate-400"}`}>
                Business
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${smeStep >= 3 ? "bg-emerald-500" : "bg-slate-200"}`} />

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  smeStep >= 3 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                3
              </div>
              <span className={`text-xs font-bold ${smeStep >= 3 ? "text-slate-900" : "text-slate-400"}`}>
                KYC Verification
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* CUSTOMER REGISTRATION FORM */}
      {/* ============================================================== */}
      {role === "CUSTOMER" && (
        <form
          onSubmit={handleRegister}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Account Credentials</h2>
              <p className="text-xs text-slate-400">Shop securely from verified Kenyan merchants</p>
            </div>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <User className="w-5 h-5" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Wanjiku Kimani"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Kenyan Mobile Phone *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+254 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@domain.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Password *</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Creating your account...</span>
            ) : (
              <>
                <span>Complete Customer Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ============================================================== */}
      {/* SME MULTI-STEP SELLER ONBOARDING & KYC APPLICATION */}
      {/* ============================================================== */}
      {role === "SME" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* STEP 1: ACCOUNT CREDENTIALS */}
          {smeStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 1: Business Representative &amp; Login</h2>
                  <p className="text-xs text-slate-400">Primary administrator details for your store portal</p>
                </div>
                <span className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                  <User className="w-5 h-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Authorized Director / Owner *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Official Kenyan Mobile *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+254 712 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Business Contact Email *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="orders@yourbusiness.co.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Portal Security Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Business Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ENTERPRISE & STORE PROFILE */}
          {smeStep === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 2: Kenyan Enterprise Profile</h2>
                  <p className="text-xs text-slate-400">Public store information displayed to customers</p>
                </div>
                <span className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Registered Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Limuru Fresh Organics Ltd"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Industry Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition cursor-pointer"
                  >
                    <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
                    <option value="Handmade Crafts & Art">Handmade Crafts &amp; Art</option>
                    <option value="Agro & Fresh Farm Produce">Agro &amp; Fresh Farm Produce</option>
                    <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                    <option value="Home & Living">Home &amp; Living</option>
                    <option value="Beauty & Wellness">Beauty &amp; Wellness</option>
                    <option value="General Merchandise">General Merchandise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">County / City Hub *</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition cursor-pointer"
                  >
                    <option value="Nairobi">Nairobi County</option>
                    <option value="Kiambu">Kiambu County</option>
                    <option value="Mombasa">Mombasa County</option>
                    <option value="Nakuru">Nakuru County</option>
                    <option value="Kisumu">Kisumu County</option>
                    <option value="Machakos">Machakos County</option>
                    <option value="Kajiado">Kajiado County</option>
                    <option value="Uasin Gishu">Uasin Gishu (Eldoret)</option>
                    <option value="Nyeri">Nyeri County</option>
                    <option value="Kilifi">Kilifi County</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Physical Pickup / Shop Address *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Biashara St, Corner Hse, 3rd Flr"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Business Bio / Brand Overview</label>
                <textarea
                  rows={3}
                  placeholder="Tell shoppers about your authentic Kenyan products, story, and quality commitment..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSmeStep(1)}
                  className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to KYC Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: KYC COMPLIANCE & VERIFICATION */}
          {smeStep === 3 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 3: KYC Compliance &amp; Settlement Setup</h2>
                  <p className="text-xs text-slate-400">
                    Mandatory verification required before listing products for sale
                  </p>
                </div>
                <span className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>

              {/* Regulatory Notice Banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <span className="font-bold block">Kenyan Trade &amp; Consumer Protection Compliance</span>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    To maintain high buyer trust and eliminate counterfeit listings, all SokoLink sellers must provide verifiable business identification. Listings remain protected until verified by admin.
                  </p>
                </div>
              </div>

              {/* ID Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Document Type *</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as "NATIONAL_ID" | "PASSPORT" | "ALIEN_ID")}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition cursor-pointer"
                  >
                    <option value="NATIONAL_ID">Kenyan National ID</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="ALIEN_ID">Alien ID / Work Permit</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">ID / Passport Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12345678"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition font-mono"
                  />
                </div>
              </div>

              {/* KRA PIN & Business Reg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">KRA Tax PIN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P051234567X"
                    value={taxPin}
                    onChange={(e) => setTaxPin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Standard 11-character KRA PIN</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Business / BN / PVT Reg Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BN-2024/0987 or PVT-XY123"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">From BRS / eCitizen certificate</span>
                </div>
              </div>

              {/* Payout Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>M-Pesa Payout &amp; Settlement Account</span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Settlement Phone / Till / Paybill Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +254 712 345 678 or Till 654321"
                    value={mpesaPayoutNumber}
                    onChange={(e) => setMpesaPayoutNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Sales revenue from fulfilled orders will be disbursed directly to this account via M-Pesa B2C
                  </span>
                </div>
              </div>

              {/* Document URLs / Verification links */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-slate-700 block">Verification Document Links (Optional at Signup)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <input
                      type="url"
                      placeholder="ID / Passport Document Link (Google Drive / Cloud)"
                      value={idDocUrl}
                      onChange={(e) => setIdDocUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="KRA PIN Certificate Document Link"
                      value={kraPinDocUrl}
                      onChange={(e) => setKraPinDocUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Tip: You can also upload or update document scans anytime inside your seller dashboard after registration.
                </p>
              </div>

              {/* KYC Declaration Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/60 transition">
                  <input
                    type="checkbox"
                    checked={kycConsent}
                    onChange={(e) => setKycConsent(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    I declare that I am authorized to represent this enterprise and certify under the Laws of Kenya that all identification, KRA PIN, and business information provided are accurate.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSmeStep(2)}
                  className="px-5 py-3.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Submitting KYC Application...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Seller Application &amp; KYC</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="text-center text-xs text-slate-500 pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
          Sign In Here
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-12 text-center text-xs text-slate-400">
          Loading SokoLink registration...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
