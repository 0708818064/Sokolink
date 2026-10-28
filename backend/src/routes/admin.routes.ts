import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { DeliveryJobStatus, NotificationType, SmeStatus, UserStatus, Role, DeliveryStatusEnum } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hashPassword } from "../lib/auth.js";
import { sendSmsNotification } from "../lib/sms.js";

export const adminRouter = Router();

// Apply auth & role to all admin endpoints
adminRouter.use(requireAuth, requireRole("ADMIN"));

// POST /api/admin/assign-rider
adminRouter.post("/assign-rider", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;
    const { deliveryId, riderId } = req.body;

    if (!deliveryId || !riderId) {
      res.status(400).json({ error: "deliveryId and riderId are required" });
      return;
    }

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
      res.status(404).json({ error: "Delivery task not found" });
      return;
    }

    const rider = await prisma.deliveryProfile.findUnique({
      where: { id: riderId },
      include: { user: true },
    });

    if (!rider || !rider.isApproved) {
      res.status(400).json({ error: "Selected rider is not verified or approved for dispatch." });
      return;
    }

    const previousRiderId = delivery.deliveryPersonId;

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          deliveryPersonId: rider.id,
          status: DeliveryJobStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          previousStatus: delivery.status,
          newStatus: DeliveryJobStatus.ASSIGNED,
          note: `Admin assigned delivery to rider ${rider.user.name} (${rider.vehiclePlate || "Courier"})`,
          changedByUserId: session.userId,
        },
      });

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

      await tx.notification.create({
        data: {
          userId: rider.userId,
          title: "New Delivery Assigned",
          message: `You have been assigned delivery task ${delivery.deliveryReference} from ${delivery.sellerOrder.sme.businessName} to ${delivery.recipientName}. Pickup: ${delivery.pickupAddress}.`,
          type: NotificationType.DELIVERY,
          link: "/delivery/dashboard",
        },
      });

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

    // Notify buyer via SMS
    if (delivery.recipientPhone) {
      await sendSmsNotification({
        to: delivery.recipientPhone,
        message: `Hello ${delivery.recipientName}, your order from ${delivery.sellerOrder.sme.businessName} has been assigned to courier ${rider.user.name} (${rider.vehiclePlate || "Motorcycle"}, Tel: ${rider.user.phone}). Track your package live: http://localhost:3000/track/${delivery.sellerOrder.order.trackingToken}`,
        orderNumber: delivery.sellerOrder.order.orderNumber,
        userId: delivery.sellerOrder.order.customerId || undefined,
      });
    }

    res.json({
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
    res.status(500).json({ error: "Failed to assign rider to delivery" });
  }
});

// GET /api/admin/smes
adminRouter.get("/smes", async (_req: Request, res: Response): Promise<void> => {
  try {
    const smes = await prisma.sMEProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        _count: {
          select: {
            products: true,
            sellerOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ smes });
  } catch (error) {
    console.error("Admin SMEs error:", error);
    res.status(500).json({ error: "Failed to load SMEs" });
  }
});

// PATCH /api/admin/smes
adminRouter.patch("/smes", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;
    const { smeId, status } = req.body;

    if (!smeId || !status) {
      res.status(400).json({ error: "SME ID and status are required" });
      return;
    }

    const sme = await prisma.sMEProfile.findUnique({
      where: { id: smeId },
      include: { user: true },
    });

    if (!sme) {
      res.status(404).json({ error: "SME profile not found" });
      return;
    }

    const userStatus =
      status === SmeStatus.APPROVED
        ? UserStatus.ACTIVE
        : status === SmeStatus.SUSPENDED
        ? UserStatus.SUSPENDED
        : UserStatus.PENDING;

    await prisma.$transaction([
      prisma.sMEProfile.update({
        where: { id: smeId },
        data: { status },
      }),
      prisma.user.update({
        where: { id: sme.userId },
        data: { status: userStatus },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: `SME_STATUS_${status}`,
          entityType: "SME",
          entityId: smeId,
          details: `Admin changed ${sme.businessName} status to ${status}`,
        },
      }),
    ]);

    res.json({ success: true, message: `SME ${status}` });
  } catch (error) {
    console.error("Admin SME update error:", error);
    res.status(500).json({ error: "Failed to update SME status" });
  }
});

