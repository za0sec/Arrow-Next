import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaPlus, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import apiClient from '@/utils/apiClient';
import DashboardNavbar from '../components/DashboardNavbar';
import { useRouter } from 'next/router';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            await axios.post('/admin/reports/setSeen', { id });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedReport) {
                await axios.put(`/admin/reports/${selectedReport.id}`, selectedReport);
            } else {
                await axios.post('/admin/reports', selectedReport);
            }
            setIsModalOpen(false);
            fetchReports();
        } catch (error) {
            console.error('Error submitting report:', error);
        }
    };

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
                    {loading ? (
                        <p className="text-center text-white">Cargando reportes...</p>
                    ) : (
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
                                                        onClick={() => handleApprove(report.id)}
                                                        className="p-2"
                                                    >
                                                        <FaCheck className="text-primary hover:text-secondary" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(report.id)}
                                                        className="p-2"
                                                    >
                                                        <FaTrash className="text-red-500 hover:text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gray-800 p-6 rounded-lg w-1/2"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">{selectedReport ? 'Editar Reporte' : 'Nuevo Reporte'}</h2>
                        <form onSubmit={handleSubmit}>
                            {/* Aquí irían los campos del formulario */}
                            <div className="flex justify-end mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Guardar</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Reports;
