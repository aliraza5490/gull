'use client';

import React from 'react';
import { Activity, Sliders, Search } from 'lucide-react';
import { useEndpoints, usePayloads } from '../../services/webhook';
import { useDashboardStore } from '../../store/dashboardStore';

export function PayloadStream() {
  const selectedWorkspaceId = useDashboardStore((s) => s.selectedWorkspaceId);
  const selectedEndpointId = useDashboardStore((s) => s.selectedEndpointId);
  
  const selectedPayloadId = useDashboardStore((s) => s.selectedPayloadId);
  const setSelectedPayloadId = useDashboardStore((s) => s.setSelectedPayloadId);

  const payloadSearch = useDashboardStore((s) => s.payloadSearch);
  const setPayloadSearch = useDashboardStore((s) => s.setPayloadSearch);

  const payloadMethodFilter = useDashboardStore((s) => s.payloadMethodFilter);
  const setPayloadMethodFilter = useDashboardStore((s) => s.setPayloadMethodFilter);

  const payloadSuccessFilter = useDashboardStore((s) => s.payloadSuccessFilter);
  const setPayloadSuccessFilter = useDashboardStore((s) => s.setPayloadSuccessFilter);

  const localPayloads = useDashboardStore((s) => s.localPayloads);
  
  const diffSelectMode = useDashboardStore((s) => s.diffSelectMode);
  const setDiffSelectMode = useDashboardStore((s) => s.setDiffSelectMode);

  const diffIds = useDashboardStore((s) => s.diffIds);
  const setDiffIds = useDashboardStore((s) => s.setDiffIds);
  const toggleDiffSelect = useDashboardStore((s) => s.toggleDiffSelect);

  const setShowDiffModal = useDashboardStore((s) => s.setShowDiffModal);

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

  // Combine fetched payloads with local WebSocket payloads to avoid reload flickers
  const allPayloads = React.useMemo(() => {
    const combined = [...localPayloads, ...fetchedPayloads];
    // De-duplicate by ID
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    // Sort by date received descending
    return unique.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  }, [localPayloads, fetchedPayloads]);

  // Sync first payload selection
  React.useEffect(() => {
    if (allPayloads.length > 0 && !selectedPayloadId) {
      setSelectedPayloadId(allPayloads[0].id);
    }
  }, [allPayloads, selectedPayloadId, setSelectedPayloadId]);

  if (!currentEndpoint) {
    return null;
  }

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Payload Stream
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDiffSelectMode(!diffSelectMode);
              setDiffIds([]);
            }}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
              diffSelectMode
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900'
                : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
            }`}
          >
            {diffSelectMode ? 'Cancel Diff' : 'Compare Payloads'}
          </button>
          {diffSelectMode && diffIds.length === 2 && (
            <button
              onClick={() => setShowDiffModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              View Diff
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search body query..."
            value={payloadSearch}
            onChange={(e) => setPayloadSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={payloadMethodFilter}
            onChange={(e) => setPayloadMethodFilter(e.target.value)}
            className="text-[11px] font-medium border border-zinc-200 dark:border-zinc-850 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
          >
            <option value="">All Methods</option>
            <option value="POST">POST</option>
            <option value="GET">GET</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select
            value={payloadSuccessFilter === undefined ? '' : String(payloadSuccessFilter)}
            onChange={(e) => setPayloadSuccessFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="text-[11px] font-medium border border-zinc-200 dark:border-zinc-850 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 flex-1"
          >
            <option value="">All Statuses</option>
            <option value="true">Successful Deliveries</option>
            <option value="false">Failed / Retrying</option>
          </select>
        </div>
      </div>

      {/* Payloads List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {allPayloads.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-900/10">
            <Sliders className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 font-semibold">Waiting for incoming webhooks...</p>
            <p className="text-[10px] text-zinc-400 mt-1">Send requests to the URL above to inspect payloads.</p>
          </div>
        ) : (
          allPayloads.map((payload) => {
            const isSelected = selectedPayloadId === payload.id;
            const isDiffChecked = diffIds.includes(payload.id);
            const receivedDateStr = new Date(payload.received_at).toLocaleTimeString();

            return (
              <div
                key={payload.id}
                onClick={() => {
                  if (diffSelectMode) {
                    toggleDiffSelect(payload.id);
                  } else {
                    setSelectedPayloadId(payload.id);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected && !diffSelectMode
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950 shadow-sm'
                    : isDiffChecked
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-zinc-900 dark:text-white'
                    : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-850 dark:bg-zinc-900/60'
                }`}
              >
                {/* Schema Drift Indicator Ribbon */}
                {payload.is_drifted && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl">
                    DRIFT
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {diffSelectMode && (
                      <input
                        type="checkbox"
                        checked={isDiffChecked}
                        onChange={() => toggleDiffSelect(payload.id)}
                        className="h-3.5 w-3.5 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isSelected && !diffSelectMode
                          ? 'bg-white/20 text-white dark:bg-zinc-200 dark:text-zinc-900'
                          : payload.method === 'POST'
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}
                    >
                      {payload.method}
                    </span>
                    <span
                      className={`text-xs font-mono truncate max-w-[120px] ${
                        isSelected && !diffSelectMode ? 'text-white dark:text-zinc-950' : 'text-zinc-500'
                      }`}
                    >
                      ID: {payload.id.substring(0, 8)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] ${
                      isSelected && !diffSelectMode
                        ? 'text-zinc-200 dark:text-zinc-500'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {receivedDateStr}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
