'use client';

import  LightRays from './LightRays';

interface AnimatedBackgroundProps {
  className?: string;
}

export function AnimatedBackground({ className = '' }: AnimatedBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="w-full h-full">
  <LightRays
    raysOrigin="bottom-center"
    raysColor="#ffffff"
    raysSpeed={1}
    lightSpread={0.5}
    rayLength={3.5}
    pulsating={false}
    fadeDistance={1.3}
    saturation={1}
    followMouse
    mouseInfluence={0.2}
    noiseAmount={0.1}
    distortion={0}
  />
</div>
    </div>
  );
}