import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/router';
import apiClient from "@/utils/apiClient";
import DashboardNavbar from '@/components/DashboardNavbar';
import { debounce } from 'lodash';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCompany, setCurrentCompany] = useState({ 
        id: '', 
        name: '', 
        address: '', 
        latitude: '', 
        longitude: '',
        density: '', 
        frequency: '' 
    });
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [user, setUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const ITEMS_PER_PAGE = 12;

    const router = useRouter();

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

    const debouncedSearch = debounce((searchTerm) => {
        setSearch(searchTerm);
        setPage(1); // Reset a la primera página cuando se busca
        fetchCompanies(1, searchTerm);
    }, 300);

    const fetchCompanies = async (pageNum, searchTerm = search) => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/admin/companies/all', {
                params: {
                    page: pageNum,
                    limit: ITEMS_PER_PAGE,
                    search: searchTerm
                }
            });
            setCompanies(response.data.companies);
            setTotalPages(response.data.pages);
            setPage(response.data.currentPage);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies(page);
    }, []);

    const openDialog = (company = { id: '', name: '' }) => {
        setCurrentCompany(company);
        setIsEditMode(!!company.id);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setCurrentCompany({ id: '', name: '' });
    };

    const handleSave = async () => {
        try {
            if (!window.google || !window.google.maps) {
                throw new Error('Google Maps no está cargado correctamente');
            }

            const geocoder = new window.google.maps.Geocoder();
            const fullAddress = currentCompany.address;

            const result = await new Promise((resolve, reject) => {
                geocoder.geocode(
                    {
                        address: fullAddress,
                        componentRestrictions: {
                            country: 'AR'
                        }
                    },
                    (results, status) => {
                        if (status === 'OK' && results && results.length > 0) {
                            const isInArgentina = results[0].address_components.some(
                                component => 
                                    component.types.includes('country') && 
                                    component.short_name === 'AR'
                            );

                            if (isInArgentina) {
                                resolve(results[0]);
                            } else {
                                reject(new Error('La dirección debe estar en Argentina'));
                            }
                        } else {
                            reject(new Error(`No se pudo encontrar la dirección. Por favor, verifica que sea correcta.`));
                        }
                    }
                );
            });

            const payload = {
                ...currentCompany,
                address: result.formatted_address,
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng()
            };

            const url = isEditMode ? '/admin/company/update' : '/admin/company/add';
            await apiClient.post(url, payload);
            
            await fetchCompanies(page, search);
            closeDialog();
        } catch (error) {
            console.error('Error saving company:', error);
            alert(error.message || 'Error al guardar la empresa. Por favor verifica la dirección.');
        }
    };

    const confirmDelete = (company) => {
        setCompanyToDelete(company);
        setIsDeleteConfirmDialogOpen(true);
    };

    const handleDelete = async () => {
        try {
            await apiClient.post('/admin/company/delete', { id: companyToDelete.id });
            await fetchCompanies(page, search);
            closeDeleteConfirmDialog();
        } catch (error) {
            console.error('Error deleting company:', error);
        }
    };

    const closeDeleteConfirmDialog = () => {
        setIsDeleteConfirmDialogOpen(false);
        setCompanyToDelete(null);
    };

    const navigateToBranches = (companyId) => {
        router.push(`/company/branches?companyId=${companyId}`);
    };

    function handleAssign() {
        router.push(`/company/assignation`);
    }

    // Componente de paginación
    const Pagination = () => (
        <div className="flex justify-center mt-6 mb-8 space-x-2">
            <button
                onClick={() => fetchCompanies(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 rounded-md ${
                    page === 1 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-primary hover:bg-secondary'
                } text-white text-xl font-bold`}
                aria-label="Página anterior"
            >
                ←
            </button>
            <span className="px-4 py-2 text-white">
                Página {page} de {totalPages}
            </span>
            <button
                onClick={() => fetchCompanies(page + 1)}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-md ${
                    page === totalPages 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-primary hover:bg-secondary'
                } text-white text-xl font-bold`}
                aria-label="Página siguiente"
            >
                →
            </button>
        </div>
    );

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16 flex flex-col">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Gestión de Empresas
                    </h1>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex gap-4">
                            <button
                                onClick={() => openDialog()}
                                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary"
                            >
                                Agregar Empresa
                            </button>
                            <button
                                onClick={() => handleAssign()}
                                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary"
                            >
                                Asignar Supervisores
                            </button>
                        </div>
                        <div className="w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Buscar empresas..."
                                onChange={(e) => debouncedSearch(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                <Pagination />

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-white">Cargando...</div>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-center text-gray-300 mt-10">
                        No se encontraron empresas
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
                            {companies.map((company) => (
                                <div
                                    key={company.id}
                                    className="bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300 cursor-pointer transition duration-300 hover:bg-gray-700"
                                    onClick={() => navigateToBranches(company.id)}
                                >
                                    <h3 className="text-xl font-bold text-primary mb-2">
                                        {company.name}
                                    </h3>
                                    <div className="mt-4 flex space-x-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDialog(company);
                                            }}
                                            className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600"
                                            style={{pointerEvents: 'auto'}}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDelete(company);
                                            }}
                                            className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                                            style={{pointerEvents: 'auto'}}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <div className="flex-grow mt-auto"></div>
            </main>

            {/* Dialogo para agregar/editar empresas */}
            <Transition appear show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDialog}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50"/>
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
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel
                                    className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                                        {isEditMode ? 'Editar Empresa' : 'Agregar Empresa'}
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <div className="mb-4">
                                            <label className="block text-gray-300" htmlFor="name">
                                                Nombre de la Empresa
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={currentCompany.name}
                                                onChange={(e) => setCurrentCompany({ ...currentCompany, name: e.target.value })}
                                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={closeDialog}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-primary-dark"
                                            onClick={handleSave}
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Dialogo de confirmación de eliminación */}
            <Transition appear show={isDeleteConfirmDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDeleteConfirmDialog}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
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
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                                        Confirmar eliminación
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <p className="text-gray-300">
                                            ¿Estás seguro de que deseas eliminar la empresa {companyToDelete?.name}?
                                        </p>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={closeDeleteConfirmDialog}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-red-600 text-white font-medium px-4 py-2 rounded-md hover:bg-red-500"
                                            onClick={handleDelete}
                                        >
                                            Eliminar
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