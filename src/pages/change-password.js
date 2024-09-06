import {useEffect, useState} from 'react';
import { useRouter } from 'next/router';
import Cookies from "js-cookie";
import DashboardNavbar from "./components/DashboardNavbar";
import {authenticate, fetchWithToken} from "./utils/auth";
import config from "@/pages/utils/config";
import apiClient from "@/pages/utils/apiClient";

export default function ChangePassword() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
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

    const handleSubmit = async (e) => {
        e.preventDefault();

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
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }


    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user}/>
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                    <h1 className="text-3xl font-bold mb-6 text-center text-primary">Cambiar Contraseña</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300" htmlFor="currentPassword">Contraseña Actual</label>
                            <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-300" htmlFor="newPassword">Nueva Contraseña</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-300" htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
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