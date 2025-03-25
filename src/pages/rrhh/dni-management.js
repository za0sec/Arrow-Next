import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RrhhNavbar from '@/components/RrhhNavbar';
import apiClient from "@/utils/apiClient";

export default function DniManagement() {
    const [dni, setDni] = useState('');
    const [dniList, setDniList] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                if (response.status === 200) {
                    const userData = response.data;
                    const userRole = localStorage.getItem('userRole');
                    
                    // Verificar que sea un usuario de RRHH
                    if (userRole !== 'rrhh') {
                        router.push('/');
                        return;
                    }
                    setUser(userData);
                } else if (response.status === 401) {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error en autenticación:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        const fetchDniList = async () => {
            try {
                const response = await apiClient.get('/rrhh/dni');
                setDniList(response.data);
            } catch (error) {
                console.error('Error fetching DNI list:', error);
                setError('Error al cargar la lista de DNIs');
            }
        };

        if (user) {
            fetchDniList();
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!dni.trim()) {
            setError('El DNI no puede estar vacío');
            return;
        }

        try {
            await apiClient.post('/rrhh/dni', { dni: dni.trim() });
            setSuccess('DNI agregado exitosamente');
            setDni('');
            // Actualizar la lista de DNIs
            const response = await apiClient.get('/rrhh/dni');
            setDniList(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Error al agregar el DNI');
        }
    };

    const handleDelete = async (dniToDelete) => {
        try {
            await apiClient.delete(`/rrhh/dni/${dniToDelete}`);
            // Actualizar la lista de DNIs
            const response = await apiClient.get('/rrhh/dni');
            setDniList(response.data);
            setSuccess('DNI eliminado exitosamente');
        } catch (error) {
            setError(error.response?.data?.message || 'Error al eliminar el DNI');
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <RrhhNavbar user={user} />
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-6">Gestión de DNIs</h1>
                        
                        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
                            <div className="flex gap-4">
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                        placeholder="Ingrese el DNI"
                                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
                                >
                                    Agregar DNI
                                </button>
                            </div>
                            {error && <p className="text-red-500 mt-2">{error}</p>}
                            {success && <p className="text-green-500 mt-2">{success}</p>}
                        </form>

                        <div className="bg-gray-800 rounded-lg shadow-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">DNIs Registrados</h2>
                                <div className="grid gap-4">
                                    {dniList.map((dniItem) => (
                                        <div 
                                            key={dniItem.id} 
                                            className="flex justify-between items-center bg-gray-700 p-4 rounded-md"
                                        >
                                            <span className="text-white">{dniItem.dni}</span>
                                            <button
                                                onClick={() => handleDelete(dniItem.dni)}
                                                className="text-red-400 hover:text-red-500 focus:outline-none"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    ))}
                                    {dniList.length === 0 && (
                                        <p className="text-gray-400">No hay DNIs registrados</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 