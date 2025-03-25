import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import apiClient from "@/utils/apiClient";
import DashboardNavbar from '@/components/DashboardNavbar';

export default function UsersPage() {
    const [administrators, setAdministrators] = useState([]);
    const [hrStaff, setHrStaff] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHrDialogOpen, setIsHrDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [currentAdmin, setCurrentAdmin] = useState({ 
        firstName: '', 
        lastName: '', 
        email: '',
        subscribed_to_email: false
    });
    const [currentHr, setCurrentHr] = useState({ 
        firstName: '', 
        lastName: '', 
        email: ''
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('');

    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                if (response.status === 200) {
                    const userData = response.data;
                    if (!userData.isRoot) {
                        router.push('/dashboard');
                        return;
                    }
                    setUser(userData);
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
                const response = await apiClient.get('/root/administrators');
                setAdministrators(response.data);
            } catch (error) {
                console.error('Error fetching administrators:', error);
                if (error.response?.status === 403) {
                    router.push('/dashboard');
                }
            }
        };

        if (user?.isRoot) {
            fetchAdministrators();
        }
    }, [user]);

    useEffect(() => {
        const fetchHrStaff = async () => {
            try {
                const response = await apiClient.get('/root/rrhh');
                setHrStaff(response.data);
            } catch (error) {
                console.error('Error fetching HR staff:', error);
                if (error.response?.status === 403) {
                    router.push('/dashboard');
                }
            }
        };

        if (user?.isRoot) {
            fetchHrStaff();
        }
    }, [user]);

    const openDialog = () => {
        setCurrentAdmin({ firstName: '', lastName: '', email: '', subscribed_to_email: false });
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
    };

    const handleSave = async () => {
        try {
            await apiClient.post('/root/administrators/add', {
                firstName: currentAdmin.firstName,
                lastName: currentAdmin.lastName,
                email: currentAdmin.email,
                password: generateRandomPassword(),
                subscribed_to_email: currentAdmin.subscribed_to_email
            });
            
            const response = await apiClient.get('/root/administrators');
            setAdministrators(response.data);
            closeDialog();
        } catch (error) {
            console.error('Error saving administrator:', error);
            if (error.response?.data) {
                alert(error.response.data);
            } else {
                alert('Error al guardar el administrador');
            }
        }
    };

    const generateRandomPassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    };

    const openTransferDialog = (admin) => {
        setSelectedAdmin(admin);
        setIsTransferDialogOpen(true);
    };

    const closeTransferDialog = () => {
        setIsTransferDialogOpen(false);
        setSelectedAdmin(null);
    };

    const handleTransferRoot = async () => {
        if (!selectedAdmin) return;
        
        try {
            await apiClient.post('/root/transfer', { userId: selectedAdmin.id });
            alert('Privilegios de root transferidos exitosamente');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error transferring root:', error);
            alert(error.response?.data || 'Error al transferir privilegios de root');
        }
    };

    const openDeleteDialog = (admin) => {
        setUserToDelete(admin);
        setDeleteType('admin');
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleDelete = async () => {
        try {
            await apiClient.delete(`/root/${deleteType}/${userToDelete.id}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const response = await apiClient.get(`/root/${deleteType}`);
            if (deleteType === 'administrators') {
                setAdministrators(response.data);
            } else if (deleteType === 'rrhh') {
                setHrStaff(response.data);
            }
            closeDeleteDialog();
        } catch (error) {
            console.error(`Error deleting ${deleteType}:`, error);
            alert(error.response?.data || `Error al eliminar el ${deleteType}`);
        }
    };

    const openHrDialog = () => {
        setCurrentHr({ firstName: '', lastName: '', email: '' });
        setIsHrDialogOpen(true);
    };

    const closeHrDialog = () => {
        setIsHrDialogOpen(false);
    };

    const handleSaveHr = async () => {
        try {
            await apiClient.post('/root/rrhh/register', {
                firstName: currentHr.firstName,
                lastName: currentHr.lastName,
                email: currentHr.email,
                password: generateRandomPassword()
            });
            
            const response = await apiClient.get('/root/rrhh');
            setHrStaff(response.data);
            closeHrDialog();
        } catch (error) {
            console.error('Error saving RRHH:', error);
            if (error.response?.data) {
                alert(error.response.data);
            } else {
                alert('Error al guardar el personal de RRHH');
            }
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

                    <div className="bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Acciones
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => openTransferDialog(admin)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary transition-colors duration-200"
                                                >
                                                    Delegar Privilegios
                                                </button>
                                                <button
                                                    onClick={() => openDeleteDialog(admin)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                >
                                                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="border-t border-gray-700 my-8"></div>

                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Recursos Humanos</h1>
                        <button
                            onClick={openHrDialog}
                            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            Agregar RRHH
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
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {hrStaff.map((hr) => (
                                    <tr key={hr.employeeId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {`${hr.employee.user.firstName} ${hr.employee.user.lastName}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {hr.employee.user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                                            <button
                                                onClick={() => {
                                                    setUserToDelete(hr.employee.user);
                                                    setDeleteType('rrhh');
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                            >
                                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                            </button>
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
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={currentAdmin.subscribed_to_email}
                                                    onChange={(e) => setCurrentAdmin({ ...currentAdmin, subscribed_to_email: e.target.checked })}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded"
                                                />
                                                <label className="ml-2 block text-sm text-gray-300">
                                                    Suscribir a notificaciones por email
                                                </label>
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

            <Transition appear show={isTransferDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeTransferDialog}>
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                                    Transferir Privilegios Root
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-gray-300">
                                        ¿Estás seguro de que deseas transferir tus privilegios de root a {selectedAdmin?.firstName} {selectedAdmin?.lastName}?
                                    </p>
                                    <p className="text-red-400 mt-2">
                                        ⚠️ Esta acción no se puede deshacer y perderás tus privilegios de root.
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                                        onClick={closeTransferDialog}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                        onClick={handleTransferRoot}
                                    >
                                        Transferir
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isDeleteDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDeleteDialog}>
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                                    Eliminar Administrador
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-gray-300">
                                        ¿Estás seguro de que deseas eliminar a {userToDelete?.firstName} {userToDelete?.lastName}?
                                    </p>
                                    <p className="text-red-400 mt-2">
                                        ⚠️ Esta acción no se puede deshacer.
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                                        onClick={closeDeleteDialog}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                        onClick={handleDelete}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isHrDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeHrDialog}>
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                                    Agregar Personal de RRHH
                                </Dialog.Title>
                                <div className="mt-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                value={currentHr.firstName}
                                                onChange={(e) => setCurrentHr({ ...currentHr, firstName: e.target.value })}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300">
                                                Apellido
                                            </label>
                                            <input
                                                type="text"
                                                value={currentHr.lastName}
                                                onChange={(e) => setCurrentHr({ ...currentHr, lastName: e.target.value })}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={currentHr.email}
                                                onChange={(e) => setCurrentHr({ ...currentHr, email: e.target.value })}
                                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                                        onClick={closeHrDialog}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                                        onClick={handleSaveHr}
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}