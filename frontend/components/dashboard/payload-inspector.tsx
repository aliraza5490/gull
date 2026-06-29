'use client';

import React from 'react';
import { Sliders, RefreshCw, Code, Trash2, ArrowUpRight } from 'lucide-react';
import { useEndpoints, usePayloads, useDeliveries, useReplayPayload } from '../../services/webhook';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

export function PayloadInspector() {
  const { toast } = useToast();

  const selectedWorkspaceId = useDashboardStore((s) => s.selectedWorkspaceId);
  const selectedEndpointId = useDashboardStore((s) => s.selectedEndpointId);
  const selectedPayloadId = useDashboardStore((s) => s.selectedPayloadId);

  const payloadSearch = useDashboardStore((s) => s.payloadSearch);
  const payloadMethodFilter = useDashboardStore((s) => s.payloadMethodFilter);
  const payloadSuccessFilter = useDashboardStore((s) => s.payloadSuccessFilter);
  const localPayloads = useDashboardStore((s) => s.localPayloads);

  const setIsEditingReplay = useDashboardStore((s) => s.setIsEditingReplay);
  const setReplayCustomBody = useDashboardStore((s) => s.setReplayCustomBody);

  // Queries
  const { data: endpointsData } = useEndpoints(selectedWorkspaceId, 1, 100);
  const endpoints = endpointsData?.items || [];
  const currentEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];
  
  const endpointIdStr = currentEndpoint?.id || '';

  const { data: payloadsData } = usePayloads(endpointIdStr, 1, 50, {
    search: payloadSearch,
    method: payloadMethodFilter,
    success: payloadSuccessFilter,
  });
  const fetchedPayloads = payloadsData?.items || [];

  const allPayloads = React.useMemo(() => {
    const combined = [...localPayloads, ...fetchedPayloads];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    return unique.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  }, [localPayloads, fetchedPayloads]);

  const selectedPayload = allPayloads.find((p) => p.id === selectedPayloadId) || allPayloads[0];

  const { data: deliveries = [], refetch: refetchDeliveries } = useDeliveries(
    endpointIdStr,
    selectedPayload?.id || ''
  );

  const replayPayloadMutation = useReplayPayload(endpointIdStr);

  const handleReplayPayload = (destinationId?: string) => {
    if (!selectedPayload) return;
    replayPayloadMutation.mutate(
      {
        payloadId: selectedPayload.id,
        destinationId,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Replay Dispatched',
            description: 'Webhook has been enqueued for redelivery.',
            type: 'success',
          });
          setTimeout(() => refetchDeliveries(), 1000);
        },
        onError: (err) => {
          toast({
            title: 'Replay Failed',
            description: err.message,
            type: 'error',
          });
        },
      }
    );
  };

  if (!currentEndpoint) {
    return null;
  }

  return (
    <div className="lg:col-span-4">
      {selectedPayload ? (
        <div className="space-y-6">
          {/* Detailed Inspector Card */}
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Inspect Payload</h4>
                <p className="text-[10px] text-zinc-400">Detailed headers and body mapping.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleReplayPayload()}
                  size="xs"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Replay
                </Button>
                <Button
                  onClick={() => {
                    setReplayCustomBody(selectedPayload.raw_body);
                    setIsEditingReplay(true);
                  }}
                  size="xs"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Code className="h-3.5 w-3.5" /> Edit & Replay
                </Button>
              </div>
            </div>

            {/* Headers Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Request Body</span>
              <pre className="text-[10px] font-mono p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-x-auto max-h-48">
                {selectedPayload.raw_body || '{}'}
              </pre>
            </div>

            {/* Headers Inspectors */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Request Headers</span>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl font-mono text-[10px]">
                {Object.entries(selectedPayload.headers || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-1">
                    <span className="text-zinc-400 shrink-0 font-bold">{k}</span>
                    <span className="text-zinc-600 dark:text-zinc-300 truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Delivery logs details */}
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-sm shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-850 pb-3">
              Delivery Tracking & Audit Logs
            </h4>

            {deliveries.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 font-semibold italic">
                No active forwardings dispatched yet. Make sure active destinations are set.
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => {
                  const dest = (selectedPayload as any).destinations?.find((d: any) => d.id === delivery.destination_id);
                  const destName = dest ? dest.name : 'Unknown Destination';

                  return (
                    <div
                      key={delivery.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{destName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            delivery.success
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {delivery.success ? 'Success' : `Failed (${delivery.status_code || 'Err'})`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono">
                        <div>Latency: {delivery.latency_ms}ms</div>
                        <div className="text-right">Attempt: #{delivery.attempt}</div>
                      </div>

                      {delivery.error_message && (
                        <div className="mt-2 text-[9px] font-mono text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded border border-rose-100/50 dark:border-rose-900/40">
                          {delivery.error_message}
                        </div>
                      )}

                      {delivery.response_body && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[9px] text-zinc-400 font-semibold">Response Body</span>
                          <pre className="text-[9px] font-mono p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded overflow-x-auto max-h-24">
                            {delivery.response_body}
                          </pre>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleReplayPayload(delivery.destination_id)}
                          className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
                        >
                          Retry this target <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card className="p-12 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-center space-y-3">
          <Sliders className="h-10 w-10 text-zinc-400 mx-auto animate-pulse" />
          <p className="text-xs text-zinc-400 font-medium italic">
            Select a payload to begin deep inspection.
          </p>
        </Card>
      )}
    </div>
  );
}
