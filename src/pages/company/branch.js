import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import apiClient from "@/utils/apiClient";
import DashboardNavbar from '@/components/DashboardNavbar';
import GoogleMapReact from 'google-map-react';
import config from "@/utils/config";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import QRCode from 'qrcode.react';
import ReactToPrint from 'react-to-print';
import { jsPDF } from 'jspdf';
import { loadImage } from '@/utils/loadImage';

export default function BranchDetails() {
    const [user, setUser] = useState('');
    const [branchDetails, setBranchDetails] = useState(null);
    const [calendarDates, setCalendarDates] = useState([]);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { branchId } = router.query;
    const [showQRModal, setShowQRModal] = useState(false);

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

    // Función para generar datos del QR
    const generateQRData = () => {
        if (!branchDetails) return '';
        return JSON.stringify({
            branchId: branchDetails.id,
            branchName: branchDetails.name,
            branchLocation: branchDetails.address,
            latitude: location?.lat,
            longitude: location?.lng
        });
    };

    // Componente del Modal de QR
    const QRModal = () => {
        const qrRef = useRef();

        const generatePDF = async () => {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Configuración de colores
            const primaryColor = [0, 181, 238]; // #00b5ee
            const secondaryColor = [128, 128, 128]; // Gris

            try {
                // Encabezado con logo
                const logoUrl = '/images/logo-arrow.png';
                const logoImg = await loadImage(logoUrl);
                const logoWidth = 40;
                const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);

                // Título
                doc.setFontSize(20);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("Control de Asistencia - Arrow Servicios", 105, 30, { align: "center" });

                // Línea divisoria
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setLineWidth(0.5);
                doc.line(10, 35, 200, 35);

                // Nombre de la sucursal
                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text(`Sucursal: ${branchDetails?.name || 'Sin nombre'}`, 20, 50);

                // Generar QR
                const qrCanvas = document.querySelector('.print-content canvas');
                const qrDataUrl = qrCanvas.toDataURL();
                const qrSize = 100;
                const pageWidth = doc.internal.pageSize.getWidth();
                const qrX = (pageWidth - qrSize) / 2;
                doc.addImage(qrDataUrl, 'PNG', qrX, 70, qrSize, qrSize);

                // Pie de página
                doc.setFontSize(8);
                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.text(`Arrow Connect - ${new Date().toLocaleDateString()}`, 105, 287, { align: "center" });

                // Guardar PDF
                const fileName = `QR_${branchDetails?.name || 'Sucursal'}.pdf`;
                doc.save(fileName);

            } catch (error) {
                console.error('Error generando PDF:', error);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-8 rounded-lg w-11/12 max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-4">Código QR de la Sucursal</h2>
                    
                    <div className="flex justify-center mb-6">
                        <div className="print-content">
                            <QRCode 
                                value={generateQRData()}
                                size={256}
                                level="H"
                                includeMargin={true}
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cerrar
                        </button>
                        
                        <button
                            onClick={generatePDF}
                            className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Descargar PDF
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-bold text-white mb-4">{branchDetails?.name}</h1>
                        <button
                            onClick={() => setShowQRModal(true)}
                            className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded h-fit"
                        >
                            Generar Código QR
                        </button>
                    </div>
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

                {/* Modal de QR */}
                {showQRModal && <QRModal />}
            </main>
        </div>
    );
}

const Marker = () => (
    <div className="h-3 w-3 bg-primary rounded-full"></div>
);
