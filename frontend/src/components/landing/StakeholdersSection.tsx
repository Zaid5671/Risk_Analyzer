import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, MapPin, Building2, Landmark, Check, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { GithubIcon } from './GithubIcon';
import { DEMO_PATH, GITHUB_URL } from './links';

export const StakeholdersSection: React.FC = () => {
  const stakeholders = [
    {
      title: 'Members of Parliament',
      roleSubtitle: 'Constituency Decision Support',
      badge: 'MP Governance',
      icon: UserCheck,
      points: [
        'Real-time scrutiny of recommended projects',
        'Early alerts on sanction bottlenecks',
        'Constituency developmental velocity tracking',
      ],
    },
    {
      title: 'District Authorities',
      roleSubtitle: 'District Magistrates & IDAs',
      badge: 'Implementing',
      icon: MapPin,
      points: [
        'Statutory sanction timeline SLA alerts',
        'Cross-boundary duplicate proposal detection',
        'Peer group cost estimate validation',
      ],
    },
    {
      title: 'State Nodal Authorities',
      roleSubtitle: 'State-Level Oversight',
      badge: 'State Coord',
      icon: Building2,
      points: [
        'Inter-district cost variance benchmarking',
        'State-wide delay escalation and triage',
        'Comprehensive fund utilization monitoring',
      ],
    },
    {
      title: 'Central Ministry',
      roleSubtitle: 'MoSPI National Directorate',
      badge: 'National Oversight',
      icon: Landmark,
      points: [
        'National macro surveillance across States & UTs',
        'Systemic pattern and fraud risk identification',
        'Unified role-based administrative control',
      ],
    },
  ];

  return (
    <section
      id="stakeholders"
      className="bg-transparent border-t border-drishti-sand/70 pt-16 lg:pt-24 pb-6 relative"
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* 1. Header */}
        <Reveal className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-px bg-drishti-terracotta" />
            <span className="text-xs font-sans font-semibold tracking-widest uppercase text-drishti-forest">
              Built for Decision Makers
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-drishti-forest leading-tight">
            One View. Different Perspectives.
          </h2>
          <p className="text-base text-slate-600 font-sans mt-4 leading-relaxed max-w-2xl">
            Drishti delivers tailored operational visibility and analytical depth for every administrative tier.
          </p>
        </Reveal>

        {/* 2. Stakeholder Cards Grid (1 row of 4 columns on lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stakeholders.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={idx * 150} className="h-full">
                <div className="h-full bg-white rounded-xl p-5 border border-drishti-sand hover:border-drishti-forest/40 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-drishti-cream flex items-center justify-center text-drishti-forest group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4 text-drishti-forest" />
                      </div>
                      <span className="text-[9px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-drishti-forest/10 text-drishti-forest border border-drishti-forest/15">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-drishti-forest transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-sans font-semibold text-drishti-terracotta mb-3">
                      {item.roleSubtitle}
                    </p>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                      {item.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-1.5 text-xs text-slate-600 leading-snug">
                          <Check className="w-3 h-3 text-drishti-forest shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* 3. Integrated Platform CTA Banner */}
        <Reveal delay={150} className="mt-10">
          <div className="bg-white/95 rounded-2xl p-6 lg:p-8 border border-drishti-sand/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="w-4 h-px bg-drishti-terracotta" />
                <span className="text-[10px] font-sans font-semibold tracking-widest uppercase text-drishti-forest">
                  The Future of MPLADS Monitoring
                </span>
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-drishti-forest leading-tight">
                See More. <span className="text-drishti-terracotta">Know Earlier.</span> Act Smarter.
              </h3>
              <p className="text-sm text-slate-600 font-sans max-w-xl">
                Log in as a Ministry, State, District or MP user — no sign-up needed.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <Link
                to={DEMO_PATH}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-drishti-forest text-drishti-ivory text-sm font-semibold hover:bg-drishti-forest-light hover:shadow-md transition-all group"
              >
                <span>Try Live Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-drishti-sand text-slate-800 text-sm font-semibold hover:bg-drishti-cream/80 transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                <span>View Source on GitHub</span>
              </a>
            </div>
          </div>
        </Reveal>

        {/* 4. Streamlined Institutional Footer Bar */}
        <footer className="mt-16 pt-5 border-t border-drishti-sand/70 text-slate-600 text-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-700">
              <span className="font-serif font-bold text-sm text-drishti-forest">Drishti</span>
              <span>•</span>
              <span>Built by <strong className="text-slate-800">Team Code Blooded</strong></span>
              <span>•</span>
              <span className="text-slate-500">Smart India Hackathon 2026 (PS 26102)</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-drishti-forest transition-colors">How It Works</a>
              <a href="#inside" className="hover:text-drishti-forest transition-colors">Inside Drishti</a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-drishti-forest transition-colors">GitHub</a>
              <Link to={DEMO_PATH} className="text-drishti-terracotta hover:underline">Live Demo →</Link>
            </div>
            <div className="font-serif text-[11px] text-amber-800/80 tracking-wide">
              सत्यमेव जयते • पारदर्शी शासन • सशक्त नागरिक
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};
