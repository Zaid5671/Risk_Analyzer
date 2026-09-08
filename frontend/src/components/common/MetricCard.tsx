import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  variant?: 'default' | 'alert' | 'warning' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
}) => {
  const borderStyles = {
    default: 'border-slate-200 hover:border-slate-300',
    alert: 'border-rose-300 bg-rose-50/20 hover:border-rose-400',
    warning: 'border-amber-300 bg-amber-50/20 hover:border-amber-400',
    success: 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400',
  };

  const iconColors = {
    default: 'text-slate-600 bg-slate-100',
    alert: 'text-rose-600 bg-rose-100',
    warning: 'text-amber-600 bg-amber-100',
    success: 'text-emerald-600 bg-emerald-100',
  };

  return (
    <div className={`p-5 bg-white rounded-xl border shadow-sm transition-all ${borderStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          {subtitle && <p className="text-xs text-slate-500 line-clamp-1">{subtitle}</p>}
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
