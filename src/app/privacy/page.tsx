import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mt-1">
            Compliance with the Kenya Data Protection Act 2019 &bull; SokoLink Kenya Ltd
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">1. Information We Collect</h2>
          <p>
            We collect personal identification information including name, email address, Kenyan telephone number, delivery address (estate, sub-county, and landmarks), and business registration certificates for SME sellers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">2. M-Pesa Security &amp; Financial Information</h2>
          <p>
            SokoLink never requests, stores, or transmits your personal M-Pesa PIN, card CVV codes, or banking passwords. All payment transactions are completed within Safaricom&apos;s encrypted SIM Tool Kit / Daraja environment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800">3. Data Sharing with Couriers and Merchants</h2>
          <p>
            Delivery riders are provided only with the recipient&apos;s name, delivery street address, and phone number strictly for order fulfillment. Merchants only receive customer names and delivery instructions pertinent to packing the order.
          </p>
        </section>
      </div>
    </div>
  );
}
