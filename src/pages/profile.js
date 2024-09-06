import {useEffect, useState} from 'react';
import Image from 'next/image';
import cookie from 'cookie';
import Cookies from "js-cookie";
import DashboardNavbar from "./components/DashboardNavbar";
import config from "@/pages/utils/config";
import {authenticate, checkToken, fetchWithToken} from "@/pages/utils/auth";
import apiClient from "@/pages/utils/apiClient";
import {useRouter} from "next/router";

export default function Profile() {

    const [success, setSuccess] = useState('');
    const [user, setUser] = useState('');
    const [profilePicture, setProfilePicture] = useState(`https://arrowconnect.arrowservicios.ar/api/uploads/profile/${user.email}.jpg`);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);


    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');

                if (response.status === 200) {
                    setUser(response.data);
                    setFirstName(response.data.firstName);
                    setLastName(response.data.lastName);
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


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.post('/user/profile/update', {
                firstName,
                lastName,
            });

            if (response.status === 200) {
                setSuccess('Perfil actualizado con éxito');
            } else {
                setError('Error al actualizar el perfil.');
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
            <br/>
            <br/>
            <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
                    <h1 className="text-3xl font-bold mb-6 text-center text-primary">Mi Perfil</h1>
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative w-24 h-24">
                            <Image
                                src={profilePicture}
                                alt="Foto de perfil"
                                layout="fill"
                                className="rounded-full object-cover"
                            />
                        </div>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-gray-400">Nombre</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-primary focus:ring-primary focus:ring-1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400">Apellido</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-primary focus:ring-primary focus:ring-1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400">Correo Electrónico</label>
                            <input
                                type="email"
                                value={user.email}
                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-primary focus:ring-primary focus:ring-1"
                                readOnly
                            />
                        </div>
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        {success && <p className="text-green-500 mb-4">{success}</p>}
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark"
                        >
                            Actualizar Perfil
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
