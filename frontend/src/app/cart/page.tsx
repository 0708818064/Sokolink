"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
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
} from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, groupedBySeller } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

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
              {/* Seller Header */}
              <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800 text-sm">{sellerName}</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                    SME Fulfillment Group
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {sellerItems.length} {sellerItems.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items in this group */}
              <div className="divide-y divide-slate-100">
                {sellerItems.map((item) => {
                  const unitPrice = item.product.discountedPrice ?? item.product.price;
                  const lineTotal = unitPrice * item.quantity;
                  const itemImg = item.product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80";

                  return (
                    <div key={item.productId} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={itemImg} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-bold text-slate-900 text-sm hover:text-emerald-700 line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <div className="text-xs text-emerald-800 font-extrabold mt-1">
                            {formatCurrencyKES(unitPrice)}
                          </div>
                          {item.product.stock <= 5 && (
                            <span className="text-[11px] text-amber-600 font-medium">
                              Only {item.product.stock} left in stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <div className="text-sm font-black text-slate-900">
                            {formatCurrencyKES(lineTotal)}
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            {/* Price lines */}
            <div className="space-y-3 text-xs">
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
            <Link
              href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

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
    </div>
  );
}
