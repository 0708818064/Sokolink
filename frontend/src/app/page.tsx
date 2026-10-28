import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HomeProductGrid } from "@/components/HomeProductGrid";
import {
  Store,
  Truck,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Cpu,
  Sparkles,
  Apple,
  Shirt,
  Home as HomeIcon,
  Heart,
  ChevronRight,
  Tag,
} from "lucide-react";


export default async function HomePage() {
  // Fetch featured products, categories, and SMEs from PostgreSQL
  const [categories, featuredProducts, recommendedSmes] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      take: 6,
    }),
    prisma.product.findMany({
      where: { isActive: true, isApproved: true },
      include: {
        images: { orderBy: { displayOrder: "asc" } },
        category: true,
        sme: true,
      },
      orderBy: { rating: "desc" },
      take: 8,
    }),
    prisma.sMEProfile.findMany({
      where: { status: "APPROVED", isFeatured: true },
      include: {
        _count: { select: { products: true } },
      },
      take: 3,
    }),
  ]);

  // Format products for component
  const formattedProducts = featuredProducts.map((p) => ({
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
      id: p.sme.id,
      businessName: p.sme.businessName,
      businessSlug: p.sme.businessSlug,
      location: p.sme.location,
    },
  }));

  const getCategoryIcon = (iconName: string | null) => {
    switch (iconName) {
      case "Cpu":
        return <Cpu className="w-6 h-6 text-emerald-600" />;
      case "Sparkles":
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case "Apple":
        return <Apple className="w-6 h-6 text-green-600" />;
      case "Shirt":
        return <Shirt className="w-6 h-6 text-indigo-500" />;
      case "Home":
        return <HomeIcon className="w-6 h-6 text-rose-500" />;
      case "Heart":
        return <Heart className="w-6 h-6 text-pink-500" />;
      default:
        return <Store className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white overflow-hidden py-16 md:py-24">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold backdrop-blur-xs border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Kenyan SME Digital Marketplace
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Shop Directly from Kenya&apos;s Best <span className="text-emerald-400">Local SMEs</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                Discover high-quality Kenyan electronics, authentic Maasai crafts, organic Limuru farm produce, and bespoke fashion. Pay seamlessly via M-Pesa with guaranteed delivery to your doorstep.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <span>Explore Catalogue</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/register?role=sme"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-xs border border-white/20 transition flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Register Your Business</span>
                </Link>
              </div>

              {/* Kenyan trust metric highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs">
                <div>
                  <div className="text-xl font-black text-emerald-400">100%</div>
                  <div className="text-slate-400">Kenyan SMEs</div>
                </div>
                <div>
                  <div className="text-xl font-black text-amber-400">Instant</div>
                  <div className="text-slate-400">M-Pesa STK Push</div>
                </div>
                <div>
                  <div className="text-xl font-black text-emerald-400">OTP Code</div>
                  <div className="text-slate-400">Verified Delivery</div>
                </div>
              </div>
            </div>

            {/* Hero Promo Banner Card */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" /> Limited Promotion
                  </span>
                  <span className="bg-emerald-500/30 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    Verified Sellers
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Karibu Discount Offer</h3>
                  <p className="text-slate-300 text-xs mt-1">
                    Get 10% off your first multi-vendor purchase when you checkout using code:
                  </p>
                  <div className="mt-3 bg-slate-950/60 border border-white/10 rounded-lg p-3 text-center">
                    <span className="font-mono text-lg font-black tracking-widest text-amber-400">
                      KARIBU10
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Pay with Safaricom M-Pesa on mobile</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Track rider dispatch live via tracking token</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Funds held in escrow until OTP delivery confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore by Category</h2>
            <p className="text-xs sm:text-sm text-slate-500">Handpicked sectors driving the Kenyan economy</p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition text-center flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-700">
                {cat.name}
              </h3>
              <span className="text-[11px] text-slate-400">{cat._count.products} products</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured SME Products</h2>
            <p className="text-xs sm:text-sm text-slate-500">Top-rated items from verified local entrepreneurs</p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <HomeProductGrid products={formattedProducts} />
      </section>

      {/* Recommended SMEs Section */}
      <section className="bg-emerald-50/60 py-12 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Spotlight</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Recommended Kenyan Enterprises</h2>
              <p className="text-xs sm:text-sm text-slate-500">Support verified Kenyan businesses in your community</p>
            </div>
            <Link
              href="/register?role=sme"
              className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Join as a Seller</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedSmes.map((sme) => (
              <div
                key={sme.id}
                className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      {sme.businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified SME
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-4">{sme.businessName}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sme.businessDescription}</p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800">{sme.location}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">{sme._count.products}</span> products
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-amber-600 font-bold">★ {Number(sme.rating).toFixed(1)} rating</div>
                  <Link
                    href={`/sellers/${sme.businessSlug}`}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>Visit Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action for SMEs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are You a Kenyan Business Owner or Artisan?
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Expand your customer base across Kenya. Register your enterprise, upload your products, receive instant M-Pesa settlements, and get fast delivery dispatch.
            </p>
          </div>
          <Link
            href="/register?role=sme"
            className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-lg transition whitespace-nowrap text-sm cursor-pointer"
          >
            Start Selling Today
          </Link>
        </div>
      </section>
    </div>
  );
}
