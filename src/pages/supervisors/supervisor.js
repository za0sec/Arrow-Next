import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/router";
import apiClient from "@/utils/apiClient";
import DashboardNavbar from "@/components/DashboardNavbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FaFilePdf, FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { Dialog, Transition } from "@headlessui/react";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { loadImage } from '@/utils/loadImage';

// Nuevo componente para manejar cada ítem
const BranchItem = ({ branch }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    let statusColor = 'bg-red-500';
    let statusText = 'Pendiente';
    
    if (branch.visited) {
        statusColor = 'bg-green-500';
        statusText = 'Completada';
    } else if (branch.skipped) {
        statusColor = 'bg-yellow-500';
        statusText = 'Omitida por aviso';
    }

    return (
        <div>
            <div 
                className={`p-4 rounded-lg flex justify-between items-center cursor-pointer transition-all duration-300 ${
                    branch.visited ? 'bg-green-900/30 hover:bg-green-900/50' : 
                    branch.skipped ? 'bg-yellow-900/30 hover:bg-yellow-900/50' : 'bg-red-900/30 hover:bg-red-900/50'
                }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                        branch.visited ? 'bg-green-500' : 
                        branch.skipped ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-lg">{branch.name}</span>
                </div>
                <FaChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                }`} />
            </div>
            
            {isExpanded && branch.visitDetails && (
                <div className="mt-2 p-4 bg-gray-700/50 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {branch.visitDetails.imagePath && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Imagen de la visita</h4>
                                <div className="relative aspect-square overflow-hidden rounded-lg">
                                    <img 
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/${branch.visitDetails.imagePath}`}
                                        alt="Visita" 
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
                        {branch.visitDetails.signaturePath && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Firma</h4>
                                <div className="bg-white p-2 rounded-lg">
                                    <img 
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/${branch.visitDetails.signaturePath}`} 
                                        alt="Firma" 
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {branch.visitDetails.report && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-300">Reporte</h4>
                            <div className="bg-gray-600/50 p-4 rounded-lg">
                                <p className="text-gray-200">{branch.visitDetails.report[0].report}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-300">Responsable</h4>
                            <p className="text-gray-200 bg-gray-600/50 p-2 rounded-lg">
                                {branch.visitDetails.responsible}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-300">Fecha de visita</h4>
                            <p className="text-gray-200 bg-gray-600/50 p-2 rounded-lg">
                                {new Date(branch.visitDetails.visitDate).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Supervisor() {
    const router = useRouter();
    const {supervisorId} = router.query;

    const [supervisor, setSupervisor] = useState(null);
    const [dayDetails, setDayDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState('');
    const [branches, setBranches] = useState([]);

    // Estados para el reporte
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // Primer día del mes actual
    const [endDate, setEndDate] = useState(new Date()); // Hoy
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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
            try {
                const adjustedDate = new Date();
                adjustedDate.setHours(0, 0, 0, 0);

                const response = await apiClient.get(`/user/supervisor/supervisorDay`, {
                    params: {
                        email: supervisor.email,
                        date: adjustedDate.toISOString().split('T')[0]
                    }
                });

                if (response.data) {
                    setDayDetails(response.data);
                } else {
                    setDayDetails({
                        branches: [],
                        message: 'No hay tareas asignadas para hoy'
                    });
                }
            } catch (err) {
                console.error('Error al obtener tareas del supervisor:', err);
                setError('Error al obtener las tareas del día para el supervisor');
                setDayDetails({
                    branches: [],
                    message: 'Error al cargar las tareas'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSupervisorDay();
    }, [supervisor]);

    const navigateToBranch = (branchId) => {
        router.push(`/company/branch?branchId=${branchId}`);
    };

    // Funciones para el reporte
    const openReportDialog = () => {
        setIsReportDialogOpen(true);
    };

    const closeReportDialog = () => {
        setIsReportDialogOpen(false);
    };

    const generateReportData = async () => {
        try {
            setLoadingReport(true);
            setErrorMessage("");
            
            if (!supervisorId) {
                setErrorMessage("ID de supervisor no disponible");
                setLoadingReport(false);
                return;
            }
            
            console.log("Enviando parámetros:", {
                supervisorId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });
            
            const response = await apiClient.get(`/admin/supervisor/report`, {
                params: {
                    supervisorId: supervisorId,
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                }
            });
            
            console.log("Respuesta:", response.data);
            setReportData(response.data);
        } catch (error) {
            console.error("Error generating report data:", error);
            if (error.response) {
                console.error("Respuesta de error:", error.response.data);
                setErrorMessage(`Error: ${error.response.data.error || error.response.statusText}`);
            } else {
                setErrorMessage("Error al generar los datos del reporte");
            }
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setLoadingReport(false);
        }
    };

    const generatePDF = async () => {
        if (!reportData) {
            setErrorMessage("No hay datos para generar el reporte");
            return;
        }

        try {
            console.log("Iniciando generación de PDF con datos:", reportData);
            
            // Crear un nuevo documento PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configuración de colores y estilos
            const primaryColor = [0, 181, 238]; // #00b5ee
            const secondaryColor = [128, 128, 128]; // Gris
            
            // Constantes para manejo de márgenes y posiciones
            const margin = 10;
            const pageWidth = 210; // A4 width
            const pageHeight = 297; // A4 height
            const contentWidth = pageWidth - (2 * margin);
            const footerPosition = 280; // Posición Y donde comienza el pie de página
            const safeContentHeight = footerPosition - margin; // Altura segura para contenido
            
            // Función auxiliar para manejar textos largos
            const splitTextToFit = (text, maxWidth, fontSize) => {
                doc.setFontSize(fontSize);
                return doc.splitTextToSize(text, maxWidth);
            };
            
            // Función para verificar si se necesita nueva página
            const checkNewPage = (currentY, neededSpace) => {
                if (currentY + neededSpace > safeContentHeight) {
                    doc.addPage();
                    return margin + 10; // Retorna nueva posición Y en la nueva página
                }
                return currentY;
            };
            
            // Encabezado con logo
            try {
                const logoUrl = '/images/logo-arrow.png';
                const logoImg = await loadImage(logoUrl);
                const logoWidth = 40;
                const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
                console.log("Logo cargado correctamente");
            } catch (err) {
                console.error('Error cargando el logo:', err);
                // Alternativa si falla la carga del logo
                doc.setFontSize(22);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("ARROW CONNECT", margin + 5, margin + 10);
            }
            
            // Título del documento
            doc.setFontSize(20);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("REPORTE DE SUPERVISOR", pageWidth / 2, 30, { align: "center" });
            
            // Línea divisoria
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, 35, pageWidth - margin, 35);
            
            // Información del supervisor
            doc.setFontSize(12);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("INFORMACIÓN DEL SUPERVISOR", pageWidth / 2, 50, { align: "center" });
            
            // Cuadro de información principal
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(margin, 55, contentWidth, 30, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            // Asegurarse de que el nombre del supervisor se muestre correctamente
            const supervisorName = reportData.supervisor?.name || 'No especificado';
            doc.text(`Supervisor: ${supervisorName}`, margin + 5, 65);
            doc.text(`Período: ${new Date(reportData.period.startDate).toLocaleDateString()} - ${new Date(reportData.period.endDate).toLocaleDateString()}`, margin + 5, 75);
            
            // Resumen de visitas
            doc.setFontSize(12);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("RESUMEN DE VISITAS", pageWidth / 2, 100, { align: "center" });
            
            // Cuadro de resumen
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(margin, 105, contentWidth, 35, 3, 3, 'F');
            
            // Verificar que los datos existan antes de usarlos
            const totalVisits = reportData.totalScheduled || 0;
            const completedVisits = reportData.totalCompleted || 0;
            const skippedVisits = reportData.totalSkipped || 0;
            const completionRate = totalVisits > 0 ? (completedVisits / totalVisits * 100).toFixed(2) : 0;
            const skipRate = totalVisits > 0 ? (skippedVisits / totalVisits * 100).toFixed(2) : 0;
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de visitas programadas: ${totalVisits}`, margin + 5, 115);
            doc.text(`Visitas completadas: ${completedVisits}`, margin + 5, 125);
            doc.text(`Visitas omitidas: ${skippedVisits}`, margin + 5, 135);
            doc.text(`Tasa de cumplimiento: ${completionRate}%`, margin + 110, 115);
            doc.text(`Tasa de omisión: ${skipRate}%`, margin + 110, 125);
            
            // Título para la sección de empresas
            let yPosition = 150;
            
            // Verificar si se necesita una nueva página
            yPosition = checkNewPage(yPosition, 15);
            
            doc.setFontSize(14);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("DETALLE DE VISITAS POR EMPRESA", pageWidth / 2, yPosition, { align: "center" });
            
            yPosition += 10;
            
            // Verificar si hay empresas
            if (!reportData.companies || reportData.companies.length === 0) {
                doc.setFontSize(11);
                doc.setTextColor(255, 0, 0);
                doc.text("No hay datos de empresas disponibles", pageWidth / 2, yPosition + 15, { align: "center" });
                yPosition += 20;
            } else {
                // Crear tabla de empresas
                const rowHeight = 10;
                
                // Verificar si se necesita nueva página
                yPosition = checkNewPage(yPosition, rowHeight + 5);
                
                // Encabezados
                doc.setFontSize(10);
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setTextColor(255, 255, 255);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                
                // Rectángulo para encabezados
                doc.rect(margin, yPosition, contentWidth, rowHeight, 'F');
                
                // Textos de encabezados
                const col1Width = 80; // Empresa
                const col2Width = 25; // Programadas
                const col3Width = 25; // Completadas
                const col4Width = 25; // Omitidas
                const col5Width = 25; // Estado
                
                doc.text("Empresa", margin + 5, yPosition + 7);
                doc.text("Programadas", margin + col1Width + 5, yPosition + 7);
                doc.text("Completadas", margin + col1Width + col2Width + 5, yPosition + 7);
                doc.text("Omitidas", margin + col1Width + col2Width + col3Width + 5, yPosition + 7);
                doc.text("Estado", margin + col1Width + col2Width + col3Width + col4Width + 5, yPosition + 7);
                
                yPosition += rowHeight;
                
                // Filas de datos
                doc.setTextColor(0, 0, 0);
                
                // Alternar colores para las filas
                let isAlternateRow = false;
                
                for (const company of reportData.companies) {
                    // Verificar si se necesita nueva página
                    yPosition = checkNewPage(yPosition, rowHeight + 5);
                    
                    // Calcular totales por empresa
                    const companyScheduled = company.branches.reduce((sum, branch) => sum + (branch.scheduledVisits || 0), 0);
                    const companyCompleted = company.branches.reduce((sum, branch) => sum + (branch.completedVisits || 0), 0);
                    const companySkipped = company.branches.reduce((sum, branch) => sum + (branch.skippedVisits || 0), 0);
                    const companyRate = companyScheduled > 0 ? (companyCompleted / companyScheduled * 100).toFixed(0) : 0;
                    
                    // Fondo para filas alternas
                    if (isAlternateRow) {
                        doc.setFillColor(240, 240, 240);
                        doc.rect(margin, yPosition, contentWidth, rowHeight, 'F');
                    }
                    isAlternateRow = !isAlternateRow;
                    
                    // Dividir nombre de empresa si es muy largo
                    const companyName = company.name || 'Sin nombre';
                    
                    // Limitar longitud del texto para la columna de empresa
                    const maxCompanyNameWidth = col1Width - 10;
                    let displayName = companyName;
                    if (doc.getTextWidth(companyName) > maxCompanyNameWidth) {
                        // Truncar el nombre si es muy largo
                        displayName = companyName.substring(0, 30) + "...";
                    }
                    
                    // Datos de la empresa
                    doc.text(displayName, margin + 5, yPosition + 7);
                    doc.text(String(companyScheduled), margin + col1Width + 5, yPosition + 7);
                    doc.text(String(companyCompleted), margin + col1Width + col2Width + 5, yPosition + 7);
                    doc.text(String(companySkipped || 0), margin + col1Width + col2Width + col3Width + 5, yPosition + 7);
                    
                    // Estado (porcentaje de cumplimiento)
                    // Color según el porcentaje
                    if (companyRate >= 80) {
                        doc.setTextColor(0, 128, 0); // Verde
                    } else if (companyRate >= 50) {
                        doc.setTextColor(255, 165, 0); // Naranja
                    } else {
                        doc.setTextColor(255, 0, 0); // Rojo
                    }
                    
                    doc.text(`${companyRate}%`, margin + col1Width + col2Width + col3Width + col4Width + 5, yPosition + 7);
                    doc.setTextColor(0, 0, 0); // Restaurar color
                    
                    yPosition += rowHeight;
                }
                
                // Agregar detalle por sucursal
                doc.addPage();
                yPosition = margin + 10;
                
                doc.setFontSize(14);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("DETALLE DE VISITAS POR SUCURSAL", pageWidth / 2, yPosition, { align: "center" });
                
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setLineWidth(0.5);
                doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5);
                
                yPosition += 15;
                
                for (const company of reportData.companies) {
                    // Verificar espacio disponible
                    yPosition = checkNewPage(yPosition, 15);
                    
                    // Nombre de la empresa como encabezado
                    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.rect(margin, yPosition, contentWidth, 10, 'F');
                    
                    doc.setFontSize(12);
                    doc.setTextColor(255, 255, 255);
                    doc.text(`${company.name}`, margin + 5, yPosition + 7);
                    
                    yPosition += 15;
                    
                    // Si no hay sucursales para esta empresa
                    if (!company.branches || company.branches.length === 0) {
                        yPosition = checkNewPage(yPosition, 10);
                        doc.setFontSize(10);
                        doc.setTextColor(100, 100, 100);
                        doc.text("No hay sucursales para esta empresa", margin + 10, yPosition);
                        yPosition += 10;
                        continue;
                    }
                    
                    for (const branch of company.branches) {
                        // Verificar espacio disponible
                        yPosition = checkNewPage(yPosition, 25);
                        
                        // Nombre y dirección de la sucursal
                        doc.setFontSize(11);
                        doc.setTextColor(0, 0, 0);
                        
                        // Manejar direcciones largas
                        const branchNameAddress = `${branch.name} - ${branch.address || 'Sin dirección'}`;
                        
                        // Verificar si el texto es demasiado largo
                        if (doc.getTextWidth(branchNameAddress) > contentWidth - 20) {
                            // Dividir en nombre y dirección separados
                            doc.text(`${branch.name}`, margin + 10, yPosition);
                            yPosition += 5;
                            
                            // Dividir la dirección en múltiples líneas si es necesario
                            const wrappedAddress = doc.splitTextToSize(branch.address || 'Sin dirección', contentWidth - 30);
                            for (let i = 0; i < wrappedAddress.length; i++) {
                                doc.text(wrappedAddress[i], margin + 15, yPosition);
                                yPosition += 5;
                            }
                        } else {
                            doc.text(branchNameAddress, margin + 10, yPosition);
                            yPosition += 5;
                        }
                        
                        // Estadísticas de la sucursal
                        yPosition = checkNewPage(yPosition, 10);
                        doc.setFontSize(9);
                        doc.text(`Visitas programadas: ${branch.scheduledVisits || 0}`, margin + 15, yPosition);
                        doc.text(`Visitas completadas: ${branch.completedVisits || 0}`, margin + 90, yPosition);
                        
                        const branchRate = branch.scheduledVisits > 0 
                            ? (branch.completedVisits / branch.scheduledVisits * 100).toFixed(0) 
                            : 0;
                        
                        // Color según el porcentaje
                        if (branchRate >= 80) {
                            doc.setTextColor(0, 128, 0); // Verde
                        } else if (branchRate >= 50) {
                            doc.setTextColor(255, 165, 0); // Naranja
                        } else {
                            doc.setTextColor(255, 0, 0); // Rojo
                        }
                        
                        doc.text(`Tasa: ${branchRate}%`, margin + 160, yPosition);
                        doc.setTextColor(0, 0, 0); // Restaurar color
                        
                        yPosition += 10;
                        
                        // Si hay visitas para esta sucursal
                        if (branch.visits && branch.visits.length > 0) {
                            // Verificar espacio
                            yPosition = checkNewPage(yPosition, 10);
                            
                            // Encabezados de la tabla de visitas
                            doc.setFillColor(220, 220, 220);
                            doc.rect(margin + 15, yPosition, contentWidth - 30, 7, 'F');
                            
                            doc.setFontSize(8);
                            doc.setTextColor(0, 0, 0);
                            doc.text("Fecha", margin + 20, yPosition + 5);
                            doc.text("Estado", margin + 80, yPosition + 5);
                            doc.text("Observaciones", margin + 140, yPosition + 5);
                            
                            yPosition += 7;
                            
                            // Filas de visitas
                            for (const visit of branch.visits) {
                                // Verificar espacio para esta visita
                                yPosition = checkNewPage(yPosition, 8);
                                
                                // Formatear fecha
                                const visitDate = new Date(visit.date);
                                const formattedDate = visitDate.toLocaleDateString();
                                
                                // Datos de la visita
                                doc.setFontSize(8);
                                doc.text(formattedDate, margin + 20, yPosition + 4);
                                
                                // Estado con color
                                if (visit.status === 'visited' || visit.visited) {
                                    doc.setTextColor(0, 128, 0); // Verde
                                    doc.text("Visitada", margin + 80, yPosition + 4);
                                } else if (visit.status === 'skipped' || visit.skipped) {
                                    doc.setTextColor(255, 165, 0); // Naranja
                                    doc.text("Omitida", margin + 80, yPosition + 4);
                                } else {
                                    doc.setTextColor(255, 0, 0); // Rojo
                                    doc.text("No visitada", margin + 80, yPosition + 4);
                                }
                                
                                // Observaciones (truncadas si son muy largas)
                                doc.setTextColor(0, 0, 0);
                                const details = visit.details || 'Sin observaciones';
                                const maxDetailsWidth = contentWidth - 150;
                                
                                if (doc.getTextWidth(details) > maxDetailsWidth) {
                                    // Truncar el texto si es muy largo
                                    const truncatedDetails = details.substring(0, 25) + '...';
                                    doc.text(truncatedDetails, margin + 140, yPosition + 4);
                                } else {
                                    doc.text(details, margin + 140, yPosition + 4);
                                }
                                
                                yPosition += 6;
                            }
                        } else {
                            yPosition = checkNewPage(yPosition, 8);
                            doc.setFontSize(8);
                            doc.setTextColor(100, 100, 100);
                            doc.text("No hay visitas registradas para esta sucursal", margin + 15, yPosition);
                            yPosition += 6;
                        }
                        
                        yPosition += 10; // Espacio entre sucursales
                    }
                    
                    yPosition += 10; // Espacio entre empresas
                }
            }
            
            // Pie de página en todas las páginas
            try {
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    
                    // Línea de pie de página
                    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.setLineWidth(0.5);
                    doc.line(margin, footerPosition, pageWidth - margin, footerPosition);
                    
                    // Texto de pie de página
                    doc.setFontSize(8);
                    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                    doc.text(`Arrow Connect - Reporte de Supervisor - ${new Date().toLocaleDateString()}`, pageWidth / 2, footerPosition + 7, { align: "center" });
                    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 5, footerPosition + 7, { align: "right" });
                }
                console.log("Pie de página agregado correctamente");
            } catch (pageErr) {
                console.error("Error agregando pie de página:", pageErr);
            }
            
            // Guardar el PDF
            const fileName = `Reporte_Supervisor_${supervisorName.replace(/\s+/g, '_')}_${reportData.period.startDate}_${reportData.period.endDate}.pdf`;
            console.log("Guardando PDF con nombre:", fileName);
            doc.save(fileName);
            
            setSuccessMessage("PDF generado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error('Error detallado al generar el PDF:', err);
            setErrorMessage(`Error al generar el PDF: ${err.message || 'Error desconocido'}`);
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
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
                        <div className="bg-gray-800 pt-8 rounded-lg">
                            <div className="flex justify-center items-center mb-6">
                                <button
                                    onClick={openReportDialog}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                                    >
                                    <FaFilePdf className="mr-2" />
                                    Generar Reporte
                                </button>
                            </div>
                        </div>
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
                            <div className="space-y-4">
                                {dayDetails.branches.map((branch) => (
                                    <BranchItem key={branch.id} branch={branch} />
                                ))}
                            </div>
                        </div>
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

            {/* Diálogo de Reporte */}
            <Transition appear show={isReportDialogOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={closeReportDialog}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95">
                        <div className="fixed inset-0 bg-black bg-opacity-50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-white">
                                        Generar Reporte de Supervisor
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300 mb-2"
                                                htmlFor="startDate">
                                                Fecha de inicio
                                            </label>
                                            <div className="flex items-center">
                                                <FaCalendarAlt className="text-gray-400 mr-2" />
                                                <input
                                                    type="date"
                                                    id="startDate"
                                                    value={startDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setStartDate(new Date(e.target.value))}
                                                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    max={endDate.toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300 mb-2"
                                                htmlFor="endDate">
                                                Fecha de fin
                                            </label>
                                            <div className="flex items-center">
                                                <FaCalendarAlt className="text-gray-400 mr-2" />
                                                <input
                                                    type="date"
                                                    id="endDate"
                                                    value={endDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setEndDate(new Date(e.target.value))}
                                                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    min={startDate.toISOString().split('T')[0]}
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        
                                        {reportData && (
                                            <div className="mt-4 bg-gray-700 p-4 rounded-lg">
                                                <h4 className="text-white font-medium mb-2">Resumen</h4>
                                                <p className="text-gray-300">Visitas programadas: {reportData.totalScheduled || 0}</p>
                                                <p className="text-gray-300">Visitas completadas: {reportData.totalCompleted || 0}</p>
                                                <p className="text-gray-300">Visitas omitidas: {reportData.totalSkipped || 0}</p>
                                                <p className="text-gray-300">
                                                    Tasa de cumplimiento: 
                                                    {reportData.totalScheduled > 0 
                                                        ? (reportData.totalCompleted / reportData.totalScheduled * 100).toFixed(2) 
                                                        : 0}%
                                                </p>
                                                <p className="text-gray-300">
                                                    Tasa de omisión: 
                                                    {reportData.totalScheduled > 0 
                                                        ? (reportData.totalSkipped / reportData.totalScheduled * 100).toFixed(2) 
                                                        : 0}%
                                                </p>
                                            </div>
                                        )}
                                        
                                        {errorMessage && (
                                            <div className="bg-red-500 text-white px-4 py-2 rounded-md mt-4">
                                                {errorMessage}
                                            </div>
                                        )}
                                        {successMessage && (
                                            <div className="bg-green-500 text-white px-4 py-2 rounded-md mt-4">
                                                {successMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={closeReportDialog}>
                                            Cancelar
                                        </button>
                                        {!reportData ? (
                                            <button
                                                className="bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-primary-dark flex items-center"
                                                onClick={generateReportData}
                                                disabled={loadingReport}>
                                                {loadingReport ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Generando...
                                                    </>
                                                ) : (
                                                    'Generar Datos'
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                className="bg-green-600 text-white font-medium px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                                                onClick={generatePDF}>
                                                <FaFilePdf className="mr-2" />
                                                Descargar PDF
                                            </button>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}