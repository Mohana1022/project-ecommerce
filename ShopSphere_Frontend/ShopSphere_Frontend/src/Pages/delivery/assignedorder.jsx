import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaStore,
    FaMapMarkerAlt,
    FaCheck,
    FaPhoneAlt,
    FaDirections,
    FaBox,
    FaListUl,
    FaDotCircle,
    FaTruck,
    FaShippingFast,
    FaTimesCircle,
    FaChevronRight,
    FaLock,
    FaKey,
} from 'react-icons/fa';
import {
    fetchAssignedOrders,
    acceptOrder as apiAcceptOrder,
    markPickedUp,
    markInTransit,
    failDelivery,
    triggerNearbyOTP,
    verifyDeliveryOTP,
} from '../../api/delivery_axios';
import { toast } from 'react-hot-toast';

// ─── Status pipeline ───────────────────────────────────────────────────────────
const STEPS = [
    { key: 'assigned', label: 'Assigned', icon: FaDotCircle },
    { key: 'accepted', label: 'Accepted', icon: FaCheck },
    { key: 'picked_up', label: 'Picked Up', icon: FaBox },
    { key: 'in_transit', label: 'In Transit', icon: FaShippingFast },
    { key: 'delivered', label: 'Delivered', icon: FaTruck },
];

const STATUS_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

function StatusStepper({ currentStatus }) {
    const currentIdx = STATUS_INDEX[currentStatus] ?? 0;
    const isFailed = currentStatus === 'failed';

    return (
        <div className="flex items-center gap-1 mb-6 flex-wrap">
            {STEPS.map((step, idx) => {
                const done = !isFailed && idx <= currentIdx;
                const active = !isFailed && idx === currentIdx;
                return (
                    <div key={step.key} className="flex items-center gap-1">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' :
                            done ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-400'
                            }`}>
                            <step.icon className="w-3 h-3" />
                            {step.label}
                        </div>
                        {idx < STEPS.length - 1 && (
                            <FaChevronRight className={`w-2 h-2 ${done && !active ? 'text-green-400' : 'text-gray-200'}`} />
                        )}
                    </div>
                );
            })}
            {isFailed && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                    <FaTimesCircle className="w-3 h-3" /> Failed
                </div>
            )}
        </div>
    );
}

// ─── OTP Input panel ───────────────────────────────────────────────────────────
function OtpDeliveryPanel({ orderId, loading, onConfirm }) {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);

    const handleDigit = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...digits];
        next[idx] = val;
        setDigits(next);
        if (val && idx < 5) {
            document.getElementById(`otp-${orderId}-${idx + 1}`)?.focus();
        }
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            document.getElementById(`otp-${orderId}-${idx - 1}`)?.focus();
        }
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (paste.length === 6) {
            setDigits(paste.split(''));
            document.getElementById(`otp-${orderId}-5`)?.focus();
        }
    };

    const otp = digits.join('');
    const isComplete = otp.length === 6;

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 mt-2">
            <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-100 p-2 rounded-full">
                    <FaKey className="text-green-600 w-4 h-4" />
                </div>
                <div>
                    <p className="font-black text-gray-900 text-sm">Enter Customer OTP</p>
                    <p className="text-xs text-gray-500">Customer received OTP via email & notification</p>
                </div>
            </div>

            {/* 6-digit OTP boxes */}
            <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                {digits.map((d, idx) => (
                    <input
                        key={idx}
                        id={`otp-${orderId}-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigit(idx, e.target.value)}
                        onKeyDown={e => handleKeyDown(idx, e)}
                        className="w-10 h-12 text-center text-xl font-black border-2 rounded-xl outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900"
                    />
                ))}
            </div>

            <button
                disabled={!isComplete || loading}
                onClick={() => onConfirm(orderId, otp)}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                    <>✅ Confirm Delivery</>
                )}
            </button>
        </div>
    );
}

