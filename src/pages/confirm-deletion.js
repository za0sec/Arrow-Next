import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

export default function ConfirmDeletion() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (!token) return;

    const confirmDeletion = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/confirm-deletion/${token}`);
        setStatus('success');
        setMessage('Tu cuenta ha sido eliminada correctamente.');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Ha ocurrido un error al procesar tu solicitud.');
      }
    };

    confirmDeletion();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-center">
            <p className="text-xl">Error</p>
            <p className="mt-2">Token inválido o ausente</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-300">Procesando tu solicitud...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">
          Eliminación de cuenta
        </h1>

        <div className={`${status === 'success' ? 'bg-green-900 border border-green-600' : 'bg-red-900 border border-red-600'} rounded-md p-4 mb-4`}>
          <h3 className={`text-sm font-medium ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {status === 'success' ? 'Éxito' : 'Error'}
          </h3>
          <div className={`mt-2 text-sm ${status === 'success' ? 'text-green-300' : 'text-red-300'}`}>
            <p>{message}</p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link href="/" className="text-primary hover:text-primary-light">
            Regresar a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}