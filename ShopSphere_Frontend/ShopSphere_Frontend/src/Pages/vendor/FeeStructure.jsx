import { useState, useEffect } from "react";
import { fetchCommissionInfo } from "../../api/vendor_axios";
import { FaPercent, FaListUl, FaInfoCircle } from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function FeeStructure() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchCommissionInfo();
                setData(result);
            } catch (err) {
                console.error("Failed to load fee structure:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const globalRate = data?.global_rate;
    const overrides = data?.category_overrides || [];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Fee Structure</h1>
                <p className="text-gray-500">Transparent breakdown of platform commissions and fees.</p>
            </motion.div>

            {/* Global Rate Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 mb-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-24 -translate-y-24 blur-3xl"></div>

                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md mb-4 inline-block">Default Platform Fee</span>
                        <h2 className="text-5xl font-black mb-2">
                            {globalRate?.commission_type === 'percentage' ? `${globalRate.percentage}%` :
                                globalRate?.commission_type === 'fixed' ? `₹${globalRate.fixed_amount}` : 'N/A'}
                        </h2>
                        <p className="text-blue-100 font-medium max-w-sm">This is the standard commission applied to most categories unless specifies otherwise below.</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                        <FaPercent size={32} />
                    </div>
                </div>
            </motion.div>

            {/* Category Overrides */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaListUl className="text-blue-600" /> Category Exceptions
                </h3>

                {overrides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {overrides.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (idx * 0.05) }}
                                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.category_display}</h4>
                                    <p className="text-xl font-black text-gray-900">
                                        {item.commission_type === 'percentage' ? `${item.percentage}%` : `₹${item.fixed_amount}`}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                                    {item.category_display?.[0]}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center">
                        <FaInfoCircle className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">No category exceptions active. Standard rates apply to all categories.</p>
                    </div>
                )}
            </div>

            <div className="mt-12 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <div className="flex gap-4">
                    <FaInfoCircle className="text-amber-500 mt-1 shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900 mb-1">How it works</h4>
                        <p className="text-sm text-amber-800 leading-relaxed">
                            Commissions are automatically deducted from the total order amount before settlement.
                            The rate is frozen at the time the order is placed. If you have questions about these rates, please contact support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
