import React from 'react';
import { CountUp, Reveal } from './Reveal';

// Figures match the live national dashboard (Ministry view).
const stats = [
  { value: 98825, label: 'Works analysed', color: 'text-drishti-forest' },
  { value: 5891, prefix: '₹', suffix: ' Cr', label: 'Funds sanctioned', color: 'text-drishti-terracotta' },
  { value: 109311, label: 'Payment records', color: 'text-drishti-forest' },
  { value: 36, label: 'States & UTs', color: 'text-drishti-terracotta' },
  { value: 5, label: 'Independent AI models', color: 'text-drishti-forest' },
];

export const StatsBand: React.FC = () => {
  return (
    <section className="relative border-y border-drishti-sand/70 bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <Reveal>
          <p className="text-center text-xs font-sans font-semibold tracking-widest uppercase text-drishti-forest mb-8">
            Running on real MPLADS portal data · Lok Sabha 18 &amp; Rajya Sabha
          </p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4 text-center">
          {stats.map((stat, idx) => (
            <Reveal
              key={stat.label}
              delay={idx * 100}
              className={idx === stats.length - 1 ? 'col-span-2 md:col-span-1' : ''}
            >
              <div className={`font-serif text-3xl lg:text-4xl font-bold ${stat.color}`}>
                <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-sans text-slate-600 mt-1">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
