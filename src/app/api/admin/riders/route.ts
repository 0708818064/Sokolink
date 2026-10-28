import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { Role, UserStatus, DeliveryStatusEnum } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const riders = await prisma.deliveryProfile.findMany({
      where: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ riders });
  } catch (error) {
    console.error("Admin riders error:", error);
    return NextResponse.json({ error: "Failed to load riders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, vehicleType, vehiclePlate, idNumber, licenseNumber, password } = body;

    if (!name || !email || !phone || !password || !idNumber) {
      return NextResponse.json(
        { error: "Name, email, phone, ID number, and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: trimmedEmail }, { phone: phone.trim() }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email or phone number already exists" },
        { status: 400 }
      );
    }

    const existingId = await prisma.deliveryProfile.findUnique({
      where: { idNumber: idNumber.trim() },
    });

    if (existingId) {
      return NextResponse.json(
        { error: "A courier with this National ID number already exists" },
        { status: 400 }
      );
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

    return NextResponse.json({
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
    return NextResponse.json({ error: "Failed to create courier rider" }, { status: 500 });
  }
}
