import React, { useState } from "react";
import StepProgress from "../../Components/StepProgress";
import { useNavigate } from "react-router-dom";
import { useVendorRegistration } from "../../context/VendorRegistrationContext.jsx";

export default function VerifyGST() {
    const navigate = useNavigate();
    const { updateFiles } = useVendorRegistration();
    const [gst, setGst] = useState("");
    const [gstFile, setGstFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [error, setError] = useState("");

    const [credentials, setCredentials] = useState({
        username: "",
        email: "",
        password: ""
    });

    const validateGST = (gst) => {
        // 2-digit state code, 10-digit PAN, 1-digit entity, Z, 1-digit check
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstRegex.test(gst);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Allowed file types: pdf, jpg, png");
            e.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Maximum file size is 10 MB");
            e.target.value = "";
            return;
        }

        setError("");
        setGstFile(file);
    };

    const handleSelfieChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png"];

        if (!allowedTypes.includes(file.type)) {
            setError("Allowed file types: jpg, png");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Maximum file size is 5 MB");
            e.target.value = "";
            return;
        }

        setError("");
        setSelfieFile(file);
    };

    const handleContinue = () => {
        const isUserLoggedIn = !!localStorage.getItem("user");

        if (!gst) {
            setError("Please enter a GST number");
            return;
        }

        if (!validateGST(gst.toUpperCase())) {
            setError("Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)");
            return;
        }

        if (!gstFile) {
            setError("Please upload GST certificate");
            return;
        }

        if (!selfieFile) {
            setError("Please upload a selfie with your ID");
            return;
        }

        if (!isUserLoggedIn) {
            if (!credentials.username || !credentials.email || !credentials.password) {
                setError("Please fill in your account details to continue");
                return;
            }
        }

        setError("");

        // ✅ Save to Context
        updateFiles({
            id_proof_file: gstFile,
            selfie_with_id_file: selfieFile
        });

        // ✅ Save all data to localStorage for the next steps
        localStorage.setItem("gst_number", gst.toUpperCase());
        localStorage.setItem("id_type", "gst");
        localStorage.setItem("id_number", gst.toUpperCase());
        localStorage.setItem("vendorGSTData", JSON.stringify({ gstNumber: gst.toUpperCase(), idType: "gst" }));

        if (!isUserLoggedIn) {
            localStorage.setItem("username", credentials.username);
            localStorage.setItem("email", credentials.email);
            localStorage.setItem("password", credentials.password);
        }

        navigate("/store-name");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fef3f2] to-[#f3e8ff]">

            {/* Header */}
            <header className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-orange-400 to-purple-500 shadow-sm">
                <div className="flex items-center gap-1">
                    <h1 className="text-xl font-bold text-white">
                        ShopSphere Seller Central
                    </h1>
                </div>
            </header>

            {/* Content */}
            <main className="px-6 py-12">
                <StepProgress />

                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Enter GST Number
                    </h2>
                    <p className="text-gray-500 mb-8">
                        GST number is mandatory to sell online on ShopSphere.
                    </p>

                    {/* GST Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            15-digit GST Number
                        </label>
                        <input
                            type="text"
                            placeholder="22AAAAA0000A1Z5"
                            value={gst}
                            maxLength={15}
                            onChange={(e) => {
                                setGst(e.target.value.toUpperCase());
                                if (error) setError("");
                            }}
                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all 
                            ${error && !gst ? "border-red-500 focus:ring-red-200" : "border-purple-200 focus:ring-purple-500"}`}
                        />
                    </div>

                    {/* GST File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload GST Certificate
                        </label>
                        <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-all">
                            <input
                                type="file"
                                id="gst-file"
                                hidden
                                onChange={handleFileChange}
                            />
                            <label htmlFor="gst-file" className="flex flex-col items-center cursor-pointer">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-purple-600">
                                    {gstFile ? gstFile.name : "Click to upload GST document"}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    PDF, JPG, PNG (Max 10MB)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Selfie Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selfie with ID
                        </label>
                        <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-all">
                            <input
                                type="file"
                                id="selfie-file"
                                hidden
                                onChange={handleSelfieChange}
                                accept="image/jpeg,image/png"
                            />
                            <label htmlFor="selfie-file" className="flex flex-col items-center cursor-pointer">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-purple-600">
                                    {selfieFile ? selfieFile.name : "Hold your ID near your face while taking photo"}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    JPG, PNG (Max 5MB)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Account Details (if not logged in) */}
                    {!localStorage.getItem("user") && (
                        <div className="space-y-4 pt-4 border-t border-gray-100 mb-6">
                            <h3 className="font-semibold text-gray-700">Account Creation</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-purple-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={credentials.email}
                                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-purple-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-purple-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-xs mt-3 ml-1 font-medium">{error}</p>}

                    {/* Non-GST Option */}
                    <div className="flex items-center gap-3 mt-6">
                        <input
                            type="radio"
                            id="nongst"
                            name="gst-option"
                            className="accent-purple-600"
                            onChange={() => navigate("/verifyPAN")}
                        />
                        <label htmlFor="nongst" className="text-sm text-gray-700">
                            I only sell non-GST categories (Books, Educational items, etc.)
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                            🔒 Your information is securely stored as per ShopSphere Privacy Policy.
                        </p>
                        <button
                            onClick={handleContinue}
                            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-purple-500 text-white rounded-lg 
                            hover:from-orange-600 hover:to-purple-700 transition font-medium shadow-md">
                            Continue
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
