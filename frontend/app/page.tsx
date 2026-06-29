'use client';

import React from 'react';
import { WebhookList } from '../components/webhooks/webhook-list';
import { Activity, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { useWebhooks } from '../services/webhook';

export default function Home() {
  const { data } = useWebhooks(1, 1);
  const totalWebhooks = data?.total ?? 0;

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header bar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Gull Logo */}
            <div className="h-9 w-9 bg-zinc-900 dark:bg-zinc-150 rounded-xl flex items-center justify-center shadow-md">
              <svg
                className="h-5 w-5 text-white dark:text-zinc-950"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gull</span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">
                Beta
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#" className="text-zinc-900 dark:text-zinc-50 underline underline-offset-8 decoration-2">
              Endpoints
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Deliveries
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Metrics
            </a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Documentation
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1"
            >
              GitHub <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Hero Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-900/40 dark:to-zinc-950/20 text-white rounded-3xl p-6 sm:p-8 border border-zinc-800/80 dark:border-zinc-800/40 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Webhook Orchestration Platform
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Register, manage, and debug secure HTTP callbacks. Gull delivers event payloads safely to your servers with built-in retries, detailed logging, and signature validation.
            </p>
          </div>
        </div>

        {/* Dashboard Stats Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stat 1 */}
          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 rounded-xl">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">Registered Endpoints</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{totalWebhooks}</h3>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm flex items-center gap-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">Security Protection</p>
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1">
                HMAC-SHA255 Active
              </h3>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">Global Status</p>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Nominal
              </h3>
            </div>
          </div>
        </div>

        {/* Webhooks Manager Container */}
        <section className="bg-white/40 dark:bg-zinc-900/10 border border-zinc-200/80 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm backdrop-blur-sm space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-150">Webhook Endpoints</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Create and manage destination endpoints that listen for webhooks dispatched by Gull.
            </p>
          </div>
          
          <WebhookList />
        </section>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/20 py-6 mt-16 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-450">
          Gull Webhook Orchestration Platform. All rights reserved &copy; {new Date().getFullYear()}.
        </p>
      </footer>
    </div>
  );
}
