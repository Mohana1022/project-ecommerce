import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Filter,
    Eye,
    Store,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronDown,
    Package
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

import { useProducts } from '../context/ProductContext';

const ProductManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { products, updateProductStatus } = useProducts();
    const [isLoading, setIsLoading] = useState(true);

    // Read search term from navigation state (e.g., from Vendor Details)
    const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '');

    const [vendorFilter, setVendorFilter] = useState('All Vendors');

    // Read status from dashboard navigation state
    const initialStatus = location.state?.status || 'All States';
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const vendorsList = useMemo(() => {
        const vendors = Array.from(new Set(products.map(p => p.vendor_name || p.vendor)));
        return ['All Vendors', ...vendors.filter(Boolean)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesVendor = vendorFilter === 'All Vendors' || (p.vendor_name === vendorFilter || p.vendor?.toString() === vendorFilter);
            const matchesStatus = statusFilter === 'All States' ||
                (statusFilter === 'Active' && p.status?.toLowerCase() === 'active') ||
                (statusFilter === 'Blocked' && (p.status?.toLowerCase() === 'blocked' || p.is_blocked));
            return matchesSearch && matchesVendor && matchesStatus;
        });
    }, [products, searchTerm, vendorFilter, statusFilter]);

    const handleAction = (productId, newStatus) => {
        updateProductStatus(productId, newStatus);
    };

    const handleLogout = () => {
        sessionStorage.clear();
        window.location.href = '/';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans selection:bg-violet-100 overflow-hidden text-slate-900">
            <Sidebar isSidebarOpen={isSidebarOpen} activePage="Products" onLogout={handleLogout} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-slate-800" />
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manage Products</h1>
                            </div>
                            <p className="text-xs text-slate-500 font-medium ml-7">Monitor and control all products from vendors</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-900 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-violet-900/20">A</div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50/50">
                    {/* Filter Container */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search product name..."
                                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Dropdowns */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative min-w-[140px]">
                                <select
                                    className="appearance-none w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/10 transition-all cursor-pointer"
                                    value={vendorFilter}
                                    onChange={(e) => setVendorFilter(e.target.value)}
                                >
                                    {vendorsList.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative min-w-[140px]">
                                <select
                                    className="appearance-none w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/10 transition-all cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option>All States</option>
                                    <option>Active</option>
                                    <option>Blocked</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Funnel Icon */}
                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#FBFCFD] border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-8"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        {product.images && product.images.length > 0 ? (
                                                            <img
                                                                src={product.images[0].url}
                                                                alt={product.name}
                                                                className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                                                                <Package size={14} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 leading-tight uppercase tracking-tight">{product.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase italic">ID: {product.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/vendor/${product.vendor}`)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white hover:border-indigo-100 border border-transparent transition-all"
                                                    >
                                                        <Store size={12} />
                                                        {product.vendor_name || 'View Vendor'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{product.category}</td>
                                                <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(product.price)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-bold text-center">{product.quantity}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${product.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => setSelectedProduct(product)}
                                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(product.id, product.status?.toLowerCase() === 'active' ? 'inactive' : 'active')}
                                                            className={`${product.status?.toLowerCase() === 'active' ? 'text-rose-500 hover:text-rose-700' : 'text-emerald-500 hover:text-emerald-700'} text-xs font-bold transition-colors`}
                                                        >
                                                            {product.status?.toLowerCase() === 'active' ? 'Block' : 'Unblock'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                                                No products found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh]"
                        >
                            {/* Image Section */}
                            <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-100">
                                <div className="flex-1 min-h-[300px] mb-4 relative rounded-2xl overflow-hidden bg-white border border-slate-200">
                                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                        <img
                                            src={selectedProduct.activeImage || selectedProduct.images[0].url}
                                            alt={selectedProduct.name}
                                            className="w-full h-full object-contain p-4"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                            <Package size={48} className="mb-2 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No Visual Assets</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scrolling Image Gallery */}
                                {selectedProduct.images && selectedProduct.images.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {selectedProduct.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedProduct({ ...selectedProduct, activeImage: img.url })}
                                                className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 transition-all overflow-hidden bg-white ${selectedProduct.activeImage === img.url || (!selectedProduct.activeImage && idx === 0) ? 'border-violet-600 scale-95 shadow-lg' : 'border-transparent hover:border-slate-200'}`}
                                            >
                                                <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="w-full md:w-1/2 p-8 flex flex-col bg-white">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-violet-600" />
                                        Audit Profile
                                    </h2>
                                    <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <ChevronDown className="w-5 h-5 text-slate-400 rotate-90" />
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Name</p>
                                        <p className="text-lg font-bold text-slate-900 leading-tight">{selectedProduct.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${selectedProduct.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {selectedProduct.status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedProduct.category}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price Points</p>
                                            <p className="text-lg font-black text-slate-900">{formatCurrency(selectedProduct.price)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Level</p>
                                            <p className="text-lg font-black text-slate-900">{selectedProduct.quantity} Units</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Merchant Information</p>
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-indigo-50 transition-colors"
                                            onClick={() => navigate(`/vendor/${selectedProduct.vendor}`)}>
                                            <Store className="w-5 h-5 text-indigo-500" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm leading-none mb-1">{selectedProduct.vendor_name}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedProduct.vendor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-8"
                                >
                                    Termination Audit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductManagement;

