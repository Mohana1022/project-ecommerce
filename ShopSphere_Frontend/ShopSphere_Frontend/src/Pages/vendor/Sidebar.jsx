import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  CubeIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon
} from "@heroicons/react/24/outline";

export default function Sidebar() {

  const [desktopOpen, setDesktopOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // notify layout about current sidebar state
    window.dispatchEvent(new CustomEvent('vendorSidebarToggle', { detail: { open: desktopOpen } }));
  }, [desktopOpen]);

  useEffect(() => {
    // hide top nav and footer when vendor sidebar is mounted
    const selectors = ['nav', 'header', '.navbar', 'footer', '.site-footer'];
    const elems = [];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        elems.push({ el, display: el.style.display });
        el.style.display = 'none';
      });
    });

    return () => {
      // restore original display styles
      elems.forEach(({ el, display }) => {
        el.style.display = display || '';
      });
    };
  }, []);

  const menu = [
    { path: "/welcome", label: "Dashboard", icon: HomeIcon },
    { path: "/vendorprofile", label: "Profile", icon: UserIcon },
    { path: "/vendorallproducts", label: "Products", icon: CubeIcon },
    { path: "/vendoraddproduct", label: "Add Product", icon: PlusCircleIcon },
    { path: "/vendororders", label: "Orders", icon: ShoppingCartIcon },
    { path: "/vendorearning", label: "Earnings", icon: BanknotesIcon },
    { path: "/vendorfeestructure", label: "Fee Structure", icon: CubeIcon }
  ];

  return (
    <>
      {/* MOBILE SIDEBAR (always visible, fixed) */}
      <aside
        className="fixed z-50 top-0 left-0 h-full bg-white/95 backdrop-blur-lg w-72 p-6 md:hidden shadow-2xl border-r border-gray-100"
      >

        <div className="flex justify-between items-center mb-10 px-2 mt-2">
          <h2 className="font-extrabold text-2xl bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tighter">Vendor Portal</h2>
        </div>

        <Menu menu={menu} location={location} close={() => { }} />

      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:block fixed top-0 left-0 h-screen bg-white/80 backdrop-blur-md shadow-2xl p-4 transition-all duration-300 z-30 border-r border-white/20 ${desktopOpen ? 'w-64' : 'w-20'}`}
      >

        <div className="flex justify-between items-center mb-10 px-2 mt-4">

          {desktopOpen && <h2 className="font-extrabold text-2xl bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tighter">Vendor Portal</h2>}

          <button onClick={() => setDesktopOpen(!desktopOpen)} aria-label="Toggle sidebar" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bars3Icon
              className="h-6 w-6 text-gray-500"
            />
          </button>

        </div>

        <ul className="space-y-3">

          {menu.map(item => {
            const active = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-black tracking-tight transition-all duration-300
                  ${active
                      ? "bg-gradient-to-r from-orange-400 to-purple-500 text-white shadow-xl shadow-orange-400/20"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-400"}`} />
                  {desktopOpen && item.label}
                </Link>
              </li>
            );
          })}

          <li className="pt-4 mt-4 border-t border-gray-100">
            <Link
              to="/logout"
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-black tracking-tight text-red-500 hover:bg-red-50 transition-all duration-300 group"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              {desktopOpen && 'Logout'}
            </Link>
          </li>

        </ul>

      </aside>
    </>
  );
}

/* MOBILE MENU */

function Menu({ menu, location, close }) {
  return (
    <ul className="space-y-3">

      {menu.map(item => {
        const active = location.pathname === item.path;

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={close}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-black tracking-tight transition-all duration-300
              ${active
                  ? "bg-gradient-to-r from-orange-400 to-purple-500 text-white shadow-xl shadow-orange-400/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-400"}`} />
              {item.label}
            </Link>
          </li>
        );
      })}

      <li className="pt-4 mt-4 border-t border-gray-100">
        <Link
          to="/logout"
          onClick={close}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-black tracking-tight text-red-500 hover:bg-red-50 transition-all duration-300 group"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Logout
        </Link>
      </li>

    </ul>
  );
}
