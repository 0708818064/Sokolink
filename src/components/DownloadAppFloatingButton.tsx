"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Download,
  X,
  Sparkles,
  ArrowUpCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface AppVersionInfo {
  latestVersion: string;
  latestVersionCode: number;
  minSupportedVersion?: string;
  downloadUrl: string;
  apkFileName: string;
  releasedAt: string;
  releaseNotes: string[];
}

// Semver comparison helper (returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
function compareSemver(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = v2.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function DownloadAppFloatingButton() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("sokolink_update_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }

    const checkAppVersion = async () => {
      try {
        const res = await fetch("/api/app/version");
        if (!res.ok) return;
        const data: AppVersionInfo = await res.json();
        setVersionInfo(data);

        if (typeof window === "undefined") return;

        // 1. Detect if running inside SokoLink Android WebView
        // MainActivity sets: settings.setUserAgentString(... + " SokoLinkAndroid/1.0");
        const ua = navigator.userAgent || "";
        const uaMatch = ua.match(/SokoLinkAndroid\/([0-9.]+)/i);

        // 2. Or check for query param (e.g. ?app_version=1.0.0 or ?test_update=1)
        const params = new URLSearchParams(window.location.search);
        const queryVersion = params.get("app_version");
        const forceUpdate = params.get("test_update") === "1" || params.get("update") === "1";

        // 3. Or check localStorage
        const storedVersion = localStorage.getItem("sokolink_app_version");

        const detected = uaMatch ? uaMatch[1] : queryVersion || storedVersion;

        if (forceUpdate) {
          setHasUpdate(true);
          setInstalledVersion(detected || "1.0.0");
          return;
        }

        if (detected) {
          setInstalledVersion(detected);
          // Compare detected app version with server's latest version
          if (compareSemver(data.latestVersion, detected) > 0) {
            setHasUpdate(true);
          } else {
            setHasUpdate(false);
          }
        } else {
          // If not running in Android App and no version override, do not float
          setHasUpdate(false);
        }
      } catch {
        // Silently ignore if offline
      }
    };

    checkAppVersion();
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sokolink_update_dismissed", "true");
    }
  };

  // Only float when an update is available and not dismissed
  if (!hasUpdate || isDismissed) {
    return null;
  }

  const latestVer = versionInfo?.latestVersion || "1.1.0";
  const downloadUrl = versionInfo?.downloadUrl || "/downloads/sokolink.apk";

  return (
    <>
      {/* Floating Action Button (Only visible on update) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative group flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 hover:from-emerald-700 hover:to-slate-950 text-white rounded-full shadow-2xl shadow-emerald-900/50 border border-emerald-400/50 transition-all duration-300 hover:scale-105 cursor-pointer"
            aria-label="Update SokoLink App"
          >
            {/* Pulsing update beacon */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>

            <ArrowUpCircle className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black tracking-wide">Update App</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
              v{latestVer}
            </span>
          </button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            title="Dismiss update notice for this session"
            className="ml-1 p-1.5 text-slate-400 hover:text-slate-600 bg-white/80 hover:bg-white rounded-full shadow-xs border border-slate-200 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Update Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>SokoLink App Update</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      v{latestVer}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    A newer, faster version is available
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

            {/* Version Diff Pill */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Installed Version</span>
                <div className="font-mono font-bold text-slate-700">v{installedVersion || "1.0.0"}</div>
              </div>
              <div className="flex items-center text-slate-400">
                <RefreshCw className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-600 uppercase font-semibold">New Version</span>
                <div className="font-mono font-bold text-emerald-700">v{latestVer}</div>
              </div>
            </div>

            {/* Release Highlights */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                What&apos;s New in this Update
              </span>
              <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                {(
                  versionInfo?.releaseNotes || [
                    "Enhanced Seller KYC Compliance & National ID verification",
                    "Protected product posting and catalog security",
                    "Optimized courier rider dispatch workflows",
                    "Performance optimizations and critical stability fixes",
                  ]
                ).map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={downloadUrl}
                download="sokolink.apk"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download &amp; Install Update</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsDismissed(true);
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("sokolink_update_dismissed", "true");
                  }
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Remind me later
              </button>
            </div>

            {/* Security Badge */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official signed SokoLink Android package &bull; Safe &amp; verified</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
