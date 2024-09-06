import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient from '@/pages/utils/apiClient';
import DashboardNavbar from "@/pages/components/DashboardNavbar";

export default function Supervisor() {
    const router = useRouter();
    const {supervisorId} = router.query;

    const [supervisor, setSupervisor] = useState(null);
    const [dayDetails, setDayDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState('');
    const [branches, setBranches] = useState([]);

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

    useEffect(() => {
        if (!supervisorId) return;

        const fetchSupervisorDetails = async () => {
            try {
                const response = await apiClient.get(`/admin/supervisor/${supervisorId}`);
                setSupervisor(response.data);
            } catch (err) {
                setError('Error al obtener los detalles del supervisor');
                console.error(err);
            }
        };

        const fetchBranches = async () => {
            try {
                const response = await apiClient.get(`/admin/supervisor/company/branches/assigned/${supervisorId}`);
                setBranches(response.data);
            } catch (err) {
                setError('Error al obtener las sucursales del supervisor');
                console.error(err);
            }
        };

        fetchSupervisorDetails();
        fetchBranches();
    }, [supervisorId]);

    useEffect(() => {
        if (!supervisor || !supervisor.email) return;

        const fetchSupervisorDay = async () => {
            const date = new Date();
            try {
                const response = await apiClient.get(`/user/supervisor/supervisorDay`, {
                    params: {email: supervisor.email, date},
                });
                console.log(response.data);
                setDayDetails(response.data);
            } catch (err) {
                setError('Error al obtener las tareas del día para el supervisor');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSupervisorDay();
    }, [supervisor]);

    const navigateToBranch = (branchId) => {
        router.push(`/company/branch?branchId=${branchId}`);
    };

    if (loading) {
        return <div className="text-center text-white">Cargando...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user}/>
            <div
                className="flex flex-col items-center justify-center mt-24 bg-gray-900 mb-24 text-white px-4 sm:px-6 lg:px-8">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl text-center">
                    <div className="mb-6">
                        {supervisor?.profile_image_path ? (
                            <img
                                src={supervisor.profile_image_path}
                                alt={`${supervisor.firstName} ${supervisor.lastName}`}
                                className="w-32 h-32 rounded-full mx-auto"
                            />
                        ) : (
                            <div
                                className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mx-auto">
                                <span className="text-gray-400">Sin foto</span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        {supervisor?.firstName} {supervisor?.lastName}
                    </h1>
                    <p className="text-gray-300">{supervisor?.email}</p>
                    <p className="text-gray-300">Zona: {supervisor?.zone}</p>
                </div>

                {dayDetails && dayDetails.branches && (
                    <div className="p-8 rounded-lg flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                        <div className="bg-gray-800 p-8 rounded-lg flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                            <h2 className="text-2xl font-bold mb-4">Tareas del Día</h2>
                            {dayDetails.enlaceRecorrido && (
                                <p className="mt-4 text-gray-300 mb-6">
                                    <a
                                        href={dayDetails.enlaceRecorrido} target="_blank" rel="noopener noreferrer"
                                        className="text-primary cursor-pointer hover:00c2ff underline-animation-link"
                                    >
                                        Enlace de recorrido
                                    </a>
                                </p>
                            )}
                            {dayDetails.branches.map((branch) => (
                                <li
                                    key={branch.id}
                                    className={`p-4 mb-3 rounded-lg flex justify-between items-center border-2 ${
                                        branch.visited ? 'border-green-500' : 'border-red-500'
                                    }`}
                                >
                                    <span>{branch.name}</span>
                                    <span className="text-gray-500 text-sm">
                                    {branch.visited ? 'Visitado' : 'No Visitado'}
                                </span>
                                </li>
                            ))}
                        </div>
                        <ul>
                        </ul>
                    </div>
                )}
                <div className="p-8 rounded-lg flex-grow container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gray-800 p-8 rounded-lg flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                        <h2 className="text-2xl font-bold mb-4">Sucursales</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    className="bg-gray-700 p-6 rounded-lg shadow-md cursor-pointer transition duration-300 hover:bg-gray-600"
                                    onClick={() => navigateToBranch(branch.id)}
                                >
                                    <h3 className="text-xl font-bold text-primary mb-2">{branch.name}</h3>
                                    <p className="text-gray-300">Dirección: {branch.address}</p>
                                    <p className="text-gray-300">Densidad: {branch.density}</p>
                                    <p className="text-gray-300">Frecuencia: {branch.frequency}</p>
                                    <p className="text-gray-300">
                                        Visitas Restantes: {branch.remainingVisits}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}