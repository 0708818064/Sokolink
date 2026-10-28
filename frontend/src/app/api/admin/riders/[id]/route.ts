import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DeliveryStatusEnum, UserStatus } from "@prisma/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;

    const rider = await prisma.deliveryProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!rider) {
      return NextResponse.json({ error: "Courier rider not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
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

    return NextResponse.json({
      success: true,
      message: `Courier rider ${rider.user.name} removed successfully`,
    });
  } catch (error) {
    console.error("Delete rider error:", error);
    return NextResponse.json({ error: "Failed to remove courier rider" }, { status: 500 });
  }
}
