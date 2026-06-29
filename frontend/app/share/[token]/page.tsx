'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Activity, Copy, Check, Globe, Sliders,
  CheckCircle2, XCircle
} from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useSharedEndpoint, useSharedPayloads, useSharedDeliveries
} from '../../../services/webhook';
import { Card } from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { ThemeToggle } from '../../../components/ui/theme-toggle';

export default function ShareViewer() {
  const { toast } = useToast();
  const params = useParams();
  const token = (params?.token as string) || '';

  // API Shared State
  const { data: endpoint, isLoading: isEpLoading } = useSharedEndpoint(token);
  const { data: payloadsData, isLoading: isPayloadsLoading } = useSharedPayloads(token);
  
  const fetchedPayloads = payloadsData?.items || [];
  const [localPayloads, setLocalPayloads] = useState<any[]>([]);
  const [selectedPayloadId, setSelectedPayloadId] = useState<string>('');

  const [copiedEndpointUrl, setCopiedEndpointUrl] = useState(false);

  // Sync selected payload ID
  const allPayloads = React.useMemo(() => {
    const combined = [...localPayloads, ...fetchedPayloads];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  }, [localPayloads, fetchedPayloads]);

  const selectedPayload = allPayloads.find(p => p.id === selectedPayloadId) || allPayloads[0];

  // Fetch shared deliveries for selected payload
  const { data: deliveries = [] } = useSharedDeliveries(token, selectedPayload?.id || '');

  // Sync first selected payload
  useEffect(() => {
    if (allPayloads.length > 0 && !selectedPayloadId) {
      setSelectedPayloadId(allPayloads[0].id);
    }
  }, [allPayloads, selectedPayloadId]);

  // WebSocket Live Sharing Handler
  useEffect(() => {
    if (!endpoint?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/share/${token}/stream`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'payload') {
          setLocalPayloads(prev => [payload.data, ...prev]);
          toast({
            title: 'Shared Stream Update',
            description: `New ${payload.data.method} payload received live!`,
            type: 'success',
          });
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [endpoint?.id, token, toast]);

  if (isEpLoading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!endpoint) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-955 gap-2">
        <Typography variant="body1" className="font-bold text-rose-500" style={{ fontFamily: 'inherit' }}>
          Shared Link Expired or Invalid
        </Typography>
        <Typography variant="caption" className="text-zinc-500" style={{ fontFamily: 'inherit' }}>
          This session is no longer accessible.
        </Typography>
      </Box>
    );
  }

  const handleCopyEndpointUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const prefix = endpoint.type === 'temporary' ? 't' : 'w';
    const url = `${protocol}//${host}/${prefix}/${endpoint.slug}`;

    navigator.clipboard.writeText(url);
    setCopiedEndpointUrl(true);
    toast({
      title: 'Copied URL',
      description: 'Endpoint URL copied to clipboard',
      type: 'success',
    });
    setTimeout(() => setCopiedEndpointUrl(false), 2000);
  };

  return (
    <Box className="flex flex-col flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans" sx={{ minHeight: '100vh' }}>
      
      {/* Top Header */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-900 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <Box className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Box className="h-9 w-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-md">
              <svg className="h-5 w-5 text-white dark:text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Box>
            <Box className="flex items-center">
              <Typography variant="body1" className="font-bold tracking-tight text-zinc-900 dark:text-zinc-50" style={{ fontFamily: 'inherit' }}>
                Gull Share
              </Typography>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400 border border-amber-200/50">
                Read-Only Session
              </span>
            </Box>
          </Box>
          <Box className="flex items-center gap-4">
            <Typography variant="caption" className="text-zinc-400 font-medium hidden sm:inline" style={{ fontFamily: 'inherit' }}>
              Exposed to external support
            </Typography>
            <Box className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <ThemeToggle />
          </Box>
        </Box>
      </header>

      {/* Grid view */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Endpoint Info (4 Cols) */}
        <Box className="lg:col-span-4 space-y-6">
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
            <Box>
              <Typography variant="body1" className="font-bold text-zinc-900 dark:text-zinc-100" style={{ fontFamily: 'inherit' }}>
                {endpoint.name}
              </Typography>
              <Typography variant="caption" className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5 block" style={{ fontFamily: 'inherit' }}>
                {endpoint.type} Endpoint
              </Typography>
            </Box>

            <Box className="space-y-1.5">
              <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400 block" style={{ fontFamily: 'inherit' }}>
                Webhook Input URL
              </Typography>
              <Box className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono truncate flex-1 select-all">
                  {`${window.location.protocol}//${window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host}/${endpoint.type === 'temporary' ? 't' : 'w'}/${endpoint.slug}`}
                </span>
                <IconButton onClick={handleCopyEndpointUrl} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1" size="small">
                  {copiedEndpointUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </IconButton>
              </Box>
            </Box>

            <Box className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 flex items-start gap-2 text-zinc-650 dark:text-zinc-450">
              <Globe className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
              <Typography variant="caption" className="leading-relaxed" style={{ fontFamily: 'inherit' }}>
                You are viewing a live read-only session share. Settings and destination configuration actions are disabled in shared views.
              </Typography>
            </Box>
          </Card>
        </Box>

        {/* Middle Column: Payload list (4 Cols) */}
        <Box className="lg:col-span-4 space-y-4">
          <Typography variant="body2" className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2" style={{ fontFamily: 'inherit' }}>
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Live Stream
          </Typography>

          <Box className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {allPayloads.length === 0 ? (
              <Box className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-900/10">
                <Sliders className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <Typography variant="caption" className="text-zinc-500 font-semibold block" style={{ fontFamily: 'inherit' }}>
                  No payloads received yet...
                </Typography>
              </Box>
            ) : (
              allPayloads.map((payload) => {
                const isSelected = selectedPayloadId === payload.id;
                const receivedDateStr = new Date(payload.received_at).toLocaleTimeString();
                
                return (
                  <Box
                    key={payload.id}
                    onClick={() => setSelectedPayloadId(payload.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                        : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-850 dark:bg-zinc-900/60'
                    }`}
                  >
                    <Box className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        payload.method === 'POST' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {payload.method}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{receivedDateStr}</span>
                    </Box>

                    <div className="mt-2 text-xs truncate font-mono">
                      {payload.content_type || 'no content type'}
                    </div>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Right Column: Inspector (4 Cols) */}
        <Box className="lg:col-span-4">
          {selectedPayload ? (
            <Box className="space-y-6">
              <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
                <Typography variant="body2" className="font-bold text-sm text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-850 pb-2 block" style={{ fontFamily: 'inherit' }}>
                  Inspect Payload
                </Typography>

                <Box className="space-y-2">
                  <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400 block" style={{ fontFamily: 'inherit' }}>
                    Request Body
                  </Typography>
                  <pre className="text-[10px] font-mono p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 overflow-x-auto max-h-48 text-zinc-700 dark:text-zinc-300">
                    {selectedPayload.raw_body || '{}'}
                  </pre>
                </Box>

                <Box className="space-y-2">
                  <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400 block" style={{ fontFamily: 'inherit' }}>
                    Request Headers
                  </Typography>
                  <Box className="max-h-36 overflow-y-auto space-y-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl font-mono text-[10px]">
                    {Object.entries(selectedPayload.headers || {}).map(([k, v]) => (
                      <Box key={k} className="flex justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-1">
                        <span className="text-zinc-400 shrink-0 font-bold">{k}</span>
                        <span className="text-zinc-650 dark:text-zinc-300 truncate">{String(v)}</span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Card>

              {/* Delivery logs details */}
              <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
                <Typography variant="body2" className="font-bold text-sm text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-850 pb-2 block" style={{ fontFamily: 'inherit' }}>
                  Delivery Tracking
                </Typography>

                {deliveries.length === 0 ? (
                  <Typography variant="caption" className="text-center py-6 text-xs text-zinc-400 font-semibold italic block" style={{ fontFamily: 'inherit' }}>
                    No active forwardings enqueued.
                  </Typography>
                ) : (
                  <Box className="space-y-3">
                    {deliveries.map((delivery) => (
                      <Box key={delivery.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-850">
                        <Box className="flex items-center justify-between">
                          <Typography variant="caption" className="font-bold text-zinc-800 dark:text-zinc-200" style={{ fontFamily: 'inherit' }}>
                            Forward Target
                          </Typography>
                          <Box className="flex items-center gap-1.5">
                            {delivery.success ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> {delivery.status_code}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                <XCircle className="h-3.5 w-3.5" /> {delivery.status_code || 'Err'}
                              </span>
                            )}
                          </Box>
                        </Box>

                        <Box className="flex items-center justify-between text-[9px] text-zinc-400 mt-2 font-mono">
                          <span>Latency: {delivery.latency_ms}ms</span>
                          <span>Attempt: {delivery.attempt}</span>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>
            </Box>
          ) : (
            <Box className="h-64 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
              <Typography variant="caption" className="text-zinc-400 italic" style={{ fontFamily: 'inherit' }}>
                Select a payload to inspect headers and body structure.
              </Typography>
            </Box>
          )}
        </Box>

      </main>
    </Box>
  );
}
