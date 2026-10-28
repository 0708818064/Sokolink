import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SmeStatus, UserStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

    return NextResponse.json({ smes });
  } catch (error) {
    console.error("Admin SMEs error:", error);
    return NextResponse.json({ error: "Failed to load SMEs" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { smeId, status } = await req.json();

    if (!smeId || !status) {
      return NextResponse.json({ error: "SME ID and status are required" }, { status: 400 });
    }

    const sme = await prisma.sMEProfile.findUnique({
      where: { id: smeId },
      include: { user: true },
    });

    if (!sme) {
      return NextResponse.json({ error: "SME profile not found" }, { status: 404 });
    }

    const userStatus = status === SmeStatus.APPROVED ? UserStatus.ACTIVE : status === SmeStatus.SUSPENDED ? UserStatus.SUSPENDED : UserStatus.PENDING;

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
      prisma.notification.create({
        data: {
          userId: sme.userId,
          title: `Account Update: ${status}`,
          message:
            status === SmeStatus.APPROVED
              ? "Congratulations! Your SokoLink SME seller account has been approved. You can now manage products and fulfill orders."
              : `Your SME account status has been updated to ${status}.`,
          type: "SYSTEM",
          link: "/sme/dashboard",
        },
      }),
    ]);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("SME status update error:", error);
    return NextResponse.json({ error: "Failed to update SME status" }, { status: 500 });
  }
}
