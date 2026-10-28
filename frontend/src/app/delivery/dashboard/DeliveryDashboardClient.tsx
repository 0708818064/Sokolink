"use client";

import React, { useState } from "react";
import { formatCurrencyKES, formatDate } from "@/lib/utils";
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Store,
  DollarSign,
  Star,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";

interface DeliveryItem {
  id: string;
  deliveryReference: string;
  orderNumber: string;
  smeName: string;
  pickupAddress: string;
  dropoffAddress: string;
  recipientName: string;
  recipientPhone: string;
  fee: number;
  status: string;
  verificationCode?: string | null;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface DeliveryClientProps {
  rider: {
    name: string;
    vehiclePlate: string;
    vehicleType: string;
    rating: number;
    completedCount: number;
    totalEarnings: number;
    activeCount: number;
  };
  initialDeliveries: DeliveryItem[];
}

export function DeliveryDashboardClient({ rider, initialDeliveries }: DeliveryClientProps) {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(initialDeliveries);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // OTP Modal state for delivery confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    delivery: DeliveryItem | null;
  }>({ isOpen: false, delivery: null });

  const [enteredCode, setEnteredCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStatusUpdate = async (deliveryId: string, nextStatus: string, verificationCode?: string) => {
    setSubmitting(true);
    setOtpError("");

    try {
      const res = await fetch("/api/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId,
          status: nextStatus,
          verificationCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update delivery status");
      }

      // Update local state
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: nextStatus } : d))
      );

      if (confirmModal.isOpen) {
        setConfirmModal({ isOpen: false, delivery: null });
        setEnteredCode("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error updating status";
      setOtpError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeDeliveries = deliveries.filter(
    (d) => !["DELIVERED", "DELIVERY_FAILED", "RETURN_TO_SELLER"].includes(d.status)
  );

  const completedDeliveries = deliveries.filter((d) => d.status === "DELIVERED");

  return (
    <div className="space-y-8">
      {/* Rider Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{rider.name}</h1>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Active Courier
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Vehicle: <strong className="text-slate-800">{rider.vehicleType}</strong> ({rider.vehiclePlate}) &bull; Rating: ★ {rider.rating.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-right">
          <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Delivery Earnings</div>
          <div className="text-xl font-black text-emerald-800">{formatCurrencyKES(rider.totalEarnings)}</div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Tasks</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{activeDeliveries.length}</div>
          <p className="text-[11px] text-slate-500">In pickup or transit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Trips</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{completedDeliveries.length}</div>
          <p className="text-[11px] text-slate-500">Verified with customer OTP</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-current" />
          </div>
          <div className="text-2xl font-black text-slate-900">{rider.rating.toFixed(2)} / 5.0</div>
          <p className="text-[11px] text-slate-500">Based on doorstep feedback</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === "active" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Active Deliveries ({activeDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === "history" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Delivery History ({completedDeliveries.length})
        </button>
      </div>

      {/* Tab 1: Active Deliveries */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {activeDeliveries.length > 0 ? (
            activeDeliveries.map((del) => (
              <div
                key={del.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                      {del.deliveryReference}
                    </span>
                    <span className="text-xs text-slate-500">Order #{del.orderNumber}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Earnings: {formatCurrencyKES(del.fee)}
                    </span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase">
                      {del.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Pickup */}
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                    <div className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Step 1: Pick Up from SME Merchant</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{del.smeName}</div>
                    <div className="text-slate-600">{del.pickupAddress}</div>
                    <div className="pt-2 text-slate-500">
                      Package items: {del.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </div>
                  </div>

                  {/* Dropoff */}
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                    <div className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Step 2: Deliver to Customer</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{del.recipientName}</div>
                    <div className="text-slate-600">{del.dropoffAddress}</div>
                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={`tel:${del.recipientPhone}`}
                        className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Customer ({del.recipientPhone})
                      </a>
                    </div>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                  {del.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleStatusUpdate(del.id, "ACCEPTED")}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Acknowledge &amp; Accept Job
                    </button>
                  )}

                  {del.status === "ACCEPTED" && (
                    <button
                      onClick={() => handleStatusUpdate(del.id, "PICKED_UP")}
                      disabled={submitting}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Confirm Items Picked Up from SME
                    </button>
                  )}

                  {del.status === "PICKED_UP" && (
                    <button
                      onClick={() => handleStatusUpdate(del.id, "IN_TRANSIT")}
                      disabled={submitting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Depart &amp; Mark In Transit
                    </button>
                  )}

                  {del.status === "IN_TRANSIT" && (
                    <button
                      onClick={() => {
                        setEnteredCode("");
                        setOtpError("");
                        setConfirmModal({ isOpen: true, delivery: del });
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Delivery (Enter OTP Code)</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No active delivery assignments</h3>
              <p className="text-xs text-slate-400 mt-1">New orders placed by Kenyan customers will appear here automatically.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Delivery History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Delivery Ref</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Merchant</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Earnings</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {completedDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{del.deliveryReference}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{del.orderNumber}</td>
                    <td className="py-3.5 px-4">{del.smeName}</td>
                    <td className="py-3.5 px-4 font-medium">{del.recipientName}</td>
                    <td className="py-3.5 px-4 truncate max-w-[180px]">{del.dropoffAddress}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-800">{formatCurrencyKES(del.fee)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OTP Delivery Verification Code Modal */}
      {confirmModal.isOpen && confirmModal.delivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Proof of Delivery Handover
              </h3>
              <button
                onClick={() => setConfirmModal({ isOpen: false, delivery: null })}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ask the recipient <strong className="text-slate-900">{confirmModal.delivery.recipientName}</strong> for their 6-digit delivery code shown on their order tracking screen.
            </p>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Customer 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 123456"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full text-center font-mono text-2xl tracking-widest bg-slate-50 border border-slate-300 rounded-xl py-3 font-bold"
              />
              {confirmModal.delivery.verificationCode && (
                <p className="text-[11px] text-slate-400 text-center">
                  (Demo Hint for Tester: code is <code>{confirmModal.delivery.verificationCode}</code>)
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, delivery: null })}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || enteredCode.length < 6}
                onClick={() =>
                  handleStatusUpdate(confirmModal.delivery!.id, "DELIVERED", enteredCode)
                }
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {submitting ? "Verifying..." : "Confirm & Deliver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
