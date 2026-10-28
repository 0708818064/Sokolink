import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DeliveryJobStatus, FulfillmentStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "DELIVERY" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const deliveries = await prisma.delivery.findMany({
      where: session.role === "DELIVERY" && session.deliveryId ? { deliveryPersonId: session.deliveryId } : {},
      include: {
        sellerOrder: {
          include: {
            order: {
              select: {
                orderNumber: true,
                totalAmount: true,
                paymentStatus: true,
                trackingToken: true,
              },
            },
            sme: {
              select: {
                businessName: true,
                location: true,
                phone: true,
              },
            },
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error("Delivery GET error:", error);
    return NextResponse.json({ error: "Failed to load deliveries" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "DELIVERY" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { deliveryId, status, verificationCode, failureReason } = await req.json();

    if (!deliveryId || !status) {
      return NextResponse.json({ error: "Delivery ID and target status are required" }, { status: 400 });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        sellerOrder: {
          include: { order: true },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery task not found" }, { status: 404 });
    }

    // Role checks
    if (session.role === "DELIVERY" && delivery.deliveryPersonId !== session.deliveryId) {
      return NextResponse.json({ error: "You are not assigned to this delivery task" }, { status: 403 });
    }

    // Proof-of-delivery OTP enforcement
    if (status === DeliveryJobStatus.DELIVERED) {
      if (!verificationCode || verificationCode.trim() !== delivery.verificationCode?.trim()) {
        return NextResponse.json({
          error: "Invalid delivery verification code. Please request the 6-digit code shown on the customer's tracking screen.",
        }, { status: 400 });
      }
    }

    const previousStatus = delivery.status;

    await prisma.$transaction(async (tx) => {
      // Update delivery record
      const updateData: {
        status: DeliveryJobStatus;
        failureReason?: string;
        acceptedAt?: Date;
        pickedUpAt?: Date;
        completedAt?: Date;
      } = {
        status,
        ...(failureReason ? { failureReason } : {}),
      };

      if (status === DeliveryJobStatus.ACCEPTED) updateData.acceptedAt = new Date();
      if (status === DeliveryJobStatus.PICKED_UP) updateData.pickedUpAt = new Date();
      if (status === DeliveryJobStatus.DELIVERED) updateData.completedAt = new Date();

      await tx.delivery.update({
        where: { id: delivery.id },
        data: updateData,
      });

      // Update DeliveryStatusHistory
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          previousStatus,
          newStatus: status,
          note: failureReason || `Delivery updated to ${status}`,
          changedByUserId: session.userId,
        },
      });

      // Map delivery status to fulfillment status for sellerOrder
      let mappedFulfillment: FulfillmentStatus | null = null;
      if (status === DeliveryJobStatus.PICKED_UP) mappedFulfillment = FulfillmentStatus.READY_FOR_PICKUP;
      if (status === DeliveryJobStatus.IN_TRANSIT) mappedFulfillment = FulfillmentStatus.OUT_FOR_DELIVERY;
      if (status === DeliveryJobStatus.DELIVERED) mappedFulfillment = FulfillmentStatus.DELIVERED;
      if (status === DeliveryJobStatus.RETURN_TO_SELLER) mappedFulfillment = FulfillmentStatus.RETURN_TO_SELLER;

      if (mappedFulfillment) {
        await tx.sellerOrder.update({
          where: { id: delivery.sellerOrderId },
          data: { status: mappedFulfillment },
        });

        // Also check if all seller orders under parent order are delivered
        const allSellerOrders = await tx.sellerOrder.findMany({
          where: { orderId: delivery.sellerOrder.orderId },
        });

        const allDelivered = allSellerOrders.every((so) =>
          so.id === delivery.sellerOrderId ? mappedFulfillment === FulfillmentStatus.DELIVERED : so.status === FulfillmentStatus.DELIVERED
        );

        if (allDelivered) {
          await tx.order.update({
            where: { id: delivery.sellerOrder.orderId },
            data: { fulfillmentStatus: FulfillmentStatus.DELIVERED },
          });
        } else if (mappedFulfillment === FulfillmentStatus.OUT_FOR_DELIVERY) {
          await tx.order.update({
            where: { id: delivery.sellerOrder.orderId },
            data: { fulfillmentStatus: FulfillmentStatus.OUT_FOR_DELIVERY },
          });
        }

        // Record OrderStatusHistory
        await tx.orderStatusHistory.create({
          data: {
            orderId: delivery.sellerOrder.orderId,
            sellerOrderId: delivery.sellerOrderId,
            previousStatus,
            newStatus: status,
            comment: `Rider update: ${status}`,
            changedByUserId: session.userId,
          },
        });
      }

      // If delivered, increment rider completedOrders
      if (status === DeliveryJobStatus.DELIVERED && session.deliveryId) {
        await tx.deliveryProfile.update({
          where: { id: session.deliveryId },
          data: { completedOrders: { increment: 1 } },
        });
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Delivery status update error:", error);
    return NextResponse.json({ error: "Failed to update delivery status" }, { status: 500 });
  }
}
