import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient from "@/pages/utils/apiClient";
import DashboardNavbar from '@/pages/components/DashboardNavbar';
import GoogleMapReact from 'google-map-react';
import config from "@/pages/utils/config";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';



export default function BranchDetails() {
    const [user, setUser] = useState('');
    const [branchDetails, setBranchDetails] = useState(null);
    const [calendarDates, setCalendarDates] = useState([]);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { branchId } = router.query;

    moment.locale('es');

    const localizer = momentLocalizer(moment);

    const Marker = () => (
        <div className="text-red-500 text-xl">📍</div>
    );

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
        if (branchId) {
            const fetchBranchDetails = async () => {
                try {
                    const response = await apiClient.get(`/admin/company/branch/${branchId}`);
                    setBranchDetails(response.data);
                } catch (error) {
                    setError('Error al obtener los detalles de la sucursal.');
                    console.error('Error fetching branch details:', error);
                }
            };

            const fetchCalendarDates = async () => {
                try {
                    const response = await apiClient.get(`/admin/company/branch/getBranchCalendar/${branchId}`);

                    const events = response.data.map(dateString => {
                        const date = new Date(dateString);
                        date.setDate(date.getDate() + 1);
                        return {
                            title: 'Visita',
                            start: date,
                            allDay: true,
                        };
                    });

                    setCalendarDates(events);
                } catch (error) {
                    setError('Error al obtener las fechas del calendario.');
                    console.error('Error fetching calendar dates:', error);
                }
            };

            const fetchLocation = async () => {
                try {
                    const response = await apiClient.get(`/user/company/branch/getBranchLocation/${branchId}`);
                    setLocation(response.data);
                } catch (error) {
                    setError('Error al obtener la ubicación de la sucursal.');
                    console.error('Error fetching location:', error);
                }
            };

            fetchBranchDetails();
            fetchCalendarDates();
            fetchLocation();
            setLoading(false);
        }
    }, [branchId]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const handleSupervisor = (supervisorId) => {
        router.push(`/supervisors/supervisor?supervisorId=${supervisorId}`);
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4">{branchDetails?.name}</h1>
                    <p className="text-gray-300">Dirección: {branchDetails?.address}</p>
                    <p className="text-gray-300">Densidad: {branchDetails?.density}</p>
                    <p className="text-gray-300">Frecuencia: {branchDetails?.frequency}</p>
                    <p className="text-gray-300">
                        Supervisor: &nbsp;
                        {branchDetails?.supervisor ? (
                            <span
                                onClick={() => handleSupervisor(branchDetails.supervisor.id)}
                                className="text-primary cursor-pointer hover:00c2ff underline-animation-link"
                            >
                                {branchDetails.supervisor.name}
                            </span>
                        ) : (
                            "No asignado"
                        )}
                    </p>

                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h2 className="text-2xl font-bold text-white mb-4">Ubicación</h2>
                    {location && (
                        <div style={{ height: '400px', width: '100%' }}>
                            <GoogleMapReact
                                bootstrapURLKeys={{ key: config.googleApiKey }}
                                defaultCenter={{ lat: location.lat, lng: location.lng }}
                                defaultZoom={15}
                                options={{
                                    styles: config.darkMapStyle,
                                    disableDefaultUI: true,
                                    zoomControl: false,
                                    fullscreenControl: false,
                                    mapTypeControl: false,
                                    clickableIcons: true,
                                    mapTypeId: 'roadmap',
                                    streetViewControl: false,
                                    keyboardShortcuts: false,
                                    scaleControl: false,
                                    disableDoubleClickZoom: true,
                                    scrollwheel: true,
                                }}
                            >
                                <Marker lat={location.lat} lng={location.lng} />
                            </GoogleMapReact>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h2 className="text-2xl font-bold text-white mb-4">Calendario de visitas programadas</h2>
                    <div className="bg-gray-900 text-white rounded-md p-4">
                        <Calendar
                            localizer={localizer}
                            events={calendarDates}
                            startAccessor="start"
                            style={{ height: 500, borderRadius: '15px', overflow: 'hidden' }}
                            views={['month']}
                            messages={{
                                next: 'Siguiente',
                                previous: 'Anterior',
                                today: 'Hoy',
                                month: 'Mes',
                                week: 'Semana',
                                day: 'Día',
                            }}
                            formats={{
                                weekdayFormat: (date) => {
                                    const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
                                    return weekdays[date.getDay()];
                                },
                            }}
                            popup={true}
                            eventPropGetter={(event) => ({
                                style: {
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                }
                            })}
                            components={{
                                event: ({ event }) => (
                                    <div className="flex justify-center items-center h-full">
                                        <span className="font-bold text-sm">Visita</span>
                                    </div>
                                ),
                            }}
                            dayPropGetter={(date) => {
                                const hasEvent = calendarDates.some(event => new Date(event.start).toDateString() === date.toDateString());
                                return {
                                    style: {
                                        backgroundColor: hasEvent ? 'rgba(190,255,164,0.2)' : 'transparent',
                                        color: hasEvent ? '#fff' : '#000',
                                        borderRadius: '7px',
                                    }
                                };
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

const Marker = () => (
    <div className="h-3 w-3 bg-primary rounded-full"></div>
);
