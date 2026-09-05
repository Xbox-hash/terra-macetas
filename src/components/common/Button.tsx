import React from 'react';
import { cn } from '../../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#2D3A2F] text-[#FAF8F5] hover:bg-[#3E4E40] focus:ring-[#2D3A2F] shadow-sm hover:shadow',
    secondary: 'bg-[#EAE5DC] text-[#2D3A2F] hover:bg-[#DDD7CB] focus:ring-[#C8C0B2]',
    outline: 'border border-[#2D3A2F]/20 text-[#2D3A2F] bg-transparent hover:bg-[#2D3A2F]/5 focus:ring-[#2D3A2F]',
    ghost: 'text-[#2D3A2F] bg-transparent hover:bg-[#2D3A2F]/5 focus:ring-[#2D3A2F]',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#20BD5A] focus:ring-[#25D366] shadow-sm hover:shadow-md font-semibold',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
