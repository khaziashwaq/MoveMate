"use client";

import { useState, useEffect } from "react";

type Props = {
  onClose: () => void;
  onSubmit: (listing: {
    category: string;
    title: string;
    description: string;
    address: string;
    landmark: string;
    rent: string;
    deposit: string;
    brokerage: string;
    availableFrom: string;
    features: string[];
    flatmateInfo: string;
    preferences: string;
  }) => void;
  pinLocation: { lat: number; lng: number } | null;
};

const CATEGORIES = [
  { key: "FURNITURE", label: "Furniture Selling", icon: "🪑" },
  { key: "ROOMMATE", label: "Roommate Required", icon: "🤝" },
] as const;

export function ListingFormPane({
  onClose,
  onSubmit,
  pinLocation,
}: Props) {
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    address: "",
    landmark: "",
    rent: "",
    deposit: "",
    brokerage: "",
    availableFrom: "",
    features: [""],
    flatmateInfo: "",
    preferences: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const update = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => {
          if (prev.length >= 5) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Reverse geocode pin location to auto-fill address and landmark
  useEffect(() => {
    if (!pinLocation) return;
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pinLocation.lat}&lon=${pinLocation.lng}&format=json&addressdetails=1`,
      { signal: controller.signal, headers: { "Accept-Language": "en" } },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.display_name) {
          update("address", data.display_name);
        }
        const addr = data.address || {};
        const landmark =
          addr.neighbourhood || addr.suburb || addr.village || "";
        if (landmark) {
          update("landmark", landmark);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pinLocation?.lat, pinLocation?.lng]);

  const addFeature = () => {
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  };

  const updateFeature = (index: number, value: string) => {
    setForm((prev) => {
      const features = [...prev.features];
      features[index] = value;
      return { ...prev, features };
    });
  };

  const removeFeature = (index: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    onSubmit(form);
    onClose();
  };

  const isValid =
    form.category !== "" &&
    form.title.trim() !== "" &&
    form.address.trim() !== "" &&
    form.rent.trim() !== "" &&
    pinLocation !== null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 z-[2000] flex flex-col bg-[#161816] border-l border-white/5 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
        <span className="text-white font-semibold text-sm">
          Got Space/Stuff?
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-white hover:bg-white/5 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Pin location indicator */}
      <div className="px-5 py-2.5 border-b border-white/5 bg-[#181A18]">
        {pinLocation ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">📍</span>
            <span className="text-gta-green text-xs font-medium">
              Location pinned
            </span>
            <span className="text-[#8D8D8D] text-[10px]">
              ({pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">🗺️</span>
            <span className="text-[#8D8D8D] text-xs">
              Click on the map to pin your location
            </span>
          </div>
        )}
      </div>

      {/* Form - scrollable */}
      <div className="flex-1 overflow-y-auto gta-scrollbar px-5 py-4 space-y-4">
        {/* Category */}
        <div>
          <label className="text-white text-xs font-medium mb-2 block">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => update("category", cat.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[12px] border transition-all duration-150 ${
                  form.category === cat.key
                    ? "bg-[#181A18] border-gta-green/40 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    : "bg-[#181A18] border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span
                  className={`text-xs font-medium ${
                    form.category === cat.key
                      ? "text-gta-green"
                      : "text-white/60"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Female Single Occupancy in 2BHK"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe your listing..."
            rows={3}
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors resize-none"
          />
        </div>

        {/* Images */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Photos <span className="text-[#8D8D8D]">({images.length}/5)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative w-16 h-16 rounded-[12px] overflow-hidden border border-white/5"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center text-white/70 hover:text-red-400 text-[9px]"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-16 h-16 rounded-[12px] border border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-gta-green/40 hover:bg-gta-green/5 transition-colors">
                <span className="text-[#8D8D8D] text-lg">+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-[#8D8D8D] text-[10px] mt-1.5">
            Upload up to 5 photos. First image is the cover.
          </p>
        </div>

        {/* Address */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Full address"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>

        {/* Landmark */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Landmark <span className="text-[#8D8D8D]">(optional)</span>
          </label>
          <input
            type="text"
            value={form.landmark}
            onChange={(e) => update("landmark", e.target.value)}
            placeholder="Near..."
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>

        {/* Rent & Deposit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white text-xs font-medium mb-1.5 block">
              Rent / Price
            </label>
            <input
              type="text"
              value={form.rent}
              onChange={(e) => update("rent", e.target.value)}
              placeholder="₹10,000/mo"
              className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-white text-xs font-medium mb-1.5 block">
              Deposit
            </label>
            <input
              type="text"
              value={form.deposit}
              onChange={(e) => update("deposit", e.target.value)}
              placeholder="₹20,000"
              className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
            />
          </div>
        </div>

        {/* Brokerage & Available */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white text-xs font-medium mb-1.5 block">
              Brokerage
            </label>
            <input
              type="text"
              value={form.brokerage}
              onChange={(e) => update("brokerage", e.target.value)}
              placeholder="No brokerage"
              className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-white text-xs font-medium mb-1.5 block">
              Available from
            </label>
            <input
              type="text"
              value={form.availableFrom}
              onChange={(e) => update("availableFrom", e.target.value)}
              placeholder="1st July"
              className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
            />
          </div>
        </div>

        {/* Features */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-white text-xs font-medium">Features</label>
            <button
              onClick={addFeature}
              className="text-gta-green text-xs hover:text-gta-green/80 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  placeholder={`Feature ${i + 1}`}
                  className="flex-1 bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
                />
                {form.features.length > 1 && (
                  <button
                    onClick={() => removeFeature(i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8D8D8D] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flatmate info */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Flatmate info <span className="text-[#8D8D8D]">(optional)</span>
          </label>
          <input
            type="text"
            value={form.flatmateInfo}
            onChange={(e) => update("flatmateInfo", e.target.value)}
            placeholder="e.g. Female working professional"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>

        {/* Preferences */}
        <div>
          <label className="text-white text-xs font-medium mb-1.5 block">
            Preferences <span className="text-[#8D8D8D]">(optional)</span>
          </label>
          <input
            type="text"
            value={form.preferences}
            onChange={(e) => update("preferences", e.target.value)}
            placeholder="e.g. Vegetarian, No smoking"
            className="w-full bg-[#181A18] border border-white/5 rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gta-green/40 transition-colors"
          />
        </div>
      </div>

      {/* Submit footer */}
      <div className="px-5 py-4 border-t border-white/5 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-2.5 rounded-[12px] text-sm font-medium bg-gta-green text-black hover:bg-gta-green/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Post Listing
        </button>
        <p className="text-[#8D8D8D] text-[10px] text-center mt-2">
          Interested buyers will email you at your Google address
        </p>
        {!isValid && (
          <p className="text-[#8D8D8D] text-[10px] text-center mt-2">
            {!pinLocation
              ? "Pin your location on the map"
              : "Fill in category, title, address & rent"}
          </p>
        )}
      </div>
    </div>
  );
}
