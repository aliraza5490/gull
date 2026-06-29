'use client';

import React from 'react';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';
import MuiDialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  return (
    <MuiDialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        backdrop: {
          style: {
            backgroundColor: 'rgba(9, 9, 11, 0.4)',
            backdropFilter: 'blur(4px)',
          },
        },
        paper: {
          className: 'rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-sans',
          style: {
            borderRadius: '16px',
          }
        }
      }}
    >
      <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <MuiDialogTitle className="text-lg font-semibold text-zinc-905 dark:text-zinc-50 p-0 font-sans">
          {title}
        </MuiDialogTitle>
        <IconButton
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          size="small"
          style={{ padding: '6px' }}
        >
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      <MuiDialogContent className="max-h-[70vh] overflow-y-auto pr-1 p-0">
        {children}
      </MuiDialogContent>
    </MuiDialog>
  );
}
