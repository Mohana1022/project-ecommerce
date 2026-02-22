import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { PanelLeftClose, PanelLeftOpen, Users, ShieldCheck, ShieldAlert, Eye } from 'lucide-react';
import { fetchAllDeliveryAgents, blockDeliveryAgent, unblockDeliveryAgent } from '../api/axios';
import { motion as Motion } from 'framer-motion';

const DeliveryList = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadAgents = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllDeliveryAgents();
            setAgents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch delivery agents", error);
            alert("Failed to load agents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAgents();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        navigate('/');
    };

    const handleBlockAction = async (id, isBlocked) => {
        try {
            if (isBlocked) {
                await unblockDeliveryAgent(id);
                alert("Agent unblocked");
            } else {
                const reason = prompt("Enter blocking reason:") || "Blocked by administrator";
                await blockDeliveryAgent(id, reason);
                alert("Agent blocked");
            }
            await loadAgents();
        } catch (error) {
            console.error("Block action failed:", error);
            alert("Action failed");
        }
    };

    const filteredAgents = agents.filter(agent => {
        if (filter === 'all') return true;
        if (filter === 'approved') return agent.approval_status === 'approved';
        if (filter === 'pending') return agent.approval_status === 'pending';
        if (filter === 'blocked') return agent.is_blocked;
        return true;
    });

    return (
        <div className="flex h-screen bg-gray-50/50 font-sans text-slate-900">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                activePage="Delivery Agents"
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
                            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Delivery Fleet</h1>
                            <p className="text-[10px] text-orange-50 font-black tracking-[2px] uppercase opacity-80 leading-none mt-1">Managed Logistics Network</p>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto space-y-10">
                    <div className="flex bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm w-fit overflow-x-auto">
                        {['all', 'approved', 'pending', 'blocked'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-gradient-to-r from-orange-400 to-purple-500 text-white shadow-xl shadow-orange-400/20'
                                    : 'text-slate-400 hover:bg-gray-50'}`}
                            >
                                {f} agents
                            </button>
                        ))}
                    </div>

                    <Motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <Users className="w-5 h-5 text-purple-500" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Fleet Index</h2>
                            </div>
                            <div className="px-4 py-2 bg-purple-50 border border-purple-100 rounded-full text-[10px] font-black text-purple-600 uppercase tracking-widest">
                                {filteredAgents.length} Agents Online
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent Information</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Vehicle</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Compliance</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Access</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating data...</p>
                                            </td>
                                        </tr>
                                    ) : filteredAgents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 mx-auto border border-gray-100 shadow-inner">
                                                    <Users className="w-12 h-12 text-gray-200" />
                                                </div>
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">No agents found in index</p>
                                            </td>
                                        </tr>
                                    ) : filteredAgents.map((agent) => (
                                        <tr key={agent.id} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[18px] flex items-center justify-center text-purple-600 font-black text-lg border border-white shadow-sm group-hover:scale-110 transition-transform">
                                                        {agent.user_email ? agent.user_email.charAt(0).toUpperCase() : 'A'}
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-black text-gray-900 tracking-tight group-hover:text-purple-600 transition-colors">{agent.user_email}</div>
                                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">{agent.phone_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                    {agent.vehicle_type}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${agent.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                                                    agent.approval_status === 'pending' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                                        'bg-rose-50 text-rose-500 border-rose-100'
                                                    }`}>
                                                    {agent.approval_status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {agent.is_blocked ? (
                                                    <span className="text-rose-500 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
                                                        <ShieldAlert className="w-3.5 h-3.5" /> Blocked
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-500 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => navigate(`/delivery/review/${agent.id}`)}
                                                        className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-xl transition-all border-2 border-transparent hover:border-indigo-100 shadow-sm hover:shadow-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockAction(agent.id, agent.is_blocked)}
                                                        className={`p-3 rounded-xl transition-all border-2 ${agent.is_blocked
                                                            ? 'text-emerald-500 hover:bg-white border-transparent hover:border-emerald-100 shadow-sm hover:shadow-lg'
                                                            : 'text-rose-500 hover:bg-white border-transparent hover:border-rose-100 shadow-sm hover:shadow-lg'
                                                            }`}
                                                        title={agent.is_blocked ? "Unblock" : "Block"}
                                                    >
                                                        {agent.is_blocked ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Motion.div>
                </div>
            </main>
        </div>
    );
};

export default DeliveryList;
