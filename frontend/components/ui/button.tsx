import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface ButtonProps extends Omit<React.ComponentProps<typeof MuiButton>, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 normal-case';
  
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
    outline: 'border border-zinc-200 text-zinc-900 hover:bg-zinc-50/50 dark:border-zinc-850 dark:text-zinc-100 dark:hover:bg-zinc-900/50',
    ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  };

  const sizes = {
    xs: 'px-2 py-1 text-[10px] rounded-lg',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <MuiButton
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      sx={{ textTransform: 'none', minWidth: 'auto', color: 'inherit' }}
      {...props}
    >
      {isLoading && (
        <CircularProgress size={16} color="inherit" className="-ml-1 mr-2" />
      )}
      {children}
    </MuiButton>
  );
}
