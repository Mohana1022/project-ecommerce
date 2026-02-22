import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { adminLogin } from "../api/axios";
import { motion, AnimatePresence } from 'framer-motion';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const data = await adminLogin(username, password);
            if (data.access) localStorage.setItem("authToken", data.access);
            if (data.refresh) localStorage.setItem("refreshToken", data.refresh);
            localStorage.setItem("adminAuthenticated", "true");
            navigate("/dashboard");
        } catch (err) {
            const msg = err.response?.data?.message ||
                err.response?.data?.error ||
                "Invalid credentials. Please try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">

            {/* ── Left Panel: Brand ── */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex w-1/2 bg-[#0d0415] flex-col items-center justify-center relative overflow-hidden p-12"
            >
                {/* Glow blobs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"
                />

                <div className="relative z-10 flex flex-col items-center text-center gap-5">
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                        src="/s_logo.png"
                        alt="ShopSphere"
                        className="w-44 h-44 object-contain drop-shadow-[0_0_40px_rgba(139,92,246,0.7)]"
                    />
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h1 className="text-5xl font-black tracking-tighter text-white">
                            Shop<span className="bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">Sphere</span>
                        </h1>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 1, duration: 1 }}
                            className="h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-3 mb-4"
                        />
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.35em]">Admin Portal</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center gap-2 mt-6 px-6 py-2.5 rounded-full border border-orange-500/40 bg-orange-500/5 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Admin Access</span>
                    </motion.div>
                </div>
            </motion.div>

            {/* ── Right Panel: Form ── */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white"
            >
                <div className="w-full max-w-md">

                    {/* Mobile logo */}
                    <div className="flex flex-col items-center mb-8 lg:hidden">
                        <img src="/s_logo.png" alt="ShopSphere" className="w-16 h-16 object-contain mb-2 drop-shadow-[0_0_20px_rgba(139,92,246,0.65)]" />
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                            Shop<span className="bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">Sphere</span>
                        </h1>
                    </div>

                    {/* Heading */}
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-8"
                    >
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Sign in to your admin account</p>
                        <div className="w-12 h-1.5 bg-gradient-to-r from-orange-400 to-purple-500 rounded-full mt-3" />
                    </motion.div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -10 }}
                                animate={{ height: 'auto', opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -10 }}
                                className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold mb-6 overflow-hidden"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-xs font-semibold mb-6"
                    >
                        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        Only users with admin or superuser privileges can access this portal.
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Enter your username"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-orange-400/10 focus:border-orange-400 hover:border-orange-300"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    className="w-full px-5 py-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-orange-400/10 focus:border-orange-400 hover:border-orange-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-orange-400 to-purple-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-400/25 hover:shadow-xl hover:shadow-orange-400/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                    </motion.div>
                                    Signing in…
                                </span>
                            ) : 'Sign In'}
                        </motion.button>
                    </motion.form>
                </div>
            </motion.div>

        </div>
    );
};

export default AdminLogin;