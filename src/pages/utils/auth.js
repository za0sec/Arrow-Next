import apiClient from "@/pages/utils/apiClient";

export const authenticate = async (accessToken) => {
    if (!accessToken) {
        console.log("No hay token, redirigiendo...");
        return {
            redirect: { destination: '/', permanent: false },
            status: 401,
        };
    }

    try {
        const response = await apiClient.get('/user/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.status === 401) {
            return { status: 401 };
        }

        const user = response.data;
        return {
            props: { user },
        };
    } catch (error) {
        console.error('Error en autenticación:', error.message);
        return { redirect: { destination: '/', permanent: false } };
    }
};
