import React from 'react';
import {
    LayoutDashboard,
    Users,
    Store,
    Package,
    BarChart3,
    Settings,
    LogOut,
    ClipboardList,
    Truck,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen, activePage = 'Dashboard', onLogout }) => {
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Users', icon: Users, path: '/users' },
        { name: 'Vendors', icon: Store, path: '/vendors' },
        { name: 'Vendor Requests', icon: ClipboardList, path: '/vendors/requests' },
        { name: 'Orders', icon: ClipboardList, path: '/orders' },
        { name: 'Delivery Agents', icon: Truck, path: '/delivery/agents' },
        { name: 'Delivery Requests', icon: ClipboardList, path: '/delivery/requests' },
        { name: 'Products', icon: Package, path: '/products' },
        { name: 'Reports', icon: BarChart3, path: '/reports' },
        { name: 'Commission Settings', icon: Settings, path: '/settings/commission' },
    ];

    return (
        <>
            {/* Mobile backdrop — only visible when sidebar open on small screens */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
                    onClick={onLogout /* parent toggles it via its own state */}
                />
            )}

            {/* Sidebar panel */}
            <aside
                style={{
                    width: isSidebarOpen ? '256px' : '0px',
                    minWidth: isSidebarOpen ? '256px' : '0px',
                    transition: 'width 0.28s ease, min-width 0.28s ease',
                    overflow: 'hidden',
                }}
                className={`
                    relative z-50 flex-shrink-0 h-screen
                    bg-white border-r border-slate-100 shadow-xl shadow-slate-200/60
                    md:relative md:translate-x-0
                    ${isSidebarOpen ? '' : 'border-r-0'}
                `}
            >
                {/* Inner container — fixed width so content doesn't squish during animation */}
                <div className="flex flex-col h-full w-64 font-['Inter',sans-serif]">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100">
                        <img
                            src="/s_logo.png"
                            alt="ShopSphere"
                            className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.7)] flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="leading-tight">
                            <span className="block text-[15px] font-black tracking-tight" style={{ background: 'linear-gradient(to right, #f97316, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                ShopSphere
                            </span>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                Admin Panel
                            </span>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                        {menuItems.map((item, index) => {
                            const isActive = item.name === activePage;
                            return (
                                <motion.button
                                    key={item.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(item.path)}
                                    className={`
                                        flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl
                                        text-[13px] font-semibold tracking-tight transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-orange-400/25'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }
                                    `}
                                >
                                    <item.icon
                                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                                            }`}
                                    />
                                    <span className="truncate">{item.name}</span>
                                    {isActive && (
                                        <motion.span
                                            layoutId="activeIndicator"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </nav>

                    {/* Footer / User info */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-3 border-t border-slate-100"
                    >
                        <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow flex-shrink-0">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">Admin User</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate leading-tight">
                                    admin@shopsphere.com
                                </p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all group flex-shrink-0"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                </div>
            </aside>
        </>
    );
};

export default Sidebar;
