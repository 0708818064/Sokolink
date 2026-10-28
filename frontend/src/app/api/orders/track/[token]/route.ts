import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Tracking token required" }, { status: 400 });
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
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 });
  }
}
