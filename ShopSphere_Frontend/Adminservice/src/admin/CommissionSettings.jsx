import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PanelLeftClose,
    PanelLeftOpen,
    Percent,
    Info,
    RefreshCcw,
    Save,
    ShieldCheck,
    TrendingUp,
    Settings,
    Trash2,
    Plus,
    Activity,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import {
    fetchGlobalCommission,
    fetchCategoryCommissions,
    updateGlobalCommission,
    saveCategoryCommission,
    deleteCategoryCommission
} from '../api/axios';

const CATEGORIES = [
    { id: 'electronics', label: 'Electronics' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'home_kitchen', label: 'Home & Kitchen' },
    { id: 'beauty_personal_care', label: 'Beauty & Personal Care' },
    { id: 'sports_fitness', label: 'Sports & Fitness' },
    { id: 'toys_games', label: 'Toys & Games' },
    { id: 'automotive', label: 'Automotive' },
    { id: 'grocery', label: 'Grocery' },
    { id: 'books', label: 'Books' },
    { id: 'services', label: 'Services' },
    { id: 'other', label: 'Other' },
];

const CommissionSettings = () => {
    const [commission, setCommission] = useState(10); // Default 10%
    const [inputValue, setInputValue] = useState(10);
    const [categoryCommissions, setCategoryCommissions] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form state for new category override
    const [newOverride, setNewOverride] = useState({ category: '', percentage: 10 });
    const [showAddForm, setShowAddForm] = useState(false);

    const headerGradient = "from-[#fb923c] via-[#c084fc] to-[#a78bfa]";

    // Fetching current settings from Backend
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const [globalData, categoryData] = await Promise.all([
                    fetchGlobalCommission(),
                    fetchCategoryCommissions()
                ]);

                if (globalData && globalData.percentage !== undefined) {
                    setCommission(globalData.percentage);
                    setInputValue(globalData.percentage);
                }

                if (Array.isArray(categoryData)) {
                    setCategoryCommissions(categoryData);
                } else if (categoryData && Array.isArray(categoryData.results)) {
                    setCategoryCommissions(categoryData.results);
                }
            } catch (error) {
                console.error("Failed to fetch commission settings:", error);
                setMessage({ type: 'error', text: 'Failed to load current commission settings.' });
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        window.location.href = '/';
    };

    const handleSave = async () => {
        // Validation
        const val = parseFloat(inputValue);
        if (isNaN(val) || val < 0 || val > 100) {
            setMessage({ type: 'error', text: 'Please enter a valid percentage between 0 and 100.' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const data = await updateGlobalCommission({
                percentage: val,
                commission_type: 'percentage'
            });
            setCommission(data.percentage);
            setMessage({ type: 'success', text: 'Global commission settings updated successfully.' });

            // Auto hide message
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            console.error("Failed to update commission settings:", error);
            setMessage({ type: 'error', text: 'Failed to update commission settings.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategoryOverride = async () => {
        if (!newOverride.category) {
            setMessage({ type: 'error', text: 'Please select a category.' });
            return;
        }

        setIsCategoryLoading(true);
        try {
            const data = await saveCategoryCommission({
                category: newOverride.category,
                percentage: parseFloat(newOverride.percentage),
                commission_type: 'percentage'
            });
            setCategoryCommissions([...categoryCommissions, data]);
            setNewOverride({ category: '', percentage: 10 });
            setShowAddForm(false);
            setMessage({ type: 'success', text: `Commission override added successfully.` });
        } catch (error) {
            console.error("Failed to add category override:", error);
            const errorData = error.response?.data;
            let errorMsg = 'Failed to add category override.';
            if (errorData) {
                if (typeof errorData === 'object') {
                    errorMsg = Object.entries(errorData)
                        .map(([key, val]) => `${Array.isArray(val) ? val.join(', ') : val}`)
                        .join(' | ');
                }
            }
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsCategoryLoading(false);
        }
    };

    const handleDeleteCategoryOverride = async (id) => {
        if (!window.confirm('Are you sure you want to remove this category override?')) return;

        setIsCategoryLoading(true);
        try {
            await deleteCategoryCommission(id);
            setCategoryCommissions(categoryCommissions.filter(item => item.id !== id));
            setMessage({ type: 'success', text: 'Category override removed.' });
        } catch (error) {
            console.error("Failed to delete category override:", error);
            setMessage({ type: 'error', text: 'Failed to delete category override.' });
        } finally {
            setIsCategoryLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50/50 font-sans selection:bg-purple-100 overflow-hidden text-slate-900">
            <Sidebar isSidebarOpen={isSidebarOpen} activePage="Settings" onLogout={handleLogout} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className={`bg-gradient-to-r ${headerGradient} h-20 px-8 flex items-center justify-between z-40 shadow-lg`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white/80 hover:text-white bg-white/10 rounded-xl transition-all">
                            {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Platform Configuration</h1>
                            <p className="text-[10px] text-orange-50 font-black tracking-[2px] uppercase opacity-80 leading-none mt-1">SuperAdmin Node Secured</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest gap-2">
                            System Logic Active
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
                    <div className="max-w-4xl mx-auto w-full space-y-10">
                        <AnimatePresence>
                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`p-6 rounded-[24px] border-2 shadow-sm flex items-center gap-4 ${message.type === 'success'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        : 'bg-rose-50 border-rose-100 text-rose-600'
                                        }`}
                                >
                                    {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    <span className="text-sm font-black uppercase tracking-wider">{message.text}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm col-span-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-purple-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl shadow-sm">
                                        <Percent className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Global Commission Flow</h2>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Universal network transaction fee</p>
                                    </div>
                                </div>

                                <div className="space-y-10 relative z-10">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-70 italic">Percentage Configuration</label>
                                        <div className="relative group max-w-sm">
                                            <input
                                                type="number"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                step="0.1"
                                                className="w-full pl-8 pr-16 py-6 bg-gray-50 border-2 border-transparent focus:border-purple-200 focus:bg-white rounded-[32px] transition-all text-4xl font-black text-gray-900 shadow-inner group-hover:shadow-md outline-none"
                                            />
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-3xl group-focus-within:text-purple-400 transition-colors">%</div>
                                        </div>
                                        <p className="mt-4 text-xs text-slate-500 font-bold flex items-center gap-2">
                                            <Info className="w-4 h-4 text-purple-500" /> Active Platform Rate: <span className="font-black text-gray-900 py-1 px-3 bg-purple-50 rounded-full border border-purple-100">{commission}%</span>
                                        </p>
                                    </div>

                                    <div className="pt-10 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-8">
                                        <div className="max-w-xs">
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[2px] mb-2 opacity-80">Revenue Retention Protocol</h4>
                                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">This amount is withheld during settlement synchronization. Final price for customers remains static.</p>
                                        </div>
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-400 to-purple-500 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[2px] shadow-2xl shadow-purple-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isLoading ? 'Synchronizing...' : 'Deploy Global Rule'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="bg-gradient-to-br from-[#818cf8] to-[#c084fc] p-8 rounded-[40px] text-white shadow-2xl shadow-purple-200 flex flex-col justify-between aspect-square relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                                    <div className="p-4 bg-white/20 rounded-[24px] w-fit backdrop-blur-md relative z-10">
                                        <ShieldCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-black text-white/60 uppercase tracking-[3px] mb-2">Network Impact</div>
                                        <div className="text-5xl font-black mb-3 tracking-tighter">{commission}%</div>
                                        <p className="text-[11px] text-white/80 font-bold leading-relaxed uppercase tracking-wider">The system retains ₹{commission} for every ₹100 of decentralized trade.</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl shadow-sm">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Growth Index</h4>
                                    </div>
                                    <div className="text-4xl font-black text-gray-900 tracking-tighter">+4.27%</div>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-widest">Projected algorithmic lift</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mb-32 blur-3xl opacity-50"></div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-12 relative z-10">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-3 tracking-tight">
                                        <Settings className="w-6 h-6 text-purple-500" /> Category Overrides
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">Specific logic for niche topological nodes</p>
                                </div>
                                <button
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showAddForm
                                        ? 'bg-rose-50 text-rose-500 border border-rose-100'
                                        : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 italic hover:scale-105 active:scale-95'}`}
                                >
                                    {showAddForm ? 'Abort Rule Creation' : 'Inject New Rule'}
                                </button>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {categoryCommissions.length === 0 && !showAddForm ? (
                                    <div className="text-center py-20 bg-gray-50/50 rounded-[32px] border-4 border-dashed border-gray-100">
                                        <Percent className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-[4px]">Zero Overrides Detected</p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-60">All nodes synchronized with global rule set</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {categoryCommissions.map((item) => (
                                            <motion.div
                                                layout
                                                key={item.id}
                                                className="flex items-center justify-between p-6 bg-white rounded-[24px] border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="p-3 bg-purple-50 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                        <Percent className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-gray-900 capitalize tracking-tight">{item.category_display || item.category}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Bypass</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="text-2xl font-black text-gray-900 tracking-tight">{item.percentage}%</div>
                                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">Rule Rate</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteCategoryOverride(item.id)}
                                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                <AnimatePresence>
                                    {showAddForm && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="p-10 bg-indigo-50/30 rounded-[32px] border border-indigo-100/50 shadow-inner"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] pl-1">Target Node</label>
                                                    <div className="relative">
                                                        <select
                                                            value={newOverride.category}
                                                            onChange={(e) => setNewOverride({ ...newOverride, category: e.target.value })}
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none text-xs font-black text-slate-700 appearance-none shadow-sm cursor-pointer"
                                                        >
                                                            <option value="">Select Category Node...</option>
                                                            {CATEGORIES
                                                                .filter(cat => !categoryCommissions.some(item => item.category === cat.id))
                                                                .map(cat => (
                                                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                                ))
                                                            }
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                                            <Plus className="w-4 h-4 rotate-45" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] pl-1">Bypass Rate</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={newOverride.percentage}
                                                            onChange={(e) => setNewOverride({ ...newOverride, percentage: e.target.value })}
                                                            className="w-full px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-400 rounded-2xl outline-none text-lg font-black text-gray-900 shadow-sm"
                                                        />
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">%</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleAddCategoryOverride}
                                                    disabled={isCategoryLoading}
                                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {isCategoryLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    Deploy Rule
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <Activity className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12" />
                            <h3 className="text-lg font-black text-white flex items-center gap-3 tracking-tight mb-10 relative z-10">
                                <ShieldCheck className="w-6 h-6 text-orange-400" /> Platform Logic Governance
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400 text-xs font-black">01</div>
                                    <div>
                                        <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wide">Dynamic Resolution</h4>
                                        <p className="text-[11px] text-white/50 leading-relaxed font-bold italic">Bypass rules take precedence. The system resolves category overrides before defaulting to the global {commission}% protocol.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-purple-400 text-xs font-black">02</div>
                                    <div>
                                        <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wide">State Persistency</h4>
                                        <p className="text-[11px] text-white/50 leading-relaxed font-bold italic">Transaction snapshots are immutable. New rules propagate only to future orders initiated after deployment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CommissionSettings;
