"use client";

import Link from "next/link";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-gta-dark flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 gta-grid-bg opacity-20" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 gta-scanlines pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">
        {/* Logo */}
        <h1 className="text-6xl md:text-8xl font-bold uppercase text-gta-green gta-text-shadow tracking-wider">
          MoveMate
        </h1>
        <p className="mt-3 text-white/50 text-sm uppercase tracking-[0.3em]">
          Moving in or out in any city shouldn't be a hassle.
        </p>

        {/* Divider */}
        <div className="w-32 h-px bg-gta-green/40 mt-8 mb-8" />

        {/* Description */}
        <p className="text-white/60 text-sm leading-relaxed max-w-md">
          Find your next flat or furniture or list your own to help fellow
          movers in the city.
        </p>

        {/* Sign In Button */}
        <Link
          href="/login"
          className="mt-10 w-full max-w-xs flex items-center justify-center gap-3 bg-black/60 border-2 border-gta-green px-6 py-4 text-gta-green font-bold uppercase tracking-wider text-sm hover:bg-gta-green/10 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 256 256" fill="currentColor">
            <path d="M224,128a96,96,0,1,1-21.95-61.09,8,8,0,1,1-12.33,10.18A80,80,0,1,0,207.6,136H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128Z"/>
          </svg>
          Sign in with Google
        </Link>

        {/* Bottom hint */}
        <p className="mt-6 text-white/30 text-xs uppercase tracking-wider">
          Sign in to select your city & explore the map
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-gta-green/30" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-gta-green/30" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-gta-green/30" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-gta-green/30" />
    </main>
  );
}
