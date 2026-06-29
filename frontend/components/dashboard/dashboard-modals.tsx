'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  useCreateWorkspace,
  useCreateEndpoint,
  useCreateDestination,
  useReplayPayload,
  useEndpoints,
  usePayloads,
} from '../../services/webhook';
import { useToast } from '../../hooks/use-toast';
import { Dialog } from '../ui/dialog';
import { DiffViewer } from '../webhooks/diff-viewer';

export function DashboardModals() {
  const { toast } = useToast();

  const selectedWorkspaceId = useDashboardStore((s) => s.selectedWorkspaceId);
  const setSelectedWorkspaceId = useDashboardStore((s) => s.setSelectedWorkspaceId);
  const selectedEndpointId = useDashboardStore((s) => s.selectedEndpointId);
  const setSelectedEndpointId = useDashboardStore((s) => s.setSelectedEndpointId);

  // Modal visibilities
  const showWorkspaceModal = useDashboardStore((s) => s.showWorkspaceModal);
  const setShowWorkspaceModal = useDashboardStore((s) => s.setShowWorkspaceModal);
  const newWorkspaceName = useDashboardStore((s) => s.newWorkspaceName);
  const setNewWorkspaceName = useDashboardStore((s) => s.setNewWorkspaceName);

  const showEndpointModal = useDashboardStore((s) => s.showEndpointModal);
  const setShowEndpointModal = useDashboardStore((s) => s.setShowEndpointModal);
  const newEndpointName = useDashboardStore((s) => s.newEndpointName);
  const setNewEndpointName = useDashboardStore((s) => s.setNewEndpointName);
  const newEndpointSlug = useDashboardStore((s) => s.newEndpointSlug);
  const setNewEndpointSlug = useDashboardStore((s) => s.setNewEndpointSlug);
  const newEndpointType = useDashboardStore((s) => s.newEndpointType);
  const setNewEndpointType = useDashboardStore((s) => s.setNewEndpointType);
  const newEndpointSecret = useDashboardStore((s) => s.newEndpointSecret);
  const setNewEndpointSecret = useDashboardStore((s) => s.setNewEndpointSecret);

  const showDestModal = useDashboardStore((s) => s.showDestModal);
  const setShowDestModal = useDashboardStore((s) => s.setShowDestModal);
  const destName = useDashboardStore((s) => s.destName);
  const setDestName = useDashboardStore((s) => s.setDestName);
  const destUrl = useDashboardStore((s) => s.destUrl);
  const setDestUrl = useDashboardStore((s) => s.setDestUrl);
  const destMethod = useDashboardStore((s) => s.destMethod);
  const setDestMethod = useDashboardStore((s) => s.setDestMethod);
  const destAuthType = useDashboardStore((s) => s.destAuthType);
  const setDestAuthType = useDashboardStore((s) => s.setDestAuthType);
  const destToken = useDashboardStore((s) => s.destToken);
  const setDestToken = useDashboardStore((s) => s.setDestToken);
  const destUser = useDashboardStore((s) => s.destUser);
  const setDestUser = useDashboardStore((s) => s.setDestUser);
  const destPass = useDashboardStore((s) => s.destPass);
  const setDestPass = useDashboardStore((s) => s.setDestPass);
  const destSignatureSecret = useDashboardStore((s) => s.destSignatureSecret);
  const setDestSignatureSecret = useDashboardStore((s) => s.setDestSignatureSecret);
  const destHeadersInject = useDashboardStore((s) => s.destHeadersInject);
  const setDestHeadersInject = useDashboardStore((s) => s.setDestHeadersInject);
  const destHeadersStrip = useDashboardStore((s) => s.destHeadersStrip);
  const setDestHeadersStrip = useDashboardStore((s) => s.setDestHeadersStrip);
  const destTransformTemplate = useDashboardStore((s) => s.destTransformTemplate);
  const setDestTransformTemplate = useDashboardStore((s) => s.setDestTransformTemplate);

  const showDiffModal = useDashboardStore((s) => s.showDiffModal);
  const setShowDiffModal = useDashboardStore((s) => s.setShowDiffModal);
  const diffIds = useDashboardStore((s) => s.diffIds);

  const isEditingReplay = useDashboardStore((s) => s.isEditingReplay);
  const setIsEditingReplay = useDashboardStore((s) => s.setIsEditingReplay);
  const replayCustomBody = useDashboardStore((s) => s.replayCustomBody);
  const setReplayCustomBody = useDashboardStore((s) => s.setReplayCustomBody);

  const payloadSearch = useDashboardStore((s) => s.payloadSearch);
  const payloadMethodFilter = useDashboardStore((s) => s.payloadMethodFilter);
  const payloadSuccessFilter = useDashboardStore((s) => s.payloadSuccessFilter);
  const localPayloads = useDashboardStore((s) => s.localPayloads);

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

  // Mutations
  const createWorkspaceMutation = useCreateWorkspace();
  const createEndpointMutation = useCreateEndpoint(selectedWorkspaceId);
  const createDestMutation = useCreateDestination(endpointIdStr);
  const replayPayloadMutation = useReplayPayload(endpointIdStr);

  // Handlers
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    createWorkspaceMutation.mutate(
      { name: newWorkspaceName.trim() },
      {
        onSuccess: (data) => {
          toast({
            title: 'Workspace Created',
            description: `Workspace "${data.name}" has been created successfully.`,
            type: 'success',
          });
          setSelectedWorkspaceId(data.id);
          setSelectedEndpointId('');
          setNewWorkspaceName('');
          setShowWorkspaceModal(false);
        },
        onError: (err: any) => {
          toast({
            title: 'Error creating workspace',
            description: err.message || 'Failed to create workspace.',
            type: 'error',
          });
        },
      }
    );
  };

  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    createEndpointMutation.mutate(
      {
        name: newEndpointName,
        slug: newEndpointSlug,
        type: newEndpointType,
        secret: newEndpointSecret || undefined,
      },
      {
        onSuccess: (newEp) => {
          toast({
            title: 'Endpoint Created',
            description: `Endpoint "${newEp.name}" registered successfully.`,
            type: 'success',
          });
          setSelectedEndpointId(newEp.id);
          setShowEndpointModal(false);
          setNewEndpointName('');
          setNewEndpointSlug('');
          setNewEndpointSecret('');
        },
        onError: (err) => {
          toast({
            title: 'Error creating endpoint',
            description: err.message,
            type: 'error',
          });
        },
      }
    );
  };

  const handleCreateDestination = (e: React.FormEvent) => {
    e.preventDefault();
    let inject = {};
    let strip = [];
    try {
      inject = JSON.parse(destHeadersInject);
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Headers to Inject must be a valid JSON object',
        type: 'error',
      });
      return;
    }
    try {
      strip = JSON.parse(destHeadersStrip);
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Headers to Strip must be a valid JSON array',
        type: 'error',
      });
      return;
    }

    const auth_config: any = {};
    if (destAuthType === 'Bearer') auth_config.token = destToken;
    if (destAuthType === 'Basic') {
      auth_config.username = destUser;
      auth_config.password = destPass;
    }
    if (destAuthType === 'CustomSignature') {
      auth_config.secret = destSignatureSecret;
    }

    createDestMutation.mutate(
      {
        name: destName,
        url: destUrl,
        method: destMethod,
        auth_type: destAuthType,
        auth_config,
        headers_to_inject: inject,
        headers_to_strip: strip,
        payload_transform_template: destTransformTemplate || null,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Destination Added',
            description: 'Webhooks will now be forwarded to this new target.',
            type: 'success',
          });
          setShowDestModal(false);
          setDestName('');
          setDestUrl('');
          setDestTransformTemplate('');
        },
        onError: (err) => {
          toast({
            title: 'Failed to add target',
            description: err.message,
            type: 'error',
          });
        },
      }
    );
  };

  const handleReplayPayload = () => {
    const selectedPayload = allPayloads.find((p) => p.id === useDashboardStore.getState().selectedPayloadId) || allPayloads[0];
    if (!selectedPayload) return;
    replayPayloadMutation.mutate(
      {
        payloadId: selectedPayload.id,
        customBody: replayCustomBody,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Replay Dispatched',
            description: 'Webhook custom payload has been enqueued for redelivery.',
            type: 'success',
          });
          setIsEditingReplay(false);
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

  return (
    <>
      {/* CREATE WORKSPACE MODAL */}
      <Dialog
        isOpen={showWorkspaceModal}
        onClose={() => {
          setShowWorkspaceModal(false);
          setNewWorkspaceName('');
        }}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-2">
          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Workspace Name
            </Typography>
            <TextField
              required
              placeholder="e.g. Acme Corp Dev"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px' }
                }
              }}
            />
          </Box>

          <Box className="flex justify-end gap-2 pt-3">
            <Button
              onClick={() => {
                setShowWorkspaceModal(false);
                setNewWorkspaceName('');
              }}
              variant="outlined"
              size="small"
              style={{ textTransform: 'none', borderRadius: '8px' }}
              sx={{ color: 'inherit' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={createWorkspaceMutation.isPending}
              style={{ textTransform: 'none', borderRadius: '8px' }}
            >
              {createWorkspaceMutation.isPending ? <CircularProgress size={16} color="inherit" /> : 'Create'}
            </Button>
          </Box>
        </form>
      </Dialog>

      {/* CREATE ENDPOINT MODAL */}
      <Dialog
        isOpen={showEndpointModal}
        onClose={() => setShowEndpointModal(false)}
        title="Register Webhook Endpoint"
      >
        <form onSubmit={handleCreateEndpoint} className="space-y-4 pt-2">
          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Endpoint Friendly Name
            </Typography>
            <TextField
              required
              placeholder="My Stripe listener"
              value={newEndpointName}
              onChange={(e) => setNewEndpointName(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px' }
                }
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Slug / Custom Path
            </Typography>
            <TextField
              required
              placeholder="stripe-checkout"
              value={newEndpointSlug}
              onChange={(e) => setNewEndpointSlug(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px' }
                }
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Endpoint Type
            </Typography>
            <RadioGroup
              row
              value={newEndpointType}
              onChange={(e) => setNewEndpointType(e.target.value as any)}
            >
              <FormControlLabel
                value="persistent"
                control={<Radio size="small" />}
                label={<Typography variant="caption" style={{ fontFamily: 'inherit' }}>Persistent slug</Typography>}
              />
              <FormControlLabel
                value="temporary"
                control={<Radio size="small" />}
                label={<Typography variant="caption" style={{ fontFamily: 'inherit' }}>Temporary (24hr expiry)</Typography>}
              />
            </RadioGroup>
          </Box>

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              HMAC Validation Secret (Optional)
            </Typography>
            <TextField
              placeholder="secret-hmac-key"
              value={newEndpointSecret}
              onChange={(e) => setNewEndpointSecret(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px' }
                }
              }}
            />
          </Box>

          <Box className="flex justify-end gap-2 pt-3">
            <Button
              onClick={() => setShowEndpointModal(false)}
              variant="outlined"
              size="small"
              style={{ textTransform: 'none', borderRadius: '8px' }}
              sx={{ color: 'inherit' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={createEndpointMutation.isPending}
              style={{ textTransform: 'none', borderRadius: '8px' }}
            >
              {createEndpointMutation.isPending ? <CircularProgress size={16} color="inherit" /> : 'Register'}
            </Button>
          </Box>
        </form>
      </Dialog>

      {/* ADD DESTINATION MODAL */}
      <Dialog
        isOpen={showDestModal}
        onClose={() => setShowDestModal(false)}
        title="Add Forwarding Target"
      >
        <form onSubmit={handleCreateDestination} className="space-y-4 pt-2">
          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Friendly Name
            </Typography>
            <TextField
              required
              placeholder="Local Rails backend"
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px' }
                }
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Target Forward URL
            </Typography>
            <TextField
              type="url"
              required
              placeholder="http://localhost:3000/webhooks"
              value={destUrl}
              onChange={(e) => setDestUrl(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px' }
                }
              }}
            />
          </Box>

          <Box className="grid grid-cols-2 gap-3">
            <Box className="flex flex-col gap-1 w-full">
              <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
                HTTP Method
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={destMethod}
                  onChange={(e) => setDestMethod(e.target.value as string)}
                  style={{ fontSize: '12px', borderRadius: '12px' }}
                >
                  <MenuItem value="POST" style={{ fontSize: '12px' }}>POST</MenuItem>
                  <MenuItem value="PUT" style={{ fontSize: '12px' }}>PUT</MenuItem>
                  <MenuItem value="PATCH" style={{ fontSize: '12px' }}>PATCH</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box className="flex flex-col gap-1 w-full">
              <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
                Authentication Inject
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={destAuthType}
                  onChange={(e) => setDestAuthType(e.target.value as string)}
                  style={{ fontSize: '12px', borderRadius: '12px' }}
                >
                  <MenuItem value="None" style={{ fontSize: '12px' }}>None</MenuItem>
                  <MenuItem value="Bearer" style={{ fontSize: '12px' }}>Bearer Token</MenuItem>
                  <MenuItem value="Basic" style={{ fontSize: '12px' }}>Basic Auth</MenuItem>
                  <MenuItem value="CustomSignature" style={{ fontSize: '12px' }}>Custom Signature HMAC</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Conditional Auth Inputs */}
          {destAuthType === 'Bearer' && (
            <Box className="flex flex-col gap-1 w-full">
              <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
                Bearer Token
              </Typography>
              <TextField
                type="password"
                placeholder="eyJhbGciOi..."
                value={destToken}
                onChange={(e) => setDestToken(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    style: { borderRadius: '12px', fontSize: '12px' }
                  }
                }}
              />
            </Box>
          )}

          {destAuthType === 'Basic' && (
            <Box className="grid grid-cols-2 gap-3">
              <Box className="flex flex-col gap-1 w-full">
                <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
                  Username
                </Typography>
                <TextField
                  placeholder="admin"
                  value={destUser}
                  onChange={(e) => setDestUser(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      style: { borderRadius: '12px', fontSize: '12px' }
                    }
                  }}
                />
              </Box>
              <Box className="flex flex-col gap-1 w-full">
                <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
                  Password
                </Typography>
                <TextField
                  type="password"
                  placeholder="password"
                  value={destPass}
                  onChange={(e) => setDestPass(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      style: { borderRadius: '12px', fontSize: '12px' }
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {destAuthType === 'CustomSignature' && (
            <Box className="flex flex-col gap-1 w-full">
              <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
                HMAC Signature Secret Key
              </Typography>
              <TextField
                type="password"
                placeholder="my-signing-secret"
                value={destSignatureSecret}
                onChange={(e) => setDestSignatureSecret(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  input: {
                    style: { borderRadius: '12px', fontSize: '12px' }
                  }
                }}
              />
            </Box>
          )}

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Inject Headers (JSON Object)
            </Typography>
            <TextField
              placeholder='{"X-My-Header": "value"}'
              value={destHeadersInject}
              onChange={(e) => setDestHeadersInject(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }
                }
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Strip Headers (JSON Array)
            </Typography>
            <TextField
              placeholder='["Authorization", "User-Agent"]'
              value={destHeadersStrip}
              onChange={(e) => setDestHeadersStrip(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }
                }
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Payload Transformation Template (e.g. Map keys)
            </Typography>
            <TextField
              placeholder='{"id": "{{user.id}}", "msg": "Event triggered"}'
              value={destTransformTemplate}
              onChange={(e) => setDestTransformTemplate(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={3}
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }
                }
              }}
            />
          </Box>

          <Box className="flex justify-end gap-2 pt-3">
            <Button
              onClick={() => setShowDestModal(false)}
              variant="outlined"
              size="small"
              style={{ textTransform: 'none', borderRadius: '8px' }}
              sx={{ color: 'inherit' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={createDestMutation.isPending}
              style={{ textTransform: 'none', borderRadius: '8px' }}
            >
              {createDestMutation.isPending ? <CircularProgress size={16} color="inherit" /> : 'Add Destination'}
            </Button>
          </Box>
        </form>
      </Dialog>

      {/* SIDE-BY-SIDE DIFF MODAL */}
      <Dialog
        isOpen={showDiffModal && diffIds.length === 2}
        onClose={() => setShowDiffModal(false)}
        title="Payload Structure Comparison"
      >
        <Box className="space-y-4 pt-2">
          {diffIds.length === 2 && (
            <DiffViewer
              payloadA={allPayloads.find((p) => p.id === diffIds[0])?.raw_body || '{}'}
              payloadB={allPayloads.find((p) => p.id === diffIds[1])?.raw_body || '{}'}
              nameA={`Payload ${diffIds[0].substring(0, 8)}`}
              nameB={`Payload ${diffIds[1].substring(0, 8)}`}
            />
          )}
          <Box className="flex justify-end pt-2">
            <Button
              onClick={() => setShowDiffModal(false)}
              variant="contained"
              size="small"
              style={{ textTransform: 'none', borderRadius: '8px' }}
            >
              Close Diff
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* EDIT AND REPLAY MODAL */}
      <Dialog
        isOpen={isEditingReplay}
        onClose={() => setIsEditingReplay(false)}
        title="Customize Payload for Replay"
      >
        <Box className="space-y-4 pt-2">
          <Box className="flex flex-col gap-1 w-full">
            <Typography variant="caption" className="font-semibold text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'inherit' }}>
              Payload Raw Body
            </Typography>
            <TextField
              value={replayCustomBody}
              onChange={(e) => setReplayCustomBody(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={8}
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }
                }
              }}
            />
          </Box>
          <Box className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setIsEditingReplay(false)}
              variant="outlined"
              size="small"
              style={{ textTransform: 'none', borderRadius: '8px' }}
              sx={{ color: 'inherit' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleReplayPayload()}
              variant="contained"
              size="small"
              disabled={replayPayloadMutation.isPending}
              style={{ textTransform: 'none', borderRadius: '8px' }}
            >
              {replayPayloadMutation.isPending ? <CircularProgress size={16} color="inherit" /> : 'Replay Webhook'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
