import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/router';
import Cookies from "js-cookie";
import { authenticate, fetchWithToken } from "@/pages/utils/auth";
import DashboardNavbar from "@/pages/components/DashboardNavbar";
import config from "@/pages/utils/config";
import apiClient from "@/pages/utils/apiClient";

export default function SupervisorsPage() {
    const [supervisors, setSupervisors] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSupervisor, setCurrentSupervisor] = useState({ id: '', email: '', firstName: '', lastName: '', zone: '' });
    const [supervisorToDelete, setSupervisorToDelete] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                router.push('/');  // Redirigir en caso de error
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        const fetchSupervisors = async () => {
            try {
                const response = await apiClient.get('/admin/supervisors/all');
                const data = response.data;
                setSupervisors(data);
            } catch (error) {
                console.error('Error fetching supervisors:', error);
            }
        };

        fetchSupervisors();
    }, []);

    const openDialog = (supervisor = { id: '', email: '', firstName: '', lastName: '', zone: '' }) => {
        setCurrentSupervisor(supervisor);
        setIsEditMode(!!supervisor.id);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setCurrentSupervisor({ id: '', email: '', firstName: '', lastName: '', zone: '' });
    };

    const handleSave = async () => {
        const url = isEditMode ? '/admin/supervisor/update' : '/admin/supervisor/add';
        const method = 'POST';
        const payload = isEditMode
            ? {
                id: currentSupervisor.id,
                firstName: currentSupervisor.firstName,
                lastName: currentSupervisor.lastName,
                zone: currentSupervisor.zone,
            }
            : {
                email: currentSupervisor.email,
                firstName: currentSupervisor.firstName,
                lastName: currentSupervisor.lastName,
                zone: currentSupervisor.zone,
            };

        try {
            await apiClient({
                method,
                url,
                data: payload,
            });

            const response = await apiClient.get('/admin/supervisors/all');
            const data = response.data;
            setSupervisors(data);

            closeDialog();
        } catch (error) {
            console.error('Error saving supervisor:', error);
        }
    };

    const confirmDelete = (supervisor) => {
        setSupervisorToDelete(supervisor);
        setIsDeleteConfirmDialogOpen(true);
    };

    const handleDelete = async () => {
        try {
            await apiClient.post('/admin/supervisor/delete', {
                id: supervisorToDelete.id,
            });

            const response = await apiClient.get('/admin/supervisors/all');
            const data = response.data;
            setSupervisors(data);

            closeDeleteConfirmDialog();
        } catch (error) {
            console.error('Error deleting supervisor:', error);
        }
    };

    const closeDeleteConfirmDialog = () => {
        setIsDeleteConfirmDialogOpen(false);
        setSupervisorToDelete(null);
    };

    const navigateToSupervisor = (supervisorId) => {
        router.push(`/supervisors/supervisor?supervisorId=${supervisorId}`);
    };


    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <div className="flex-grow container mx-auto p-6">
                <h1 className="text-4xl text-white font-bold mb-8">Supervisores</h1>
                <button
                    onClick={() => openDialog()}
                    className="bg-primary text-white py-3 px-6 rounded-lg shadow-lg mb-8 hover:bg-secondary transition-colors"
                >
                    Agregar Supervisor
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {supervisors.map((supervisor) => (
                        <div
                            key={supervisor.id}
                            className="bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300 cursor-pointer transition duration-300 hover:bg-gray-700"
                            onClick={() => navigateToSupervisor(supervisor.id)}
                        >
                            <h2 className="text-2xl text-white mb-3 font-semibold">
                                {supervisor.firstName} {supervisor.lastName}
                            </h2>
                            <p className="text-gray-400 mb-2">{supervisor.email}</p>
                            <p className="text-gray-400">Zona: {supervisor.zone}</p>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();  // Detener la propagación del evento onClick
                                        openDialog(supervisor);
                                    }}
                                    className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();  // Detener la propagación del evento onClick
                                        confirmDelete(supervisor);
                                    }}
                                    className="bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
                                        {isEditMode ? 'Editar Supervisor' : 'Agregar Supervisor'}
                                    </Dialog.Title>
                                    <div className="mt-4 space-y-4">
                                        {!isEditMode && (
                                            <div>
                                                <label className="block text-gray-300" htmlFor="email">
                                                    Correo Electrónico
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    value={currentSupervisor.email}
                                                    onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, email: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    required
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-gray-300" htmlFor="firstName">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                value={currentSupervisor.firstName}
                                                onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, firstName: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300" htmlFor="lastName">
                                                Apellido
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                value={currentSupervisor.lastName}
                                                onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, lastName: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-300" htmlFor="zone">
                                                Zona
                                            </label>
                                            <input
                                                type="text"
                                                id="zone"
                                                value={currentSupervisor.zone}
                                                onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, zone: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-500"
                                            onClick={closeDialog}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-primary text-white font-medium px-4 py-2 rounded-lg hover:bg-primary-dark"
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
                                        Confirmar Eliminación
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <p className="text-gray-300">
                                            ¿Estás seguro de que deseas eliminar al supervisor{' '}
                                            <span className="font-bold text-white">{supervisorToDelete?.firstName} {supervisorToDelete?.lastName}</span>?
                                        </p>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-500"
                                            onClick={closeDeleteConfirmDialog}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-red-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-red-700"
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