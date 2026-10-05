import React from 'react';
import { Database, Cpu, Search, BellCheck } from 'lucide-react';
import { Reveal } from './Reveal';
import { useInViewOnce } from './useInViewOnce';

export const HowItWorksSection: React.FC = () => {
  const [gridRef, gridInView] = useInViewOnce<HTMLDivElement>();
  const steps = [
    {
      num: '01',
      title: 'Collect',
      description:
        'Bring together MPLADS project, sanction, expenditure, payment, progress and completion data across administrative portals.',
      icon: Database,
      bg: 'bg-[#e7f0ec]', // soft sage/mint
      text: 'text-drishti-forest',
      border: 'border-drishti-forest/20',
    },
    {
      num: '02',
      title: 'Analyze',
      description:
        'AI/ML models analyze multidimensional patterns across peer groups, costs, timelines and fund utilization lifecycles.',
      icon: Cpu,
      bg: 'bg-[#fcedea]', // soft peach/terracotta
      text: 'text-drishti-terracotta',
      border: 'border-drishti-terracotta/25',
    },
    {
      num: '03',
      title: 'Detect',
      description:
        'Identify cost outliers, duplicate proposals, statutory delays, unusual payment pacing and structural compliance deviations.',
      icon: Search,
      bg: 'bg-[#eef3f9]', // soft slate blue
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    {
      num: '04',
      title: 'Act',
      description:
        'Generate risk-based alerts and decision-support dossiers so authorities can investigate and intervene early before disbursement.',
      icon: BellCheck,
      bg: 'bg-[#fdf4e7]', // soft amber
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-transparent border-t border-drishti-sand/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block matching Screenshot 3 */}
        <Reveal className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-px bg-drishti-terracotta" />
            <span className="text-xs font-sans font-semibold tracking-widest uppercase text-drishti-forest">
              How It Works
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-drishti-forest leading-tight">
            From Raw Data to Actionable Intelligence
          </h2>
          <p className="text-base text-slate-600 font-sans mt-4 leading-relaxed">
            Drishti brings project, financial and execution data together and turns it into clear
            risk signals for faster decision-making.
          </p>
        </Reveal>

        {/* 4 Sequential Steps Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
          {/* Subtle connecting guideline on desktop — draws left to right as the cards arrive */}
          <div
            className={`hidden lg:block absolute top-7 left-14 right-14 h-px bg-drishti-sand/80 -z-0 origin-left transition-transform duration-[1400ms] ease-out motion-reduce:transition-none ${
              gridInView ? 'scale-x-100' : 'scale-x-0'
            }`}
          />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.num} delay={idx * 150} className="h-full">
              <div
                className="relative h-full bg-white/70 rounded-2xl p-6 border border-drishti-sand/80 hover:border-drishti-forest/30 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Circular Icon & Stage Number */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-14 h-14 rounded-full ${step.bg} ${step.text} flex items-center justify-center border ${step.border} group-hover:scale-110 transition-transform shadow-xs`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-serif text-2xl font-bold text-drishti-sand group-hover:text-drishti-terracotta transition-colors">
                      {step.num}
                    </span>
                  </div>

                  {/* Stage Content */}
                  <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="mt-5 pt-3 border-t border-drishti-sand/50 flex items-center justify-between">
                  <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-slate-400">
                    Workflow Pipeline
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-drishti-forest/40 group-hover:bg-drishti-terracotta transition-colors" />
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
