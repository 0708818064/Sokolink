"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";

interface ProductItem {
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
}

interface HomeProductGridProps {
  products: ProductItem[];
}

export function HomeProductGrid({ products }: HomeProductGridProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const handleBuyNow = (prod: ProductItem) => {
    addItem(
      {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price: prod.price,
        discountedPrice: prod.discountedPrice,
        stock: prod.stock,
        imageUrl: prod.images?.[0]?.url,
        smeId: prod.sme?.id || "",
        smeName: prod.sme?.businessName || "Kenyan Merchant",
        smeSlug: prod.sme?.businessSlug || "",
      },
      1
    );
    router.push("/checkout");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((prod) => (
        <ProductCard key={prod.id} product={prod} onBuyNow={handleBuyNow} />
      ))}
    </div>
  );
}
