"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrencyKES } from "@/lib/utils";
import {
  ShieldCheck,
  Smartphone,
  Truck,
  ArrowRight,
  AlertCircle,
  Store,
} from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart, groupedBySeller } = useCart();
  const { user } = useAuth();

  // Form State
  const [recipientName, setRecipientName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [county, setCounty] = useState("Nairobi");
  const [subCounty, setSubCounty] = useState("");
  const [estateOrStreet, setEstateOrStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CASH_ON_DELIVERY">("MPESA");
  const [discountCode, setDiscountCode] = useState(searchParams.get("coupon") || "");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mpesaProcessing, setMpesaProcessing] = useState(false);

  const distinctSmeCount = Object.keys(groupedBySeller).length;
  const deliveryFee =
    deliveryOption === "EXPRESS"
      ? 450 + (distinctSmeCount - 1) * 150
      : 250 + (distinctSmeCount - 1) * 100;

  // Discount calculation
  let discountAmount = 0;
  if (discountCode.toUpperCase() === "KARIBU10" && subtotal >= 1500) {
    discountAmount = Math.min((subtotal * 10) / 100, 1000);
  } else if (discountCode.toUpperCase() === "SOKO500" && subtotal >= 3000) {
    discountAmount = 500;
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Auto populate user data when logged in
  useEffect(() => {
    if (user) {
      if (user.name) setRecipientName(user.name);
      if (user.email) setGuestEmail(user.email);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Your cart is empty</h1>
        <p className="text-slate-500 text-sm">Please add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push("/products")}
          className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Submit order to checkout endpoint
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          recipientName,
          phone,
          guestEmail,
          county,
          subCounty,
          estateOrStreet,
          landmark,
          deliveryOption,
          paymentMethod,
          discountCode: discountCode.trim() || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const { order } = data;

      // 2. If M-Pesa is selected, trigger STK Push
      if (paymentMethod === "MPESA") {
        setMpesaProcessing(true);
        const mpesaRes = await fetch("/api/payments/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            phone,
          }),
        });

        const mpesaData = await mpesaRes.json();
        if (!mpesaRes.ok) {
          console.warn("M-Pesa STK notification issue:", mpesaData.error);
        }
      }

      // Clear cart
      clearCart();

      // Redirect to Order Tracking screen
      router.push(`/track/${order.trackingToken}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during checkout";
      setError(message);
      setLoading(false);
      setMpesaProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete your delivery details and pay securely via Safaricom M-Pesa
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Delivery & Payment Details (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer & Delivery Address */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>1. Delivery Destination</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kenyan Mobile Number (M-Pesa) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  County *
                </label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="Nairobi">Nairobi</option>
                  <option value="Kiambu">Kiambu</option>
                  <option value="Machakos">Machakos</option>
                  <option value="Kajiado">Kajiado</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Uasin Gishu">Uasin Gishu (Eldoret)</option>
                  <option value="Kilifi">Kilifi</option>
                  <option value="Meru">Meru</option>
                  <option value="Nyeri">Nyeri</option>
                  <option value="Kisii">Kisii</option>
                  <option value="Other">Other County</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sub-County / Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westlands, Kilimani, Roysambu"
                  value={subCounty}
                  onChange={(e) => setSubCounty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Estate, Street &amp; House / Door Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silver Harbor Apts, Door 4B, Argwings Kodhek Rd"
                  value={estateOrStreet}
                  onChange={(e) => setEstateOrStreet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nearest Landmark / Rider Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Yaya Centre gate 2, ring doorbell"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Speed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>2. Delivery Speed</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  deliveryOption === "STANDARD"
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryOption"
                  value="STANDARD"
                  checked={deliveryOption === "STANDARD"}
                  onChange={() => setDeliveryOption("STANDARD")}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Standard Courier</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Delivered within 24-48 hours</span>
                  <span className="text-xs font-black text-emerald-800 block mt-1">KES 250</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  deliveryOption === "EXPRESS"
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryOption"
                  value="EXPRESS"
                  checked={deliveryOption === "EXPRESS"}
                  onChange={() => setDeliveryOption("EXPRESS")}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Same-Day Express Rider</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Dedicated motorbike dispatch</span>
                  <span className="text-xs font-black text-emerald-800 block mt-1">KES 450</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>3. Payment Method</span>
            </h2>

            <div className="space-y-3">
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  paymentMethod === "MPESA"
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MPESA"
                  checked={paymentMethod === "MPESA"}
                  onChange={() => setPaymentMethod("MPESA")}
                  className="mt-0.5 text-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Safaricom M-Pesa STK Push</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Instant Confirmation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    An automated payment request prompt will be triggered immediately to your phone {phone}. Enter your M-Pesa PIN to complete payment.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === "CASH_ON_DELIVERY"}
                  onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Pay on Delivery</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Pay via M-Pesa to courier rider upon doorstep arrival</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-vendor Review & Place Order Button (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Packages ({distinctSmeCount} {distinctSmeCount === 1 ? "SME" : "SMEs"})
            </h2>

            {/* List packages per SME */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {Object.entries(groupedBySeller).map(([sellerName, sellerItems]) => (
                <div key={sellerName} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-2">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{sellerName}</span>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    {sellerItems.map((item) => (
                      <div key={item.productId} className="flex justify-between">
                        <span className="truncate max-w-[200px]">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrencyKES(
                            (item.product.discountedPrice ?? item.product.price) * item.quantity
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrencyKES(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Courier Dispatch Fee</span>
                <span className="font-semibold text-slate-800">{formatCurrencyKES(deliveryFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({discountCode.toUpperCase()})</span>
                  <span>-{formatCurrencyKES(discountAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable</span>
                <span className="text-xl font-black text-emerald-800">{formatCurrencyKES(grandTotal)}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? (
                <span>{mpesaProcessing ? "Confirming M-Pesa STK..." : "Creating Order..."}</span>
              ) : (
                <>
                  <span>Place Order &amp; Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe &amp; secure escrow payment backed by SokoLink</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
