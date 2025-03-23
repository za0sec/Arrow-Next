import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function DeleteAccount() {
  const [email, setEmail] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmation !== 'Quiero borrar mi cuenta') {
      setError('Por favor escribe exactamente "Quiero borrar mi cuenta" para confirmar');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/delete-request`, { email });
      
      setSuccess(true);
      setEmail('');
      setConfirmation('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al procesar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">
          Eliminar cuenta
        </h1>

        {success ? (
          <div className="bg-green-900 border border-green-600 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-green-400">Solicitud enviada con éxito</h3>
            <div className="mt-2 text-sm text-green-300">
              <p>
                Se ha enviado un correo electrónico a {email}. Por favor, confirma la eliminación 
                haciendo clic en el enlace incluido en el correo.
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-300 mb-1">
                Confirmación
              </label>
              <div className="mt-1">
                <input
                  id="confirmation"
                  name="confirmation"
                  type="text"
                  required
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder='Escribe "Quiero borrar mi cuenta"'
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Escribe exactamente &quot;Quiero borrar mi cuenta&quot; para confirmar
              </p>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-600 rounded-md p-4 mb-4">
                <h3 className="text-sm font-medium text-red-400">Error</h3>
                <div className="mt-2 text-sm text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Solicitar eliminación de cuenta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 