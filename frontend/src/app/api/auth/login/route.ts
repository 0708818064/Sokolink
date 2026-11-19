import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check environment variable configured admin credentials
    const envAdminEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL || "").toLowerCase().trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || "";

    const isEnvAdminLogin =
      Boolean(envAdminEmail) &&
      Boolean(envAdminPassword) &&
      normalizedEmail === envAdminEmail &&
      password === envAdminPassword;

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        smeProfile: true,
        deliveryProfile: true,
      },
    });

    if (isEnvAdminLogin) {
      // If admin doesn't exist in DB yet, create them. If exists, ensure role is ADMIN & update hash
      const passwordHash = await hashPassword(password);
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: envAdminEmail,
            passwordHash,
            name: "Platform Administrator",
            role: "ADMIN",
            status: "ACTIVE",
          },
          include: {
            smeProfile: true,
            deliveryProfile: true,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "ADMIN",
            status: "ACTIVE",
            passwordHash,
          },
          include: {
            smeProfile: true,
            deliveryProfile: true,
          },
        });
      }
    } else {
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      if (user.status === "SUSPENDED") {
        return NextResponse.json({ error: "Account is suspended. Please contact platform support." }, { status: 403 });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      smeId: user.smeProfile?.id,
      deliveryId: user.deliveryProfile?.id,
    };

    await setSessionCookie(sessionPayload);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "USER",
        entityId: user.id,
        details: `Successful login as ${user.role}`,
      },
    });

    return NextResponse.json({
      message: "Logged in successfully",
      user: sessionPayload,
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
