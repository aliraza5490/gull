'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import InputAdornment from '@mui/material/InputAdornment';
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

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      backgroundColor: '#f8fafc', // soft slate-50 background for input fields in light mode
      '.dark &': {
        backgroundColor: '#0a0f1d', // deep gray-950 background in dark mode
      },
      '& fieldset': {
        borderColor: '#e2e8f0', // slate-200 border in light mode
        borderWidth: '1.5px',
        borderStyle: 'solid',
        '.dark &': {
          borderColor: 'rgba(55, 65, 81, 0.8)',
        }
      },
      '&:hover fieldset': {
        borderColor: '#cbd5e1',
        '.dark &': {
          borderColor: '#4b5563',
        }
      },
      '&.Mui-focused fieldset': {
        borderColor: '#4c57eb',
        borderWidth: '1.5px',
        '.dark &': {
          borderColor: '#6b77ff',
        }
      },
    },
    '& .MuiInputBase-input': {
      color: '#0f172a', // slate-900 text in light mode
      '.dark &': {
        color: '#f3f4f6',
      },
      fontSize: '14px',
      fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      padding: '12px 14px',
    },
    '& .MuiInputBase-input::placeholder': {
      color: '#94a3b8', // slate-400 placeholder in light mode
      opacity: 1,
      '.dark &': {
        color: '#4b5563',
        opacity: 1,
      }
    }
  };

  return (
    <Box
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300"
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc', // slate-50 background in light mode
        backgroundImage: 'radial-gradient(at top left, rgba(234, 234, 255, 0.7) 0%, transparent 40%), radial-gradient(at bottom right, rgba(244, 246, 255, 0.7) 0%, transparent 65%)',
        '.dark &': {
          backgroundColor: '#030712', // deep gray-950 in dark mode
          backgroundImage: 'radial-gradient(at top left, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(at bottom right, rgba(124, 58, 237, 0.03) 0%, transparent 50%)',
        }
      }}
    >
      {/* Ambient background glows */}
      <Box
        className="absolute pointer-events-none blur-3xl rounded-full"
        sx={{
          top: '15%',
          left: '15%',
          width: '400px',
          height: '400px',
          backgroundColor: 'rgba(99, 102, 241, 0.15)', // indigo-500/15
          '.dark &': {
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
          }
        }}
      />
      <Box
        className="absolute pointer-events-none blur-3xl rounded-full"
        sx={{
          bottom: '15%',
          right: '15%',
          width: '400px',
          height: '400px',
          backgroundColor: 'rgba(139, 92, 246, 0.12)', // violet-500/12
          '.dark &': {
            backgroundColor: 'rgba(139, 92, 246, 0.04)',
          }
        }}
      />

      <Container maxWidth="xs" className="relative z-10">
        <Box className="space-y-8">
          {/* Top Logo */}
          <Box className="flex flex-col items-center text-center">
            <Box className="h-14 w-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-300">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Box>
            <Typography
              variant="h4"
              className="mt-6 font-extrabold tracking-tight"
              style={{ fontFamily: 'inherit' }}
              sx={{ color: 'text.primary' }}
            >
              Gull Orchestration
            </Typography>
            <Typography
              variant="body2"
              className="mt-2 max-w-xs"
              style={{ fontFamily: 'inherit' }}
              sx={{ color: 'text.secondary' }}
            >
              Manage endpoints, inspect payloads, and route events in real time.
            </Typography>
          </Box>

          {/* Card Container */}
          <Card
            className="border transition-all duration-300"
            elevation={0}
            style={{ borderRadius: '24px' }}
            sx={{
              backgroundColor: '#ffffff',
              borderColor: 'rgba(226, 232, 240, 0.8)', // slate-200 border in light mode
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02), 0 0 40px rgba(99, 102, 241, 0.02)',
              p: 4,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              '.dark &': {
                backgroundColor: 'rgba(17, 24, 39, 0.85)', // gray-900/85
                borderColor: 'rgba(31, 41, 55, 0.8)', // gray-800 border
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 50px rgba(99, 102, 241, 0.03)',
              }
            }}
          >
            <Box className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/60 pb-5">
              <Box className="space-y-1">
                <Typography variant="h5" className="font-extrabold" style={{ fontFamily: 'inherit' }} sx={{ color: 'text.primary' }}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Typography>
                <Typography variant="caption" style={{ fontFamily: 'inherit' }} sx={{ color: 'text.secondary', display: 'block' }}>
                  {isLogin ? 'Access your dashboard' : 'Create your free account'}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ecfdf5', // emerald-50
                  color: '#047857', // emerald-700
                  border: '1px solid #d1fae5', // emerald-100
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  '.dark &': {
                    backgroundColor: 'rgba(6, 78, 59, 0.3)',
                    color: '#34d399',
                    borderColor: 'rgba(6, 78, 59, 0.5)',
                  }
                }}
              >
                <ShieldCheck style={{ width: '15px', height: '15px' }} /> Secure auth
              </Box>
            </Box>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box className="flex flex-col gap-1.5 w-full">
                <Typography variant="caption" className="font-bold" style={{ fontFamily: 'inherit' }} sx={{ color: 'text.primary' }}>
                  Email Address
                </Typography>
                <TextField
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={isLoading}
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail className="h-4 w-4 text-zinc-400 dark:text-zinc-550" />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={textFieldStyle}
                />
              </Box>

              <Box className="flex flex-col gap-1.5 w-full">
                <Typography variant="caption" className="font-bold" style={{ fontFamily: 'inherit' }} sx={{ color: 'text.primary' }}>
                  Password
                </Typography>
                <TextField
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={isLoading}
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock className="h-4 w-4 text-zinc-400 dark:text-zinc-555" />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={textFieldStyle}
                />
              </Box>

              {!isLogin && (
                <Box className="flex flex-col gap-1.5 w-full">
                  <Typography variant="caption" className="font-bold" style={{ fontFamily: 'inherit' }} sx={{ color: 'text.primary' }}>
                    Confirm Password
                  </Typography>
                  <TextField
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    disabled={isLoading}
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock className="h-4 w-4 text-zinc-400 dark:text-zinc-555" />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={textFieldStyle}
                  />
                </Box>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                variant="contained"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-none shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 py-3 rounded-xl mt-4 font-bold flex items-center justify-center gap-2 group transition-all duration-200"
                style={{
                  borderRadius: '12px',
                  padding: '12px 16px',
                  textTransform: 'none',
                  color: '#ffffff',
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : isLogin ? (
                  <Box className="flex items-center gap-2">
                    Sign In <LogIn className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
                  </Box>
                ) : (
                  <Box className="flex items-center gap-2">
                    Create Account <UserPlus className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
                  </Box>
                )}
              </Button>
            </form>

            {/* Toggle Screen Trigger */}
            <Box className="text-center pt-2">
              <Button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                disabled={isLoading}
                variant="text"
                className="text-xs transition-colors font-medium focus:outline-none normal-case"
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </Box>

          </Card>
        </Box>
      </Container>
    </Box>
  );
}
