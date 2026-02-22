import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { PanelLeftClose, PanelLeftOpen, Search, Eye, CheckCircle, XCircle } from 'lucide-react';
import { fetchVendorRequests, approveVendorRequest, rejectVendorRequest } from '../api/axios';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VendorRequests = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const loadVendors = async () => {
        setIsLoading(true);
        try {
            const data = await fetchVendorRequests();
            setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch vendor requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVendors();
    }, []);

    const pendingRequests = vendors.filter(vendor => vendor.approval_status === 'pending');

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        navigate('/');
    };

    const handleAction = async (id, action) => {
        try {
            if (action === "Approved") {
                await approveVendorRequest(id);
            } else {
                await rejectVendorRequest(id, "Rejected by administrator");
            }
            await loadVendors();
        } catch (error) {
            console.error("Action execution failed:", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50/50 font-sans text-slate-800 selection:bg-indigo-100">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                activePage="Vendor Requests"
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between z-20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </motion.button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-slate-900 tracking-tight">Vendor Management</h1>
                                <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-orange-100 tracking-widest leading-none">Review Needed</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Approvals & Onboarding</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Toolbar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">
                                Pending Queue
                                <span className="bg-white/20 px-1.5 py-0.5 rounded-md">{pendingRequests.length}</span>
                            </span>
                        </div>
                    </motion.div>

                    {/* Table Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop & Partner Details</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Tracking</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Review Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence mode="popLayout">
                                        {pendingRequests.map((vendor, index) => (
                                            <motion.tr
                                                layout
                                                key={vendor.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-orange-500/10 uppercase">
                                                            {vendor.shop_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{vendor.shop_name}</p>
                                                            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{vendor.user_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        {vendor.approval_status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-bold text-slate-600">{new Date(vendor.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Applied for partnership</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => navigate(`/vendors/review/${vendor.id}`)}
                                                            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                                            title="Review Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleAction(vendor.id, 'Approved')}
                                                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100"
                                                            title="Approve Partner"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleAction(vendor.id, 'Rejected')}
                                                            className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                                                            title="Reject Partner"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {!isLoading && pendingRequests.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                                                        <Search className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Inbox is empty</p>
                                                    <p className="text-xs text-slate-300 font-medium">No new vendor requests to process</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default VendorRequests;
