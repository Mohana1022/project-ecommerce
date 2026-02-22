import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as VendorAPI from "../../api/vendor_axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ revenue: "0.00", products: 0, orders: 0, avg: "0.00" });
  const [salesChart, setSalesChart] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch real data from backend
        const [products, orders, profile, analytics] = await Promise.all([
          VendorAPI.getVendorProducts(),
          VendorAPI.getVendorOrders(),
          VendorAPI.getVendorProfile(),
          VendorAPI.getVendorEarningsAnalytics('weekly')
        ]);

        setVendor(profile);
        setSalesChart(analytics);

        const totalProducts = products.length;
        const totalOrders = orders.length;

        // Fetch Earnings Summary
        const earningsSummary = await VendorAPI.getVendorEarningsSummary();

        setStats({
          revenue: parseFloat(earningsSummary.lifetime_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          products: totalProducts,
          orders: totalOrders,
          available: parseFloat(earningsSummary.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          uncleared: parseFloat(earningsSummary.uncleared_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          totalGross: parseFloat(earningsSummary.total_gross || 0).toFixed(2),
          totalCommission: parseFloat(earningsSummary.total_commission || 0).toFixed(2),
          totalNet: parseFloat(earningsSummary.total_net || 0).toFixed(2),
        });

        // Recent Orders - Take the last 5
        setRecentOrders(orders.slice(0, 5).map(o => ({
          id: o.order_id,
          order_number: o.order_number, // Ensure this is available in the API response
          name: o.product,
          amount: (parseFloat(o.price) * o.quantity).toFixed(2),
          status: o.status
        })));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 403) {
          const reason = error.response?.data?.error || "Your vendor access has been restricted.";
          toast.error(reason, { duration: 5000 });
          localStorage.removeItem("user"); // Clear user session
          navigate('/login');
        } else {
          toast.error("Failed to load dashboard metrics");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const toggleStoreStatus = async () => {
    try {
      const newStatus = !vendor?.is_active;
      await VendorAPI.updateVendorProfile({ is_active: newStatus });
      setVendor({ ...vendor, is_active: newStatus });
      toast.success(newStatus ? "Your store is now LIVE! 🚀" : "Your store is now INACTIVE. Products hidden. ⏸️");
    } catch (error) {
      toast.error("Failed to update store status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium tracking-wide italic">Synchronizing store metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* WELCOME */}
      <div className="bg-gradient-to-r from-[#fb923c] via-[#c084fc] to-[#a78bfa] rounded-[32px] p-10 shadow-xl shadow-purple-500/10 mb-10 overflow-hidden relative border border-white/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-2xl"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
              Welcome back, <span className="text-orange-100 italic"> {vendor?.shop_name || "Vendor"}</span>!
            </h1>
            <p className="text-white/80 font-bold mt-3 uppercase tracking-[3px] text-xs">
              Here's what's happening with your store today.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 border border-white/20">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Store Status</p>
              <p className={`font-black tracking-tight ${vendor?.is_active ? 'text-green-300' : 'text-orange-200'}`}>
                {vendor?.is_active ? '● LIVE & SELLING' : '● INACTIVE'}
              </p>
            </div>
            <button
              onClick={toggleStoreStatus}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${vendor?.is_active
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                }`}
            >
              {vendor?.is_active ? 'Go Inactive' : 'Go Live'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        <Card title="Available Balance" value={`₹${stats.available}`} color="emerald" />
        <Card title="Uncleared (T+7)" value={`₹${stats.uncleared}`} color="orange" />
        <Card title="Lifetime Earnings" value={`₹${stats.revenue}`} color="violet" />
        <Card title="Total Orders" value={stats.orders} color="blue" />
      </div>



      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* SALES OVERVIEW */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Revenue Growth</h2>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={salesChart}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#7c3aed"
                  strokeWidth={4}
                  dot={{ fill: '#7c3aed', strokeWidth: 2, r: 6, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Recent Activity</h2>

          <div className="space-y-4">
            {recentOrders.map((order, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-100 group"
              >
                <div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{order.id}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate max-w-[120px] uppercase tracking-widest">{order.name}</p>
                </div>

                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm">₹{order.amount}</p>
                  <div className="flex gap-2 mt-1">
                    <a
                      href={`http://127.0.0.1:8000/api/vendor/orders/invoice/${order.order_number}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold text-violet-600 hover:underline"
                    >
                      Copy
                    </a>
                    <a
                      href={`http://127.0.0.1:8000/api/vendor/orders/commission/${order.order_number}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold text-emerald-600 hover:underline"
                    >
                      Comm.
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-400 font-bold text-sm">No orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* KPI CARD */

function Card({ title, value, color }) {
  const colors = {
    violet: { bg: 'bg-[#f8f6ff]', text: 'text-purple-600', accent: 'text-purple-900' },
    blue: { bg: 'bg-[#f4f7ff]', text: 'text-blue-500', accent: 'text-blue-900' },
    emerald: { bg: 'bg-[#f2fcf5]', text: 'text-emerald-500', accent: 'text-emerald-900' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-400', accent: 'text-orange-900' }
  };

  const style = colors[color] || colors.violet;

  return (
    <div className={`p-8 rounded-[32px] shadow-sm border border-gray-100 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${style.bg}`}>
      <p className={`text-[10px] font-black uppercase tracking-[2px] mb-4 ${style.text}`}>{title}</p>
      <div className={`font-black text-2xl tracking-tighter ${style.accent}`}>
        {value}
      </div>
    </div>
  );
}

