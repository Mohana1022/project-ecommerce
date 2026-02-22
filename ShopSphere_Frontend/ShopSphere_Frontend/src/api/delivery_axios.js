import apiClient from "./apiClient";

// Delivery Agent Auth
export const deliveryRegister = async (agentData) => {
    let payload = agentData;
    let headers = {};

    // If there are files, we should use FormData (handled by caller or here)
    if (!(agentData instanceof FormData)) {
        payload = new FormData();
        Object.keys(agentData).forEach(key => {
            if (Array.isArray(agentData[key])) {
                agentData[key].forEach(v => payload.append(key, v));
            } else {
                payload.append(key, agentData[key]);
            }
        });
        headers["Content-Type"] = "multipart/form-data";
    }

    const response = await apiClient.post("/api/delivery/register/", payload, { headers });
    return response.data;
};

// Dashboard Stats
export const fetchDeliveryDashboard = async () => {
    const response = await apiClient.get("/api/delivery/dashboard/");
    return response.data;
};

// Assignments
export const fetchAssignedOrders = async (status = '') => {
    const url = status ? `/api/delivery/assignments/?status=${status}` : "/api/delivery/assignments/";
    const response = await apiClient.get(url);
    return response.data;
};

export const fetchAssignmentDetail = async (assignmentId) => {
    const response = await apiClient.get(`/api/delivery/assignments/${assignmentId}/`);
    return response.data;
};

export const acceptOrder = async (assignmentId) => {
    const response = await apiClient.post(`/api/delivery/assignments/${assignmentId}/accept/`);
    return response.data;
};

export const startDelivery = async (assignmentId) => {
    const response = await apiClient.post(`/api/delivery/assignments/${assignmentId}/start/`);
    return response.data;
};

export const completeDelivery = async (assignmentId, data) => {
    const response = await apiClient.post(`/api/delivery/assignments/${assignmentId}/complete/`, data);
    return response.data;
};

// New Status Update API (picked_up / in_transit / failed)
export const markPickedUp = async (assignmentId) => {
    const response = await apiClient.post(`/api/delivery/assignments/${assignmentId}/update-status/`, { status: 'picked_up' });
    return response.data;
};

export const markInTransit = async (assignmentId) => {
    const response = await apiClient.post(`/api/delivery/assignments/${assignmentId}/update-status/`, { status: 'in_transit' });
    return response.data;
};

export const failDelivery = async (assignmentId, notes) => {
    const response = await apiClient.post(`/api/delivery/assignments/${assignmentId}/update-status/`, { status: 'failed', notes });
    return response.data;
};

// Earnings & Stats
export const fetchEarningsSummary = async (filter = 'monthly') => {
    const response = await apiClient.get(`/api/delivery/earnings/summary/?filter=${filter}`);
    return response.data;
};

export const fetchCommissionList = async () => {
    const response = await apiClient.get("/api/delivery/earnings/");
    return response.data;
};

export const requestWithdrawal = async (amount, method = 'bank_transfer') => {
    const response = await apiClient.post("/api/delivery/payments/withdraw/", { amount, method });
    return response.data;
};

// Profile Management
export const fetchAgentProfile = async () => {
    const response = await apiClient.get("/api/delivery/profiles/get_agent/");
    return response.data;
};

export const updateAgentProfile = async (profileData) => {
    const response = await apiClient.patch("/api/delivery/profiles/update_profile/", profileData);
    return response.data;
};

//  Nearby + OTP verification 

/**
 * Delivery agent signals "I am nearby" – triggers OTP generation & email to customer.
 */
export const triggerNearbyOTP = async (assignmentId, coords = {}) => {
    const response = await apiClient.post(
        `/api/delivery/assignments/${assignmentId}/nearby/`,
        coords
    );
    return response.data;
};

/**
 * Delivery agent verifies the OTP provided by the customer to confirm delivery.
 */
export const verifyDeliveryOTP = async (assignmentId, otp) => {
    const response = await apiClient.post(
        `/api/delivery/assignments/${assignmentId}/verify-otp/`,
        { otp }
    );
    return response.data;
};

