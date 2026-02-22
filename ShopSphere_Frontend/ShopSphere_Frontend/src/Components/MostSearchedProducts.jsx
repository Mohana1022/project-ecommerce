import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaHeart,
    FaShoppingBag,
    FaStar,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaBrain,
} from "react-icons/fa";
import { getMostSearchedProducts } from "../api/axios";

// ─── helpers ─────────────────────────────────────────────────────────────────

const HEAT_LABELS = ["🔥", "⚡", "✨", "💎"];
const HEAT_COLORS = [
    "from-rose-500 via-orange-500 to-amber-400",
    "from-fuchsia-500 via-purple-500 to-indigo-500",
    "from-cyan-400 via-sky-500 to-blue-600",
    "from-emerald-400 via-teal-500 to-green-600",
];

function getImageUrl(item) {
    const images = item.images || item.gallery || [];
    const placeholder =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

    if (images.length > 0) {
        const img = images[0];
        const imgPath = typeof img === "string" ? img : img.image;
        if (!imgPath) return placeholder;
        if (imgPath.startsWith("http")) return imgPath;
        const base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
        if (imgPath.startsWith("/api/") || imgPath.startsWith("/media/")) return `${base}${imgPath}`;
        if (imgPath.startsWith("media/")) return `${base}/${imgPath}`;
        return `${base}/media/${imgPath}`;
    }
    return item.image || placeholder;
}

