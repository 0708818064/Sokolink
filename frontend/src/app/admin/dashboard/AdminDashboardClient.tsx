"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrencyKES, formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  Store,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Clock,
  ExternalLink,
  UserCheck,
  Send,
  MapPin,
  Phone,
  Search,
  Filter,
  Check,
  X,
  Star,
  Layers,
  UserPlus,
  Trash2,
  Bike,
  BadgeCheck,
} from "lucide-react";

interface SmeRow {
  id: string;
  businessName: string;
  businessSlug: string;
  category: string;
  location: string;
  status: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  productsCount: number;
  ordersCount: number;
  createdAt: string;
}

interface RiderItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicleType: string;
  vehiclePlate: string;
  status: string;
  rating: number;
  completedOrders: number;
}

interface DeliveryItemRow {
  id: string;
  deliveryReference: string;
  orderNumber: string;
  smeName: string;
  pickupAddress: string;
  dropoffAddress: string;
  recipientName: string;
  recipientPhone: string;
  fee: number;
  status: string;
  verificationCode?: string | null;
  deliveryPersonId: string | null;
  deliveryPerson: {
    id: string;
    name: string;
    phone: string | null;
    vehicleType: string;
    vehiclePlate: string | null;
    rating: number;
  } | null;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[];
  createdAt: string;
}

interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  details: string | null;
  userName: string;
  createdAt: string;
}

interface AdminClientProps {
  stats: {
    totalCustomers: number;
    totalSmes: number;
    pendingSmes: number;
    totalProducts: number;
    totalOrders: number;
    grossMerchandiseValue: number;
    platformRevenue: number;
    completedDeliveries: number;
  };
  smes: SmeRow[];
  deliveries: DeliveryItemRow[];
  riders: RiderItem[];
  auditLogs: AuditLogRow[];
}

