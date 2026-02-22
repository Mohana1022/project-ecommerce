import React, { useState, useMemo } from 'react';
import {
    Users,
    Search,
    PanelLeftClose,
    PanelLeftOpen,
    Ban,
    UserCheck,
    Filter,
    ShieldCheck,
    AlertTriangle,
    ArrowUpRight,
    SearchX,
    Clock,
    Mail,
    Loader2,
    RefreshCcw,
    AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { useUsers } from '../context/UserContext';

const UserManagement = () => {
    const { users, isLoading, error, stats, updateUserStatus, reloadUsers } = useUsers();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, BLOCKED
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [isActioning, setIsActioning] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    // Client-side filtering (server already paginates, we filter the fetched batch)
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ALL' || user.status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [users, searchTerm, activeTab]);

    const tabCounts = useMemo(() => ({
        ALL: users.length,
        ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
        BLOCKED: users.filter(u => u.status === 'BLOCKED').length,
    }), [users]);

    const handleActionClick = (user, action) => {
        setPendingAction({ user, action });
        setBlockReason('');
        setIsActionModalOpen(true);
    };

    const confirmAction = async () => {
        if (!pendingAction) return;
        setIsActioning(true);
        const { user, action } = pendingAction;
        const newStatus = action === 'BLOCK' ? 'BLOCKED' : 'ACTIVE';
        await updateUserStatus(user.id, newStatus, blockReason);
        setIsActioning(false);
        setIsActionModalOpen(false);
        setPendingAction(null);
        setBlockReason('');
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'BLOCKED': return 'bg-rose-50 text-rose-500 border-rose-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const getRiskColor = (score) => {
        if (score >= 70) return { bar: 'bg-rose-500', text: 'text-rose-600 font-bold' };
        if (score >= 40) return { bar: 'bg-amber-400', text: 'text-amber-600 font-bold' };
        return { bar: 'bg-emerald-400', text: 'text-emerald-600 font-medium' };
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-slate-900">
            <Sidebar isSidebarOpen={isSidebarOpen} activePage="Users" onLogout={() => window.location.href = '/'} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between z-20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-slate-900 tracking-tight">User Governance</h1>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100 tracking-widest leading-none">Live</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Access control &amp; status management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => reloadUsers()}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <div className="hidden lg:flex items-center bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> SuperAdmin
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Stat Cards — always from live stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                            <StatCard label="Total Registered" value={stats.total} icon={Users} color="indigo" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                            <StatCard label="Active Users" value={stats.active} icon={UserCheck} color="emerald" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
                            <StatCard label="Restricted Access" value={stats.blocked} icon={Ban} color="rose" />
                        </motion.div>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-semibold">{error}</span>
                            <button onClick={() => reloadUsers()} className="ml-auto text-xs font-black underline">Retry</button>
                        </div>
                    )}

                    {/* Toolbar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="flex flex-col xl:flex-row gap-6 items-center justify-between"
                    >
                        {/* Tabs */}
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto overflow-x-auto">
                            {['ALL', 'ACTIVE', 'BLOCKED'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab} List
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100'}`}>
                                        {tabCounts[tab]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-4 w-full xl:w-auto">
                            <div className="relative flex-1 xl:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Users Table */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        {['User Details', 'Contact', 'Risk Potential', 'Account Status', 'Joined Date', 'Governance'].map(h => (
                                            <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="6" className="px-8 py-8"><div className="h-10 bg-slate-100 rounded-2xl w-full" /></td>
                                            </tr>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-110 transition-transform">
                                                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900 mb-0.5">{user.name || '—'}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UID #{user.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="group/risk relative flex flex-col gap-2 min-w-[120px]">
                                                        <div className="flex items-center justify-between text-[11px] tracking-tight">
                                                            <span className={getRiskColor(user.riskScore ?? 0).text}>{user.riskScore ?? 0}%</span>
                                                            {(user.riskScore ?? 0) >= 70 && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-700 ${getRiskColor(user.riskScore ?? 0).bar}`}
                                                                style={{ width: `${user.riskScore ?? 0}%` }}
                                                            />
                                                        </div>
                                                        {/* Tooltip breakdown */}
                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/risk:flex flex-col gap-1 bg-slate-900 text-white text-[10px] font-bold rounded-xl px-3 py-2.5 shadow-xl z-10 w-44">
                                                            <div className="text-slate-400 uppercase tracking-widest mb-1">Risk Breakdown</div>
                                                            <div className="flex justify-between"><span className="text-slate-300">Cancelled Orders</span><span>{user.cancelled_orders ?? 0}</span></div>
                                                            <div className="flex justify-between"><span className="text-slate-300">Return Requests</span><span>{user.return_requests ?? 0}</span></div>
                                                            <div className="flex justify-between"><span className="text-slate-300">Failed Payments</span><span>{user.failed_payments ?? 0}</span></div>
                                                            <div className="flex justify-between"><span className="text-slate-300">Total Orders</span><span>{user.total_orders ?? 0}</span></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${getStatusStyles(user.status)}`}>
                                                            {user.status}
                                                        </span>
                                                        {user.status === 'BLOCKED' && user.blocked_reason && (
                                                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]" title={user.blocked_reason}>
                                                                {user.blocked_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-slate-300" /> {user.joinDate}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        {user.status === 'ACTIVE' ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleActionClick(user, 'BLOCK')}
                                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white"
                                                            >
                                                                <Ban className="w-3.5 h-3.5" /> Block Account
                                                            </motion.button>
                                                        ) : (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleActionClick(user, 'UNBLOCK')}
                                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" /> Restore Access
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-20">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                                                        <SearchX className="w-10 h-10 text-slate-300" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No matches found</h3>
                                                    <p className="text-sm text-slate-400 font-medium max-w-xs">Broaden your search criteria or adjust the filters to find the intended accounts.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-50/50 px-8 py-4 flex items-center justify-between border-t border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Live Directory • {filteredUsers.length} of {users.length} Users
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                                ISO Compliance Secured <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {isActionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => !isActioning && setIsActionModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative z-10 shadow-2xl border border-slate-100"
                        >
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 border mx-auto ${pendingAction?.action === 'BLOCK' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                {pendingAction?.action === 'BLOCK' ? <AlertTriangle className="w-10 h-10 text-rose-500" /> : <ShieldCheck className="w-10 h-10 text-emerald-500" />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 text-center mb-3">Governance Event</h2>
                            <p className="text-sm text-slate-500 text-center font-medium leading-relaxed mb-6 px-4">
                                {pendingAction?.action === 'BLOCK' ? (
                                    <>You are about to <span className="text-rose-500 font-bold">Restrict Access</span> for <span className="text-slate-900 font-bold">{pendingAction?.user.name}</span>.</>
                                ) : (
                                    <>You are about to <span className="text-emerald-500 font-bold">Restore Access</span> for <span className="text-slate-900 font-bold">{pendingAction?.user.name}</span>.</>
                                )}
                            </p>

                            {/* Reason field for blocking */}
                            {pendingAction?.action === 'BLOCK' && (
                                <textarea
                                    placeholder="Reason for blocking (optional)"
                                    value={blockReason}
                                    onChange={e => setBlockReason(e.target.value)}
                                    rows={2}
                                    className="w-full mb-6 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 resize-none"
                                />
                            )}

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={confirmAction}
                                    disabled={isActioning}
                                    className={`w-full py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${pendingAction?.action === 'BLOCK' ? 'bg-rose-500 shadow-rose-100 hover:bg-rose-600' : 'bg-slate-900 shadow-slate-100 hover:bg-slate-800'}`}
                                >
                                    {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Authorization'}
                                </button>
                                <button
                                    onClick={() => setIsActionModalOpen(false)}
                                    disabled={isActioning}
                                    className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-500/5',
        rose: 'text-rose-500 bg-rose-50 border-rose-100 shadow-rose-500/5',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-500/5',
    };

    return (
        <div className={`p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden`}>
            <div className={`absolute top-0 right-0 p-8 scale-150 opacity-5 group-hover:scale-125 transition-transform duration-1000 ${colors[color].split(' ')[0]}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="flex items-end justify-between">
                <div className="text-3xl font-black text-slate-900 leading-none">{value ?? '—'}</div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" /> LIVE
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
