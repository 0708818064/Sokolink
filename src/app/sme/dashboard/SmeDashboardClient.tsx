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

export function SmeDashboardClient({ sme, categories, products: initialProducts, orders }: SmeClientProps) {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState(initialProducts);
  const [showAddModal, setShowAddModal] = useState(false);

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
                sme.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {sme.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Category: <strong className="text-slate-700">{sme.category}</strong> &bull; Merchant Rating: ★{" "}
            {sme.rating.toFixed(1)}
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
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

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
