export default function LoadingSpinner({ size = "large" }) {
    const sizeClasses = {
        small: "h-4 w-4 border-2",
        medium: "h-8 w-8 border-2",
        large: "h-16 w-16 border-t-2 border-b-2"
    };

    if (size === "inline") {
        return (
            <div className="inline-flex items-center">
                <div className={`animate-spin rounded-full border-primary ${sizeClasses.small}`}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className={`animate-spin rounded-full border-primary ${sizeClasses[size]}`}></div>
        </div>
    );
} 