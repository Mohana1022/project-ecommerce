import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaClock, FaArrowUp, FaWallet, FaReceipt, FaCheck, FaTruck, FaMotorcycle } from 'react-icons/fa';
import { fetchEarningsSummary, fetchCommissionList, requestWithdrawal } from '../../api/delivery_axios';
import { toast } from 'react-hot-toast';

export default function EarningsPage() {
    const navigate = useNavigate();

    const [earnings, setEarnings] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [filter, setFilter] = useState('monthly');
    const [txLoading, setTxLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const loadEarnings = useCallback(async () => {
        try {
            const data = await fetchEarningsSummary(filter);
            setEarnings(data);
        } catch (error) {
            console.error("Earnings load failed:", error);
            if (error.response?.status === 403) {
                const reason = error.response?.data?.error || "Your account access has been restricted.";
                toast.error(reason, { duration: 5000 });
                localStorage.removeItem("accessToken");
                navigate('/delivery');
            } else {
                toast.error("Failed to load earnings");
            }
        }
    }, [filter, navigate]);

    const loadCommissions = async () => {
        try {
            setTxLoading(true);
            const data = await fetchCommissionList();
            setCommissions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Commission list load failed:", error);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        loadEarnings();
    }, [loadEarnings]);

    useEffect(() => {
        loadCommissions();
    }, []);

    const handleWithdraw = async () => {
        if (!withdrawAmount || isNaN(withdrawAmount)) {
            toast.error("Please enter a valid amount");
            return;
        }
        try {
            await requestWithdrawal(withdrawAmount);
            toast.success("Withdrawal request submitted!");
            setWithdrawAmount('');
            loadEarnings();
        } catch (error) {
            toast.error(error.response?.data?.error || "Withdrawal failed");
        }
    };

    const statusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            approved: 'bg-blue-100 text-blue-700',
            pending: 'bg-amber-100 text-amber-700',
            processing: 'bg-purple-100 text-purple-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-600';
    };

    const totalEarned = parseFloat(earnings?.total || '0.00');
    const paidAmount = parseFloat(earnings?.paid || '0.00');
    const pendingAmount = parseFloat(earnings?.pending || '0.00');
    const approvedAmount = parseFloat(earnings?.approved || '0.00');

    return (
        <div className="w-full p-8">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Earnings Terminal</h1>
                    <p className="text-gray-500 mt-1">Track your performance and payouts.</p>
                </div>
                <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                    {['today', 'monthly', 'yearly'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Commission Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Settled', val: paidAmount.toFixed(2), icon: FaCheck, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
                            { label: 'Pending', val: pendingAmount.toFixed(2), icon: FaClock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
                            { label: 'Approved', val: approvedAmount.toFixed(2), icon: FaArrowUp, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
                        ].map((item, i) => (
                            <div key={i} className={`${item.bg} border ${item.border} rounded-3xl p-6 shadow-sm`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-xl bg-white/70 shadow-sm`}>
                                        <item.icon className={`w-4 h-4 ${item.color}`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</span>
                                </div>
                                <div className="text-2xl font-black text-gray-900">₹{item.val}</div>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Commission earnings</p>
                            </div>
                        ))}
                    </div>

                    {/* Commission Transaction History */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-gray-900 font-bold mb-6 flex items-center gap-2 text-lg">
                            <FaReceipt className="text-purple-600" /> Commission History
                        </h3>

                        {txLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            </div>
                        ) : commissions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic">
                                <FaTruck className="mx-auto mb-3 text-4xl opacity-30" />
                                <p>No commission records yet. Complete deliveries to earn commissions.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="pb-4 px-2">Order</th>
                                            <th className="pb-4 px-2 text-right">Base Fee</th>
                                            <th className="pb-4 px-2 text-right">Distance Bonus</th>
                                            <th className="pb-4 px-2 text-right">Total Earned</th>
                                            <th className="pb-4 px-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {commissions.map((c, idx) => (
                                            <tr key={c.id || idx} className="group hover:bg-gray-50/50 transition-all duration-200">
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                                                            <FaMotorcycle className="text-purple-500 text-sm" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">
                                                                {c.delivery_assignment?.order?.order_number || c.notes || `Delivery #${c.id}`}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right font-bold text-gray-700">
                                                    ₹{parseFloat(c.base_fee || 0).toFixed(2)}
                                                </td>
                                                <td className="py-4 px-2 text-right font-bold text-blue-600">
                                                    +₹{parseFloat(c.distance_bonus || 0).toFixed(2)}
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <span className="font-black text-lg text-green-600">
                                                        ₹{parseFloat(c.total_commission || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${statusBadge(c.status)}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                                        <tr>
                                            <td className="py-4 px-2 font-black text-gray-900 text-sm">Total</td>
                                            <td className="py-4 px-2 text-right font-black text-gray-900">
                                                ₹{commissions.reduce((s, c) => s + parseFloat(c.base_fee || 0), 0).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-2 text-right font-black text-blue-600">
                                                +₹{commissions.reduce((s, c) => s + parseFloat(c.distance_bonus || 0), 0).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <span className="font-black text-lg text-green-600">
                                                    ₹{commissions.reduce((s, c) => s + parseFloat(c.total_commission || 0), 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Wallet Card */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <FaWallet className="text-purple-400 w-5 h-5" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[3px] opacity-60">Revenue Wallet</span>
                            </div>

                            <div className="mb-4">
                                <span className="text-xs font-medium opacity-50 mb-1 block">Total Earned ({filter})</span>
                                <h2 className="text-5xl font-black tracking-tighter">₹{totalEarned.toFixed(2)}</h2>
                            </div>

                            <div className="mb-10 grid grid-cols-2 gap-3">
                                <div className="bg-white/10 rounded-2xl p-3">
                                    <p className="text-[10px] opacity-50 uppercase tracking-widest mb-1">Paid Out</p>
                                    <p className="font-black text-green-400">₹{paidAmount.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-3">
                                    <p className="text-[10px] opacity-50 uppercase tracking-widest mb-1">Pending</p>
                                    <p className="font-black text-amber-400">₹{(pendingAmount + approvedAmount).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="number"
                                    placeholder="Enter amount ₹"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-white/20 outline-none focus:border-purple-500 transition-all font-sans"
                                />
                                <button
                                    onClick={handleWithdraw}
                                    className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    Initiate Withdrawal
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Commission Guide */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 text-sm">How You Earn</h4>
                        <div className="space-y-3">
                            {[
                                { label: 'Base Delivery Fee', desc: 'Earned per completed delivery', color: 'bg-purple-500' },
                                { label: 'Distance Bonus', desc: '+20% for out-of-city routes', color: 'bg-blue-500' },
                                { label: 'Settlement Time', desc: 'Commissions processed within 48h', color: 'bg-green-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 mt-1 rounded-full ${item.color} flex-shrink-0`}></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">{item.label}</p>
                                        <p className="text-xs text-gray-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <hr className="my-4 border-gray-100" />
                        <h4 className="font-bold text-gray-900 mb-3 text-sm">Payout Policy</h4>
                        <ul className="space-y-2 text-xs text-gray-500 font-medium">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                                Min. ₹100 required for withdrawal
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                                TDS of 1% applicable on earnings
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                                Settlements processed within 48h
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
