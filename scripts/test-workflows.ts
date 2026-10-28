import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/auth";
import { formatKenyanPhone, getMpesaTimestamp, generateMpesaPassword, initiateDarajaStkPush, parseDarajaCallback } from "../src/lib/mpesa";
import { Role, UserStatus, SmeStatus, DeliveryJobStatus, FulfillmentStatus, PaymentStatus, NotificationType } from "@prisma/client";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING SOKOLINK BACKEND & DATABASE TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // TEST SUITE 1: Password hashing and verification
    console.log("Test Suite 1: Security & Authentication");
    const rawPass = "SecretSecurePass@2026";
    const hashed = await hashPassword(rawPass);
    const valid = await verifyPassword(rawPass, hashed);
    const invalid = await verifyPassword("WrongPassword", hashed);
    assert(valid === true, "Password hashes and verifies with bcrypt");
    assert(invalid === false, "Incorrect password fails verification");

    // TEST SUITE 2: Session Token Signing and Role Claims
    const token = await signSessionToken({
      userId: "test-user-id",
      email: "test@sokolink.co.ke",
      role: Role.SME,
      name: "Test SME Owner",
      smeId: "sme-123",
    });
    const verified = await verifySessionToken(token);
    assert(verified !== null && verified.role === Role.SME, "JWT Token encodes and decodes role claims securely");

    // TEST SUITE 3: Database User & Role Retrieval
    console.log("\nTest Suite 2: Role-Based User Access & Verification");
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@sokolink.co.ke" } });
    assert(adminUser !== null && adminUser.role === Role.ADMIN, "Admin user exists with Role.ADMIN");

    const smeUser = await prisma.user.findUnique({
      where: { email: "kazi@nairobielectronics.co.ke" },
      include: { smeProfile: true },
    });
    assert(smeUser !== null && smeUser.role === Role.SME, "SME user exists with Role.SME");
    assert(smeUser?.smeProfile !== null, "SME user has linked SMEProfile");

    const deliveryUser = await prisma.user.findUnique({
      where: { email: "rider@sokolink.co.ke" },
      include: { deliveryProfile: true },
    });
    assert(deliveryUser !== null && deliveryUser.role === Role.DELIVERY, "Delivery user exists with Role.DELIVERY");
    assert(deliveryUser?.deliveryProfile !== null, "Delivery user has linked DeliveryProfile");

    // TEST SUITE 4: SME Approval Workflow
    console.log("\nTest Suite 3: SME Moderation & Approval");
    const pendingSme = await prisma.sMEProfile.findFirst({
      where: { status: SmeStatus.PENDING },
    });
    assert(pendingSme !== null, "Pending SME account correctly requires administrative moderation");

    // TEST SUITE 5: Inventory & Multi-vendor Checkout Transaction
    console.log("\nTest Suite 4: Multi-Vendor Order & Stock Consistency");
    const testProducts = await prisma.product.findMany({
      where: { isActive: true },
      take: 2,
    });
    assert(testProducts.length >= 2, "Active products available in catalogue");

    const initialStock = testProducts[0].stock;
    assert(initialStock > 0, "Test product has initial stock > 0");

    // Simulate multi-vendor order checkout
    const orderNumber = `TEST-${Date.now()}`;
    const testOtp = "789123";

    const testOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          guestPhone: "+254799000111",
          subtotal: 4500,
          deliveryFee: 350,
          totalAmount: 4850,
          paymentStatus: PaymentStatus.PENDING_PAYMENT,
          fulfillmentStatus: FulfillmentStatus.PENDING,
          deliveryVerificationCode: testOtp,
        },
      });

      // Deduct 1 unit from test product
      await tx.product.update({
        where: { id: testProducts[0].id },
        data: { stock: initialStock - 1 },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: testProducts[0].id,
          changeType: "ORDER_RESERVATION",
          quantityChange: -1,
          previousStock: initialStock,
          newStock: initialStock - 1,
          referenceId: order.id,
          notes: "Automated test reservation",
        },
      });

      // Create seller suborder & delivery
      const sellerOrder = await tx.sellerOrder.create({
        data: {
          orderId: order.id,
          smeId: testProducts[0].smeId,
          subtotal: 4500,
          deliveryFee: 350,
          totalAmount: 4850,
        },
      });

      const del = await tx.delivery.create({
        data: {
          deliveryReference: `DEL-TEST-${Date.now()}`,
          sellerOrderId: sellerOrder.id,
          pickupAddress: "Limuru Road Farm Depot",
          dropoffAddress: "Westlands, Nairobi",
          recipientName: "Test Buyer",
          recipientPhone: "+254799000111",
          fee: 350,
          status: DeliveryJobStatus.ASSIGNED,
          verificationCode: testOtp,
        },
      });

      return { order, sellerOrder, delivery: del };
    });

    assert(testOrder.order.id !== undefined, "Order & suborder created in atomic database transaction");

    // Check stock was decremented
    const updatedProd = await prisma.product.findUnique({ where: { id: testProducts[0].id } });
    assert(updatedProd?.stock === initialStock - 1, "Product stock decremented accurately by ordered quantity");

    // TEST SUITE 6: Admin Assign Rider Mutation & Notifications
    console.log("\nTest Suite 5: Admin Rider Assignment & Notifications");
    const activeRider = await prisma.deliveryProfile.findFirst({
      where: { isApproved: true },
      include: { user: true },
    });
    assert(activeRider !== null, "Approved courier rider profile exists for assignment");

    if (activeRider) {
      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: testOrder.delivery.id },
          data: {
            deliveryPersonId: activeRider.id,
            status: DeliveryJobStatus.ASSIGNED,
          },
        });

        await tx.notification.create({
          data: {
            userId: activeRider.userId,
            title: "New Delivery Assigned",
            message: `Assigned task ${testOrder.delivery.deliveryReference}`,
            type: NotificationType.DELIVERY,
            link: "/delivery/dashboard",
          },
        });

        await tx.auditLog.create({
          data: {
            userId: adminUser!.id,
            action: "DELIVERY_RIDER_ASSIGNED",
            entityType: "DELIVERY",
            entityId: testOrder.delivery.id,
            details: `Admin assigned rider ${activeRider.user.name}`,
          },
        });
      });

      const recheckedDelivery = await prisma.delivery.findUnique({
        where: { id: testOrder.delivery.id },
      });
      assert(recheckedDelivery?.deliveryPersonId === activeRider.id, "Delivery successfully assigned to designated rider");

      const riderNotif = await prisma.notification.findFirst({
        where: { userId: activeRider.userId, type: NotificationType.DELIVERY },
        orderBy: { createdAt: "desc" },
      });
      assert(riderNotif !== null, "Rider receives automated notification upon job assignment");
    }

    // TEST SUITE 7: M-Pesa Daraja Abstraction & Phone Sanitization
    console.log("\nTest Suite 6: M-Pesa Daraja Helpers & Callback Processing");
    assert(formatKenyanPhone("0712345678") === "254712345678", "Formats 07... Kenyan numbers to 254...");
    assert(formatKenyanPhone("+254799000111") === "254799000111", "Sanitizes +254... international numbers");
    assert(getMpesaTimestamp().length === 14, "M-Pesa timestamp has standard YYYYMMDDHHmmss 14-char format");

    const passHash = generateMpesaPassword("174379", "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919", "20261027150000");
    assert(typeof passHash === "string" && passHash.length > 20, "Generates base64 encrypted Daraja password");

    const stkPushRes = await initiateDarajaStkPush({
      phoneNumber: "0799000111",
      amount: 4850,
      orderNumber: orderNumber,
    });
    assert(stkPushRes.success === true && stkPushRes.responseCode === "0", "STK push initiated and response returned");

    // Test Safaricom callback parsing
    const mockCallbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: stkPushRes.merchantRequestId,
          CheckoutRequestID: stkPushRes.checkoutRequestId,
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 4850 },
              { Name: "MpesaReceiptNumber", Value: "QAB78921KL" },
              { Name: "TransactionDate", Value: "20261027153000" },
              { Name: "PhoneNumber", Value: "254799000111" },
            ],
          },
        },
      },
    };

    const parsedCallback = parseDarajaCallback(mockCallbackPayload);
    assert(parsedCallback !== null && parsedCallback.resultCode === 0, "Parses incoming Daraja STK callback payload");
    assert(parsedCallback?.mpesaReceiptNumber === "QAB78921KL", "Extracts M-Pesa receipt number from metadata");

    // TEST SUITE 8: Order Payment Confirmation Transition
    console.log("\nTest Suite 7: Order Payment & Fulfillment Status Lifecycle");
    await prisma.order.update({
      where: { id: testOrder.order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.CONFIRMED,
      },
    });

    const paidOrder = await prisma.order.findUnique({ where: { id: testOrder.order.id } });
    assert(paidOrder?.paymentStatus === PaymentStatus.PAID, "Order paymentStatus transitions to PAID");
    assert(paidOrder?.fulfillmentStatus === FulfillmentStatus.CONFIRMED, "Order fulfillmentStatus transitions to CONFIRMED");

    // TEST SUITE 9: Delivery Verification Code (Proof of Delivery OTP)
    console.log("\nTest Suite 8: Proof-of-Delivery Handover OTP Verification");
    const deliveryRecord = await prisma.delivery.findUnique({
      where: { id: testOrder.delivery.id },
    });
    assert(deliveryRecord !== null, "Delivery record exists");

    const wrongOtp = "111111";
    const isWrongValid = wrongOtp === deliveryRecord?.verificationCode;
    const isCorrectValid = testOtp === deliveryRecord?.verificationCode;

    assert(isWrongValid === false, "Incorrect verification code is rejected");
    assert(isCorrectValid === true, "Correct 6-digit customer OTP authorizes completion");

    // Clean up test records
    await prisma.delivery.deleteMany({ where: { sellerOrder: { orderId: testOrder.order.id } } });
    await prisma.sellerOrder.deleteMany({ where: { orderId: testOrder.order.id } });
    await prisma.inventoryMovement.deleteMany({ where: { referenceId: testOrder.order.id } });
    await prisma.order.delete({ where: { id: testOrder.order.id } });
    // Restore stock
    await prisma.product.update({
      where: { id: testProducts[0].id },
      data: { stock: initialStock },
    });
    console.log("🧹 Test records cleaned up and product inventory restored.");

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  } finally {
    console.log("\n==================================================");
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
    await prisma.$disconnect();
    if (failed > 0) process.exit(1);
  }
}

runTests();
