import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { user, loading } = useAuth();

  // Redirect authenticated users to home
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Branding Section */}
        <div className="mb-8 flex flex-col items-center text-center">
          {/* Shield Icon with gradient glow */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* App Name */}
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-white">
            CivicPulse AI
          </h1>

          {/* Tagline */}
          <p className="text-sm text-slate-400">
            AI-Powered Civic Issue Resolver
          </p>
        </div>

        {/* Google Sign In */}
        <div className="mb-6">
          <GoogleSignIn />
        </div>

        {/* Separator */}
        <div className="relative mb-6 flex items-center">
          <Separator className="flex-1 bg-slate-700/50" />
          <span className="px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
            or continue with
          </span>
          <Separator className="flex-1 bg-slate-700/50" />
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
