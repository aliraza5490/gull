'use client';

import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  useCreateWorkspace,
  useCreateEndpoint,
  useCreateDestination,
  useReplayPayload,
  useEndpoints,
  usePayloads,
} from '../../services/webhook';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
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
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Dev"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  onClick={() => {
                    setShowWorkspaceModal(false);
                    setNewWorkspaceName('');
                  }}
                  variant="outline"
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={createWorkspaceMutation.isPending}>
                  Create
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CREATE ENDPOINT MODAL */}
      {showEndpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Register Webhook Endpoint</h3>
            <form onSubmit={handleCreateEndpoint} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Endpoint Friendly Name</label>
                <input
                  type="text"
                  required
                  placeholder="My Stripe listener"
                  value={newEndpointName}
                  onChange={(e) => setNewEndpointName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Slug / Custom Path</label>
                <input
                  type="text"
                  required
                  placeholder="stripe-checkout"
                  value={newEndpointSlug}
                  onChange={(e) => setNewEndpointSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 font-sans">Endpoint Type</label>
                <div className="flex gap-4">
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={newEndpointType === 'persistent'}
                      onChange={() => setNewEndpointType('persistent')}
                    />{' '}
                    Persistent slug
                  </label>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={newEndpointType === 'temporary'}
                      onChange={() => setNewEndpointType('temporary')}
                    />{' '}
                    Temporary (24hr expiry)
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">HMAC Validation Secret (Optional)</label>
                <input
                  type="text"
                  placeholder="secret-hmac-key"
                  value={newEndpointSecret}
                  onChange={(e) => setNewEndpointSecret(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button onClick={() => setShowEndpointModal(false)} variant="outline" type="button">
                  Cancel
                </Button>
                <Button type="submit" isLoading={createEndpointMutation.isPending}>
                  Register
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ADD DESTINATION MODAL */}
      {showDestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <Card className="max-w-lg w-full p-6 border-zinc-200 dark:border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Add Forwarding Target</h3>
            <form onSubmit={handleCreateDestination} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Friendly Name</label>
                <input
                  type="text"
                  required
                  placeholder="Local Rails backend"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Target Forward URL</label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:3000/webhooks"
                  value={destUrl}
                  onChange={(e) => setDestUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500">HTTP Method</label>
                  <select
                    value={destMethod}
                    onChange={(e) => setDestMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500">Authentication Inject</label>
                  <select
                    value={destAuthType}
                    onChange={(e) => setDestAuthType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  >
                    <option value="None">None</option>
                    <option value="Bearer">Bearer Token</option>
                    <option value="Basic">Basic Auth</option>
                    <option value="CustomSignature">Custom Signature HMAC</option>
                  </select>
                </div>
              </div>

              {/* Conditional Auth Inputs */}
              {destAuthType === 'Bearer' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500">Bearer Token</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={destToken}
                    onChange={(e) => setDestToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              )}

              {destAuthType === 'Basic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500">Username</label>
                    <input
                      type="text"
                      placeholder="admin"
                      value={destUser}
                      onChange={(e) => setDestUser(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500">Password</label>
                    <input
                      type="password"
                      placeholder="password"
                      value={destPass}
                      onChange={(e) => setDestPass(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    />
                  </div>
                </div>
              )}

              {destAuthType === 'CustomSignature' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500">HMAC Signature Secret Key</label>
                  <input
                    type="password"
                    placeholder="my-signing-secret"
                    value={destSignatureSecret}
                    onChange={(e) => setDestSignatureSecret(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Inject Headers (JSON Object)</label>
                <textarea
                  placeholder='{"X-My-Header": "value"}'
                  value={destHeadersInject}
                  onChange={(e) => setDestHeadersInject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono h-16"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">Strip Headers (JSON Array)</label>
                <textarea
                  placeholder='["Authorization", "User-Agent"]'
                  value={destHeadersStrip}
                  onChange={(e) => setDestHeadersStrip(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono h-16"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500">
                  Payload Transformation Template (e.g. Map keys)
                </label>
                <textarea
                  placeholder='{"id": "{{user.id}}", "msg": "Event triggered"}'
                  value={destTransformTemplate}
                  onChange={(e) => setDestTransformTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button onClick={() => setShowDestModal(false)} variant="outline" type="button">
                  Cancel
                </Button>
                <Button type="submit" isLoading={createDestMutation.isPending}>
                  Add Destination
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* SIDE-BY-SIDE DIFF MODAL */}
      {showDiffModal && diffIds.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <Card className="max-w-4xl w-full p-6 border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Payload Structure Comparison</h3>
              <button onClick={() => setShowDiffModal(false)} className="text-zinc-400 hover:text-zinc-900 font-bold">
                &times;
              </button>
            </div>
            <DiffViewer
              payloadA={allPayloads.find((p) => p.id === diffIds[0])?.raw_body || '{}'}
              payloadB={allPayloads.find((p) => p.id === diffIds[1])?.raw_body || '{}'}
              nameA={`Payload ${diffIds[0].substring(0, 8)}`}
              nameB={`Payload ${diffIds[1].substring(0, 8)}`}
            />
            <div className="flex justify-end">
              <Button onClick={() => setShowDiffModal(false)}>Close Diff</Button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT AND REPLAY MODAL */}
      {isEditingReplay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <Card className="max-w-xl w-full p-6 border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Customize Payload for Replay</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500">Payload Raw Body</label>
              <textarea
                value={replayCustomBody}
                onChange={(e) => setReplayCustomBody(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono h-48"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditingReplay(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => handleReplayPayload()} isLoading={replayPayloadMutation.isPending}>
                Replay Webhook
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
