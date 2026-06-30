'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useSharedEndpoint, useSharedPayloads } from '../../../services/webhook';

export default function ShareViewer() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const { data: endpoint, isLoading: isEpLoading } = useSharedEndpoint(token);
  const { data: payloadsData, isLoading: isPayloadsLoading } = useSharedPayloads(token);
  const payloads = payloadsData?.items || [];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Shared Stream Viewer (Minimal)</h1>
      <p>Token: {token}</p>

      <h2>Endpoint Details</h2>
      {isEpLoading && <p>Loading endpoint...</p>}
      {endpoint ? (
        <div>
          <p><strong>Name:</strong> {endpoint.name}</p>
          <p><strong>Slug:</strong> {endpoint.slug}</p>
          <p><strong>Type:</strong> {endpoint.type}</p>
        </div>
      ) : (
        !isEpLoading && <p>Endpoint not found or expired.</p>
      )}

      <h2>Payloads</h2>
      {isPayloadsLoading && <p>Loading payloads...</p>}
      {payloads.length > 0 ? (
        <ul>
          {payloads.map((payload) => (
            <li key={payload.id}>
              <strong>{payload.method}</strong> - {payload.id} - Received: {payload.received_at}
            </li>
          ))}
        </ul>
      ) : (
        !isPayloadsLoading && <p>No payloads found.</p>
      )}
    </div>
  );
}
