import { useState, Fragment } from 'react';
import {Popover, Transition, Dialog, Menu, Button} from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Cookies from "js-cookie";
import { useRouter } from 'next/router';


const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Supervisores', href: '/supervisors' },
    { name: 'Empresas', href: '/company' },
    { name: 'Help', href: '/help' },
];

export default function DashboardNavbar({ user }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleLogout = () => {
        const allCookies = Cookies.get();

        Object.keys(allCookies).forEach(cookieName => {
            Cookies.remove(cookieName);
        });

        window.location.href = '/';
    };

    const handlePassword = async () => {
        window.location.href = `/change-password`;
    };

    return (
        <>
            <Popover>
                <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
                    <nav className="relative flex items-center justify-between sm:h-10 lg:justify-start" aria-label="Global">
                        <div className="flex items-center justify-start space-x-4 lg:flex-grow">
                            <img className="h-8 w-auto" src="/images/logo-arrow.png" alt="Icono"/>
                            <div className="hidden md:flex md:space-x-8">
                                {navigation.map((item) => (
                                    <Link key={item.name} href={item.href}>
                                        <span className={`relative font-medium ${router.pathname.startsWith(item.href) ? 'text-white' : 'text-gray-300'} text-gray-300 hover:text-white underline-animation`}>
                                            {item.name}
                                            <span
                                                className={`absolute -bottom-2.5 left-0 w-full h-0.5 bg-white transform scale-x-0 transition-transform duration-300 ease-out origin-left ${
                                                    router.pathname.startsWith(item.href) ? 'scale-x-100' : 'hover:scale-x-100'
                                                }`}
                                            ></span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:flex md:items-center md:space-x-4 ml-auto">
                            {/* Menú desplegable */}
                            <Menu as="div" className="relative">
                                <div>
                                    <Menu.Button
                                        className="flex items-center text-white bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                        <span>{`${user.firstName} ${user.lastName}`}</span>
                                        <ChevronDownIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                    </Menu.Button>
                                </div>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-gray-800 divide-y divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link href="/profile">
                                                        <span className={`block px-4 py-2 text-sm ${active ? 'bg-gray-700 text-white' : 'text-gray-300'}`}>
                                                            Mi Perfil
                                                        </span>
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Button onClick={handlePassword}>
                                                        <span className={`block px-4 py-2 text-sm ${active ? 'bg-gray-700 text-white' : 'text-gray-300'}`}>
                                                            Cambiar Contraseña
                                                        </span>
                                                    </Button>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
                                                        onClick={openModal}
                                                    >
                                                        Cerrar Sesión
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>

                        <div className="-mr-2 flex items-center md:hidden">
                            <Popover.Button className="bg-gray-900 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            </Popover.Button>
                        </div>
                    </nav>
                </div>

                <Transition
                    as={Fragment}
                    enter="duration-150 ease-out"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="duration-100 ease-in"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <Popover.Panel focus className="fixed inset-0 z-50 p-2 transition transform origin-top-right md:hidden">
                        <div className="rounded-lg shadow-md bg-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden">
                            <div className="px-5 pt-4 flex items-center justify-between">
                                <div>
                                    <img className="h-8 w-auto" src="/images/logo-arrow.png" alt="" />
                                </div>
                                <div className="-mr-2">
                                    <Popover.Button className="bg-gray-900 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                        <span className="sr-only">Close main menu</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </Popover.Button>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                {navigation.map((item) => (
                                    <Link key={item.name} href={item.href}>
                                        <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                                            {item.name}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </Popover.Panel>
                </Transition>
            </Popover>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                                        Confirmación de Cierre de Sesión
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <p className="text-gray-300">¿Estás seguro de que deseas cerrar sesión?</p>
                                    </div>
                                    <div className="mt-6 flex justify-end space-x-4">
                                        <button
                                            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-500"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-red-600 text-white font-medium px-4 py-2 rounded-md hover:bg-red-700"
                                            onClick={handleLogout}
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}