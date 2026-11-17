"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrencyKES, formatDate } from "@/lib/utils";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Store,
  Clock,
  X,
  ExternalLink,
  Bike,
  Truck,
  Send,
  Star,
  MapPin,
  MessageSquare,
  Check,
  Phone,
  Lock,
  FileText,
  Building2,
  CreditCard,
  AlertCircle,
  User,
} from "lucide-react";

interface AvailableRider {
  id: string;
  name: string;
  phone: string | null;
  vehicleType: string;
  vehiclePlate: string;
  status: string;
  rating: number;
  completedOrders: number;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  subtotal: number;
  status: string;
  createdAt: string;
  recipientName: string;
  recipientPhone: string;
  dropoffAddress?: string;
  delivery?: {
    id: string;
    status: string;
    deliveryPersonId?: string | null;
  } | null;
  items: { name: string; quantity: number; price: number }[];
}

interface SmeClientProps {
  sme: {
    id: string;
    businessName: string;
    businessSlug: string;
    category: string;
    status: string;
    rating: number;
    totalRevenue: number;
    pendingOrdersCount: number;
    lowStockCount: number;
    // KYC Compliance fields
    kycStatus: string;
    idNumber?: string | null;
    idType?: string | null;
    taxPin?: string | null;
    registrationNumber?: string | null;
    mpesaPayoutNumber?: string | null;
    idDocUrl?: string | null;
    kraPinDocUrl?: string | null;
    businessPermitUrl?: string | null;
    kycSubmittedAt?: string | null;
    kycVerifiedAt?: string | null;
    kycNotes?: string | null;
    isVerified: boolean;
  };
  categories: { id: string; name: string }[];
  products: {
    id: string;
    name: string;
    sku: string;
    price: number;
    discountedPrice?: number | null;
    stock: number;
    lowStockThreshold: number;
    categoryName: string;
    imageUrl?: string;
    isActive: boolean;
    isApproved: boolean;
    ordersCount: number;
  }[];
  orders: OrderRow[];
}

