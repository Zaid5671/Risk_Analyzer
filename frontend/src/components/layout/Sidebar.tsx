import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  Copy,
  BadgePercent,
  Clock,
  MapPin,
  Users,
  UserCog,
  ChevronDown,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'bg-slate-800 text-white font-semibold'
        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
    }`;

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[11px] transition-colors ${
      isActive
        ? 'bg-slate-800 text-amber-400 font-semibold'
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
    }`;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow">
          MP
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white leading-tight">MPLADS AI Monitor</h1>
          <p className="text-[10px] text-slate-400 font-mono">SIH 2026 • PS 26102</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Core Nav */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Overview
          </div>
          <div className="space-y-1">
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </NavLink>
            <NavLink to="/works" className={navClass}>
              <FolderKanban className="w-4 h-4" />
              <span>Works Registry</span>
            </NavLink>
          </div>
        </div>

        {/* Independent Audits Group */}
        <div>
          <button
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            className="w-full flex items-center justify-between px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Independent Audits (4)</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${analyticsOpen ? '' : '-rotate-90'}`}
            />
          </button>

          {analyticsOpen && (
            <div className="space-y-0.5 mt-1 pl-2 border-l border-slate-800">
              <NavLink to="/analytics/cost-anomalies" className={subNavClass}>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>1. Cost Anomalies</span>
              </NavLink>
              <NavLink to="/analytics/duplicate-works" className={subNavClass}>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. Potential Duplicates</span>
              </NavLink>
              <NavLink to="/analytics/fund-anomalies" className={subNavClass}>
                <BadgePercent className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Fund & Expenditure</span>
              </NavLink>
              <NavLink to="/analytics/delays" className={subNavClass}>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>4. Statutory Delays</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Governance Summaries */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Governance Summaries
          </div>
          <div className="space-y-1">
            <NavLink to="/analytics/district-summary" className={navClass}>
              <MapPin className="w-4 h-4" />
              <span>District Performance</span>
            </NavLink>
            <NavLink to="/analytics/mp-summary" className={navClass}>
              <Users className="w-4 h-4" />
              <span>MP Portfolios</span>
            </NavLink>
          </div>
        </div>

        {/* Administration Console (Ministry Only) */}
        {user?.role === 'MINISTRY' && (
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Administration
            </div>
            <div className="space-y-1">
              <NavLink to="/admin/users" className={navClass}>
                <UserCog className="w-4 h-4 text-emerald-400" />
                <span>Stakeholder Accounts</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Footer Lineage & Team Attribution */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium text-slate-400">
          <Layers className="w-3 h-3 text-amber-500" />
          <span>Team Code Blooded</span>
        </div>
        <p className="mt-1 text-[9px] text-slate-400">
          Zero Composite Risk • 4 Isolated Models • PostgreSQL RLS Enforced
        </p>
      </div>
    </aside>
  );
};
