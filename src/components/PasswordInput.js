import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function PasswordInput({ 
    value, 
    onChange, 
    id, 
    label, 
    error,
    showStrengthMeter,
    className = "" 
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            {label && (
                <label className="block text-gray-300" htmlFor={id}>
                    {label}
                </label>
            )}
            <div className="relative mt-2">
                <input
                    type={showPassword ? "text" : "password"}
                    id={id}
                    value={value}
                    onChange={onChange}
                    className={`w-full px-4 py-2 pr-12 rounded-md bg-gray-700 text-white border ${
                        error ? 'border-red-500' : 'border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-300"
                >
                    {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                        <EyeIcon className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    );
} 