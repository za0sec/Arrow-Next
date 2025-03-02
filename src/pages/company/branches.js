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
                <div className={`mb-4 flex items-center justify-between p-3 rounded-lg ${
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
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Gestión de Sucursales de {company?.name}
                    </h1>
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
                                Generar Reporte
                            </button>
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
        </div>
    );
}
