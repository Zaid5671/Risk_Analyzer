import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, CANONICAL_DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/context/AuthContext';
import type { Role } from '@/types/auth';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Building2, Check, Landmark } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Top National Header Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-full shadow-xs mb-3">
          <Building2 className="w-4 h-4 text-slate-700" />
          <span className="text-[11px] font-semibold text-slate-700 tracking-wide">
            सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय • Ministry of Statistics & Programme Implementation
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          MPLADS AI Monitoring & Decision-Support System
        </h1>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          National Scheme Surveillance • Smart India Hackathon 2026 • PS 26102
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Institutional Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Government Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@mplads.gov.in"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating with Supabase...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Evaluator Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Simulate Stakeholder Perspective (SIH Evaluation)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Sign In</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CANONICAL_DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.role as Role)}
                  disabled={loading}
                  className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                      {acc.label}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-white border border-slate-200 text-slate-600 group-hover:border-blue-300">
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{acc.scope}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Disclaimers */}
        <p className="text-center text-[11px] text-slate-500 mt-4 leading-relaxed">
          Protected by bcrypt (12 rounds) anti-timing mitigation, RFC 7519 JWT sessions, and PostgreSQL Jurisdictional RLS.
        </p>
      </div>

      {/* Institutional Footer */}
      <div className="text-center text-[11px] text-slate-400">
        Government of India • Ministry of Statistics and Programme Implementation (MoSPI)
      </div>
    </div>
  );
};
