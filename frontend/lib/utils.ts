import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const cleanUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    return cleanUrl.replace(/\/api\/v1$/, '');
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace("3000", "8000");
  }
  return "http://localhost:8000";
}

export function getReceiverUrl(slug?: string): string {
  if (!slug) return "";
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/v1/receiver/${slug}`;
}

