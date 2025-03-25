import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardNavbar from '@/components/DashboardNavbar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import apiClient from "@/utils/apiClient";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function AttendancePage() {
    const router = useRouter();
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                if (response.status === 200) {
                    const userData = response.data;
                    setUser(userData);
                } else if (response.status === 401) {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error en autenticación:', error);
                router.push('/');
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        fetchCompanies();
        fetchBranches();
    }, [currentPage, search, selectedCompany]);

    const fetchCompanies = async () => {
        try {
            const response = await apiClient.get('/admin/companies/all');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                search
            };
            
            if (selectedCompany) {
                params.companyId = selectedCompany;
            }

            const response = await apiClient.get('/branches/getAllAttendance', { params });
            setBranches(response.data.data);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
        setLoading(false);
    };

    const goToPage = (page) => {
        setCurrentPage(page);
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtonsToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

        if (endPage - startPage + 1 < maxButtonsToShow) {
            startPage = Math.max(1, endPage - maxButtonsToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`px-3 py-1 mx-1 rounded-md ${
                        currentPage === i
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <DashboardNavbar user={user} />
            
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-white">Control de Asistencia Global</h1>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <div className="relative w-full sm:w-96">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por sucursal, empresa o dirección..."
                                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" />
                                </div>
                            </div>
                            <div className="w-full sm:w-64">
                                <select
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                >
                                    <option value="">Todas las empresas</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700 bg-gray-800 rounded-lg overflow-hidden">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white">
                                            Empresa
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                                            Sucursal
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                                            Dirección
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                                            Estado
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                                            Operarios Presentes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {branches.length > 0 ? (
                                        branches.map((branch) => (
                                            <tr key={branch.id} className="hover:bg-gray-700 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-200">
                                                    {branch.companyName}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-200">
                                                    {branch.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-200">
                                                    {branch.address}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                            branch.hasAttendance
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {branch.hasAttendance ? 'Activo' : 'Sin operarios'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-200">
                                                    {branch.hasAttendance ? (
                                                        <ul>
                                                            {branch.operatorNames.map((name, idx) => (
                                                                <li key={idx} className="flex items-center space-x-2">
                                                                    <span>• {name}</span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {format(new Date(branch.lastCheckIns[idx]), 'HH:mm', { locale: es })}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-4 text-sm text-center text-gray-400">
                                                No se encontraron resultados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Paginación */}
                    {!loading && totalPages > 0 && (
                        <div className="mt-6 flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-md bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition-colors"
                                >
                                    <FaChevronLeft className="h-4 w-4" />
                                </button>
                                
                                <div className="flex items-center">
                                    {renderPaginationButtons()}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-md bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition-colors"
                                >
                                    <FaChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
} 