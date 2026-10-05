import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowDown,
  Check,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { Reveal } from './Reveal';
import { DEMO_PATH } from './links';

const capabilities = [
  {
    title: 'Anomaly Detection',
    description: 'Unusual expenditure and project patterns',
    icon: AlertTriangle,
    circle: 'bg-[#e8f0ec] border-drishti-forest/15',
    iconColor: 'text-drishti-forest',
  },
  {
    title: 'Risk-Based Alerts',
    description: 'High-risk works requiring immediate scrutiny',
    icon: Sparkles,
    circle: 'bg-[#fcedea] border-drishti-terracotta/20',
    iconColor: 'text-drishti-terracotta',
  },
  {
    title: 'Predictive Insights',
    description: 'Early warning on delays and overruns',
    icon: TrendingUp,
    circle: 'bg-[#eef3f9] border-blue-200',
    iconColor: 'text-blue-700',
  },
  {
    title: 'Compliance',
    description: 'Tracking adherence to official norms',
    icon: FileCheck2,
    circle: 'bg-[#fdf4e7] border-amber-300',
    iconColor: 'text-amber-700',
  },
];

export const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden bg-transparent">
      {/* Subtle Background Radial Highlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-drishti-sage/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Editorial Typography & Actions */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-7">
            {/* Eyebrow */}
            <Reveal>
              <div className="inline-flex items-center gap-2.5">
                <span className="w-6 h-px bg-drishti-terracotta" />
                <span className="text-xs font-sans font-semibold tracking-widest uppercase text-drishti-forest">
                  AI-Powered MPLADS Intelligence
                </span>
              </div>
            </Reveal>

            {/* Main Headline */}
            <div className="space-y-1">
              <Reveal delay={100}>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-drishti-forest leading-[1.12]">
                  See Every Project.
                </h1>
              </Reveal>
              <Reveal delay={220}>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-drishti-terracotta leading-[1.12]">
                  Detect Every Risk.
                </h2>
              </Reveal>
            </div>

            {/* Supporting Copy */}
            <Reveal delay={340}>
              <p className="text-base sm:text-lg text-slate-700 font-sans leading-relaxed max-w-2xl">
                Drishti transforms MPLADS data into actionable intelligence — identifying anomalies,
                delays, cost irregularities and potential risks before they become larger problems.
              </p>
            </Reveal>

            {/* Action Buttons */}
            <Reveal delay={460} className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  to={DEMO_PATH}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-drishti-forest text-drishti-ivory text-sm font-semibold hover:bg-drishti-forest-light hover:shadow-lg transition-all group"
                >
                  <span>Try Live Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white border border-drishti-sand text-slate-800 text-sm font-semibold hover:bg-drishti-cream/70 hover:border-slate-300 transition-all shadow-2xs group"
                >
                  <div className="w-5 h-5 rounded-full bg-drishti-terracotta/10 flex items-center justify-center text-drishti-terracotta">
                    <ArrowDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <span>See How It Works</span>
                </a>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Check className="w-3.5 h-3.5 text-drishti-forest" />
                No sign-up needed — one-click demo access for all 4 roles
              </p>
            </Reveal>

            {/* 4 Small Capability Items with Soft Circular Icons */}
            <div className="pt-6 border-t border-drishti-sand/70 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {capabilities.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={600 + idx * 110} className="space-y-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.circle}`}>
                      <Icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{item.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Parliament Jharokha Image As It Is */}
          <div className="lg:col-span-5 xl:col-span-5 relative flex justify-center">
            <Reveal from="right" delay={250} className="w-full max-w-md relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-drishti-sand/90 bg-white">
                <img
                  src="/hero-parliament.jpg"
                  alt="New Parliament of India (Sansad Bhavan) framed by traditional Indian carved jharokha arch"
                  className="w-full h-auto object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
