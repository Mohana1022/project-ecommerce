import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    CheckCircle2,
    Clock,
    Package,
    BarChart3,
    Wallet,
    ArrowRight,
    Home,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getVendorStatus } from '../../api/vendor_axios';
import toast from 'react-hot-toast';


// PendingStatusPage - Shown when vendor registration is under review

const PendingStatusPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fef3f2] to-[#f3e8ff] flex items-center justify-center px-4 py-2">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full"
            >
                {/* Main Card */}
                <div className="bg-white rounded-[24px] shadow-2xl shadow-orange-200/50 p-5 md:p-6 border border-orange-100">
                    {/* Status Badge */}
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Clock size={24} />
                            </motion.div>
                            <span className="font-black text-sm uppercase tracking-wider">Pending Approval</span>
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-md">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <ShoppingBag size={32} className="text-orange-400" strokeWidth={1.5} />
                            </motion.div>
                        </div>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-3 tracking-tight leading-tight">
                        Your Seller Registration is <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500">
                            Under Processing
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed font-medium max-w-sm mx-auto">
                        Your request is currently <span className="text-orange-600 font-bold">under processing</span>.
                        Within 7 working days you will get the update.
                    </p>

                    {/* Info Box */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-5">
                        <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Clock size={18} className="text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 mb-0.5 text-sm">What's Next?</h3>
                                <p className="text-[13px] text-gray-700 font-medium leading-tight">
                                    You'll be notified once approved. Typically takes <span className="font-black text-orange-700">7 working days</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/profile')}
                            className="px-8 py-4 bg-gradient-to-r from-orange-400 to-purple-500 text-white rounded-[20px] font-black text-base shadow-xl shadow-orange-200 flex items-center justify-center gap-2 transition-all"
                        >
                            <Home size={20} />
                            Back to Profile
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/home')}
                            className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 hover:border-orange-300 rounded-[20px] font-black text-base transition-all"
                        >
                            Explore ShopSphere
                        </motion.button>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-center text-gray-500 mt-8 font-medium text-sm">
                    Need help? Contact our support team at <span className="text-orange-400 font-bold">support@shopsphere.com</span>
                </p>
            </motion.div>
        </div>
    );
};

/**
 * ApprovedStatusPage - Shown when vendor is approved
 */
const ApprovedStatusPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Package,
            title: "Products",
            description: "List inventory"
        },
        {
            icon: BarChart3,
            title: "Orders",
            description: "Track sales"
        },
        {
            icon: Wallet,
            title: "Earnings",
            description: "Revenue"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fef3f2] to-[#f3e8ff] flex items-center justify-center px-4 py-2">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-lg w-full"
            >
                {/* Main Card */}
                <div className="bg-white rounded-[24px] shadow-2xl shadow-purple-200/50 p-5 md:p-6 border border-purple-100">
                    {/* Success Badge */}
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                            <CheckCircle2 size={24} className="fill-current" />
                            <span className="font-black text-sm uppercase tracking-wider">Approved</span>
                        </div>
                    </div>

                    {/* Celebration Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center shadow-md">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                <ShoppingBag size={32} className="text-purple-600" strokeWidth={1.5} />
                            </motion.div>
                        </div>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-2 tracking-tight leading-tight">
                        Welcome to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-purple-600 to-purple-600">
                            ShopSphere Seller Hub
                        </span>
                    </h1>

                    {/* Success Message */}
                    <div className="text-center mb-4">
                        <p className="text-lg font-black text-purple-600">🎉 Congratulations!</p>
                        <p className="text-xs text-gray-600 font-medium">
                            Your seller account has been approved.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                                className="bg-gradient-to-br from-[#fff5f5] to-[#f3e8ff] rounded-xl p-3 text-center border border-orange-50"
                            >
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                                    <feature.icon size={16} className="text-orange-400" />
                                </div>
                                <h3 className="font-black text-gray-900 mb-0.5 text-xs">{feature.title}</h3>
                                <p className="text-[10px] text-gray-500 font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Primary CTA */}
                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -12px rgba(124, 58, 237, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/vendordashboard')}
                        className="w-full px-10 py-5 bg-gradient-to-r from-orange-400 to-purple-500 text-white rounded-[24px] font-black text-xl shadow-xl shadow-orange-200 flex items-center justify-center gap-3 group transition-all mb-4"
                    >
                        Start Selling Now
                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    {/* Secondary Action */}
                    <button
                        onClick={() => navigate('/vendoraddproduct')}
                        className="w-full px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-400 rounded-[20px] font-bold text-base transition-all"
                    >
                        Add Your First Product
                    </button>
                </div>

                {/* Footer Note */}
                <p className="text-center text-gray-500 mt-8 font-medium text-sm">
                    Ready to grow your business? Let's get started! 🚀
                </p>
            </motion.div>
        </div>
    );
};

/**
 * DefaultLandingPage - Shown when user hasn't registered as vendor yet
 */
const DefaultLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fef3f2] to-[#f3e8ff] flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl w-full text-center"
            >
                {/* Icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                        <ShoppingBag size={64} className="text-orange-400" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                    Start Selling on <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-purple-600 to-purple-600">
                        ShopSphere
                    </span>
                </h1>

                {/* Description */}
                <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-xl mx-auto">
                    Reach millions of shoppers and grow your business with our world-class tools, integrated logistics, and secure payment processing.
                </p>

                {/* CTA Button */}
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -12px rgba(124, 58, 237, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/account-verification')}
                    className="px-12 py-5 bg-gradient-to-r from-orange-400 to-purple-500 text-white rounded-[24px] font-black text-xl shadow-xl shadow-orange-200 inline-flex items-center gap-3 group transition-all"
                >
                    Start Selling
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </motion.div>
        </div>
    );
};

/**
 * Main SellerPage Component
 * Fetches vendor status and renders appropriate page
 */
const SellerPage = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVendorStatus = async () => {
            try {
                const token = localStorage.getItem("accessToken");

                // If no token, show default landing page
                if (!token) {
                    setStatus('NOT_REGISTERED');
                    setLoading(false);
                    return;
                }

                // Fetch vendor status from backend
                const response = await getVendorStatus();

                // Be resilient to different key names (status vs approval_status)
                const currentStatus = response.approval_status || response.status;

                if (currentStatus) {
                    // Convert to uppercase to match our component logic
                    setStatus(currentStatus.toUpperCase());
                } else {
                    // If no vendor record found, show default landing
                    setStatus('NOT_REGISTERED');
                }
            } catch (error) {
                console.error('Error fetching vendor status:', error);

                // If 404 or vendor not found, show default landing
                if (error.response && error.response.status === 404) {
                    setStatus('NOT_REGISTERED');
                } else {
                    // For other errors, show default landing
                    setStatus('NOT_REGISTERED');
                    toast.error('Unable to fetch vendor status');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchVendorStatus();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] to-[#f3e8ff] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="text-orange-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-bold text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Render appropriate page based on status
    if (status === 'PENDING') {
        return <PendingStatusPage />;
    } else if (status === 'APPROVED') {
        return <ApprovedStatusPage />;
    } else {
        // NOT_REGISTERED or any other status
        return <DefaultLandingPage />;
    }
};

export default SellerPage;
