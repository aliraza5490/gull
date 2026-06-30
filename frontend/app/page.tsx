'use client';

import React from 'react';
import { useWorkspaces } from '../services/webhook';

export default function Home() {
  const { data: workspaces, isLoading, error } = useWorkspaces();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Gull Frontend (Minimal)</h1>
      <p>Material UI and state stores have been removed. Hooks and API services are preserved.</p>

      <h2>Workspaces</h2>
      {isLoading && <p>Loading workspaces...</p>}
      {error && <p style={{ color: 'red' }}>Error loading workspaces: {error.message}</p>}
      {workspaces && (
        <ul>
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <strong>{ws.name}</strong> <small>({ws.id})</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
