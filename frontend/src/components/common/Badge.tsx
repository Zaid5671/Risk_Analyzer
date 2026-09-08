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
    high: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    review: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-sm font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: string; prefix?: string }> = ({ severity, prefix }) => {
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

  return <Badge variant={variant}>{label}</Badge>;
};
