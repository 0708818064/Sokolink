import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sme = await prisma.sMEProfile.findFirst({
      where:
        session.role === "SME"
          ? {
              OR: [
                ...(session.smeId ? [{ id: session.smeId }] : []),
                { userId: session.userId },
              ],
            }
          : {},
      select: {
        id: true,
        businessName: true,
        businessSlug: true,
        status: true,
        registrationNumber: true,
        taxPin: true,
        idNumber: true,
        idType: true,
        idDocUrl: true,
        kraPinDocUrl: true,
        businessPermitUrl: true,
        mpesaPayoutNumber: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        kycNotes: true,
      },
    });

    if (!sme) {
      return NextResponse.json({ error: "SME profile not found" }, { status: 404 });
    }

    const isVerified = sme.status === "APPROVED" || sme.kycStatus === "APPROVED";

    return NextResponse.json({
      kyc: {
        ...sme,
        isVerified,
      },
    });
  } catch (error) {
    console.error("SME KYC GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve KYC details" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SME" || !session.smeId) {
      return NextResponse.json({ error: "Unauthorized. SME account required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      idNumber,
      idType = "NATIONAL_ID",
      taxPin,
      registrationNumber,
      mpesaPayoutNumber,
      idDocUrl,
      kraPinDocUrl,
      businessPermitUrl,
    } = body;

    if (!idNumber && !taxPin && !registrationNumber) {
      return NextResponse.json(
        { error: "At least National ID, KRA PIN, or Business Registration Number is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sme = await tx.sMEProfile.update({
        where: { id: session.smeId },
        data: {
          idNumber: idNumber ? String(idNumber).trim() : undefined,
          idType: idType || "NATIONAL_ID",
          taxPin: taxPin ? String(taxPin).toUpperCase().trim() : undefined,
          registrationNumber: registrationNumber ? String(registrationNumber).trim() : undefined,
          mpesaPayoutNumber: mpesaPayoutNumber ? String(mpesaPayoutNumber).trim() : undefined,
          idDocUrl: idDocUrl ? String(idDocUrl).trim() : undefined,
          kraPinDocUrl: kraPinDocUrl ? String(kraPinDocUrl).trim() : undefined,
          businessPermitUrl: businessPermitUrl ? String(businessPermitUrl).trim() : undefined,
          kycStatus: "PENDING",
          kycSubmittedAt: new Date(),
          kycNotes: null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "SME_KYC_SUBMITTED",
          entityType: "SME",
          entityId: session.smeId!,
          details: `KYC documents submitted for ${sme.businessName}`,
        },
      });

      return sme;
    });

    return NextResponse.json({
      success: true,
      message: "KYC documents submitted successfully. Verification is currently under review.",
      kyc: {
        id: updated.id,
        kycStatus: updated.kycStatus,
        kycSubmittedAt: updated.kycSubmittedAt,
        isVerified: updated.status === "APPROVED" || updated.kycStatus === "APPROVED",
      },
    });
  } catch (error) {
    console.error("SME KYC POST error:", error);
    return NextResponse.json({ error: "Failed to submit KYC details" }, { status: 500 });
  }
}
