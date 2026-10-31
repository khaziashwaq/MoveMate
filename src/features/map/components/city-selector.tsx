"use client";

import { useState } from "react";

type City = {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
};

export const CITIES: City[] = [
  { name: "Pune", lat: 18.5204, lng: 73.8567, zoom: 13 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, zoom: 13 },
];

export function CitySelector({ onSelect }: { onSelect: (city: City) => void }) {
  const [search, setSearch] = useState("");

  const filtered = CITIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4">
        {/* GTA-style header */}
        <div className="text-center mb-8">
          <p className="text-white/70 mt-2 text-sm uppercase tracking-widest">
            Select your city to enter
          </p>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/60 border-2 border-gta-green/50 px-4 py-3 text-white placeholder-white/40 uppercase tracking-wider text-sm focus:outline-none focus:border-gta-green"
          />
        </div>

        {/* City grid */}
        <div className="grid grid-cols-2 gap-3 max-h-100 overflow-y-auto">
          {filtered.map((city) => (
            <button
              key={city.name}
              onClick={() => onSelect(city)}
              className="group bg-black/60 border-2 border-white/20 px-4 py-4 text-left hover:border-gta-green hover:bg-gta-green/10 transition-all duration-150"
            >
              <span className="text-white font-bold uppercase tracking-wider group-hover:text-gta-green transition-colors">
                {city.name}
              </span>
              <span className="block text-white/40 text-xs mt-1 uppercase">
                Enter City →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { City };
