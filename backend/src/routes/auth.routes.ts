import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signSessionToken } from "../lib/auth.js";
import { Role, UserStatus, SmeStatus, DeliveryStatusEnum } from "@prisma/client";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        smeProfile: true,
        deliveryProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.status === "SUSPENDED") {
      res.status(403).json({ error: "Account is suspended. Please contact platform support." });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      smeId: user.smeProfile?.id,
      deliveryId: user.deliveryProfile?.id,
    };

    const token = await signSessionToken(sessionPayload);

    res.cookie("sokolink_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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

    res.json({
      message: "Logged in successfully",
      user: sessionPayload,
      token,
    });
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/register
authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      role = "CUSTOMER",
      email,
      password,
      name,
      phone,
      businessName,
      businessDescription,
      category,
      location,
      address,
      registrationNumber,
      taxPin,
      vehicleType,
      plateNumber,
    } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      res.status(400).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    if (role === "SME") {
      if (!businessName || !category || !location || !phone) {
        res.status(400).json({
          error: "Business name, category, location, and Kenyan phone number are required for SME registration",
        });
        return;
      }

      let baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!baseSlug) baseSlug = "sme-" + Math.floor(Math.random() * 10000);
      let businessSlug = baseSlug;
      let counter = 1;
      while (await prisma.sMEProfile.findUnique({ where: { businessSlug } })) {
        businessSlug = `${baseSlug}-${counter++}`;
      }

      const newUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: trimmedEmail,
            passwordHash,
            name,
            phone,
            role: Role.SME,
            status: UserStatus.PENDING,
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

      const token = await signSessionToken(sessionPayload);

      res.cookie("sokolink_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "SME registration submitted successfully. Awaiting platform verification.",
        user: sessionPayload,
        token,
      });
      return;
    }

    if (role === "DELIVERY") {
      const newUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: trimmedEmail,
            passwordHash,
            name,
            phone,
            role: Role.DELIVERY,
            status: UserStatus.ACTIVE,
          },
        });

        const delivery = await tx.deliveryProfile.create({
          data: {
            userId: u.id,
            vehicleType: vehicleType || "MOTORCYCLE",
            vehiclePlate: plateNumber || "KMDB 123X",
            idNumber: `ID-${Date.now()}`,
            status: DeliveryStatusEnum.AVAILABLE,
            isApproved: true,
          },
        });

        return { user: u, delivery };
      });

      const sessionPayload = {
        userId: newUser.user.id,
        email: newUser.user.email,
        role: Role.DELIVERY,
        name: newUser.user.name,
        deliveryId: newUser.delivery.id,
      };

      const token = await signSessionToken(sessionPayload);

      res.cookie("sokolink_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Delivery rider account created successfully",
        user: sessionPayload,
        token,
      });
      return;
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

    const token = await signSessionToken(sessionPayload);

    res.cookie("sokolink_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Customer account created successfully",
      user: sessionPayload,
      token,
    });
  } catch (error) {
    console.error("Register route error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// GET /api/auth/me
authRouter.get("/me", async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user || null });
});

// POST /api/auth/logout
authRouter.post("/logout", async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie("sokolink_session");
  res.json({ message: "Logged out successfully" });
});
