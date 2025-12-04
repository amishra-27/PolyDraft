import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white",
    secondary: "bg-surface hover:bg-surface-hover text-primary border border-gray-300",
    outline: "bg-transparent border-2 border-primary text-primary hover:bg-gray-50",
  };

  const sizes = {
    sm: "h-8 px-4 text-xs",
    md: "h-11 px-6 text-sm", // Min 44px height for touch
    lg: "h-14 px-8 text-base",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {typeof children === 'string' && (
            <span className="ml-2">{children.replace(/^(Create|Join|Submit|Confirm|Save)/, '$1ing...')}</span>
          )}
        </>
      ) : (
        children
      )}
    </button>
  );
}

