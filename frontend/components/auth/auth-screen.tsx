'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Sparkles, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../services/api';

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: { id: string; email: string }) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post<any>(endpoint, { email, password });
      
      const { access_token, user } = response;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast({
        title: isLogin ? 'Welcome back!' : 'Account created!',
        description: isLogin ? 'Successfully logged into Gull.' : 'Your workspace has been provisioned.',
        type: 'success',
      });

      onAuthSuccess(access_token, user);
    } catch (err: any) {
      toast({
        title: 'Authentication Failed',
        description: err.message || 'An error occurred during authentication.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic ambient background glow circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-300">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-white dark:via-indigo-100 dark:to-white bg-clip-text text-transparent">
            Gull Orchestration
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Manage endpoints, inspect payloads, and route events in real time.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-8 shadow-xl dark:shadow-indigo-950/10 space-y-6 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-5">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-950 dark:text-white">
                {isLogin ? 'Sign In' : 'Sign Up'}
              </h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-500">
                {isLogin ? 'Access your dashboard' : 'Create your free account'}
              </p>
            </div>
            <div className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure auth
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              disabled={isLoading}
              className="focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              disabled={isLoading}
              className="focus:ring-indigo-500 focus:border-indigo-500"
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
                disabled={isLoading}
                className="focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 border-none shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 py-3 rounded-xl mt-6 font-semibold flex items-center justify-center gap-2 group transition-all duration-200"
            >
              {isLogin ? (
                <>
                  Sign In <LogIn className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              ) : (
                <>
                  Create Account <UserPlus className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Screen Trigger */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              disabled={isLoading}
              className="text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors font-medium focus:outline-none"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
