import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { userId: session.userId, isRead: false },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications
notificationsRouter.patch("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;
    const { notificationId } = req.body;

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: session.userId },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});
