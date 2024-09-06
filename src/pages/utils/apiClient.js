import axios from 'axios';
import Cookies from 'js-cookie';
import config from "@/pages/utils/config";

const apiClient = axios.create({
    baseURL: `${config.apiUrl}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    let accessToken = Cookies.get('accessToken');

    if (!accessToken) {
        accessToken = await refreshAccessToken();
    }

    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

async function refreshAccessToken() {
    try {
        const refreshToken = Cookies.get('refreshToken');
        console.log("Refresh", refreshToken);
        if (!refreshToken) {
            console.log('No refresh token available.');
            return null;
        }

        const response = await apiClient.post(`/token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        console.log("New tokens", accessToken, newRefreshToken);

        Cookies.set('accessToken', accessToken);
        if (newRefreshToken) {
            Cookies.set('refreshToken', newRefreshToken);
        }

        return accessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
}


export default apiClient;
