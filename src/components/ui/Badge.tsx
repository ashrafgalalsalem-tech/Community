import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'blue' | 'amber' | 'slate' | 'rose';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    emerald: 'bg-[#E6F4F1] text-[#006B52] border border-[#A7F3D0]',
    blue: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
