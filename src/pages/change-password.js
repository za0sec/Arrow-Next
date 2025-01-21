import {useEffect, useState} from 'react';
import { useRouter } from 'next/router';
import Cookies from "js-cookie";
import DashboardNavbar from "../components/DashboardNavbar";
import {authenticate, fetchWithToken} from "@/utils/auth";
import config from "@/utils/config";
import apiClient from "@/utils/apiClient";
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import PasswordInput from "@/components/PasswordInput";

export default function ChangePassword() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');

                if (response.status === 200) {
                    setUser(response.data);
                } else if (response.status === 401) {
                    router.push('/');
                } else {
                    setError('Error al obtener el perfil del usuario');
                }
            } catch (error) {
                setError('Error al obtener el perfil del usuario');
                console.error('Error en autenticación:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    // Verificar coincidencia de contraseñas en tiempo real
    useEffect(() => {
        if (confirmNewPassword) {
            setPasswordsMatch(newPassword === confirmNewPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [newPassword, confirmNewPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verificar que la contraseña cumple con los requisitos mínimos
        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        // Verificar que la contraseña contiene los caracteres requeridos
        const hasNumber = /\d/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (!hasNumber || !hasLower || !hasUpper || !hasSpecial) {
            setError('La contraseña no cumple con los requisitos de seguridad');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('Las contraseñas nuevas no coinciden');
            return;
        }

        try {
            const response = await apiClient.post('/changePassword', {
                currentPassword,
                newPassword,
            });

            if (response.status === 200) {
                setSuccess('Contraseña actualizada con éxito');
                setTimeout(() => router.push('/dashboard'), 1000);
            } else {
                const errorData = response.data;
                setError(errorData.message || 'Error al actualizar la contraseña');
            }
        } catch (error) {
            setError('Error de red. Inténtalo de nuevo.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl">Cargando...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
                    <div className="text-red-500 text-center">
                        <p className="text-xl">Error</p>
                        <p className="mt-2">{error}</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user}/>
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                    <h1 className="text-3xl font-bold mb-6 text-center text-primary">Cambiar Contraseña</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <PasswordInput
                                id="currentPassword"
                                label="Contraseña Actual"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <PasswordInput
                                id="newPassword"
                                label="Nueva Contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <PasswordStrengthMeter password={newPassword} />
                        </div>
                        <div className="mb-4">
                            <PasswordInput
                                id="confirmNewPassword"
                                label="Confirmar Nueva Contraseña"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                error={!passwordsMatch && confirmNewPassword}
                            />
                        </div>
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        {success && <p className="text-green-500 mb-4">{success}</p>}
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark"
                        >
                            Cambiar Contraseña
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}