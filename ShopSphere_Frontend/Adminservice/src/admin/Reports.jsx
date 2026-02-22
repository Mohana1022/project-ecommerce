import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Store,
    ShoppingCart,
    ArrowDownRight,
    Calendar,
    ShieldCheck,
    PanelLeftClose,
    PanelLeftOpen,
    IndianRupee,
    CheckCircle,
    XCircle,
    RefreshCcw,
    Clock,
    UserCheck,
    Ban,
    Package,
    Truck,
    Activity,
    AlertCircle,
    Filter,
    CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { fetchReports } from '../api/axios';

// ─────────────────────────────────────────────────
// Shared stat card
// ─────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, prefix = '', sub = '', index = 0 }) => {
    const colorMap = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', glow: 'bg-indigo-500/5' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', glow: 'bg-emerald-500/5' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', glow: 'bg-amber-500/5' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', glow: 'bg-rose-500/5' },
        violet: { bg: 'bg-violet-50', text: 'text-violet-600', glow: 'bg-violet-500/5' },
        sky: { bg: 'bg-sky-50', text: 'text-sky-600', glow: 'bg-sky-500/5' },
    };
    const c = colorMap[color] || colorMap.indigo;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 ${c.glow} rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`} />
            <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} mb-4`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-3xl font-black text-slate-900">
                {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : (value ?? '—')}
            </div>
            {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        </motion.div>
    );
};

