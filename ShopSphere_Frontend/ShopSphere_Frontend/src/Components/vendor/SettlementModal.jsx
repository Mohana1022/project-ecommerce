import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Wallet,
    TrendingUp,
    Calculator,
    Banknote,
    ShieldCheck
} from 'lucide-react';

const SettlementModal = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    const grossSales = parseFloat(item.price || item.product_price) * parseInt(item.quantity);
    const platformCommission = parseFloat(item.commission_amount || 0);
    const netEarning = grossSales - platformCommission;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-10 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-2xl"></div>

                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Wallet size={24} />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-widest text-white/90">Earning Statement</h2>
                            </div>

                            <p className="text-violet-100 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Payout Terminal</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter">₹{netEarning.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                <span className="bg-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/30">
                                    Final Net
                                </span>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 bg-white font-sans">
                            <div className="flex items-center justify-between py-4 border-b border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Item</p>
                                    <p className="font-black text-slate-900 leading-none">{item.product_name || item.product}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order #</p>
                                    <p className="font-bold text-slate-600">{item.order_number}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                                            <Banknote size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Gross Sale Amount</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Price × Quantity</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-black text-slate-900">
                                        ₹{grossSales.toFixed(2)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                                            <TrendingUp size={18} className="rotate-180" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-rose-600">Platform Commission</p>
                                                <div className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black">
                                                    {item.commission_rate}%
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base Rate Exclusion</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-black text-rose-500">
                                        - ₹{platformCommission.toFixed(2)}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 my-2"></div>

                                <div className="flex items-center justify-between p-5 bg-violet-50 rounded-[2rem] border border-violet-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200">
                                            <Calculator size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-violet-900 uppercase tracking-widest">Settlement Net</p>
                                            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">To be credited</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-black text-violet-600 text-xl tracking-tighter">
                                        ₹{netEarning.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                                    This settlement is automatically calculated based on your category commission rate ({item.commission_rate}%).
                                    Funds will be cleared as per the <span className="font-bold">T+7 payout cycle</span>.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                Acknowledge Statement
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettlementModal;
