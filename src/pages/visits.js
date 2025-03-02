import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient from '@/utils/apiClient';
import DashboardNavbar from "@/components/DashboardNavbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaChevronDown, FaFilePdf } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { loadImage } from '@/utils/loadImage';

// Nuevo componente para los checkboxes
const FilterCheckbox = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-2">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary border-gray-300"
        />
        <span className="text-gray-300">{label}</span>
    </label>
);

export default function VisitsPage() {
    const [visits, setVisits] = useState([]);
    const [filteredVisits, setFilteredVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSupervisor, setSelectedSupervisor] = useState('all');
    const [supervisors, setSupervisors] = useState([]);
    const [user, setUser] = useState(null);
    const [showVisited, setShowVisited] = useState(true);
    const [showNotVisited, setShowNotVisited] = useState(true);
    const [showSkipped, setShowSkipped] = useState(true);
    const [selectedVisit, setSelectedVisit] = useState(null);

    const fetchVisits = async (date, supervisor) => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/visits/getVisitsByDate', {
                params: { 
                    date: date.toISOString().split('T')[0],
                    supervisor: supervisor !== 'all' ? supervisor : undefined
                }
            });
            
            // Si no hay visitas, mostrar un array vacío
            setVisits(response.data.length > 0 ? response.data : []);
            setFilteredVisits(response.data.length > 0 ? response.data : []);
            
            // Extraer supervisores únicos
            const uniqueSupervisors = [...new Set(response.data.map(v => v.supervisorName))];
            setSupervisors(uniqueSupervisors);
        } catch (err) {
            setError('Error al obtener las visitas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = () => {
        let filtered = visits;
        
        filtered = filtered.map(supervisorVisits => {
            return {
                ...supervisorVisits,
                visits: supervisorVisits.visits.filter(visit => {
                    if (visit.visited && showVisited) return true;
                    if (!visit.visited && !visit.skipped && showNotVisited) return true;
                    if (visit.skipped && showSkipped) return true;
                    return false;
                })
            };
        }).filter(supervisorVisits => supervisorVisits.visits.length > 0);

        setFilteredVisits(filtered);
    };

    const handleVisitClick = async (visitId) => {
        try {
            const response = await apiClient.get(`/user/visit/getVisit`, {
                params: { 
                    id: visitId,
                    date: selectedDate.toISOString().split('T')[0],
                    email: user?.email
                }
            });
            setSelectedVisit(response.data);
        } catch (err) {
            console.error('Error fetching visit details:', err);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const response = await apiClient.get('/admin/visits/getVisitsByDate', {
                params: { date: selectedDate.toISOString().split('T')[0] }
            });
            const uniqueSupervisors = [...new Set(response.data.map(v => v.supervisorName))];
            setSupervisors(uniqueSupervisors);
        } catch (err) {
            console.error('Error fetching supervisors:', err);
        }
    };

    const generatePDF = async () => {
        if (!selectedVisit) return;

        try {
            // Crear un nuevo documento PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configuración de colores y estilos
            const primaryColor = [0, 181, 238]; // #00b5ee
            const secondaryColor = [128, 128, 128]; // Gris
            const yellowColor = [255, 193, 7]; // Color amarillo para visitas omitidas
            const visitDate = new Date(selectedVisit.visitDate).toLocaleString();
            
            // Encabezado con logo
            const logoUrl = '/images/logo-arrow.png'; // Ruta corregida al logo
            try {
                const logoImg = await loadImage(logoUrl);
                // Ajustar tamaño para mantener proporciones pero que no sea demasiado grande
                const logoWidth = 40;
                const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);
            } catch (err) {
                console.error('Error cargando el logo:', err);
                // Si falla la carga del logo, agregar texto alternativo
                doc.setFontSize(22);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("ARROW CONNECT", 15, 20);
            }
            
            // Título del documento
            doc.setFontSize(20);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("REPORTE DE VISITA", 105, 30, { align: "center" });
            
            // Línea divisoria
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);
            doc.line(10, 35, 200, 35);
            
            // Información de la visita
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Cuadro de información principal
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(10, 40, 190, 40, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("INFORMACIÓN DE LA SUCURSAL", 15, 48);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Nombre: ${selectedVisit.branch.name}`, 15, 55);
            doc.text(`Dirección: ${selectedVisit.branch.address}`, 15, 62);
            doc.text(`Fecha y hora de visita: ${visitDate}`, 15, 69);
            doc.text(`Responsable: ${selectedVisit.responsible || 'No especificado'}`, 15, 76);
            
            // Estado de la visita
            if (selectedVisit.skipped) {
                doc.setTextColor(yellowColor[0], yellowColor[1], yellowColor[2]);
                doc.text("Estado: Omitida por aviso", 120, 55);
                doc.setTextColor(0, 0, 0);
            }
            
            // Reporte
            let yPos = 90;
            if (selectedVisit.report) {
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(10, yPos - 8, 190, 40, 3, 3, 'F');
                
                doc.setFontSize(11);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("REPORTE", 15, yPos);
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                const reportText = typeof selectedVisit.report === 'string' 
                    ? selectedVisit.report 
                    : selectedVisit.report[0]?.report || 'No hay detalles del reporte';
                
                // Dividir el texto en líneas para que quepa en la página
                const splitText = doc.splitTextToSize(reportText, 180);
                doc.text(splitText, 15, yPos + 8);
                
                yPos += 50; // Ajustar posición para siguiente sección
            }
            
            // Evidencia fotográfica
            if (selectedVisit.imagePath) {
                doc.addPage();
                
                doc.setFontSize(16);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("EVIDENCIA FOTOGRÁFICA", 105, 20, { align: "center" });
                
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.line(10, 25, 200, 25);
                
                try {
                    // Cargar la imagen de la visita
                    const visitImg = await loadImage(`${process.env.NEXT_PUBLIC_API_URL}/${selectedVisit.imagePath}`);
                    
                    // Calcular dimensiones manteniendo la proporción original
                    // pero asegurando que quepa en la página y deje espacio para la firma
                    const maxWidth = 180;
                    
                    // Si hay firma, reducir la altura máxima para dejar espacio
                    const maxHeight = selectedVisit.signaturePath ? 140 : 200;
                    
                    let imgWidth, imgHeight;
                    
                    // Mantener proporciones originales
                    if (visitImg.width > visitImg.height) {
                        // Imagen horizontal
                        imgWidth = Math.min(maxWidth, visitImg.width);
                        imgHeight = (visitImg.height * imgWidth) / visitImg.width;
                        
                        // Si la altura es mayor que el máximo, ajustar
                        if (imgHeight > maxHeight) {
                            imgHeight = maxHeight;
                            imgWidth = (visitImg.width * imgHeight) / visitImg.height;
                        }
                    } else {
                        // Imagen vertical
                        imgHeight = Math.min(maxHeight, visitImg.height);
                        imgWidth = (visitImg.width * imgHeight) / visitImg.height;
                        
                        // Si el ancho es mayor que el máximo, ajustar
                        if (imgWidth > maxWidth) {
                            imgWidth = maxWidth;
                            imgHeight = (visitImg.height * imgWidth) / visitImg.width;
                        }
                    }
                    
                    // Centrar la imagen en la página
                    const xPos = (210 - imgWidth) / 2;
                    
                    // Agregar la imagen
                    doc.addImage(visitImg, 'JPEG', xPos, 35, imgWidth, imgHeight);
                    
                    // Agregar leyenda
                    doc.setFontSize(10);
                    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                    doc.text(`Imagen tomada el ${visitDate} en ${selectedVisit.branch.name}`, 15, 35 + imgHeight + 10);
                } catch (err) {
                    console.error('Error cargando la imagen de la visita:', err);
                    doc.setFontSize(12);
                    doc.setTextColor(255, 0, 0);
                    doc.text("No se pudo cargar la imagen de la visita", 105, 80, { align: "center" });
                }
            }
            
            // Firma - Modificamos para que sea más pequeña y mejor organizada
            if (selectedVisit.signaturePath) {
                // Si no hay imagen, crear una nueva página para la firma
                if (!selectedVisit.imagePath) {
                    doc.addPage();
                    
                    doc.setFontSize(16);
                    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.text("CONFORMIDAD DE VISITA", 105, 20, { align: "center" });
                    
                    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.line(10, 25, 200, 25);
                    
                    // Posición Y para la sección de conformidad cuando está en su propia página
                    var yPosition = 40;
                } else {
                    // Si hay imagen, posicionar la sección de conformidad debajo de la imagen con suficiente espacio
                    doc.setFontSize(16);
                    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.text("CONFORMIDAD DE VISITA", 105, 200, { align: "center" });
                    
                    // Posición Y para la sección de conformidad cuando está en la misma página que la imagen
                    var yPosition = 210;
                }
                
                try {
                    // Crear un rectángulo de fondo para la sección de conformidad
                    doc.setFillColor(245, 245, 245);
                    doc.roundedRect(10, yPosition, 190, 50, 3, 3, 'F');
                    
                    // Sección del responsable (lado izquierdo)
                    doc.setFontSize(11);
                    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.text("RESPONSABLE", 60, yPosition + 10, { align: "center" });
                    
                    // Nombre del responsable
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`${selectedVisit.responsible || 'Responsable'}`, 60, yPosition + 25, { align: "center" });
                    
                    // Línea para el nombre del responsable - Más corta y mejor posicionada
                    doc.setDrawColor(0, 0, 0);
                    doc.line(30, yPosition + 35, 90, yPosition + 35);
                    
                    // Sección de la firma (lado derecho)
                    doc.setFontSize(11);
                    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.text("FIRMA", 150, yPosition + 10, { align: "center" });
                    
                    // Cargar la imagen de la firma
                    const signatureImg = await loadImage(`${process.env.NEXT_PUBLIC_API_URL}/${selectedVisit.signaturePath}`);
                    
                    // Calcular dimensiones para una firma más pequeña
                    const sigWidth = 50;
                    const sigHeight = 25;
                    
                    // Agregar la firma (centrada en el lado derecho)
                    doc.addImage(signatureImg, 'PNG', 125, yPosition + 15, sigWidth, sigHeight);
                    
                    // Línea para la firma - Más corta y mejor posicionada
                    doc.setDrawColor(0, 0, 0);
                    doc.line(120, yPosition + 35, 180, yPosition + 35);
                    
                } catch (err) {
                    console.error('Error cargando la firma:', err);
                    doc.setFontSize(12);
                    doc.setTextColor(255, 0, 0);
                    doc.text("No se pudo cargar la firma", 150, yPosition + 20, { align: "center" });
                }
            }
            
            // Pie de página en todas las páginas
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                
                // Línea de pie de página
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setLineWidth(0.5);
                doc.line(10, 280, 200, 280);
                
                // Texto de pie de página
                doc.setFontSize(8);
                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.text(`Arrow Connect - ${selectedVisit.branch.name} - Reporte de Visita - ${new Date().toLocaleDateString()}`, 105, 287, { align: "center" });
                doc.text(`Página ${i} de ${totalPages}`, 190, 287, { align: "right" });
            }
            
            // Guardar el PDF
            doc.save(`Visita_${selectedVisit.branch.name}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error generando el PDF:', err);
            alert('Hubo un error al generar el PDF. Por favor, inténtelo de nuevo.');
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                setUser(response.data);
            } catch (error) {
                console.error('Error en autenticación:', error);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        fetchSupervisors();
    }, [selectedDate]);

    useEffect(() => {
        fetchVisits(selectedDate, selectedSupervisor);
    }, [selectedDate, selectedSupervisor]);

    useEffect(() => {
        handleFilterChange();
    }, [showVisited, showNotVisited, showSkipped]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <div className="flex flex-col items-center justify-center mt-24 bg-gray-900 mb-24 text-white px-4 sm:px-6 lg:px-8">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-6xl">
                    <h1 className="text-3xl font-bold mb-6">Visitas</h1>
                    
                    {/* Filtros */}
                    <div className="bg-gray-700 p-6 rounded-lg mb-6">
                        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Filtro por Supervisor */}
                            <div>
                                <label htmlFor="supervisor" className="block text-sm font-medium text-gray-300 mb-2">
                                    Supervisor
                                </label>
                                <select
                                    id="supervisor"
                                    value={selectedSupervisor}
                                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                                    className="block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                >
                                    <option value="all">Todos los supervisores</option>
                                    {supervisors.map((supervisor, index) => (
                                        <option key={index} value={supervisor}>{supervisor}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Fecha */}
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    className="block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Filtro por Estado */}
                            <div>
                                <p className="block text-sm font-medium text-gray-300 mb-2">
                                    Estado
                                </p>
                                <div className="space-y-2">
                                    <FilterCheckbox
                                        label="Visitadas"
                                        checked={showVisited}
                                        onChange={() => setShowVisited(!showVisited)}
                                    />
                                    <FilterCheckbox
                                        label="No visitadas"
                                        checked={showNotVisited}
                                        onChange={() => setShowNotVisited(!showNotVisited)}
                                    />
                                    <FilterCheckbox
                                        label="Omitidas por aviso"
                                        checked={showSkipped}
                                        onChange={() => setShowSkipped(!showSkipped)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredVisits.length > 0 ? (
                        <div className="space-y-4">
                            {filteredVisits.map((supervisorVisits) => (
                                <div key={supervisorVisits.supervisorId} className="bg-gray-700 p-6 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">
                                        {supervisorVisits.supervisorName}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {supervisorVisits.visits.map((visit) => (
                                            <div
                                                key={visit.id}
                                                className={`p-4 rounded-lg transition-colors ${
                                                    visit.visited 
                                                        ? 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 cursor-pointer'
                                                        : visit.skipped
                                                        ? 'bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 cursor-pointer'
                                                        : 'bg-gray-600/20 border border-gray-500/50'
                                                }`}
                                                onClick={() => (visit.visited || visit.skipped) && handleVisitClick(visit.id)}
                                            >
                                                <p className="text-lg font-semibold mb-2">{visit.branchName}</p>
                                                <p className="text-sm mb-2">
                                                    <span className="font-semibold">Dirección:</span> {visit.branchAddress}
                                                </p>
                                                <p className={`text-sm ${
                                                    visit.visited ? 'text-blue-300' : 
                                                    visit.skipped ? 'text-yellow-300' : 'text-gray-400'
                                                }`}>
                                                    {visit.visited ? 'Visitada' : 
                                                     visit.skipped ? 'Omitida por aviso' : 'No visitada'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-300 text-center">No hay visitas registradas para los filtros seleccionados</p>
                    )}
                </div>
            </div>

            {selectedVisit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl text-gray-300">{selectedVisit.branch.name}</h2>
                            <button
                                onClick={generatePDF}
                                className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                            >
                                <FaFilePdf className="mr-2" />
                                Descargar PDF
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedVisit.imagePath && (
                                <div>
                                    <h3 className="text-gray-300 mb-2">Foto de la visita</h3>
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/${selectedVisit.imagePath}`}
                                        alt="Visita"
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}
                            
                            {selectedVisit.signaturePath && (
                                <div>
                                    <h3 className="text-gray-300 mb-2">Firma</h3>
                                    <div className="bg-white p-2 rounded-lg">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/${selectedVisit.signaturePath}`}
                                            alt="Firma"
                                            className="w-full h-auto"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedVisit.report && (
                            <div className="mt-6">
                                <h3 className="text-gray-300 mb-2">Reporte</h3>
                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <p className="text-gray-200">
                                        {typeof selectedVisit.report === 'string' 
                                            ? selectedVisit.report 
                                            : selectedVisit.report[0].report || 'No hay detalles del reporte'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={() => setSelectedVisit(null)}
                                className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}