// ─────────────────────────────────────────────────
// Rupee formatter
// ─────────────────────────────────────────────────
const rupee = (n) =>
    '₹' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        approved: 'bg-sky-50 text-sky-700 border-sky-100',
        pending: 'bg-amber-50 text-amber-700 border-amber-100',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
        failed: 'bg-rose-50 text-rose-700 border-rose-100',
        blocked: 'bg-rose-50 text-rose-700 border-rose-100',
        processing: 'bg-violet-50 text-violet-700 border-violet-100',
    };
    const cls = map[status?.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100';
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-tight ${cls}`}>
            {status}
        </span>
    );
};

// ─────────────────────────────────────────────────
// Progress bar row
// ─────────────────────────────────────────────────
const ProgressRow = ({ label, count, max, color = '#6366f1', index = 0 }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 + (index * 0.05) }}
        className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
    >
        <div className="w-28 shrink-0"><StatusBadge status={label} /></div>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: max ? `${(count / max) * 100}%` : '0%' }}
                transition={{ duration: 1, delay: 0.3 + (index * 0.05) }}
                className="h-full rounded-full transition-all duration-700"
                style={{ background: color }}
            />
        </div>
        <div className="w-10 text-right text-sm font-black text-slate-800">{count}</div>
    </motion.div>
);

// ─────────────────────────────────────────────────
// 1. SALES & REVENUE REPORT
// ─────────────────────────────────────────────────
const SalesReport = ({ data }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Total Orders" value={data.total_orders} icon={ShoppingCart} color="indigo" index={0} />
            <StatCard label="Total Revenue" value={data.total_revenue} icon={TrendingUp} color="emerald" prefix="₹" index={1} />
            <StatCard label="Avg Order Value" value={data.avg_order_value} icon={IndianRupee} color="violet" prefix="₹" index={2} />
            <StatCard label="Revenue Today" value={data.revenue_today} icon={Calendar} color="sky" prefix="₹" index={3} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm"
            >
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Revenue Snapshot</div>
                {[
                    { label: 'Today', value: data.revenue_today },
                    { label: 'This Week', value: data.revenue_week },
                    { label: 'This Month', value: data.revenue_month },
                    { label: 'All Time', value: data.total_revenue },
                ].map(({ label, value }, i) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0"
                    >
                        <span className="text-sm text-slate-500 font-semibold">{label}</span>
                        <span className="text-sm font-black text-emerald-600">{rupee(value)}</span>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="md:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm overflow-hidden"
            >
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Daily Revenue — Last 30 Days
                </div>
                <div className="overflow-y-auto max-h-56">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-white border-b border-slate-100">
                            <tr>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(data.daily_revenue ?? []).length === 0 ? (
                                <tr><td colSpan={3} className="py-8 text-center text-slate-300 text-sm">No completed orders in the last 30 days</td></tr>
                            ) : (
                                (data.daily_revenue ?? []).map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 text-sm font-bold text-slate-600 font-mono">{d.day}</td>
                                        <td className="py-2.5 text-sm font-black text-slate-900 text-center">{d.orders}</td>
                                        <td className="py-2.5 text-sm font-black text-emerald-600 text-right">{rupee(d.revenue)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────
// 2. COMMISSION REPORT
// ─────────────────────────────────────────────────
const CommissionReport = ({ data }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Gross Sales" value={data.total_gross} icon={TrendingUp} color="indigo" prefix="₹" index={0} />
            <StatCard label="Platform Commission" value={data.total_platform_commission} icon={IndianRupee} color="rose" prefix="₹" index={1} />
            <StatCard label="Net to Vendors" value={data.total_net} icon={Activity} color="emerald" prefix="₹" index={2} />
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
        >
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Store className="w-4 h-4 text-indigo-500" /> Top Vendor Commission Ledger
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/70 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross (₹)</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Commission (₹)</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net (₹)</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(data.top_vendors ?? []).length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-300 text-sm">No vendor earnings recorded yet</td></tr>
                        ) : (
                            (data.top_vendors ?? []).map((v, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black
                                            ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                            {i + 1}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{v.vendor__shop_name || '—'}</td>
                                    <td className="px-4 py-3.5 text-sm font-bold text-slate-700 text-right">{rupee(v.total_gross)}</td>
                                    <td className="px-4 py-3.5 text-sm font-black text-rose-500 text-right">{rupee(v.total_commission)}</td>
                                    <td className="px-4 py-3.5 text-sm font-black text-emerald-600 text-right">{rupee(v.total_net)}</td>
                                    <td className="px-4 py-3.5 text-sm font-black text-slate-700 text-center">{v.order_count}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    </div>
);

// ─────────────────────────────────────────────────
// 3. VENDOR REPORT
// ─────────────────────────────────────────────────
const VendorReport = ({ data }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Vendors" value={data.total_vendors} icon={Store} color="indigo" index={0} />
            <StatCard label="Approved Partners" value={data.approved_vendors} icon={CheckCircle} color="emerald" index={1} />
            <StatCard label="Compliance Blocks" value={data.blocked_vendors} icon={Ban} color="rose" index={2} />
            <StatCard label="Active Products" value={data.active_products} icon={Package} color="sky"
                sub={`${data.blocked_products ?? 0} blocked`} index={3} />
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
        >
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Users className="w-4 h-4 text-indigo-500" /> Top 10 Vendors by Net Earnings
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/70 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Name</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Earnings (₹)</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(data.top_vendors ?? []).length === 0 ? (
                            <tr><td colSpan={4} className="py-10 text-center text-slate-300 text-sm">No vendors with earnings yet</td></tr>
                        ) : (
                            (data.top_vendors ?? []).map((v, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black
                                            ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                            {i + 1}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{v.vendor__shop_name || '—'}</td>
                                    <td className="px-4 py-3.5 text-sm font-black text-emerald-600 text-right">{rupee(v.total_net)}</td>
                                    <td className="px-4 py-3.5 text-sm font-black text-slate-700 text-center">{v.order_count}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    </div>
);

// ─────────────────────────────────────────────────
// 4. ORDER STATUS REPORT
// ─────────────────────────────────────────────────
const statusColor = (s) => {
    const m = { delivered: '#10b981', completed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444', failed: '#ef4444', processing: '#6366f1' };
    return m[s?.toLowerCase()] || '#94a3b8';
};

const OrderStatusReport = ({ data }) => {
    const maxOrderStatus = Math.max(...(data.order_status_breakdown ?? []).map(r => r.count), 1);
    const maxPayStatus = Math.max(...(data.payment_status_breakdown ?? []).map(r => r.count), 1);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard label="Total Orders" value={data.total_orders} icon={ShoppingCart} color="indigo" index={0} />
                <StatCard label="Orders Today" value={data.orders_today} icon={Calendar} color="sky" index={1} />
                <StatCard label="Orders (7 days)" value={data.orders_this_week} icon={Clock} color="amber" index={2} />
                <StatCard label="Orders (30 days)" value={data.orders_this_month} icon={Activity} color="violet" index={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
                >
                    <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-tight">
                        <BarChart3 className="w-4 h-4 text-indigo-500" /> Order Status Breakdown
                    </h3>
                    {(data.order_status_breakdown ?? []).length === 0 ? (
                        <div className="py-10 text-center text-slate-300 text-sm">No order data yet</div>
                    ) : (
                        (data.order_status_breakdown ?? []).map((r, i) => (
                            <ProgressRow key={r.status} label={r.status} count={r.count} max={maxOrderStatus} color={statusColor(r.status)} index={i} />
                        ))
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
                >
                    <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-tight">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Payment Status Breakdown
                    </h3>
                    {(data.payment_status_breakdown ?? []).length === 0 ? (
                        <div className="py-10 text-center text-slate-300 text-sm">No payment data yet</div>
                    ) : (
                        (data.payment_status_breakdown ?? []).map((r, i) => (
                            <ProgressRow key={r.payment_status} label={r.payment_status} count={r.count} max={maxPayStatus} color={statusColor(r.payment_status)} index={i} />
                        ))
                    )}
                </motion.div>
            </div>

            {/* Top Products */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
            >
                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Package className="w-4 h-4 text-amber-500" /> Top 10 Products by Qty Sold
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/70 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty Sold</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(data.top_products ?? []).length === 0 ? (
                                <tr><td colSpan={4} className="py-10 text-center text-slate-300 text-sm">No product order data yet</td></tr>
                            ) : (
                                (data.top_products ?? []).map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black
                                                ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>{i + 1}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{p.product_name}</td>
                                        <td className="px-4 py-3 text-sm font-black text-slate-700 text-center">{p.total_qty}</td>
                                        <td className="px-4 py-3 text-sm font-black text-emerald-600 text-right">{rupee(p.total_revenue)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// 5. DELIVERY REPORT
// ─────────────────────────────────────────────────
const DeliveryReport = ({ data }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Total Agents" value={data.total_agents} icon={Users} color="indigo" index={0} />
            <StatCard label="Approved Agents" value={data.approved_agents} icon={UserCheck} color="emerald" index={1} />
            <StatCard label="Deliveries Done" value={data.total_deliveries_done} icon={Truck} color="sky" index={2} />
            <StatCard label="Failed Deliveries" value={data.total_deliveries_failed} icon={XCircle} color="rose" index={3} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
            >
                <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-tight">
                    <IndianRupee className="w-4 h-4 text-amber-500" /> Commission Payouts
                </h3>
                {[
                    { label: 'Paid to Agents', value: data.total_delivery_commissions_paid, color: 'text-emerald-600' },
                    { label: 'Pending / Approved', value: data.total_delivery_commissions_pending, color: 'text-amber-500' },
                ].map(({ label, value, color }, i) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="flex justify-between items-center py-3.5 border-b border-slate-50 last:border-0"
                    >
                        <span className="text-sm text-slate-500 font-semibold">{label}</span>
                        <span className={`text-sm font-black ${color}`}>{rupee(value)}</span>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-center"
            >
                <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-tight px-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" /> Delivery Fulfillment Rate
                </h3>
                {(() => {
                    const total = (data.total_deliveries_done ?? 0) + (data.total_deliveries_failed ?? 0);
                    const rate = total > 0 ? ((data.total_deliveries_done / total) * 100).toFixed(1) : null;
                    return (
                        <div className="text-center py-4">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 100, delay: 0.6 }}
                                className="text-6xl font-black text-slate-900 mb-2"
                            >
                                {rate !== null ? `${rate}%` : '—'}
                            </motion.div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-black">
                                {total > 0 ? `${data.total_deliveries_done} delivered of ${total} assigned` : 'No assignments yet'}
                            </div>
                        </div>
                    );
                })()}
            </motion.div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────
// MAIN Reports Component
// ─────────────────────────────────────────────────
const TABS = [
    { key: 'Sales', label: 'Sales & Revenue' },
    { key: 'Commission', label: 'Commission' },
    { key: 'Vendor', label: 'Vendor Performance' },
    { key: 'Order', label: 'Order Status' },
    { key: 'Delivery', label: 'Delivery' },
];

const Reports = () => {
    const [activeReport, setActiveReport] = useState('Sales');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const loadReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchReports();
            setReportData(data);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Failed to load reports:', err);
            setError(err?.response?.data?.detail || 'Failed to load live report data. Please check your authentication and try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.removeItem('authToken');
        window.location.href = '/';
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 overflow-hidden">
            <Sidebar isSidebarOpen={isSidebarOpen} activePage="Reports" onLogout={handleLogout} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </motion.button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Reporting</h1>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100 tracking-widest leading-none">Live Data</span>
                            </div>
                            {lastRefreshed && (
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    Last refreshed: {lastRefreshed.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tab switcher */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                            {TABS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveReport(key)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeReport === key
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={loadReports}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </motion.button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 space-y-8">
                    {isLoading && !reportData ? (
                        /* Initial loading skeleton */
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <RefreshCcw className="w-10 h-10 text-indigo-400" />
                            </motion.div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Fetching Live Data...</p>
                        </div>
                    ) : error ? (
                        /* Error state */
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-900 mb-1">Failed to Load Reports</p>
                                <p className="text-xs text-slate-400 max-w-sm">{error}</p>
                            </div>
                            <button
                                onClick={loadReports}
                                className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeReport}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-8"
                            >
                                {activeReport === 'Sales' && <SalesReport data={reportData} />}
                                {activeReport === 'Commission' && <CommissionReport data={reportData} />}
                                {activeReport === 'Vendor' && <VendorReport data={reportData} />}
                                {activeReport === 'Order' && <OrderStatusReport data={reportData} />}
                                {activeReport === 'Delivery' && <DeliveryReport data={reportData} />}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Reports;
