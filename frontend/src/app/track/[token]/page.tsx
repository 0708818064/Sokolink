import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrencyKES, formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  ShieldCheck,
  MapPin,
  Store,
  Phone,
  RefreshCw,
} from "lucide-react";


interface TrackingPageProps {
  params: Promise<{ token: string }>;
}

export default async function OrderTrackingPage({ params }: TrackingPageProps) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: {
      orderItems: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true } } },
          },
        },
      },
      sellerOrders: {
        include: {
          sme: true,
          delivery: {
            include: { deliveryPerson: true },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      deliveryAddress: true,
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  const payment = order.payments[0];

  // Milestones progression
  const isPaid = order.paymentStatus === "PAID";
  const isConfirmed = isPaid || order.fulfillmentStatus !== "PENDING";
  const isProcessing = ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
    order.fulfillmentStatus
  );
  const isReady = ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
    order.fulfillmentStatus
  );
  const isInTransit = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.fulfillmentStatus);
  const isDelivered = order.fulfillmentStatus === "DELIVERED";

  const milestones = [
    { title: "Order Placed", done: true, desc: "Order details recorded" },
    {
      title: "Payment Confirmed",
      done: isPaid,
      desc: isPaid
        ? `M-Pesa Confirmed (${payment?.mpesaReceiptNumber || "Receipt Issued"})`
        : "Awaiting M-Pesa STK verification",
    },
    {
      title: "SME Order Preparation",
      done: isProcessing,
      desc: isProcessing ? "SME is packaging items" : "Pending seller packing",
    },
    {
      title: "Rider Picked Up",
      done: isReady,
      desc: isReady ? "Courier collected from store" : "Awaiting rider pickup",
    },
    {
      title: "Out for Delivery",
      done: isInTransit,
      desc: isInTransit ? "Courier is en route to your location" : "Waiting for dispatch",
    },
    {
      title: "Order Delivered",
      done: isDelivered,
      desc: isDelivered ? "Verified with OTP code" : "Awaiting doorstep verification",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Order Reference: {order.orderNumber}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Status: {order.fulfillmentStatus.replace(/_/g, " ")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {formatDate(order.createdAt)} &bull; Total: {formatCurrencyKES(Number(order.totalAmount))}
          </p>
        </div>

        <Link
          href={`/track/${token}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </Link>
      </div>

      {/* Secret Delivery Verification Code Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-200" />
              <h3 className="font-extrabold text-base">Delivery Handover Verification Code</h3>
            </div>
            <p className="text-xs text-amber-100 mt-1 max-w-lg">
              Share this 6-digit code with the courier rider ONLY when they hand over your package. This guarantees safe delivery and authorizes escrow fund release.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-amber-300/40 rounded-xl px-5 py-3 text-center shrink-0">
            <span className="font-mono text-2xl font-black tracking-widest text-amber-300">
              {order.deliveryVerificationCode || "------"}
            </span>
            <span className="block text-[10px] text-amber-200 uppercase tracking-wider mt-0.5 font-medium">
              One-Time OTP Code
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Delivery Progress Timeline</span>
        </h2>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                  m.done ? "bg-emerald-600 shadow-xs" : "bg-slate-200"
                }`}
              >
                {m.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                )}
              </div>
              <div>
                <h4
                  className={`text-sm font-bold ${
                    m.done ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {m.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seller Packages & Items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-600" />
          <span>Fulfillment Packages ({order.sellerOrders.length})</span>
        </h2>

        <div className="space-y-6">
          {order.sellerOrders.map((so) => (
            <div key={so.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs text-slate-900">{so.sme.businessName}</span>
                  <span className="text-[10px] text-slate-500">({so.sme.location})</span>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Status: {so.status}
                </span>
              </div>

              {so.delivery && (
                <div className="p-3 bg-blue-50/50 border-b border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-blue-900">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    Delivery Ref: {so.delivery.deliveryReference}
                  </span>
                  <span>Rider Status: <strong>{so.delivery.status}</strong></span>
                </div>
              )}

              <div className="p-4 space-y-3">
                {order.orderItems
                  .filter((item) => item.sellerOrderId === so.id)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">{item.quantity}x</span>
                        <span className="text-slate-800">{item.productName}</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatCurrencyKES(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Destination & Payment Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" /> Destination
          </h3>
          <div className="text-xs space-y-1 text-slate-700">
            <div className="font-bold text-slate-900">{order.deliveryAddress?.recipientName || order.guestPhone}</div>
            <div>{order.deliveryAddress?.estateOrStreet}</div>
            <div>{order.deliveryAddress?.subCounty}, {order.deliveryAddress?.county}</div>
            <div className="text-slate-500 font-mono mt-1">Phone: {order.deliveryAddress?.phone || order.guestPhone}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Payment Summary
          </h3>
          <div className="text-xs space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <strong className="text-slate-900">{payment?.provider || "M-Pesa"}</strong>
            </div>
            {payment?.mpesaReceiptNumber && (
              <div className="flex justify-between">
                <span>M-Pesa Receipt:</span>
                <strong className="font-mono text-emerald-700">{payment.mpesaReceiptNumber}</strong>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
              <span>Total Paid:</span>
              <span>{formatCurrencyKES(Number(order.totalAmount))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
