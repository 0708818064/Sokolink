import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const cartRouter = Router();

// GET /api/cart
cartRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user;
    const guestToken = req.query.guestToken as string | undefined;

    if (!session && !guestToken) {
      res.json({ items: [] });
      return;
    }

    const cart = await prisma.cart.findFirst({
      where: session ? { userId: session.userId } : { guestToken: guestToken! },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true } },
                sme: { select: { id: true, businessName: true, businessSlug: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      res.json({ items: [] });
      return;
    }

    const formattedItems = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        discountedPrice: item.product.discountedPrice ? Number(item.product.discountedPrice) : null,
        stock: item.product.stock,
        imageUrl: item.product.images[0]?.url,
        smeId: item.product.sme.id,
        smeName: item.product.sme.businessName,
        smeSlug: item.product.sme.businessSlug,
      },
    }));

    res.json({ items: formattedItems, cartId: cart.id });
  } catch (error) {
    console.error("Cart GET error:", error);
    res.status(500).json({ error: "Failed to load cart" });
  }
});

// POST /api/cart
cartRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user;
    const { productId, quantity = 1, guestToken } = req.body;

    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      res.status(404).json({ error: "Product not available" });
      return;
    }

    let cart = await prisma.cart.findFirst({
      where: session ? { userId: session.userId } : { guestToken },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session?.userId || null,
          guestToken: !session ? guestToken || `guest_${Date.now()}` : null,
        },
      });
    }

    const targetQty = Math.min(Math.max(1, quantity), product.stock);

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      update: {
        quantity: targetQty,
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: targetQty,
      },
    });

    res.json({ success: true, cartItem, cartId: cart.id });
  } catch (error) {
    console.error("Cart POST error:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// DELETE /api/cart
cartRouter.delete("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user;
    const productId = req.query.productId as string | undefined;
    const guestToken = req.query.guestToken as string | undefined;

    const cart = await prisma.cart.findFirst({
      where: session ? { userId: session.userId } : { guestToken: guestToken || "" },
    });

    if (!cart) {
      res.json({ success: true });
      return;
    }

    if (productId) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    } else {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
});
