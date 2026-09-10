import React from 'react';
import {
  TrendingUp,
  RotateCw,
  MapPin,
  Building2,
  Users,
  Shield,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface TrendHeaderProps {
  activeGrain: 'NATIONAL' | 'STATE' | 'DISTRICT' | 'MP';
  onSelectGrain: (grain: 'NATIONAL' | 'STATE' | 'DISTRICT' | 'MP') => void;
  selectedState: string;
  onSelectState: (state: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  selectedMP: string;
  onSelectMP: (mp: string) => void;
  availableStates: string[];
  availableDistricts: string[];
  availableMPs: string[];
  userRole?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated?: string;
}

export const TrendHeader: React.FC<TrendHeaderProps> = ({
  activeGrain,
  onSelectGrain,
  selectedState,
  onSelectState,
  selectedDistrict,
  onSelectDistrict,
  selectedMP,
  onSelectMP,
  availableStates,
  availableDistricts,
  availableMPs,
  userRole = 'MINISTRY',
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  const isMinistry = userRole === 'MINISTRY';
  const isStateOfficer = userRole === 'STATE_OFFICER';
  const isDistrictOfficer = userRole === 'DISTRICT_OFFICER';
  const isMP = userRole === 'MP';

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-5">
      {/* Breadcrumb & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Governance</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-blue-400 font-semibold">Macro Trends & Early Warnings</span>
          <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-3 h-3" />
            SIH PS 26102 Mandate
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Zero Composite Risk
          </span>
        </div>

        {/* Refresh & Last Updated */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono">
              Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Rollups'}</span>
          </button>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Trends & Early Warning Intelligence
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Longitudinal quarterly rollups (2023Q3–2026Q3), empirical Bayes smoothing, and statutory pre-breach queues (Para 3.12).
              </p>
            </div>
          </div>
        </div>

        {/* Grain Switcher Tabs */}
        {isMinistry && (
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => onSelectGrain('NATIONAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeGrain === 'NATIONAL'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>National</span>
            </button>
            <button
              onClick={() => onSelectGrain('STATE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeGrain === 'STATE'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>State</span>
            </button>
            <button
              onClick={() => onSelectGrain('DISTRICT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeGrain === 'DISTRICT'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>District</span>
            </button>
            <button
              onClick={() => onSelectGrain('MP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeGrain === 'MP'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>MP Portfolio</span>
            </button>
          </div>
        )}
      </div>

      {/* Cascading Filter Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Scope Controls:</span>
        </div>

        {/* State Selector */}
        {(activeGrain === 'STATE' || activeGrain === 'DISTRICT' || isStateOfficer || isDistrictOfficer) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">State:</span>
            {isStateOfficer || isDistrictOfficer ? (
              <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700">
                {selectedState}
              </span>
            ) : (
              <select
                value={selectedState}
                onChange={(e) => onSelectState(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* District Selector */}
        {(activeGrain === 'DISTRICT' || isDistrictOfficer) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">District:</span>
            {isDistrictOfficer ? (
              <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700">
                {selectedDistrict}
              </span>
            ) : (
              <select
                value={selectedDistrict}
                onChange={(e) => onSelectDistrict(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
              >
                {availableDistricts.length === 0 && <option value="">Loading districts...</option>}
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* MP Selector */}
        {(activeGrain === 'MP' || isMP) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">MP Name:</span>
            {isMP ? (
              <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700">
                {selectedMP}
              </span>
            ) : (
              <select
                value={selectedMP}
                onChange={(e) => onSelectMP(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[260px]"
              >
                {availableMPs.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Active Scope Tag */}
        <div className="ml-auto text-[11px] text-slate-400 flex items-center gap-2">
          <span>Active Scope:</span>
          <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono font-medium border border-blue-800/60">
            {activeGrain === 'NATIONAL' && 'Nationwide (98,825 Canonical Works)'}
            {activeGrain === 'STATE' && `State: ${selectedState}`}
            {activeGrain === 'DISTRICT' && `District: ${selectedDistrict} (${selectedState})`}
            {activeGrain === 'MP' && `MP: ${selectedMP}`}
          </span>
        </div>
      </div>
    </div>
  );
};
