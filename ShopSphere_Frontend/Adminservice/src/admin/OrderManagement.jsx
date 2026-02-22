import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    PanelLeftClose,
    PanelLeftOpen,
    ClipboardList,
    Eye,
    Search,
    Filter,
    Calendar,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { fetchAdminOrders } from '../api/axios';
import { motion as Motion } from 'framer-motion';

const OrderManagement = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAdminOrders({
                page: currentPage,
                search: searchTerm,
                status: statusFilter
            });
            setOrders(data.results || []);
            setTotalPages(Math.ceil(data.count / 20)); // Assuming page size 20
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [currentPage, statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadOrders();
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

    return (
        <div className="flex h-screen bg-gray-50/50 font-sans text-slate-900 leading-relaxed">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                activePage="Orders"
                onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto transition-all duration-300">
                <header className="bg-gradient-to-r from-[#fb923c] via-[#c084fc] to-[#a78bfa] h-20 sticky top-0 z-40 px-8 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-white/80 hover:text-white bg-white/10 rounded-xl transition-all"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Order Registry</h1>
                            <p className="text-[10px] text-orange-50 font-black tracking-[2px] uppercase opacity-80 leading-none mt-1">Platform Transaction Index</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest gap-2">
                            System Monitoring Active
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto space-y-10">
                    {/* Filters and Search */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <form onSubmit={handleSearch} className="relative flex-1 w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[20px] text-[13px] font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:bg-white focus:border-orange-400 transition-all shadow-inner placeholder:text-slate-400 placeholder:uppercase placeholder:tracking-widest"
                            />
                        </form>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-56">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-14 pr-8 py-4 bg-gray-50 border border-gray-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-[20px] focus:ring-4 focus:ring-orange-500/5 focus:border-orange-400 outline-none appearance-none cursor-pointer transition-all shadow-sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                onClick={handleSearch}
                                className="px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[20px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    <Motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <ClipboardList className="w-5 h-5 text-orange-500" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Registrations</h2>
                            </div>
                            <div className="px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                Global Data Sync Complete
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stakeholder Details</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Net Amount</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Protocol Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying database...</p>
                                            </td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 mx-auto border border-gray-100 shadow-inner">
                                                    <ClipboardList className="w-12 h-12 text-gray-200" />
                                                </div>
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Record set is empty</p>
                                            </td>
                                        </tr>
                                    ) : orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-900 text-base tracking-tight group-hover:text-orange-500 transition-colors">#{order.order_number}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest opacity-60">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="text-[13px] font-black text-slate-600">{order.customer_email}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Verified Account</div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className="text-base font-black text-slate-900 tabular-nums">₹{order.total_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => navigate(`/orders/${order.id}`)}
                                                        className="px-6 py-3 text-[10px] font-black text-orange-500 bg-white hover:bg-orange-500 hover:text-white rounded-[18px] transition-all uppercase tracking-widest border-2 border-orange-100 hover:border-orange-500 shadow-lg shadow-orange-100"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Segment {currentPage} of {totalPages} <span className="mx-2 opacity-30">•</span> Total Indexing Resolved
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-3 bg-white border border-gray-100 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-3 bg-white border border-gray-100 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </Motion.div>
                </div>
            </main>
        </div>
    );
};

export default OrderManagement;
