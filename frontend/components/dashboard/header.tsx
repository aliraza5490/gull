'use client';

import React from 'react';
import { Plus, Share2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useWorkspaces, useEndpoints, useCreateShare } from '../../services/webhook';
import { useDashboardStore } from '../../store/dashboardStore';
import { ThemeToggle } from '../ui/theme-toggle';
import { useToast } from '../../hooks/use-toast';

interface HeaderProps {
  user: { id: string; email: string };
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const { toast } = useToast();
  
  const selectedWorkspaceId = useDashboardStore((s) => s.selectedWorkspaceId);
  const setSelectedWorkspaceId = useDashboardStore((s) => s.setSelectedWorkspaceId);
  const selectedEndpointId = useDashboardStore((s) => s.selectedEndpointId);
  const setSelectedEndpointId = useDashboardStore((s) => s.setSelectedEndpointId);

  const setShowWorkspaceModal = useDashboardStore((s) => s.setShowWorkspaceModal);
  const setShowEndpointModal = useDashboardStore((s) => s.setShowEndpointModal);

  // Fetch workspaces & endpoints
  const { data: workspaces = [] } = useWorkspaces();
  const { data: endpointsData } = useEndpoints(selectedWorkspaceId, 1, 100);
  const endpoints = endpointsData?.items || [];

  const createShareMutation = useCreateShare(selectedEndpointId);

  const handleGenerateShare = () => {
    if (!selectedEndpointId) {
      toast({
        title: 'No Webhook Selected',
        description: 'Please select or register a webhook endpoint to share a session.',
        type: 'error',
      });
      return;
    }
    createShareMutation.mutate(
      { expires_in_seconds: 86400 },
      {
        onSuccess: (shareData) => {
          const url = `${window.location.origin}/share/${shareData.token}`;
          navigator.clipboard.writeText(url);
          toast({
            title: 'Share Link Created!',
            description: 'Read-only link copied to your clipboard. Expires in 24 hours.',
            type: 'success',
          });
        },
        onError: (err) => {
          toast({
            title: 'Share Failed',
            description: err.message || 'Could not generate share link.',
            type: 'error',
          });
        },
      }
    );
  };

  return (
    <header className="border-b border-zinc-200/80 dark:border-zinc-900 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
      <Box className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo & Workspace Switcher */}
        <Box className="flex items-center gap-3">
          <Box className="h-9 w-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-md">
            <svg className="h-5 w-5 text-white dark:text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Box>
          <Box className="flex items-center gap-2">
            <Typography variant="body1" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50" style={{ fontFamily: 'inherit' }}>
              Gull
            </Typography>
            <FormControl size="small">
              <Select
                value={selectedWorkspaceId || ''}
                onChange={(e) => {
                  const val = e.target.value as string;
                  if (val === '__create__') {
                    setShowWorkspaceModal(true);
                  } else {
                    setSelectedWorkspaceId(val);
                    setSelectedEndpointId('');
                  }
                }}
                className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100"
                slotProps={{
                  input: {
                    style: { padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '12px' }
                  }
                }}
                sx={{
                  boxShadow: 'none',
                  '.MuiOutlinedInput-notchedOutline': { border: '1px solid var(--zinc-200)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '1px solid var(--zinc-500)' },
                  borderRadius: '12px'
                }}
              >
                {workspaces.map((ws) => (
                  <MenuItem key={ws.id} value={ws.id} style={{ fontSize: '12px', fontWeight: 500 }}>
                    {ws.name}
                  </MenuItem>
                ))}
                <MenuItem value="__create__" style={{ fontSize: '12px', fontWeight: 600, color: '#4c57eb' }}>
                  + Create Workspace
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Right Actions */}
        <Box className="flex items-center gap-4">
          <Box className="flex items-center gap-2">
            {/* Show dropdown only if there are endpoints registered */}
            {endpoints.length > 0 && (
              <FormControl size="small">
                <Select
                  value={selectedEndpointId || ''}
                  onChange={(e) => setSelectedEndpointId(e.target.value as string)}
                  className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100"
                  slotProps={{
                    input: {
                      style: { padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '12px' }
                    }
                  }}
                  sx={{
                    boxShadow: 'none',
                    '.MuiOutlinedInput-notchedOutline': { border: '1px solid var(--zinc-200)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '1px solid var(--zinc-500)' },
                    borderRadius: '12px'
                  }}
                >
                  {endpoints.map((ep) => (
                    <MenuItem key={ep.id} value={ep.id} style={{ fontSize: '12px' }}>
                      {ep.name} ({ep.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button
              onClick={() => setShowEndpointModal(true)}
              variant="contained"
              className="flex items-center gap-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '12px', textTransform: 'none' }}
            >
              <Plus className="h-4 w-4" /> Create
            </Button>
          </Box>

          <Button
            onClick={handleGenerateShare}
            variant="outlined"
            className="flex items-center gap-1 border border-zinc-200 text-zinc-900 hover:bg-zinc-50/50 dark:border-zinc-850 dark:text-zinc-100 dark:hover:bg-zinc-900/50"
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '12px', textTransform: 'none' }}
          >
            <Share2 className="h-4 w-4" /> Share Session
          </Button>
          <Box className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <ThemeToggle />
          
          <Box className="flex items-center gap-2">
            <Box className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                {user.email}
              </span>
            </Box>
            <Button
              onClick={onLogout}
              variant="text"
              className="text-zinc-550 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg text-xs font-semibold normal-case"
              style={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Box>
    </header>
  );
}
