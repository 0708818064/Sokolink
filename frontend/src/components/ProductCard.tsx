"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrencyKES } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { Star, ShoppingCart, Check, MapPin, Zap } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountedPrice?: number | null;
    stock: number;
    rating: number;
    reviewCount: number;
    location?: string | null;
    images?: { url: string; altText?: string | null }[];
    category?: { name: string; slug: string };
    sme?: {
      id: string;
      businessName: string;
      businessSlug: string;
      location?: string;
    };
  };
  onBuyNow?: (product: ProductCardProps["product"]) => void;
}

export function ProductCard({ product, onBuyNow }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const primaryImage =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

  const currentPrice = product.discountedPrice ?? product.price;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountedPrice: product.discountedPrice,
        stock: product.stock,
        imageUrl: primaryImage,
        smeId: product.sme?.id || "",
        smeName: product.sme?.businessName || "Kenyan SME",
        smeSlug: product.sme?.businessSlug || "",
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountedPrice: product.discountedPrice,
        stock: product.stock,
        imageUrl: primaryImage,
        smeId: product.sme?.id || "",
        smeName: product.sme?.businessName || "Kenyan SME",
        smeSlug: product.sme?.businessSlug || "",
      },
      1
    );

    if (onBuyNow) {
      onBuyNow(product);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
            SAVE {Math.round(((product.price - (product.discountedPrice || 0)) / product.price) * 100)}%
          </span>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
            Out of Stock
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & SME Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            {product.category && (
              <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                {product.category.name}
              </span>
            )}
            {product.location && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3" />
                {product.location}
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-semibold text-slate-900 hover:text-emerald-600 line-clamp-2 transition leading-snug"
          >
            {product.name}
          </Link>

          {/* Seller Store Link */}
          {product.sme && (
            <Link
              href={`/sellers/${product.sme.businessSlug}`}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline mt-1 block truncate"
            >
              by <span className="font-medium text-slate-700">{product.sme.businessName}</span>
            </Link>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 font-bold text-slate-800">{product.rating.toFixed(1)}</span>
            </div>
            <span>({product.reviewCount || 0} reviews)</span>
          </div>
        </div>

        {/* Pricing & Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-extrabold text-emerald-800">
                {formatCurrencyKES(currentPrice)}
              </div>
              {hasDiscount && (
                <div className="text-xs text-slate-400 line-through">
                  {formatCurrencyKES(product.price)}
                </div>
              )}
            </div>
            {product.stock <= 0 && (
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                Out of stock
              </span>
            )}
          </div>

          {/* Explicit "Add to Cart" and "Buy Now" Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                added
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : product.stock <= 0
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 hover:border-emerald-300"
              }`}
              title="Add product to shopping cart"
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              title="Buy now and take me straight to checkout"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
