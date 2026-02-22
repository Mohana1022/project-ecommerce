import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, Package, Warehouse, Truck, Box,
    ArrowLeft, Calendar, Clock, MapPin, User,
    RefreshCw, AlertCircle, Star, Phone, FileText
} from "lucide-react";
import { getOrderTracking } from "../../api/axios";
import { generateInvoice } from "../../utils/invoiceGenerator";

// ─── Lifecycle step definitions ───────────────────────────────────────────────
const LIFECYCLE_STEPS = [
    { id: "pending", label: "Order Placed", icon: CheckCircle, desc: "Your order has been received and is awaiting vendor review." },
    { id: "approved", label: "Approved", icon: CheckCircle, desc: "Vendor has accepted your order and will begin preparing it." },
    { id: "packed", label: "Packed", icon: Package, desc: "Your order is packed and a delivery agent is being assigned." },
    { id: "delivery_assigned", label: "Agent Assigned", icon: Truck, desc: "A delivery agent has been assigned and will pick up your order soon." },
    { id: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Your package is on its way. Hang tight!" },
    { id: "nearby", label: "Almost There!", icon: MapPin, desc: "Your delivery agent is nearby. Check your email/SMS for the OTP." },
    { id: "delivered", label: "Delivered", icon: CheckCircle, desc: "Your order has been delivered successfully. Enjoy!" },
];

// Legacy / alternate statuses mapped to best-fit step
const STATUS_INDEX_MAP = {
    pending: 0,
    confirmed: 1,
    approved: 1,
    packed: 2,
    delivery_assigned: 3,
    shipping: 4,
    out_for_delivery: 4,
    nearby: 5,
    delivered: 6,
    rejected: -1,
    cancelled: -1,
    returned: -1,
};

const getStepIndex = (status) => {
    const v = STATUS_INDEX_MAP[status];
    return typeof v === "number" ? v : 0;
};

const isTerminalBad = (status) => ["rejected", "cancelled", "returned"].includes(status);

// ─── OTP Banner ───────────────────────────────────────────────────────────────
function OTPBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-orange-400/20"
        >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">🔐</div>
            <div>
                <p className="font-black text-base">Delivery Agent is Nearby!</p>
                <p className="text-orange-100 text-sm font-medium mt-0.5">
                    Check your email for your one-time delivery OTP. Share it with the agent only upon receiving your package.
                </p>
            </div>
        </motion.div>
    );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent }) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={12} /> Delivery Agent
            </p>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                    {agent.name?.charAt(0) || "D"}
                </div>
                <div className="flex-1">
                    <p className="font-black text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-400 font-medium capitalize">{agent.vehicle} {agent.vehicle_number && `· ${agent.vehicle_number}`}</p>
                </div>
                {agent.rating > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="font-black text-amber-600 text-xs">{Number(agent.rating).toFixed(1)}</span>
                    </div>
                )}
            </div>
            {agent.phone && (
                <a
                    href={`tel:${agent.phone}`}
                    className="mt-4 flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-800"
                >
                    <Phone size={14} /> {agent.phone}
                </a>
            )}
        </div>
    );
}

