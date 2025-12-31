import axios from 'axios';

// Firebase configuration for REST APIs
export const FIREBASE_CONFIG = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const api = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorData = error.response?.data?.error || error.response?.data;
        const message = errorData?.message || error.message || 'An unexpected error occurred';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export default api;
