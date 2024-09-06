import {useEffect, useState} from 'react';
import { useRouter } from 'next/router';
import config from "@/pages/utils/config";
import apiClient from "@/pages/utils/apiClient";

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        if (router.isReady) {
            const { token } = router.query;
            if (token) {
                setToken(token);
            } else {
                setError('Token inválido o ausente');
            }
        }
    }, [router.isReady, router.query]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        console.log(token);

        try {
            const response = await apiClient.post('/reset-password', {
                token,
                password,
            });

            if (response.status === 200) {
                setSuccess('Contraseña actualizada con éxito');
                setTimeout(() => router.push('/'), 2000);
            } else {
                setError(response.data.message || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            setError(`Error de red. Inténtalo de nuevo.: ${error}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center text-primary">Restablecer Contraseña</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-300" htmlFor="password">Nueva Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 mt-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-300" htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        Restablecer Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
}
