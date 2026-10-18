import axios from 'axios';
import { getToken, clearAuth } from './authStore';

const defaultBaseURL = import.meta.env.VITE_API_URL || (
    import.meta.env.PROD
        ? 'https://svrp-1.onrender.com/api'
        : 'http://localhost:5000/api'
);

const api = axios.create({
    baseURL: defaultBaseURL,
});

// Add a request interceptor to include the token from memory
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        // Only set token if not already set (allows Admin routes to pass their own token)
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;
        const requestUrl = error.config?.url || '';

        // Public endpoints that don't require auth - don't force logout for these
        const publicEndpoints = ['/products', '/categories', '/contact', '/public', '/login', '/register'];
        const isPublicRequest = publicEndpoints.some(ep => requestUrl.includes(ep));

        if (status === 401 || status === 403) {
            // Check if it's an admin request
            if (requestUrl.includes('/admin')) {
                // Let the component handle it (e.g., redirect to admin login)
            } else if (!isPublicRequest) {
                // Only auto-logout for protected endpoints
                if (!window.location.pathname.includes('/login')) {
                    clearAuth();
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
