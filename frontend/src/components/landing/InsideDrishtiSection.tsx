import React from 'react';
import { CountUp, Reveal } from './Reveal';

// High-severity counts per model, matching the live national dashboard (Ministry view).
const findings = [
  { model: 'Cost anomalies', value: 986, label: 'High-severity cost outliers', color: 'text-red-700' },
  { model: 'Duplicate works', value: 1054, label: 'Groups of near-identical works (6,161 works)', color: 'text-blue-700' },
  { model: 'Fund & expenditure', value: 1333, label: 'High payment flags', color: 'text-amber-700' },
  { model: 'Statutory delays', value: 15263, label: 'Serious deadline breaches', color: 'text-sky-700' },
  { model: 'Predictive risk', value: 255, label: 'Open works likely to miss deadline', color: 'text-purple-700' },
];

export const InsideDrishtiSection: React.FC = () => {
  return (
    <section
      id="inside"
      className="py-16 lg:py-24 bg-gradient-to-b from-transparent to-drishti-cream/50 border-t border-drishti-sand/60 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-px bg-drishti-terracotta" />
            <span className="text-xs font-sans font-semibold tracking-widest uppercase text-drishti-forest">
              Inside Drishti
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-drishti-forest leading-tight">
            What the Models Found
          </h2>
          <p className="text-base text-slate-600 font-sans mt-4 leading-relaxed">
            Five independent models, each scoring a different kind of risk. These are the high-priority
            counts across the national dataset.
          </p>
        </Reveal>

        {/* Model findings strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {findings.map((item, idx) => (
            <Reveal
              key={item.model}
              delay={idx * 100}
              className={`h-full ${idx === findings.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <div className="h-full bg-white rounded-xl border border-drishti-sand p-4 hover:border-drishti-forest/30 hover:shadow-sm transition-all">
                <div className={`text-[10px] font-sans font-semibold uppercase tracking-wider ${item.color}`}>
                  {item.model}
                </div>
                <div className="font-serif text-2xl font-bold text-slate-900 mt-1">
                  <CountUp value={item.value} />
                </div>
                <div className="text-[11px] font-sans text-slate-600 leading-snug">{item.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Dashboard screenshot in a browser frame */}
        <Reveal from="scale" delay={150}>
          <div className="rounded-2xl overflow-hidden border border-drishti-sand shadow-2xl bg-white">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-drishti-cream border-b border-drishti-sand">
              <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
              <span className="ml-3 text-[11px] font-sans text-slate-500 bg-white rounded-md px-3 py-0.5 border border-drishti-sand">
                Drishti · National Executive Dashboard
              </span>
            </div>
            <img
              src="/dashboard-preview.webp"
              alt="Drishti national executive dashboard showing sanctioned works, fund utilisation and per-model risk counts"
              loading="lazy"
              width={1440}
              height={900}
              className="w-full h-auto block"
            />
          </div>
          <p className="text-center text-xs font-sans text-slate-500 mt-4">
            Ministry view · every role sees only its own jurisdiction
          </p>
        </Reveal>
      </div>
    </section>
  );
};
