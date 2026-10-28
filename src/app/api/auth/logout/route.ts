import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (session) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "USER_LOGOUT",
          entityType: "USER",
          entityId: session.userId,
        },
      });
    } catch {
      // ignore
    }
  }
  await clearSessionCookie();
  return NextResponse.json({ message: "Logged out successfully" });
}
