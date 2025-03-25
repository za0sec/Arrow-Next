import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RrhhNavbar from '@/components/RrhhNavbar';
import apiClient from "@/utils/apiClient";

export default function DniManagement() {
    const [dni, setDni] = useState('');
    const [dniList, setDniList] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        total: 0,
        pages: 0,
        limit: 10
    });
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                if (response.status === 200) {
                    const userData = response.data;
                    const userRole = localStorage.getItem('userRole');
                    
                    // Verificar que sea un usuario de RRHH
                    if (userRole !== 'rrhh') {
                        router.push('/');
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

    const fetchDniList = async (page = 1, searchTerm = '') => {
        try {
            const response = await apiClient.get('/rrhh/dni', {
                params: {
                    page,
                    limit: pagination.limit,
                    search: searchTerm
                }
            });
            setDniList(response.data.dnis);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching DNI list:', error);
            setError('Error al cargar la lista de DNIs');
        }
    };

    useEffect(() => {
        if (user) {
            fetchDniList(pagination.currentPage, search);
        }
    }, [user, pagination.currentPage, search]);

    // Debounce para la búsqueda
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user) {
                fetchDniList(1, search);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!dni.trim()) {
            setError('El DNI no puede estar vacío');
            return;
        }

        try {
            await apiClient.post('/rrhh/dni', { dni: dni.trim() });
            setSuccess('DNI agregado exitosamente');
            setDni('');
            // Actualizar la lista de DNIs con el nuevo formato paginado
            fetchDniList(1, ''); // Resetear a la primera página y sin búsqueda
        } catch (error) {
            setError(error.response?.data?.message || 'Error al agregar el DNI');
        }
    };

    const handleDelete = async (dniToDelete) => {
        try {
            await apiClient.delete(`/rrhh/dni/${dniToDelete}`);
            // Actualizar la lista de DNIs con el nuevo formato paginado
            fetchDniList(pagination.currentPage, search);
            setSuccess('DNI eliminado exitosamente');
        } catch (error) {
            setError(error.response?.data?.message || 'Error al eliminar el DNI');
        }
    };

    const handleCsvUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv') {
            setError('Por favor, sube un archivo CSV');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            await apiClient.post('/rrhh/dni/bulk', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Actualizar la lista de DNIs con el nuevo formato paginado
            fetchDniList(1, ''); // Resetear a la primera página y sin búsqueda
            setSuccess('DNIs importados exitosamente');
        } catch (error) {
            setError(error.response?.data?.message || 'Error al importar los DNIs');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <RrhhNavbar user={user} />
            
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-white">Gestión de DNIs</h1>
                            <div className="flex items-center gap-4">
                                <label className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark cursor-pointer">
                                    Importar CSV
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                                {uploading && (
                                    <span className="text-primary whitespace-nowrap">Importando...</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
                            <form onSubmit={handleSubmit} className="flex items-center gap-4">
                                <input
                                    type="text"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    placeholder="Ingrese el DNI"
                                    className="px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 whitespace-nowrap"
                                >
                                    Agregar DNI
                                </button>
                            </form>
                            {error && <p className="text-red-500 mt-2">{error}</p>}
                            {success && <p className="text-green-500 mt-2">{success}</p>}
                        </div>

                        <div className="bg-gray-800 rounded-lg shadow-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-white">DNIs Registrados</h2>
                                    <div className="w-64">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Buscar por DNI o nombre..."
                                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid gap-4">
                                    {dniList.map((dniItem) => (
                                        <div 
                                            key={dniItem.id} 
                                            className="flex justify-between items-center bg-gray-700 p-4 rounded-md"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-white">{dniItem.dni}</span>
                                                {dniItem.operatorName && (
                                                    <span className="text-gray-400 text-sm">
                                                        {dniItem.operatorName}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(dniItem.dni)}
                                                className="text-red-400 hover:text-red-500 focus:outline-none"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    ))}
                                    {dniList.length === 0 && (
                                        <p className="text-gray-400">No hay DNIs registrados</p>
                                    )}
                                </div>

                                {/* Paginación */}
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-400">
                                        Total: {pagination.total} DNIs
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Flecha izquierda */}
                                        <button
                                            onClick={() => fetchDniList(pagination.currentPage - 1, search)}
                                            disabled={pagination.currentPage === 1}
                                            className={`px-3 py-1 rounded ${
                                                pagination.currentPage === 1
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            ←
                                        </button>

                                        {/* Números de página */}
                                        {(() => {
                                            let pages = [];
                                            const current = pagination.currentPage;
                                            const total = pagination.pages;

                                            // Siempre mostrar la primera página
                                            if (current > 2) {
                                                pages.push(
                                                    <button
                                                        key={1}
                                                        onClick={() => fetchDniList(1, search)}
                                                        className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    >
                                                        1
                                                    </button>
                                                );
                                                if (current > 3) {
                                                    pages.push(
                                                        <span key="dots1" className="text-gray-500">...</span>
                                                    );
                                                }
                                            }

                                            // Páginas alrededor de la actual
                                            for (let i = Math.max(1, current - 1); i <= Math.min(total, current + 1); i++) {
                                                pages.push(
                                                    <button
                                                        key={i}
                                                        onClick={() => fetchDniList(i, search)}
                                                        className={`px-3 py-1 rounded ${
                                                            i === current
                                                                ? 'bg-primary text-white'
                                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        {i}
                                                    </button>
                                                );
                                            }

                                            // Siempre mostrar la última página
                                            if (current < total - 1) {
                                                if (current < total - 2) {
                                                    pages.push(
                                                        <span key="dots2" className="text-gray-500">...</span>
                                                    );
                                                }
                                                pages.push(
                                                    <button
                                                        key={total}
                                                        onClick={() => fetchDniList(total, search)}
                                                        className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    >
                                                        {total}
                                                    </button>
                                                );
                                            }

                                            return pages;
                                        })()}

                                        {/* Flecha derecha */}
                                        <button
                                            onClick={() => fetchDniList(pagination.currentPage + 1, search)}
                                            disabled={pagination.currentPage === pagination.pages}
                                            className={`px-3 py-1 rounded ${
                                                pagination.currentPage === pagination.pages
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}