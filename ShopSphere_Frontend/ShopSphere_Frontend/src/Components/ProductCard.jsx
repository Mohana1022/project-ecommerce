import React from "react";
import { FaHeart, FaShoppingBag, FaStar } from "react-icons/fa";

// Inline SVG placeholder — no network request needed
const PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImageUrl(imgPath) {
    if (!imgPath) return null;
    if (imgPath.startsWith("http")) return imgPath;
    const base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    if (imgPath.startsWith("/api/")) return `${base}${imgPath}`;
    if (imgPath.startsWith("/media/")) return `${base}${imgPath}`;
    if (imgPath.startsWith("media/")) return `${base}/${imgPath}`;
    return `${base}/media/${imgPath}`;
}

export default function ProductCard({
    item,
    navigate,
    handleWishlistClick,
    handleAddToCartClick,
    isInWishlist,
}) {
    // Pick the FIRST image only — images are locked to their own card
    const rawImages = item.images || item.gallery || [];
    const firstImg = rawImages[0];
    const firstPath = firstImg ? (typeof firstImg === "string" ? firstImg : firstImg.image) : null;
    const displayImage = resolveImageUrl(firstPath) || item.image || PLACEHOLDER;

    return (
        <div
            className="group bg-white rounded-3xl shadow-lg cursor-pointer h-full flex flex-col hover:-translate-y-2 transition-transform duration-300"
            onClick={() => navigate(`/product/${item.id}`)}
        >
            <div className="relative h-64 overflow-hidden rounded-t-3xl bg-gray-50">
                <img
                    src={displayImage}
                    alt={item.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistClick(item);
                    }}
                    className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-md z-10 hover:bg-white transition-all"
                >
                    <FaHeart
                        className={isInWishlist(item.name) ? "text-red-500" : "text-gray-400"}
                    />
                </button>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-400 transition-colors line-clamp-1">
                        {item.name}
                    </h3>

                    {/* Rating Section */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                            <span className="text-[11px] font-black text-orange-400">
                                {Number(item.average_rating || 0).toFixed(1)}
                            </span>
                            <FaStar className="text-[10px] text-yellow-400 mb-0.5" />
                        </div>

                        <div className="flex gap-0.5 ml-1">
                            {[...Array(5)].map((_, i) => (
                                <FaStar
                                    key={i}
                                    className={`text-[10px] ${i < Math.floor(item.average_rating || 0) ? "text-yellow-400" : "text-gray-200"}`}
                                />
                            ))}
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2 mt-3">{item.description}</p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Price</span>
                        <span className="font-black text-xl text-gray-900">₹{parseFloat(item.price).toFixed(2)}</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCartClick(item);
                        }}
                        className="bg-gradient-to-r from-orange-400 to-purple-500 text-white p-4 rounded-2xl hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg active:scale-95"
                    >
                        <FaShoppingBag />
                    </button>
                </div>
            </div>
        </div>
    );
}