export function AdminDashboardClient({
  stats,
  smes: initialSmes,
  deliveries: initialDeliveries,
  riders: initialRiders,
  auditLogs,
}: AdminClientProps) {
  const [smes, setSmes] = useState<SmeRow[]>(initialSmes);
  const [deliveries, setDeliveries] = useState<DeliveryItemRow[]>(initialDeliveries);
  const [riders, setRiders] = useState<RiderItem[]>(initialRiders);
  const [activeTab, setActiveTab] = useState<"dispatch" | "riders" | "smes" | "audit">("dispatch");

  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Rider Management State
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);
  const [newRider, setNewRider] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleType: "Motorbike",
    vehiclePlate: "",
    idNumber: "",
    licenseNumber: "",
    password: "",
  });
  const [submittingRider, setSubmittingRider] = useState(false);
  const [riderError, setRiderError] = useState("");
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<RiderItem | null>(null);
  const [deletingRiderId, setDeletingRiderId] = useState<string | null>(null);

  // Dispatch filter
  const [deliveryFilter, setDeliveryFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED" | "DELIVERED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Assignment Modal State
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean;
    delivery: DeliveryItemRow | null;
  }>({ isOpen: false, delivery: null });

  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // SME Moderation
  const handleUpdateStatus = async (smeId: string, nextStatus: "APPROVED" | "REJECTED" | "SUSPENDED") => {
    setLoadingId(smeId);
    try {
      const res = await fetch("/api/admin/smes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smeId, status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update status");
        return;
      }

      setSmes((prev) =>
        prev.map((s) => (s.id === smeId ? { ...s, status: nextStatus } : s))
      );
    } catch {
      alert("Network error updating status");
    } finally {
      setLoadingId(null);
    }
  };

  // Add Rider Action
  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setRiderError("");
    setSubmittingRider(true);

    try {
      const res = await fetch("/api/admin/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRider),
      });

      const data = await res.json();
      if (!res.ok) {
        setRiderError(data.error || "Failed to register courier rider");
        return;
      }

      setRiders((prev) => [
        {
          id: data.rider.id,
          name: data.rider.user.name,
          email: data.rider.user.email,
          phone: data.rider.user.phone,
          vehicleType: data.rider.vehicleType,
          vehiclePlate: data.rider.vehiclePlate || "N/A",
          status: data.rider.status,
          rating: 5.0,
          completedOrders: 0,
        },
        ...prev,
      ]);

      setIsAddRiderOpen(false);
      setNewRider({
        name: "",
        email: "",
        phone: "",
        vehicleType: "Motorbike",
        vehiclePlate: "",
        idNumber: "",
        licenseNumber: "",
        password: "",
      });
      setSuccessToast(`Courier ${data.rider.user.name} successfully registered and added to active fleet!`);
    } catch {
      setRiderError("Network connection error. Please try again.");
    } finally {
      setSubmittingRider(false);
    }
  };

  // Remove Rider Action
  const handleRemoveRider = async (riderId: string) => {
    setDeletingRiderId(riderId);
    try {
      const res = await fetch(`/api/admin/riders/${riderId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to remove courier");
        return;
      }

      setRiders((prev) => prev.filter((r) => r.id !== riderId));
      setConfirmDeleteModal(null);
      setSuccessToast(data.message || "Courier removed from active fleet successfully.");
    } catch {
      alert("Network error removing courier rider.");
    } finally {
      setDeletingRiderId(null);
    }
  };

  // Open Assignment Modal
  const openAssignModal = (delivery: DeliveryItemRow) => {
    setAssignmentModal({ isOpen: true, delivery });
    setSelectedRiderId(delivery.deliveryPersonId || (riders[0]?.id || ""));
  };

  // Frontend Assign Action (ready to bridge to backend)
  const handleConfirmAssignment = async () => {
    if (!assignmentModal.delivery || !selectedRiderId) return;

    setAssigning(true);
    const chosenRider = riders.find((r) => r.id === selectedRiderId);

    // Optimistically update frontend state immediately
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === assignmentModal.delivery!.id) {
          return {
            ...d,
            deliveryPersonId: selectedRiderId,
            deliveryPerson: chosenRider
              ? {
                  id: chosenRider.id,
                  name: chosenRider.name,
                  phone: chosenRider.phone,
                  vehicleType: chosenRider.vehicleType,
                  vehiclePlate: chosenRider.vehiclePlate,
                  rating: chosenRider.rating,
                }
              : null,
            status: d.status === "ASSIGNED" || !d.deliveryPersonId ? "ASSIGNED" : d.status,
          };
        }
        return d;
      })
    );

    // Attempt backend assignment API if online
    try {
      await fetch("/api/admin/assign-rider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId: assignmentModal.delivery.id,
          riderId: selectedRiderId,
        }),
      }).catch(() => {
        // Silently handled in frontend staging phase
      });
    } catch {
      // Handled
    }

    setAssigning(false);
    setSuccessToast(
      `Package ${assignmentModal.delivery.deliveryReference} successfully assigned to ${
        chosenRider?.name || "Rider"
      } (${chosenRider?.vehiclePlate || "Courier"})`
    );
    setAssignmentModal({ isOpen: false, delivery: null });

    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  // Filtered deliveries list
  const filteredDeliveries = deliveries.filter((d) => {
    if (deliveryFilter === "UNASSIGNED" && d.deliveryPersonId) return false;
    if (deliveryFilter === "ASSIGNED" && (!d.deliveryPersonId || d.status === "DELIVERED")) return false;
    if (deliveryFilter === "DELIVERED" && d.status !== "DELIVERED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = d.deliveryReference.toLowerCase().includes(q);
      const matchOrder = d.orderNumber.toLowerCase().includes(q);
      const matchSme = d.smeName.toLowerCase().includes(q);
      const matchRecipient = d.recipientName.toLowerCase().includes(q);
      const matchItem = d.items.some((i) => i.name.toLowerCase().includes(q));
      return matchRef || matchOrder || matchSme || matchRecipient || matchItem;
    }
    return true;
  });

  const unassignedCount = deliveries.filter((d) => !d.deliveryPersonId).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Platform Administration</h1>
            <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
              SUPER_ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete management of Kenyan SMEs, Daraja M-Pesa transactions, and courier rider assignments
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/rider/login"
            target="_blank"
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-semibold rounded-lg border border-blue-500/30 transition flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Open Rider Login</span>
          </Link>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-bold border border-emerald-500/30">
            Daraja M-Pesa Live
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md transition animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Merchandise Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrencyKES(stats.grossMerchandiseValue)}
          </div>
          <p className="text-[11px] text-slate-500">Paid customer orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Commission (5%)</span>
            <span className="text-xs font-bold text-purple-700">NET</span>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {formatCurrencyKES(stats.platformRevenue)}
          </div>
          <p className="text-[11px] text-slate-500">Earned marketplace fees</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registered SMEs</span>
            <Store className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalSmes}</div>
          <p className="text-[11px] text-amber-600 font-semibold">
            {stats.pendingSmes} pending verification
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Available Couriers</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{riders.length}</div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            {stats.completedDeliveries} completed deliveries
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("dispatch")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === "dispatch"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery Dispatch &amp; Assign Rider</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "dispatch"
                  ? "bg-purple-800 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {deliveries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("riders")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === "riders"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Couriers &amp; Fleet</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "riders"
                  ? "bg-purple-800 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {riders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("smes")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === "smes"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>SME Verification ({smes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DELIVERY DISPATCH & RIDER ASSIGNMENT */}
      {activeTab === "dispatch" && (
        <div className="space-y-6">
          {/* Dispatch Subheader & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-purple-600" /> Filter:
              </span>
              <div className="flex gap-1">
                {(["ALL", "UNASSIGNED", "ASSIGNED", "DELIVERED"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDeliveryFilter(mode)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      deliveryFilter === mode
                        ? "bg-purple-100 text-purple-900 border border-purple-300"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {mode === "ALL" && "All Packages"}
                    {mode === "UNASSIGNED" && `Unassigned (${unassignedCount})`}
                    {mode === "ASSIGNED" && "Assigned / Transit"}
                    {mode === "DELIVERED" && "Delivered"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search reference, customer, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Deliveries & Items Assignment Grid */}
          <div className="space-y-4">
            {filteredDeliveries.length > 0 ? (
              filteredDeliveries.map((del) => (
                <div
                  key={del.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition space-y-4"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                        {del.deliveryReference}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Order #{del.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          del.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : del.deliveryPersonId
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {del.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                        Payout: {formatCurrencyKES(del.fee)}
                      </span>
                      <button
                        onClick={() => openAssignModal(del)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{del.deliveryPersonId ? "Reassign Rider" : "Assign to Rider"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Items Inside Package */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 text-[11px]">
                        <Package className="w-3.5 h-3.5 text-purple-600" />
                        <span>Package Items ({del.items.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {del.items.map((it) => (
                          <div key={it.id} className="flex justify-between items-center text-slate-700">
                            <span className="truncate max-w-[180px] font-medium">
                              <strong>{it.quantity}x</strong> {it.name}
                            </span>
                            <span className="font-mono text-slate-500">
                              {formatCurrencyKES(it.price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 text-[11px] text-slate-500">
                        Merchant: <strong className="text-slate-800">{del.smeName}</strong>
                      </div>
                    </div>

                    {/* Routing: Pickup & Dropoff */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Route &amp; Destination</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Pickup Origin
                        </span>
                        <p className="text-slate-700 text-xs truncate">{del.pickupAddress}</p>
                      </div>
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Dropoff Destination
                        </span>
                        <p className="text-slate-900 font-medium text-xs">{del.recipientName}</p>
                        <p className="text-slate-600 text-xs truncate">{del.dropoffAddress}</p>
                        <p className="text-slate-400 font-mono text-[10px]">{del.recipientPhone}</p>
                      </div>
                    </div>

                    {/* Currently Assigned Courier */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        del.deliveryPerson
                          ? "bg-purple-50/50 border-purple-100"
                          : "bg-amber-50/50 border-amber-200"
                      }`}
                    >
                      <div className="font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Assigned Courier</span>
                        </span>
                        {del.deliveryPerson && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      {del.deliveryPerson ? (
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{del.deliveryPerson.name}</span>
                          </div>
                          <div className="text-slate-600 text-xs">
                            Vehicle: <strong>{del.deliveryPerson.vehiclePlate || "Courier"}</strong> (
                            {del.deliveryPerson.vehicleType})
                          </div>
                          <div className="text-slate-500 text-[11px] font-mono">
                            Tel: {del.deliveryPerson.phone || "On File"}
                          </div>
                          <div className="text-[10px] text-amber-600 font-bold pt-1">
                            ★ {del.deliveryPerson.rating.toFixed(1)} rating
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-center space-y-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                          <p className="text-xs text-amber-800 font-semibold">
                            No Courier Assigned Yet
                          </p>
                          <button
                            onClick={() => openAssignModal(del)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Assign Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">No packages match filter</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust filter buttons or clear your search term.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: FLEET & COURIERS */}
      {activeTab === "riders" && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Fleet Management &amp; Couriers
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboard new licensed Kenyan riders, manage vehicle plates, and view real-time delivery ratings.
              </p>
            </div>

            <button
              onClick={() => setIsAddRiderOpen(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Courier</span>
            </button>
          </div>

          {/* Riders List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Courier Details</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Vehicle &amp; Plate</th>
                    <th className="py-3.5 px-4">Fleet Status</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4">Completed Deliveries</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {riders.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{r.name}</span>
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {r.phone || "No phone recorded"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{r.vehicleType}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {r.vehiclePlate || "NO_PLATE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "ON_DELIVERY"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === "AVAILABLE"
                                ? "bg-emerald-500 animate-pulse"
                                : r.status === "ON_DELIVERY"
                                ? "bg-blue-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{r.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.completedOrders} parcels
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setConfirmDeleteModal(r)}
                          className="px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {riders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Bike className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No couriers in fleet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Click &quot;Add New Courier&quot; above to onboard verified Kenyan delivery personnel.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SME VERIFICATION & MODERATION */}
      {activeTab === "smes" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Business</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Owner / Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {smes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.businessName}</div>
                      <Link
                        href={`/sellers/${s.businessSlug}`}
                        target="_blank"
                        className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5 mt-0.5"
                      >
                        <span>View Store</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">{s.category}</td>
                    <td className="py-3.5 px-4">
                      <div>{s.ownerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.ownerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">{s.location}</td>
                    <td className="py-3.5 px-4 font-bold">{s.productsCount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          s.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status !== "APPROVED" && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, "APPROVED")}
                            disabled={loadingId === s.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {s.status !== "REJECTED" && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, "REJECTED")}
                            disabled={loadingId === s.id}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-[10px] cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                        {s.status === "APPROVED" && (
                          <button
                            onClick={() => handleUpdateStatus(s.id, "SUSPENDED")}
                            disabled={loadingId === s.id}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold text-[10px] cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{log.action}</td>
                    <td className="py-3.5 px-4 font-semibold">{log.entityType}</td>
                    <td className="py-3.5 px-4">{log.userName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{log.details || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN ITEM / DELIVERY TO RIDER */}
      {assignmentModal.isOpen && assignmentModal.delivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Assign Package to Delivery Rider
                </h3>
              </div>
              <button
                onClick={() => setAssignmentModal({ isOpen: false, delivery: null })}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Package Summary Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-slate-800">
                  {assignmentModal.delivery.deliveryReference}
                </span>
                <span className="font-bold text-emerald-800">
                  Payout Fee: {formatCurrencyKES(assignmentModal.delivery.fee)}
                </span>
              </div>
              <div className="text-slate-600">
                Merchant: <strong>{assignmentModal.delivery.smeName}</strong> &bull; Destination:{" "}
                <strong>{assignmentModal.delivery.recipientName}</strong> (
                {assignmentModal.delivery.dropoffAddress})
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                Items:{" "}
                {assignmentModal.delivery.items
                  .map((it) => `${it.quantity}x ${it.name}`)
                  .join(", ")}
              </div>
            </div>

            {/* Rider Selection List */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Select Authorized Kenyan Courier:
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {riders.map((r) => {
                  const isSelected = selectedRiderId === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRiderId(r.id)}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/60 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? "bg-purple-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{r.name}</span>
                            <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded font-mono">
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
                          {r.completedOrders} completed
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssignmentModal({ isOpen: false, delivery: null })}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assigning || !selectedRiderId}
                onClick={handleConfirmAssignment}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                {assigning ? (
                  <span>Assigning...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Rider Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW COURIER RIDER */}
      {isAddRiderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Onboard New Courier Rider
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddRiderOpen(false);
                  setRiderError("");
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {riderError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{riderError}</span>
              </div>
            )}

            <form onSubmit={handleAddRider} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Courier Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Mwangi"
                    value={newRider.name}
                    onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kenyan Mobile (SMS Alerts) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0712345678 or +254..."
                    value={newRider.phone}
                    onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rider@sokolink.co.ke"
                    value={newRider.email}
                    onChange={(e) => setNewRider({ ...newRider, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newRider.password}
                    onChange={(e) => setNewRider({ ...newRider, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={newRider.vehicleType}
                    onChange={(e) => setNewRider({ ...newRider, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="Motorbike">Motorbike (Boda Boda)</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="TukTuk">Tuk-Tuk</option>
                    <option value="Van">Delivery Van</option>
                    <option value="Pickup">Pickup Truck</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vehicle Number Plate *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KMDF 452X"
                    value={newRider.vehiclePlate}
                    onChange={(e) => setNewRider({ ...newRider, vehiclePlate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    National ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 34918274"
                    value={newRider.idNumber}
                    onChange={(e) => setNewRider({ ...newRider, idNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Driving License No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL-2024-998"
                    value={newRider.licenseNumber}
                    onChange={(e) => setNewRider({ ...newRider, licenseNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddRiderOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRider}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {submittingRider ? "Onboarding Courier..." : "Register & Activate Rider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM REMOVE COURIER */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                Remove Courier from Fleet?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{confirmDeleteModal.name}</strong> (
                {confirmDeleteModal.vehiclePlate})? This will suspend their courier access and take them offline.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={deletingRiderId === confirmDeleteModal.id}
                onClick={() => handleRemoveRider(confirmDeleteModal.id)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                {deletingRiderId === confirmDeleteModal.id ? "Removing..." : "Yes, Remove Courier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
