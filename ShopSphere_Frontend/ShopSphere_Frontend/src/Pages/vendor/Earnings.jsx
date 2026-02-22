import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FaWallet, FaDownload, FaArrowUp } from 'react-icons/fa';
import { getVendorEarningsSummary, getVendorEarningsAnalytics, getWalletBalance, vendorWithdraw } from "../../api/vendor_axios";
import toast from "react-hot-toast";

// vendor earnings page styled like delivery earnings
export default function Earnings() {
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [summary, setSummary] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [withdrawing, setWithdrawing] = useState(false);

  const loadData = async () => {
    try {
      const [sumData, walletData] = await Promise.all([
        getVendorEarningsSummary(),
        getWalletBalance()
      ]);
      setSummary(sumData);
      setWallet(walletData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async () => {
    const amount = window.prompt("Enter amount to withdraw:");
    if (!amount) return;

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setWithdrawing(true);
      const res = await vendorWithdraw(amount);
      toast.success(res.message || "Withdrawal successful!");
      await loadData(); // Refresh balance
    } catch (err) {
      toast.error(err.response?.data?.error || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getVendorEarningsAnalytics(timeFilter);
        setChartData(data);
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [timeFilter]);

  const walletBalance = wallet ? parseFloat(wallet.balance) : 0.00;
  const totalRevenue = summary?.available_balance ? parseFloat(summary.available_balance) : 0.00;
  const unclearedBalance = summary?.uncleared_balance ? parseFloat(summary.uncleared_balance) : 0.00;
  const lifetimeEarnings = summary?.lifetime_earnings ? parseFloat(summary.lifetime_earnings) : 0.00;
  const pendingPayouts = summary?.pending_payouts ? parseFloat(summary.pending_payouts) : 0.00;
  const transactions = summary?.recent_activities || [];

  const getChartConfig = () => {
    switch (timeFilter) {
      case 'yearly': return { type: 'bar', color: '#8b5cf6' };
      case 'monthly': return { type: 'line', color: '#10b981' };
      case 'today': return { type: 'area', color: '#f59e0b' };
      default: return { type: 'bar', color: '#3b82f6' };
    }
  }

  const { type, color } = getChartConfig();

  if (!summary && loading) {
    return <div className="h-96 flex items-center justify-center font-bold text-gray-400">Loading your earnings...</div>
  }

  return (
    <div>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Earnings & Payouts</h1>
          <p className="text-gray-500 mt-1">Overview of your store earnings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-gray-200 disabled:opacity-50"
          >
            <FaWallet /> {withdrawing ? 'Processing...' : 'Withdraw Funds'}
          </button>
          <button className="px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
            <FaDownload />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12"></div>
          <p className="text-purple-100 font-bold text-xs uppercase tracking-widest mb-1">Wallet Balance</p>
          <h2 className="text-4xl font-black mb-4">₹{walletBalance.toFixed(2)}</h2>
          <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
            <FaWallet className="text-green-300" /> <span className="font-bold tracking-tight">Real-time Funds</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Lifetime Earnings</p>
          <h2 className="text-3xl font-black text-emerald-600 mb-2">₹{lifetimeEarnings.toFixed(2)}</h2>
          <p className="text-gray-400 text-sm font-bold">Total net revenue</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Pending Payouts</p>
          <h2 className="text-3xl font-black text-gray-900 mb-2">₹{pendingPayouts.toFixed(2)}</h2>
          <p className="text-gray-400 text-sm">Processing in 24h</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Uncleared balance</p>
          <h2 className="text-3xl font-black text-gray-900 mb-2">₹{unclearedBalance.toFixed(2)}</h2>
          <p className="text-gray-400 text-sm italic">7-day settlement period</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-100 border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h3 className="text-xl font-bold text-gray-900">Earnings Analytics</h3>
          <div className="bg-gray-100 p-1.5 rounded-xl flex">
            {['today', 'weekly', 'monthly', 'yearly'].map(filter => (
              <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${timeFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {filter === 'today' ? 'Hourly' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {type === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="earnings" fill={color} radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            ) : type === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Line type="monotone" dataKey="earnings" stroke={color} strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Area type="monotone" dataKey="earnings" stroke={color} fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={3} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm overflow-hidden">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="pb-4 px-4">Activity</th>
                <th className="pb-4 px-4 text-center">Order #</th>
                <th className="pb-4 px-4 text-right">Gross</th>
                <th className="pb-4 px-4 text-right">Comm.</th>
                <th className="pb-4 px-4 text-right">Net Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length ? transactions.map(item => (
                <tr key={item.id} className="group hover:bg-gray-50/50 transition-all duration-200">
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.entry_type === 'PAYOUT' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                        {item.entry_type === 'PAYOUT' ? '💸' : '💰'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{item.description}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">{item.date} • <span className={item.is_settled ? 'text-green-500' : 'text-amber-500'}>{item.is_settled ? 'Settled' : 'Uncleared'}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-center">
                    <span className="font-mono text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {item.order_number || '-'}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-right font-bold text-gray-900">
                    ₹{item.entry_type === 'REVENUE' ? parseFloat(item.gross_amount).toFixed(2) : parseFloat(item.amount).toFixed(2)}
                  </td>
                  <td className="py-5 px-4 text-right font-bold text-red-500">
                    {item.entry_type === 'REVENUE' ? `-₹${parseFloat(item.commission_amount).toFixed(2)}` : '₹0.00'}
                  </td>
                  <td className="py-5 px-4 text-right">
                    <span className={`font-black text-lg ${parseFloat(item.net_amount || item.amount) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ₹{parseFloat(item.net_amount || item.amount).toFixed(2)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400 font-medium">No recent activity recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
