'use client';

import React, { useState } from 'react';
import { Copy, Check, Edit, Trash2, Key, Globe, Calendar } from 'lucide-react';
import { Webhook } from '../../types/webhook';
import { useUpdateWebhook, useDeleteWebhook } from '../../services/webhook';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface WebhookCardProps {
  webhook: Webhook;
  onEdit: (webhook: Webhook) => void;
}

export function WebhookCard({ webhook, onEdit }: WebhookCardProps) {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const updateMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhook.url);
      setCopiedUrl(true);
      toast({
        title: 'Copied to Clipboard',
        description: 'Webhook URL copied successfully.',
        type: 'success',
      });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast({
        title: 'Failed to Copy',
        description: 'Failed to copy URL to clipboard.',
        type: 'error',
      });
    }
  };

  const handleCopySecret = async () => {
    if (!webhook.secret) return;
    try {
      await navigator.clipboard.writeText(webhook.secret);
      setCopiedSecret(true);
      toast({
        title: 'Copied to Clipboard',
        description: 'Webhook secret key copied successfully.',
        type: 'success',
      });
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      toast({
        title: 'Failed to Copy',
        description: 'Failed to copy secret key to clipboard.',
        type: 'error',
      });
    }
  };

  const handleToggleActive = () => {
    const nextActive = !webhook.is_active;
    updateMutation.mutate(
      {
        id: webhook.id,
        data: { is_active: nextActive },
      },
      {
        onSuccess: () => {
          toast({
            title: nextActive ? 'Webhook Enabled' : 'Webhook Disabled',
            description: `The webhook "${webhook.name}" has been ${nextActive ? 'activated' : 'deactivated'}.`,
            type: 'success',
          });
        },
        onError: (err) => {
          toast({
            title: 'Status Update Failed',
            description: err.message || 'An error occurred while updating status.',
            type: 'error',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the webhook "${webhook.name}"?`)) {
      deleteMutation.mutate(webhook.id, {
        onSuccess: () => {
          toast({
            title: 'Webhook Deleted',
            description: `The webhook "${webhook.name}" has been deleted successfully.`,
            type: 'success',
          });
        },
        onError: (err) => {
          toast({
            title: 'Deletion Failed',
            description: err.message || 'Could not delete webhook.',
            type: 'error',
          });
        },
      });
    }
  };

  const formattedDate = new Date(webhook.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="flex-row items-start justify-between pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="truncate font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            {webhook.name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                webhook.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <span className="text-xs font-semibold text-zinc-555 dark:text-zinc-400">
              {webhook.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Toggle switch for is_active */}
        <button
          onClick={handleToggleActive}
          disabled={updateMutation.isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${
            webhook.is_active ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
          } ${updateMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              webhook.is_active ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* URL section */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Endpoint URL
          </span>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl px-3 py-2 border border-zinc-150 dark:border-zinc-800/60 overflow-hidden">
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono truncate flex-1 select-all">
              {webhook.url}
            </span>
            <button
              onClick={handleCopyUrl}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Copy URL"
            >
              {copiedUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Secret key section */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" /> Secret Key
          </span>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl px-3 py-2 border border-zinc-150 dark:border-zinc-800/60 overflow-hidden">
            {webhook.secret ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-zinc-500 dark:text-zinc-450 text-left hover:underline select-none shrink-0"
                >
                  {showSecret ? 'Hide key' : 'Show key'}
                </button>
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono truncate flex-1">
                  {showSecret ? webhook.secret : '••••••••••••••••••••••••••••••••'}
                </span>
                <button
                  onClick={handleCopySecret}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Copy Secret"
                >
                  {copiedSecret ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic">
                No secret configured
              </span>
            )}
          </div>
        </div>

        {/* Card Actions / Info */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-3.5">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Created {formattedDate}
          </span>
          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              onClick={() => onEdit(webhook)}
              title="Edit Webhook"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-450 hover:text-rose-600 dark:text-zinc-450 dark:hover:text-rose-500"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              title="Delete Webhook"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
