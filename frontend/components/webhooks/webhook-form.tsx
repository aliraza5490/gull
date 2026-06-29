'use client';

import React, { useState, useEffect } from 'react';
import { Webhook, WebhookCreate, WebhookUpdate } from '../../types/webhook';
import { useCreateWebhook, useUpdateWebhook } from '../../services/webhook';
import { useToast } from '../../hooks/use-toast';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface WebhookFormProps {
  initialData?: Webhook | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WebhookForm({ initialData, onSuccess, onCancel }: WebhookFormProps) {
  const { toast } = useToast();
  const isEditMode = !!initialData;

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateWebhook();
  const updateMutation = useUpdateWebhook();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUrl(initialData.url);
      setSecret(initialData.secret || '');
      setIsActive(initialData.is_active);
    } else {
      setName('');
      setUrl('');
      setSecret('');
      setIsActive(true);
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Webhook name is required.';
    }

    if (!url.trim()) {
      newErrors.url = 'Webhook endpoint URL is required.';
    } else {
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          newErrors.url = 'URL must start with http:// or https://';
        }
      } catch {
        newErrors.url = 'Please enter a valid URL.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditMode && initialData) {
      const updateData: WebhookUpdate = {
        name,
        url,
        secret: secret.trim() ? secret : null,
        is_active: isActive,
      };

      updateMutation.mutate(
        {
          id: initialData.id,
          data: updateData,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Webhook Updated',
              description: `Webhook "${name}" was updated successfully.`,
              type: 'success',
            });
            onSuccess();
          },
          onError: (err) => {
            toast({
              title: 'Update Failed',
              description: err.message || 'An error occurred while updating the webhook.',
              type: 'error',
            });
          },
        }
      );
    } else {
      const createData: WebhookCreate = {
        name,
        url,
        secret: secret.trim() ? secret : undefined,
        is_active: isActive,
      };

      createMutation.mutate(createData, {
        onSuccess: () => {
          toast({
            title: 'Webhook Created',
            description: `Webhook "${name}" was created successfully.`,
            type: 'success',
          });
          onSuccess();
        },
        onError: (err) => {
          toast({
            title: 'Creation Failed',
            description: err.message || 'An error occurred while creating the webhook.',
            type: 'error',
          });
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <Input
        label="Webhook Name"
        placeholder="e.g., Stripe Event Handler"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={isPending}
        required
      />

      <Input
        label="Target Endpoint URL"
        placeholder="https://api.yourdomain.com/webhooks"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={errors.url}
        disabled={isPending}
        type="url"
        required
      />

      <Input
        label="Secret Token (Optional)"
        placeholder="HMAC verification secret or leave blank"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        error={errors.secret}
        disabled={isPending}
        type="text"
      />

      <div className="flex items-center gap-3 py-1">
        <input
          id="is_active_form"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4.5 w-4.5 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-colors"
          disabled={isPending}
        />
        <label htmlFor="is_active_form" className="text-sm font-medium text-zinc-750 dark:text-zinc-350 cursor-pointer">
          Active Status (Enable webhook immediately)
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isPending}>
          {isEditMode ? 'Save Changes' : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
}
