'use client';

export function useToast() {
  const toast = ({ title, description, type = 'info' }: { title?: string; description: string; type?: string }) => {
    console.log(`[Toast] [${type.toUpperCase()}] ${title ? title + ': ' : ''}${description}`);
    if (typeof window !== 'undefined') {
      alert(`${title ? title + '\n' : ''}${description}`);
    }
  };
  return { toast };
}
