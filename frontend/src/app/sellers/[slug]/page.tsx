import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { ShieldCheck, MapPin, Phone, Star, Store, ArrowLeft } from "lucide-react";


interface SellerStorefrontProps {
  params: Promise<{ slug: string }>;
}

export default async function SellerStorefront({ params }: SellerStorefrontProps) {
  const { slug } = await params;

  const sme = await prisma.sMEProfile.findUnique({
    where: { businessSlug: slug },
    include: {
      products: {
        where: { isActive: true, isApproved: true },
        include: {
          images: { orderBy: { displayOrder: "asc" } },
          category: true,
          sme: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sme || sme.status !== "APPROVED") {
    notFound();
  }

  const formattedProducts = sme.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : null,
    stock: p.stock,
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
    location: p.location,
    images: p.images.map((img) => ({ url: img.url, altText: img.altText })),
    category: { name: p.category.name, slug: p.category.slug },
    sme: {
      id: sme.id,
      businessName: sme.businessName,
      businessSlug: sme.businessSlug,
      location: sme.location,
    },
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* Seller Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-200 hover:text-white mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white text-emerald-900 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                {sme.businessName.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{sme.businessName}</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Kenyan SME
                  </span>
                </div>

                <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                  {sme.businessDescription}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-emerald-200">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                    {sme.address || sme.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <strong className="text-white">{Number(sme.rating).toFixed(1)}</strong> ({sme.ratingCount} reviews)
                  </span>
                  <span>•</span>
                  <span>Category: <strong className="text-white">{sme.category}</strong></span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15 text-center min-w-[140px]">
              <div className="text-2xl font-black text-white">{sme.products.length}</div>
              <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">Active Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Products from this Seller</h2>
          <p className="text-xs text-slate-500">All orders from this merchant are bundled together during checkout</p>
        </div>

        {formattedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {formattedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700">No active products listed currently</h3>
            <p className="text-xs text-slate-400 mt-1">Check back soon for new inventory updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
