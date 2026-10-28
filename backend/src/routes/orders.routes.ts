import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const ordersRouter = Router();

// GET /api/orders (Customer Order History)
ordersRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;

    const orders = await prisma.order.findMany({
      where: { customerId: session.userId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true } },
              },
            },
          },
        },
        sellerOrders: {
          include: {
            sme: {
              select: {
                businessName: true,
                phone: true,
              },
            },
            delivery: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ orders });
  } catch (error) {
    console.error("Orders list error:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// GET /api/orders/track/:token (Public Order Tracking)
ordersRouter.get("/track/:token", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: "Tracking token required" });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { trackingToken: token },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true } },
              },
            },
          },
        },
        sellerOrders: {
          include: {
            sme: {
              select: {
                businessName: true,
                phone: true,
                location: true,
              },
            },
            delivery: {
              include: {
                deliveryPerson: {
                  select: {
                    vehicleType: true,
                    vehiclePlate: true,
                    rating: true,
                  },
                },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        deliveryAddress: true,
        payments: {
          select: {
            amount: true,
            provider: true,
            status: true,
            mpesaReceiptNumber: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error("Order tracking error:", error);
    res.status(500).json({ error: "Failed to fetch tracking data" });
  }
});
