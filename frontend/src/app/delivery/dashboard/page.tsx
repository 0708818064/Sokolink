import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryDashboardClient } from "./DeliveryDashboardClient";


export default async function DeliveryDashboardPage() {
  const session = await getSession();

  if (!session || (session.role !== "DELIVERY" && session.role !== "ADMIN")) {
    redirect("/rider/login");
  }

  // Load deliveries
  const deliveries = await prisma.delivery.findMany({
    where: session.role === "DELIVERY" && session.deliveryId ? { deliveryPersonId: session.deliveryId } : {},
    include: {
      sellerOrder: {
        include: {
          order: true,
          sme: true,
          orderItems: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const riderProfile = session.deliveryId
    ? await prisma.deliveryProfile.findUnique({
        where: { id: session.deliveryId },
      })
    : null;

  const formattedDeliveries = deliveries.map((d) => ({
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
    createdAt: d.createdAt.toISOString(),
    items: d.sellerOrder.orderItems.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
    })),
  }));

  const totalEarnings = formattedDeliveries
    .filter((d) => d.status === "DELIVERED")
    .reduce((sum, d) => sum + d.fee, 0);

  const activeCount = formattedDeliveries.filter(
    (d) => !["DELIVERED", "DELIVERY_FAILED", "RETURN_TO_SELLER"].includes(d.status)
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DeliveryDashboardClient
        rider={{
          name: session.name,
          vehiclePlate: riderProfile?.vehiclePlate || "KMDF 452X",
          vehicleType: riderProfile?.vehicleType || "Motorbike Courier",
          rating: Number(riderProfile?.rating || 4.9),
          completedCount: riderProfile?.completedOrders || formattedDeliveries.filter((d) => d.status === "DELIVERED").length,
          totalEarnings,
          activeCount,
        }}
        initialDeliveries={formattedDeliveries}
      />
    </div>
  );
}
