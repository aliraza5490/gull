'use client';

import React, { useState } from 'react';
import { ShieldAlert, Link2, Copy, Check, Power, Sliders, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { useEndpoints, useUpdateEndpoint, useDestinations, useDeleteDestination } from '../../services/webhook';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

export function EndpointSidebar() {
  const { toast } = useToast();

  const selectedWorkspaceId = useDashboardStore((s) => s.selectedWorkspaceId);
  const selectedEndpointId = useDashboardStore((s) => s.selectedEndpointId);
  const setSelectedEndpointId = useDashboardStore((s) => s.setSelectedEndpointId);
  const setShowDestModal = useDashboardStore((s) => s.setShowDestModal);

  const copiedEndpointUrl = useDashboardStore((s) => s.copiedEndpointUrl);
  const setCopiedEndpointUrl = useDashboardStore((s) => s.setCopiedEndpointUrl);

  // Queries
  const { data: endpointsData } = useEndpoints(selectedWorkspaceId, 1, 100);
  const endpoints = endpointsData?.items || [];
  const currentEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  const endpointIdStr = currentEndpoint?.id || '';
  const { data: destinations = [] } = useDestinations(endpointIdStr);

  // Mutations
  const updateEndpointMutation = useUpdateEndpoint();
  const deleteDestMutation = useDeleteDestination(endpointIdStr);

  const handleToggleEndpointActive = () => {
    if (!currentEndpoint) return;
    updateEndpointMutation.mutate(
      {
        id: currentEndpoint.id,
        data: { is_active: !currentEndpoint.is_active },
      },
      {
        onSuccess: (updated) => {
          toast({
            title: updated.is_active ? 'Traffic Resumed' : 'Traffic Paused',
            description: `Webhook endpoint is now ${updated.is_active ? 'active' : 'paused'}.`,
            type: 'info',
          });
        },
      }
    );
  };

  const handleCopyEndpointUrl = () => {
    if (!currentEndpoint) return;
    const protocol = window.location.protocol;
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const url = `${protocol}//${host}/api/v1/receiver/t/${currentEndpoint.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedEndpointUrl(true);
    toast({
      title: 'Copied!',
      description: 'Receiver URL copied to clipboard.',
      type: 'success',
    });
    setTimeout(() => setCopiedEndpointUrl(false), 2000);
  };

  const handleDeleteDestination = (destId: string) => {
    deleteDestMutation.mutate(destId, {
      onSuccess: () => {
        toast({
          title: 'Destination Deleted',
          description: 'Forwarding target removed successfully.',
          type: 'success',
        });
      },
      onError: (err) => {
        toast({
          title: 'Failed to delete target',
          description: err.message,
          type: 'error',
        });
      },
    });
  };

  if (!currentEndpoint) {
    return null;
  }

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Endpoint Status Dashboard */}
      <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{currentEndpoint.name}</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono uppercase mt-0.5">
              {currentEndpoint.type} Endpoint
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleEndpointActive}
              className={`p-2 rounded-full transition-colors ${
                currentEndpoint.is_active
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
              title={currentEndpoint.is_active ? 'Pause Receiver Traffic' : 'Resume Receiver Traffic'}
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live URL Slug configuration display */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Receiver Endpoint URL
          </span>
          <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl">
            <span className="text-xs font-mono text-zinc-650 dark:text-zinc-300 truncate flex-1">
              /api/v1/receiver/t/{currentEndpoint.slug}
            </span>
            <button
              onClick={handleCopyEndpointUrl}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {copiedEndpointUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* HMAC Signatures Verification */}
        {currentEndpoint.secret && (
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">HMAC-SHA256 Signed</span>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                Signature headers matched mathematically using key:{' '}
                <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[9px]">
                  {currentEndpoint.secret.substring(0, 8)}...
                </code>
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Destinations / Parallel Fan-Out Forwarding Targets */}
      <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">Fan-Out Destinations</h4>
            <p className="text-[10px] text-zinc-400 leading-tight">Target URLs to forward received events in parallel.</p>
          </div>
          <Button
            onClick={() => setShowDestModal(true)}
            size="xs"
            variant="outline"
            className="flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Add Target
          </Button>
        </div>

        {destinations.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-50/20 dark:bg-zinc-950/20">
            <span className="text-xs text-zinc-400 font-medium">No forward destinations set.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="flex items-start justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-850"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        dest.method === 'POST'
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}
                    >
                      {dest.method}
                    </span>
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{dest.name}</h5>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1 truncate">{dest.url}</p>
                </div>
                <button
                  onClick={() => handleDeleteDestination(dest.id)}
                  className="text-zinc-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
