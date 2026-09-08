import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types/auth';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Verifying Administrative Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white border border-rose-200 rounded-lg shadow-sm text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">403 — Administrative Scope Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          Your current authenticated role (<strong>{user.role}</strong>) does not have authorization to access this view.
          Under statutory RBAC guidelines, this resource is restricted to: {allowedRoles.join(', ')}.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  return <Outlet />;
};
