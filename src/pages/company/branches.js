import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import apiClient from "@/utils/apiClient";
import DashboardNavbar from "@/components/DashboardNavbar";
import Autocomplete from "react-google-autocomplete";
import config from "@/utils/config";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FaFilePdf, FaCalendarAlt } from "react-icons/fa";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { loadImage } from '@/utils/loadImage';

export default function BranchesPage() {
    const [branches, setBranches] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
        useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentBranch, setCurrentBranch] = useState({
        id: "",
        name: "",
        address: "",
        density: "",
        frequency: "",
    });
    const [branchToDelete, setBranchToDelete] = useState(null);
    const [user, setUser] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();
    const { companyId } = router.query;
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [company, setCompany] = useState(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // Primer día del mes actual
    const [endDate, setEndDate] = useState(new Date()); // Hoy
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isAttendanceReportDialogOpen, setIsAttendanceReportDialogOpen] = useState(false);
    const [attendanceStartDate, setAttendanceStartDate] = useState(new Date(new Date().setDate(1))); // Primer día del mes actual
    const [attendanceEndDate, setAttendanceEndDate] = useState(new Date()); // Hoy
    const [attendanceReportData, setAttendanceReportData] = useState(null);
    const [loadingAttendanceReport, setLoadingAttendanceReport] = useState(false);
    const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isStarring, setIsStarring] = useState(false);
    
    const openAttendanceReportDialog = () => {
        setIsAttendanceReportDialogOpen(true);
    };

    const closeAttendanceReportDialog = () => {
        setIsAttendanceReportDialogOpen(false);
    };

    const generateAttendanceReportData = async () => {
        try {
            setLoadingAttendanceReport(true);
            setErrorMessage("");
            
            if (!companyId) {
                setErrorMessage("ID de compañía no disponible");
                setLoadingAttendanceReport(false);
                return;
            }
            
            console.log("Enviando parámetros para reporte de asistencia:", {
                companyId,
                startDate: attendanceStartDate.toISOString().split('T')[0],
                endDate: attendanceEndDate.toISOString().split('T')[0]
            });
            
            const response = await apiClient.get(`/admin/company/attendance-report`, {
                params: {
                    companyId: companyId,
                    startDate: attendanceStartDate.toISOString().split('T')[0],
                    endDate: attendanceEndDate.toISOString().split('T')[0]
                }
            });
            
            console.log("Respuesta reporte asistencia:", response.data);
            setAttendanceReportData(response.data);
        } catch (error) {
            console.error("Error generating attendance report data:", error);
            if (error.response) {
                console.error("Respuesta de error:", error.response.data);
                setErrorMessage(`Error: ${error.response.data.error || error.response.statusText}`);
            } else {
                setErrorMessage("Error al generar los datos del reporte de asistencia");
            }
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setLoadingAttendanceReport(false);
        }
    };

    const generateAttendancePDF = async () => {
        if (!attendanceReportData) {
            setErrorMessage("No hay datos para generar el reporte de asistencia");
            return;
        }

        try {
            console.log("Iniciando generación de PDF de asistencia con datos:", attendanceReportData);
            
            // Crear un nuevo documento PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configuración de colores y estilos
            const primaryColor = [0, 181, 238]; // #00b5ee
            const secondaryColor = [128, 128, 128]; // Gris
            const orangeColor = [255, 165, 0]; // Color para incompletas
            const redColor = [255, 0, 0]; // Rojo para problemas
            const greenColor = [0, 128, 0]; // Verde para completas
            
            // Encabezado con logo
            try {
                const logoUrl = '/images/logo-arrow.png';
                const logoImg = await loadImage(logoUrl);
                const logoWidth = 40;
                const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);
                console.log("Logo cargado correctamente");
            } catch (err) {
                console.error('Error cargando el logo:', err);
                // Alternativa si falla la carga del logo
                doc.setFontSize(22);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("ARROW CONNECT", 15, 20);
            }
            
            // Título del documento
            doc.setFontSize(20);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("REPORTE DE ASISTENCIA", 105, 30, { align: "center" });
            
            // Línea divisoria
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);
            doc.line(10, 35, 200, 35);
            
            // Información de la empresa
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Cuadro de información principal
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(10, 40, 190, 30, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("INFORMACIÓN DE LA EMPRESA", 15, 48);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Empresa: ${company?.name || 'No especificada'}`, 15, 55);
            doc.text(`Período: ${attendanceStartDate.toLocaleDateString()} - ${attendanceEndDate.toLocaleDateString()}`, 15, 62);
            
            // Verificar que los datos existan antes de usarlos
            const totalAttendances = attendanceReportData.totalAttendances || 0;
            const completedAttendances = attendanceReportData.completedAttendances || 0;
            const incompleteAttendances = attendanceReportData.incompleteAttendances || 0;
            const completionRate = attendanceReportData.completionRate || 0;
            
            // Resumen estadístico
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(10, 80, 190, 40, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("RESUMEN DE ASISTENCIAS", 15, 88);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de registros: ${totalAttendances}`, 15, 95);
            doc.text(`Asistencias completas: ${completedAttendances}`, 15, 102);
            doc.text(`Asistencias incompletas: ${incompleteAttendances}`, 15, 109);
            doc.text(`Tasa de completitud: ${completionRate}%`, 120, 102);
            
            // Título de la tabla
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("DETALLE DE ASISTENCIA POR SUCURSAL", 105, 130, { align: "center" });
            
            // Verificar que branches exista y tenga elementos
            if (!attendanceReportData.branches || attendanceReportData.branches.length === 0) {
                doc.setFontSize(11);
                doc.setTextColor(255, 0, 0);
                doc.text("No hay datos de sucursales disponibles", 105, 140, { align: "center" });
            } else {
                // Configuración de la tabla
                let yPosition = 140;
                const rowHeight = 10;
                
                // Definir anchos de columnas para mejor alineación
                const colWidths = {
                    sucursal: 60,
                    total: 30,
                    completas: 30,
                    incompletas: 30,
                    tasa: 30
                };
                
                // Posiciones X de las columnas (acumulativo)
                const colPos = {
                    sucursal: 10,
                    total: colWidths.sucursal + 10,
                    completas: colWidths.sucursal + colWidths.total + 10,
                    incompletas: colWidths.sucursal + colWidths.total + colWidths.completas + 10,
                    tasa: colWidths.sucursal + colWidths.total + colWidths.completas + colWidths.incompletas + 10
                };
                
                // Encabezados
                doc.setFontSize(10);
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setTextColor(255, 255, 255);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                
                // Rectángulo para encabezados
                doc.rect(10, yPosition, 190, rowHeight, 'F');
                
                // Textos de encabezados
                doc.text("Sucursal", colPos.sucursal + 5, yPosition + 7);
                doc.text("Total", colPos.total + 10, yPosition + 7);
                doc.text("Completas", colPos.completas + 5, yPosition + 7);
                doc.text("Incompletas", colPos.incompletas + 5, yPosition + 7);
                doc.text("% Comp.", colPos.tasa + 5, yPosition + 7);
                
                yPosition += rowHeight;
                
                // Filas de datos
                doc.setTextColor(0, 0, 0);
                
                // Alternar colores para las filas
                let isAlternateRow = false;
                
                for (const branch of attendanceReportData.branches) {
                    // Fondo para filas alternas
                    if (isAlternateRow) {
                        doc.setFillColor(240, 240, 240);
                        doc.rect(10, yPosition, 190, rowHeight, 'F');
                    }
                    isAlternateRow = !isAlternateRow;
                    
                    // Datos de la sucursal
                    const branchName = branch.name || 'Sin nombre';
                    const totalCheckins = branch.totalCheckins || 0;
                    const completedCheckins = branch.completedCheckins || 0;
                    const incompleteCheckins = branch.incompleteCheckins || 0;
                    
                    // Calcular tasa de completitud
                    const completionRate = totalCheckins > 0 
                        ? ((completedCheckins / totalCheckins) * 100).toFixed(0) 
                        : 0;
                    
                    // Textos centrados en sus columnas
                    doc.text(branchName.length > 20 ? branchName.substring(0, 17) + '...' : branchName, 
                             colPos.sucursal + 5, yPosition + 7);
                    doc.text(String(totalCheckins), colPos.total + 10, yPosition + 7);
                    doc.text(String(completedCheckins), colPos.completas + 10, yPosition + 7);
                    doc.text(String(incompleteCheckins), colPos.incompletas + 10, yPosition + 7);
                    
                    // Color según el porcentaje
                    if (completionRate >= 80) {
                        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]); // Verde
                    } else if (completionRate >= 50) {
                        doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]); // Naranja
                    } else {
                        doc.setTextColor(redColor[0], redColor[1], redColor[2]); // Rojo
                    }
                    
                    doc.text(`${completionRate}%`, colPos.tasa + 10, yPosition + 7);
                    doc.setTextColor(0, 0, 0); // Restaurar color
                    
                    yPosition += rowHeight;
                    
                    // Si llegamos al final de la página, crear una nueva
                    if (yPosition > 260) {
                        doc.addPage();
                        yPosition = 20;
                        
                        // Repetir encabezados en la nueva página
                        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                        doc.setTextColor(255, 255, 255);
                        doc.rect(10, yPosition, 190, rowHeight, 'F');
                        
                        doc.text("Sucursal", colPos.sucursal + 5, yPosition + 7);
                        doc.text("Total", colPos.total + 10, yPosition + 7);
                        doc.text("Completas", colPos.completas + 5, yPosition + 7);
                        doc.text("Incompletas", colPos.incompletas + 5, yPosition + 7);
                        doc.text("% Comp.", colPos.tasa + 5, yPosition + 7);
                        
                        yPosition += rowHeight;
                        doc.setTextColor(0, 0, 0);
                        isAlternateRow = false;
                    }
                }
            }
            
            // Título para la sección de detalle por operador
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("DETALLE DE ASISTENCIA POR OPERADOR", 105, 20, { align: "center" });

            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);
            doc.line(10, 25, 200, 25);

            // Verificar si existen detalles de operadores
            if (!attendanceReportData.operators || attendanceReportData.operators.length === 0) {
                doc.setFontSize(11);
                doc.setTextColor(255, 0, 0);
                doc.text("No hay datos de operadores disponibles", 105, 40, { align: "center" });
            } else {
                let yPosition = 35;
                
                // Para cada operador
                for (const operator of attendanceReportData.operators) {
                    // Si no hay espacio suficiente para un nuevo operador, crear nueva página
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    // Nombre del operador como encabezado
                    doc.setFillColor(220, 220, 220);
                    doc.rect(10, yPosition, 190, 10, 'F');
                    
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`Operador: ${operator.name} (ID: ${operator.id})`, 15, yPosition + 7);
                    
                    yPosition += 15;
                    
                    // Si no hay asistencias para este operador
                    if (!operator.attendances || operator.attendances.length === 0) {
                        doc.setFontSize(10);
                        doc.setTextColor(100, 100, 100);
                        doc.text("No hay registros de asistencia para este operador", 20, yPosition);
                        yPosition += 10;
                        continue;
                    }
                    
                    // Encabezados de la tabla de asistencias
                    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    doc.setTextColor(255, 255, 255);
                    doc.rect(20, yPosition, 170, 8, 'F');
                    
                    // Definir anchos de columnas para la tabla de asistencias
                    const attendanceColWidths = {
                        fecha: 30,
                        sucursal: 50,
                        checkIn: 30,
                        checkOut: 30,
                        duracion: 30
                    };
                    
                    // Posiciones X de las columnas
                    const attendanceColPos = {
                        fecha: 20,
                        sucursal: attendanceColWidths.fecha + 20,
                        checkIn: attendanceColWidths.fecha + attendanceColWidths.sucursal + 20,
                        checkOut: attendanceColWidths.fecha + attendanceColWidths.sucursal + attendanceColWidths.checkIn + 20,
                        duracion: attendanceColWidths.fecha + attendanceColWidths.sucursal + attendanceColWidths.checkIn + attendanceColWidths.checkOut + 20
                    };
                    
                    doc.setFontSize(9);
                    doc.text("Fecha", attendanceColPos.fecha + 5, yPosition + 5.5);
                    doc.text("Sucursal", attendanceColPos.sucursal + 5, yPosition + 5.5);
                    doc.text("Entrada", attendanceColPos.checkIn + 5, yPosition + 5.5);
                    doc.text("Salida", attendanceColPos.checkOut + 5, yPosition + 5.5);
                    doc.text("Duración", attendanceColPos.duracion + 5, yPosition + 5.5);
                    
                    yPosition += 8;
                    
                    // Filas de asistencias
                    let isAlternateRow = false;
                    
                    for (const attendance of operator.attendances) {
                        // Si no hay espacio para más filas, crear nueva página
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 20;
                            
                            // Repetir encabezado de operador
                            doc.setFillColor(220, 220, 220);
                            doc.rect(10, yPosition, 190, 10, 'F');
                            
                            doc.setFontSize(12);
                            doc.setTextColor(0, 0, 0);
                            doc.text(`Operador: ${operator.name} (continuación)`, 15, yPosition + 7);
                            
                            yPosition += 15;
                            
                            // Repetir encabezados de tabla
                            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                            doc.setTextColor(255, 255, 255);
                            doc.rect(20, yPosition, 170, 8, 'F');
                            
                            doc.setFontSize(9);
                            doc.text("Fecha", attendanceColPos.fecha + 5, yPosition + 5.5);
                            doc.text("Sucursal", attendanceColPos.sucursal + 5, yPosition + 5.5);
                            doc.text("Entrada", attendanceColPos.checkIn + 5, yPosition + 5.5);
                            doc.text("Salida", attendanceColPos.checkOut + 5, yPosition + 5.5);
                            doc.text("Duración", attendanceColPos.duracion + 5, yPosition + 5.5);
                            
                            yPosition += 8;
                            isAlternateRow = false;
                        }
                        
                        // Fondo para filas alternas
                        if (isAlternateRow) {
                            doc.setFillColor(240, 240, 240);
                            doc.rect(20, yPosition, 170, 8, 'F');
                        }
                        isAlternateRow = !isAlternateRow;
                        
                        // Formatear fecha y horas
                        const attendanceDate = attendance.date || 'N/A';
                        const checkInTime = attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
                        const checkOutTime = attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pendiente';
                        
                        // Duración formateada (horas:minutos)
                        let durationFormatted = 'N/A';
                        if (attendance.duration !== null) {
                            const hours = Math.floor(attendance.duration / 60);
                            const minutes = attendance.duration % 60;
                            durationFormatted = `${hours}h ${minutes}m`;
                        }
                        
                        // Datos de la asistencia
                        doc.setFontSize(8);
                        doc.setTextColor(0, 0, 0);
                        doc.text(attendanceDate, attendanceColPos.fecha + 5, yPosition + 5.5);
                        
                        // Nombre de sucursal (truncado si es muy largo)
                        const branchName = attendance.branchName || 'N/A';
                        const truncatedBranchName = branchName.length > 20 ? branchName.substring(0, 17) + '...' : branchName;
                        doc.text(truncatedBranchName, attendanceColPos.sucursal + 5, yPosition + 5.5);
                        
                        doc.text(checkInTime, attendanceColPos.checkIn + 5, yPosition + 5.5);
                        
                        // Check-out con color
                        if (attendance.isComplete) {
                            doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]); // Verde
                        } else {
                            doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]); // Naranja
                        }
                        doc.text(checkOutTime, attendanceColPos.checkOut + 5, yPosition + 5.5);
                        doc.setTextColor(0, 0, 0); // Restaurar color
                        
                        // Duración
                        doc.text(durationFormatted, attendanceColPos.duracion + 5, yPosition + 5.5);
                        
                        yPosition += 8;
                    }
                    
                    // Espacio entre operadores
                    yPosition += 10;
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
                    doc.line(10, 280, 200, 280);
                    
                    // Texto de pie de página
                    doc.setFontSize(8);
                    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                    doc.text(`Arrow Connect - ${company?.name || 'Empresa'} - Reporte de Asistencia - ${new Date().toLocaleDateString()}`, 105, 287, { align: "center" });
                    doc.text(`Página ${i} de ${totalPages}`, 190, 287, { align: "right" });
                }
                console.log("Pie de página agregado correctamente");
            } catch (pageErr) {
                console.error("Error agregando pie de página:", pageErr);
            }
            
            // Guardar el PDF
            const fileName = `Asistencias_${company?.name || 'Empresa'}_${attendanceStartDate.toISOString().split('T')[0]}_${attendanceEndDate.toISOString().split('T')[0]}.pdf`;
            console.log("Guardando PDF con nombre:", fileName);
            doc.save(fileName);
            
            setSuccessMessage("PDF de asistencia generado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error('Error detallado al generar el PDF de asistencia:', err);
            setErrorMessage(`Error al generar el PDF: ${err.message || 'Error desconocido'}`);
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };
    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get("/user/profile");

                if (response.status === 200) {
                    setUser(response.data);
                } else if (response.status === 401) {
                    router.push("/");
                } else {
                    setError("Error al obtener el perfil del usuario");
                }
            } catch (error) {
                setError("Error al obtener el perfil del usuario");
                console.error("Error en autenticación:", error);
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        if (companyId) {
            const fetchBranches = async () => {
                try {
                    const response = await apiClient.get(
                        `/admin/company/branches/getCompanyBranches/${companyId}`
                    );
                    setBranches(response.data);
                } catch (error) {
                    console.error("Error fetching branches:", error);
                }
            };

            const fetchCompany = async () => {
                try {
                    const response = await apiClient.get(
                        `/admin/company/${companyId}`
                    );
                    if (response.status === 200) {
                        setCompany(response.data);
                    }
                } catch (error) {
                    console.error("Error fetching company:", error);
                }
            };

            fetchBranches();
            fetchCompany();
        }
    }, [companyId]);

    useEffect(() => {
        if (selectedImage) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(selectedImage);
        } else {
            setImagePreview(null);
        }
    }, [selectedImage]);

    const handleToggleStarred = async () => {
        try {
            setIsStarring(true);
            const response = await apiClient.post(`/company/toggle-starred/${companyId}`);
            
            // Actualizar el estado de la empresa
            setCompany(response.data.company);
            
            // Si la empresa fue desmarcada como destacada, limpiar la imagen
            if (!response.data.company.starred) {
                setSelectedImage(null);
                setImagePreview(null);
            }
            
            setSuccessMessage(response.data.message);
            
            // Si la empresa fue marcada como destacada, abrir el diálogo de imagen
            if (response.data.company.starred && !response.data.company.imagePath) {
                setIsImageUploadDialogOpen(true);
            }
            
        } catch (error) {
            setErrorMessage(error.response?.data?.error || 'Error al cambiar estado destacado');
        } finally {
            setIsStarring(false);
            setTimeout(() => setSuccessMessage(""), 3000);
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedImage) {
            setErrorMessage('Por favor selecciona una imagen');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('image', selectedImage);

            const response = await apiClient.post(
                `/company/upload-image/${companyId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setCompany(response.data.company);
            setSuccessMessage('Imagen subida exitosamente');
            setIsImageUploadDialogOpen(false);
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            setErrorMessage(error.response?.data?.error || 'Error al subir la imagen');
        }
    };

    const openDialog = (
        branch = { id: "", name: "", address: "", density: "", frequency: "" }
    ) => {
        setCurrentBranch(branch);
        setIsEditMode(!!branch.id);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setCurrentBranch({
            id: "",
            name: "",
            address: "",
            density: "",
            frequency: "",
        });
    };

    const handleSave = async () => {
        console.log(
            "latitude: ",
            currentBranch.latitude,
            "longitude: ",
            currentBranch.longitude
        );

        const url = isEditMode
            ? "/admin/company/branch/update"
            : "/admin/company/branch/add";
        const payload = isEditMode
            ? {
                  id: currentBranch.id,
                  name: currentBranch.name,
                  address: currentBranch.address,
                  density: currentBranch.density,
                  frequency: currentBranch.frequency,
                  latitude: currentBranch.latitude,
                  longitude: currentBranch.longitude,
              }
            : {
                  name: currentBranch.name,
                  address: currentBranch.address,
                  density: JSON.parse(currentBranch.density),
                  frequency: JSON.parse(currentBranch.frequency),
                  companyId: JSON.parse(companyId),
                  latitude: currentBranch.latitude,
                  longitude: currentBranch.longitude,
              };

        try {
            await apiClient.post(url, payload);
            const response = await apiClient.get(
                `/admin/company/branches/getCompanyBranches/${companyId}`
            );
            setBranches(response.data);
            setSuccessMessage(
                isEditMode
                    ? "Sucursal actualizada con éxito."
                    : "Sucursal agregada con éxito."
            );
            setTimeout(() => {
                setSuccessMessage("");
                closeDialog();
            }, 3000);
        } catch (error) {
            console.error("Error saving branch:", error);
            setErrorMessage(
                "Hubo un error al guardar la sucursal. Intenta nuevamente."
            );
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    const confirmDelete = (branch) => {
        setBranchToDelete(branch);
        setIsDeleteConfirmDialogOpen(true);
    };

    const handleDelete = async () => {
        try {
            await apiClient.post("/admin/company/branch/delete", {
                id: branchToDelete.id,
            });
            const response = await apiClient.get(
                `/admin/company/branches/getCompanyBranches/${companyId}`
            );
            setBranches(response.data);
            setSuccessMessage("Sucursal eliminada con éxito.");
            setTimeout(() => {
                setSuccessMessage("");
                closeDeleteConfirmDialog();
            }, 3000);
        } catch (error) {
            console.error("Error deleting branch:", error);
            setErrorMessage(
                "Hubo un error al eliminar la sucursal. Intenta nuevamente."
            );
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    const closeDeleteConfirmDialog = () => {
        setIsDeleteConfirmDialogOpen(false);
        setBranchToDelete(null);
    };

    const navigateToBranch = (branchId) => {
        router.push(`/company/branch?branchId=${branchId}`);
    };

    function handleAssign() {
        router.push(`/company/assignation?companyId=${companyId}`);
    }

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
            
            if (!companyId) {
                setErrorMessage("ID de compañía no disponible");
                setLoadingReport(false);
                return;
            }
            
            console.log("Enviando parámetros:", {
                companyId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });
            
            const response = await apiClient.get(`/admin/company/report`, {
                params: {
                    companyId: companyId,
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
            const orangeColor = [255, 165, 0]; // Color para omitidas
            const redColor = [255, 0, 0]; // Rojo para no visitadas
            const greenColor = [0, 128, 0]; // Verde para visitadas
            
            // Encabezado con logo
            try {
                const logoUrl = '/images/logo-arrow.png';
                const logoImg = await loadImage(logoUrl);
                const logoWidth = 40;
                const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);
                console.log("Logo cargado correctamente");
            } catch (err) {
                console.error('Error cargando el logo:', err);
                // Alternativa si falla la carga del logo
                doc.setFontSize(22);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("ARROW CONNECT", 15, 20);
            }
            
            // Título del documento
            doc.setFontSize(20);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("REPORTE MENSUAL DE VISITAS", 105, 30, { align: "center" });
            
            // Línea divisoria
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);
            doc.line(10, 35, 200, 35);
            
            // Información de la empresa
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Cuadro de información principal
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(10, 40, 190, 30, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("INFORMACIÓN DE LA EMPRESA", 15, 48);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Empresa: ${company?.name || 'No especificada'}`, 15, 55);
            doc.text(`Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 15, 62);
            
            // Verificar que los datos existan antes de usarlos
            const totalVisits = reportData.totalScheduled || 0;
            const completedVisits = reportData.totalCompleted || 0;
            const skippedVisits = reportData.totalSkipped || 0;
            const pendingVisits = totalVisits - completedVisits - skippedVisits;
            const completionRate = totalVisits > 0 ? (completedVisits / totalVisits * 100).toFixed(2) : 0;
            const skipRate = totalVisits > 0 ? (skippedVisits / totalVisits * 100).toFixed(2) : 0;
            
            // Resumen estadístico
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(10, 80, 190, 40, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("RESUMEN DE VISITAS", 15, 88);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de visitas programadas: ${totalVisits}`, 15, 95);
            doc.text(`Visitas completadas: ${completedVisits}`, 15, 102);
            doc.text(`Visitas omitidas: ${skippedVisits}`, 15, 109);
            doc.text(`Visitas pendientes: ${pendingVisits}`, 120, 95);
            doc.text(`Tasa de cumplimiento: ${completionRate}%`, 120, 102);
            doc.text(`Tasa de omisión: ${skipRate}%`, 120, 109);
            
            // Título de la tabla
            doc.setFontSize(11);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("DETALLE DE VISITAS POR SUCURSAL", 105, 130, { align: "center" });
            
            // Verificar que branches exista y tenga elementos
            if (!reportData.branches || reportData.branches.length === 0) {
                doc.setFontSize(11);
                doc.setTextColor(255, 0, 0);
                doc.text("No hay datos de sucursales disponibles", 105, 140, { align: "center" });
            } else {
                // Configuración de la tabla
                let yPosition = 140;
                const rowHeight = 10;
                
                // Definir anchos de columnas para mejor alineación
                const colWidths = {
                    sucursal: 60,
                    programadas: 30,
                    completadas: 30,
                    omitidas: 30,
                    estado: 30
                };
                
                // Posiciones X de las columnas (acumulativo)
                const colPos = {
                    sucursal: 10,
                    programadas: colWidths.sucursal + 10,
                    completadas: colWidths.sucursal + colWidths.programadas + 10,
                    omitidas: colWidths.sucursal + colWidths.programadas + colWidths.completadas + 10,
                    estado: colWidths.sucursal + colWidths.programadas + colWidths.completadas + colWidths.omitidas + 10
                };
                
                // Encabezados
                doc.setFontSize(10);
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setTextColor(255, 255, 255);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                
                // Rectángulo para encabezados
                doc.rect(10, yPosition, 190, rowHeight, 'F');
                
                // Textos de encabezados
                doc.text("Sucursal", colPos.sucursal + 5, yPosition + 7);
                doc.text("Programadas", colPos.programadas + 5, yPosition + 7);
                doc.text("Completadas", colPos.completadas + 5, yPosition + 7);
                doc.text("Omitidas", colPos.omitidas + 5, yPosition + 7);
                doc.text("Estado", colPos.estado + 5, yPosition + 7);
                
                yPosition += rowHeight;
                
                // Filas de datos
                doc.setTextColor(0, 0, 0);
                
                // Alternar colores para las filas
                let isAlternateRow = false;
                
                for (const branch of reportData.branches) {
                    // Fondo para filas alternas
                    if (isAlternateRow) {
                        doc.setFillColor(240, 240, 240);
                        doc.rect(10, yPosition, 190, rowHeight, 'F');
                    }
                    isAlternateRow = !isAlternateRow;
                    
                    // Datos de la sucursal
                    const branchName = branch.name || 'Sin nombre';
                    const scheduledVisits = branch.scheduledVisits || 0;
                    const completedVisits = branch.completedVisits || 0;
                    const skippedVisits = branch.skippedVisits || 0;
                    
                    // Textos centrados en sus columnas
                    doc.text(branchName.length > 20 ? branchName.substring(0, 17) + '...' : branchName, 
                             colPos.sucursal + 5, yPosition + 7);
                    doc.text(String(scheduledVisits), colPos.programadas + 15, yPosition + 7);
                    doc.text(String(completedVisits), colPos.completadas + 15, yPosition + 7);
                    doc.text(String(skippedVisits), colPos.omitidas + 15, yPosition + 7);
                    
                    // Estado (porcentaje de cumplimiento)
                    const completionRate = scheduledVisits > 0 
                        ? ((completedVisits / scheduledVisits) * 100).toFixed(0) 
                        : 0;
                    
                    // Color según el porcentaje
                    if (completionRate >= 80) {
                        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]); // Verde
                    } else if (completionRate >= 50) {
                        doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]); // Naranja
                    } else {
                        doc.setTextColor(redColor[0], redColor[1], redColor[2]); // Rojo
                    }
                    
                    doc.text(`${completionRate}%`, colPos.estado + 15, yPosition + 7);
                    doc.setTextColor(0, 0, 0); // Restaurar color
                    
                    yPosition += rowHeight;
                    
                    // Si llegamos al final de la página, crear una nueva
                    if (yPosition > 260) {
                        doc.addPage();
                        yPosition = 20;
                        
                        // Repetir encabezados en la nueva página
                        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                        doc.setTextColor(255, 255, 255);
                        doc.rect(10, yPosition, 190, rowHeight, 'F');
                        
                        doc.text("Sucursal", colPos.sucursal + 5, yPosition + 7);
                        doc.text("Programadas", colPos.programadas + 5, yPosition + 7);
                        doc.text("Completadas", colPos.completadas + 5, yPosition + 7);
                        doc.text("Omitidas", colPos.omitidas + 5, yPosition + 7);
                        doc.text("Estado", colPos.estado + 5, yPosition + 7);
                        
                        yPosition += rowHeight;
                        doc.setTextColor(0, 0, 0);
                        isAlternateRow = false;
                    }
                }
            }
            
            // Título para la sección de detalle
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("DETALLE DE VISITAS POR SUCURSAL Y FECHA", 105, 20, { align: "center" });

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(10, 25, 200, 25);

        // Verificar si existen detalles de visitas
        if (!reportData.branchVisitDetails || reportData.branchVisitDetails.length === 0) {
            doc.setFontSize(11);
            doc.setTextColor(255, 0, 0);
            doc.text("No hay detalles de visitas disponibles", 105, 40, { align: "center" });
        } else {
            let yPosition = 35;
            
            // Para cada sucursal
            for (const branchDetail of reportData.branchVisitDetails) {
                // Si no hay espacio suficiente para una nueva sucursal, crear nueva página
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Nombre de la sucursal como encabezado
                doc.setFillColor(220, 220, 220);
                doc.rect(10, yPosition, 190, 10, 'F');
                
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                const branchText = `${branchDetail.name} - ${branchDetail.address}`;
                // Dividir texto largo de la dirección
                if (branchText.length > 80) {
                    const lineas = doc.splitTextToSize(branchText, 180);
                    doc.text(lineas, 15, yPosition + 7);
                    // Ajustar altura según cantidad de líneas
                    yPosition += (lineas.length - 1) * 7;
                } else {
                    doc.text(branchText, 15, yPosition + 7);
                }
                
                yPosition += 15;
                
                // Si no hay visitas para esta sucursal
                if (!branchDetail.visits || branchDetail.visits.length === 0) {
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text("No hay visitas programadas para esta sucursal", 20, yPosition);
                    yPosition += 10;
                    continue;
                }
                
                // Encabezados de la tabla de visitas - Ajustados para mejor distribución
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setTextColor(255, 255, 255);
                doc.rect(20, yPosition, 170, 8, 'F');
                
                // Definir anchos de columnas para la tabla de visitas
                const visitColWidths = {
                    fecha: 40,
                    estado: 40, 
                    observaciones: 90
                };
                
                // Posiciones X de las columnas
                const visitColPos = {
                    fecha: 20,
                    estado: visitColWidths.fecha + 20,
                    observaciones: visitColWidths.fecha + visitColWidths.estado + 20
                };
                
                doc.setFontSize(9);
                doc.text("Fecha", visitColPos.fecha + 5, yPosition + 5.5);
                doc.text("Estado", visitColPos.estado + 5, yPosition + 5.5);
                doc.text("Observaciones", visitColPos.observaciones + 5, yPosition + 5.5);
                
                yPosition += 8;
                
                // Filas de visitas
                let isAlternateRow = false;
                
                for (const visit of branchDetail.visits) {
                    // Si no hay espacio para más filas, crear nueva página
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 20;
                        
                        // Repetir encabezado de sucursal
                        doc.setFillColor(220, 220, 220);
                        doc.rect(10, yPosition, 190, 10, 'F');
                        
                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                        doc.text(`${branchDetail.name} (continuación)`, 15, yPosition + 7);
                        
                        yPosition += 15;
                        
                        // Repetir encabezados de tabla
                        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                        doc.setTextColor(255, 255, 255);
                        doc.rect(20, yPosition, 170, 8, 'F');
                        
                        doc.setFontSize(9);
                        doc.text("Fecha", visitColPos.fecha + 5, yPosition + 5.5);
                        doc.text("Estado", visitColPos.estado + 5, yPosition + 5.5);
                        doc.text("Observaciones", visitColPos.observaciones + 5, yPosition + 5.5);
                        
                        yPosition += 8;
                        isAlternateRow = false;
                    }
                    
                    // Fondo para filas alternas
                    if (isAlternateRow) {
                        doc.setFillColor(240, 240, 240);
                        doc.rect(20, yPosition, 170, 8, 'F');
                    }
                    isAlternateRow = !isAlternateRow;
                    
                    // Formatear fecha
                    const visitDate = new Date(visit.date);
                    const formattedDate = visitDate.toLocaleDateString();
                    
                    // Datos de la visita
                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0);
                    doc.text(formattedDate, visitColPos.fecha + 5, yPosition + 5.5);
                    
                    // Estado con color - usando skipped del backend
                    if (visit.visited) {
                        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]); // Verde
                        doc.text("Visitada", visitColPos.estado + 5, yPosition + 5.5);
                    } else if (visit.skipped) {
                        doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]); // Naranja
                        doc.text("Omitida", visitColPos.estado + 5, yPosition + 5.5);
                    } else {
                        doc.setTextColor(redColor[0], redColor[1], redColor[2]); // Rojo
                        doc.text("No visitada", visitColPos.estado + 5, yPosition + 5.5);
                    }
                    
                    // Observaciones (truncadas si son muy largas)
                    doc.setTextColor(0, 0, 0);
                    const details = visit.details || 'Sin observaciones';
                    const truncatedDetails = details.length > 40 ? details.substring(0, 37) + '...' : details;
                    doc.text(truncatedDetails, visitColPos.observaciones + 5, yPosition + 5.5);
                    
                    yPosition += 8;
                }
                
                // Espacio entre sucursales
                yPosition += 10;
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
                doc.line(10, 280, 200, 280);
                
                // Texto de pie de página
                doc.setFontSize(8);
                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.text(`Arrow Connect - ${company?.name || 'Empresa'} - Reporte Mensual - ${new Date().toLocaleDateString()}`, 105, 287, { align: "center" });
                doc.text(`Página ${i} de ${totalPages}`, 190, 287, { align: "right" });
            }
            console.log("Pie de página agregado correctamente");
        } catch (pageErr) {
            console.error("Error agregando pie de página:", pageErr);
        }
        
        // Guardar el PDF
        const fileName = `Reporte_${company?.name || 'Empresa'}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
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

    const handleToggleEnabled = async () => {
        setIsToggling(true);
        try {
            const response = await apiClient.post("/admin/company/toggle-enabled", {
                id: companyId
            });
            
            setCompany(prev => ({ ...prev, enabled: response.data.enabled }));
            setSuccessMessage(response.data.message);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            setErrorMessage("Error al cambiar el estado de la empresa");
            setTimeout(() => setErrorMessage(""), 3000);
        } finally {
            setIsToggling(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                {/* Banner de estado de la empresa */}
                <div className="flex flex-col gap-4 mb-4">
                    {/* Banner de estado de la empresa */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                        company?.enabled ? 'bg-green-800/20' : 'bg-yellow-800/20'
                    }`}>
                        <span className={`text-sm ${
                            company?.enabled ? 'text-green-200' : 'text-yellow-200'
                        }`}>
                            {company?.enabled 
                                ? 'Empresa habilitada para el control de asistencia' 
                                : 'Empresa no habilitada para el control de asistencia'
                            }
                        </span>
                        <button
                            onClick={handleToggleEnabled}
                            disabled={isToggling}
                            className={`${
                                company?.enabled 
                                    ? 'bg-green-600/30 hover:bg-green-600/40' 
                                    : 'bg-yellow-600/30 hover:bg-yellow-600/40'
                            } text-white text-sm py-1 px-3 rounded-md flex items-center transition-colors`}>
                            {isToggling ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {company?.enabled ? 'Deshabilitando...' : 'Habilitando...'}
                                </>
                            ) : (
                                company?.enabled ? 'Deshabilitar' : 'Habilitar'
                            )}
                        </button>
                    </div>

                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <div className="flex justify-between items-start">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Gestión de Sucursales de {company?.name}
                        </h1>
                        <div className="flex items-center gap-3">
                            {company?.imagePath ? (
                                <div 
                                    onClick={() => company.starred && setIsImageUploadDialogOpen(true)}
                                    className={`relative ${company.starred ? 'cursor-pointer hover:opacity-80' : ''}`}
                                >
                                    <img 
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/${company.imagePath}`}
                                        alt="Logo empresa"
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                    {company.starred && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 rounded-full transition-all duration-200">
                                            <svg 
                                                className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                company?.starred && (
                                    <button
                                        onClick={() => setIsImageUploadDialogOpen(true)}
                                        className="h-8 w-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                                    >
                                        <svg 
                                            className="w-4 h-4 text-gray-400" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                )
                            )}
                            <button
                                onClick={handleToggleStarred}
                                className="text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
                                <svg 
                                    className={`h-6 w-6 ${company?.starred ? 'text-yellow-400' : 'text-gray-400'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between flex-wrap gap-2">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => openDialog()}
                                className="bg-primary text-white py-2 px-4 rounded-md mb-4 hover:bg-secondary">
                                Agregar Sucursal
                            </button>
                            <button
                                onClick={() => handleAssign()}
                                className="bg-primary text-white py-2 px-4 rounded-md mb-4 hover:bg-secondary">
                                Asignar Supervisores
                            </button>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={openReportDialog}
                                className="bg-green-600 text-white py-2 px-4 rounded-md mb-4 hover:bg-green-700 flex items-center">
                                <FaFilePdf className="mr-2" />
                                Reporte de supervisión
                            </button>
                            {company?.enabled && (
                                <button
                                    onClick={openAttendanceReportDialog}
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md mb-4 hover:bg-blue-700 flex items-center">
                                    <FaFilePdf className="mr-2" />
                                    Reporte de Asistencia
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            className="bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300 cursor-pointer transition duration-300 hover:bg-gray-700"
                            onClick={() => navigateToBranch(branch.id)}>
                            <h3 className="text-xl font-bold text-primary mb-2">
                                {branch.name}
                            </h3>
                            <p>{branch.address}</p>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDialog(branch);
                                    }}
                                    className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600"
                                    style={{ pointerEvents: "auto" }}>
                                    Editar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDelete(branch);
                                    }}
                                    className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                                    style={{ pointerEvents: "auto" }}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Transition appear show={isDialogOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={closeDialog}>
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
                                        {isEditMode
                                            ? "Editar Sucursal"
                                            : "Agregar Sucursal"}
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300"
                                                htmlFor="name">
                                                Nombre de la Sucursal
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={currentBranch.name}
                                                onChange={(e) =>
                                                    setCurrentBranch({
                                                        ...currentBranch,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300"
                                                htmlFor="address">
                                                Dirección
                                            </label>
                                            <Autocomplete
                                                apiKey={config.googleApiKey}
                                                onPlaceSelected={(place) => {
                                                    if (
                                                        place &&
                                                        place.geometry
                                                    ) {
                                                        const address =
                                                            place.formatted_address;
                                                        const latitude =
                                                            place.geometry.location.lat();
                                                        const longitude =
                                                            place.geometry.location.lng();

                                                        setCurrentBranch(
                                                            (prevBranch) => ({
                                                                ...prevBranch,
                                                                address,
                                                                latitude,
                                                                longitude,
                                                            })
                                                        );
                                                    } else {
                                                        console.error(
                                                            "No se pudo obtener la geolocalización del lugar seleccionado."
                                                        );
                                                    }
                                                }}
                                                options={{
                                                    types: ["address"],
                                                    componentRestrictions: {
                                                        country: "ar",
                                                    },
                                                }}
                                                defaultValue={
                                                    currentBranch.address
                                                }
                                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300"
                                                htmlFor="density">
                                                Densidad
                                            </label>
                                            <input
                                                type="number"
                                                id="density"
                                                value={currentBranch.density}
                                                onChange={(e) =>
                                                    setCurrentBranch({
                                                        ...currentBranch,
                                                        density: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300"
                                                htmlFor="frequency">
                                                Frecuencia
                                            </label>
                                            <input
                                                type="number"
                                                id="frequency"
                                                value={currentBranch.frequency}
                                                onChange={(e) =>
                                                    setCurrentBranch({
                                                        ...currentBranch,
                                                        frequency:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        {successMessage && (
                                            <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
                                                {successMessage}
                                            </div>
                                        )}
                                        {errorMessage && (
                                            <div className="bg-red-500 text-white px-4 py-2 rounded-md mb-4">
                                                {errorMessage}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={closeDialog}>
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-primary-dark"
                                            onClick={handleSave}>
                                            Guardar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isDeleteConfirmDialogOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={closeDeleteConfirmDialog}>
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
                                        Confirmar eliminación
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <p className="text-gray-300">
                                            ¿Estás seguro de que deseas eliminar
                                            la sucursal {branchToDelete?.name}?
                                        </p>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={closeDeleteConfirmDialog}>
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-red-600 text-white font-medium px-4 py-2 rounded-md hover:bg-red-500"
                                            onClick={handleDelete}>
                                            Eliminar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

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
                                        Generar Reporte de Visitas
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
                                                <p className="text-gray-300">Visitas programadas: {reportData.totalScheduled}</p>
                                                <p className="text-gray-300">Visitas completadas: {reportData.totalCompleted}</p>
                                                <p className="text-gray-300">
                                                    Tasa de cumplimiento: 
                                                    {reportData.totalScheduled > 0 
                                                        ? (reportData.totalCompleted / reportData.totalScheduled * 100).toFixed(2) 
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

            <Transition appear show={isAttendanceReportDialogOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={closeAttendanceReportDialog}>
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
                                        Generar Reporte de Asistencia
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300 mb-2"
                                                htmlFor="attendanceStartDate">
                                                Fecha de inicio
                                            </label>
                                            <div className="flex items-center">
                                                <FaCalendarAlt className="text-gray-400 mr-2" />
                                                <input
                                                    type="date"
                                                    id="attendanceStartDate"
                                                    value={attendanceStartDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setAttendanceStartDate(new Date(e.target.value))}
                                                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    max={attendanceEndDate.toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label
                                                className="block text-gray-300 mb-2"
                                                htmlFor="attendanceEndDate">
                                                Fecha de fin
                                            </label>
                                            <div className="flex items-center">
                                                <FaCalendarAlt className="text-gray-400 mr-2" />
                                                <input
                                                    type="date"
                                                    id="attendanceEndDate"
                                                    value={attendanceEndDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setAttendanceEndDate(new Date(e.target.value))}
                                                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    min={attendanceStartDate.toISOString().split('T')[0]}
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        
                                        {attendanceReportData && (
                                            <div className="mt-4 bg-gray-700 p-4 rounded-lg">
                                                <h4 className="text-white font-medium mb-2">Resumen</h4>
                                                <p className="text-gray-300">Total registros: {attendanceReportData.totalAttendances}</p>
                                                <p className="text-gray-300">Registros completos: {attendanceReportData.completedAttendances}</p>
                                                <p className="text-gray-300">Tasa de completitud: {attendanceReportData.completionRate}%</p>
                                                <p className="text-gray-300">Operadores: {attendanceReportData.operators?.length || 0}</p>
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
                                            onClick={closeAttendanceReportDialog}>
                                            Cancelar
                                        </button>
                                        {!attendanceReportData ? (
                                            <button
                                                className="bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-primary-dark flex items-center"
                                                onClick={generateAttendanceReportData}
                                                disabled={loadingAttendanceReport}>
                                                {loadingAttendanceReport ? (
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
                                                className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                                                onClick={generateAttendancePDF}>
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

            {/* Agregar el diálogo de subida de imagen */}
            <Transition appear show={isImageUploadDialogOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={() => setIsImageUploadDialogOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0">
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
                                        className="text-lg font-medium leading-6 text-white mb-4">
                                        Subir imagen de empresa destacada
                                    </Dialog.Title>
                                    
                                    <div className="mt-4">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-32 h-32 rounded-lg object-cover"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setSelectedImage(null);
                                                            setImagePreview(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span className="mt-2 text-sm text-gray-400">Seleccionar imagen</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => setSelectedImage(e.target.files[0])}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        {errorMessage && (
                                            <div className="mt-4 bg-red-500/20 text-red-400 px-4 py-2 rounded-md">
                                                {errorMessage}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={() => setIsImageUploadDialogOpen(false)}>
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleImageUpload}
                                            disabled={!selectedImage}>
                                            Subir imagen
                                        </button>
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
