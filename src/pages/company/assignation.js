import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient from "@/pages/utils/apiClient";
import DashboardNavbar from '@/pages/components/DashboardNavbar';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function Assignation() {
    const [user, setUser] = useState('');
    const [branches, setBranches] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { companyId } = router.query;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.get('/user/profile');

                if (response.status === 200) {
                    setUser(response.data);
                } else if (response.status === 401) {
                    router.push('/');
                } else {
                    setError('Error al obtener el perfil del usuario');
                }
            } catch (error) {
                setError('Error al obtener el perfil del usuario');
                console.error('Error en autenticación:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    useEffect(() => {
        const fetchNotAssignedBranches = async () => {
            try {
                const response = await apiClient.get(`/admin/company/branches/getNotAssignedBranches${companyId ? `/${companyId}` : ''}`);
                setBranches(response.data);
            } catch (error) {
                setError('Error al obtener las sucursales no asignadas.');
                console.error('Error fetching branches:', error);
            }
        };

        const fetchSupervisors = async () => {
            try {
                const response = await apiClient.get('/admin/supervisors/all');
                setSupervisors(response.data);
            } catch (error) {
                setError('Error al obtener los supervisores.');
                console.error('Error fetching supervisors:', error);
            }
        };

        fetchNotAssignedBranches();
        fetchSupervisors();
        setLoading(false);
    }, [companyId]);


    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const branchId = parseInt(draggableId);

        if (source.droppableId === destination.droppableId) {
            // Reordenar dentro del mismo supervisor o dentro de 'branches'
            const updatedSupervisors = supervisors.map(supervisor => {
                if (supervisor.id.toString() === source.droppableId) {
                    const newBranches = Array.from(supervisor.branches);
                    const [movedBranch] = newBranches.splice(source.index, 1);
                    newBranches.splice(destination.index, 0, movedBranch);
                    return {
                        ...supervisor,
                        branches: newBranches,
                    };
                }
                return supervisor;
            });
            setSupervisors(updatedSupervisors);
            return;
        }

        if (source.droppableId === 'branches') {
            const movedBranch = branches.find(branch => branch.id === branchId);
            const updatedSupervisors = supervisors.map(supervisor => {
                if (supervisor.id === parseInt(destination.droppableId)) {
                    return {
                        ...supervisor,
                        branches: [...supervisor.branches, movedBranch],
                    };
                }
                return supervisor;
            });

            setBranches(branches.filter(branch => branch.id !== branchId));
            setSupervisors(updatedSupervisors);
        } else if (destination.droppableId === 'branches') {
            const sourceSupervisor = supervisors.find(supervisor => supervisor.id === parseInt(source.droppableId));
            const movedBranch = sourceSupervisor.branches.find(branch => branch.id === branchId);

            const updatedSourceSupervisor = {
                ...sourceSupervisor,
                branches: sourceSupervisor.branches.filter(branch => branch.id !== branchId),
            };

            setBranches([...branches, movedBranch]);
            setSupervisors(supervisors.map(supervisor => {
                if (supervisor.id === updatedSourceSupervisor.id) return updatedSourceSupervisor;
                return supervisor;
            }));
        } else {
            const sourceSupervisor = supervisors.find(supervisor => supervisor.id === parseInt(source.droppableId));
            const destinationSupervisor = supervisors.find(supervisor => supervisor.id === parseInt(destination.droppableId));

            const movedBranch = sourceSupervisor.branches.find(branch => branch.id === branchId);

            const updatedSourceSupervisor = {
                ...sourceSupervisor,
                branches: sourceSupervisor.branches.filter(branch => branch.id !== branchId),
            };

            const updatedDestinationSupervisor = {
                ...destinationSupervisor,
                branches: [...destinationSupervisor.branches, movedBranch],
            };

            setSupervisors(supervisors.map(supervisor => {
                if (supervisor.id === updatedSourceSupervisor.id) return updatedSourceSupervisor;
                if (supervisor.id === updatedDestinationSupervisor.id) return updatedDestinationSupervisor;
                return supervisor;
            }));
        }
    };





    const handleAssign = async () => {
        try {
            await Promise.all(supervisors.map(supervisor =>
                apiClient.post('/admin/supervisor/company/branches/assign', {
                    id: supervisor.id,
                    branches: supervisor.branches.map(branch => branch.id)
                })
            ));
            alert('Asignaciones realizadas con éxito');
        } catch (error) {
            console.error('Error during assignment:', error);
            alert('Hubo un error al realizar las asignaciones.');
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col">
            <DashboardNavbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <h1 className="text-4xl font-bold text-white mb-6">Asignación de Sucursales a Supervisores</h1>
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Column for Unassigned Branches */}
                        <Droppable droppableId="branches">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="bg-gray-800 p-4 rounded-lg shadow-lg"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-4">Sucursales No Asignadas</h2>
                                    {branches.map((branch, index) => (
                                        <Draggable key={branch.id} draggableId={branch.id.toString()} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="bg-gray-700 p-2 rounded-md text-white mb-2"
                                                >
                                                    {branch.name}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* Column for Supervisors */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4">Supervisores</h2>
                            {supervisors.map((supervisor) => (
                                <Droppable key={supervisor.id} droppableId={supervisor.id.toString()}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="bg-gray-700 p-2 rounded-md text-white mb-4"
                                        >
                                            <h3 className="font-bold">{`${supervisor.firstName} ${supervisor.lastName}`}</h3>
                                            <div className="flex flex-wrap">
                                                {supervisor.branches.map((branch, index) => (
                                                    <Draggable key={branch.id} draggableId={branch.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="bg-gray-600 p-2 m-1 rounded-md"
                                                            >
                                                                {branch.name}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                            </div>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </div>
                </DragDropContext>

                <div className="mt-8">
                    <button
                        onClick={handleAssign}
                        className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
                    >
                        Asignar
                    </button>
                </div>
            </main>
        </div>
    );
}
