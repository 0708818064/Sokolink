import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductDetailsClient } from "./ProductDetailsClient";
import { ShieldCheck, Truck, ArrowLeft } from "lucide-react";


interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
      category: true,
      sme: {
        include: {
          _count: { select: { products: true } },
        },
      },
      reviews: {
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Related products from same category or SME
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
      isApproved: true,
    },
    include: {
      images: { where: { isPrimary: true } },
      category: true,
      sme: true,
    },
    take: 4,
  });

  const formattedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price: Number(product.price),
    discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null,
    stock: product.stock,
    condition: product.condition,
    weight: product.weight ? Number(product.weight) : null,
    dimensions: product.dimensions,
    location: product.location,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    category: { id: product.category.id, name: product.category.name, slug: product.category.slug },
    sme: {
      id: product.sme.id,
      businessName: product.sme.businessName,
      businessSlug: product.sme.businessSlug,
      location: product.sme.location,
      address: product.sme.address,
      phone: product.sme.phone,
      rating: Number(product.sme.rating),
      ratingCount: product.sme.ratingCount,
      productsCount: product.sme._count.products,
    },
    images: product.images.map((img) => ({ url: img.url, altText: img.altText, isPrimary: img.isPrimary })),
    reviews: product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      customerName: r.customer.name,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-emerald-700">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-emerald-700">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-emerald-700">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Details View */}
      <ProductDetailsClient product={formattedProduct} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">More in {product.category.name}</h2>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View Category
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => {
              const primaryImg = rel.images[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="group bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition block"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImg}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-700">
                    {rel.name}
                  </h4>
                  <div className="mt-2 text-sm font-extrabold text-emerald-800">
                    KES {Number(rel.discountedPrice || rel.price).toLocaleString()}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
