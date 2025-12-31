import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function RequireAdmin({ children }: { children: JSX.Element }) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
