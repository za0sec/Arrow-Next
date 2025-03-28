import axios from 'axios';
import Cookies from 'js-cookie';
import config from "@/utils/config";

const apiClient = axios.create({
    baseURL: `${config.apiUrl}`,
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

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
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

const refreshTokenSilently = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) return;

    try {
        const response = await apiClient.post('/token', 
            new URLSearchParams({ refreshToken }), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        if (response.status === 200) {
            const { accessToken, newRefreshToken, role } = response.data;
            
            Cookies.set('accessToken', accessToken, { secure: true, sameSite: 'Strict' });
            Cookies.set('refreshToken', newRefreshToken, { secure: true, sameSite: 'Strict' });
            localStorage.setItem('userRole', role);
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('userRole');
        router.replace('/');
    }
};

export default apiClient;
