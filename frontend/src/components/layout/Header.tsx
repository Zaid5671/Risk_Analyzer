import React, { useState, useEffect } from 'react';
import { useAuth, CANONICAL_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { healthService } from '@/services/health';
import type { Role } from '@/types/auth';
import { Shield, User, LogOut, ChevronDown, Activity, Landmark } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    healthService
      .getHealth()
      .then((res) => setDbHealthy(res.status === 'healthy'))
      .catch(() => setDbHealthy(false));
  }, []);

  const getScopeBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'MINISTRY':
        return {
          title: 'Central MoSPI Oversight',
          sub: 'All-India National Portfolio (36 States/UTs)',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'STATE_OFFICER':
        return {
          title: `State Nodal • ${user.assigned_state || 'Uttar Pradesh'}`,
          sub: 'State-Level Inter-District Monitoring',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'DISTRICT_OFFICER':
        return {
          title: `District Authority • ${user.assigned_district || 'PATNA'}, ${user.assigned_state || 'Bihar'}`,
          sub: 'Local Operational Queue & Sanctions',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'MP':
        return {
          title: `MP Portfolio • ${user.assigned_mp_name || 'SARABJEET SINGH KHALSA'}`,
          sub: 'Faridkot (SC) Parliamentary Constituency',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return { title: user.role, sub: '', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const scope = getScopeBadge();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Scope Badge */}
      <div className="flex items-center gap-3">
        {scope && (
          <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${scope.color}`}>
            <Landmark className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-bold leading-none">{scope.title}</p>
              <p className="text-[10px] opacity-75 mt-0.5">{scope.sub}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Live Backend Connection Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>API:</span>
          <span
            className={`w-2 h-2 rounded-full ${
              dbHealthy === true ? 'bg-emerald-500 animate-pulse' : dbHealthy === false ? 'bg-rose-500' : 'bg-amber-400'
            }`}
          />
          <span className="font-medium">{dbHealthy === true ? 'Online' : dbHealthy === false ? 'Offline' : '...'}</span>
        </div>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Switch Role</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Fast Stakeholder Demo Switcher
              </div>
              {CANONICAL_DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => {
                    quickLogin(acc.role as Role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-start gap-2.5 transition-colors ${
                    user?.role === acc.role ? 'bg-blue-50/70 border-l-2 border-blue-600' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{acc.label}</p>
                    <p className="text-[10px] text-slate-500">{acc.scope}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 font-mono">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
