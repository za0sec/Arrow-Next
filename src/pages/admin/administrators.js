import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/router';
import apiClient from "@/utils/apiClient";
import DashboardNavbar from '@/components/DashboardNavbar';

export default function AdministratorsPage() {
    const [administrators, setAdministrators] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState({ 
        firstName: '', 
        lastName: '', 
        email: '',
        password: ''
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                if (response.status === 200) {
                    if (!response.data.isRoot) {
                        router.push('/dashboard');
                        return;
                    }
                    setUser(response.data);
                } else if (response.status === 401) {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error en autenticación:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        const fetchAdministrators = async () => {
            try {
                const response = await apiClient.get('/admin/administrators');
                setAdministrators(response.data);
            } catch (error) {
                console.error('Error fetching administrators:', error);
            }
        };

        if (user?.isRoot) {
            fetchAdministrators();
        }
    }, [user]);

    const openDialog = () => {
        setCurrentAdmin({ firstName: '', lastName: '', email: '', password: '' });
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
    };

    const handleSave = async () => {
        try {
            await apiClient.post('/admin/administrators/add', currentAdmin);
            const response = await apiClient.get('/admin/administrators');
            setAdministrators(response.data);
            closeDialog();
        } catch (error) {
            console.error('Error saving administrator:', error);
            alert('Error al guardar el administrador');
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <DashboardNavbar user={user} />
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Administradores</h1>
                        <button
                            onClick={openDialog}
                            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            Agregar Administrador
                        </button>
                    </div>

                    <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {administrators.map((admin) => (
                                    <tr key={admin.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {`${admin.firstName} ${admin.lastName}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {admin.email}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Transition appear show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDialog}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
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
                                        Agregar Administrador
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300">
                                                    Nombre
                                                </label>
                                                <input
                                                    type="text"
                                                    value={currentAdmin.firstName}
                                                    onChange={(e) => setCurrentAdmin({ ...currentAdmin, firstName: e.target.value })}
                                                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300">
                                                    Apellido
                                                </label>
                                                <input
                                                    type="text"
                                                    value={currentAdmin.lastName}
                                                    onChange={(e) => setCurrentAdmin({ ...currentAdmin, lastName: e.target.value })}
                                                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={currentAdmin.email}
                                                    onChange={(e) => setCurrentAdmin({ ...currentAdmin, email: e.target.value })}
                                                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300">
                                                    Contraseña
                                                </label>
                                                <input
                                                    type="password"
                                                    value={currentAdmin.password}
                                                    onChange={(e) => setCurrentAdmin({ ...currentAdmin, password: e.target.value })}
                                                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                                            onClick={closeDialog}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
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
        </div>
    );
} 