import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  variant?: 'default' | 'alert' | 'warning' | 'success';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
  className = '',
}) => {
  const borderStyles = {
    default: 'border-slate-200/90 hover:border-slate-300 bg-white',
    alert: 'border-rose-200 bg-white hover:border-rose-300',
    warning: 'border-amber-200 bg-white hover:border-amber-300',
    success: 'border-emerald-200 bg-white hover:border-emerald-300',
  };

  const iconColors = {
    default: 'text-slate-600 bg-slate-100 border-slate-200',
    alert: 'text-rose-700 bg-rose-50 border-rose-200/60',
    warning: 'text-amber-700 bg-amber-50 border-amber-200/60',
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
  };

  return (
    <div className={`p-4 bg-white rounded-lg border shadow-xs transition-all ${borderStyles[variant]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-md border shrink-0 ${iconColors[variant]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
          {badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 shrink-0">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
