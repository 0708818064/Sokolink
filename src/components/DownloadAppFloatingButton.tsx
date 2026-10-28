"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Download,
  X,
  QrCode,
  Terminal,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export function DownloadAppFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const adbCommand = "adb install -r sokolink.apk";

  const handleCopyAdb = () => {
    navigator.clipboard.writeText(adbCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Action Button (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 hover:from-emerald-700 hover:to-slate-950 text-white rounded-full shadow-2xl shadow-emerald-900/40 border border-emerald-400/40 transition-all duration-300 hover:scale-105 cursor-pointer"
          aria-label="Download SokoLink Android App"
        >
          {/* Pulsing online badge */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>

          <Smartphone className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black tracking-wide pr-1">Get Android App</span>
          <span className="hidden sm:inline-block bg-white/20 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full">
            APK
          </span>
        </button>
      </div>

      {/* Download Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>SokoLink Android App</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      v1.0.0
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For Kenyan Buyers, SME Sellers &amp; Couriers
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct APK Download Banner */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 rounded-2xl p-5 border border-emerald-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Direct Download
                </span>
                <span className="text-[11px] text-slate-500 font-mono">ARM64 &bull; Universal APK</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Download the standalone Android package directly to your phone. Compatible with Android 8.0 through Android 15+.
              </p>

              <a
                href="/downloads/sokolink.apk"
                download="sokolink.apk"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download SokoLink APK (Direct)</span>
              </a>
            </div>

            {/* Installation Method Options */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Installation Instructions for Phone
              </h3>

              {/* Option A: Phone Browser via Wi-Fi */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  <span>Install via Phone Browser (Same Wi-Fi)</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-7">
                  Open Chrome on your phone and browse to:
                </p>
                <div className="pl-7 pt-1">
                  <code className="text-[11px] font-mono bg-white px-2.5 py-1 rounded border border-slate-300 text-emerald-800 font-bold block truncate">
                    http://10.202.146.182:3000/downloads/sokolink.apk
                  </code>
                </div>
              </div>

              {/* Option B: ADB Command Line */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  <span>Developer Command (USB Debugging / ADB)</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px]">
                  <span>{adbCommand}</span>
                  <button
                    onClick={handleCopyAdb}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trust and Features Footer */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified &bull; Malware-Free
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-4 h-4 text-amber-500" />
                Instant Push Notifications
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
