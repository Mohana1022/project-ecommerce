import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingBag, Smartphone, Watch, Headphones, Laptop,
    Shirt, Package, Gift, CreditCard, BarChart3,
    Settings, Users, Store, ClipboardList, Truck
} from 'lucide-react';

const ICONS = [
    ShoppingBag, Smartphone, Watch, Headphones, Laptop,
    Shirt, Package, Gift, CreditCard, BarChart3,
    Settings, Users, Store, ClipboardList, Truck
];

const MarqueeRow = ({ direction = 'left', speed = 32 }) => (
    <div className="flex w-full overflow-hidden py-10 opacity-60">
        <motion.div
            className="flex gap-20 shrink-0"
            initial={{ x: direction === 'left' ? 0 : '-50%' }}
            animate={{ x: direction === 'left' ? '-50%' : 0 }}
            transition={{ repeat: Infinity, ease: 'linear', duration: speed }}
        >
            {[...ICONS, ...ICONS, ...ICONS].map((Icon, i) => (
                <Icon key={i} size={72} strokeWidth={1} className="text-orange-300/30" />
            ))}
        </motion.div>
    </div>
);

const SplashScreen = () => {
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const show = setTimeout(() => setReady(true), 50);

        // Navigate after 3.2s
        const go = setTimeout(() => {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (token) {
                if (token === 'admin_guest_session') { navigate('/dashboard'); return; }
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
                    const payload = JSON.parse(atob(base64 + padding));
                    if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
                        navigate('/dashboard');
                    } else {
                        navigate('/login');
                    }
                } catch {
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        }, 3200);

        return () => { clearTimeout(show); clearTimeout(go); };
    }, [navigate]);

    return (
        <div className="fixed inset-0 bg-[#0d0415] flex items-center justify-center z-[9999] overflow-hidden">

            {/* Scrolling icon background — identical to customer panel */}
            <div className="absolute inset-0 flex flex-col justify-center space-y-14 rotate-[-5deg] scale-110">
                <MarqueeRow direction="left" speed={32} />
                <MarqueeRow direction="right" speed={38} />
                <MarqueeRow direction="left" speed={28} />
                <MarqueeRow direction="right" speed={42} />
            </div>

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-[#0d0415]/60" />

            {/* Centre content */}
            <motion.div
                initial={{ scale: 0.75, opacity: 0, y: 30 }}
                animate={ready ? { scale: 1, opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Logo */}
                <img
                    src="/s_logo.png"
                    alt="ShopSphere Logo"
                    className="w-56 h-56 object-contain drop-shadow-[0_0_45px_rgba(139,92,246,0.7)]"
                />

                {/* Brand name */}
                <h1 className="text-4xl font-black tracking-tighter text-white mt-2">
                    Shop<span className="bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">Sphere</span>
                </h1>

                {/* Sub-label */}
                <p className="text-orange-300/50 text-xs font-semibold tracking-[0.35em] uppercase mt-1">
                    Admin Portal
                </p>

                {/* Animated underline */}
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={ready ? { width: '10rem', opacity: 1 } : {}}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                />

                {/* Loading bar */}
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-[loading_3.2s_ease-in-out_forwards]" />
                </div>
            </motion.div>

            <style>{`
                @keyframes loading {
                    0%   { width: 0% }
                    100% { width: 100% }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