export default function AssignedOrders() {
    const navigate = useNavigate();
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    const loadDeliveries = async () => {
        try {
            const data = await fetchAssignedOrders();
            setActiveDeliveries(data);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error(error.response?.data?.error || 'Account restricted.', { duration: 5000 });
                localStorage.removeItem('accessToken');
                navigate('/delivery');
            } else {
                toast.error('Failed to load active deliveries');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDeliveries(); }, []);

    const runAction = async (id, label, apiFn, ...args) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await apiFn(id, ...args);
            if (label === 'In Transit') {
                toast.success('Order is now Out for Delivery! 🚚');
            } else if (label === 'Nearby Signal') {
                toast.success('Nearby signal sent! OTP shared with customer. 🔐', { duration: 5000 });
            } else {
                toast.success(`${label} — success!`);
            }
            loadDeliveries();
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed: ${label}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleOtpDelivery = async (id, otp) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await verifyDeliveryOTP(id, otp);
            toast.success('🎉 OTP Verified! Delivery complete!', { duration: 4000 });
            loadDeliveries();
        } catch (error) {
            const msg = error.response?.data?.error || 'Invalid OTP. Please check with customer.';
            toast.error(msg, { duration: 5000 });
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Deliveries</h1>
                    <p className="text-gray-500 mt-1">Manage and progress your assigned tasks below.</p>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex gap-2">
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-2">
                        <FaDotCircle className="animate-pulse w-3 h-3" />
                        {activeDeliveries.length} Active
                    </span>
                </div>
            </header>

            {activeDeliveries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaTruck className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Caught Up!</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">No active deliveries right now. Head over to the dashboard to find new orders nearby.</p>
                    <button
                        onClick={() => navigate('/delivery/dashboard')}
                        className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition shadow-xl shadow-purple-200"
                    >
                        Find New Orders
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {activeDeliveries.map((order) => (
                        <div key={order.id} className="bg-white rounded-[2rem] p-8 shadow-xl border border-purple-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Delivery for {order.customer_name}</h2>
                                    <p className="text-gray-500 font-medium tracking-tight">Assignment #{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-green-500">₹{order.delivery_fee}</div>
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Est. Earning</p>
                                </div>
                            </div>

                            {/* Status Stepper */}
                            <StatusStepper currentStatus={order.status} />

                            {/* Body */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                                {/* Left: Route + Items */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">Delivery Route</h3>
                                        <div className="relative pl-8 space-y-8 border-l-2 border-dashed border-gray-300 ml-2">
                                            <div className="relative">
                                                <div className="absolute -left-[41px] bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                                                    <FaCheck className="text-white w-2 h-2" />
                                                </div>
                                                <p className="text-xs text-green-600 font-bold uppercase mb-1">Pickup – Vendor</p>
                                                <p className="text-gray-500 text-sm">{order.pickup_address}</p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-[41px] bg-purple-600 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center animate-pulse">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                                <p className="text-xs text-purple-600 font-bold uppercase mb-1">Drop-off – Customer</p>
                                                <p className="font-bold text-gray-900 flex items-center gap-2">
                                                    <FaMapMarkerAlt className="text-purple-600" />
                                                    {order.delivery_address}
                                                </p>
                                                <p className="text-gray-500 text-sm">{order.delivery_city}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                                            <FaListUl /> Order Items
                                        </h3>
                                        <div className="space-y-3">
                                            {order.items ? order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">{item.quantity}x</div>
                                                        <span className="font-bold text-gray-700">{item.product_name}</span>
                                                    </div>
                                                    <FaCheck className="text-gray-300" />
                                                </div>
                                            )) : (
                                                <p className="text-gray-400 text-sm italic">Item details not available</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Action Panel */}
                                <div className="flex flex-col gap-4">
                                    <div className="bg-purple-600 text-white rounded-3xl p-6 shadow-xl shadow-purple-200 text-center">
                                        <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-2">Current Status</p>
                                        <div className="text-xl font-black mb-1 uppercase tracking-tight">
                                            {order.status.replace('_', ' ')}
                                        </div>
                                        {order.status === 'in_transit' && (
                                            <p className="text-purple-200 text-xs mt-1">📧 OTP sent to customer</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button className="w-full py-3 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition">
                                            <div className="bg-green-100 p-2 rounded-full text-green-600"><FaPhoneAlt /></div>
                                            Call Customer
                                        </button>
                                        <button className="w-full py-3 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition">
                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><FaDirections /></div>
                                            Open Maps
                                        </button>
                                    </div>

                                    {/* Status Actions */}
                                    <div className="mt-auto pt-4">
                                        <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Delivery Actions</p>
                                        <div className="grid grid-cols-1 gap-3">

                                            {order.status === 'assigned' && (
                                                <button
                                                    disabled={actionLoading[order.id]}
                                                    onClick={() => runAction(order.id, 'Order Accepted', apiAcceptOrder)}
                                                    className="py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50"
                                                >
                                                    ✓ Accept Task
                                                </button>
                                            )}

                                            {order.status === 'accepted' && (
                                                <button
                                                    disabled={actionLoading[order.id]}
                                                    onClick={() => runAction(order.id, 'Picked Up', markPickedUp)}
                                                    className="py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                                                >
                                                    📦 Mark Picked Up
                                                </button>
                                            )}

                                            {order.status === 'picked_up' && (
                                                <button
                                                    disabled={actionLoading[order.id]}
                                                    onClick={() => runAction(order.id, 'In Transit', markInTransit)}
                                                    className="py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition shadow-lg shadow-orange-200 disabled:opacity-50"
                                                >
                                                    🚚 Mark In Transit
                                                </button>
                                            )}

                                            {/* OTP Delivery Confirmation — replaces the plain button */}
                                            {order.status === 'in_transit' && (
                                                <div className="space-y-3">
                                                    {/* Nearby Trigger (only if order status is not already nearby) */}
                                                    {order.order_status !== 'nearby' && (
                                                        <button
                                                            disabled={actionLoading[order.id]}
                                                            onClick={() => runAction(order.id, 'Nearby Signal', triggerNearbyOTP)}
                                                            className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            <FaMapMarkerAlt /> Signal I'm Nearby (Send OTP)
                                                        </button>
                                                    )}

                                                    {/* OTP Input Block */}
                                                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-1">
                                                        <OtpDeliveryPanel
                                                            orderId={order.id}
                                                            loading={!!actionLoading[order.id]}
                                                            onConfirm={handleOtpDelivery}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {['accepted', 'picked_up', 'in_transit'].includes(order.status) && (
                                                <button
                                                    disabled={actionLoading[order.id]}
                                                    onClick={() => runAction(order.id, 'Marked Failed', failDelivery, 'Agent reported delivery failure')}
                                                    className="py-2 border-2 border-red-200 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition text-sm disabled:opacity-50"
                                                >
                                                    ✗ Report Failed
                                                </button>
                                            )}

                                            {(order.status === 'delivered' || order.status === 'failed') && (
                                                <div className={`py-4 text-center rounded-2xl font-bold text-sm ${order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                                    }`}>
                                                    {order.status === 'delivered' ? '✅ Order Completed' : '✗ Delivery Failed'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}