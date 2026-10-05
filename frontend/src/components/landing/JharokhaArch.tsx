import React from 'react';

interface JharokhaArchProps {
  children: React.ReactNode;
  className?: string;
  hasOrnament?: boolean;
  aspectRatio?: string; // e.g. 'aspect-[4/5]' or 'aspect-[3/4]'
}

export const JharokhaArch: React.FC<JharokhaArchProps> = ({
  children,
  className = '',
  hasOrnament = true,
  aspectRatio = 'aspect-[4/5]',
}) => {
  const clipId = React.useId().replace(/:/g, '-');

  return (
    <div className={`relative ${aspectRatio} ${className}`}>
      {/* SVG Clip Path Definition (Normalized 0 to 1 for objectBoundingBox) */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id={`jharokha-clip-${clipId}`} clipPathUnits="objectBoundingBox">
            <path
              d="
                M 0,1
                L 0,0.52
                C 0,0.48 0.04,0.44 0.08,0.43
                C 0.05,0.38 0.07,0.31 0.14,0.30
                C 0.14,0.22 0.22,0.18 0.29,0.19
                C 0.31,0.11 0.40,0.08 0.47,0.11
                C 0.48,0.04 0.50,0.0 0.50,0.0
                C 0.50,0.0 0.52,0.04 0.53,0.11
                C 0.60,0.08 0.69,0.11 0.71,0.19
                C 0.78,0.18 0.86,0.22 0.86,0.30
                C 0.93,0.31 0.95,0.38 0.92,0.43
                C 0.96,0.44 1.0,0.48 1.0,0.52
                L 1.0,1
                Z
              "
            />
          </clipPath>
        </defs>
      </svg>

      {/* Clipped Container */}
      <div
        className="w-full h-full overflow-hidden shadow-2xl relative"
        style={{
          clipPath: `url(#jharokha-clip-${clipId})`,
          WebkitClipPath: `url(#jharokha-clip-${clipId})`,
        }}
      >
        {children}
      </div>

      {/* Architectural Fine Sandstone / Gold Ornamental Border Frame */}
      {hasOrnament && (
        <svg
          viewBox="0 0 100 125"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md"
          fill="none"
        >
          {/* Outer Symmetrical Arch Outline Trace */}
          <path
            d="
              M 0.5,124.5
              L 0.5,65
              C 0.5,60 4.5,55 9,53.75
              C 5.5,47.5 7.5,38.75 15,37.5
              C 15,27.5 24,22.5 32,23.75
              C 35,13.75 44,10 50,1
              C 56,10 65,13.75 68,23.75
              C 76,22.5 85,27.5 85,37.5
              C 92.5,38.75 94.5,47.5 91,53.75
              C 95.5,55 99.5,60 99.5,65
              L 99.5,124.5
            "
            stroke="#d4a373"
            strokeWidth="1.5"
            strokeOpacity="0.65"
          />
          {/* Subtle concentric inner hairline */}
          <path
            d="
              M 3,124
              L 3,66
              C 3,61 6.5,56.5 10.5,55.5
              C 7.5,49.5 9.5,41.5 16.5,40
              C 16.5,30.5 25,25.5 32.5,26.5
              C 35.5,17 44,13.5 50,4.5
              C 56,13.5 64.5,17 67.5,26.5
              C 75,25.5 83.5,30.5 83.5,40
              C 90.5,41.5 92.5,49.5 89.5,55.5
              C 93.5,56.5 97,61 97,66
              L 97,124
            "
            stroke="#e6ded1"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
        </svg>
      )}
    </div>
  );
};
