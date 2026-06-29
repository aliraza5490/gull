'use client';

import React from 'react';
import { Activity, Sliders, Search as SearchIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
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
    <Box className="lg:col-span-4 space-y-4">
      <Box className="flex items-center justify-between">
        <Typography variant="body2" className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2" style={{ fontFamily: 'inherit' }}>
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Payload Stream
        </Typography>
        <Box className="flex items-center gap-2">
          <Button
            onClick={() => {
              setDiffSelectMode(!diffSelectMode);
              setDiffIds([]);
            }}
            variant="outlined"
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors normal-case`}
            style={{
              textTransform: 'none',
              padding: '4px 10px',
              fontSize: '11px',
              borderRadius: '8px',
              backgroundColor: diffSelectMode ? 'var(--zinc-100)' : 'transparent',
              borderColor: diffSelectMode ? 'var(--zinc-300)' : 'var(--zinc-200)'
            }}
            sx={{ color: 'inherit' }}
          >
            {diffSelectMode ? 'Cancel Diff' : 'Compare Payloads'}
          </Button>
          {diffSelectMode && diffIds.length === 2 && (
            <Button
              onClick={() => setShowDiffModal(true)}
              variant="contained"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors normal-case"
              style={{ textTransform: 'none', padding: '4px 10px', fontSize: '11px', borderRadius: '8px' }}
            >
              View Diff
            </Button>
          )}
        </Box>
      </Box>

      {/* Search & Filters */}
      <Box className="space-y-2">
        <TextField
          placeholder="Search body query..."
          value={payloadSearch}
          onChange={(e) => setPayloadSearch(e.target.value)}
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="h-4 w-4 text-zinc-400" />
                </InputAdornment>
              ),
              style: { borderRadius: '12px', fontSize: '12px' }
            }
          }}
          sx={{
            backgroundColor: 'var(--white)',
            '.dark &': { backgroundColor: 'var(--zinc-900)' },
            borderRadius: '12px'
          }}
        />
        <Box className="flex gap-2">
          <FormControl size="small" style={{ minWidth: '110px' }}>
            <Select
              value={payloadMethodFilter || ''}
              onChange={(e) => setPayloadMethodFilter(e.target.value as string)}
              displayEmpty
              className="bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400"
              style={{ fontSize: '11px', borderRadius: '8px' }}
            >
              <MenuItem value="" style={{ fontSize: '11px' }}>All Methods</MenuItem>
              <MenuItem value="POST" style={{ fontSize: '11px' }}>POST</MenuItem>
              <MenuItem value="GET" style={{ fontSize: '11px' }}>GET</MenuItem>
              <MenuItem value="PUT" style={{ fontSize: '11px' }}>PUT</MenuItem>
              <MenuItem value="PATCH" style={{ fontSize: '11px' }}>PATCH</MenuItem>
              <MenuItem value="DELETE" style={{ fontSize: '11px' }}>DELETE</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" className="flex-1">
            <Select
              value={payloadSuccessFilter === undefined ? '' : String(payloadSuccessFilter)}
              onChange={(e) => setPayloadSuccessFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
              displayEmpty
              className="bg-white dark:bg-zinc-900 text-zinc-655 dark:text-zinc-400"
              style={{ fontSize: '11px', borderRadius: '8px' }}
            >
              <MenuItem value="" style={{ fontSize: '11px' }}>All Statuses</MenuItem>
              <MenuItem value="true" style={{ fontSize: '11px' }}>Successful Deliveries</MenuItem>
              <MenuItem value="false" style={{ fontSize: '11px' }}>Failed / Retrying</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Payloads List */}
      <Box className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {allPayloads.length === 0 ? (
          <Box className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-900/10">
            <Sliders className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
            <Typography variant="caption" className="text-zinc-550 font-semibold block" style={{ fontFamily: 'inherit' }}>
              Waiting for incoming webhooks...
            </Typography>
            <Typography variant="caption" className="text-[10px] text-zinc-400 mt-1 block" style={{ fontFamily: 'inherit' }}>
              Send requests to the URL above to inspect payloads.
            </Typography>
          </Box>
        ) : (
          allPayloads.map((payload) => {
            const isSelected = selectedPayloadId === payload.id;
            const isDiffChecked = diffIds.includes(payload.id);
            const receivedDateStr = new Date(payload.received_at).toLocaleTimeString();

            return (
              <Box
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
                  <Box className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl">
                    DRIFT
                  </Box>
                )}

                <Box className="flex items-center justify-between">
                  <Box className="flex items-center gap-2">
                    {diffSelectMode && (
                      <Checkbox
                        size="small"
                        checked={isDiffChecked}
                        onChange={() => toggleDiffSelect(payload.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ padding: 0 }}
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
                        isSelected && !diffSelectMode ? 'text-white dark:text-zinc-955' : 'text-zinc-500'
                      }`}
                    >
                      ID: {payload.id.substring(0, 8)}
                    </span>
                  </Box>
                  <span
                    className={`text-[10px] ${
                      isSelected && !diffSelectMode
                        ? 'text-zinc-200 dark:text-zinc-500'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {receivedDateStr}
                  </span>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
