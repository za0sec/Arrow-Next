import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import apiClient from "@/utils/apiClient";

export default function AuthCheck() {
    const router = useRouter();

    const saveTokens = (accessToken, refreshToken, role) => {
        try {
            // Guardamos en localStorage como respaldo
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('userRole', role);

            // Intentamos guardar en cookies
            document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=Strict`;
            document.cookie = `accessToken=${accessToken}; path=/; max-age=${24 * 60 * 60}; secure; samesite=Strict`;

            console.log('Tokens guardados:', {
                refresh: Cookies.get('refreshToken'),
                access: Cookies.get('accessToken'),
                localRefresh: localStorage.getItem('refreshToken')
            });
        } catch (error) {
            console.error('Error guardando tokens:', error);
        }
    };

    const getRefreshToken = () => {
        // Intentar obtener de cookie primero, luego de localStorage
        return Cookies.get('refreshToken') || localStorage.getItem('refreshToken');
    };

    useEffect(() => {
        if (!router.isReady) return;

        const checkAuth = async () => {
            // Lista de rutas públicas que no requieren autenticación
            const publicRoutes = ['/forgot-password', '/reset-password'];
            
            // Si estamos en una ruta pública, no hacemos nada
            if (publicRoutes.includes(router.pathname) || router.pathname.startsWith('/reset-password')) {
                return;
            }

            const refreshToken = getRefreshToken();
            const userRole = localStorage.getItem('userRole');

            // Si hay token, intentamos verificarlo
            if (refreshToken) {
                try {
                    const response = await apiClient.post('/token', 
                        new URLSearchParams({ refreshToken }).toString(),
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }
                    );

                    if (response.status === 200) {
                        const { accessToken, refreshToken: newRefreshToken, role } = response.data;
                        
                        // Guardar nuevos tokens
                        saveTokens(accessToken, newRefreshToken, role);

                        // Si estamos en la página principal o en una ruta incorrecta, redirigir
                        if (router.pathname === '/' || 
                            (role === 'rrhh' && !router.pathname.startsWith('/rrhh')) ||
                            (role === 'administrator' && router.pathname.startsWith('/rrhh'))) {
                            
                            const targetRoute = role === 'rrhh' ? '/rrhh/dni-management' : '/dashboard';
                            router.replace(targetRoute);
                        }
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // Si hay error y no estamos en la página principal, redirigir a /
                    if (router.pathname !== '/') {
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('userRole');
                        Cookies.remove('refreshToken', { path: '/' });
                        Cookies.remove('accessToken', { path: '/' });
                        router.replace('/');
                    }
                }
            } else if (router.pathname !== '/') {
                // Si no hay token y no estamos en la página principal, redirigir a /
                router.replace('/');
            }
        };

        checkAuth();
    }, [router.isReady, router.pathname]);

    return null;
} 