import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { DeliveryJobStatus, FulfillmentStatus } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const deliveryRouter = Router();

// GET /api/delivery
deliveryRouter.get(
  "/",
  requireAuth,
  requireRole("DELIVERY", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;

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

      res.json({ deliveries });
    } catch (error) {
      console.error("Delivery GET error:", error);
      res.status(500).json({ error: "Failed to load deliveries" });
    }
  }
);

// PATCH /api/delivery
deliveryRouter.patch(
  "/",
  requireAuth,
  requireRole("DELIVERY", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;
      const { deliveryId, status, verificationCode, failureReason } = req.body;

      if (!deliveryId || !status) {
        res.status(400).json({ error: "Delivery ID and target status are required" });
        return;
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
        res.status(404).json({ error: "Delivery task not found" });
        return;
      }

      if (session.role === "DELIVERY" && delivery.deliveryPersonId !== session.deliveryId) {
        res.status(403).json({ error: "You are not assigned to this delivery task" });
        return;
      }

      if (status === DeliveryJobStatus.DELIVERED) {
        if (!verificationCode || verificationCode.trim() !== delivery.verificationCode?.trim()) {
          res.status(400).json({
            error:
              "Invalid delivery verification code. Please request the 6-digit code shown on the customer's tracking screen.",
          });
          return;
        }
      }

      const previousStatus = delivery.status;

      await prisma.$transaction(async (tx) => {
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

        await tx.deliveryStatusHistory.create({
          data: {
            deliveryId: delivery.id,
            previousStatus,
            newStatus: status,
            note: failureReason || `Delivery updated to ${status}`,
            changedByUserId: session.userId,
          },
        });

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

          const allSellerOrders = await tx.sellerOrder.findMany({
            where: { orderId: delivery.sellerOrder.orderId },
          });

          const allDelivered = allSellerOrders.every((so) =>
            so.id === delivery.sellerOrderId
              ? mappedFulfillment === FulfillmentStatus.DELIVERED
              : so.status === FulfillmentStatus.DELIVERED
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

        if (status === DeliveryJobStatus.DELIVERED && session.deliveryId) {
          await tx.deliveryProfile.update({
            where: { id: session.deliveryId },
            data: { completedOrders: { increment: 1 } },
          });
        }
      });

      res.json({ success: true, status });
    } catch (error) {
      console.error("Delivery status update error:", error);
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  }
);
