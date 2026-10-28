import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma, PaymentStatus, FulfillmentStatus, DeliveryJobStatus, InventoryChangeType } from "@prisma/client";

export const checkoutRouter = Router();

// POST /api/checkout
checkoutRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.user;
    const body = req.body;

    const {
      items,
      recipientName,
      phone,
      county = "Nairobi",
      subCounty,
      estateOrStreet,
      landmark,
      deliveryOption = "STANDARD",
      paymentMethod = "MPESA",
      discountCode,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    if (!recipientName || !phone || !subCounty || !estateOrStreet) {
      res.status(400).json({
        error: "Recipient name, phone, sub-county, and street/estate are required",
      });
      return;
    }

    const productIds = items.map((i: { productId: string }) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, isApproved: true },
      include: {
        sme: true,
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        res.status(400).json({ error: "Product not found or unavailable" });
        return;
      }
      if (dbProd.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${dbProd.name}". Available: ${dbProd.stock}, Requested: ${item.quantity}`,
        });
        return;
      }
    }

    let subtotal = 0;
    const sellerGroups: Record<
      string,
      { smeId: string; items: { product: (typeof dbProducts)[0]; quantity: number; unitPrice: number; lineTotal: number }[] }
    > = {};

    for (const item of items) {
      const dbProd = productMap.get(item.productId)!;
      const unitPrice = dbProd.discountedPrice ? Number(dbProd.discountedPrice) : Number(dbProd.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      if (!sellerGroups[dbProd.smeId]) {
        sellerGroups[dbProd.smeId] = {
          smeId: dbProd.smeId,
          items: [],
        };
      }
      sellerGroups[dbProd.smeId].items.push({
        product: dbProd,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    const distinctSmeCount = Object.keys(sellerGroups).length;
    const deliveryFee =
      deliveryOption === "EXPRESS" ? 450 + (distinctSmeCount - 1) * 150 : 250 + (distinctSmeCount - 1) * 100;

    let discountTotal = 0;
    let validCouponId: string | null = null;
    if (discountCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: discountCode.toUpperCase().trim() },
      });
      if (coupon && coupon.isActive && new Date() <= coupon.validUntil) {
        if (!coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue)) {
          if (coupon.discountType === "PERCENTAGE") {
            const calculated = (subtotal * Number(coupon.discountValue)) / 100;
            discountTotal = coupon.maxDiscount ? Math.min(calculated, Number(coupon.maxDiscount)) : calculated;
          } else {
            discountTotal = Number(coupon.discountValue);
          }
          validCouponId = coupon.id;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountTotal);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SKL-${dateStr}-${randomHex}`;
    const deliveryVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const availableRider = await prisma.deliveryProfile.findFirst({
      where: { isApproved: true, status: "AVAILABLE" },
    });

    const createdOrder = await prisma.$transaction(async (tx) => {
      let addressId: string | null = null;
      if (session?.userId) {
        const addr = await tx.address.create({
          data: {
            userId: session.userId,
            title: "Delivery Address",
            recipientName,
            phone,
            county,
            subCounty,
            estateOrStreet,
            landmark,
            isDefault: false,
          },
        });
        addressId = addr.id;
      }

      const parentOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: session?.userId || null,
          guestPhone: !session?.userId ? phone : null,
          guestEmail: !session?.userId ? body.guestEmail || "guest@sokolink.co.ke" : null,
          subtotal: new Prisma.Decimal(subtotal),
          deliveryFee: new Prisma.Decimal(deliveryFee),
          discountTotal: new Prisma.Decimal(discountTotal),
          totalAmount: new Prisma.Decimal(totalAmount),
          paymentStatus: PaymentStatus.PENDING_PAYMENT,
          fulfillmentStatus: FulfillmentStatus.PENDING,
          deliveryAddressId: addressId,
          deliveryOption,
          discountCode: validCouponId ? discountCode.toUpperCase().trim() : null,
          deliveryVerificationCode,
          notes,
        },
      });

      for (const smeId of Object.keys(sellerGroups)) {
        const group = sellerGroups[smeId];
        const groupSubtotal = group.items.reduce((s, i) => s + i.lineTotal, 0);
        const groupDeliveryFee = Math.round(deliveryFee / distinctSmeCount);

        const sellerOrder = await tx.sellerOrder.create({
          data: {
            orderId: parentOrder.id,
            smeId,
            subtotal: new Prisma.Decimal(groupSubtotal),
            deliveryFee: new Prisma.Decimal(groupDeliveryFee),
            totalAmount: new Prisma.Decimal(groupSubtotal + groupDeliveryFee),
            status: FulfillmentStatus.PENDING,
          },
        });

        for (const item of group.items) {
          await tx.orderItem.create({
            data: {
              orderId: parentOrder.id,
              sellerOrderId: sellerOrder.id,
              productId: item.product.id,
              productName: item.product.name,
              productSku: item.product.sku,
              price: new Prisma.Decimal(item.unitPrice),
              quantity: item.quantity,
              subtotal: new Prisma.Decimal(item.lineTotal),
            },
          });

          const prevStock = item.product.stock;
          const newStock = prevStock - item.quantity;
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.product.id,
              changeType: InventoryChangeType.ORDER_RESERVATION,
              quantityChange: -item.quantity,
              previousStock: prevStock,
              newStock,
              referenceId: parentOrder.id,
              notes: `Order #${orderNumber} reservation`,
              createdBy: session?.userId || "GUEST_CHECKOUT",
            },
          });
        }

        const deliveryRef = `DEL-${orderNumber.split("-")[2]}-${smeId.slice(0, 4).toUpperCase()}`;
        const pickupLoc = `${group.items[0].product.sme.businessName}, ${group.items[0].product.sme.address}`;
        const dropoffLoc = `${estateOrStreet}, ${subCounty}, ${county}`;

        await tx.delivery.create({
          data: {
            deliveryReference: deliveryRef,
            sellerOrderId: sellerOrder.id,
            deliveryPersonId: availableRider ? availableRider.id : null,
            pickupAddress: pickupLoc,
            dropoffAddress: dropoffLoc,
            recipientName,
            recipientPhone: phone,
            fee: new Prisma.Decimal(groupDeliveryFee),
            status: availableRider ? DeliveryJobStatus.ASSIGNED : DeliveryJobStatus.ASSIGNED,
            verificationCode: deliveryVerificationCode,
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: parentOrder.id,
          previousStatus: null,
          newStatus: FulfillmentStatus.PENDING,
          comment: "Order placed successfully. Waiting for M-Pesa payment confirmation.",
          changedByUserId: session?.userId || null,
        },
      });

      const paymentRef = `PAY-${orderNumber}`;
      await tx.payment.create({
        data: {
          paymentReference: paymentRef,
          orderId: parentOrder.id,
          customerId: session?.userId || null,
          amount: new Prisma.Decimal(totalAmount),
          currency: "KES",
          provider: paymentMethod === "CASH_ON_DELIVERY" ? "CASH_ON_DELIVERY" : "MPESA",
          status: PaymentStatus.PENDING_PAYMENT,
          phoneNumber: phone,
        },
      });

      if (validCouponId) {
        await tx.couponRedemption.create({
          data: {
            couponId: validCouponId,
            orderId: parentOrder.id,
            customerId: session?.userId || null,
            discountApplied: new Prisma.Decimal(discountTotal),
          },
        });

        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return parentOrder;
    });

    res.json({
      success: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        trackingToken: createdOrder.trackingToken,
        totalAmount: Number(createdOrder.totalAmount),
        deliveryVerificationCode: createdOrder.deliveryVerificationCode,
      },
    });
  } catch (error) {
    console.error("Checkout transaction error:", error);
    res.status(500).json({ error: "Failed to process order" });
  }
});
