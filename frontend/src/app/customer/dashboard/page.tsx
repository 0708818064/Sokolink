import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyKES, formatDate } from "@/lib/utils";
import {
  Package,
  Clock,
  ArrowRight,
  MapPin,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";


export default async function CustomerDashboardPage() {
  const session = await getSession();

  if (!session || (session.role !== "CUSTOMER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  // Fetch customer orders and addresses
  const [orders, addresses] = await Promise.all([
    prisma.order.findMany({
      where: session.role === "CUSTOMER" ? { customerId: session.userId } : {},
      include: {
        orderItems: true,
        sellerOrders: {
          include: { sme: true },
        },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: { isDefault: "desc" },
    }),
  ]);

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Customer Account
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">{session.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{session.email}</p>
        </div>

        <Link
          href="/products"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop Products</span>
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{orders.length}</div>
          <p className="text-[11px] text-slate-500">Placed on SokoLink</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
            <span className="text-xs font-bold text-emerald-700">KES</span>
          </div>
          <div className="text-2xl font-black text-emerald-800">{formatCurrencyKES(totalSpent)}</div>
          <p className="text-[11px] text-slate-500">Across verified SMEs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Saved Addresses</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{addresses.length}</div>
          <p className="text-[11px] text-slate-500">Delivery destinations</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Orders &amp; Deliveries</h2>
            <p className="text-xs text-slate-500">Track shipments and view details of your purchases</p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-emerald-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {o.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        o.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {o.fulfillmentStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    SMEs:{" "}
                    <strong>{o.sellerOrders.map((so) => so.sme.businessName).join(", ")}</strong> &bull;{" "}
                    {o.orderItems.length} items &bull; Placed {formatDate(o.createdAt)}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {o.deliveryAddress?.estateOrStreet}, {o.deliveryAddress?.subCounty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrencyKES(Number(o.totalAmount))}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      OTP: <code className="font-bold text-amber-600">{o.deliveryVerificationCode}</code>
                    </div>
                  </div>

                  <Link
                    href={`/track/${o.trackingToken}`}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            You haven&apos;t placed any orders yet. Browse our Kenyan SME catalog to find unique items!
          </div>
        )}
      </div>
    </div>
  );
}
