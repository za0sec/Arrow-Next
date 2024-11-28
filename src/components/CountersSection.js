import CountUp from 'react-countup';
import CounterItem from './CounterItem';

export default function CountersSection({ visitedClients, counter1, counter2, counter3 }) {
    return (
        <section className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center w-full">
            <CounterItem count={visitedClients} label="Clientes Visitados" />
            <CounterItem count={counter1} label="Clientes en funcionamiento" />
            <CounterItem count={counter2} label="Usuarios en la app" />
            <CounterItem count={counter3} label="Años de Experiencia" />
        </section>
    );
}
