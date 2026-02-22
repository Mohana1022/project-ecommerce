import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const getHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Delivery Agent Auth
export const deliveryRegister = async (agentData) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/register/`, agentData);
    return response.data;
};

// Dashboard Stats
export const fetchDeliveryDashboard = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/delivery/dashboard/`, {
        headers: getHeaders()
    });
    return response.data;
};

// Assignments
export const fetchAssignedOrders = async (status = '') => {
    const url = status ? `${API_BASE_URL}/api/delivery/assignments/?status=${status}` : `${API_BASE_URL}/api/delivery/assignments/`;
    const response = await axios.get(url, {
        headers: getHeaders()
    });
    return response.data;
};

export const fetchAssignmentDetail = async (assignmentId) => {
    const response = await axios.get(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/`, {
        headers: getHeaders()
    });
    return response.data;
};

export const acceptOrder = async (assignmentId) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/accept/`, {}, {
        headers: getHeaders()
    });
    return response.data;
};

export const startDelivery = async (assignmentId) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/start/`, {}, {
        headers: getHeaders()
    });
    return response.data;
};

export const completeDelivery = async (assignmentId, data) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/complete/`, data, {
        headers: getHeaders()
    });
    return response.data;
};

// New Status Update API (picked_up / in_transit / failed)
export const markPickedUp = async (assignmentId) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/update-status/`, { status: 'picked_up' }, {
        headers: getHeaders()
    });
    return response.data;
};

export const markInTransit = async (assignmentId) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/update-status/`, { status: 'in_transit' }, {
        headers: getHeaders()
    });
    return response.data;
};

export const failDelivery = async (assignmentId, notes) => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/assignments/${assignmentId}/update-status/`, { status: 'failed', notes }, {
        headers: getHeaders()
    });
    return response.data;
};

// Earnings & Stats
export const fetchEarningsSummary = async (filter = 'monthly') => {
    const response = await axios.get(`${API_BASE_URL}/api/delivery/earnings/summary/?filter=${filter}`, {
        headers: getHeaders()
    });
    return response.data;
};

export const fetchCommissionList = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/delivery/earnings/`, {
        headers: getHeaders()
    });
    return response.data;
};

export const requestWithdrawal = async (amount, method = 'bank_transfer') => {
    const response = await axios.post(`${API_BASE_URL}/api/delivery/payments/withdraw/`, { amount, method }, {
        headers: getHeaders()
    });
    return response.data;
};

// Profile Management
export const fetchAgentProfile = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/delivery/profiles/get_agent/`, {
        headers: getHeaders()
    });
    return response.data;
};

export const updateAgentProfile = async (profileData) => {
    const response = await axios.patch(`${API_BASE_URL}/api/delivery/profiles/update_profile/`, profileData, {
        headers: getHeaders()
    });
    return response.data;
};
//  Nearby + OTP verification 

/**
 * Delivery agent signals "I am nearby" – triggers OTP generation and email to customer.
 * Optionally pass { latitude, longitude } for distance verification.
 */
export const triggerNearbyOTP = async (assignmentId, coords = {}) => {
    const response = await axios.post(
        `/api/delivery/assignments//nearby/`,
        coords,
        { headers: getHeaders() }
    );
    return response.data;
};

/**
 * Delivery agent verifies the OTP provided by the customer to confirm delivery.
 */
export const verifyDeliveryOTP = async (assignmentId, otp) => {
    const response = await axios.post(
        `/api/delivery/assignments//verify-otp/`,
        { otp },
        { headers: getHeaders() }
    );
    return response.data;
};
