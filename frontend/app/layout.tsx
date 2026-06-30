import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gull — Webhook Orchestration & Forwarding Platform',
  description:
    'Receive, inspect, transform, and forward webhooks in real-time. Multi-destination fan-out, schema drift detection, delivery tracking, and team collaboration.',
  keywords: [
    'webhook',
    'orchestration',
    'forwarding',
    'api',
    'integration',
    'monitoring',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", instrumentSans.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
