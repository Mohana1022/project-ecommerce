import { useState, useEffect } from "react";
import { getVendorProfile, updateVendorProfile } from "../../api/vendor_axios";
import {
    UserCircleIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    IdentificationIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    CreditCardIcon,
    CurrencyRupeeIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function VendorProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        shop_name: "",
        shop_description: "",
        address: "",
        contact_name: "",
        contact_email: "",
        contact_phone: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await getVendorProfile();
            setProfile(data);
            setFormData({
                shop_name: data.shop_name || "",
                shop_description: data.shop_description || "",
                address: data.address || "",
                contact_name: data.contact_name || "",
                contact_email: data.contact_email || "",
                contact_phone: data.contact_phone || ""
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateVendorProfile(formData);
            toast.success("Profile updated successfully!");
            setIsEditing(false);
            fetchProfile();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full -mr-16 -mt-16"></div>

                <div className="relative">
                    <div className="w-24 h-24 bg-violet-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-violet-500/20">
                        {profile?.shop_name?.charAt(0) || 'V'}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg">
                        {profile?.approval_status === 'approved' ? (
                            <CheckBadgeIcon className="h-6 w-6 text-emerald-500" />
                        ) : (
                            <ArrowPathIcon className="h-6 w-6 text-amber-500" />
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{profile?.shop_name}</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                            <UserCircleIcon className="h-4 w-4" /> {profile?.contact_name || `${profile?.user?.first_name} ${profile?.user?.last_name}`}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <ShieldCheckIcon className="h-4 w-4" /> {profile?.approval_status_display}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg ${isEditing
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-black text-white hover:scale-105 active:scale-95 shadow-black/10'
                        }`}
                >
                    {isEditing ? 'Cancel' : <><PencilSquareIcon className="h-5 w-5" /> Edit Profile</>}
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 text-violet-600 font-black uppercase tracking-widest text-xs mb-2">
                            <BuildingStorefrontIcon className="h-4 w-4" /> Shop Information
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Shop Name</label>
                                <input
                                    type="text"
                                    name="shop_name"
                                    value={formData.shop_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:bg-white transition-all disabled:opacity-70"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">About Shop</label>
                                <textarea
                                    name="shop_description"
                                    value={formData.shop_description}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows="4"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:bg-white transition-all disabled:opacity-70 resize-none"
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Contact Person</label>
                                <input
                                    type="text"
                                    name="contact_name"
                                    value={formData.contact_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Full Name"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:bg-white transition-all disabled:opacity-70"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Contact Email</label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="business@example.com"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:bg-white transition-all disabled:opacity-70"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        name="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:bg-white transition-all disabled:opacity-70"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Business Address</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-5 top-5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:bg-white transition-all disabled:opacity-70"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-sm hover:bg-violet-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-violet-600/20 disabled:opacity-70"
                                >
                                    {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Business Info Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 text-sky-600 font-black uppercase tracking-widest text-xs mb-6">
                            <IdentificationIcon className="h-4 w-4" /> Business Verification
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Business Type</p>
                                <p className="font-bold text-gray-900">{profile?.business_type_display}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identity Method</p>
                                <p className="font-bold text-gray-900">{profile?.id_type_display}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identity Number</p>
                                <p className="font-bold text-gray-900">{profile?.id_number}</p>
                            </div>
                            {profile?.gst_number && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">GST Number</p>
                                    <p className="font-bold text-gray-900">{profile?.gst_number}</p>
                                </div>
                            )}
                            {profile?.pan_number && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PAN Number</p>
                                    <p className="font-bold text-gray-900">{profile?.pan_number}</p>
                                    {profile?.pan_name && <p className="text-[10px] text-gray-500 mt-0.5">({profile.pan_name})</p>}
                                </div>
                            )}
                            {profile?.id_proof_file && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identity Document</p>
                                    <a
                                        href={profile.id_proof_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-violet-600 font-bold hover:underline"
                                    >
                                        View Proof
                                    </a>
                                </div>
                            )}
                            {profile?.pan_card_file && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PAN Card</p>
                                    <a
                                        href={profile.pan_card_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-violet-600 font-bold hover:underline"
                                    >
                                        View PAN Card
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Banking Info Section */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-xs mb-6">
                            <CreditCardIcon className="h-4 w-4" /> Banking Details
                        </div>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Holder</p>
                                <p className="font-bold text-gray-900">{profile?.bank_holder_name || 'Not Provided'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                                <p className="font-bold text-gray-900">{profile?.bank_account_number || 'Not Provided'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IFSC Code</p>
                                <p className="font-bold text-gray-900">{profile?.bank_ifsc_code || 'Not Provided'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 text-orange-600 font-black uppercase tracking-widest text-xs mb-6">
                            <CurrencyRupeeIcon className="h-4 w-4" /> Shipping Fee
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Standard National Fee</p>
                            <p className="text-2xl font-black text-gray-900">₹{profile?.shipping_fee || '0.00'}</p>
                        </div>
                    </div>

                    <div className={`rounded-[32px] p-8 shadow-sm border ${profile?.is_blocked ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
                        }`}>
                        <div className={`flex items-center gap-3 font-black uppercase tracking-widest text-xs mb-4 ${profile?.is_blocked ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                            {profile?.is_blocked ? 'Account Restricted' : 'Account Active'}
                        </div>
                        <p className={`text-sm font-medium ${profile?.is_blocked ? 'text-red-700' : 'text-emerald-700'}`}>
                            {profile?.is_blocked
                                ? `Your account is currently blocked: ${profile.blocked_reason}`
                                : 'Your account is in good standing and all features are available.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
