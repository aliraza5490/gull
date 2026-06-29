import React from 'react';
import TextField from '@mui/material/TextField';

interface InputProps extends Omit<React.ComponentProps<typeof TextField>, 'label' | 'error'> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      )}
      <TextField
        error={!!error}
        helperText={error}
        variant="outlined"
        fullWidth
        className={`w-full bg-white dark:bg-zinc-900/60 rounded-xl ${className}`}
        slotProps={{
          input: {
            className: 'text-sm text-zinc-900 dark:text-zinc-50 rounded-xl',
            style: {
              borderRadius: '12px',
            }
          }
        }}
        {...props}
      />
    </div>
  );
}
