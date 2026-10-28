import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

export const reviewsRouter = Router();

// POST /api/reviews
reviewsRouter.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user!;
    const { productId, rating, comment, orderId } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Product ID and a valid rating from 1 to 5 are required." });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { sme: true },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

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

    res.json({ success: true, review: createdReview });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});
