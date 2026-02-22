import apiClient from "./apiClient";

// vendor register
export const vendorRegister = async (signupData) => {
    let payload = signupData;
    let headers = {};

    if (!(signupData instanceof FormData)) {
        payload = new FormData();
        Object.keys(signupData).forEach(key => {
            if (signupData[key] !== null && signupData[key] !== undefined) {
                payload.append(key, signupData[key]);
            }
        });
        headers["Content-Type"] = "multipart/form-data";
    }

    const response = await apiClient.post("/api/vendor/register/", payload, { headers });
    return response.data;
};

// Get vendor approval status
export const getVendorStatus = async () => {
    const response = await apiClient.get("/api/vendor/approval-status/");
    return response.data;
};

// LOGOUT
export const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
};


export const add_Product = async (productData) => {
    const formData = new FormData();
    Object.keys(productData).forEach((key) => {
        if (key === "images") {
            productData.images.forEach((image) => {
                formData.append("images", image);
            });
        } else if (key === "stock") {
            // Map 'stock' from frontend to 'quantity' for backend
            formData.append("quantity", productData[key]);
        } else {
            formData.append(key, productData[key]);
        }
    });

    const response = await apiClient.post(
        "/api/vendor/products/",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

// Get vendor products
export const getVendorProducts = async () => {
    const response = await apiClient.get("/api/vendor/products/");
    return response.data;
};

// Delete vendor product
export const deleteVendorProduct = async (productId) => {
    const response = await apiClient.delete(`/api/vendor/products/${productId}/`);
    return response.data;
};

// Update vendor product
export const updateVendorProduct = async (productId, productData) => {
    const formData = new FormData();
    Object.keys(productData).forEach((key) => {
        if (key === "images") {
            // Only append new images if any are provided
            if (Array.isArray(productData.images)) {
                productData.images.forEach((image) => {
                    if (image instanceof File) {
                        formData.append("images", image);
                    }
                });
            }
        } else if (key === "quantity" || key === "stock") {
            formData.append("quantity", productData[key]);
        } else {
            formData.append(key, productData[key]);
        }
    });

    const response = await apiClient.put(
        `/api/vendor/products/${productId}/`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return response.data;
};

// Get Vendor Orders
export const getVendorOrders = async () => {
    const response = await apiClient.get("/api/vendor/orders/");
    return response.data;
};

// Update Vendor Order Item Status
export const updateVendorOrderItemStatus = async (orderItemId, status) => {
    const response = await apiClient.patch(`/api/vendor/orders/${orderItemId}/update-status/`, {
        vendor_status: status
    });
    return response.data;
};

// Get Vendor Profile
export const getVendorProfile = async () => {
    const response = await apiClient.get("/api/vendor/profile/");
    return response.data;
};

// Get Vendor Earnings Summary
export const getVendorEarningsSummary = async () => {
    const response = await apiClient.get("/api/vendor/earnings-summary/");
    return response.data;
};

// Get Vendor Earnings Analytics (Chart Data)
export const getVendorEarningsAnalytics = async (filter = 'weekly') => {
    const response = await apiClient.get(`/api/vendor/earnings-analytics/?filter=${filter}`);
    return response.data;
};

// Update Vendor Profile
export const updateVendorProfile = async (profileData) => {
    const response = await apiClient.patch("/api/vendor/profile/", profileData);
    return response.data;
};

// Fetch Commission Info (Global rate and overrides)
export const fetchCommissionInfo = async () => {
    const response = await apiClient.get("/api/vendor/commission-info/");
    return response.data;
};

// ── New Order Lifecycle Management ──────────────────────────────────────────

// Get all vendor orders with full lifecycle status
export const getVendorLifecycleOrders = async (statusFilter = '') => {
    const url = statusFilter
        ? `/api/vendor/lifecycle-orders/?status=${statusFilter}`
        : '/api/vendor/lifecycle-orders/';
    const response = await apiClient.get(url);
    return response.data;
};

// Perform lifecycle action: approve | reject | pack
export const vendorOrderAction = async (orderPk, action, notes = '') => {
    const response = await apiClient.post(
        `/api/vendor/lifecycle-orders/${orderPk}/action/`,
        { action, notes }
    );
    return response.data;
};

export const getWalletBalance = async () => {
    const response = await apiClient.get("/wallet-balance/");
    return response.data;
};

export const vendorWithdraw = async (amount) => {
    const response = await apiClient.post("/api/vendor/withdraw/", { amount });
    return response.data;
};
