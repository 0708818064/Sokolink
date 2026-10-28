import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  Smartphone,
  Truck,
  ShieldCheck,
  Store,
  ChevronDown,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      q: "How does payment via Safaricom M-Pesa work on SokoLink?",
      a: "When you reach the checkout page, enter your Safaricom mobile number. Once you click 'Place Order & Pay', an automated M-Pesa STK push prompt is sent to your handset. Enter your secret M-Pesa PIN, and the payment is confirmed instantly. Your money is held in escrow until your package is safely delivered.",
    },
    {
      q: "What is the 6-digit Delivery Verification Code (OTP)?",
      a: "For your security, whenever an order is placed, a unique 6-digit OTP code is generated and displayed on your Order Tracking page. When the courier rider arrives with your goods, verify that the items match your order and then share the code with the rider. The rider enters this code on their dashboard to complete the delivery and release payment.",
    },
    {
      q: "Can I order from multiple Kenyan SMEs in one shopping cart?",
      a: "Yes! SokoLink is a true multi-vendor platform. You can add electronics from Nairobi CBD, handmade crafts from Westlands, and farm produce from Limuru into one cart. The checkout system automatically creates fulfillment groups so each SME prepares their items, and courier fees are calculated transparently.",
    },
    {
      q: "How can I register my Kenyan SME to start selling?",
      a: "Click 'Start Selling' or go to the registration page and choose 'I Want to Sell'. Fill in your business name, location, category, and phone number. Once submitted, our platform administration team verifies your SME and activates your dashboard.",
    },
    {
      q: "What is the return and refund policy?",
      a: "If goods arrive damaged, defective, or do not match the seller's description, you can report the issue within 48 hours before the verification code is acknowledged. Our support team investigates and processes refunds directly back to your original M-Pesa account.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How Can We Help You?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Guides, frequently asked questions, and Kenyan market support for buyers, merchants, and delivery riders.
        </p>
      </div>

      {/* Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg w-fit">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">M-Pesa Payments</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Learn how the Daraja STK prompt operates, resolving timeouts, and instant transaction receipts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg w-fit">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Shipping &amp; Delivery</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dispatch timelines across Nairobi, motorbike couriers, tracking tokens, and OTP codes.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-lg w-fit">
            <Store className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Seller Onboarding</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Document verification, catalog listing, commissions, and weekly merchant payouts.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900 pb-3 border-b border-slate-100">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Channels */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Still Need Assistance?</h3>
          <p className="text-xs text-emerald-100">
            Our Nairobi customer support desk is available Monday through Saturday, 8:00 AM - 6:00 PM EAT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a
            href="mailto:support@sokolink.co.ke"
            className="px-4 py-2.5 bg-white text-slate-900 font-bold rounded-xl shadow-xs hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>Email Support</span>
          </a>
          <a
            href="tel:+254700000001"
            className="px-4 py-2.5 bg-emerald-950/60 text-white font-bold rounded-xl border border-white/20 hover:bg-emerald-950 transition flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call +254 700 000 001</span>
          </a>
        </div>
      </div>
    </div>
  );
}
