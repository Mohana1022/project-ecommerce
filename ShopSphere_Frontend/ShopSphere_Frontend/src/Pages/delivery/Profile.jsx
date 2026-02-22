import { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaMapMarkerAlt, FaTruck, FaIdCard, FaUniversity, FaClock, FaLocationArrow, FaSave } from 'react-icons/fa';
import { fetchAgentProfile, updateAgentProfile } from '../../api/delivery_axios';
import { reverseGeocode } from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await fetchAgentProfile();
                setProfile(data);
            } catch (error) {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateAgentProfile(profile);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const data = await reverseGeocode(latitude, longitude);
                if (data && data.address) {
                    const addr = data.address;

                    // Construct a clean street address from specific components
                    // We avoid city/state in the "Street Address" field as they have their own fields
                    const streetParts = [
                        addr.house_number,
                        addr.road,
                        addr.neighbourhood,
                        addr.suburb,
                        addr.industrial,
                        addr.commercial
                    ].filter(Boolean);

                    // Fallback to the first few parts of display_name if construction is too short
                    let formattedStreet = streetParts.join(', ');
                    if (formattedStreet.length < 5 && data.display_name) {
                        formattedStreet = data.display_name.split(',').slice(0, 3).join(',').trim();
                    }

                    const detectedCity = addr.city || addr.town || addr.village || addr.suburb || profile.city;
                    const detectedState = addr.state || profile.state;
                    const detectedPostcode = addr.postcode || profile.postal_code;

                    const updatedFields = {
                        address: formattedStreet,
                        city: detectedCity,
                        state: detectedState,
                        postal_code: detectedPostcode
                    };

                    setProfile(prev => ({
                        ...prev,
                        ...updatedFields
                    }));

                    // Auto-save to store the location properly
                    try {
                        const profileToSave = {
                            ...profile,
                            ...updatedFields
                        };
                        await updateAgentProfile(profileToSave);
                        toast.success("Location fetched and stored successfully!");
                    } catch (saveError) {
                        console.error("Auto-save failed:", saveError);
                        toast.error("Location fetched but failed to auto-save");
                    }
                }
            } catch (error) {
                toast.error("Failed to fetch address from coordinates");
            } finally {
                setFetchingLocation(false);
            }
        }, (error) => {
            toast.error("Error fetching location: " + error.message);
            setFetchingLocation(false);
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500">Manage your personal and professional details.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                            <FaUser />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={profile?.user_name || ''}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={profile?.username || ''}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={profile?.user_email || ''}
                                readOnly
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="phone_number"
                                    value={profile?.phone_number || ''}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={profile?.date_of_birth || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Address & Location */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <FaMapMarkerAlt />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Address & Location</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleFetchLocation}
                            disabled={fetchingLocation}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <FaLocationArrow className={fetchingLocation ? 'animate-spin' : ''} />
                            {fetchingLocation ? 'Fetching...' : 'Fetch Current Location'}
                        </button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                            <textarea
                                name="address"
                                value={profile?.address || ''}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={profile?.city || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={profile?.state || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={profile?.postal_code || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vehicle & Service */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <FaTruck />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Vehicle & Service</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                            <select
                                name="vehicle_type"
                                value={profile?.vehicle_type || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                                <option value="bicycle">Bicycle</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="car">Car</option>
                                <option value="van">Van</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                            <input
                                type="text"
                                name="vehicle_number"
                                value={profile?.vehicle_number || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Radius (km)</label>
                            <input
                                type="number"
                                name="preferred_delivery_radius"
                                value={profile?.preferred_delivery_radius || 5}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                            <FaUniversity />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                            <input
                                type="text"
                                name="bank_holder_name"
                                value={profile?.bank_holder_name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                            <input
                                type="text"
                                name="bank_account_number"
                                value={profile?.bank_account_number || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                            <input
                                type="text"
                                name="bank_ifsc_code"
                                value={profile?.bank_ifsc_code || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={profile?.bank_name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70"
                    >
                        <FaSave />
                        {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
