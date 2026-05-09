import { Navigate, Outlet } from 'react-router-dom';
import React from 'react';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  // Version simple sans useAuth (si vous n'avez pas encore ce hook)
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role') as UserRole | null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
          <p className="text-gray-600">Accès non autorisé</p>
          <a href="/dashboard" className="text-blue-600 hover:underline mt-4 block">
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;