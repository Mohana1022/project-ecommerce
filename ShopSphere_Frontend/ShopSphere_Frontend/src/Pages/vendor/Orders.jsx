import { useEffect, useState } from "react";
import { getVendorLifecycleOrders, vendorOrderAction } from "../../api/vendor_axios";
import {
  FaEye, FaTimes, FaMapMarkerAlt, FaCreditCard,
  FaCalendarAlt, FaBox, FaCheck, FaBan, FaBoxOpen,
  FaFilter, FaSearch
} from "react-icons/fa";
import {
  CheckCircle, XCircle, Package, Clock, Truck,
  MapPin, AlertTriangle, ChevronRight, FileText
} from "lucide-react";
import { toast } from "react-hot-toast";
import { sendOrderConfirmationEmail } from "../../utils/emailService";
import { generateInvoice } from "../../utils/invoiceGenerator";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  packed: { label: "Packed", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  delivery_assigned: { label: "Agent Assigned", color: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  nearby: { label: "Nearby", color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
  returned: { label: "Returned", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  // legacy
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
  shipping: { label: "Shipping", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
};

const getStatusConfig = (s) => STATUS_CONFIG[s] || { label: s, color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };

const FILTER_TABS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "packed", label: "Packed" },
  { id: "delivery_assigned", label: "Assigned" },
  { id: "delivered", label: "Delivered" },
  { id: "rejected", label: "Rejected" },
];

// ─── Rejection Modal ─────────────────────────────────────────────────────────
function RejectModal({ onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-900">Reject Order</h3>
            <p className="text-xs text-gray-400 font-medium">A reason is required for rejection</p>
          </div>
        </div>
        <textarea
          autoFocus
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explain why you're rejecting this order (e.g. out of stock, product discontinued)…"
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400/40 resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Panel ───────────────────────────────────────────────────────
function OrderDetailPanel({ order, onClose, onAction }) {
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const status = order.order_status;

  const handleAction = async (action, notes = "") => {
    setActionLoading(action);
    try {
      await onAction(order.order_pk, action, notes, order);
      onClose();
    } finally {
      setActionLoading(null);
    }
  };

  const addr = order.customer_address;
  const sc = getStatusConfig(status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 p-8 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-1">Order Number</p>
              <h2 className="text-2xl font-black text-white">#{order.order_number}</h2>
              <p className="text-gray-400 text-xs font-medium mt-1">
                {new Date(order.order_created_at).toLocaleString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => generateInvoice({
                  ...order,
                  total_amount: order.order_total,
                  subtotal: order.order_subtotal,
                  tax_amount: order.order_tax,
                  shipping_cost: order.order_shipping
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                title="Print Invoice"
              >
                <FileText size={12} />
                Invoice
              </button>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sc.color}`}>
                {sc.label}
              </span>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <FaTimes size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* Customer + Product Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FaBox className="text-violet-500" /> Product
              </p>
              <p className="font-black text-gray-900 text-base">{order.product}</p>
              <p className="text-sm text-gray-500 font-medium">Qty: <span className="font-black text-gray-700">{order.quantity}</span></p>
              <p className="text-xl font-black text-violet-600">₹{order.price}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FaCreditCard className="text-emerald-500" /> Customer & Payment
              </p>
              <p className="font-black text-gray-900">{order.customer_name}</p>
              <p className="text-sm text-gray-500 font-medium">{order.customer_email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Method:</span>
                <span className="font-bold text-gray-700 text-sm">
                  {order.payment_method === 'ONLINE' ? 'Online / UPI' : 'Cash on Delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {addr && (
            <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin size={12} /> Shipping Address
              </p>
              <p className="font-black text-gray-900 text-base">{addr.name}</p>
              <p className="text-sky-700 font-bold text-sm mb-2">{addr.phone}{addr.email ? ` · ${addr.email}` : ""}</p>
              <p className="text-gray-600 text-sm font-medium">
                {addr.address_line1}
                {addr.address_line2 && `, ${addr.address_line2}`}
                {`, ${addr.city}, ${addr.state} - ${addr.pincode}`}
              </p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Financial Summary</p>
            <div className="space-y-2 text-sm">
              {[
                ["Subtotal", `₹${order.order_subtotal}`],
                ["Tax", `₹${order.order_tax}`],
                ["Shipping", `₹${order.order_shipping}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-gray-600 font-medium">
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-200 text-base">
                <span>Order Total</span><span className="text-violet-600">₹{order.order_total}</span>
              </div>
              <div className="flex justify-between font-black text-emerald-600 pt-1">
                <span>Your Earnings (net)</span><span>₹{parseFloat(order.net_earning).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          {status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={() => handleAction("approve")}
                disabled={!!actionLoading}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {actionLoading === "approve" ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : <CheckCircle size={16} />}
                Approve Order
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={!!actionLoading}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          )}
          {status === "approved" && (
            <div className="flex gap-3">
              <button
                onClick={() => handleAction("pack")}
                disabled={!!actionLoading}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {actionLoading === "pack" ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : <Package size={16} />}
                Mark as Packed & Assign Delivery
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={!!actionLoading}
                className="px-6 py-3.5 bg-gray-200 text-gray-700 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-red-100 hover:text-red-600 transition-all disabled:opacity-50"
              >
                <XCircle size={16} /> Reject
              </button>
            </div>
          )}
          {!["pending", "approved"].includes(status) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">
                {status === "delivered"
                  ? "✅ This order has been completed."
                  : status === "rejected"
                    ? "❌ This order was rejected."
                    : `Order is currently: ${getStatusConfig(status).label}`}
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-black text-white rounded-2xl font-black text-sm hover:scale-105 transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <RejectModal
          loading={actionLoading === "reject"}
          onConfirm={async (reason) => {
            setShowRejectModal(false);
            await handleAction("reject", reason);
          }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async (filter = activeFilter) => {
    setLoading(true);
    try {
      const data = await getVendorLifecycleOrders(filter);
      setOrders(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      toast.error("Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(activeFilter); }, [activeFilter]);

  const handleAction = async (orderPk, action, notes, orderObject = null) => {
    try {
      const result = await vendorOrderAction(orderPk, action, notes);
      toast.success(result.message || `Order ${action}d successfully!`);

      // If approved, trigger the confirmation email
      if (action === 'approve' && orderObject) {
        sendOrderConfirmationEmail({
          ...orderObject,
          order_status: 'approved',
          // Map fields if names slightly differ
          total_amount: orderObject.order_total,
          subtotal: orderObject.order_subtotal
        });
      }

      await fetchOrders();
    } catch (err) {
      const msg = err?.response?.data?.error || `Failed to ${action} order.`;
      toast.error(msg);
      throw err;
    }
  };

  // Client-side search
  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.product?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === "pending").length,
    approved: orders.filter(o => o.order_status === "approved").length,
    delivered: orders.filter(o => o.order_status === "delivered").length,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Order Management</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            Approve, reject, and pack customer orders with full lifecycle tracking
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-gray-50", icon: <FaBox className="text-gray-400" /> },
          { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: <Clock size={16} className="text-amber-500" /> },
          { label: "Approved", value: stats.approved, color: "text-blue-600", bg: "bg-blue-50", icon: <CheckCircle size={16} className="text-blue-500" /> },
          { label: "Delivered", value: stats.delivered, color: "text-emerald-600", bg: "bg-emerald-50", icon: <Truck size={16} className="text-emerald-500" /> },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
            <div className="opacity-60">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeFilter === tab.id
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-400 border border-gray-200 hover:border-gray-400 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
          <input
            type="text"
            placeholder="Search orders, products, customers…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Fetching orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaBox className="text-gray-300" size={24} />
            </div>
            <p className="text-gray-500 font-bold">No orders found.</p>
            <p className="text-gray-400 text-sm">Try a different filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 bg-gray-50/60">
                  {["Order #", "Customer", "Product", "Qty", "Total", "Order Status", "Action"].map(h => (
                    <th key={h} className="py-4 px-5 text-left font-black uppercase tracking-wider text-[10px] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => {
                  const sc = getStatusConfig(order.order_status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-4 px-5">
                        <span className="font-black text-gray-900 font-mono text-xs">
                          #{order.order_number}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold text-gray-900 text-sm">{order.customer_name}</p>
                        <p className="text-gray-400 text-xs font-medium">{order.customer_email}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold text-gray-700 max-w-[180px] truncate">{order.product}</p>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-black text-gray-700">{order.quantity}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-black text-violet-600">₹{order.order_total}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-black text-xs hover:bg-violet-600 hover:text-white transition-all group-hover:shadow-lg"
                        >
                          <FaEye size={12} /> View
                          {order.order_status === "pending" && (
                            <span className="ml-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Panel */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
