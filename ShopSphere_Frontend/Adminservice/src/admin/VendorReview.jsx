import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShieldCheck,
    Building2,
    User,
    FileText,
    AlertTriangle,
    Clock,
    Activity,
    PanelLeftClose,
    PanelLeftOpen,
    Loader2,
    Package,
    Store,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { fetchVendorRequests, fetchAllVendors, fetchVendorDetail, approveVendorRequest, rejectVendorRequest, blockVendor, unblockVendor } from '../api/axios';

const VendorReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [vendors, setVendors] = useState([]);
    const { markAsRead } = useNotifications();
    const [vendor, setVendor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActioning, setIsActioning] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const hasMarkedRef = useRef(false);

    useEffect(() => {
        const loadVendorData = async () => {
            setIsLoading(true);
            try {
                // Fetch specific vendor data directly
                const data = await fetchVendorDetail(id);
                setVendor(data);

                if (!hasMarkedRef.current && data.notifId) {
                    markAsRead(data.notifId);
                    hasMarkedRef.current = true;
                }
            } catch (error) {
                console.error("Failed to load vendor details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadVendorData();
    }, [id, markAsRead]);

    const handleActionClick = (action) => {
        setPendingAction(action);
        setIsActionModalOpen(true);
    };

    const confirmAction = async () => {
        if (!pendingAction || !vendor) return;

        setIsActioning(true);
        setIsActionModalOpen(false);

        try {
            if (pendingAction === "Approved") {
                await approveVendorRequest(vendor.id);
            } else if (pendingAction === "Blocked" || pendingAction === "Suspended") {
                await blockVendor(vendor.id, "Actioned via Management Review");
            } else if (pendingAction === "Unblocked") {
                await unblockVendor(vendor.id);
            } else {
                await rejectVendorRequest(vendor.id, "Declined via Security Review");
            }
            navigate('/vendors');
        } catch (error) {
            console.error("Action execution failed:", error);
        } finally {
            setIsActioning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full shadow-2xl"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Loading Profile</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fetching vendor audit data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="text-center max-w-sm px-6">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center justify-center mx-auto mb-8">
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted</h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10">The vendor credential you are looking for is either archived or the token has expired.</p>
                    <button
                        onClick={() => navigate('/vendors')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:scale-105 transition-all"
                    >
                        Return to Registry
                    </button>
                </div>
            </div>
        );
    }

    // Determine available actions based on current status
    const canApprove = vendor.approval_status === 'pending';
    const canBlock = vendor.approval_status === 'approved' && !vendor.is_blocked;
    const canUnblock = vendor.is_blocked;
    const canReject = vendor.approval_status === 'pending';

    return (
        <div className="flex h-screen bg-gray-50/50 font-sans overflow-hidden text-slate-900">
            <Sidebar isSidebarOpen={isSidebarOpen} activePage="Vendors" onLogout={() => window.location.href = '/'} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-gradient-to-r from-[#fb923c] via-[#c084fc] to-[#a78bfa] h-20 px-8 flex items-center justify-between sticky top-0 z-20 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-white/20 hidden sm:block mx-2" />
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                                {vendor.approval_status === 'approved' ? 'Merchant Profile' : 'Security Review'}
                            </h1>
                            <p className="text-[10px] text-orange-50 font-black uppercase tracking-[2px] opacity-80 leading-none mt-1 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> @{vendor.user_username || vendor.id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest gap-2">
                            <ShieldCheck className="w-4 h-4" /> Compliance Secured
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
                    <div className="max-w-6xl mx-auto space-y-10 pb-32">
                        {/* Elegant Hero Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-purple-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-purple-500 rounded-[32px] flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-orange-200">
                                    {(vendor.shop_name || "V").charAt(0)}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-2 ${vendor.is_blocked ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                            vendor.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                                                'bg-amber-50 text-amber-500 border-amber-100'
                                            }`}>
                                            {vendor.is_blocked ? 'Access Restricted' : vendor.approval_status}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-gray-50 rounded-full border border-gray-100 shadow-sm">ID: {vendor.id}</span>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-3">{vendor.shop_name}</h2>
                                    <p className="text-slate-500 font-bold max-w-2xl text-sm leading-relaxed uppercase tracking-wider opacity-60">{vendor.shop_description || "No description available for this partner profile."}</p>
                                </div>
                                <div className="hidden lg:block text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-2 opacity-60">Verified Onboarded</p>
                                    <p className="text-base font-black text-gray-900">{new Date(vendor.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                            </div>

                            {(vendor.blocked_reason || vendor.rejection_reason) && (
                                <div className="mt-10 bg-rose-50 rounded-[24px] p-6 flex items-start gap-4 border border-rose-100 shadow-sm">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-rose-500">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1.5 ">Protocol Violation Remarks</p>
                                        <p className="text-sm text-slate-600 font-bold leading-relaxed">{vendor.blocked_reason || vendor.rejection_reason}</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Detailed Info */}
                            <div className="lg:col-span-2 space-y-10">
                                <section className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-3 bg-orange-50 rounded-2xl shadow-sm text-orange-500">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Business Topology</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Corporate Title</label>
                                            <p className="text-base font-black text-gray-900 tracking-tight">{vendor.shop_name}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Org Classification</label>
                                            <p className="text-xs font-black text-purple-600 uppercase bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 inline-block tracking-widest">{vendor.business_type}</p>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Registered Domicile</label>
                                            <p className="text-[15px] font-black text-slate-700 flex items-start gap-3 leading-relaxed">
                                                <MapPin className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" /> {vendor.address}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Node Identification (GSTIN)</label>
                                            <p className="text-sm font-black text-gray-900 tracking-[0.1em] font-mono">{vendor.gst_number || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Tax Asset (PAN)</label>
                                            <p className="text-sm font-black text-gray-900 tracking-[0.1em] font-mono">{vendor.pan_number || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Legal Entity Name</label>
                                            <p className="text-base font-black text-gray-900 tracking-tight">{vendor.pan_name || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Network Logistics Fee</label>
                                            <p className="text-lg font-black text-emerald-500 tabular-nums">₹{parseFloat(vendor.shipping_fee || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-3 bg-emerald-50 rounded-2xl shadow-sm text-emerald-500">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Settlement Protocol</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Beneficiary Identification</label>
                                            <p className="text-base font-black text-gray-900 tracking-tight">{vendor.bank_holder_name || 'N/A'}</p>
                                        </div>
                                        <div />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Asset Key (Account Number)</label>
                                            <p className="text-base font-black text-gray-900 tracking-[0.1em] font-mono">{vendor.bank_account_number || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Router Hash (IFSC)</label>
                                            <p className="text-base font-black text-gray-900 tracking-[0.1em] font-mono">{vendor.bank_ifsc_code || 'N/A'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-3 bg-purple-50 rounded-2xl shadow-sm text-purple-500">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Compliance Artifacts</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {vendor.id_proof_file && (
                                            <div className="group p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-purple-200 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-xl"
                                                onClick={() => window.open(`http://localhost:8000${vendor.id_proof_file}`, '_blank')}>
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-500 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                                                        <FileText className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-gray-900 leading-tight mb-1">{vendor.id_type || 'Identity Matrix'}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vendor.id_number || 'ID-ALPHA-UNRESOLVED'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {vendor.pan_card_file && (
                                            <div className="group p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-orange-200 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-xl"
                                                onClick={() => window.open(`http://localhost:8000${vendor.pan_card_file}`, '_blank')}>
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-500 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                                                        <ShieldCheck className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-gray-900 leading-tight mb-1">Taxation Asset Review</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vendor.pan_number || 'TAX-NODE-EMPTY'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!vendor.id_proof_file && !vendor.pan_card_file && (
                                            <div className="col-span-2 py-16 text-center border-4 border-dashed border-gray-50 rounded-[32px]">
                                                <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
                                                    <AlertTriangle className="w-10 h-10 text-slate-200" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Zero Artifacts Detected</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Contact & Registry Info */}
                            <div className="space-y-10">
                                <section className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-10 opacity-60">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Network Node Contacts</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 opacity-60">System Email</p>
                                            <p className="text-sm font-black text-gray-900 break-all leading-relaxed">{vendor.user_email || 'Unspecified'}</p>
                                        </div>

                                        <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 opacity-60">Secure Voice Line</p>
                                            <p className="text-sm font-black text-gray-900 tracking-widest">{vendor.user_phone || 'Unspecified'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="p-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group border border-white/20">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                                <ShieldCheck className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[3px] text-indigo-100">Audit Status</span>
                                        </div>
                                        <p className="text-sm font-bold text-indigo-50 leading-relaxed mb-10 opacity-90">This partner profile is fully synchronized with the central marketplace node. Integrity hash verified.</p>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-200">
                                            <span>Sync Data</span>
                                            <span>100% Verified</span>
                                        </div>
                                    </div>
                                    <Activity className="absolute -bottom-10 -right-10 w-40 h-40 text-white opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12" />
                                </section>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer Action Bar */}
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 bg-white rounded-[32px] border border-gray-100 p-6 z-40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-300 w-[90%] max-w-5xl backdrop-blur-md`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-slate-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-gray-900 tracking-tight">Administrative Governance</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">Status updates will be propagated globally</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {canBlock && (
                                <button
                                    onClick={() => handleActionClick('Blocked')}
                                    disabled={isActioning}
                                    className="flex-1 sm:flex-none px-8 py-5 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:border-rose-300 active:scale-95 transition-all disabled:opacity-30 shadow-sm"
                                >
                                    Force Restriction
                                </button>
                            )}

                            {canUnblock && (
                                <button
                                    onClick={() => handleActionClick('Unblocked')}
                                    disabled={isActioning}
                                    className="flex-1 sm:flex-none px-8 py-5 bg-white border-2 border-emerald-100 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all disabled:opacity-30 shadow-sm"
                                >
                                    Restore Terminal
                                </button>
                            )}

                            {canReject && (
                                <button
                                    onClick={() => handleActionClick('Rejected')}
                                    disabled={isActioning}
                                    className="flex-1 sm:flex-none px-8 py-5 bg-white border-2 border-gray-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all disabled:opacity-30 shadow-sm"
                                >
                                    Decline Request
                                </button>
                            )}

                            {canApprove && (
                                <button
                                    onClick={() => handleActionClick('Approved')}
                                    disabled={isActioning}
                                    className="flex-1 sm:flex-none px-12 py-5 bg-gradient-to-r from-orange-400 to-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-400/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-4 min-w-[240px]"
                                >
                                    {isActioning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5 text-white/50" />
                                            Grant Clearance
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {isActionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsActionModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border border-gray-100 rounded-[3rem] p-16 max-w-sm w-full relative z-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] text-center"
                        >
                            <div className="w-32 h-32 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-rose-100 mx-auto shadow-inner">
                                <AlertTriangle className="w-16 h-16 text-rose-500" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Review Sequence</h2>
                            <p className="text-[13px] text-slate-500 font-bold leading-relaxed mb-12 px-2 italic uppercase tracking-wider opacity-60">
                                Global status modification to <span className="text-gray-900 font-black underline decoration-orange-500/40 decoration-4 underline-offset-8">{pendingAction}</span>. Confirm execution?
                            </p>
                            <div className="flex flex-col gap-5">
                                <button
                                    onClick={confirmAction}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                                >
                                    Authorize Execution
                                </button>
                                <button
                                    onClick={() => setIsActionModalOpen(false)}
                                    className="w-full py-5 bg-white border-2 border-gray-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Abort Operation
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VendorReview;
