import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Smartphone, HeartHandshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800 mt-auto">
      {/* Value props banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Instant M-Pesa Checkout</h4>
              <p className="text-slate-400 text-xs mt-1">Direct Daraja STK push to your Safaricom line</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Dispatched by Verified Riders</h4>
              <p className="text-slate-400 text-xs mt-1">Real-time status tracking with secure delivery OTP</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Empowering Local SMEs</h4>
              <p className="text-slate-400 text-xs mt-1">Buy directly from verified Kenyan enterprises</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Buyer Protection</h4>
              <p className="text-slate-400 text-xs mt-1">Escrow payment release upon successful delivery</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <span className="text-2xl font-black text-white tracking-tight">
              Soko<span className="text-emerald-500">Link</span>
            </span>
            <p className="text-slate-400 text-xs mt-3 max-w-sm leading-relaxed">
              Kenya&apos;s leading multi-vendor marketplace connecting authentic Kenyan SMEs with customers and fast urban courier networks.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">HQ:</span> Nairobi, Kenya (Kilimani &amp; CBD)
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Customer Care</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/help" className="hover:text-emerald-400 transition">Help Center &amp; FAQs</Link></li>
              <li><Link href="/track/demo" className="hover:text-emerald-400 transition">Track an Order</Link></li>
              <li><Link href="/help#returns" className="hover:text-emerald-400 transition">Returns &amp; Refunds</Link></li>
              <li><Link href="/help#mpesa" className="hover:text-emerald-400 transition">M-Pesa Payment Guide</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Sell on SokoLink</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/register?role=sme" className="hover:text-emerald-400 transition">Register as SME Seller</Link></li>
              <li><Link href="/sme/dashboard" className="hover:text-emerald-400 transition">Seller Dashboard</Link></li>
              <li><Link href="/help#seller-policy" className="hover:text-emerald-400 transition">Seller Verification Policy</Link></li>
              <li><Link href="/help" className="hover:text-emerald-400 transition">Seller Support Guide</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal &amp; Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link></li>
              <li><Link href="/help#disputes" className="hover:text-emerald-400 transition">Dispute Resolution</Link></li>
              <li><Link href="/help" className="hover:text-emerald-400 transition">Platform Policies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 SokoLink Kenya Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium">Secured by: Safaricom M-Pesa Daraja</span>
            <span>•</span>
            <span className="text-slate-400 font-medium">PostgreSQL &amp; Prisma ORM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
