import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaMapMarkerAlt,
    FaCheck,
    FaPhoneAlt,
    FaDirections,
    FaBox,
    FaListUl,
    FaShippingFast,
    FaArrowLeft,
} from 'react-icons/fa';
import {
    fetchAssignmentDetail,
    markPickedUp,
    markInTransit,
    failDelivery,
    acceptOrder as apiAcceptOrder
} from '../../api/delivery_axios';
import { toast } from 'react-hot-toast';

const STEPS = [
    { key: 'assigned', label: 'Assigned' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
];
const STATUS_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

function StatusStepper({ currentStatus }) {
    const currentIdx = STATUS_INDEX[currentStatus] ?? 0;
    const isFailed = currentStatus === 'failed';
    return (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
            {STEPS.map((step, idx) => {
                const done = !isFailed && idx <= currentIdx;
                const active = !isFailed && idx === currentIdx;
                return (
                    <div key={step.key} className="flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${active ? 'bg-purple-600 text-white shadow-lg' :
                                done ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-400'
                            }`}>
                            {step.label}
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`w-4 h-0.5 ${done && !active ? 'bg-green-200' : 'bg-gray-100'}`} />
                        )}
                    </div>
                );
            })}
            {isFailed && (
                <div className="px-4 py-2 rounded-full text-xs font-bold bg-red-100 text-red-600">Failed</div>
            )}
        </div>
    );
}

export default function DeliveryOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadDetail = async () => {
        try {
            const data = await fetchAssignmentDetail(id);
            setAssignment(data);
        } catch (error) {
            toast.error("Failed to load details");
            navigate('/delivery/dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDetail(); }, [id]);

    const handleAction = async (label, apiFn, ...args) => {
        setActionLoading(true);
        try {
            await apiFn(id, ...args);
            toast.success(`${label} Success!`);
            loadDetail();
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed: ${label}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Loading...</div>;
    if (!assignment) return null;

    return (
        <div className="w-full p-8 max-w-5xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-purple-600 mb-6 font-bold transition-colors"
            >
                <FaArrowLeft /> Back to Dashboard
            </button>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6 border-b border-gray-50 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                Assignment #{assignment.id}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${assignment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                assignment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {assignment.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {assignment.customer_name}
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium">Order ID: #{assignment.order_id}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black text-green-500">₹{assignment.delivery_fee}</div>
                        <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">Total Payout</p>
                    </div>
                </div>

                <StatusStepper currentStatus={assignment.status} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Addresses & Items */}
                    <div className="space-y-10">
                        <section>
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-[3px] mb-6 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-purple-600" /> Delivery Route
                            </h3>
                            <div className="space-y-6 relative pl-6 border-l-2 border-dashed border-gray-200 ml-2">
                                <div>
                                    <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Pickup – Vendor</p>
                                    <p className="text-gray-700 font-bold">{assignment.pickup_address}</p>
                                </div>
                                <div className="pt-4">
                                    <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest mb-1">Drop-off – Customer</p>
                                    <p className="text-gray-900 font-black text-lg">{assignment.delivery_address}</p>
                                    <p className="text-gray-500 font-bold">{assignment.delivery_city}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-gray-50 rounded-[2rem] p-8">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-[3px] mb-6 flex items-center gap-2">
                                <FaListUl className="text-purple-600" /> Order Items
                            </h3>
                            <div className="space-y-3">
                                {assignment.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">
                                                {item.quantity}x
                                            </div>
                                            <span className="font-bold text-gray-800">{item.product_name}</span>
                                        </div>
                                        <span className="text-gray-400 font-bold">₹{item.price}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right: Actions */}
                    <div className="space-y-6">
                        <div className="bg-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-purple-200">
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-6">Quick Actions</h4>
                            <div className="space-y-4">
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black flex items-center justify-center gap-4 transition-all">
                                    <FaPhoneAlt /> Call Customer
                                </button>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black flex items-center justify-center gap-4 transition-all">
                                    <FaDirections /> Get Directions
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {assignment.status === 'assigned' && (
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleAction('Accept', apiAcceptOrder)}
                                    className="w-full py-5 bg-purple-600 text-white font-black text-lg rounded-3xl shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-3"
                                >
                                    <FaCheck /> Accept Delivery
                                </button>
                            )}
                            {assignment.status === 'accepted' && (
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleAction('Pick Up', markPickedUp)}
                                    className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-3xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                                >
                                    <FaBox /> Mark as Picked Up
                                </button>
                            )}
                            {assignment.status === 'picked_up' && (
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleAction('In Transit', markInTransit)}
                                    className="w-full py-5 bg-orange-500 text-white font-black text-lg rounded-3xl shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                                >
                                    <FaShippingFast /> Start Delivery Trip
                                </button>
                            )}

                            {['accepted', 'picked_up', 'in_transit'].includes(assignment.status) && (
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleAction('Fail', failDelivery, 'Agent manually failed task')}
                                    className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                                >
                                    Report Delivery Failure
                                </button>
                            )}

                            {assignment.status === 'delivered' && (
                                <div className="p-8 bg-green-50 rounded-3xl text-center">
                                    <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-green-100">
                                        <FaCheck />
                                    </div>
                                    <h3 className="text-xl font-black text-green-700">Delivery Completed!</h3>
                                    <p className="text-green-600 font-medium">Earnings added to your wallet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
