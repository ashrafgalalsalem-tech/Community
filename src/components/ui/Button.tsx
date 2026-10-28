import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: Single-line control, focus-visible outline, smooth transition, minimum touch target
    const baseStyles =
      'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 rounded-lg cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765] focus-visible:ring-offset-2';

    // Size mappings
    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-xs sm:text-sm px-4 py-2 min-h-[42px] gap-2',
      lg: 'text-sm sm:text-base px-5 py-2.5 min-h-[46px] gap-2.5',
    };

    // Variant mappings
    const variantStyles = {
      primary:
        'bg-[#008765] hover:bg-[#006B52] text-white shadow-xs hover:shadow-sm active:bg-[#005a45]',
      secondary:
        'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs hover:border-slate-300',
      accent:
        'bg-[#E0F2FE] hover:bg-sky-100 text-[#0284C7] border border-[#BAE6FD]/60 hover:text-[#0369A1]',
      outline:
        'bg-transparent hover:bg-[#E6F4F1] text-[#008765] border border-[#008765] hover:border-[#006B52]',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
