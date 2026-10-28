import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDarajaCallback } from "@/lib/mpesa";
import { PaymentStatus, FulfillmentStatus, NotificationType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const callbackData = parseDarajaCallback(rawBody);

    if (!callbackData) {
      return NextResponse.json({ error: "Invalid callback payload" }, { status: 400 });
    }

    const {
      checkoutRequestId,
      merchantRequestId,
      resultCode,
      resultDesc,
      amount,
      mpesaReceiptNumber,
      phoneNumber,
    } = callbackData;

    // Find the matching payment by checkoutRequestId or merchantRequestId
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { checkoutRequestId },
          { merchantRequestId },
        ],
      },
      include: {
        order: {
          include: {
            sellerOrders: true,
          },
        },
      },
    });

    if (!payment) {
      console.warn("Daraja callback: No matching payment found for", checkoutRequestId);
      // Return 200 OK so Safaricom doesn't retry infinitely
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Idempotency check: if payment is already completed, do not duplicate
    if (payment.status === PaymentStatus.PAID) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Duplicate callback already settled" });
    }

    // Check if customer completed payment successfully
    if (resultCode === 0 && mpesaReceiptNumber) {
      await prisma.$transaction(async (tx) => {
        // 1. Update Payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            mpesaReceiptNumber,
            phoneNumber: phoneNumber || payment.phoneNumber,
            rawResponse: JSON.stringify(rawBody),
          },
        });

        // 2. Add Payment Event
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "STK_CALLBACK_SUCCESS",
            providerRef: mpesaReceiptNumber,
            payload: JSON.stringify(callbackData),
          },
        });

        // 3. Update parent Order status
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            fulfillmentStatus: FulfillmentStatus.CONFIRMED,
          },
        });

        // 4. Update child SellerOrders (fulfillment groups)
        for (const so of payment.order.sellerOrders) {
          await tx.sellerOrder.update({
            where: { id: so.id },
            data: { status: FulfillmentStatus.CONFIRMED },
          });
        }

        // 5. Order Status History
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            previousStatus: "PENDING_PAYMENT",
            newStatus: "CONFIRMED",
            comment: `M-Pesa payment of KES ${amount} verified. Receipt: ${mpesaReceiptNumber}`,
          },
        });

        // 6. Notify Customer
        if (payment.order.customerId) {
          await tx.notification.create({
            data: {
              userId: payment.order.customerId,
              title: "Payment Confirmed via M-Pesa",
              message: `Your payment of KES ${payment.amount} for order #${payment.order.orderNumber} was confirmed. Safaricom Receipt: ${mpesaReceiptNumber}.`,
              type: NotificationType.PAYMENT,
              link: `/track/${payment.order.trackingToken}`,
            },
          });
        }
      });
    } else {
      // Payment Failed or User Cancelled
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: resultDesc || "M-Pesa transaction was not completed.",
            rawResponse: JSON.stringify(rawBody),
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "STK_CALLBACK_FAILED",
            payload: JSON.stringify(callbackData),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            previousStatus: "PENDING_PAYMENT",
            newStatus: "PENDING_PAYMENT",
            comment: `M-Pesa payment attempt failed: ${resultDesc}`,
          },
        });
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback processed successfully" });
  } catch (error) {
    console.error("M-Pesa Callback Error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Error processed safely" });
  }
}
