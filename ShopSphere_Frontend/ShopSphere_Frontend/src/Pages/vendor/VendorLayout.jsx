import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { getVendorProfile } from "../../api/vendor_axios";
import { UserCircleIcon, BellIcon } from "@heroicons/react/24/outline";

export default function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getVendorProfile();
        setVendor(data);
      } catch (error) {
        console.error("Error fetching vendor profile:", error);
      }
    };
    fetchProfile();

    const handler = (e) => setSidebarOpen(Boolean(e?.detail?.open));
    window.addEventListener('vendorSidebarToggle', handler);
    window.dispatchEvent(new CustomEvent('vendorSidebarRequest'));
    return () => window.removeEventListener('vendorSidebarToggle', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        {/* TOP HEADER */}
        <header className="h-20 bg-gradient-to-r from-[#fb923c] via-[#c084fc] to-[#a78bfa] flex items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight drop-shadow-md">
              {vendor ? vendor.shop_name : "Vendor Dashboard"}
            </h1>
            <p className="text-[10px] font-black text-orange-50 uppercase tracking-[2px] opacity-80">Managed by {vendor?.user?.first_name || 'Vendor'}</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-xl relative hover:bg-white/20">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-400 rounded-full border-2 border-[#c084fc]"></span>
            </button>
            <Link to="/vendorprofile" className="flex items-center gap-3 p-1 pr-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group border border-white/10">
              <div className="w-10 h-10 bg-white text-[#c084fc] rounded-xl flex items-center justify-center font-bold group-hover:scale-105 transition-transform shadow-lg shadow-black/5">
                {vendor?.shop_name?.charAt(0) || 'V'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-white leading-none mb-0.5">{vendor?.shop_name || "Loading..."}</p>
                <p className="text-[9px] font-black text-orange-100 uppercase tracking-wider leading-none opacity-80">View Profile</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
