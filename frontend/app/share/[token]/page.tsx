'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Activity, ShieldCheck, Copy, Check, Globe, Sliders, Search,
  CheckCircle2, XCircle
} from 'lucide-react';
import {
  useSharedEndpoint, useSharedPayloads, useSharedDeliveries
} from '../../services/webhook';
import { Card } from '../../components/ui/card';
import { useToast } from '../../hooks/use-toast';
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

  // WebSocket Live Streaming
  useEffect(() => {
    if (!endpoint?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/endpoints/${endpoint.id}/stream`;
    
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
  }, [endpoint?.id]);

  if (isEpLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Activity className="h-8 w-8 text-zinc-600 animate-spin" />
        <span className="text-xs text-zinc-500 mt-2 font-medium">Loading Shared Session...</span>
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm font-bold text-rose-500">Shared Link Expired or Invalid</span>
        <span className="text-xs text-zinc-500 mt-1">This session is no longer accessible.</span>
      </div>
    );
  }

  const handleCopyEndpointUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const prefix = endpoint.type === 'temporary' ? 't' : 'w';
    const url = `${protocol}//${host}/${prefix}/${endpoint.slug}`;

    navigator.clipboard.writeText(url);
    setCopiedEndpointUrl(true);
    toast({ title: 'Copied URL', type: 'success' });
    setTimeout(() => setCopiedEndpointUrl(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans">
      
      {/* Top Header */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-900 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-md">
              <svg className="h-5 w-5 text-white dark:text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gull Share</span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50">
                Read-Only Session
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Exposed to external support</span>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Grid view */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Endpoint Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{endpoint.name}</h3>
              <p className="text-[10px] text-zinc-400 font-mono uppercase mt-0.5">
                {endpoint.type} Endpoint
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Webhook Input URL</span>
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono truncate flex-1 select-all">
                  {`${window.location.protocol}//${window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host}/${endpoint.type === 'temporary' ? 't' : 'w'}/${endpoint.slug}`}
                </span>
                <button onClick={handleCopyEndpointUrl} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {copiedEndpointUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 flex items-start gap-2 text-zinc-650 dark:text-zinc-450 text-[11px]">
              <Globe className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                You are viewing a live read-only session share. Settings and destination configuration actions are disabled in shared views.
              </p>
            </div>
          </Card>
        </div>

        {/* Middle Column: Payload list (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-150 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Live Stream
          </h4>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {allPayloads.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-900/10">
                <Sliders className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-semibold">No payloads received yet...</p>
              </div>
            ) : (
              allPayloads.map((payload) => {
                const isSelected = selectedPayloadId === payload.id;
                const receivedDateStr = new Date(payload.received_at).toLocaleTimeString();
                
                return (
                  <div
                    key={payload.id}
                    onClick={() => setSelectedPayloadId(payload.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                        : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-850 dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        payload.method === 'POST' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {payload.method}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{receivedDateStr}</span>
                    </div>

                    <div className="mt-2 text-xs truncate font-mono">
                      {payload.content_type || 'no content type'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Inspector (4 Cols) */}
        <div className="lg:col-span-4">
          {selectedPayload ? (
            <div className="space-y-6">
              <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-150 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  Inspect Payload
                </h4>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Request Body</span>
                  <pre className="text-[10px] font-mono p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 overflow-x-auto max-h-48 text-zinc-700 dark:text-zinc-300">
                    {selectedPayload.raw_body || '{}'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Request Headers</span>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl font-mono text-[10px]">
                    {Object.entries(selectedPayload.headers || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-1">
                        <span className="text-zinc-400 shrink-0 font-bold">{k}</span>
                        <span className="text-zinc-650 dark:text-zinc-300 truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Delivery logs details */}
              <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-150 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  Delivery Tracking
                </h4>

                {deliveries.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-400 font-semibold italic">
                    No active forwardings enqueued.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveries.map((delivery) => (
                      <div key={delivery.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-850">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Forward Target
                          </span>
                          <div className="flex items-center gap-1.5">
                            {delivery.success ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> {delivery.status_code}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                <XCircle className="h-3.5 w-3.5" /> {delivery.status_code || 'Err'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-2 font-mono">
                          <span>Latency: {delivery.latency_ms}ms</span>
                          <span>Attempt: {delivery.attempt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
              <span className="text-xs text-zinc-400 italic">Select a payload to inspect headers and body structure.</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
