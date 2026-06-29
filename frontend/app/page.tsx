'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Plus, ShieldAlert } from 'lucide-react';
import { useWorkspaces, useEndpoints } from '../services/webhook';
import { useDashboardStore } from '../store/dashboardStore';
import { Header } from '../components/dashboard/header';
import { EndpointSidebar } from '../components/dashboard/endpoint-sidebar';
import { PayloadStream } from '../components/dashboard/payload-stream';
import { PayloadInspector } from '../components/dashboard/payload-inspector';
import { DashboardModals } from '../components/dashboard/dashboard-modals';
import { AuthScreen } from '../components/auth/auth-screen';
import { useToast } from '../hooks/use-toast';

export function DashboardMain({ user, onLogout }: { user: { id: string; email: string }; onLogout: () => void }) {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const selectedWorkspaceId = useDashboardStore((s) => s.selectedWorkspaceId);
  const setSelectedWorkspaceId = useDashboardStore((s) => s.setSelectedWorkspaceId);
  const selectedEndpointId = useDashboardStore((s) => s.selectedEndpointId);
  const setSelectedEndpointId = useDashboardStore((s) => s.setSelectedEndpointId);

  const setLocalPayloads = useDashboardStore((s) => s.setLocalPayloads);
  const addLocalPayload = useDashboardStore((s) => s.addLocalPayload);

  // Load Workspaces
  const { data: workspaces = [] } = useWorkspaces();

  // Sync selected workspace state
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId, setSelectedWorkspaceId]);

  // Load Endpoints
  const { data: endpointsData } = useEndpoints(selectedWorkspaceId, 1, 100);
  const endpoints = endpointsData?.items || [];
  const currentEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  // Sync selected endpoint state
  useEffect(() => {
    if (endpoints.length > 0) {
      const exists = endpoints.some((e) => e.id === selectedEndpointId);
      if (!selectedEndpointId || !exists) {
        setSelectedEndpointId(endpoints[0].id);
      }
    } else {
      setSelectedEndpointId('');
    }
  }, [endpoints, selectedEndpointId, setSelectedEndpointId]);

  // WebSocket Live Streaming Handler
  useEffect(() => {
    const endpointIdStr = currentEndpoint?.id || '';
    if (!endpointIdStr) return;

    // Reset local payloads when switching endpoints
    setLocalPayloads([]);

    // Establish WebSocket Connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/endpoints/${endpointIdStr}/stream`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'payload') {
          // Add to local payload list via Zustand action
          addLocalPayload(payload.data);
          toast({
            title: 'Webhook Received!',
            description: `New ${payload.data.method} payload received on slug: ${currentEndpoint?.slug}`,
            type: 'success',
          });
        }
      } catch (err) {
        console.error('Error parsing live payload stream message', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error', err);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [currentEndpoint?.id, addLocalPayload, setLocalPayloads, toast, currentEndpoint?.slug]);

  const setShowEndpointModal = useDashboardStore((s) => s.setShowEndpointModal);
  const showEndpointCenterState = endpoints.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans font-medium transition-colors">
      <Header user={user} onLogout={onLogout} />

      {showEndpointCenterState ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex items-center justify-center">
          <div className="max-w-md w-full p-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-sm shadow-md space-y-6">
            <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-2xl flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-550 shadow-sm border border-zinc-200/50 dark:border-zinc-800">
              <ShieldAlert className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">No Webhook Endpoint</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Please register a webhook endpoint in this workspace to start receiving and orchestrating events.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowEndpointModal(true)}
                className="flex items-center gap-2 primary-gradient-btn hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" /> Register First Endpoint
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <EndpointSidebar />
          <PayloadStream />
          <PayloadInspector />
        </main>
      )}

      {/* FOOTER BAR */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/20 py-6 mt-16 text-center text-xs text-zinc-500">
        Gull Webhook Orchestration Platform &copy; {new Date().getFullYear()}. All rights reserved.
      </footer>

      <DashboardModals />
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Initial Auth validation check
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsCheckingAuth(false);

    // Global listener for unauthorized calls responses
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      toast({
        title: 'Session Expired',
        description: 'Please login again to continue.',
        type: 'error',
      });
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      type: 'info',
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Activity className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <AuthScreen
        onAuthSuccess={(t, u) => {
          setToken(t);
          setUser(u);
        }}
      />
    );
  }

  return <DashboardMain user={user} onLogout={handleLogout} />;
}
