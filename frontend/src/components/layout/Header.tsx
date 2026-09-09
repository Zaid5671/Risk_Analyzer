import React, { useState, useEffect } from 'react';
import { useAuth, CANONICAL_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { healthService } from '@/services/health';
import type { Role } from '@/types/auth';
import { Shield, User, LogOut, ChevronDown, Activity, Landmark } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    healthService
      .getHealth()
      .then((res) => {
        setDbHealthy(res.status === 'healthy');
        setDbLatency(res.db_latency_ms);
      })
      .catch(() => setDbHealthy(false));
  }, []);

  const getScopeBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'MINISTRY':
        return {
          title: 'Central MoSPI Oversight',
          sub: 'All-India National Portfolio (36 States/UTs)',
          color: 'bg-blue-50 text-blue-900 border-blue-200/90',
        };
      case 'STATE_OFFICER':
        return {
          title: `State Nodal • ${user.assigned_state || 'Uttar Pradesh'}`,
          sub: 'State-Level Inter-District Monitoring',
          color: 'bg-indigo-50 text-indigo-900 border-indigo-200/90',
        };
      case 'DISTRICT_OFFICER':
        return {
          title: `District Authority • ${user.assigned_district || 'PATNA'}, ${user.assigned_state || 'Bihar'}`,
          sub: 'Local Operational Queue & Sanctions',
          color: 'bg-emerald-50 text-emerald-900 border-emerald-200/90',
        };
      case 'MP':
        return {
          title: `MP Portfolio • ${user.assigned_mp_name || 'SARABJEET SINGH KHALSA'}`,
          sub: 'Faridkot (SC) Parliamentary Constituency',
          color: 'bg-amber-50 text-amber-900 border-amber-200/90',
        };
      default:
        return { title: user.role, sub: '', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const scope = getScopeBadge();

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Scope Badge */}
      <div className="flex items-center gap-3">
        {scope && (
          <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2.5 ${scope.color}`}>
            <Landmark className="w-4 h-4 shrink-0 text-slate-700" />
            <div>
              <p className="font-bold leading-none tracking-tight">{scope.title}</p>
              <p className="text-[10px] opacity-80 mt-0.5">{scope.sub}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Backend Connection Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>API:</span>
          <span
            className={`w-2 h-2 rounded-full ${
              dbHealthy === true ? 'bg-emerald-500 animate-pulse' : dbHealthy === false ? 'bg-rose-500' : 'bg-amber-400'
            }`}
          />
          <span className="font-medium">
            {dbHealthy === true ? (dbLatency ? `${dbLatency}ms` : 'Online') : dbHealthy === false ? 'Offline' : 'Connecting...'}
          </span>
        </div>

        {/* Perspective Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors border border-slate-200/90 shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Simulate Perspective</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200/90 py-2 z-50">
              <div className="px-3.5 py-1.5 border-b border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Simulate Stakeholder Perspective
                </p>
                <p className="text-[10px] text-slate-400">Experience jurisdictional data scoping across tiers</p>
              </div>
              <div className="p-1 space-y-0.5">
                {CANONICAL_DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => {
                      quickLogin(acc.role as Role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-start gap-2.5 transition-colors ${
                      user?.role === acc.role
                        ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      <User className={`w-3.5 h-3.5 ${user?.role === acc.role ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{acc.label}</p>
                        {user?.role === acc.role && (
                          <span className="text-[9px] px-1 rounded bg-blue-600 text-white font-bold">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{acc.scope}</p>
                    </div>
                  </button>
                ))}
              </div>
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
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
