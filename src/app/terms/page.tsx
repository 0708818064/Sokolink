import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6 text-xs text-slate-600 leading-relaxed">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terms and Conditions</h1>
          <p className="text-xs text-slate-400 mt-1">Last Updated: October 2026 &bull; SokoLink Kenya Ltd</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the SokoLink marketplace platform, you agree to be bound by these Terms of Service. SokoLink acts as a multi-vendor platform facilitating transactions between independent Kenyan Small and Medium Enterprises (SMEs), customers, and delivery couriers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">2. SME Merchant Obligations</h2>
          <p>
            SME business owners represent and warrant that all listed goods are genuine, legally owned, accurately represented in photography and descriptions, and conform to the standards of the Kenya Bureau of Standards (KEBS) where applicable. Sellers may not list counterfeit or prohibited goods.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">3. M-Pesa Payments &amp; Escrow Release</h2>
          <p>
            Payments are initiated via the Safaricom M-Pesa Daraja payment gateway. Customer funds are held by SokoLink in escrow until the customer or authorized representative releases the 6-digit Delivery Verification Code to the delivery personnel upon inspection and delivery.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">4. Courier &amp; Delivery Services</h2>
          <p>
            Courier personnel are independent or contracted logistics providers. Couriers are prohibited from releasing parcels without obtaining the correct 6-digit OTP verification code from the customer.
          </p>
        </section>
      </div>
    </div>
  );
}
