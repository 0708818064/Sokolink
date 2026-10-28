import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SmeDashboardClient } from "./SmeDashboardClient";


export default async function SmeDashboardPage() {
  const session = await getSession();

  if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  // Find SME Profile
  const sme = await prisma.sMEProfile.findFirst({
    where:
      session.role === "SME"
        ? {
            OR: [
              ...(session.smeId ? [{ id: session.smeId }] : []),
              { userId: session.userId },
            ],
          }
        : {},
    include: {
      products: {
        include: {
          category: true,
          images: { where: { isPrimary: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      sellerOrders: {
        include: {
          order: {
            include: { deliveryAddress: true },
          },
          orderItems: true,
          delivery: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sme) {
    redirect("/register?role=sme");
  }

  // Categories for new product creation modal
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  // Calculate metrics
  const totalRevenue = sme.sellerOrders
    .filter((so) => so.status !== "CANCELLED")
    .reduce((sum, so) => sum + Number(so.subtotal), 0);

  const pendingOrdersCount = sme.sellerOrders.filter(
    (so) => so.status === "PENDING" || so.status === "PROCESSING"
  ).length;

  const lowStockCount = sme.products.filter((p) => p.stock <= p.lowStockThreshold).length;

  const formattedProducts = sme.products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : null,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    categoryName: p.category.name,
    imageUrl: p.images[0]?.url,
    isActive: p.isActive,
    isApproved: p.isApproved,
    ordersCount: p._count.orderItems,
  }));

  const formattedOrders = sme.sellerOrders.map((so) => ({
    id: so.id,
    orderNumber: so.order.orderNumber,
    subtotal: Number(so.subtotal),
    status: so.status,
    createdAt: so.createdAt.toISOString(),
    recipientName: so.order.deliveryAddress?.recipientName || "Customer",
    recipientPhone: so.order.deliveryAddress?.phone || "-",
    dropoffAddress: so.order.deliveryAddress
      ? `${so.order.deliveryAddress.estateOrStreet || ""}, ${so.order.deliveryAddress.subCounty || ""}, ${so.order.deliveryAddress.county || ""}`
      : "Nairobi",
    delivery: so.delivery
      ? {
          id: so.delivery.id,
          status: so.delivery.status,
          deliveryPersonId: so.delivery.deliveryPersonId,
        }
      : null,
    items: so.orderItems.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SmeDashboardClient
        sme={{
          id: sme.id,
          businessName: sme.businessName,
          businessSlug: sme.businessSlug,
          category: sme.category,
          status: sme.status,
          rating: Number(sme.rating),
          totalRevenue,
          pendingOrdersCount,
          lowStockCount,
        }}
        categories={categories}
        products={formattedProducts}
        orders={formattedOrders}
      />
    </div>
  );
}
