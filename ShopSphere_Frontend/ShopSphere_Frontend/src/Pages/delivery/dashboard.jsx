import { useState, useEffect } from 'react';
import { FaBox, FaDollarSign, FaMapMarkerAlt, FaCheck, FaSignOutAlt, FaBars, FaTruck, FaClipboardList, FaMoneyBillWave, FaTachometerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchDeliveryDashboard, acceptOrder as apiAcceptOrder } from '../../api/delivery_axios';
import { toast } from 'react-hot-toast';

export default function DeliveryDashboard() {
    const navigate = useNavigate();



    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeAssignments, setActiveAssignments] = useState([]);


    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await fetchDeliveryDashboard();
                setProfile(data.profile);
                setStats(data.today_stats);
                setActiveAssignments(data.active_assignments);
            } catch (error) {
                console.error("Dashboard load failed:", error);
                if (error.response?.status === 403) {
                    const reason = error.response?.data?.error || "Your account has been restricted.";
                    toast.error(reason, { duration: 5000 });
                    localStorage.removeItem("accessToken");
                    navigate('/delivery');
                } else {
                    toast.error("Failed to load dashboard data");
                }
            }

        };
        loadDashboard();
    }, [navigate]);




    const handleAcceptOrder = async (assignmentId) => {
        try {
            await apiAcceptOrder(assignmentId);
            toast.success('Order accepted!');
            // Refresh data
            const data = await fetchDeliveryDashboard();
            setActiveAssignments(data.active_assignments);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to accept order");
        }
    };


    return (
        <div className="w-full min-h-screen bg-gray-50/30">

            {/* Top Bar / Header */}
            <div className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <FaTachometerAlt />
                    </div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Control Center</h1>
                </div>
                {profile && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                            {profile.user_name?.[0] || profile.username?.[0] || 'A'}
                        </div>
                        <span className="text-xs font-black text-gray-600 uppercase tracking-wider">{profile.user_name || profile.username}</span>
                    </div>
                )}
            </div>


            <div className="p-8 max-w-7xl mx-auto">

                {/* Profile Welcome Section - Structured format */}
                <div className="mb-10 relative overflow-hidden bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-4xl shadow-2xl shadow-purple-200 ring-8 ring-purple-50">
                                {profile?.user_name?.[0] || profile?.username?.[0] || <FaTruck size={40} />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                                    Welcome back, <span className="text-purple-600">{profile?.user_name || profile?.username || 'Delivery Captain'}!</span>
                                </h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-[2px]">
                                        <FaTruck className="text-purple-500" /> {profile?.vehicle_type || 'Vehicle'} • {profile?.vehicle_number || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl text-[10px] font-black text-amber-600 uppercase tracking-[2px] border border-amber-100">
                                        ⭐ {profile?.average_rating || '5.0'} Rating
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-xl text-[10px] font-black text-green-600 uppercase tracking-[2px] border border-green-100">
                                        🟢 Online & Active
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">Operations Status</p>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-sm font-bold text-gray-700">Accepting Deliveries</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div className="group bg-white rounded-[32px] p-6 border border-gray-100 hover:shadow-2xl hover:shadow-emerald-200/20 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                    <FaMoneyBillWave className="w-6 h-6" />
                                </div>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100">Life Time</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 tracking-tighter mb-1">₹{profile?.total_earnings || '0.00'}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Earnings</p>
                        </div>
                    </div>

                    <div className="group bg-white rounded-[32px] p-6 border border-gray-100 hover:shadow-2xl hover:shadow-blue-200/20 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                    <FaBox className="w-6 h-6" />
                                </div>
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100">Performance</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{profile?.completed_deliveries || 0}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Deliveries Completed</p>
                        </div>
                    </div>

                    <div className="group bg-white rounded-[32px] p-6 border border-gray-100 hover:shadow-2xl hover:shadow-purple-200/20 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                                    <FaMoneyBillWave className="w-6 h-6" />
                                </div>
                                <span className="bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-100">Live Status</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 tracking-tighter mb-1">₹{stats?.total_earnings || '0.00'}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Today's Earnings</p>
                        </div>
                    </div>
                </div>


                {/* Active Assignments Section */}
                {activeAssignments.length > 0 ? (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Active Shipments</h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] mt-1">Orders ready for processing</p>
                            </div>
                            <div className="bg-purple-100 text-purple-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-purple-200">
                                {activeAssignments.length} Pending
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {activeAssignments.map((assignment) => (
                                <div key={assignment.id} className="group bg-white rounded-[32px] p-8 border border-gray-100 hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full translate-x-12 -translate-y-12 opacity-40 group-hover:scale-125 transition-transform duration-500"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors duration-300">
                                                    <FaBox size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-lg">Order #{assignment.id}</h4>
                                                    <p className="text-sm font-bold text-gray-400">Customer: {assignment.customer_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-purple-600 tracking-tighter">₹{assignment.delivery_fee}</div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Commission</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-purple-100 transition-all duration-300">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                                    <FaMapMarkerAlt size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Delivery Destination</p>
                                                    <p className="text-sm font-bold text-gray-700 line-clamp-1">{assignment.delivery_address || assignment.delivery_city}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {assignment.status === 'assigned' && (
                                                <button
                                                    onClick={() => handleAcceptOrder(assignment.id)}
                                                    className="flex-1 bg-gray-900 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-purple-600 hover:shadow-xl hover:shadow-purple-200 transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <FaCheck className="w-3 h-3" />
                                                    Accept Task
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/delivery/order/${assignment.id}`)}
                                                className="flex-1 bg-white border-2 border-gray-100 text-gray-900 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-[2px] hover:border-purple-200 hover:bg-purple-50 transition-all duration-300 flex items-center justify-center"
                                            >
                                                Intelligence Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/10 mb-12 relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-50"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-gray-50/50">
                                <FaBox className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Clear Runway</h3>
                            <p className="text-gray-400 font-bold max-w-xs mx-auto">No active delivery assignments at the moment. Take a break or check back shortly.</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
