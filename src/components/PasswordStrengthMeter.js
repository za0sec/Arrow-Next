import { useEffect, useState } from 'react';

export default function PasswordStrengthMeter({ password }) {
    const [strength, setStrength] = useState(0);
    const [feedback, setFeedback] = useState([]);

    const checkPasswordStrength = (pass) => {
        let score = 0;
        const checks = [];

        // Longitud mínima de 8 caracteres
        if (pass.length < 8) {
            checks.push('Debe tener al menos 8 caracteres');
        } else {
            score += 25;
        }

        // Contiene números
        if (!/\d/.test(pass)) {
            checks.push('Debe incluir al menos un número');
        } else {
            score += 25;
        }

        // Contiene minúsculas
        if (!/[a-z]/.test(pass)) {
            checks.push('Debe incluir al menos una letra minúscula');
        } else {
            score += 25;
        }

        // Contiene mayúsculas
        if (!/[A-Z]/.test(pass)) {
            checks.push('Debe incluir al menos una letra mayúscula');
        } else {
            score += 25;
        }

        // Eliminada la verificación de caracteres especiales
        // y redistribuido el puntaje entre los demás criterios

        setStrength(score);
        setFeedback(checks);
    };

    useEffect(() => {
        checkPasswordStrength(password);
    }, [password]);

    const getColor = () => {
        if (strength <= 25) return 'bg-red-500';
        if (strength <= 50) return 'bg-red-300';
        if (strength <= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="mt-2">
            <div className="w-full h-2 bg-gray-700 rounded-full">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${getColor()}`}
                    style={{ width: `${strength}%` }}
                />
            </div>
            {feedback.length > 0 && (
                <ul className="mt-2 text-sm space-y-1">
                    {feedback.map((item, index) => (
                        <li key={index} className="text-gray-400">
                            • {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 