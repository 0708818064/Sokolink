import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { FulfillmentStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const where = session.role === "SME" && session.smeId ? { smeId: session.smeId } : {};

    const orders = await prisma.sellerOrder.findMany({
      where,
      include: {
        order: {
          include: {
            deliveryAddress: true,
          },
        },
        orderItems: true,
        delivery: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("SME orders error:", error);
    return NextResponse.json({ error: "Failed to load seller orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { sellerOrderId, status } = await req.json();

    if (!sellerOrderId || !status) {
      return NextResponse.json({ error: "sellerOrderId and status are required" }, { status: 400 });
    }

    const sellerOrder = await prisma.sellerOrder.findUnique({
      where: { id: sellerOrderId },
      include: { order: true, delivery: true },
    });

    if (!sellerOrder) {
      return NextResponse.json({ error: "Seller order not found" }, { status: 404 });
    }

    // Role check
    if (session.role === "SME" && sellerOrder.smeId !== session.smeId) {
      return NextResponse.json({ error: "You cannot manage another merchant's suborders" }, { status: 403 });
    }

    const prevStatus = sellerOrder.status;

    await prisma.$transaction(async (tx) => {
      // 1. Update SellerOrder status
      await tx.sellerOrder.update({
        where: { id: sellerOrderId },
        data: { status: status as FulfillmentStatus },
      });

      // 2. Record OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: sellerOrder.orderId,
          sellerOrderId: sellerOrder.id,
          previousStatus: prevStatus,
          newStatus: status,
          comment: `SME merchant updated fulfillment readiness to ${status}`,
          changedByUserId: session.userId,
        },
      });

      // 3. If READY_FOR_PICKUP and delivery is assigned, notify rider
      if (status === FulfillmentStatus.READY_FOR_PICKUP && sellerOrder.delivery?.deliveryPersonId) {
        const rider = await tx.deliveryProfile.findUnique({
          where: { id: sellerOrder.delivery.deliveryPersonId },
        });

        if (rider) {
          await tx.notification.create({
            data: {
              userId: rider.userId,
              title: "Package Ready for Pickup",
              message: `Order #${sellerOrder.order.orderNumber} is packed and ready for pickup at merchant depot.`,
              type: "DELIVERY",
              link: "/delivery/dashboard",
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("SME order update error:", error);
    return NextResponse.json({ error: "Failed to update fulfillment status" }, { status: 500 });
  }
}
