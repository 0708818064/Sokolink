import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

    return NextResponse.json({ riders: formatted });
  } catch (error) {
    console.error("SME available-riders GET error:", error);
    return NextResponse.json({ error: "Failed to load couriers" }, { status: 500 });
  }
}
