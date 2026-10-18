import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '@/lib/authStore';

const PublicRoute = () => {
    // If user is already logged in, redirect them to the home page
    if (isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
