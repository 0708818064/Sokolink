"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrencyKES } from "@/lib/utils";
import {
  X,
  Smartphone,
  MapPin,
  ShieldCheck,
  Truck,
  MessageSquare,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";

export interface QuickCheckoutProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  imageUrl?: string;
  smeName: string;
  smeId: string;
  location?: string | null;
}

interface HomeQuickCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickCheckoutProduct | null;
}

const KENYAN_COUNTIES = [
  "Nairobi",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Mombasa",
  "Nakuru",
  "Kisumu",
  "Uasin Gishu",
  "Kilifi",
  "Meru",
  "Nyeri",
  "Kisii",
  "Kakamega",
  "Other County",
];

export function HomeQuickCheckoutModal({
  isOpen,
  onClose,
  product,
}: HomeQuickCheckoutModalProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("Nairobi");
  const [subCounty, setSubCounty] = useState("");
  const [estateOrStreet, setEstateOrStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [riderInstructions, setRiderInstructions] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stkStatus, setStkStatus] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const unitPrice = product.discountedPrice ?? product.price;
  const itemsSubtotal = unitPrice * quantity;
  const deliveryFee = county === "Nairobi" ? 200 : 350;
  const totalAmount = itemsSubtotal + deliveryFee;

  const handleQuickCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recipientName.trim() || !phone.trim() || !subCounty.trim() || !estateOrStreet.trim()) {
      setError("Please complete all required delivery fields (Name, Phone, Sub-County, Street/House).");
      return;
    }

    setLoading(true);
    setStkStatus("Creating secure order...");

    try {
      // 1. Create order via checkout endpoint
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          county,
          subCounty: subCounty.trim(),
          estateOrStreet: estateOrStreet.trim(),
          landmark: landmark.trim() || undefined,
          notes: riderInstructions.trim() || undefined,
          deliveryOption: "STANDARD",
          paymentMethod: "MPESA",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process direct checkout");
      }

      const { order } = data;

      // 2. Trigger Safaricom Daraja STK Push
      setStkStatus("Sending M-Pesa STK push prompt to your phone...");
      try {
        await fetch("/api/payments/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            phone: phone.trim(),
          }),
        });
      } catch (stkErr) {
        console.warn("STK Push non-fatal trigger notice:", stkErr);
      }

      setStkStatus("Order placed! Redirecting to live tracking...");

      // 3. Redirect to live order tracking page
      setTimeout(() => {
        onClose();
        router.push(`/track/${order.trackingToken}`);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Direct checkout failed. Please try again.";
      setError(msg);
      setLoading(false);
      setStkStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Truck className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Quick Checkout &bull; Doorstep Delivery
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter your Kenyan drop-off location and pay directly via Safaricom M-Pesa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Product Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                Soko
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</div>
              <div className="text-[11px] text-slate-500">
                Sold by <strong className="text-slate-700">{product.smeName}</strong>
              </div>
              <div className="text-xs font-extrabold text-emerald-800 mt-0.5">
                {formatCurrencyKES(unitPrice)}
                {product.discountedPrice && product.discountedPrice < product.price && (
                  <span className="ml-1.5 text-[10px] text-slate-400 line-through font-normal">
                    {formatCurrencyKES(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              disabled={quantity <= 1 || loading}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-slate-800">{quantity}</span>
            <button
              type="button"
              disabled={quantity >= product.stock || loading}
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Checkout Form */}
        <form onSubmit={handleQuickCheckout} className="space-y-3.5 text-xs">
          {/* Section: Buyer Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. Brian Otieno"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                <span>M-Pesa Mobile Number *</span>
                <span className="text-[10px] text-emerald-700 font-bold">STK Push</span>
              </label>
              <input
                type="tel"
                required
                disabled={loading}
                placeholder="0712345678 or 254..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section: Kenyan Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Delivery County *
              </label>
              <select
                disabled={loading}
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c} {c === "Nairobi" ? "(KES 200 delivery)" : "(KES 350 delivery)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Sub-County / Area / Town *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. Westlands, Kilimani, Roysambu"
                value={subCounty}
                onChange={(e) => setSubCounty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Estate, Street &amp; Building / House / Door No. *
            </label>
            <input
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Silver Harbor Apts, Floor 3 Door 4B, Argwings Kodhek Rd"
              value={estateOrStreet}
              onChange={(e) => setEstateOrStreet(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nearest Landmark (Optional)
              </label>
              <input
                type="text"
                disabled={loading}
                placeholder="e.g. Opposite Shell petrol station"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Rider Drop-off Instructions (Optional)
              </label>
              <input
                type="text"
                disabled={loading}
                placeholder="e.g. Call when at the gate"
                value={riderInstructions}
                onChange={(e) => setRiderInstructions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Pricing & Fee Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-slate-600 text-xs">
              <span>Items Total ({quantity} {quantity === 1 ? "unit" : "units"})</span>
              <span className="font-bold text-slate-900">{formatCurrencyKES(itemsSubtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 text-xs">
              <span>Courier Delivery Fee ({county})</span>
              <span className="font-bold text-slate-900">{formatCurrencyKES(deliveryFee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Total Due (M-Pesa)</span>
              <span className="text-base font-black text-emerald-800">
                {formatCurrencyKES(totalAmount)}
              </span>
            </div>
          </div>

          {/* SMS & Escrow Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-900">
              <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Instant SMS alert when seller assigns courier</span>
            </div>
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Funds escrowed until OTP delivery check</span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-xs sm:text-sm cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{stkStatus || "Processing M-Pesa Order..."}</span>
              </span>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Confirm &amp; Pay {formatCurrencyKES(totalAmount)} via M-Pesa</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