// GET /api/admin/riders
adminRouter.get("/riders", async (_req: Request, res: Response): Promise<void> => {
  try {
    const riders = await prisma.deliveryProfile.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ riders });
  } catch (error) {
    console.error("Admin riders error:", error);
    res.status(500).json({ error: "Failed to load riders" });
  }
});

// POST /api/admin/riders (Create/Add New Courier Rider)
adminRouter.post("/riders", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;
    const { name, email, phone, vehicleType, vehiclePlate, idNumber, licenseNumber, password } = req.body;

    if (!name || !email || !phone || !password || !idNumber) {
      res.status(400).json({ error: "Name, email, phone, ID number, and password are required" });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: trimmedEmail }, { phone: phone.trim() }] },
    });

    if (existingUser) {
      res.status(400).json({ error: "An account with this email or phone number already exists" });
      return;
    }

    // Check unique ID number
    const existingId = await prisma.deliveryProfile.findUnique({
      where: { idNumber: idNumber.trim() },
    });

    if (existingId) {
      res.status(400).json({ error: "A courier with this National ID number already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          passwordHash,
          role: Role.DELIVERY,
          status: UserStatus.ACTIVE,
        },
      });

      const profile = await tx.deliveryProfile.create({
        data: {
          userId: newUser.id,
          vehicleType: vehicleType || "Motorbike",
          vehiclePlate: vehiclePlate ? vehiclePlate.toUpperCase().trim() : null,
          idNumber: idNumber.trim(),
          licenseNumber: licenseNumber ? licenseNumber.trim() : null,
          status: DeliveryStatusEnum.AVAILABLE,
          isApproved: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "COURIER_RIDER_CREATED",
          entityType: "DELIVERY",
          entityId: profile.id,
          details: `Admin created courier account for ${name} (${phone})`,
        },
      });

      return { user: newUser, profile };
    });

    res.json({
      success: true,
      message: `Courier rider ${name} created successfully`,
      rider: {
        id: result.profile.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        vehicleType: result.profile.vehicleType,
        vehiclePlate: result.profile.vehiclePlate,
        status: result.profile.status,
      },
    });
  } catch (error) {
    console.error("Create rider error:", error);
    res.status(500).json({ error: "Failed to create courier rider" });
  }
});

// DELETE /api/admin/riders/:id (Remove / Deactivate Rider)
adminRouter.delete("/riders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;
    const { id } = req.params;

    const rider = await prisma.deliveryProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!rider) {
      res.status(404).json({ error: "Courier rider not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Soft-delete / deactivate rider and suspend linked user
      await tx.deliveryProfile.update({
        where: { id },
        data: {
          isApproved: false,
          status: DeliveryStatusEnum.OFFLINE,
        },
      });

      await tx.user.update({
        where: { id: rider.userId },
        data: { status: UserStatus.SUSPENDED },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "COURIER_RIDER_REMOVED",
          entityType: "DELIVERY",
          entityId: id,
          details: `Admin deactivated courier rider ${rider.user.name} (${rider.user.email})`,
        },
      });
    });

    res.json({ success: true, message: `Courier rider ${rider.user.name} removed successfully` });
  } catch (error) {
    console.error("Delete rider error:", error);
    res.status(500).json({ error: "Failed to remove courier rider" });
  }
});

// GET /api/admin/orders
adminRouter.get("/orders", async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true,
        sellerOrders: {
          include: {
            sme: { select: { businessName: true, location: true } },
            delivery: {
              include: {
                deliveryPerson: {
                  include: { user: { select: { name: true, phone: true } } },
                },
              },
            },
          },
        },
        deliveryAddress: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ orders });
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({ error: "Failed to load platform orders" });
  }
});

// GET /api/admin/stats
adminRouter.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalOrders, totalSmes, totalRiders, totalCustomers, paidPayments] = await Promise.all([
      prisma.order.count(),
      prisma.sMEProfile.count(),
      prisma.deliveryProfile.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      totalOrders,
      totalSmes,
      totalRiders,
      totalCustomers,
      totalRevenue: Number(paidPayments._sum.amount || 0),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});
