import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DeliveryJobStatus, NotificationType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { deliveryId, riderId } = await req.json();

    if (!deliveryId || !riderId) {
      return NextResponse.json(
        { error: "deliveryId and riderId are required" },
        { status: 400 }
      );
    }

    // Verify delivery exists
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        sellerOrder: {
          include: {
            order: true,
            sme: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery task not found" }, { status: 404 });
    }

    // Verify rider exists and is approved
    const rider = await prisma.deliveryProfile.findUnique({
      where: { id: riderId },
      include: { user: true },
    });

    if (!rider || !rider.isApproved) {
      return NextResponse.json(
        { error: "Selected rider is not verified or approved for dispatch." },
        { status: 400 }
      );
    }

    const previousRiderId = delivery.deliveryPersonId;

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update delivery record
      await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          deliveryPersonId: rider.id,
          status: DeliveryJobStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      // 2. Record DeliveryStatusHistory
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          previousStatus: delivery.status,
          newStatus: DeliveryJobStatus.ASSIGNED,
          note: `Admin assigned delivery to rider ${rider.user.name} (${rider.vehiclePlate || "Courier"})`,
          changedByUserId: session.userId,
        },
      });

      // 3. Record OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: delivery.sellerOrder.orderId,
          sellerOrderId: delivery.sellerOrderId,
          previousStatus: delivery.status,
          newStatus: DeliveryJobStatus.ASSIGNED,
          comment: `Dispatch assigned to courier rider ${rider.user.name}`,
          changedByUserId: session.userId,
        },
      });

      // 4. Send in-app notification to the rider
      await tx.notification.create({
        data: {
          userId: rider.userId,
          title: "New Delivery Assigned",
          message: `You have been assigned delivery task ${delivery.deliveryReference} from ${delivery.sellerOrder.sme.businessName} to ${delivery.recipientName}. Pickup: ${delivery.pickupAddress}.`,
          type: NotificationType.DELIVERY,
          link: "/delivery/dashboard",
        },
      });

      // 5. Admin Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: previousRiderId ? "DELIVERY_RIDER_REASSIGNED" : "DELIVERY_RIDER_ASSIGNED",
          entityType: "DELIVERY",
          entityId: delivery.id,
          details: `Assigned rider ${rider.user.name} (${rider.id}) to delivery ${delivery.deliveryReference}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Delivery assigned to ${rider.user.name}`,
      deliveryId,
      rider: {
        id: rider.id,
        name: rider.user.name,
        phone: rider.user.phone,
        vehiclePlate: rider.vehiclePlate,
      },
    });
  } catch (error) {
    console.error("Admin assign-rider error:", error);
    return NextResponse.json({ error: "Failed to assign rider to delivery" }, { status: 500 });
  }
}
