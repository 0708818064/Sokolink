import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma, InventoryChangeType, FulfillmentStatus, DeliveryJobStatus, NotificationType } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSmsNotification } from "../lib/sms.js";

export const smeRouter = Router();

// GET /api/sme/products
smeRouter.get(
  "/products",
  requireAuth,
  requireRole("SME", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;

      if (!session.smeId && session.role !== "ADMIN") {
        res.status(400).json({ error: "SME profile not found" });
        return;
      }

      const products = await prisma.product.findMany({
        where: session.role === "SME" ? { smeId: session.smeId } : {},
        include: {
          images: true,
          category: true,
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ products });
    } catch (error) {
      console.error("SME products GET error:", error);
      res.status(500).json({ error: "Failed to load products" });
    }
  }
);

// POST /api/sme/products
smeRouter.post(
  "/products",
  requireAuth,
  requireRole("SME"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;
      if (!session.smeId) {
        res.status(400).json({ error: "SME profile not found" });
        return;
      }

      const {
        name,
        description,
        categoryId,
        sku,
        price,
        discountedPrice,
        stock = 0,
        condition = "NEW",
        imageUrl,
        location,
      } = req.body;

      if (!name || !description || !categoryId || !sku || !price) {
        res.status(400).json({
          error: "Product name, description, category, SKU, and price are required",
        });
        return;
      }

      const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim() } });
      if (existingSku) {
        res.status(400).json({ error: "A product with this SKU already exists" });
        return;
      }

      let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!baseSlug) baseSlug = "product-" + Date.now();
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      const numPrice = parseFloat(price);
      const numDiscPrice = discountedPrice ? parseFloat(discountedPrice) : null;
      const numStock = parseInt(stock) || 0;

      const createdProduct = await prisma.$transaction(async (tx) => {
        const prod = await tx.product.create({
          data: {
            smeId: session.smeId!,
            categoryId,
            name: name.trim(),
            slug,
            description: description.trim(),
            sku: sku.trim().toUpperCase(),
            price: new Prisma.Decimal(numPrice),
            discountedPrice: numDiscPrice ? new Prisma.Decimal(numDiscPrice) : null,
            stock: numStock,
            condition,
            location: location || "Nairobi",
            isActive: true,
            isApproved: true,
          },
        });

        if (imageUrl) {
          await tx.productImage.create({
            data: {
              productId: prod.id,
              url: imageUrl.trim(),
              isPrimary: true,
              displayOrder: 0,
            },
          });
        }

        if (numStock > 0) {
          await tx.inventoryMovement.create({
            data: {
              productId: prod.id,
              changeType: InventoryChangeType.RESTOCK,
              quantityChange: numStock,
              previousStock: 0,
              newStock: numStock,
              notes: "Initial inventory setup by seller",
              createdBy: session.userId,
            },
          });
        }

        return prod;
      });

      res.json({ success: true, product: createdProduct });
    } catch (error) {
      console.error("SME product create error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// GET /api/sme/orders
smeRouter.get(
  "/orders",
  requireAuth,
  requireRole("SME", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;
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

      res.json({ orders });
    } catch (error) {
      console.error("SME orders error:", error);
      res.status(500).json({ error: "Failed to load seller orders" });
    }
  }
);

// PATCH /api/sme/orders
smeRouter.patch(
  "/orders",
  requireAuth,
  requireRole("SME", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;
      const { sellerOrderId, status } = req.body;

      if (!sellerOrderId || !status) {
        res.status(400).json({ error: "sellerOrderId and status are required" });
        return;
      }

      const sellerOrder = await prisma.sellerOrder.findUnique({
        where: { id: sellerOrderId },
        include: { order: true, delivery: true },
      });

      if (!sellerOrder) {
        res.status(404).json({ error: "Seller order not found" });
        return;
      }

      if (session.role === "SME" && sellerOrder.smeId !== session.smeId) {
        res.status(403).json({ error: "You cannot manage another merchant's suborders" });
        return;
      }

      const prevStatus = sellerOrder.status;

      await prisma.$transaction(async (tx) => {
        await tx.sellerOrder.update({
          where: { id: sellerOrderId },
          data: { status: status as FulfillmentStatus },
        });

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
      });

      res.json({ success: true, status });
    } catch (error) {
      console.error("SME order update error:", error);
      res.status(500).json({ error: "Failed to update seller order" });
    }
  }
);

