import React from 'react';

export type BadgeVariant = 'high' | 'medium' | 'low' | 'review' | 'info' | 'success' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    high: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
    medium: 'bg-amber-50 text-amber-700 border-amber-200/80 font-semibold',
    low: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
    review: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-semibold',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight tracking-wide',
    md: 'px-2.5 py-1 text-xs tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: string; prefix?: string; className?: string }> = ({
  severity,
  prefix,
  className,
}) => {
  const upper = severity?.toUpperCase() || 'NONE';
  let variant: BadgeVariant = 'neutral';
  let label = upper;

  if (upper === 'HIGH') {
    variant = 'high';
    label = prefix ? `${prefix}: HIGH` : 'HIGH';
  } else if (upper === 'MEDIUM') {
    variant = 'medium';
    label = prefix ? `${prefix}: MEDIUM` : 'MEDIUM';
  } else if (upper === 'LOW') {
    variant = 'low';
    label = prefix ? `${prefix}: LOW` : 'LOW';
  } else if (upper === 'REVIEW') {
    variant = 'review';
    label = prefix ? `${prefix}: REVIEW` : 'REVIEW';
  }

  return <Badge variant={variant} className={className}>{label}</Badge>;
};
