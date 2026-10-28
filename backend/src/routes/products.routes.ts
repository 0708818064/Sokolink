import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export const productsRouter = Router();

// GET /api/products
productsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = ((req.query.search as string) || "").trim();
    const categorySlug = req.query.category as string | undefined;
    const sellerSlug = req.query.seller as string | undefined;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const sort = (req.query.sort as string) || "featured";
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "12", 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      isApproved: true,
      sme: {
        status: "APPROVED",
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (sellerSlug) {
      where.sme = { businessSlug: sellerSlug, status: "APPROVED" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "rating") orderBy = { rating: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { displayOrder: "asc" } },
          category: { select: { id: true, name: true, slug: true } },
          sme: {
            select: {
              id: true,
              businessName: true,
              businessSlug: true,
              location: true,
              rating: true,
              ratingCount: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/categories
productsRouter.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true, isApproved: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/products/:slug
productsRouter.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { displayOrder: "asc" } },
        category: true,
        sme: {
          select: {
            id: true,
            businessName: true,
            businessSlug: true,
            businessDescription: true,
            location: true,
            address: true,
            rating: true,
            ratingCount: true,
            phone: true,
          },
        },
        reviews: {
          include: {
            customer: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive || !product.isApproved) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Product detail error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