export function SmeDashboardClient({ sme: initialSme, categories, products: initialProducts, orders }: SmeClientProps) {
  const [sme, setSme] = useState(initialSme);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "kyc">("products");
  const [products, setProducts] = useState(initialProducts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  // KYC Form State
  const [kycIdType, setKycIdType] = useState<"NATIONAL_ID" | "PASSPORT" | "ALIEN_ID">(
    (initialSme.idType as "NATIONAL_ID" | "PASSPORT" | "ALIEN_ID") || "NATIONAL_ID"
  );
  const [kycIdNumber, setKycIdNumber] = useState(initialSme.idNumber || "");
  const [kycTaxPin, setKycTaxPin] = useState(initialSme.taxPin || "");
  const [kycRegNumber, setKycRegNumber] = useState(initialSme.registrationNumber || "");
  const [kycMpesaPayout, setKycMpesaPayout] = useState(initialSme.mpesaPayoutNumber || "");
  const [kycIdDocUrl, setKycIdDocUrl] = useState(initialSme.idDocUrl || "");
  const [kycKraPinDocUrl, setKycKraPinDocUrl] = useState(initialSme.kraPinDocUrl || "");
  const [kycBusinessPermitUrl, setKycBusinessPermitUrl] = useState(initialSme.businessPermitUrl || "");
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycError, setKycError] = useState("");
  const [kycSuccess, setKycSuccess] = useState("");

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError("");
    setKycSuccess("");
    setSubmittingKyc(true);

    try {
      const res = await fetch("/api/sme/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idType: kycIdType,
          idNumber: kycIdNumber,
          taxPin: kycTaxPin,
          registrationNumber: kycRegNumber,
          mpesaPayoutNumber: kycMpesaPayout,
          idDocUrl: kycIdDocUrl,
          kraPinDocUrl: kycKraPinDocUrl,
          businessPermitUrl: kycBusinessPermitUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit KYC");
      }

      setSme((prev) => ({
        ...prev,
        kycStatus: "PENDING",
        idType: kycIdType,
        idNumber: kycIdNumber,
        taxPin: kycTaxPin,
        registrationNumber: kycRegNumber,
        mpesaPayoutNumber: kycMpesaPayout,
        idDocUrl: kycIdDocUrl,
        kraPinDocUrl: kycKraPinDocUrl,
        businessPermitUrl: kycBusinessPermitUrl,
        kycSubmittedAt: new Date().toISOString(),
      }));

      setKycSuccess("KYC verification documents submitted successfully! Admin review usually takes 12-24 hours.");
      setTimeout(() => {
        setShowKycModal(false);
        setKycSuccess("");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting KYC";
      setKycError(msg);
    } finally {
      setSubmittingKyc(false);
    }
  };

  // Dispatch state
  const [orderList, setOrderList] = useState<OrderRow[]>(orders);
  const [dispatchModal, setDispatchModal] = useState<{
    isOpen: boolean;
    order: OrderRow | null;
  }>({ isOpen: false, order: null });
  const [availableRiders, setAvailableRiders] = useState<AvailableRider[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [assigningRider, setAssigningRider] = useState(false);
  const [dispatchError, setDispatchError] = useState("");
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState<string | null>(null);

  const openDispatchModal = async (order: OrderRow) => {
    setDispatchModal({ isOpen: true, order });
    setDispatchError("");
    setLoadingRiders(true);
    try {
      const res = await fetch("/api/sme/available-riders");
      const data = await res.json();
      if (res.ok && data.riders) {
        setAvailableRiders(data.riders);
        if (data.riders.length > 0) {
          setSelectedRiderId(data.riders[0].id);
        }
      } else {
        setDispatchError(data.error || "Could not retrieve available couriers");
      }
    } catch {
      setDispatchError("Network error loading couriers.");
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModal.order || !selectedRiderId) return;
    setAssigningRider(true);
    setDispatchError("");
    try {
      const res = await fetch("/api/sme/orders/assign-rider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerOrderId: dispatchModal.order.id,
          riderId: selectedRiderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDispatchError(data.error || "Failed to dispatch order");
        return;
      }

      setOrderList((prev) =>
        prev.map((o) =>
          o.id === dispatchModal.order!.id
            ? {
                ...o,
                status: "READY_FOR_PICKUP",
                delivery: o.delivery
                  ? { ...o.delivery, status: "ASSIGNED", deliveryPersonId: selectedRiderId }
                  : { id: "new", status: "ASSIGNED", deliveryPersonId: selectedRiderId },
              }
            : o
        )
      );

      const assignedRider = availableRiders.find((r) => r.id === selectedRiderId);
      setDispatchModal({ isOpen: false, order: null });
      setDispatchSuccessToast(
        `Package assigned to courier ${assignedRider?.name || "Rider"} (${assignedRider?.vehiclePlate || "Courier"})! Transactional SMS with live tracking sent to customer.`
      );
      setTimeout(() => setDispatchSuccessToast(null), 6000);
    } catch {
      setDispatchError("Network error assigning courier.");
    } finally {
      setAssigningRider(false);
    }
  };

  // New product form
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    try {
      const res = await fetch("/api/sme/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          sku,
          price,
          discountedPrice: discountedPrice || undefined,
          stock,
          imageUrl: imageUrl || undefined,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.requiresKyc) {
          setShowAddModal(false);
          setShowKycModal(true);
          setKycError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to create product");
      }

      // Add to list
      const cat = categories.find((c) => c.id === categoryId);
      setProducts([
        {
          id: data.product.id,
          name: data.product.name,
          sku: data.product.sku,
          price: Number(data.product.price),
          discountedPrice: data.product.discountedPrice ? Number(data.product.discountedPrice) : null,
          stock: data.product.stock,
          lowStockThreshold: data.product.lowStockThreshold || 5,
          categoryName: cat?.name || "General",
          imageUrl: imageUrl || undefined,
          isActive: true,
          isApproved: true,
          ordersCount: 0,
        },
        ...products,
      ]);

      setShowAddModal(false);
      // Reset form
      setName("");
      setSku("");
      setPrice("");
      setDiscountedPrice("");
      setImageUrl("");
      setDescription("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating product";
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{sme.businessName}</h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                sme.isVerified
                  ? "bg-emerald-100 text-emerald-800"
                  : sme.kycStatus === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {sme.isVerified ? "Verified Merchant" : `KYC: ${sme.kycStatus || "PENDING"}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Category: <strong className="text-slate-700">{sme.category}</strong> &bull; Merchant Rating: ★{" "}
            {sme.rating.toFixed(1)} &bull; Settlement:{" "}
            <span className="font-mono text-slate-700 font-semibold">{sme.mpesaPayoutNumber || "M-Pesa Pending"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/sellers/${sme.businessSlug}`}
            target="_blank"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Storefront</span>
          </Link>
          {sme.isVerified ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          ) : (
            <button
              onClick={() => setShowKycModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Add Product (KYC Required)</span>
            </button>
          )}
        </div>
      </div>

      {/* KYC Compliance Status Banner */}
      {!sme.isVerified ? (
        <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/80 border border-amber-200/80 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>KYC Compliance Verification Required</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900">
                    {sme.kycStatus === "REJECTED" ? "Action Required" : "Listing Locked"}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  In accordance with Kenyan merchant trade regulations, complete your seller identity and business compliance to unlock product listing and active public catalog visibility.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowKycModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{sme.kycSubmittedAt ? "View / Update KYC Status" : "Complete KYC Verification"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sme.idNumber ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-slate-700">
                National ID: <strong>{sme.idNumber ? "Provided" : "Pending"}</strong>
              </span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sme.taxPin ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-slate-700">
                KRA PIN: <strong>{sme.taxPin ? "Provided" : "Pending"}</strong>
              </span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sme.mpesaPayoutNumber ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-slate-700">
                M-Pesa Payout: <strong>{sme.mpesaPayoutNumber ? "Connected" : "Pending"}</strong>
              </span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-700">
                Review: <strong>12-24 Hours</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                  Verified Kenyan Merchant (KYC Approved)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  Active Store
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Full catalogue publishing and priority M-Pesa automated disbursements active.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("kyc")}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline px-3 py-1 cursor-pointer hidden sm:block"
          >
            Compliance Details &rarr;
          </button>
        </div>
      )}

      {/* Success Notification Toast */}
      {dispatchSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md transition animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{dispatchSuccessToast}</span>
          </div>
          <button
            onClick={() => setDispatchSuccessToast(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrencyKES(sme.totalRevenue)}</div>
          <p className="text-[11px] text-slate-500">Total processed revenue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{sme.pendingOrdersCount}</div>
          <p className="text-[11px] text-slate-500">Requires preparation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Listed Products</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{products.length}</div>
          <p className="text-[11px] text-slate-500">Active catalogue items</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{sme.lowStockCount}</div>
          <p className="text-[11px] text-slate-500">At or below threshold</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === "products"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Product Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "orders"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Customer Orders</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "orders" ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {orderList.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("kyc")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "kyc"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>KYC &amp; Verification</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold uppercase ${
              sme.isVerified
                ? activeTab === "kyc"
                  ? "bg-emerald-800 text-white"
                  : "bg-emerald-100 text-emerald-800"
                : activeTab === "kyc"
                ? "bg-amber-800 text-white"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {sme.isVerified ? "Verified" : "Pending"}
          </span>
        </button>
      </div>

      {/* Tab 1: Products Table */}
      {activeTab === "products" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (KES)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                        )}
                        <span className="font-bold text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3.5 px-4">{p.categoryName}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-800">
                      {formatCurrencyKES(p.discountedPrice ?? p.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                          p.stock <= p.lowStockThreshold
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Orders Table */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer &amp; Phone</th>
                  <th className="py-3.5 px-4">Delivery Location</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Payout (KES)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Courier Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orderList.map((o) => {
                  const isDispatched =
                    o.status === "READY_FOR_PICKUP" ||
                    o.status === "IN_TRANSIT" ||
                    o.status === "DELIVERED";

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {o.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(o.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{o.recipientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{o.recipientPhone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex items-start gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{o.dropoffAddress || "Nairobi Metro"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {o.items.map((i, idx) => (
                          <div key={idx} className="truncate max-w-[180px]">
                            {i.quantity}x {i.name}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        {formatCurrencyKES(o.subtotal)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            o.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : isDispatched
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isDispatched ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Courier Assigned (SMS Sent)</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => openDispatchModal(o)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Dispatch Courier</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orderList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No orders received yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When buyers purchase your items, customer delivery details and dispatch controls will appear here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: KYC & Regulatory Compliance Center */}
      {activeTab === "kyc" && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-sm ${
              sme.isVerified
                ? "bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white border-emerald-800"
                : "bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white border-amber-800/80"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3.5 rounded-2xl ${
                    sme.isVerified ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black">
                      {sme.isVerified
                        ? "Merchant Identity & Business KYC Verified"
                        : "Seller KYC Compliance Under Review"}
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        sme.isVerified
                          ? "bg-emerald-500/30 text-emerald-300"
                          : "bg-amber-500/30 text-amber-300"
                      }`}
                    >
                      {sme.isVerified ? "Approved" : sme.kycStatus || "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {sme.isVerified
                      ? "Your enterprise has been fully authenticated in compliance with Kenyan trade guidelines. Product listings and instant automated M-Pesa escrow settlements are fully unlocked."
                      : "Your identification, KRA PIN, and enterprise credentials have been submitted and are being reviewed by the SokoLink compliance team (12-24 hrs turnaround). Product listings are temporarily locked until approved."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowKycModal(true)}
                className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Update KYC Details</span>
              </button>
            </div>
          </div>

          {/* KYC Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity & Legal Information */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Authorized Representative &amp; Legal Identity</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Document Type</span>
                  <span className="font-semibold text-slate-800">
                    {sme.idType === "PASSPORT"
                      ? "Kenyan Passport"
                      : sme.idType === "ALIEN_ID"
                      ? "Alien ID / Work Permit"
                      : "Kenyan National ID"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">National ID / Passport Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {sme.idNumber || <span className="text-amber-600 italic">Not provided</span>}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">KRA Tax PIN</span>
                  <span className="font-mono font-bold text-slate-900">
                    {sme.taxPin || <span className="text-amber-600 italic">Not provided</span>}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Identity Scan Link</span>
                  {sme.idDocUrl ? (
                    <a
                      href={sme.idDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>View Uploaded Scan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">None attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Enterprise & Settlement Information */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Enterprise Registration &amp; Settlements</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Business Registration Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {sme.registrationNumber || <span className="text-slate-400 italic">Optional / Sole Trader</span>}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">M-Pesa Payout Account</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {sme.mpesaPayoutNumber || "Phone Account"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">KRA PIN Certificate Link</span>
                  {sme.kraPinDocUrl ? (
                    <a
                      href={sme.kraPinDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>View KRA Certificate</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">None attached</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Submission Timestamp</span>
                  <span className="text-slate-600">
                    {sme.kycSubmittedAt ? formatDate(sme.kycSubmittedAt) : "Initial Onboarding"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interactive KYC Submission & Update */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Seller KYC Compliance Verification</h3>
                  <p className="text-xs text-slate-400">Required before listing products on SokoLink</p>
                </div>
              </div>
              <button
                onClick={() => setShowKycModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Why is KYC required?</strong> To protect buyers and ensure authentic multi-vendor commerce under Kenyan consumer protection guidelines, verified identification and KRA PIN are mandatory to publish products.
              </p>
            </div>

            {kycError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{kycError}</span>
              </div>
            )}

            {kycSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{kycSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ID Document Type *</label>
                  <select
                    value={kycIdType}
                    onChange={(e) => setKycIdType(e.target.value as "NATIONAL_ID" | "PASSPORT" | "ALIEN_ID")}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="ALIEN_ID">Alien ID</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">National ID / Passport Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12345678"
                    value={kycIdNumber}
                    onChange={(e) => setKycIdNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">KRA Tax PIN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P051234567X"
                    value={kycTaxPin}
                    onChange={(e) => setKycTaxPin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Registration / BN / PVT</label>
                  <input
                    type="text"
                    placeholder="e.g. BN-2024/0987"
                    value={kycRegNumber}
                    onChange={(e) => setKycRegNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">M-Pesa Settlement / Payout Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+254 712 345 678 or Till 654321"
                  value={kycMpesaPayout}
                  onChange={(e) => setKycMpesaPayout(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="font-bold text-slate-700 block">Verification Document Links (Cloud or Drive)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    placeholder="National ID Scan Link"
                    value={kycIdDocUrl}
                    onChange={(e) => setKycIdDocUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <input
                    type="url"
                    placeholder="KRA Certificate Scan Link"
                    value={kycKraPinDocUrl}
                    onChange={(e) => setKycKraPinDocUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingKyc ? (
                    <span>Submitting KYC...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Add New SME Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{formError}</div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Sisal Kiondo Bag"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KND-002"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    required
                    placeholder="3500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount Price</label>
                  <input
                    type="number"
                    placeholder="2999"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Units *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe material, Kenyan provenance, features, warranty..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  {creating ? "Saving..." : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Dispatch Order to Courier */}
      {dispatchModal.isOpen && dispatchModal.order && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Dispatch Package to Courier
                </h3>
              </div>
              <button
                onClick={() => setDispatchModal({ isOpen: false, order: null })}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dispatchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            {/* Order Destination & Customer Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-slate-800">
                  {dispatchModal.order.orderNumber}
                </span>
                <span className="font-bold text-emerald-800">
                  Payout: {formatCurrencyKES(dispatchModal.order.subtotal)}
                </span>
              </div>
              <div className="text-slate-600">
                Customer: <strong>{dispatchModal.order.recipientName}</strong> &bull; Tel:{" "}
                <span className="font-mono">{dispatchModal.order.recipientPhone}</span>
              </div>
              <div className="flex items-start gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Destination: {dispatchModal.order.dropoffAddress || "Nairobi"}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                Items:{" "}
                {dispatchModal.order.items
                  .map((it) => `${it.quantity}x ${it.name}`)
                  .join(", ")}
              </div>
            </div>

            {/* Real-time SMS Alert Preview */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-950">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Automated Buyer SMS Preview</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800 bg-white p-2.5 rounded-lg border border-blue-100 font-sans">
                &ldquo;Hello {dispatchModal.order.recipientName}, your order from {sme.businessName} has been assigned to courier{" "}
                <strong>
                  {availableRiders.find((r) => r.id === selectedRiderId)?.name || "Courier"}
                </strong>{" "}
                (
                {availableRiders.find((r) => r.id === selectedRiderId)?.vehiclePlate || "Motorcycle"}
                ). Track your parcel live: sokolink.co.ke/track/...&rdquo;
              </p>
            </div>

            {/* Courier Selection List */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Select Available Kenyan Courier:
              </label>

              {loadingRiders ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Scanning active couriers nearby...
                </div>
              ) : availableRiders.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {availableRiders.map((r) => {
                    const isSelected = selectedRiderId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRiderId(r.id)}
                        className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/60 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Bike className="w-4 h-4" />
                          </div>
                          <div className="text-xs">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{r.name}</span>
                              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                                {r.vehiclePlate}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {r.vehicleType} &bull; {r.phone || "On File"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <div className="text-amber-500 font-bold flex items-center gap-0.5 justify-end">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{r.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {r.completedOrders} delivered
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No online couriers found. Admin will dispatch as soon as a courier comes online.
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDispatchModal({ isOpen: false, order: null })}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assigningRider || !selectedRiderId || availableRiders.length === 0}
                onClick={handleConfirmDispatch}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                {assigningRider ? (
                  <span>Dispatching &amp; Sending SMS...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch &amp; Alert Buyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
