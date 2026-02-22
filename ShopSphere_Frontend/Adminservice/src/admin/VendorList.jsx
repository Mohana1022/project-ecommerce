import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import { useVendors } from '../context/VendorContext';
import { PanelLeftClose, PanelLeftOpen, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const VendorList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { vendors, updateVendorStatus } = useVendors();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Use location state if available for deep filtering
    const initialFilter = location.state?.filter || 'All Vendors';
    const [filterStatus, setFilterStatus] = useState(initialFilter);
    const [activeFilter, setActiveFilter] = useState(initialFilter);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVendors = useMemo(() => {
        return vendors.filter(vendor => {
            const matchesStatus = activeFilter === 'All Vendors' || vendor.status === activeFilter;
            const matchesSearch = vendor.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.owner.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [vendors, activeFilter, searchQuery]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        navigate('/');
    };

    const handleStatusUpdate = async (id, status) => {
        await updateVendorStatus(id, status);
    };

    return (
        <div className="flex h-screen bg-gray-50/50 font-sans selection:bg-orange-500/10 overflow-hidden text-slate-900">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                activePage="Vendors"
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="bg-gradient-to-r from-[#fb923c] via-[#c084fc] to-[#a78bfa] h-20 px-8 flex items-center justify-between sticky top-0 z-20 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-white/80 hover:text-white bg-white/10 rounded-xl transition-all"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Vendor Registry</h1>
                            <p className="text-[10px] text-orange-50 font-black tracking-[2px] uppercase opacity-80 leading-none mt-1">Marketplace Partner Index</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest gap-2">
                            <ShieldCheck className="w-4 h-4" /> Compliance Secured
                        </div>
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white font-bold border border-white/30 shadow-sm">A</div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Search and Filters */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full relative">
                            <SearchBar
                                placeholder="Search by store or owner..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClear={() => setSearchQuery('')}
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 md:w-56 bg-gray-50 border border-gray-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-[20px] focus:ring-4 focus:ring-orange-500/5 focus:border-orange-400 outline-none p-4 appearance-none cursor-pointer transition-all shadow-sm"
                            >
                                <option>All Partners</option>
                                <option>Approved</option>
                                <option>Blocked</option>
                                <option>Pending</option>
                            </select>
                            <button
                                onClick={() => setActiveFilter(filterStatus)}
                                className="px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[20px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity / Store</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Principal</th>
                                        <th className="px-10 py-6 text-[10px) font-black text-slate-400 uppercase tracking-[0.2em] text-center">Compliance</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Onboarded</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredVendors.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-purple-50 rounded-[18px] flex items-center justify-center text-orange-500 font-black text-lg shadow-sm border border-white">
                                                        {vendor.storeName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-black text-gray-900 tracking-tight group-hover:text-orange-500 transition-colors">{vendor.storeName}</div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">ID: {vendor.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-[13px] font-black text-slate-600 text-center">{vendor.owner}</td>
                                            <td className="px-10 py-8 text-center">
                                                <span className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${vendor.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                                                    vendor.status === 'Blocked' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                        'bg-amber-50 text-amber-500 border-amber-100'
                                                    }`}>
                                                    {vendor.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-[13px] font-black text-slate-400 text-center opacity-60">{vendor.registrationDate}</td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => {
                                                            if (vendor.status === 'Pending') {
                                                                navigate(`/vendors/review/${vendor.id}`);
                                                            } else {
                                                                navigate(`/vendor/${vendor.id}`);
                                                            }
                                                        }}
                                                        className="px-6 py-3 text-[10px] font-black text-indigo-500 bg-white hover:bg-indigo-500 hover:text-white rounded-[18px] transition-all uppercase tracking-widest border-2 border-indigo-100 hover:border-indigo-500 shadow-lg shadow-indigo-100"
                                                    >
                                                        Details
                                                    </button>
                                                    {vendor.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(vendor.id, 'Blocked')}
                                                            className="px-6 py-3 text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600 rounded-[18px] transition-all uppercase tracking-widest shadow-xl shadow-rose-200"
                                                        >
                                                            Block
                                                        </button>
                                                    )}
                                                    {vendor.status === 'Blocked' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(vendor.id, 'Approved')}
                                                            className="px-6 py-3 text-[10px] font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-[18px] transition-all uppercase tracking-widest shadow-xl shadow-emerald-200"
                                                        >
                                                            Unblock
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredVendors.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-24 text-center">
                                                <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 mx-auto border border-gray-100 shadow-inner">
                                                    <Info className="w-12 h-12 text-gray-200" />
                                                </div>
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Zero Partners Found in Index</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VendorList;
