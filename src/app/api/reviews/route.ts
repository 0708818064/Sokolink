import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in to submit a review." }, { status: 401 });
    }

    const { productId, rating, comment, orderId } = await req.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Product ID and a valid rating from 1 to 5 are required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { sme: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Create review & update aggregate rating
    const createdReview = await prisma.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          productId,
          smeId: product.smeId,
          customerId: session.userId,
          orderId,
          rating: Math.round(rating),
          comment: comment ? String(comment).trim() : null,
          isApproved: true,
        },
      });

      // Recalculate Product average rating
      const allProductReviews = await tx.review.findMany({
        where: { productId, isApproved: true },
        select: { rating: true },
      });

      const avgRating =
        allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length;

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: new Prisma.Decimal(avgRating.toFixed(2)),
          reviewCount: allProductReviews.length,
        },
      });

      // Recalculate SME average rating
      const allSmeReviews = await tx.review.findMany({
        where: { smeId: product.smeId, isApproved: true },
        select: { rating: true },
      });

      const smeAvg =
        allSmeReviews.reduce((sum, r) => sum + r.rating, 0) / allSmeReviews.length;

      await tx.sMEProfile.update({
        where: { id: product.smeId },
        data: {
          rating: new Prisma.Decimal(smeAvg.toFixed(2)),
          ratingCount: allSmeReviews.length,
        },
      });

      return rev;
    });

    return NextResponse.json({ success: true, review: createdReview });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
