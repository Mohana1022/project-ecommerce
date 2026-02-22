import axios from 'axios';

const base_url = "http://localhost:8000";

export const axiosInstance = axios.create({
    baseURL: base_url,
    headers: {
        "Content-Type": "application/json",
    }
});
// const loadVendors = useCallback(async () => {
//     const token = localStorage.getItem("accessToken");

//     const res = await fetch("http://localhost:8000/admin/api/vendor-requests/", {
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//     });

//     const data = await res.json();
//     setVendors(data);
// }, []);

export const fetchVendorRequests = async () => {
    const token = localStorage.getItem("authToken");

    const response = await axios.get(
        `${base_url}/superAdmin/api/vendor-requests/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const fetchAllVendors = async () => {
    const token = localStorage.getItem("authToken");

    const response = await axios.get(
        `${base_url}/superAdmin/api/vendors/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const fetchVendorDetail = async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/vendors/${id}/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const fetchDashboardStats = async () => {
    const token = localStorage.getItem("authToken");

    const response = await axios.get(
        `${base_url}/superAdmin/api/dashboard/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const approveVendorRequest = async (vendorId, reason = '') => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/vendor-requests/${vendorId}/approve/`,
        { reason },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const rejectVendorRequest = async (vendorId, reason) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/vendor-requests/${vendorId}/reject/`,
        { reason },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const blockVendor = async (vendorId, reason) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/vendors/${vendorId}/block/`,
        { reason },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const unblockVendor = async (vendorId, reason = '') => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/vendors/${vendorId}/unblock/`,
        { reason },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};


export const adminLogin = async (username, password) => {
    // We use the general login API which returns JWT tokens for any user role
    const response = await axios.post(
        `${base_url}/user_login/`,
        { username, password },
        { headers: { 'Accept': 'application/json' } }
    );
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminAuthenticated");
};

export const fetchProductsByVendor = async (vendorId) => {
    const token = localStorage.getItem("authToken");

    const response = await axios.get(
        `${base_url}/superAdmin/api/products/?vendor_id=${vendorId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const fetchAllProducts = async () => {
    const token = localStorage.getItem("authToken");

    const response = await axios.get(
        `${base_url}/superAdmin/api/products/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const fetchDeliveryRequests = async () => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/delivery-requests/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const fetchAllDeliveryAgents = async () => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/delivery-agents/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const fetchDeliveryAgentDetail = async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/delivery-agents/${id}/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const approveDeliveryAgent = async (id, reason = '') => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/delivery-requests/${id}/approve/`,
        { reason },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const rejectDeliveryAgent = async (id, reason) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/delivery-requests/${id}/reject/`,
        { reason },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const blockDeliveryAgent = async (id, reason) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/delivery-agents/${id}/block/`,
        { reason },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const unblockDeliveryAgent = async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/delivery-agents/${id}/unblock/`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

// Commission Settings APIs
export const fetchGlobalCommission = async () => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/commission-settings/global/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const updateGlobalCommission = async (data) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/commission-settings/global/`,
        data,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

// Category Specific Commission APIs
export const fetchCategoryCommissions = async () => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/commission-settings/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const saveCategoryCommission = async (data) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/commission-settings/`,
        data,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const updateCategoryCommission = async (id, data) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.patch(
        `${base_url}/superAdmin/api/commission-settings/${id}/`,
        data,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const deleteCategoryCommission = async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.delete(
        `${base_url}/superAdmin/api/commission-settings/${id}/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

// Reports API
export const fetchReports = async () => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/reports/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

// User Management API
export const fetchUsers = async ({ search = '', role = '', status = '' } = {}) => {
    const token = localStorage.getItem("authToken");
    const params = {};
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;
    const response = await axios.get(
        `${base_url}/superAdmin/api/users/`,
        {
            headers: { Authorization: `Bearer ${token}` },
            params,
        }
    );
    return response.data;
};

export const toggleUserBlock = async (userId, action, reason = '') => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/users/${userId}/toggle-block/`,
        { action, reason },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

// Order Management APIs
export const fetchAdminOrders = async ({ page = 1, search = '', status = '' } = {}) => {
    const token = localStorage.getItem("authToken");
    const params = { page };
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await axios.get(
        `${base_url}/superAdmin/api/orders/`,
        {
            headers: { Authorization: `Bearer ${token}` },
            params,
        }
    );
    return response.data;
};

export const fetchAdminOrderDetail = async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/superAdmin/api/orders/${id}/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const settlePayment = async (orderItemId) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        `${base_url}/superAdmin/api/settle-payment/${orderItemId}/`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

export const fetchWalletBalance = async () => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `${base_url}/wallet-balance/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};