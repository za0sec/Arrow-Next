import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaPlus, FaCheck, FaEraser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import apiClient from '@/utils/apiClient';
import DashboardNavbar from '../components/DashboardNavbar';
import { useRouter } from 'next/router';
import LoadingSpinner from "@/components/LoadingSpinner";
import SignatureCanvas from 'react-signature-canvas';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [signatureData, setSignatureData] = useState(null);
    const [isApproving, setIsApproving] = useState(false);
    const [signatureRef, setSignatureRef] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchReports();
    }, [page, searchTerm, startDate, endDate, user]);

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

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/admin/reports/fetchReports`, {
                params: {
                    page,
                    limit,
                    search: searchTerm,
                    startDate: startDate?.toISOString(),
                    endDate: endDate?.toISOString()
                }
            });
            setReports(response.data.data);
            setTotalPages(Math.ceil(response.data.total / limit));
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const toggleSeenStatus = async (id, currentStatus) => {
        try {
            await apiClient.post('/admin/report/setSeen', { id });
            setReports(reports.map(report =>
                report.id === id ? { ...report, isSeen: !currentStatus } : report
            ));
        } catch (error) {
            console.error('Error toggling seen status:', error);
        }
    };

    const handleApprove = (report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const clearSignature = () => {
        if (signatureRef) {
            signatureRef.clear();
        }
    };

    const handleSubmitApproval = async (e) => {
        e.preventDefault();
        
        if (!signatureRef || signatureRef.isEmpty()) {
            alert('Por favor, firme para aprobar el reporte');
            return;
        }
        
        try {
            setIsApproving(true);
            
            const signatureDataURL = signatureRef.toDataURL('image/png');
            const signatureBlob = await (await fetch(signatureDataURL)).blob();
            
            const formData = new FormData();
            formData.append('id', selectedReport.branch.id);
            formData.append('date', new Date().toISOString().split('T')[0]);
            formData.append('report', selectedReport.report);
            formData.append('name', `${user.firstName} ${user.lastName}`);
            formData.append('reportId', selectedReport.id);
            formData.append('firma', new File([signatureBlob], 'signature.png', { type: 'image/png' }));
            
            const response = await apiClient.post('/admin/report/agreeReport', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.status === 200) {
                alert('Reporte aprobado correctamente');
                fetchReports(); // Recargar los reportes
            }
        } catch (error) {
            console.error('Error approving report:', error);
            alert('Error al aprobar el reporte');
        } finally {
            setIsApproving(false);
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
            try {
                await axios.delete(`/admin/reports/${id}`);
                setReports(reports.filter(report => report.id !== id));
            } catch (error) {
                console.error('Error deleting report:', error);
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col overflow-auto">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4">Gestión de Reportes</h1>
                    <div className="flex justify-between items-center mb-6">
                        <input
                            type="text"
                            placeholder="Buscar reportes..."
                            className="bg-gray-700 text-white p-2 rounded-md w-1/3"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="flex space-x-4">
                            <DatePicker
                                selected={startDate}
                                onChange={date => setStartDate(date)}
                                placeholderText="Fecha inicial"
                                className="bg-gray-700 text-white p-2 rounded-md"
                            />
                            <DatePicker
                                selected={endDate}
                                onChange={date => setEndDate(date)}
                                placeholderText="Fecha final"
                                className="bg-gray-700 text-white p-2 rounded-md"
                            />
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                            <thead className="bg-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sucursal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Supervisor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reporte</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-600">
                                {reports.map((report) => (
                                    <motion.tr
                                        key={report.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="hover:bg-gray-600"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            {!report.isSeen && <FaEye className="text-blue-500" />}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{new Date(report.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{report.branch.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{`${report.supervisor.employee.user.firstName} ${report.supervisor.employee.user.lastName}`}</td>
                                        <td className="px-6 py-4 text-gray-300">{report.report}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleApprove(report)}
                                                    className="p-2 tooltip-container"
                                                    title="Aprobar y marcar como omitida"
                                                >
                                                    <FaCheck className="text-primary hover:text-secondary" />
                                                    <span className="tooltip">Aprobar y marcar como omitida</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(report.id)}
                                                    className="p-2 tooltip-container"
                                                    title="Eliminar reporte"
                                                >
                                                    <FaTrash className="text-red-500 hover:text-red-600" />
                                                    <span className="tooltip">Eliminar reporte</span>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                    <div className="mt-4 flex justify-center">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`mx-1 px-3 py-1 rounded ${pageNum === page ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300 hover:bg-secondary'}`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {isModalOpen && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gray-800 p-6 rounded-lg w-1/2 max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">Aprobar Reporte</h2>
                        <div className="mb-4">
                            <p className="text-white mb-2"><span className="font-bold">Sucursal:</span> {selectedReport.branch.name}</p>
                            <p className="text-white mb-2"><span className="font-bold">Supervisor:</span> {`${selectedReport.supervisor.employee.user.firstName} ${selectedReport.supervisor.employee.user.lastName}`}</p>
                            <p className="text-white mb-2"><span className="font-bold">Fecha:</span> {new Date(selectedReport.date).toLocaleString()}</p>
                            <div className="bg-gray-700 p-3 rounded-md mt-2">
                                <p className="text-white mb-1 font-bold">Reporte:</p>
                                <p className="text-gray-300">{selectedReport.report}</p>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-white mb-2 font-bold">Firma para aprobar:</p>
                            <div className="bg-white rounded-md overflow-hidden">
                                <SignatureCanvas
                                    ref={(ref) => setSignatureRef(ref)}
                                    canvasProps={{
                                        width: 500,
                                        height: 200,
                                        className: 'signature-canvas'
                                    }}
                                />
                            </div>
                            <button 
                                onClick={clearSignature}
                                className="mt-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                            >
                                <FaEraser className="mr-1" /> Limpiar firma
                            </button>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className="mr-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                disabled={isApproving}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSubmitApproval} 
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary flex items-center"
                                disabled={isApproving}
                            >
                                {isApproving ? 'Procesando...' : (
                                    <>
                                        <FaCheck className="mr-1" /> Aprobar
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Reports;

// Estilos para los tooltips
const styles = `
.tooltip-container {
    position: relative;
}

.tooltip {
    visibility: hidden;
    width: 200px;
    background-color: #333;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -100px;
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 12px;
}

.tooltip-container:hover .tooltip {
    visibility: visible;
    opacity: 1;
}
`;

// Añadir estilos al documento
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}
