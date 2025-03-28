import { useState, Fragment, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Dialog, Transition } from '@headlessui/react';

import Cookies from 'js-cookie';
import apiClient from "@/utils/apiClient";
import PasswordInput from './PasswordInput';

export default function LoginModal({ isOpen, closeModal }) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) setEmail(savedEmail);
    }, []);

    const saveTokens = (accessToken, refreshToken, role) => {
        try {
            // Guardamos en localStorage como respaldo
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('userRole', role);

            // Intentamos guardar en cookies
            document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=Strict`;
            document.cookie = `accessToken=${accessToken}; path=/; max-age=${24 * 60 * 60}; secure; samesite=Strict`;

            console.log('Tokens guardados:', {
                refresh: Cookies.get('refreshToken'),
                access: Cookies.get('accessToken'),
                localRefresh: localStorage.getItem('refreshToken')
            });
        } catch (error) {
            console.error('Error guardando tokens:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiClient.post('/login', {
                email,
                password,
            });

            if (response.status === 200) {
                const { accessToken, refreshToken, role } = response.data;

                if (role !== 'administrator' && role !== 'rrhh') {
                    setError('No tienes permisos para acceder al sistema');
                    return;
                }

                // Usar la nueva función para guardar tokens
                saveTokens(accessToken, refreshToken, role);
                localStorage.setItem('savedEmail', email);

                setSuccess('Inicio de sesión exitoso');
                
                const targetRoute = role === 'rrhh' ? '/rrhh/dni-management' : '/dashboard';
                setTimeout(() => {
                    closeModal();
                    router.replace(targetRoute);
                }, 2000);
            } else {
                const errorData = response.data;
                setError(errorData.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error en login:', error);
            if (error.response?.status === 403) {
                setError('No tienes permisos para acceder al sistema');
            } else {
                setError('Error de red. Inténtalo de nuevo.');
            }
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
                                <form 
                                    onSubmit={handleSubmit} 
                                    className="mt-4"
                                    autoComplete="on"
                                >
                                    <div className="mb-4">
                                        <label className="block text-gray-300" htmlFor="email">
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 mt-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                            autoComplete="username"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            label="Contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    {error && <p className="text-red-500 mb-4">{error}</p>}
                                    {success && <p className="text-green-500 mb-4">{success}</p>}
                                    <div className="flex justify-between items-center mb-6">
                                        <button
                                            type="button"
                                            className="text-primary hover:text-primary-dark text-sm"
                                            onClick={handleForgotPassword}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark"
                                    >
                                        Iniciar Sesión
                                    </button>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
