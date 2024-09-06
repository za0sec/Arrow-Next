import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { Dialog, Transition } from '@headlessui/react';

import Cookies from 'js-cookie';
import crypto from "crypto";
import config from "@/pages/utils/config";
import apiClient from "@/pages/utils/apiClient";

export default function LoginModal({ isOpen, closeModal }) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiClient.post('/login', {
                email,
                password,
            });

            if (response.status === 200) {
                const { accessToken, refreshToken } = response.data;

                console.log("refresh obtenido del login: ", refreshToken);

                Cookies.set('accessToken', accessToken, { secure: true, sameSite: 'Strict' });
                Cookies.set('refreshToken', refreshToken, { secure: true, sameSite: 'Strict' });

                setSuccess('Inicio de sesión exitoso');
                setTimeout(() => {
                    closeModal();
                    router.push('/dashboard');
                }, 2000);
            } else {
                const errorData = response.data;
                setError(errorData.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            setError('Error de red. Inténtalo de nuevo.');
        }
    };

    const handleForgotPassword = () => {
        router.push('/forgot-password');
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-1500"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-1500"
                    leaveFrom="opacity-100 scale-150"
                    leaveTo="opacity-0 scale-95"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-75" />
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
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-primary"
                                >
                                    Inicio de Sesión
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="mt-4">
                                    <div className="mb-4">
                                        <input
                                            type="email"
                                            placeholder="Correo Electrónico"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-primary focus:ring-primary focus:ring-1"
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <input
                                            type="password"
                                            placeholder="Contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-primary focus:ring-primary focus:ring-1"
                                            required
                                        />
                                    </div>
                                    {error && <p className="text-red-500 mb-4">{error}</p>}
                                    {success && <p className="text-green-500 mb-4">{success}</p>}
                                    <button
                                        type="submit"
                                        className="w-full bg-primary text-white font-medium px-4 py-2 rounded-md hover:bg-primary-dark"
                                    >
                                        Iniciar Sesión
                                    </button>
                                </form>
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={handleForgotPassword}
                                        className="text-sm text-gray-300 hover:underline"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
