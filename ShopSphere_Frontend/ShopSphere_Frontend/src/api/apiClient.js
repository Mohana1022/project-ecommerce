import axios from "axios";

// Create an instance of axios
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: Automatically add the Bearer token to every request
apiClient.interceptors.request.use(
    (config) => {
        // Look for accessToken, fallback to 'token' for backward compatibility
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle token expiration and automatic refresh
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    // Try to get a new access token using the refresh token
                    const response = await axios.post(`${apiClient.defaults.baseURL}/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;

                    // Store the new access token
                    localStorage.setItem("accessToken", access);

                    // Update the authorization header for the original request
                    originalRequest.headers.Authorization = `Bearer ${access}`;

                    // Retry the original request
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError);
                    // If refresh fails, log out the user
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
