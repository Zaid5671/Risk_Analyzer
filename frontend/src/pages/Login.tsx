import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, CANONICAL_DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/context/AuthContext';
import type { Role } from '@/types/auth';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: Role) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Quick login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
          MP
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
          MPLADS Integrity & Analytics Platform
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          MoSPI Official Monitoring Portal • SIH 2026 PS 26102
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Official Government Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@mplads.gov.in"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating with Supabase...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Fast Stakeholder Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Canonical Seeded Stakeholder Accounts
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Auto-fills: {DEMO_PASSWORD}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CANONICAL_DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.role as Role)}
                  disabled={loading}
                  className="p-3 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {acc.label}
                    </p>
                    <CheckCircle2 className="w-3 h-3 text-slate-600 group-hover:text-amber-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{acc.scope}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Disclaimers */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          Protected by bcrypt (12 rounds), dummy hash timing mitigation, and PostgreSQL RLS.
        </p>
      </div>
    </div>
  );
};
