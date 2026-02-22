import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    ArrowLeft,
    Package,
    Truck,
    User,
    MapPin,
    CreditCard,
    Clock,
    Activity,
    CheckCircle2,
    Circle,
    PanelLeftClose,
    PanelLeftOpen,
    HelpCircle
} from 'lucide-react';
import { fetchAdminOrderDetail, settlePayment } from '../api/axios';
import { motion } from 'framer-motion';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [settlingId, setSettlingId] = useState(null);

    const loadOrder = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAdminOrderDetail(id);
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order details", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [id]);

    const handleSettle = async (itemId) => {
        if (!window.confirm("Are you sure you want to settle this payment to the vendor? This will transfer funds from the Admin wallet to the Vendor wallet.")) return;

        setSettlingId(itemId);
        try {
            const res = await settlePayment(itemId);
            alert(res.message || "Payment settled successfully!");
            await loadOrder();
        } catch (error) {
            console.error("Settlement failed", error);
            alert(error.response?.data?.error || "Settlement failed. Please check if both wallets are initialized.");
        } finally {
            setSettlingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        navigate('/');
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'processing': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'shipped': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Order Intel...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h2>
                    <button onClick={() => navigate('/orders')} className="text-violet-600 font-bold hover:underline">Back to Orders</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                activePage="Orders"
                onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto transition-all duration-300">
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-slate-500 hover:bg-violet-100 hover:text-violet-900 rounded-lg transition-all"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
                        </button>
                        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-violet-600 transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800">Order #{order.order_number}</h1>
                    </div>
                </header>

                <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
                    {/* Hero Section */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                                <Package className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Placement: {new Date(order.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">₹{order.total_amount}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2 justify-end">
                                    <CreditCard className="w-4 h-4 text-violet-500" />
                                    {order.payment_method.toUpperCase()}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Status</p>
                                <p className="text-sm font-bold text-slate-800 uppercase">{order.payment_status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Middle Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Order Items */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Activity className="w-5 h-5 text-violet-600" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Line Items</h3>
                                </div>
                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-slate-400">
                                                    <Package className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                                                    <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.product_price}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <p className="text-sm font-black text-slate-900">₹{item.subtotal}</p>
                                                {item.is_settled ? (
                                                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Settled
                                                    </div>
                                                ) : order.status === 'delivered' ? (
                                                    <button
                                                        onClick={() => handleSettle(item.id)}
                                                        disabled={settlingId === item.id}
                                                        className="px-3 py-1 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-violet-700 transition-all disabled:opacity-50"
                                                    >
                                                        {settlingId === item.id ? 'Settling...' : 'Settle Payment'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Delivery</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subtotal</span>
                                        <span className="font-bold text-slate-900">₹{order.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Shipping</span>
                                        <span className="font-bold text-emerald-600">₹{order.shipping_cost}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tax</span>
                                        <span className="font-bold text-slate-900">₹{order.tax_amount}</span>
                                    </div>
                                    <div className="flex justify-between text-lg pt-3 border-t border-dashed border-gray-200">
                                        <span className="font-black text-slate-800">Total Net</span>
                                        <span className="font-black text-violet-600 text-xl">₹{order.total_amount}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Tracking Timeline */}
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <Truck className="w-5 h-5 text-violet-600" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Logistics Journey</h3>
                                </div>
                                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                    {order.tracking_history && order.tracking_history.length > 0 ? (
                                        order.tracking_history.map((track, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 bg-white ${idx === 0 ? 'border-violet-600' : 'border-slate-200'}`}>
                                                    {idx === 0 && <div className="w-1.5 h-1.5 bg-violet-600 rounded-full m-auto mt-[1px]" />}
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                    <div>
                                                        <h4 className={`text-sm font-bold ${idx === 0 ? 'text-violet-600' : 'text-slate-700'}`}>{track.status}</h4>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {track.location || "Central Sorting"}
                                                        </p>
                                                        {track.notes && <p className="text-xs text-slate-400 mt-1 italic">"{track.notes}"</p>}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-gray-100 w-fit">
                                                        {new Date(track.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-400 italic">No tracking updates recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Sidebar Info */}
                        <div className="space-y-8">
                            {/* Customer Node */}
                            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <User className="w-5 h-5 text-violet-600" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Node</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p>
                                        <p className="text-sm font-bold text-slate-800">{order.customer_name || "Profile Incomplete"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Terminal</p>
                                        <p className="text-sm font-semibold text-slate-600 truncate">{order.customer_email}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Shipping Address */}
                            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <MapPin className="w-5 h-5 text-violet-600" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Endpoint</h3>
                                </div>
                                {order.delivery_address ? (
                                    <div className="space-y-2 text-sm text-slate-600 font-medium">
                                        <p className="text-slate-900 font-bold">{order.delivery_address.name}</p>
                                        <p>{order.delivery_address.address_line1}</p>
                                        {order.delivery_address.address_line2 && <p>{order.delivery_address.address_line2}</p>}
                                        <p>{order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}</p>
                                        <p className="text-slate-400 text-xs mt-2">{order.delivery_address.phone}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No address specified.</p>
                                )}
                            </section>

                            {/* Internal Audit */}
                            <section className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-violet-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Internal Audit</span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Transaction ID</p>
                                        <p className="text-xs font-mono text-slate-300 break-all">{order.transaction_id || "LOCAL_CREDIT_SETTLEMENT"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">System Node</p>
                                        <p className="text-xs font-bold text-violet-400">SHOPSPHERE-V3-MAIN</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderDetail;
