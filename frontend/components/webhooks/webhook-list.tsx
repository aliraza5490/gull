'use client';

import React, { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import { useWebhooks } from '../../services/webhook';
import { Webhook } from '../../types/webhook';
import { WebhookCard } from './webhook-card';
import { WebhookForm } from './webhook-form';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Card } from '../ui/card';

export function WebhookList() {
  const [page, setPage] = useState(1);
  const pageSize = 6; // Compact page size to demonstrate pagination

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  const { data, isLoading, isError, error, refetch } = useWebhooks(page, pageSize);

  const handleEditClick = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setEditingWebhook(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingWebhook(null);
    refetch();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingWebhook(null);
  };

  // Local filtering based on search query
  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.items, searchQuery]);

  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // Loading skeleton placeholder state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="h-10 w-full sm:w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="h-10 w-full sm:w-36 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-60 border-zinc-200 dark:border-zinc-800 animate-pulse">
              <div className="p-6 space-y-4">
                <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-850 rounded" />
                <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-850 rounded" />
                <div className="space-y-2 pt-2">
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-850 rounded" />
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-850 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error fetching state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Failed to load webhooks</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
          {error?.message || 'We had trouble reaching the Gull server endpoints.'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-5">
          Retry Request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Trigger section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white shadow-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300 transition-colors"
          />
        </div>
        <Button onClick={handleCreateClick} className="shrink-0 flex items-center gap-2">
          <Plus className="h-4.5 w-4.5" /> Register Webhook
        </Button>
      </div>

      {/* Main Grid display */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-3xl bg-white dark:bg-zinc-900/20 shadow-sm">
          <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-full mb-4">
            <Inbox className="h-8 w-8 text-zinc-400 dark:text-zinc-550" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
            {searchQuery ? 'No matching webhooks' : 'No webhooks registered'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            {searchQuery
              ? `We couldn't find any endpoints matching "${searchQuery}". Try updating your query.`
              : 'Add webhook endpoints to start receiving real-time automated delivery updates.'}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateClick} className="mt-6">
              Create First Webhook
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((webhook) => (
            <WebhookCard key={webhook.id} webhook={webhook} onEdit={handleEditClick} />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Showing Page <span className="font-semibold text-zinc-700 dark:text-zinc-200">{page}</span> of{' '}
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{totalPages}</span> ({totalItems} total endpoints)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={handlePrevPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={handleNextPage}
              className="flex items-center gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog container for creating or editing webhooks */}
      <Dialog
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingWebhook ? 'Edit Webhook Endpoint' : 'Register New Webhook'}
      >
        <WebhookForm
          initialData={editingWebhook}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Dialog>
    </div>
  );
}
