import React from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`flex flex-col ${
        isCenter ? 'items-center text-center' : 'items-start text-left'
      } justify-between gap-4 sm:flex-row sm:items-end ${className}`}
    >
      <div className={`space-y-1.5 ${isCenter ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>
        {eyebrow && (
          <p className="text-xs font-bold text-[#008765] uppercase tracking-wider font-display">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 pt-2 sm:pt-0">{action}</div>}
    </div>
  );
};
