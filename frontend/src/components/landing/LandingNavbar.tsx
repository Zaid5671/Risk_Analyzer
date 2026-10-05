import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { DEMO_PATH, GITHUB_URL } from './links';

const navItems = [
  { label: 'Home', href: '#hero' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Inside Drishti', href: '#inside' },
  { label: 'Stakeholders', href: '#stakeholders' },
];

export const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-drishti-ivory/95 backdrop-blur-md shadow-xs border-b border-drishti-sand/70 py-4'
          : 'bg-drishti-ivory/90 backdrop-blur-xs border-b border-drishti-sand/40 py-6 sm:py-6.5'
      }`}
    >
      <div className="max-w-[1440px] xl:max-w-[1536px] mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Brand Logo & Subtitle */}
        <a href="#hero" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-drishti-forest flex items-center justify-center text-amber-400 shadow-xs border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-2xl sm:text-[26px] tracking-tight text-drishti-forest leading-none">
                Drishti
              </span>
              <span className="hidden sm:inline text-[10px] font-sans font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-drishti-terracotta/10 text-drishti-terracotta border border-drishti-terracotta/20">
                AI Monitor
              </span>
            </div>
            <p className="hidden sm:block text-xs font-sans text-drishti-muted tracking-wide mt-1">
              MPLADS Intelligence Platform
            </p>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3.5 py-2 text-xs sm:text-[13px] font-sans font-medium text-slate-700 hover:text-drishti-forest hover:bg-drishti-cream/70 rounded-lg transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Actions: GitHub & Primary CTA */}
        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-drishti-sand bg-white text-xs sm:text-[13px] font-semibold text-slate-800 hover:bg-drishti-cream/70 transition-colors shadow-2xs"
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub</span>
          </a>

          <Link
            to={DEMO_PATH}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-drishti-forest text-drishti-ivory text-xs sm:text-[13px] font-semibold hover:bg-drishti-forest-light hover:shadow-md transition-all group"
          >
            <span>Try Live Demo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-slate-700 hover:bg-drishti-cream"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-drishti-ivory border-b border-drishti-sand px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-800 hover:bg-drishti-cream rounded-md"
            >
              {item.label}
            </a>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-drishti-cream rounded-md"
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <div className="pt-2 border-t border-drishti-sand">
            <Link
              to={DEMO_PATH}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-drishti-forest text-white text-xs font-semibold"
            >
              <span>Try Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
