import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma, InventoryChangeType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SME" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!session.smeId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "SME profile not found" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: session.role === "SME" ? { smeId: session.smeId } : {},
      include: {
        images: true,
        category: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("SME products GET error:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
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
      name,
      description,
      categoryId,
      sku,
      price,
      discountedPrice,
      stock = 0,
      condition = "NEW",
      imageUrl,
      location,
    } = body;

    if (!name || !description || !categoryId || !sku || !price) {
      return NextResponse.json({
        error: "Product name, description, category, SKU, and price are required",
      }, { status: 400 });
    }

    // Check unique SKU
    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existingSku) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 400 });
    }

    // Generate unique slug
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!baseSlug) baseSlug = "product-" + Date.now();
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const numPrice = parseFloat(price);
    const numDiscPrice = discountedPrice ? parseFloat(discountedPrice) : null;
    const numStock = parseInt(stock) || 0;

    const createdProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          smeId: session.smeId!,
          categoryId,
          name: name.trim(),
          slug,
          description: description.trim(),
          sku: sku.trim().toUpperCase(),
          price: new Prisma.Decimal(numPrice),
          discountedPrice: numDiscPrice ? new Prisma.Decimal(numDiscPrice) : null,
          stock: numStock,
          condition,
          location: location || "Nairobi",
          isActive: true,
          isApproved: true,
        },
      });

      if (imageUrl) {
        await tx.productImage.create({
          data: {
            productId: prod.id,
            url: imageUrl.trim(),
            isPrimary: true,
            displayOrder: 0,
          },
        });
      }

      if (numStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: prod.id,
            changeType: InventoryChangeType.RESTOCK,
            quantityChange: numStock,
            previousStock: 0,
            newStock: numStock,
            notes: "Initial inventory setup by seller",
            createdBy: session.userId,
          },
        });
      }

      return prod;
    });

    return NextResponse.json({ success: true, product: createdProduct });
  } catch (error) {
    console.error("SME product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
