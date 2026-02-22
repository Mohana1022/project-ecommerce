import { BrowserRouter, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./Components/common/Navbar";
import Footer from "./Components/common/Footer";
import { Toaster } from "react-hot-toast";

function Layout() {
  const location = useLocation();
  // Hide the customer Navbar/Footer on delivery, vendor, and auth pages.
  // Using startsWith so that any /delivery/* or /vendor* sub-route is
  // automatically covered — no need to manually add new paths to a list.
  const isDeliveryRoute = location.pathname.startsWith("/delivery");
  const isVendorRoute = location.pathname.toLowerCase().includes("vendor") || location.pathname.startsWith("/welcome");
  const isAuthRoute = [
    "/", "/login", "/signup",
    "/account-verification", "/verify-otp",
    "/verifyGST", "/verifyPAN",
    "/store-name", "/shipping-address",
    "/shipping-method", "/shipping-fee-preferences", "/bank-details",
  ].includes(location.pathname);

  const hideNavbarFooter = isDeliveryRoute || isVendorRoute || isAuthRoute;


  return (
    <div className="flex flex-col min-h-screen">
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{
          top: 90,
          right: 20,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '1.1rem',
            fontWeight: '600',
            padding: '16px 24px',
            borderRadius: '16px',
            background: '#1e1b4b',
            color: '#fff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px border-white/10',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {!hideNavbarFooter && <Navbar />}
      <main className={`flex-grow ${!hideNavbarFooter ? "pt-24" : ""}`}>
        <AppRoutes />
      </main>
      {!hideNavbarFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />

    </BrowserRouter>
  );
}

export default App;
