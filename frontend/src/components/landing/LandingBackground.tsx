import React from 'react';

/**
 * LandingBackground
 * Provides an editorial, continuous background design across the entire landing page.
 * Features sweeping contour ribbon curves in forest green, terracotta, and amber,
 * delicate concentric dashed accent rings, and soft warm ambient glows, matching
 * the refined aesthetic of the login page.
 */
export const LandingBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-0"
    >
      {/* ============================================================ */}
      {/* 1. TOP / HERO SECTION RIBBON CLUSTER (Top-Right)              */}
      {/* ============================================================ */}
      <div className="absolute top-0 right-0 w-[550px] sm:w-[650px] lg:w-[780px] h-[900px] overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 780 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Primary sweeping ribbon arc in forest green */}
          <path
            d="M620,-60 C660,180 780,320 670,520 C560,720 330,760 130,900"
            stroke="#0b2e27"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-25"
          />
          {/* Secondary warm terracotta contour line */}
          <path
            d="M700,-80 C740,200 840,370 720,570 C600,770 370,800 180,940"
            stroke="#c25e2e"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-30"
          />
          {/* Inner loop arc */}
          <path
            d="M540,-40 C580,210 710,340 610,540 C510,740 280,760 100,910"
            stroke="#0b2e27"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-20"
          />
          {/* Outer subtle golden amber slit curve */}
          <path
            d="M770,30 C780,270 710,440 580,620 C450,800 240,840 60,910"
            stroke="#d97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="opacity-25"
          />
          {/* Delicate inner accent curve */}
          <path
            d="M470,-30 C510,230 640,370 540,580 C440,790 220,800 70,950"
            stroke="#0b2e27"
            strokeWidth="1"
            strokeLinecap="round"
            className="opacity-18"
          />

          {/* Concentric dashed decorative accent rings */}
          <circle
            cx="660"
            cy="140"
            r="150"
            stroke="#0b2e27"
            strokeWidth="1"
            strokeDasharray="4 6"
            className="opacity-15"
          />
          <circle
            cx="660"
            cy="140"
            r="220"
            stroke="#c25e2e"
            strokeWidth="1"
            strokeDasharray="6 8"
            className="opacity-12"
          />
        </svg>

        {/* Ambient warm radial glow */}
        <div className="absolute top-10 right-20 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl" />
        <div className="absolute top-80 right-60 w-96 h-96 bg-drishti-sage/20 rounded-full blur-3xl" />
      </div>

      {/* ============================================================ */}
      {/* 2. MID / "HOW IT WORKS" FLOWING RIBBON CLUSTER (Mid-Left)      */}
      {/* ============================================================ */}
      <div className="absolute top-[820px] lg:top-[780px] left-0 w-[550px] sm:w-[650px] lg:w-[750px] h-[920px] overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 750 920"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Primary wave sweeping across from the left side */}
          <path
            d="M-50,60 C140,40 310,160 350,340 C390,520 260,690 420,860"
            stroke="#0b2e27"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-22"
          />
          {/* Terracotta companion curve */}
          <path
            d="M-70,120 C120,100 280,220 315,390 C350,560 220,730 380,900"
            stroke="#c25e2e"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-28"
          />
          {/* Golden amber accent wave */}
          <path
            d="M-30,10 C170,10 340,130 390,310 C440,490 300,650 460,820"
            stroke="#d97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="opacity-22"
          />
          {/* Delicate inner hairline wave */}
          <path
            d="M-60,180 C90,160 230,270 275,430 C320,590 200,755 330,910"
            stroke="#0b2e27"
            strokeWidth="1"
            strokeLinecap="round"
            className="opacity-18"
          />

          {/* Concentric dashed decorative accent rings on the mid-left */}
          <circle
            cx="140"
            cy="410"
            r="150"
            stroke="#0b2e27"
            strokeWidth="1"
            strokeDasharray="5 7"
            className="opacity-14"
          />
          <circle
            cx="140"
            cy="410"
            r="230"
            stroke="#c25e2e"
            strokeWidth="1"
            strokeDasharray="4 6"
            className="opacity-10"
          />
        </svg>

        {/* Ambient warm radial glow */}
        <div className="absolute top-32 left-12 w-80 h-80 bg-amber-100/35 rounded-full blur-3xl" />
        <div className="absolute top-96 left-44 w-96 h-96 bg-drishti-sage/25 rounded-full blur-3xl" />
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM / "STAKEHOLDERS & CTA" RIBBON CLUSTER (Bottom-Right)*/}
      {/* ============================================================ */}
      <div className="absolute bottom-0 right-0 w-[550px] sm:w-[650px] lg:w-[760px] h-[920px] overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 760 920"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sweeping bottom ribbon arc in forest green */}
          <path
            d="M660,20 C600,230 430,370 470,560 C510,750 340,840 140,890"
            stroke="#0b2e27"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-24"
          />
          {/* Terracotta companion curve */}
          <path
            d="M720,60 C650,280 480,410 520,600 C560,790 390,880 190,930"
            stroke="#c25e2e"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-28"
          />
          {/* Golden amber slit curve */}
          <path
            d="M590,-20 C530,190 380,320 420,510 C460,700 300,800 100,840"
            stroke="#d97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="opacity-22"
          />
          {/* Delicate inner hairline wave */}
          <path
            d="M520,10 C470,210 330,340 370,530 C410,720 250,810 70,860"
            stroke="#0b2e27"
            strokeWidth="1"
            strokeLinecap="round"
            className="opacity-16"
          />

          {/* Concentric dashed decorative accent rings */}
          <circle
            cx="490"
            cy="600"
            r="140"
            stroke="#0b2e27"
            strokeWidth="1"
            strokeDasharray="4 6"
            className="opacity-14"
          />
          <circle
            cx="490"
            cy="600"
            r="210"
            stroke="#c25e2e"
            strokeWidth="1"
            strokeDasharray="6 8"
            className="opacity-10"
          />
        </svg>

        {/* Ambient glows behind the stakeholders & CTA container */}
        <div className="absolute bottom-28 right-24 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-60 right-64 w-96 h-96 bg-drishti-sage/20 rounded-full blur-3xl" />
      </div>

      {/* ============================================================ */}
      {/* 4. SUBTLE CONNECTING AMBIENT WASHES & VERTICAL CADENCE       */}
      {/* ============================================================ */}
      <div className="absolute top-[40%] right-10 w-72 h-72 bg-amber-100/25 rounded-full blur-3xl" />
      <div className="absolute top-[65%] left-1/4 w-80 h-80 bg-drishti-sage/15 rounded-full blur-3xl" />
    </div>
  );
};

export default LandingBackground;
