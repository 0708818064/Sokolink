"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrencyKES } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import {
  Star,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  MapPin,
  Store,
  Plus,
  Minus,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface ProductClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    sku: string;
    price: number;
    discountedPrice?: number | null;
    stock: number;
    condition?: string | null;
    weight?: number | null;
    dimensions?: string | null;
    location?: string | null;
    rating: number;
    reviewCount: number;
    category: { id: string; name: string; slug: string };
    sme: {
      id: string;
      businessName: string;
      businessSlug: string;
      location: string;
      address: string;
      phone: string;
      rating: number;
      ratingCount: number;
      productsCount?: number;
    };
    images: { url: string; altText?: string | null; isPrimary: boolean }[];
    reviews: {
      id: string;
      rating: number;
      comment: string | null;
      customerName: string;
      createdAt: string;
    }[];
  };
}

export function ProductDetailsClient({ product }: ProductClientProps) {
  const { addItem } = useCart();
  const router = useRouter();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const images = product.images.length > 0 ? product.images : [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", altText: product.name, isPrimary: true }];
  const currentPrice = product.discountedPrice ?? product.price;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountedPrice: product.discountedPrice,
        stock: product.stock,
        imageUrl: images[selectedImageIndex]?.url,
        smeId: product.sme.id,
        smeName: product.sme.businessName,
        smeSlug: product.sme.businessSlug,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountedPrice: product.discountedPrice,
        stock: product.stock,
        imageUrl: images[selectedImageIndex]?.url,
        smeId: product.sme.id,
        smeName: product.sme.businessName,
        smeSlug: product.sme.businessSlug,
      },
      quantity
    );
    router.push("/checkout");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Product Images (col-span-6) */}
      <div className="lg:col-span-6 space-y-4">
        <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[selectedImageIndex]?.url}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded shadow-md">
              SAVE {Math.round(((product.price - (product.discountedPrice || 0)) / product.price) * 100)}%
            </span>
          )}
        </div>

        {/* Thumbnail row */}
        {images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                  selectedImageIndex === idx ? "border-emerald-600 ring-2 ring-emerald-600/30" : "border-slate-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details & Actions (col-span-6) */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              {product.category.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            {product.condition && (
              <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {product.condition}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Ratings & reviews */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 font-bold text-slate-800 text-sm">{product.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{product.reviewCount} customer reviews</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {product.location || "Nairobi, Kenya"}
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-baseline gap-4">
          <div className="text-3xl font-black text-emerald-800">
            {formatCurrencyKES(currentPrice)}
          </div>
          {hasDiscount && (
            <div className="text-sm text-slate-400 line-through">
              {formatCurrencyKES(product.price)}
            </div>
          )}
          <span className="text-xs text-slate-500 ml-auto">VAT inclusive</span>
        </div>

        {/* Stock status */}
        <div>
          {product.stock > 0 ? (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>In Stock ({product.stock} units available)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Currently out of stock</span>
            </div>
          )}
        </div>

        {/* Quantity and Actions */}
        {product.stock > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleAddToCart}
                className={`py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  added
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        )}

        {/* SME Seller Info Box */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sold by</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified SME
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
              {product.sme.businessName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <Link
                href={`/sellers/${product.sme.businessSlug}`}
                className="font-bold text-slate-900 text-sm hover:text-emerald-700 hover:underline"
              >
                {product.sme.businessName}
              </Link>
              <div className="text-xs text-slate-500 mt-0.5">{product.sme.location}</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Rating: <strong className="text-slate-800">★ {product.sme.rating.toFixed(1)}</strong> ({product.sme.ratingCount} sales)</span>
            <Link
              href={`/sellers/${product.sme.businessSlug}`}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" /> View Storefront
            </Link>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Product Description</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}
