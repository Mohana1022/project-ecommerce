import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

// // LOGIN

// export const loginUser = async (loginData) => {
//   const response = await axios.post(
//     `${API_BASE_URL}/user_login`,
//     loginData
//   );
//   console.log(response.data);

//   // Save tokens immediately after login
//   if (response.data?.access) {
//     localStorage.setItem("accessToken", response.data.access);
//     localStorage.setItem("refreshToken", response.data.refresh);
//   }

//   return response.data;
// };

// // SIGNUP
// export const signupUser = async (signupData) => {
//   const response = await axios.post(
//     `${API_BASE_URL}/register`,
//     signupData
//   );
//   return response.data;
// };


// // LOGOUT
// export const logout = () => {
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("refreshToken");
// };

// // GET MY ORDERS (Protected)

// export const getMyOrders = async () => {
//   const token = localStorage.getItem("accessToken");

//   if (!token) {
//     throw new Error("No access token found");
//   }

//   const response = await axios.get(
//     `${API_BASE_URL}/my_orders`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   return response.data;
// };

// // PROCESS PAYMENT (Protected)
// export const processPayment = async (paymentData) => {
//   const token = localStorage.getItem("accessToken");

//   if (!token) {
//     throw new Error("No access token found. Please login first.");
//   }

//   const response = await axios.post(
//     `${API_BASE_URL}/process_payment`,
//     paymentData,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   return response.data;
// };

// // ADDRESS MANAGEMENT (Protected)

// export const getAddresses = async () => {
//   const token = localStorage.getItem("accessToken");
//   if (!token) throw new Error("No access token found");

//   const response = await axios.get(`${API_BASE_URL}/address`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return response.data;
// };

// export const addAddress = async (addressData) => {
//   const token = localStorage.getItem("accessToken");
//   if (!token) throw new Error("No access token found");

//   const response = await axios.post(`${API_BASE_URL}/address`, addressData, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//   });
//   return response.data;
// };

// export const deleteAddress = async (id) => {
//   const token = localStorage.getItem("accessToken");
//   if (!token) throw new Error("No access token found");

//   const response = await axios.post(`${API_BASE_URL}/delete-address/${id}`, {}, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return response.data;
// };

import apiClient from "./apiClient";

// LOGIN
export const loginUser = async (loginData) => {
  const response = await apiClient.post("/user_login/", loginData);

  // Save tokens and user data immediately after login
  if (response.data?.access) {
    localStorage.setItem("accessToken", response.data.access);
    localStorage.setItem("refreshToken", response.data.refresh);
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response.data;
};

// GOOGLE LOGIN
export const googleLogin = async (googleData) => {
  const response = await apiClient.post("/google_login/", googleData);

  if (response.data?.access) {
    localStorage.setItem("accessToken", response.data.access);
    localStorage.setItem("refreshToken", response.data.refresh);
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response.data;
};

// SIGNUP
export const signupUser = async (signupData) => {
  const response = await apiClient.post("/register/", signupData);
  return response.data;
};
// FORGOT PASSWORD (Public)
export const forgotPassword = async (email) => {
  const response = await apiClient.post("/auth/?page=forgot", { email });
  return response.data;
};

export const resetPassword = async (token, password1, password2) => {
  const response = await apiClient.post(`/auth/?page=reset&token=${token}`, {
    password1,
    password2,
  });
  return response.data;
};

// PRODUCTS (Public)
export const getProducts = async () => {
  const response = await apiClient.get("/products/");
  return response.data;
};

// LOGOUT
export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// GET MY ORDERS (Protected)
export const getMyOrders = async () => {
  const response = await apiClient.get("/my_orders/");
  return response.data;
};

export const processPayment = async (paymentData) => {
  const response = await apiClient.post("/process_payment/", paymentData);
  return response.data;
};

// ADDRESS MANAGEMENT (Protected)

export const getAddresses = async () => {
  const response = await apiClient.get("/address/");
  return response.data;
};

export const addAddress = async (addressData) => {
  const response = await apiClient.post("/address/", addressData);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await apiClient.post(`/delete-address/${id}/`, {});
  return response.data;
};

export const updateAddress = async (id, addressData) => {
  const response = await apiClient.put(`/update-address/${id}/`, addressData);
  return response.data;
};

export const getProductDetail = async (productId) => {
  const response = await apiClient.get(`/product/${productId}/`, {
    params: { format: 'json' }
  });
  return response.data;
};

export const submitReview = async (productId, reviewData) => {
  const response = await apiClient.post(`/submit_review/${productId}/`, reviewData);
  return response.data;
};

export const deleteReview = async (productId) => {
  const response = await apiClient.delete(`/delete_review/${productId}/`);
  return response.data;
};

// TRENDING PRODUCTS (Public)
export const getTrendingProducts = async () => {
  const response = await apiClient.get("/trending/");
  return response.data;
};

// LOG SEARCH QUERY (Public – silent, best-effort)
export const logSearch = async (query) => {
  try {
    await apiClient.post("/log-search/", { query });
  } catch {
    // fire-and-forget, do not surface errors to user
  }
};

// MOST SEARCHED PRODUCTS – ML ranked (Public)
export const getMostSearchedProducts = async () => {
  const response = await apiClient.get("/most-searched/");
  return response.data;
};

// Reverse Geocoding (using Nominatim - OpenStreetMap)
export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat,
        lon,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        // Good practice to provide an agent
        'User-Agent': 'ShopSphere-App'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw error;
  }
};

// ── Order Lifecycle Tracking ─────────────────────────────────────────────────

/**
 * Fetch real-time tracking info for a customer's order.
 * Calls GET /api/delivery/track/<order_number>/
 */
export const getOrderTracking = async (orderNumber) => {
  const response = await apiClient.get(`/api/delivery/track/${orderNumber}/`);
  return response.data;
};
