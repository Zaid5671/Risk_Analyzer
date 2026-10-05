import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingBackground } from '@/components/landing/LandingBackground';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsBand } from '@/components/landing/StatsBand';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { InsideDrishtiSection } from '@/components/landing/InsideDrishtiSection';
import { StakeholdersSection } from '@/components/landing/StakeholdersSection';

export const DrishtiLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-drishti-ivory text-slate-800 font-sans selection:bg-drishti-forest selection:text-drishti-ivory relative overflow-x-hidden">
      {/* Subtle, continuous editorial background curves & glows */}
      <LandingBackground />

      {/* Sticky Top Navigation */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Real-data stats band */}
        <StatsBand />

        {/* 3. How It Works Section */}
        <HowItWorksSection />

        {/* 4. Model findings + live dashboard preview */}
        <InsideDrishtiSection />

        {/* 5. Stakeholders, CTA & Institutional Footer */}
        <StakeholdersSection />
      </main>
    </div>
  );
};

export default DrishtiLanding;