function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-[200px] md:w-[220px] h-[300px] rounded-2xl overflow-hidden animate-pulse bg-white/5 border border-white/10">
            <div className="h-[50%] bg-white/10" />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded-full w-3/4" />
                <div className="h-2.5 bg-white/10 rounded-full w-full" />
                <div className="h-2.5 bg-white/10 rounded-full w-2/3" />
                <div className="flex justify-between items-center pt-1">
                    <div className="h-5 bg-white/10 rounded-full w-16" />
                    <div className="h-8 w-8 bg-white/10 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function MostSearchedProducts({
    navigate,
    handleWishlistClick,
    handleAddToCartClick,
    isInWishlist,
}) {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Fetch most-searched products from ML endpoint
    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const data = await getMostSearchedProducts();
                setProducts(Array.isArray(data) ? data : (data?.results ?? []));
            } catch (err) {
                console.error("Failed to fetch most-searched products:", err);
                setError("Could not load most-searched products");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Scroll button state
    const updateScrollButtons = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.addEventListener("scroll", updateScrollButtons);
            updateScrollButtons();
            return () => el.removeEventListener("scroll", updateScrollButtons);
        }
    }, [products]);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
        }
    };

    // Auto-scroll
    useEffect(() => {
        if (products.length <= 4) return;
        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 20) {
                    scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                } else {
                    scrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
                }
            }
        }, 4500);
        return () => clearInterval(interval);
    }, [products]);

    if (error && products.length === 0) return null;  // only hide if truly nothing to show

    return (
        <section className="relative py-10 overflow-hidden" id="most-searched-section">
            {/* Background — slightly different from Trending to visually distinguish */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 overflow-hidden">
                <div className="absolute top-6 right-[10%] w-56 h-56 bg-violet-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-6 left-[10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-fuchsia-500/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: "3s" }} />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }}
                />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-4">
                        {/* ML badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-400/30 backdrop-blur-xl">
                            <FaBrain className="text-violet-400 animate-pulse" size={11} />
                            <span className="text-violet-400 font-black text-[9px] tracking-[0.25em] uppercase">
                                AI Picked
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Most{" "}
                            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                                Searched
                            </span>
                        </h2>
                    </div>

                    {/* Scroll Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            className={`p-2 rounded-xl border transition-all duration-300 ${canScrollLeft
                                ? "border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                                : "border-white/5 text-white/20 cursor-not-allowed"
                                }`}
                        >
                            <FaChevronLeft size={11} />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            className={`p-2 rounded-xl border transition-all duration-300 ${canScrollRight
                                ? "border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                                : "border-white/5 text-white/20 cursor-not-allowed"
                                }`}
                        >
                            <FaChevronRight size={11} />
                        </button>
                    </div>
                </motion.div>

                {/* Carousel */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                        : products.map((item, index) => {
                            const heatIdx = Math.min(index, HEAT_LABELS.length - 1);
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.08 }}
                                    className="flex-shrink-0 w-[200px] md:w-[220px] group"
                                    style={{ scrollSnapAlign: "start" }}
                                    onMouseEnter={() => setHoveredId(item.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <div
                                        className="relative h-[300px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.04]"
                                        onClick={() => navigate(`/product/${item.id}`)}
                                    >
                                        {/* Glass card bg */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl z-0" />

                                        {/* Rank / Search count badge */}
                                        <div className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-lg bg-gradient-to-br ${HEAT_COLORS[heatIdx]} shadow-md flex items-center justify-center`}>
                                            <span className="text-sm">{HEAT_LABELS[heatIdx]}</span>
                                        </div>

                                        {/* "Searched" badge (top-right) */}
                                        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 backdrop-blur-xl">
                                            <FaSearch className="text-white/80" size={7} />
                                            <span className="text-white text-[8px] font-black tracking-wider">SEARCHED</span>
                                        </div>

                                        {/* Product Image */}
                                        <div className="relative z-10 h-[50%] flex items-center justify-center p-4 overflow-hidden">
                                            <img
                                                src={getImageUrl(item)}
                                                alt={item.name}
                                                className="max-h-full max-w-full object-contain drop-shadow-xl"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                                                }}
                                            />
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-violet-400/20 blur-xl rounded-full" />
                                        </div>

                                        {/* Product Info */}
                                        <div className="relative z-10 px-3.5 pb-3.5 pt-1 flex flex-col flex-1">
                                            <span className="text-violet-400 text-[8px] font-black tracking-[0.2em] uppercase mb-1">
                                                {item.category || "Product"}
                                            </span>

                                            <h3 className="text-white font-bold text-sm leading-snug line-clamp-1 group-hover:text-violet-300 transition-colors">
                                                {item.name}
                                            </h3>

                                            {/* Rating */}
                                            <div className="flex items-center gap-2 mt-1.5 mb-2">
                                                <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10 backdrop-blur-md">
                                                    <span className="text-[9px] font-black text-violet-400">
                                                        {Number(item.average_rating || 0).toFixed(1)}
                                                    </span>
                                                    <FaStar className="text-[8px] text-yellow-400 mb-0.5" />
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar
                                                            key={i}
                                                            className={`text-[8px] ${i < Math.floor(item.average_rating || 0) ? "text-yellow-400" : "text-white/10"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-gray-500 text-[10px] line-clamp-1 mt-0.5 mb-3 leading-relaxed">
                                                {item.description}
                                            </p>

                                            {/* Price & Actions */}
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">Price</span>
                                                    <span className="text-white font-black text-base">
                                                        ₹{parseFloat(item.price).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleWishlistClick(item); }}
                                                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-rose-500/50 transition-all duration-300 group/wish"
                                                    >
                                                        <FaHeart
                                                            size={11}
                                                            className={isInWishlist(item.name) ? "text-rose-500" : "text-gray-500 group-hover/wish:text-rose-400"}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAddToCartClick(item); }}
                                                        className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 shadow-md shadow-violet-500/25 active:scale-95"
                                                    >
                                                        <FaShoppingBag size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover glow */}
                                        <AnimatePresence>
                                            {hoveredId === item.id && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-violet-500/20 to-transparent z-0"
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                </div>

                {/* Stats bar */}
                {!isLoading && products.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                {products.length} Products Matched
                            </span>
                        </div>
                        <div className="h-3 w-px bg-white/10 hidden md:block" />
                        <div className="flex items-center gap-1.5">
                            <FaBrain className="text-fuchsia-400" size={10} />
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                ML Search-Frequency Ranking
                            </span>
                        </div>
                        <div className="h-3 w-px bg-white/10 hidden md:block" />
                        <div className="flex items-center gap-1.5">
                            <FaSearch className="text-cyan-400" size={10} />
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                Based on Real Searches · Last 30 Days
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
