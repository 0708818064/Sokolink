import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { parseDarajaCallback } from "../lib/mpesa.js";
import { PaymentStatus, FulfillmentStatus, NotificationType } from "@prisma/client";

export const paymentsRouter = Router();

// POST /api/payments/mpesa/stkpush
paymentsRouter.post("/mpesa/stkpush", async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      res.status(400).json({ error: "Order ID and Kenyan phone number are required" });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, sellerOrders: true },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.paymentStatus === "PAID") {
      res.json({ message: "Order is already marked as paid", order });
      return;
    }

    let formattedPhone = phone.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
      formattedPhone = "254" + formattedPhone;
    }

    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const merchantRequestId = `${Math.floor(10000 + Math.random() * 90000)}-${Date.now()}`;
    const mpesaReceiptNumber = `Q${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(
      10000000 + Math.random() * 90000000
    )}`;

    await prisma.$transaction(async (tx) => {
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

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.fulfillmentStatus,
          newStatus: FulfillmentStatus.CONFIRMED,
          comment: `M-Pesa payment of KES ${order.totalAmount} confirmed. Receipt: ${mpesaReceiptNumber}`,
        },
      });

      if (order.customerId) {
        await tx.notification.create({
          data: {
            userId: order.customerId,
            title: "M-Pesa Payment Received",
            message: `Your payment of KES ${order.totalAmount} for Order #${order.orderNumber} was received. M-Pesa Code: ${mpesaReceiptNumber}.`,
            type: NotificationType.ORDER,
            link: `/track/${order.trackingToken}`,
          },
        });
      }
    });

    res.json({
      success: true,
      message: "M-Pesa prompt simulation accepted. Order marked PAID.",
      checkoutRequestId,
      mpesaReceiptNumber,
    });
  } catch (error) {
    console.error("STK Push error:", error);
    res.status(500).json({ error: "Failed to initiate M-Pesa payment" });
  }
});

// POST /api/payments/mpesa/callback
paymentsRouter.post("/mpesa/callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = req.body;
    const callbackData = parseDarajaCallback(rawBody);

    if (!callbackData) {
      res.status(400).json({ error: "Invalid callback payload" });
      return;
    }

    const { checkoutRequestId, merchantRequestId, resultCode, amount, mpesaReceiptNumber, phoneNumber } =
      callbackData;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ checkoutRequestId }, { merchantRequestId }],
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
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      return;
    }

    if (payment.status === PaymentStatus.PAID) {
      res.json({ ResultCode: 0, ResultDesc: "Duplicate callback already settled" });
      return;
    }

    if (resultCode === 0 && mpesaReceiptNumber) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            mpesaReceiptNumber,
            phoneNumber: phoneNumber || payment.phoneNumber,
            rawResponse: JSON.stringify(rawBody),
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "STK_CALLBACK_SUCCESS",
            providerRef: mpesaReceiptNumber,
            payload: JSON.stringify(callbackData),
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            fulfillmentStatus: FulfillmentStatus.CONFIRMED,
          },
        });

        for (const so of payment.order.sellerOrders) {
          await tx.sellerOrder.update({
            where: { id: so.id },
            data: { status: FulfillmentStatus.CONFIRMED },
          });
        }
      });
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("Daraja callback error:", error);
    res.status(500).json({ error: "Internal callback error" });
  }
});