// ─── Status History Timeline ──────────────────────────────────────────────────
function StatusHistory({ history }) {
    if (!history?.length) return null;
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Clock size={12} /> Status History
            </p>
            <div className="space-y-4">
                {[...history].reverse().map((h, i) => (
                    <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-violet-600" : "bg-gray-300"}`} />
                            {i < history.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-1" />}
                        </div>
                        <div className="pb-4">
                            <p className="font-black text-gray-900 text-sm capitalize">{h.status.replace(/_/g, " ")}</p>
                            {h.notes && <p className="text-gray-400 text-xs font-medium mt-0.5">{h.notes}</p>}
                            <p className="text-gray-300 text-[10px] font-medium mt-1">
                                {new Date(h.timestamp).toLocaleString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit"
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderTracking = () => {
    const { orderNumber } = useParams();
    const navigate = useNavigate();

    const [trackData, setTrackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTracking = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const data = await getOrderTracking(orderNumber);
            setTrackData(data);
        } catch (err) {
            // If they are not logged in, redirect to login
            if (err.response?.status === 401) {
                navigate(`/login?redirect=/track-order/${orderNumber}`);
                return;
            }
            if (!silent) setError("Could not fetch order tracking. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orderNumber, navigate]);

    useEffect(() => { fetchTracking(); }, [fetchTracking]);

    // Auto-refresh every 30 s
    useEffect(() => {
        const id = setInterval(() => fetchTracking(true), 30000);
        return () => clearInterval(id);
    }, [fetchTracking]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 font-medium">Loading tracking info…</p>
                </div>
            </div>
        );
    }

    if (error || !trackData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={28} className="text-red-500" />
                    </div>
                    <p className="font-black text-gray-900 text-xl">{error || "Order not found."}</p>
                    <p className="text-gray-400 text-sm">Make sure you're logged in with the correct account.</p>
                    <button
                        onClick={() => fetchTracking()}
                        className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const currentStatus = trackData.status;
    const currentStepIndex = getStepIndex(currentStatus);
    const isBad = isTerminalBad(currentStatus);
    const isNearby = currentStatus === "nearby";
    const progressPercent = isBad
        ? 0
        : Math.max(0, (currentStepIndex / (LIFECYCLE_STEPS.length - 1)) * 100);

    return (
        <div className="min-h-screen bg-gray-50 pb-16 font-sans">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-base font-black text-gray-900">Order Tracking</h1>
                        <p className="text-xs text-gray-400 font-medium font-mono">#{trackData.order_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => generateInvoice(trackData)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-xl text-xs font-black text-violet-600 hover:bg-violet-100 transition-all"
                        >
                            <FileText size={12} />
                            Invoice
                        </button>
                        <button
                            onClick={() => fetchTracking(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-200 transition-all"
                        >
                            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
                {/* OTP Banner (only when nearby) */}
                <AnimatePresence>{isNearby && <OTPBanner />}</AnimatePresence>

                {/* Bad-status banner */}
                {isBad && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                        <div>
                            <p className="font-black text-red-700 capitalize">{currentStatus}</p>
                            <p className="text-red-500 text-sm font-medium">
                                {currentStatus === "rejected"
                                    ? "Your order was rejected by the vendor. Please contact support."
                                    : currentStatus === "cancelled"
                                        ? "Order has been cancelled."
                                        : "Order was returned. Refund will be processed if applicable."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Order Summary Card */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Date</p>
                            <p className="font-bold text-gray-900 text-sm">
                                {new Date(trackData.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric"
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="font-black text-violet-600">₹{Number(trackData.total_amount).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver To</p>
                            <p className="font-bold text-gray-700 text-sm truncate" title={trackData.delivery_address}>
                                {trackData.delivery_address || "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isBad ? "bg-red-100 text-red-700"
                                : currentStatus === "delivered" ? "bg-emerald-100 text-emerald-700"
                                    : isNearby ? "bg-orange-100 text-orange-700"
                                        : "bg-violet-100 text-violet-700"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isBad ? "bg-red-400"
                                    : currentStatus === "delivered" ? "bg-emerald-400"
                                        : isNearby ? "bg-orange-400 animate-pulse"
                                            : "bg-violet-400"
                                    }`} />
                                {currentStatus.replace(/_/g, " ")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Tracker */}
                {!isBad && (
                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Delivery Progress</p>

                        {/* Track line */}
                        <div className="relative px-4">
                            <div className="absolute top-5 left-4 right-4 h-1 bg-gray-100 rounded-full" />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                                className="absolute top-5 left-4 h-1 bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full"
                            />

                            {/* Truck icon */}
                            {progressPercent > 0 && progressPercent < 100 && (
                                <motion.div
                                    initial={{ left: "0%" }}
                                    animate={{ left: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "backOut", delay: 0.5 }}
                                    className="absolute -top-3 -translate-x-1/2 z-20"
                                >
                                    <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-100">
                                        <Truck size={18} className="text-violet-600" />
                                    </div>
                                </motion.div>
                            )}

                            {/* Steps */}
                            <div className="flex justify-between">
                                {LIFECYCLE_STEPS.map((step, idx) => {
                                    const done = idx < currentStepIndex;
                                    const current = idx === currentStepIndex && !isBad;
                                    const future = idx > currentStepIndex;
                                    const Icon = step.icon;
                                    return (
                                        <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / LIFECYCLE_STEPS.length}%` }}>
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-500 ${done ? "bg-gradient-to-br from-violet-500 to-emerald-400 border-white text-white shadow-lg"
                                                    : current ? "bg-white border-violet-500 text-violet-600 shadow-xl scale-125"
                                                        : "bg-white border-gray-200 text-gray-300"
                                                    }`}
                                            >
                                                {done ? <CheckCircle size={18} /> : <Icon size={18} />}
                                            </motion.div>
                                            <div className="mt-6 text-center w-full px-1">
                                                <p className={`text-[9px] font-black uppercase tracking-widest leading-tight ${future ? "text-gray-300" : "text-gray-700"
                                                    }`}>
                                                    {step.label}
                                                </p>
                                                {current && (
                                                    <span className="text-[8px] font-black text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Current step description */}
                        {!isBad && currentStepIndex >= 0 && (
                            <div className="mt-12 bg-violet-50 rounded-2xl p-5">
                                <p className="font-black text-violet-700 text-sm">
                                    {LIFECYCLE_STEPS[Math.min(currentStepIndex, LIFECYCLE_STEPS.length - 1)]?.label}
                                </p>
                                <p className="text-violet-600/70 text-xs font-medium mt-1">
                                    {LIFECYCLE_STEPS[Math.min(currentStepIndex, LIFECYCLE_STEPS.length - 1)]?.desc}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom grid: agent + items + history */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-6">
                        {/* Delivery Agent */}
                        {trackData.delivery_agent && <AgentCard agent={trackData.delivery_agent} />}

                        {/* Items */}
                        {trackData.items?.length > 0 && (
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Box size={12} /> Order Items
                                </p>
                                <div className="space-y-3">
                                    {trackData.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-400 font-medium">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="font-black text-violet-600 text-sm">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column: Status History */}
                    <div>
                        <StatusHistory history={trackData.status_history} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={() => navigate("/profile/orders")}
                        className="px-8 py-4 bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-xl"
                    >
                        All My Orders
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-8 py-4 bg-white text-gray-700 text-[11px] font-black uppercase tracking-widest rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
