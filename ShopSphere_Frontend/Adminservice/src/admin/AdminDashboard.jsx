import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingCart, PanelLeftClose, PanelLeftOpen, ClipboardList, Users, Wallet, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { useProducts } from '../context/ProductContext';
import { fetchDashboardStats, fetchWalletBalance } from '../api/axios';
import { useEffect } from 'react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [dashData, setDashData] = useState(null);
    const [wallet, setWallet] = useState(null);
    const { products } = useProducts();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [stats, walletData] = await Promise.all([
                    fetchDashboardStats(),
                    fetchWalletBalance()
                ]);
                setDashData(stats);
                setWallet(walletData);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            }
        };
        loadData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        window.location.href = '/';
    };

    const stats = [
        {
            title: 'Admin Wallet',
            value: wallet ? `₹${wallet.balance}` : '₹0.00',
            icon: Wallet,
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
            route: '/dashboard'
        },
        {
            title: 'Total Vendors',
            value: dashData?.vendors.total || 0,
            icon: Store,
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
            route: '/vendors'
        },
        {
            title: 'Pending Vendors',
            value: dashData?.vendors.pending || 0,
            icon: ClipboardList,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            route: '/vendors/requests'
        },
        {
            title: 'Approved Vendors',
            value: dashData?.vendors.approved || 0,
            icon: Store,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            route: '/vendors',
            routeState: { filter: 'approved' }
        },
        {
            title: 'Blocked Vendors',
            value: dashData?.vendors.blocked || 0,
            icon: Store,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            route: '/vendors',
            routeState: { filter: 'Blocked' }
        },
        {
            title: 'Inactive Vendors',
            value: dashData?.vendors.inactive || 0,
            icon: Store,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            route: '/vendors',
            routeState: { filter: 'Inactive' }
        },
        {
            title: 'Total Products',
            value: products.length,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            route: '/products'
        },
        {
            title: 'Blocked Products',
            value: products.filter(p => p.status === 'Blocked').length,
            icon: ShoppingCart,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            route: '/products',
            routeState: { status: 'Blocked' }
        },
        {
            title: 'Total Agents',
            value: dashData?.agents?.total || 0,
            icon: ClipboardList,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            route: '/delivery/agents'
        },
        {
            title: 'Pending Agents',
            value: dashData?.agents?.pending || 0,
            icon: ClipboardList,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            route: '/delivery/requests'
        },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-slate-800">

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                activePage="Dashboard"
                onLogout={handleLogout}
            />

            {/* main */}
            <main className="flex-1 overflow-y-auto transition-all duration-300 bg-gray-50/50">
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
                                <h1 className="text-lg font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100 tracking-widest leading-none">Live</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">System Overview & Performance</p>
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-10 max-w-7xl mx-auto">
                    {/* WELCOME */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="bg-[#0d0415] rounded-[32px] p-8 shadow-xl border border-orange-500/10 flex items-center justify-between overflow-hidden relative"
                    >
                        {/* BG glow blobs */}
                        <div className="absolute -top-16 -left-16 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

                        {/* Left: text */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                    Admin Portal
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                Welcome back, <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">Chief Admin</span>!
                            </h2>
                            <p className="text-white/40 font-medium mt-1 text-xs uppercase tracking-[3px]">
                                System Overview &amp; Management
                            </p>
                        </div>

                        {/* Right: logo */}
                        <div className="relative z-10 flex-shrink-0">
                            <img
                                src="/s_logo.png"
                                alt="ShopSphere"
                                className="w-24 h-24 object-contain drop-shadow-[0_0_28px_rgba(139,92,246,0.65)]"
                            />
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                                key={index}
                                onClick={() => navigate(stat.route, stat.routeState ? { state: stat.routeState } : undefined)}
                                className="bg-white rounded-[32px] p-8 shadow-sm transition-all duration-300 border border-gray-100 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-4 rounded-2xl ${stat.bgColor.replace('50', '100/50')} group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[2px] mb-1">{stat.title}</h3>
                                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-400 transition-colors">
                                    View Details
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                        {/* Vendor Management Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/50 backdrop-blur-sm rounded-[40px] p-8 border border-gray-100"
                        >
                            <h2 className="text-xl font-black text-gray-900 mb-8 px-2 tracking-tight">Vendor Management</h2>
                            <div className="flex flex-col gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/vendors/requests')}
                                    className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-[24px] p-6 shadow-xl shadow-orange-400/20 transition-all duration-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 p-3 rounded-xl">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-widest">New Requests</span>
                                    </div>
                                    <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">ACTION REQUIRED</div>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/vendors')}
                                    className="w-full bg-slate-900 text-white rounded-[24px] p-6 shadow-xl shadow-slate-900/20 transition-all duration-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-3 rounded-xl">
                                            <Store className="w-6 h-6" />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-widest">All Vendors</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Delivery Management Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/50 backdrop-blur-sm rounded-[40px] p-8 border border-gray-100"
                        >
                            <h2 className="text-xl font-black text-gray-900 mb-8 px-2 tracking-tight">Delivery Management</h2>
                            <div className="flex flex-col gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/delivery/requests')}
                                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-[24px] p-6 shadow-xl shadow-purple-500/20 transition-all duration-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 p-3 rounded-xl">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-widest">Join Requests</span>
                                    </div>
                                    <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">REVIEW</div>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/delivery/agents')}
                                    className="w-full bg-slate-900 text-white rounded-[24px] p-6 shadow-xl shadow-slate-900/20 transition-all duration-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-3 rounded-xl">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-widest">All Agents</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
