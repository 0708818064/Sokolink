import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { Prisma } from "@prisma/client";
import { Filter, SlidersHorizontal, RotateCcw } from "lucide-react";


interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    seller?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const categorySlug = params.category || "";
  const sellerSlug = params.seller || "";
  const sort = params.sort || "featured";
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined;
  const currentPage = parseInt(params.page || "1");
  const limit = 12;
  const skip = (currentPage - 1) * limit;

  // Build filter query
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    isApproved: true,
    sme: { status: "APPROVED" },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (sellerSlug) {
    where.sme = { businessSlug: sellerSlug };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
    if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };
  if (sort === "rating") orderBy = { rating: "desc" };

  const [categories, total, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { displayOrder: "asc" } },
        category: true,
        sme: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const formattedProducts = products.map((p) => ({
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Product Catalogue
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Showing {products.length} of {total} products across verified Kenyan SME sellers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> Filters
              </span>
              {(categorySlug || search || sort !== "featured") && (
                <Link
                  href="/products"
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </Link>
              )}
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                <Link
                  href={`/products?sort=${sort}${search ? `&search=${search}` : ""}`}
                  className={`block text-xs py-1.5 px-2 rounded-lg transition ${
                    !categorySlug
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}&sort=${sort}${search ? `&search=${search}` : ""}`}
                    className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition ${
                      categorySlug === cat.slug
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400">({cat._count.products})</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Price Ranges */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Price Range (KES)
              </h3>
              <div className="space-y-1 text-xs">
                <Link
                  href={`/products?category=${categorySlug}&maxPrice=1000&sort=${sort}`}
                  className="block py-1 px-2 rounded-md hover:bg-slate-50 text-slate-600"
                >
                  Under KES 1,000
                </Link>
                <Link
                  href={`/products?category=${categorySlug}&minPrice=1000&maxPrice=3000&sort=${sort}`}
                  className="block py-1 px-2 rounded-md hover:bg-slate-50 text-slate-600"
                >
                  KES 1,000 – KES 3,000
                </Link>
                <Link
                  href={`/products?category=${categorySlug}&minPrice=3000&sort=${sort}`}
                  className="block py-1 px-2 rounded-md hover:bg-slate-50 text-slate-600"
                >
                  Above KES 3,000
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <SlidersHorizontal className="w-4 h-4" />
              <span>
                {search && (
                  <span>
                    Results for &ldquo;<span className="font-semibold text-slate-800">{search}</span>&rdquo; &bull;{" "}
                  </span>
                )}
                {total} products found
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sort by:</span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/products?category=${categorySlug}&search=${search}&sort=featured`}
                  className={`px-2.5 py-1 rounded-md transition ${
                    sort === "featured"
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Featured
                </Link>
                <Link
                  href={`/products?category=${categorySlug}&search=${search}&sort=price-asc`}
                  className={`px-2.5 py-1 rounded-md transition ${
                    sort === "price-asc"
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Price: Low to High
                </Link>
                <Link
                  href={`/products?category=${categorySlug}&search=${search}&sort=price-desc`}
                  className={`px-2.5 py-1 rounded-md transition ${
                    sort === "price-desc"
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Price: High to Low
                </Link>
              </div>
            </div>
          </div>

          {/* Grid */}
          {formattedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {formattedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search terms, clearing category filters, or browsing all available inventory.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                Reset All Filters
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Link
                  key={pg}
                  href={`/products?page=${pg}&category=${categorySlug}&search=${search}&sort=${sort}`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                    currentPage === pg
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pg}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
