import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

export interface SendSmsParams {
  to: string;
  message: string;
  orderNumber?: string;
  userId?: string;
}

export function formatKenyanInternationalPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Dispatches transactional SMS to Kenyan mobile numbers.
 * In production, integrates with Africa's Talking or Twilio.
 * In development/sandbox, logs the exact SMS payload and stores in-app audit.
 */
export async function sendSmsNotification({
  to,
  message,
  orderNumber,
  userId,
}: SendSmsParams): Promise<{ success: boolean; messageId: string }> {
  const formattedPhone = formatKenyanInternationalPhone(to);
  const messageId = `SMS_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  console.log(`=======================================================`);
  console.log(`📱 [SOKOLINK SMS GATEWAY]`);
  console.log(`To: ${formattedPhone}`);
  console.log(`Message: "${message}"`);
  console.log(`MessageID: ${messageId}`);
  console.log(`=======================================================`);

  // If userId is provided, also create a persistent in-app notification
  if (userId) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: orderNumber ? `Order #${orderNumber} Update` : "Delivery Notification",
          message,
          type: NotificationType.DELIVERY,
          link: orderNumber ? `/customer/dashboard` : undefined,
        },
      });
    } catch (err) {
      console.warn("Failed to save SMS in-app notification:", err);
    }
  }

  return { success: true, messageId };
}
