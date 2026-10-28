import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DeliveryJobStatus, FulfillmentStatus, NotificationType } from "@prisma/client";
import { sendSmsNotification } from "@/lib/sms";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. SME account required." }, { status: 403 });
    }

    const body = await req.json();
    const { sellerOrderId, riderId } = body;

    if (!sellerOrderId || !riderId) {
      return NextResponse.json({ error: "sellerOrderId and riderId are required" }, { status: 400 });
    }

    const sellerOrder = await prisma.sellerOrder.findUnique({
      where: { id: sellerOrderId },
      include: {
        order: true,
        sme: true,
        delivery: true,
      },
    });

    if (!sellerOrder) {
      return NextResponse.json({ error: "Seller order not found" }, { status: 404 });
    }

    if (session.role === "SME" && sellerOrder.smeId !== session.smeId) {
      return NextResponse.json({ error: "Unauthorized to dispatch this merchant order" }, { status: 403 });
    }

    const rider = await prisma.deliveryProfile.findUnique({
      where: { id: riderId },
      include: { user: true },
    });

    if (!rider || !rider.isApproved) {
      return NextResponse.json({ error: "Selected rider is not verified or approved" }, { status: 400 });
    }

    const delivery = sellerOrder.delivery;
    if (!delivery) {
      return NextResponse.json({ error: "Delivery task not found for this suborder" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          deliveryPersonId: rider.id,
          status: DeliveryJobStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      await tx.sellerOrder.update({
        where: { id: sellerOrderId },
        data: { status: FulfillmentStatus.READY_FOR_PICKUP },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          previousStatus: delivery.status,
          newStatus: DeliveryJobStatus.ASSIGNED,
          note: `Seller (${sellerOrder.sme.businessName}) dispatched to courier ${rider.user.name} (${rider.vehiclePlate || "Courier"})`,
          changedByUserId: session.userId,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: sellerOrder.orderId,
          sellerOrderId: sellerOrder.id,
          previousStatus: sellerOrder.status,
          newStatus: FulfillmentStatus.READY_FOR_PICKUP,
          comment: `Package prepared and assigned to courier ${rider.user.name} (${rider.vehiclePlate || "Courier"})`,
          changedByUserId: session.userId,
        },
      });

      await tx.notification.create({
        data: {
          userId: rider.userId,
          title: "New Pickup Task Assigned",
          message: `Merchant ${sellerOrder.sme.businessName} has assigned you delivery task ${delivery.deliveryReference}. Pickup: ${delivery.pickupAddress}.`,
          type: NotificationType.DELIVERY,
          link: "/delivery/dashboard",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "SME_ASSIGNED_RIDER",
          entityType: "DELIVERY",
          entityId: delivery.id,
          details: `Seller ${sellerOrder.sme.businessName} assigned courier ${rider.user.name} (${rider.id})`,
        },
      });
    });

    // Send Transactional SMS to buyer
    if (delivery.recipientPhone) {
      await sendSmsNotification({
        to: delivery.recipientPhone,
        message: `Hello ${delivery.recipientName}, your order from ${sellerOrder.sme.businessName} has been assigned to courier ${rider.user.name} (${rider.vehiclePlate || "Motorcycle"}, Tel: ${rider.user.phone}). Track your delivery live: http://localhost:3000/track/${sellerOrder.order.trackingToken}`,
        orderNumber: sellerOrder.order.orderNumber,
        userId: sellerOrder.order.customerId || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order assigned to courier ${rider.user.name}`,
      rider: {
        id: rider.id,
        name: rider.user.name,
        phone: rider.user.phone,
        vehiclePlate: rider.vehiclePlate,
      },
    });
  } catch (error) {
    console.error("SME assign rider error:", error);
    return NextResponse.json({ error: "Failed to dispatch order to courier" }, { status: 500 });
  }
}
