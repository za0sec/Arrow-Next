import CountUp from "react-countup";

export default function CounterItem({ count, label }) {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h3 className="text-4xl font-bold text-primary">
                <CountUp end={count} duration={3} />
            </h3>
            <p className="mt-2 text-gray-300">{label}</p>
        </div>
    );
}
