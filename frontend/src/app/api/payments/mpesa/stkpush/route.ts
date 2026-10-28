import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, FulfillmentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { orderId, phone } = await req.json();

    if (!orderId || !phone) {
      return NextResponse.json({ error: "Order ID and Kenyan phone number are required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, sellerOrders: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ message: "Order is already marked as paid", order });
    }

    // Format phone to standard Kenyan 2547XXXXXXXX
    let formattedPhone = phone.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Generate Daraja simulation tokens
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const merchantRequestId = `${Math.floor(10000 + Math.random() * 90000)}-${Date.now()}`;
    const mpesaReceiptNumber = `Q${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10000000 + Math.random() * 90000000)}`;

    // In a real environment, Daraja STK push is dispatched to Safaricom Daraja API.
    // In our live development sandbox workflow, we process and confirm the STK push atomically:
    await prisma.$transaction(async (tx) => {
      // 1. Update Payment
      const payment = await tx.payment.findFirst({
        where: { orderId: order.id },
      });

      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            checkoutRequestId,
            merchantRequestId,
            mpesaReceiptNumber,
            phoneNumber: formattedPhone,
            rawResponse: JSON.stringify({
              ResponseCode: "0",
              ResponseDescription: "Success. Request accepted for processing",
              CustomerMessage: "Success. Payment completed via M-Pesa",
            }),
          },
        });

        // 2. Add Payment Event
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "STK_CALLBACK_SUCCESS",
            providerRef: mpesaReceiptNumber,
            payload: JSON.stringify({
              MerchantRequestID: merchantRequestId,
              CheckoutRequestID: checkoutRequestId,
              ResultCode: 0,
              ResultDesc: "The service request is processed successfully.",
              Amount: Number(order.totalAmount),
              MpesaReceiptNumber: mpesaReceiptNumber,
              PhoneNumber: formattedPhone,
            }),
          },
        });
      }

      // 3. Update Order and SellerOrders
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          fulfillmentStatus: FulfillmentStatus.CONFIRMED,
        },
      });

      for (const so of order.sellerOrders) {
        await tx.sellerOrder.update({
          where: { id: so.id },
          data: { status: FulfillmentStatus.CONFIRMED },
        });
      }

      // 4. Record Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: "PENDING",
          newStatus: "CONFIRMED",
          comment: `M-Pesa payment received successfully. Receipt: ${mpesaReceiptNumber}`,
        },
      });

      // 5. Customer Notification
      if (order.customerId) {
        await tx.notification.create({
          data: {
            userId: order.customerId,
            title: "Payment Received",
            message: `Your payment of KES ${order.totalAmount} for order #${order.orderNumber} via M-Pesa was confirmed. Receipt: ${mpesaReceiptNumber}`,
            type: "PAYMENT",
            link: `/track/${order.trackingToken}`,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      mpesaReceiptNumber,
      message: `Payment confirmed via M-Pesa! Receipt: ${mpesaReceiptNumber}`,
    });
  } catch (error) {
    console.error("M-Pesa STK push error:", error);
    return NextResponse.json({ error: "Failed to initiate M-Pesa payment" }, { status: 500 });
  }
}
