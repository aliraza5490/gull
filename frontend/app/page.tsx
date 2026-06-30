'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Webhook,
  Zap,
  Radio,
  GitBranch,
  Shield,
  Users,
  ArrowRight,
  ChevronRight,
  Globe,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const FEATURES = [
  {
    icon: Radio,
    title: 'Endpoint Management',
    description:
      'Temporary and persistent endpoints with custom slugs, traffic control, and endpoint-level secret verification.',
  },
  {
    icon: Zap,
    title: 'Real-Time Inspection',
    description:
      'Live request streaming, deep payload inspection, advanced filtering, side-by-side diffing, and schema drift detection.',
  },
  {
    icon: GitBranch,
    title: 'Multi-Destination Fan-Out',
    description:
      'Route webhooks to multiple destinations simultaneously with per-destination config, payload transforms, and auth injection.',
  },
  {
    icon: Shield,
    title: 'Reliability & Delivery',
    description:
      'Automated retries with exponential backoff, delivery audit logs, granular replay, and dead letter queue management.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Session sharing with time-boxed read-only links, enterprise workspaces with RBAC, and permission-based access control.',
  },
];

const STEPS = [
  {
    number: '01',
    icon: Globe,
    title: 'Create an Endpoint',
    description: 'Generate a unique URL in seconds. Temporary for quick tests or persistent for production integrations.',
  },
  {
    number: '02',
    icon: Activity,
    title: 'Receive & Inspect',
    description: 'Watch webhooks arrive in real-time. Inspect headers, bodies, and query params with full detail.',
  },
  {
    number: '03',
    icon: RefreshCw,
    title: 'Forward & Monitor',
    description: 'Fan out to multiple destinations. Track deliveries, retry failures, and replay events on demand.',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="lg" />
            <span className="text-lg font-bold tracking-tight">Gull</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="primary-gradient-btn border-0" asChild>
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_60%)]" />
          <div className="absolute top-0 left-1/4 size-[500px] rounded-full bg-indigo-500/5 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 size-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <Webhook className="size-3.5" />
              Webhook Orchestration Platform
            </div>

            {/* Headline */}
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Webhook Orchestration,{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Receive, inspect, transform, and forward webhooks in real-time.
              Built for developers who need reliable webhook infrastructure
              without the complexity.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="primary-gradient-btn border-0 px-8 text-base"
                asChild
              >
                <Link href="/register">
                  Start for Free
                  <ArrowRight className="size-4 ml-2 transition-transform group-hover/button:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 text-base"
                asChild
              >
                <Link href="#features">
                  Learn More
                  <ChevronRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Hero visual - abstract webhook flow */}
            <div className="mt-16 w-full max-w-3xl">
              <div className="relative rounded-2xl border border-border/50 bg-card/50 p-1 shadow-2xl backdrop-blur-sm">
                <div className="rounded-xl bg-muted/30 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    {/* Incoming */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                        <Radio className="size-6" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Receive</span>
                    </div>

                    {/* Arrow */}
                    <div className="hidden sm:flex flex-1 items-center">
                      <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-purple-500/50" />
                      <ChevronRight className="size-4 -ml-1 text-purple-500/70" />
                    </div>

                    {/* Process */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                        <Activity className="size-6" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Inspect</span>
                    </div>

                    {/* Arrow */}
                    <div className="hidden sm:flex flex-1 items-center">
                      <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-violet-500/50" />
                      <ChevronRight className="size-4 -ml-1 text-violet-500/70" />
                    </div>

                    {/* Forward */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                        <GitBranch className="size-6" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Forward</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for webhooks
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete platform for receiving, inspecting, and forwarding
              webhooks at any scale.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="feature-card group relative rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to start orchestrating your webhooks.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line (between cards) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+40px)] hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-border to-border/30 sm:block" />
                )}
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground transition-colors">
                  <step.icon className="size-7" />
                </div>
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Step {step.number}
                </span>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20">
            {/* Background pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to simplify your webhooks?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Join developers who trust Gull for reliable webhook
                orchestration. Start for free — no credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90 border-0 px-8 text-base font-semibold shadow-lg"
                  asChild
                >
                  <Link href="/register">
                    Get Started for Free
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <Logo size="md" />
              <span className="text-sm font-semibold">Gull</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Gull. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
