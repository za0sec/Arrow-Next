import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/router';
import apiClient from "@/pages/utils/apiClient";
import DashboardNavbar from '@/pages/components/DashboardNavbar';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCompany, setCurrentCompany] = useState({ id: '', name: '', address: '', density: '', frequency: '' });
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [user, setUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await apiClient.get('/admin/companies/all');
                setCompanies(response.data);
            } catch (error) {
                console.error('Error fetching companies:', error);
            }
        };

        fetchCompanies();
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
        const url = isEditMode ? '/admin/company/update' : '/admin/company/add';
        const payload = isEditMode
            ? { id: currentCompany.id, name: currentCompany.name }
            : { name: currentCompany.name };

        try {
            await apiClient.post(url, payload);
            const response = await apiClient.get('/admin/companies/all');
            setCompanies(response.data);
            closeDialog();
        } catch (error) {
            console.error('Error saving company:', error);
        }
    };

    const confirmDelete = (company) => {
        setCompanyToDelete(company);
        setIsDeleteConfirmDialogOpen(true);
    };

    const handleDelete = async () => {
        try {
            await apiClient.post('/admin/company/delete', { id: companyToDelete.id });
            const response = await apiClient.get('/admin/companies/all');
            setCompanies(response.data);
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

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Gestión de Empresas
                    </h1>
                    <div className="flex justify-between">
                        <button
                            onClick={() => openDialog()}
                            className="bg-primary text-white py-2 px-4 rounded-md mb-4 hover:bg-secondary"
                        >
                            Agregar Empresa
                        </button>
                        <button
                            onClick={() => handleAssign()}
                            className="bg-primary text-white py-2 px-4 rounded-md mb-4 hover:bg-secondary"
                        >
                            Asignar Supervisores
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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