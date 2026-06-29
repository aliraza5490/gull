'use client';

import React from 'react';
import { Plus, Share2 } from 'lucide-react';
import { useWorkspaces, useEndpoints, useCreateShare } from '../../services/webhook';
import { useDashboardStore } from '../../store/dashboardStore';
import { Button } from '../ui/button';
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
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo & Workspace Switcher */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-md">
            <svg className="h-5 w-5 text-white dark:text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gull</span>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__create__') {
                  setShowWorkspaceModal(true);
                } else {
                  setSelectedWorkspaceId(val);
                  setSelectedEndpointId('');
                }
              }}
              className="text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
              <option value="__create__" className="text-indigo-650 dark:text-indigo-400 font-semibold">
                + Create Workspace
              </option>
            </select>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Show dropdown only if there are endpoints registered */}
            {endpoints.length > 0 && (
              <select
                value={selectedEndpointId}
                onChange={(e) => setSelectedEndpointId(e.target.value)}
                className="text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.name} ({ep.type})
                  </option>
                ))}
              </select>
            )}
            <Button onClick={() => setShowEndpointModal(true)} size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>

          <Button onClick={handleGenerateShare} variant="outline" size="sm" className="flex items-center gap-1.5">
            <Share2 className="h-4 w-4" /> Share Session
          </Button>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <ThemeToggle />
          
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                {user.email}
              </span>
            </div>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg text-xs font-semibold"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
