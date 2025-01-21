import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import config from "@/utils/config";
import apiClient from "@/utils/apiClient";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [token, setToken] = useState("");

    useEffect(() => {
        if (confirmPassword) {
            setPasswordsMatch(password === confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [password, confirmPassword]);

    useEffect(() => {
        if (router.isReady) {
            const { token } = router.query;
            if (token) {
                setToken(token);
            } else {
                setError("Token inválido o ausente");
            }
        }
    }, [router.isReady, router.query]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }
        
        const hasNumber = /\d/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasNumber || !hasLower || !hasUpper || !hasSpecial) {
            setError("La contraseña no cumple con los requisitos de seguridad");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        try {
            const response = await apiClient.post("/reset-password", {
                token,
                password,
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                setSuccess("Contraseña actualizada con éxito");
                setTimeout(() => router.push("/"), 2000);
            } else {
                const errorMessage = response.data.message || 
                                    "Error al restablecer la contraseña";
                setError(errorMessage);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                                (typeof error.response?.data === 'string' ? error.response.data : 
                                "Error al restablecer la contraseña");
            setError(errorMessage);
            console.error("Error detallado:", error);
        }
    };

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center text-primary">
                    Restablecer Contraseña
                </h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <PasswordInput
                            id="password"
                            label="Nueva Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <PasswordStrengthMeter password={password} />
                    </div>
                    <div className="mb-4">
                        <PasswordInput
                            id="confirmPassword"
                            label="Confirmar Contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!passwordsMatch && confirmPassword}
                        />
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {success && (
                        <p className="text-green-500 mb-4">{success}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark">
                        Restablecer Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
}
