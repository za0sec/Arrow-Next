import { useState } from 'react';
import { useRouter } from 'next/router';
import config from './utils/config';
import apiClient from "@/pages/utils/apiClient";

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.post('/resetPassword', {
                email,
            });

            if (response.status === 200) {
                setSuccess('Si su correo esta registrado, se ha enviado un correo para restablecer la contraseña.');
            } else if (response.status === 403) {
                setError('No tienes permisos para realizar esta acción.');
            } else if (response.status === 400) {
                setError('Correo no válido o no registrado.');
            } else if (response.status === 500) {
                setError('Error en el servidor. Inténtalo de nuevo más tarde.');
            } else {
                setError('Ocurrió un error inesperado.');
            }
        } catch (error) {
            setError('Error de red. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center text-primary">Restablecer Contraseña</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-300" htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {success && <p className="text-green-500 mb-4">{success}</p>}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark"
                    >
                        Enviar Correo
                    </button>
                </form>
            </div>
        </div>
    );
}
