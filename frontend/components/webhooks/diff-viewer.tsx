'use client';

import React from 'react';

interface DiffViewerProps {
  payloadA: any;
  payloadB: any;
  nameA?: string;
  nameB?: string;
}

export function DiffViewer({ payloadA, payloadB, nameA = 'Payload A', nameB = 'Payload B' }: DiffViewerProps) {
  // Deep comparison returning line-by-line diff metadata
  const generateDiff = (objA: any, objB: any): { key: string; status: 'added' | 'removed' | 'changed' | 'unchanged'; valueA: string; valueB: string }[] => {
    const keysA = typeof objA === 'object' && objA !== null ? Object.keys(objA) : [];
    const keysB = typeof objB === 'object' && objB !== null ? Object.keys(objB) : [];
    
    const allKeys = Array.from(new Set([...keysA, ...keysB])).sort();
    const diffItems: any[] = [];

    for (const key of allKeys) {
      const inA = key in (objA || {});
      const inB = key in (objB || {});

      const valA = objA?.[key];
      const valB = objB?.[key];

      if (inA && !inB) {
        diffItems.push({
          key,
          status: 'removed',
          valueA: JSON.stringify(valA, null, 2),
          valueB: '',
        });
      } else if (!inA && inB) {
        diffItems.push({
          key,
          status: 'added',
          valueA: '',
          valueB: JSON.stringify(valB, null, 2),
        });
      } else {
        // Both exist - compare types & values
        const strA = JSON.stringify(valA);
        const strB = JSON.stringify(valB);

        if (strA === strB) {
          diffItems.push({
            key,
            status: 'unchanged',
            valueA: JSON.stringify(valA, null, 2),
            valueB: JSON.stringify(valB, null, 2),
          });
        } else {
          diffItems.push({
            key,
            status: 'changed',
            valueA: JSON.stringify(valA, null, 2),
            valueB: JSON.stringify(valB, null, 2),
          });
        }
      }
    }

    return diffItems;
  };

  const diffs = React.useMemo(() => {
    try {
      const parsedA = typeof payloadA === 'string' ? JSON.parse(payloadA) : payloadA;
      const parsedB = typeof payloadB === 'string' ? JSON.parse(payloadB) : payloadB;
      return generateDiff(parsedA, parsedB);
    } catch {
      // Fallback to simple line split comparison if JSON parsing fails
      return [
        {
          key: 'Raw Payload Comparison',
          status: 'changed',
          valueA: String(payloadA),
          valueB: String(payloadB),
        },
      ];
    }
  }, [payloadA, payloadB]);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        <div>{nameA}</div>
        <div>{nameB}</div>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-850 max-h-96 overflow-y-auto font-mono text-xs p-2 bg-white dark:bg-zinc-950">
        {diffs.map((item, idx) => {
          let rowClass = 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400';
          let indicator = ' ';
          
          if (item.status === 'added') {
            rowClass = 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400';
            indicator = '+';
          } else if (item.status === 'removed') {
            rowClass = 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450';
            indicator = '-';
          } else if (item.status === 'changed') {
            rowClass = 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450';
            indicator = '~';
          }

          return (
            <div key={idx} className={`grid grid-cols-2 gap-4 p-2 rounded-lg transition-colors ${rowClass}`}>
              <div className="overflow-x-auto whitespace-pre-wrap">
                <span className="font-semibold text-zinc-400 dark:text-zinc-500 mr-2">{indicator}</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.key}:</span>{' '}
                {item.valueA || <span className="italic text-zinc-400 dark:text-zinc-600">(undefined)</span>}
              </div>
              <div className="overflow-x-auto whitespace-pre-wrap border-l border-zinc-100 dark:border-zinc-850 pl-4">
                <span className="font-semibold text-zinc-400 dark:text-zinc-500 mr-2">{indicator}</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.key}:</span>{' '}
                {item.valueB || <span className="italic text-zinc-400 dark:text-zinc-600">(undefined)</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
