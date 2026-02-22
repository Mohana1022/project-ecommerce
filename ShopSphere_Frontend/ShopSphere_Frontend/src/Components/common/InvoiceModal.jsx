import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Download,
    Printer,
    Package,
    Truck,
    Mail,
    CheckCircle2
} from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, order }) => {
    if (!order) return null;

    const handlePrint = () => {
        window.print();
    };

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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 leading-none">Tax Invoice</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Order #{order.order_number}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                                    title="Print"
                                >
                                    <Printer size={20} />
                                </button>
                                <button
                                    className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                                    title="Download PDF"
                                >
                                    <Download size={20} />
                                </button>
                                <div className="w-px h-8 bg-slate-200 mx-2"></div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 scrollbar-none invoice-print-area">
                            <div className="flex flex-col md:flex-row justify-between gap-12 mb-16 px-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-8 h-8 bg-black rounded-lg"></div>
                                        <span className="text-2xl font-black tracking-tighter uppercase italic">ShopSphere<span className="text-violet-600 text-3xl">.</span></span>
                                    </div>
                                    <div className="space-y-1 text-sm font-medium text-slate-500">
                                        <p className="font-bold text-slate-900">Registered Office:</p>
                                        <p>123 Commerce Avenue, Tech City</p>
                                        <p>Karnataka, India - 560001</p>
                                        <p>GSTIN: 29AAAAA0000A1Z5</p>
                                    </div>
                                </div>

                                <div className="flex-1 md:text-right">
                                    <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-widest mb-6 border border-emerald-100">
                                        Payment Status: {order.payment_status || 'Paid'}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex flex-col md:items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</p>
                                            <p className="text-sm font-bold text-slate-900">{order.date}</p>
                                        </div>
                                        <div className="flex flex-col md:items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                                            <p className="text-sm font-bold text-slate-900">{order.payment_method || 'Online'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12 mb-16 px-4">
                                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        <Truck size={14} className="text-violet-600" /> Shipping To
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-slate-900 mb-1">{order.customer_address?.name || 'Customer'}</p>
                                        <p className="text-sm font-medium text-slate-600">{order.customer_address?.address_line1}</p>
                                        <p className="text-sm font-medium text-slate-600">{order.customer_address?.city}, {order.customer_address?.state}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{order.customer_address?.phone}</p>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                                        <Mail size={14} className="text-violet-600" /> Billing Details
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-slate-900 mb-1">{order.customer_billing_address?.name || order.customer_address?.name || 'Customer'}</p>
                                        <p className="text-sm font-medium text-slate-600">{order.customer_billing_address?.address_line1 || order.customer_address?.address_line1}</p>
                                        <p className="text-sm text-slate-400 mt-4 leading-relaxed italic">
                                            This is a computer-generated document and does not require a physical signature.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 mb-16">
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-sans">
                                            <tr className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-900">{order.product}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">HSN Code: 8517</p>
                                                </td>
                                                <td className="px-8 py-6 text-center font-bold text-slate-600">{order.quantity}</td>
                                                <td className="px-8 py-6 text-right font-bold text-slate-600">₹{parseFloat(order.price).toFixed(2)}</td>
                                                <td className="px-8 py-6 text-right font-black text-slate-900">₹{(parseFloat(order.price) * order.quantity).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end px-4">
                                <div className="w-full max-w-sm space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Subtotal Balance</span>
                                        <span className="font-black text-slate-700 font-sans">₹{(parseFloat(order.price) * order.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse"></span>
                                            <span className="font-black text-slate-900 uppercase tracking-widest text-sm">Total Payable</span>
                                        </div>
                                        <span className="text-3xl font-black text-violet-600 font-sans tracking-tighter">₹{(parseFloat(order.price) * order.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-20 px-4 pt-8 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Terms & Conditions</p>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                        1. All goods remain the property of ShopSphere until paid in full.
                                        2. Returns must be initiated within 15 days of delivery.
                                        3. Warranty is provided by the respective manufacturer/vendor.
                                    </p>
                                    <div className="flex flex-col md:items-end justify-center">
                                        <div className="w-32 h-16 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-100 border-dashed">
                                            <span className="text-[10px] font-black text-slate-300 uppercase italic">Digital Stamp</span>
                                        </div>
                                        <p className="text-[10px] font-black text-violet-600 uppercase mt-2 tracking-widest">ShopSphere Authorized</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InvoiceModal;
