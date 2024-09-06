import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from './components/DashboardNavbar';
import { authenticate, fetchWithToken } from "./utils/auth";
import cookie from 'cookie';
import Cookies from "js-cookie";
import config from "@/pages/utils/config";
import apiClient from "@/pages/utils/apiClient";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import { FaChevronDown } from "react-icons/fa";

export default function Dashboard() {
    const router = useRouter();
    const [recentActivities, setRecentActivities] = useState([]);
    const [user, setUser] = useState(null);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [date, setDate] = useState(new Date());

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

    const fetchSupervisors = async () => {
        try {
            const response = await apiClient.get('/admin/supervisors/all');
            if (response.status === 200) {
                const supervisorsData = response.data;

                const supervisorsWithDetails = await Promise.all(
                    supervisorsData.map(async (supervisor) => {
                        try {
                            const dayResponse = await apiClient.get('/user/supervisor/supervisorDay', {
                                params: {
                                    email: supervisor.email,
                                    date,
                                }
                            });


                            const dayDetails = dayResponse.data;

                            return {
                                ...supervisor,
                                dayDetails: dayDetails && dayDetails.branches && dayDetails.branches.length > 0
                                    ? dayDetails
                                    : { branches: [], message: 'No tiene nada asignado el día de hoy.' }
                            };
                        } catch (error) {
                            console.error('Error fetching day details for supervisor:', error);
                            return {
                                ...supervisor,
                                dayDetails: { branches: [], message: 'Error al obtener detalles del día.' }
                            };
                        }
                    })
                );

                setSupervisors(supervisorsWithDetails);
            } else {
                setError('Error al obtener los supervisores');
            }
        } catch (error) {
            setError('Error al obtener los supervisores');
            console.error('Error fetching supervisors:', error);
        }
    };

    useEffect(() => {
        fetchSupervisors();

        const intervalId = setInterval(fetchSupervisors, 10000);

        return () => clearInterval(intervalId);
    }, [router, date]);


    useEffect(() => {
        const fetchRecentActivities = async () => {
            try {
                const response = await apiClient.get('/admin/supervisors/recent');

                const data = response.data;

                const newActivities = data.activities?.filter(
                    (activity) => !recentActivities.some((existing) => existing.id === activity.id)
                );

                if (newActivities && newActivities.length > 0) {

                    newActivities.forEach((activity, index) => {
                        setTimeout(() => {
                            setRecentActivities((prevActivities) => {

                                const updatedActivities = prevActivities.map((activity) => ({
                                    ...activity,
                                    animationClass: 'move-down',
                                }));


                                const newActivity = { ...activity, animationClass: 'slide-in-from-top', key: `${activity.id}-${Date.now()}` };


                                return [
                                    newActivity,
                                    ...updatedActivities,
                                ].slice(0, 10);
                            });
                        }, index * 1000);
                    });
                }
            } catch (error) {
                console.error('Error fetching recent activities:', error);
            }
        };

        // Fetch recent activities initially
        fetchRecentActivities();

        // Set an interval to fetch recent activities every 10 seconds
        const intervalId = setInterval(fetchRecentActivities, 10000);

        // Cleanup the interval when the component is unmounted
        return () => clearInterval(intervalId);
    }, [router, recentActivities]);



    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }


    function handleDateChange(selectedDate) {
        setDate(selectedDate);
    }

    const navigateToSupervisor = (supervisorId) => {
        router.push(`/supervisors/supervisor?supervisorId=${supervisorId}`);
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col overflow-auto">
            <DashboardNavbar user={user} />
            <main
                className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10 flex justify-between items-center">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Bienvenido al Dashboard, <span className="text-primary">{user.firstName}</span>
                        </h1>
                        <div className="relative flex items-center">
                            <DatePicker
                                selected={new Date(date).toDateString()}
                                onChange={handleDateChange}
                                className="bg-gray-700 text-white p-2 pr-10 rounded-md"
                                dateFormat="yyyy-MM-dd"
                                placeholderText="Seleccione una fecha"
                                id="date-picker"
                            />
                            <FaChevronDown className="absolute right-2 text-white pointer-events-none" />
                        </div>
                    </div>
                    <p className="text-gray-300">
                        Aquí puedes gestionar todas las operaciones y ver estadísticas clave.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Supervisores</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {supervisors.map((supervisor) => (
                            <div
                                key={supervisor.id}
                                className="bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300 cursor-pointer transition duration-300 hover:bg-gray-700"
                                onClick={() => navigateToSupervisor(supervisor.id)}
                            >
                                <h3 className="text-xl font-bold text-primary mb-10">
                                    {supervisor.firstName} {supervisor.lastName} - Zona: {supervisor.zone}
                                </h3>
                                <ul className="space-y-5">
                                    {supervisor.dayDetails.branches.length > 0 ? (
                                        supervisor.dayDetails.branches.map((company) => (
                                            <li key={company.id} className="flex items-center">
                                                <span
                                                    className={`mr-2 h-4 w-4 rounded-full ${company.visited ? 'bg-green-500' : 'bg-red-500'}`}
                                                ></span>
                                                <span>{company.name}</span>
                                                <span className="ml-auto text-sm text-gray-400">
                                                    {company.visited ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-400">{supervisor.dayDetails.message}</li>
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10">
                    <h2 className="text-2xl font-bold text-white mb-4">Operaciones Recientes</h2>
                    <ul className="space-y-6">
                        {Array.isArray(recentActivities) && recentActivities.length > 0 ? (
                            recentActivities.map((activity, index) => (
                                <li
                                    key={activity.id || index}
                                    className={`bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300 ${activity.animationClass}`}
                                >
                                    <span
                                        className="font-bold text-primary">[{activity.date}]:</span> {activity.description}
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-400">No hay actividades recientes.</li>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    );
}