// GET /api/sme/available-riders (List available couriers for seller dispatch)
smeRouter.get(
  "/available-riders",
  requireAuth,
  requireRole("SME", "ADMIN"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const riders = await prisma.deliveryProfile.findMany({
        where: { isApproved: true },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { completedOrders: "desc" },
      });

      const formatted = riders.map((r) => ({
        id: r.id,
        name: r.user.name,
        phone: r.user.phone,
        vehicleType: r.vehicleType,
        vehiclePlate: r.vehiclePlate || "Motorcycle",
        status: r.status,
        rating: Number(r.rating),
        completedOrders: r.completedOrders,
      }));

      res.json({ riders: formatted });
    } catch (error) {
      console.error("SME available-riders error:", error);
      res.status(500).json({ error: "Failed to load couriers" });
    }
  }
);

// POST /api/sme/orders/assign-rider (Seller assigns courier to delivery task)
smeRouter.post(
  "/orders/assign-rider",
  requireAuth,
  requireRole("SME", "ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = req.user!;
      const { sellerOrderId, riderId } = req.body;

      if (!sellerOrderId || !riderId) {
        res.status(400).json({ error: "sellerOrderId and riderId are required" });
        return;
      }

      // Verify seller order exists and belongs to this merchant
      const sellerOrder = await prisma.sellerOrder.findUnique({
        where: { id: sellerOrderId },
        include: {
          order: true,
          sme: true,
          delivery: true,
        },
      });

      if (!sellerOrder) {
        res.status(404).json({ error: "Seller order not found" });
        return;
      }

      if (session.role === "SME" && sellerOrder.smeId !== session.smeId) {
        res.status(403).json({ error: "You are not authorized to dispatch this merchant suborder" });
        return;
      }

      // Verify rider exists and is approved
      const rider = await prisma.deliveryProfile.findUnique({
        where: { id: riderId },
        include: { user: true },
      });

      if (!rider || !rider.isApproved) {
        res.status(400).json({ error: "Selected rider is not approved for dispatch." });
        return;
      }

      const delivery = sellerOrder.delivery;
      if (!delivery) {
        res.status(404).json({ error: "Delivery record not found for this suborder" });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // 1. Assign rider to delivery
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            deliveryPersonId: rider.id,
            status: DeliveryJobStatus.ASSIGNED,
            assignedAt: new Date(),
          },
        });

        // 2. Update SellerOrder status to READY_FOR_PICKUP
        await tx.sellerOrder.update({
          where: { id: sellerOrderId },
          data: { status: FulfillmentStatus.READY_FOR_PICKUP },
        });

        // 3. Record DeliveryStatusHistory
        await tx.deliveryStatusHistory.create({
          data: {
            deliveryId: delivery.id,
            previousStatus: delivery.status,
            newStatus: DeliveryJobStatus.ASSIGNED,
            note: `Seller (${sellerOrder.sme.businessName}) dispatched to rider ${rider.user.name} (${rider.vehiclePlate || "Courier"})`,
            changedByUserId: session.userId,
          },
        });

        // 4. Record OrderStatusHistory
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

        // 5. In-app Notification for Rider
        await tx.notification.create({
          data: {
            userId: rider.userId,
            title: "New Pickup Task Assigned",
            message: `Merchant ${sellerOrder.sme.businessName} has assigned you delivery task ${delivery.deliveryReference}. Pickup: ${delivery.pickupAddress}.`,
            type: NotificationType.DELIVERY,
            link: "/delivery/dashboard",
          },
        });

        // 6. Audit Log
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: "SME_ASSIGNED_RIDER",
            entityType: "DELIVERY",
            entityId: delivery.id,
            details: `Seller ${sellerOrder.sme.businessName} assigned rider ${rider.user.name} to delivery ${delivery.deliveryReference}`,
          },
        });
      });

      // 7. Send Transactional SMS to the Buyer!
      if (delivery.recipientPhone) {
        await sendSmsNotification({
          to: delivery.recipientPhone,
          message: `Hello ${delivery.recipientName}, your order from ${sellerOrder.sme.businessName} has been assigned to courier ${rider.user.name} (${rider.vehiclePlate || "Motorcycle"}, Tel: ${rider.user.phone}). Track your delivery live: http://localhost:3000/track/${sellerOrder.order.trackingToken}`,
          orderNumber: sellerOrder.order.orderNumber,
          userId: sellerOrder.order.customerId || undefined,
        });
      }

      res.json({
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
      console.error("Seller assign rider error:", error);
      res.status(500).json({ error: "Failed to assign courier to order" });
    }
  }
);
