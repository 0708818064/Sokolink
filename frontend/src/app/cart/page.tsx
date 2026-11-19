"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrencyKES } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Store,
  Tag,
  ShieldCheck,
  Check,
  X,
  UserCheck,
  UserPlus,
  LogIn,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, subtotal, groupedBySeller } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const sellerCount = Object.keys(groupedBySeller).length;
  // Estimated delivery: KES 250 base + 100 for each additional seller package
  const estimatedDelivery = sellerCount > 0 ? 250 + (sellerCount - 1) * 100 : 0;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();

    if (code === "KARIBU10") {
      if (subtotal < 1500) {
        setCouponError("KARIBU10 requires a minimum order of KES 1,500");
        return;
      }
      const disc = Math.min((subtotal * 10) / 100, 1000);
      setAppliedCoupon({ code, discount: disc });
    } else if (code === "SOKO500") {
      if (subtotal < 3000) {
        setCouponError("SOKO500 requires a minimum order of KES 3,000");
        return;
      }
      setAppliedCoupon({ code, discount: 500 });
    } else {
      setCouponError("Invalid coupon code. Try 'KARIBU10' or 'SOKO500'.");
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal + estimatedDelivery - discountAmount);

  const checkoutUrl = `/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`;

  const handleProceedToCheckout = () => {
    if (user) {
      router.push(checkoutUrl);
    } else {
      setShowAuthPrompt(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h1>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Explore products from Kenya&apos;s best SMEs and add items to your cart.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {items.length} items from {sellerCount} Kenyan SME {sellerCount === 1 ? "seller" : "sellers"}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
        >
          Clear Entire Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items Grouped by Seller (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {Object.entries(groupedBySeller).map(([sellerName, sellerItems]) => (
            <div
              key={sellerName}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Package from: {sellerName}</span>
                <span className="text-slate-400 font-normal ml-auto">
                  {sellerItems.length} {sellerItems.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {sellerItems.map((item) => {
                  const unitPrice = item.product.discountedPrice ?? item.product.price;
                  const itemTotal = unitPrice * item.quantity;

                  return (
                    <div
                      key={item.productId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {item.product.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Unit Price: {formatCurrencyKES(unitPrice)}
                            {item.product.discountedPrice && (
                              <span className="line-through text-slate-400 ml-1.5 text-[11px]">
                                {formatCurrencyKES(item.product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Item Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded transition text-slate-600 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 hover:bg-white rounded transition text-slate-600 disabled:opacity-30 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">
                            {formatCurrencyKES(itemTotal)}
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 mt-0.5 ml-auto cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 sticky top-20">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Breakdown
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrencyKES(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Estimated Courier Fee</span>
                <span className="font-semibold text-slate-800">{formatCurrencyKES(estimatedDelivery)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatCurrencyKES(discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable</span>
                <span className="text-xl font-black text-emerald-800">{formatCurrencyKES(grandTotal)}</span>
              </div>
            </div>

            {/* Coupon Box */}
            <form onSubmit={handleApplyCoupon} className="pt-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Have a Promo Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. KARIBU10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition shrink-0"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[11px] text-red-600 mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Coupon applied: {appliedCoupon.code}
                </p>
              )}
            </form>

            {/* Checkout CTA */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>M-Pesa STK Push enabled at checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500 shrink-0" />
                <span>SokoLink 100% money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Registration & Sign-In Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 space-y-5">
            <button
              onClick={() => setShowAuthPrompt(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Create an Account to Checkout
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Register as a buyer to save your delivery location, receive instant Safaricom M-Pesa STK prompts, and track your rider in real time.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href={`/register?role=customer&redirect=${encodeURIComponent(checkoutUrl)}`}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm text-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Buyer Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/login?redirect=${encodeURIComponent(checkoutUrl)}`}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs text-center"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Already Have an Account? Sign In</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href={checkoutUrl}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition"
              >
                Or continue as guest checkout &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
