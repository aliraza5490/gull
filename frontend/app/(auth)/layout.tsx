'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="auth-layout relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient mesh background */}
      <div className="auth-bg-gradient pointer-events-none absolute inset-0" />

      {/* Floating 3D geometric shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-orb auth-orb-4" />
        <div className="auth-orb auth-orb-5" />
      </div>

      {/* Centered content: logo + card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-4">
        {/* Gull Logo */}
        <div className="auth-logo mb-8 flex flex-col items-center gap-3">
          <div className="auth-logo-icon flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-8 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12c0-1.5 1-3 3-4s4.5-1.5 6-1c1.5.5 2 2 1.5 3.5S11 14 9 15s-4.5 1-5.5-.5" />
              <path d="M21 8c-1-1.5-3-2.5-5-2s-3 2.5-2.5 4.5 2 3.5 4 3 3.5-2 3.5-3.5V8Z" />
              <path d="M12 10.5c.5 2 1 4 2 5.5s3 2.5 4.5 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gull
          </h1>
        </div>

        {/* Card container with 3D effect */}
        <div className="auth-card-wrapper w-full">
          {children}
        </div>
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        .auth-bg-gradient {
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(79, 70, 229, 0.05) 0%, transparent 50%);
        }

        :global(.dark) .auth-bg-gradient {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(79, 70, 229, 0.1) 0%, transparent 50%);
        }

        .auth-logo {
          animation: logoFloat 6s ease-in-out infinite;
        }

        .auth-logo-icon {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .auth-logo-icon:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
        }

        .auth-card-wrapper {
          perspective: 1000px;
        }

        .auth-card-wrapper > :global(*) {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .auth-card-wrapper:hover > :global(*) {
          transform: perspective(1000px) rotateX(1deg) rotateY(-1deg) translateZ(5px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 40px rgba(99, 102, 241, 0.05);
        }

        :global(.dark) .auth-card-wrapper:hover > :global(*) {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.08);
        }

        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
        }

        :global(.dark) .auth-orb {
          opacity: 0.3;
        }

        .auth-orb-1 {
          width: 300px;
          height: 300px;
          background: rgba(99, 102, 241, 0.15);
          top: -10%;
          left: -5%;
          animation: orbFloat1 20s ease-in-out infinite;
        }

        .auth-orb-2 {
          width: 200px;
          height: 200px;
          background: rgba(139, 92, 246, 0.12);
          top: 60%;
          right: -5%;
          animation: orbFloat2 25s ease-in-out infinite;
        }

        .auth-orb-3 {
          width: 150px;
          height: 150px;
          background: rgba(236, 72, 153, 0.08);
          bottom: -5%;
          left: 30%;
          animation: orbFloat3 18s ease-in-out infinite;
        }

        .auth-orb-4 {
          width: 100px;
          height: 100px;
          background: rgba(59, 130, 246, 0.1);
          top: 20%;
          right: 20%;
          animation: orbFloat4 22s ease-in-out infinite;
        }

        .auth-orb-5 {
          width: 80px;
          height: 80px;
          background: rgba(168, 85, 247, 0.1);
          bottom: 30%;
          left: 10%;
          animation: orbFloat5 15s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, 40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, -30px) scale(1.15); }
          66% { transform: translate(20px, -50px) scale(0.95); }
        }

        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.1); }
        }

        @keyframes orbFloat4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, 40px) rotate(180deg); }
        }

        @keyframes orbFloat5 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -20px); }
          66% { transform: translate(-15px, 30px); }
        }
      `}</style>
    </div>
  );
}
