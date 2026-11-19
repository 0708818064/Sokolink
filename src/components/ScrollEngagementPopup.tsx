"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Store, ShoppingBag, X, Sparkles, ArrowRight } from "lucide-react";

export function ScrollEngagementPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem("sokolink_popup_dismissed") === "true") {
        setDismissed(true);
      }
    } catch {
      // Ignore storage errors in private modes
    }

    const handleScroll = () => {
      if (dismissed) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Show when user has scrolled down past the top introductions (> 280px)
      if (scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem("sokolink_popup_dismissed", "true");
    } catch {
      // Ignore
    }
  };

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-emerald-500/30 backdrop-blur-md">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-6">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 mb-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Join Kenya&apos;s #1 SME Marketplace</span>
          </div>
          <h4 className="text-xs sm:text-sm font-black text-white tracking-tight">
            Sell your products here on SokoLink
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Expand your enterprise across Kenya with instant M-Pesa payouts, or register as a buyer for escrow protection.
          </p>
        </div>

        {/* Dual Actions: Seller & Buyer */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* Seller Action */}
          <Link
            href="/register?role=sme"
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition text-center"
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Seller Portal</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </Link>

          {/* Buyer Action */}
          <Link
            href="/register?role=customer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition text-center"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
            <span className="truncate">Buyer Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
