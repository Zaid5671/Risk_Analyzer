import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, CANONICAL_DEMO_ACCOUNTS } from '@/context/AuthContext';
import type { Role } from '@/types/auth';
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  MapPin,
  Landmark,
} from 'lucide-react';

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

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'MP':
        return UserCheck;
      case 'DISTRICT_OFFICER':
        return MapPin;
      case 'STATE_OFFICER':
        return Building2;
      case 'MINISTRY':
      default:
        return Landmark;
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-drishti-ivory text-slate-800 font-sans flex flex-col lg:flex-row select-none">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Brand Story & Intelligence Capability Highlights */}
      {/* Shifted to the left: lg:w-[38%] xl:w-[36%] */}
      {/* ============================================================ */}
      <div className="lg:w-[40%] xl:w-[38%] lg:h-full lg:max-h-screen overflow-hidden relative bg-[#f7f2e7] p-5 sm:p-7 lg:p-8 lg:pr-24 xl:p-9 xl:pr-24 flex flex-col justify-between gap-6 lg:gap-0">
        {/* Architectural Landscape Background (Untouched) */}
        <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
          <img
            src="/hero-parliament.jpg"
            alt="Parliament Architecture"
            className="w-full h-full object-cover object-left opacity-25 mix-blend-multiply filter contrast-110"
          />
          {/* Subtle warm wash */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#fbf9f4]/85 via-[#f7f2e7]/60 to-[#faeede]/50" />
          <div className="absolute top-0 right-5 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-5 left-5 w-72 h-72 bg-drishti-sage/30 rounded-full blur-3xl" />
        </div>

        {/* Organic Curvy / Scalloped Middle Divider (matching reference image) */}
        <div className="absolute top-0 right-0 h-full w-14 sm:w-20 lg:w-28 pointer-events-none z-20 overflow-visible hidden lg:block">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 1000"
          >
            {/* The filled ivory shape matching the right column background */}
            <path
              d="M102,0 
                 L102,1000 
                 L45,1000 
                 C65,920 65,850 25,780 
                 C-15,710 35,630 60,570 
                 C85,510 5,450 15,390 
                 C25,330 75,270 60,210 
                 C45,150 15,110 25,60 
                 C35,25 55,10 70,0 
                 Z"
              fill="#fbf9f4"
            />
            {/* Subtle elegant hairline stroke along the organic curvy edge */}
            <path
              d="M45,1000 
                 C65,920 65,850 25,780 
                 C-15,710 35,630 60,570 
                 C85,510 5,450 15,390 
                 C25,330 75,270 60,210 
                 C45,150 15,110 25,60 
                 C35,25 55,10 70,0"
              fill="none"
              stroke="#0b2e27"
              strokeWidth="1.5"
              strokeOpacity="0.12"
            />
          </svg>
        </div>

        {/* Left Side: Brand Logo Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-drishti-forest flex items-center justify-center text-amber-400 shadow-xs border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-drishti-forest block leading-none">
                Drishti
              </span>
              <p className="text-[11px] font-sans italic text-drishti-muted tracking-wide mt-0.5">
                MPLADS Intelligence Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Left Side: Core Message & 3 Feature Badges */}
        <div className="relative z-10 space-y-3.5 sm:space-y-4 my-auto max-w-sm sm:max-w-md py-2">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-px bg-drishti-terracotta" />
            <span className="text-[10.5px] font-sans font-semibold tracking-widest uppercase text-drishti-forest">
              AI-POWERED MPLADS INTELLIGENCE
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-0.5">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[32px] xl:text-[36px] 2xl:text-[42px] font-bold tracking-tight text-drishti-forest leading-[1.12]">
              See Every Project.
            </h1>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[32px] xl:text-[36px] 2xl:text-[42px] font-bold tracking-tight text-drishti-terracotta leading-[1.12]">
              Detect Every Risk.
            </h2>
          </div>

          {/* Subtitle Paragraph */}
          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
            Drishti brings project, financial, and execution data together to help authorities identify risks, irregularities, and implementation issues earlier.
          </p>

          {/* 3 Qualitative Intelligence Features with Circular Pastel Badges */}
          <div className="space-y-2.5 pt-1 lg:pr-6 xl:pr-0">
            {/* Feature 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e8f0ec] text-drishti-forest flex items-center justify-center border border-drishti-forest/20 shrink-0 shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-drishti-forest" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  Anomaly Detection
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  Identify unusual project and expenditure patterns.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fcedea] text-drishti-terracotta flex items-center justify-center border border-drishti-terracotta/20 shrink-0 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-drishti-terracotta" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  Risk-Based Monitoring
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  Bring high-priority works to attention.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fdf4e7] text-amber-700 flex items-center justify-center border border-amber-300/50 shrink-0 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  Actionable Intelligence
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  Turn complex MPLADS data into clear insights.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side: Bottom Devnagari Governance Motto */}
        <div className="relative z-10 pt-3 border-t border-drishti-sand/70">
          <p className="font-serif italic text-sm sm:text-base text-drishti-forest/90 tracking-wide">
            “पारदर्शिता • जवाबदेही • विकास”
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Floating Login Card & Quick Demo Access */}
      {/* Expanded to lg:w-[62%] xl:w-[64%] with Curvy Edge & BG Lines */}
      {/* ============================================================ */}
      <div className="lg:w-[60%] xl:w-[62%] lg:h-full lg:max-h-screen overflow-hidden bg-drishti-ivory p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-10">
        {/* Decorative Sweeping Ribbon & Slit Curves in Background (matching reference image) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
          <svg
            className="absolute -top-12 -right-12 w-[540px] h-[780px] pointer-events-none"
            viewBox="0 0 550 800"
            fill="none"
          >
            {/* Primary elegant sweeping ribbon arc */}
            <path
              d="M420,-40 C460,180 560,300 480,480 C400,660 220,700 80,820"
              stroke="#0b2e27"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-25"
            />
            {/* Secondary warm terracotta contour line */}
            <path
              d="M490,-60 C530,200 610,350 520,530 C430,710 260,740 120,860"
              stroke="#c25e2e"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-30"
            />
            {/* Inner loop arc */}
            <path
              d="M360,-20 C400,210 510,320 440,500 C370,680 190,700 50,830"
              stroke="#0b2e27"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-20"
            />
            {/* Outer subtle slit curve */}
            <path
              d="M540,30 C550,250 490,400 390,560 C290,720 130,770 10,830"
              stroke="#d97706"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="opacity-25"
            />
            {/* Delicate inner accent curve */}
            <path
              d="M300,-10 C340,230 460,350 380,540 C300,730 130,740 20,870"
              stroke="#0b2e27"
              strokeWidth="1"
              strokeLinecap="round"
              className="opacity-18"
            />
            {/* Top-right concentric decorative accent ring */}
            <circle
              cx="480"
              cy="80"
              r="140"
              stroke="#0b2e27"
              strokeWidth="1"
              strokeDasharray="4 6"
              className="opacity-15"
            />
          </svg>
          {/* Soft warm ambient background glow */}
          <div className="absolute -top-10 -right-10 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-drishti-sage/25 rounded-full blur-3xl" />
        </div>

        {/* Top spacer (keeps the card vertically centred) */}
        <div className="h-1 shrink-0" />

        {/* Center: Main Floating Login Card (Enlarged & Spacious) */}
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-[530px] xl:max-w-[560px] mx-auto my-auto py-1 relative z-10">
          <div className="bg-white rounded-3xl p-6 sm:p-7 lg:p-8 shadow-xl border border-drishti-sand/90 relative">
            {/* Top pill accent */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />

            {/* Header */}
            <div className="text-center space-y-0.5 mb-4">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-drishti-forest/80 block">
                WELCOME BACK
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-drishti-forest leading-tight">
                Sign in to Drishti
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Access your MPLADS intelligence dashboard.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-drishti-forest/20 focus:border-drishti-forest focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-drishti-forest/20 focus:border-drishti-forest focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-5 bg-drishti-forest hover:bg-drishti-forest-light text-drishti-ivory font-semibold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {/* Easy Login Features (Demo Role Switcher) */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="relative flex py-0.5 items-center mb-2.5">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink-0 mx-2 text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500">
                  Quick demo access — one click, no sign-up
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CANONICAL_DEMO_ACCOUNTS.map((acc) => {
                  const RoleIcon = getRoleIcon(acc.role as Role);
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickLogin(acc.role as Role)}
                      disabled={loading}
                      className="p-2 sm:p-2.5 bg-slate-50 hover:bg-drishti-cream border border-slate-200 hover:border-drishti-forest/30 rounded-xl text-left transition-all group disabled:opacity-50 flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-drishti-forest group-hover:scale-105 transition-transform shrink-0">
                        <RoleIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-bold text-slate-800 group-hover:text-drishti-forest leading-tight">
                          {acc.label}
                        </p>
                        <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                          {acc.scope}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Back to Home Link */}
          <div className="text-center mt-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-drishti-forest transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Small spacer */}
        <div className="h-1" />
      </div>
    </div>
  );
};

export default Login;


