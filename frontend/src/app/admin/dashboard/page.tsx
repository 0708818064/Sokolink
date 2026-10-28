import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  // Fetch administrator platform metrics, SMEs, deliveries, and riders
  const [
    totalCustomers,
    totalSmes,
    pendingSmes,
    totalProducts,
    totalOrders,
    paidOrders,
    auditLogs,
    allSmes,
    allDeliveries,
    allRiders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.sMEProfile.count(),
    prisma.sMEProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { totalAmount: true, subtotal: true },
    }),
    prisma.auditLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.sMEProfile.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { products: true, sellerOrders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.delivery.findMany({
      include: {
        deliveryPerson: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
        sellerOrder: {
          include: {
            order: { select: { orderNumber: true, totalAmount: true, createdAt: true } },
            sme: { select: { businessName: true, location: true } },
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deliveryProfile.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { completedOrders: "desc" },
    }),
  ]);

  const grossMerchandiseValue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const platformRevenue = paidOrders.reduce((sum, o) => sum + Number(o.subtotal) * 0.05, 0); // 5% commission
  const completedDeliveries = allDeliveries.filter((d) => d.status === "DELIVERED").length;

  const formattedSmes = allSmes.map((s) => ({
    id: s.id,
    businessName: s.businessName,
    businessSlug: s.businessSlug,
    category: s.category,
    location: s.location,
    status: s.status,
    ownerName: s.user.name,
    ownerEmail: s.user.email,
    ownerPhone: s.phone || s.user.phone,
    productsCount: s._count.products,
    ordersCount: s._count.sellerOrders,
    createdAt: s.createdAt.toISOString(),
  }));

  const formattedDeliveries = allDeliveries.map((d) => ({
    id: d.id,
    deliveryReference: d.deliveryReference,
    orderNumber: d.sellerOrder.order.orderNumber,
    smeName: d.sellerOrder.sme.businessName,
    pickupAddress: d.pickupAddress,
    dropoffAddress: d.dropoffAddress,
    recipientName: d.recipientName,
    recipientPhone: d.recipientPhone,
    fee: Number(d.fee),
    status: d.status,
    verificationCode: d.verificationCode,
    deliveryPersonId: d.deliveryPersonId,
    deliveryPerson: d.deliveryPerson
      ? {
          id: d.deliveryPerson.id,
          name: d.deliveryPerson.user.name,
          phone: d.deliveryPerson.user.phone,
          vehicleType: d.deliveryPerson.vehicleType,
          vehiclePlate: d.deliveryPerson.vehiclePlate,
          rating: Number(d.deliveryPerson.rating),
        }
      : null,
    items: d.sellerOrder.orderItems.map((item) => ({
      id: item.id,
      name: item.productName,
      sku: item.productSku,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    createdAt: d.createdAt.toISOString(),
  }));

  const formattedRiders = allRiders.map((r) => ({
    id: r.id,
    name: r.user.name,
    email: r.user.email,
    phone: r.user.phone,
    vehicleType: r.vehicleType,
    vehiclePlate: r.vehiclePlate || "N/A",
    status: r.status,
    rating: Number(r.rating),
    completedOrders: r.completedOrders,
  }));

  const formattedAuditLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    details: log.details,
    userName: log.user?.name || "System",
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <AdminDashboardClient
        stats={{
          totalCustomers,
          totalSmes,
          pendingSmes,
          totalProducts,
          totalOrders,
          grossMerchandiseValue,
          platformRevenue,
          completedDeliveries,
        }}
        smes={formattedSmes}
        deliveries={formattedDeliveries}
        riders={formattedRiders}
        auditLogs={formattedAuditLogs}
      />
    </div>
  );
}
