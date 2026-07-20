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

export interface ExpiryInfo {
  isExpired: boolean;
  text: string;
  formattedDate: string;
}

export function formatExpiryInfo(expiresAt?: string | null): ExpiryInfo {
  if (!expiresAt) {
    return {
      isExpired: false,
      text: "Never",
      formattedDate: "Never (Persistent)",
    };
  }

  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) {
    return { isExpired: false, text: "Invalid date", formattedDate: "Invalid date" };
  }

  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const formattedDate = expDate.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (diffMs <= 0) {
    return {
      isExpired: true,
      text: "Expired",
      formattedDate: `Expired on ${formattedDate}`,
    };
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relativeText = "";
  if (diffDays > 0) {
    const remHours = diffHours % 24;
    relativeText = remHours > 0 ? `Expires in ${diffDays}d ${remHours}h` : `Expires in ${diffDays}d`;
  } else if (diffHours > 0) {
    const remMins = diffMinutes % 60;
    relativeText = remMins > 0 ? `Expires in ${diffHours}h ${remMins}m` : `Expires in ${diffHours}h`;
  } else if (diffMinutes > 0) {
    relativeText = `Expires in ${diffMinutes}m`;
  } else {
    relativeText = "Expires in <1m";
  }

  return {
    isExpired: false,
    text: relativeText,
    formattedDate: `${formattedDate} (${relativeText})`,
  };
}

