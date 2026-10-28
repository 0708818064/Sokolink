import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const guestToken = searchParams.get("guestToken");

    if (!session && !guestToken) {
      return NextResponse.json({ items: [] });
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
      return NextResponse.json({ items: [] });
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

    return NextResponse.json({ items: formattedItems, cartId: cart.id });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { productId, quantity = 1, guestToken } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Verify product exists and check stock
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }

    // Find or create cart
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

    return NextResponse.json({ success: true, cartItem, cartId: cart.id });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const guestToken = searchParams.get("guestToken");

    const cart = await prisma.cart.findFirst({
      where: session ? { userId: session.userId } : { guestToken: guestToken || "" },
    });

    if (!cart) {
      return NextResponse.json({ success: true });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
