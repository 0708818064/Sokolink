import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { Role, UserStatus, SmeStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      role = "CUSTOMER",
      email,
      password,
      name,
      phone,
      // SME specific fields
      businessName,
      businessDescription,
      category,
      location,
      address,
      registrationNumber,
      taxPin,
    } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    if (role === "SME") {
      if (!businessName || !category || !location || !phone) {
        return NextResponse.json({
          error: "Business name, category, location, and Kenyan phone number are required for SME registration",
        }, { status: 400 });
      }

      // Generate a unique slug for the business
      let baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!baseSlug) baseSlug = "sme-" + Math.floor(Math.random() * 10000);
      let businessSlug = baseSlug;
      let counter = 1;
      while (await prisma.sMEProfile.findUnique({ where: { businessSlug } })) {
        businessSlug = `${baseSlug}-${counter++}`;
      }

      // Create SME in transaction
      const newUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: trimmedEmail,
            passwordHash,
            name,
            phone,
            role: Role.SME,
            status: UserStatus.PENDING, // SME accounts require admin verification
          },
        });

        const sme = await tx.sMEProfile.create({
          data: {
            userId: u.id,
            businessName,
            businessSlug,
            businessDescription: businessDescription || "",
            category,
            phone,
            location,
            address: address || location,
            registrationNumber,
            taxPin,
            status: SmeStatus.PENDING,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: u.id,
            action: "SME_ONBOARDING_SUBMITTED",
            entityType: "SME",
            entityId: sme.id,
            details: `Business ${businessName} registered by ${name}`,
          },
        });

        return { user: u, sme };
      });

      const sessionPayload = {
        userId: newUser.user.id,
        email: newUser.user.email,
        role: Role.SME,
        name: newUser.user.name,
        smeId: newUser.sme.id,
      };

      await setSessionCookie(sessionPayload);

      return NextResponse.json({
        message: "SME registration submitted successfully. Awaiting platform verification.",
        user: sessionPayload,
      });
    }

    // Default: Customer registration
    const newCustomer = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: trimmedEmail,
          passwordHash,
          name,
          phone,
          role: Role.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.customerProfile.create({
        data: {
          userId: u.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: u.id,
          action: "CUSTOMER_REGISTERED",
          entityType: "USER",
          entityId: u.id,
          details: `Customer account registered`,
        },
      });

      return u;
    });

    const sessionPayload = {
      userId: newCustomer.id,
      email: newCustomer.email,
      role: Role.CUSTOMER,
      name: newCustomer.name,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      message: "Customer account created successfully",
      user: sessionPayload,
    });
  } catch (error) {
    console.error("Register route error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
